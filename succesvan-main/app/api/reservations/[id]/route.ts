import { NextRequest } from "next/server";
import connect from "@/lib/data";
import Reservation from "@/model/reservation";
import User from "@/model/user";
import { successResponse, errorResponse } from "@/lib/api-response";
import { sendStatusNotification } from "@/lib/notification-scheduler";
import { sendSMS } from "@/lib/sms";
import { deleteImage } from "@/lib/s3";
import { requireAuth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/roles";
import { createContractForBooking } from "@/lib/contracts/service";
import Vehicle from "@/model/vehicle";
import {
  normalizeReservationStatus,
  CUSTOMER_CANCELABLE_STATUSES,
  NOTIFIABLE_STATUS_MAP,
} from "@/lib/reservation-status";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(req);
    await connect();
    const { id } = await params;
    const reservation = await Reservation.findById(id)
      .populate("user", "-password")
      .populate("office")
      .populate("category")
      .populate("vehicle")
      .populate("addOns.addOn");
    if (!reservation) return errorResponse("Reservation not found", 404);
    const ownerId =
      typeof reservation.user === "object" && reservation.user?._id
        ? reservation.user._id
        : reservation.user;
    if (!canAccessDashboard(auth.role) && String(ownerId) !== String(auth.userId)) {
      return errorResponse("Forbidden", 403);
    }
    return successResponse(reservation);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(req);
    await connect();
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    
    const oldReservation = await Reservation.findById(id);
    if (!oldReservation) return errorResponse("Reservation not found", 404);
    const isCustomerRequest = !canAccessDashboard(auth.role);
    if (
      isCustomerRequest &&
      String(oldReservation.user) !== String(auth.userId)
    ) {
      return errorResponse("Forbidden", 403);
    }

    // Normalize/validate the requested status against the journey enum.
    if (body.status !== undefined) {
      const normalized = normalizeReservationStatus(body.status);
      if (!normalized) {
        return errorResponse(`Invalid reservation status: ${body.status}`, 400);
      }
      body.status = normalized;
    }

    // Completing/canceling releases the fleet vehicle, but the reservation
    // keeps its reference as permanent booking history.
    if (
      ["completed", "canceled", "expired"].includes(String(body.status)) &&
      body.vehicle === null
    ) {
      delete body.vehicle;
    }

    if (
      !isCustomerRequest &&
      typeof body.vehicle === "string" &&
      body.vehicle.trim() &&
      String(body.vehicle) !== String(oldReservation.vehicle || "")
    ) {
      const assignedVehicle = await Vehicle.findById(body.vehicle).select(
        "title number keyNumber color",
      );
      if (!assignedVehicle) {
        return errorResponse("Vehicle not found", 404);
      }
      body.vehicleSnapshot = {
        vehicleId: assignedVehicle._id,
        title: assignedVehicle.title,
        number: assignedVehicle.number,
        keyNumber: assignedVehicle.keyNumber,
        color: assignedVehicle.color,
        assignedAt: new Date(),
      };
    }

    const adminAssignedVehicle =
      !isCustomerRequest &&
      typeof body.vehicle === "string" &&
      body.vehicle.trim() &&
      String(body.vehicle) !== String(oldReservation.vehicle || "");

    // This remains true when retrying contract generation for a vehicle that
    // was already selected by an earlier failed DocuSign request.
    const adminRequestedContractGeneration =
      !isCustomerRequest &&
      body.status === "contract_pending" &&
      typeof body.vehicle === "string" &&
      Boolean(body.vehicle.trim());

    const depositAllowsVehicleAssignment =
      oldReservation.status === "deposit_paid" ||
      oldReservation.deposit?.status === "paid" ||
      oldReservation.deposit?.option === "office";

    if (
      (adminAssignedVehicle || adminRequestedContractGeneration) &&
      !depositAllowsVehicleAssignment
    ) {
      return errorResponse(
        "The deposit must be verified, or the customer must choose pay at office, before assigning a vehicle.",
        409,
      );
    }

    if (
      (adminAssignedVehicle || adminRequestedContractGeneration) &&
      (body.status === "delivered" || body.status === "contract_pending") &&
      [
        "pending",
        "confirmed",
        "deposit_pending",
        "deposit_paid",
        "contract_pending",
      ].includes(oldReservation.status)
    ) {
      // Contract status is applied only after contract creation succeeds.
      // Keeping the current status here prevents a failed request from
      // jumping directly to the signing step.
      body.status = oldReservation.status;
    }

    let updatePayload: Record<string, unknown> = body;

    if (isCustomerRequest) {
      if (!CUSTOMER_CANCELABLE_STATUSES.includes(oldReservation.status)) {
        return errorResponse(
          "Only pending reservations can be edited from the customer dashboard.",
          403,
        );
      }

      if (typeof body.status === "string" && body.status !== "canceled") {
        return errorResponse(
          "Customers can only cancel pending reservations from the customer dashboard.",
          403,
        );
      }

      const allowedCustomerFields = [
        "startDate",
        "endDate",
        "startDateDisplay",
        "endDateDisplay",
        "pickupTime",
        "returnTime",
        "totalPrice",
        "addOns",
        "selectedGear",
        "pickupExtensionPrice",
        "returnExtensionPrice",
        "status",
      ] as const;

      updatePayload = allowedCustomerFields.reduce<Record<string, unknown>>(
        (payload, field) => {
          if (Object.prototype.hasOwnProperty.call(body, field)) {
            payload[field] = body[field];
          }
          return payload;
        },
        {},
      );
    }
    
    // Record the status change in the journey timeline.
    const requestedStatus =
      typeof updatePayload.status === "string" ? updatePayload.status : undefined;
    let updateDoc: Record<string, unknown> = updatePayload;
    if (requestedStatus && requestedStatus !== oldReservation.status) {
      const fields = { ...updatePayload };
      delete fields.userEdited;
      updateDoc = {
        ...fields,
        $push: {
          statusHistory: {
            status: requestedStatus,
            changedAt: new Date(),
            source: isCustomerRequest ? "customer" : "admin",
            note:
              requestedStatus === "canceled" &&
              typeof updatePayload.cancelReason === "string"
                ? updatePayload.cancelReason
                : undefined,
          },
        },
      };
    }

    const reservation = await Reservation.findByIdAndUpdate(id, updateDoc, {
      new: true,
      runValidators: true,
    })
      .populate("user", "-password")
      .populate("office")
      .populate("category")
      .populate({
        path: "vehicle",
        select: "title number keyNumber color",
      })
      .populate("addOns.addOn");

    if (!reservation) return errorResponse("Reservation not found", 404);

    if (
      requestedStatus &&
      ["completed", "canceled", "expired"].includes(requestedStatus) &&
      oldReservation.vehicle
    ) {
      await Vehicle.findByIdAndUpdate(oldReservation.vehicle, {
        $set: { available: true },
        $unset: { reservation: 1 },
      });
    }
    
    // Send admin edited notification if flagged
    if (!isCustomerRequest && body.adminEdited === true) {
      try {
        const { sendReservationEditedNotification } = await import("@/lib/notification-scheduler");
        await sendReservationEditedNotification(id);
      } catch (error) {
        console.log(
          "Admin edit notification error:",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
    
    // Send SMS to admin if user edited
    if (isCustomerRequest) {
      try {
        const User = (await import("@/model/user")).default;
        const admins = await User.find({ role: "admin" });
        const { sendSMS } = await import("@/lib/sms");
        
        const customer = reservation.user as
          | { phoneData?: { phoneNumber?: string } }
          | undefined;
        const customerPhone = customer?.phoneData?.phoneNumber || "Unknown";
        
        for (const admin of admins) {
          if (admin.phoneData?.phoneNumber) {
            try {
              await sendSMS(
                admin.phoneData.phoneNumber.replace("+", ""),
                `Customer ${customerPhone} edited reservation. Check dashboard. SuccessVanHire.co.uk`
              );
            } catch (smsError) {
              console.log(`Admin SMS Error (${admin.phoneData.phoneNumber}):`, smsError);
            }
          }
        }
      } catch (error) {
        console.log(
          "User edit admin notification error:",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
    
    // Send status notification if status changed. New journey statuses map
    // onto the four legacy SMS messages via NOTIFIABLE_STATUS_MAP; statuses
    // without a mapping stay silent.
    const nextStatus = requestedStatus;

    const adminMarkedDepositPaid =
      !isCustomerRequest &&
      (requestedStatus === "deposit_paid" ||
        (typeof body.deposit === "object" &&
          body.deposit !== null &&
          (body.deposit as { status?: unknown }).status === "paid" &&
          oldReservation.deposit?.status !== "paid"));

    if (adminMarkedDepositPaid) {
      const depositPaidAt = new Date();
      const reservationForDeposit = await Reservation.findById(id);

      if (
        reservationForDeposit &&
        ["confirmed", "deposit_pending", "deposit_paid"].includes(
          reservationForDeposit.status,
        )
      ) {
        reservationForDeposit.deposit = {
          ...(reservationForDeposit.deposit?.toObject?.() ??
            reservationForDeposit.deposit ??
            {}),
          amount:
            reservationForDeposit.deposit?.amount ??
            reservationForDeposit.totalPrice,
          status: "paid",
          paidAt: reservationForDeposit.deposit?.paidAt ?? depositPaidAt,
          verifiedAt:
            reservationForDeposit.deposit?.verifiedAt ?? depositPaidAt,
          verifiedBy:
            reservationForDeposit.deposit?.verifiedBy ??
            (auth.userId as never),
        };

        await reservationForDeposit.save();
      }
    }

    const depositIsPaidForContract =
      depositAllowsVehicleAssignment || adminMarkedDepositPaid;

    if (
      adminRequestedContractGeneration &&
      depositIsPaidForContract &&
      ["confirmed", "deposit_pending", "deposit_paid", "contract_pending"].includes(
        reservation.status,
      )
    ) {
      try {
        await createContractForBooking(
          id,
          { actorId: auth.userId, source: "admin" },
          true,
          { recreateEnvelope: true },
        );

        const latestReservation = await Reservation.findById(id)
          .populate("user", "-password")
          .populate("office")
          .populate("category")
          .populate({
            path: "vehicle",
            select: "title number keyNumber color",
          })
          .populate("addOns.addOn");

        if (latestReservation) {
          latestReservation.status = "contract_pending";
          latestReservation.statusHistory.push({
            status: "contract_pending",
            changedAt: new Date(),
            source: "system",
            note: "Vehicle assigned. Rental agreement created and sent for customer signature.",
          });
          await latestReservation.save();

          const customer = latestReservation.user as
            | {
                phoneData?: { phoneNumber?: string };
                name?: string;
              }
            | undefined;
          const phoneNumber = customer?.phoneData?.phoneNumber;
          if (phoneNumber) {
            const siteUrl = (
              process.env.NEXT_PUBLIC_SITE_URL ||
              process.env.APP_URL ||
              "https://successvanhire.co.uk"
            ).replace(/\/$/, "");
            await sendSMS(
              phoneNumber.replace("+", ""),
              `Your Success Van Hire rental agreement is ready to sign via DocuSign. Sign in your dashboard: ${siteUrl}/customerDashboard#reserves`,
            );
          }

          return successResponse(latestReservation);
        }
      } catch (contractError) {
        const contractErrorMessage =
          contractError instanceof Error
            ? contractError.message
            : "Unknown contract error";
        console.error(
          "Automatic contract creation after vehicle assignment failed:",
          contractErrorMessage,
        );
        const reservationForContract = await Reservation.findById(id);
        if (reservationForContract) {
          reservationForContract.statusHistory.push({
            status: "deposit_paid",
            changedAt: new Date(),
            source: "system",
            note: "Vehicle assigned, but automatic contract creation needs admin attention.",
          });
          await reservationForContract.save();
        }

        // Do not report a successful assignment/contract step when DocuSign
        // rejected the envelope. The same action can safely retry because the
        // contract service reuses the generated contract document.
        return errorResponse(
          `Vehicle assigned, but contract generation failed: ${contractErrorMessage}`,
          502,
        );
      }
    }

    if (oldReservation.status !== nextStatus && nextStatus) {
      // Admin confirmation now moves a pending reservation straight into the
      // deposit step. Keep sending the existing booking-confirmed message.
      const notifiable =
        oldReservation.status === "pending" && nextStatus === "deposit_pending"
          ? "confirmed"
          : NOTIFIABLE_STATUS_MAP[
              nextStatus as keyof typeof NOTIFIABLE_STATUS_MAP
            ];
      if (notifiable) {
        try {
          await sendStatusNotification(id, notifiable);
        } catch (error) {
          console.log(
            "Status notification error:",
            error instanceof Error ? error.message : "Unknown error"
          );
        }
      }
    }
    
    // Delete user license from S3 and database when reservation is completed
    if (nextStatus === "completed" && oldReservation.status !== "completed") {
      try {
        const user = await User.findById(reservation.user);
        if (user?.licenceAttached?.front || user?.licenceAttached?.back) {
          // Extract S3 key from URL
          const extractS3Key = (url: string) => {
            try {
              const urlObj = new URL(url);
              return urlObj.pathname.substring(1);
            } catch {
              return null;
            }
          };

          // Delete front license from S3
          if (user.licenceAttached.front) {
            const frontKey = extractS3Key(user.licenceAttached.front);
            if (frontKey) {
              try {
                await deleteImage(frontKey);
              } catch (error) {
                console.log(
                  "Error deleting front licence from S3:",
                  error instanceof Error ? error.message : "Unknown error"
                );
              }
            }
          }

          // Delete back license from S3
          if (user.licenceAttached.back) {
            const backKey = extractS3Key(user.licenceAttached.back);
            if (backKey) {
              try {
                await deleteImage(backKey);
              } catch (error) {
                console.log(
                  "Error deleting back licence from S3:",
                  error instanceof Error ? error.message : "Unknown error"
                );
              }
            }
          }

          // Delete license from database
          await User.findByIdAndUpdate(
            reservation.user,
            { licenceAttached: { front: undefined, back: undefined } },
            { new: true }
          );

          console.log(
            `Licence deleted for user ${reservation.user} after reservation completion`
          );
        }
      } catch (error) {
        console.log(
          "Licence deletion error:",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
    
    return successResponse(reservation);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 400);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(req);
    if (!canAccessDashboard(auth.role)) {
      return errorResponse("Admin access is required", 403);
    }
    await connect();
    const { id } = await params;
    const reservation = await Reservation.findByIdAndDelete(id);
    if (!reservation) return errorResponse("Reservation not found", 404);
    return successResponse({ message: "Reservation deleted" });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
