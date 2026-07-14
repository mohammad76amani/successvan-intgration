import { NextRequest } from "next/server";
import connect from "@/lib/data";
import Reservation from "@/model/reservation";
import User from "@/model/user";
import { successResponse, errorResponse } from "@/lib/api-response";
import { sendStatusNotification } from "@/lib/notification-scheduler";
import { deleteImage } from "@/lib/s3";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect();
    const { id } = await params;
    const reservation = await Reservation.findById(id)
      .populate("user", "-password")
      .populate("office")
      .populate("vehicle")
      .populate("addOns.addOn");
    if (!reservation) return errorResponse("Reservation not found", 404);
    return successResponse(reservation);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect();
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    
    const oldReservation = await Reservation.findById(id);
    if (!oldReservation) return errorResponse("Reservation not found", 404);

    let updatePayload: Record<string, unknown> = body;

    if (body.userEdited === true) {
      if (oldReservation.status !== "pending") {
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
    
    const reservation = await Reservation.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    })
      .populate("user", "-password")
      .populate("office")
      .populate("category")
      .populate({
        path: "vehicle",
        select: "title number",
      })
      .populate("addOns.addOn");
    
    // Send admin edited notification if flagged
    if (body.adminEdited === true) {
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
    if (body.userEdited === true) {
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
    
    // Send status notification if status changed
    const nextStatus =
      typeof updatePayload.status === "string"
        ? updatePayload.status
        : undefined;

    if (oldReservation.status !== nextStatus && nextStatus) {
      type NotifiableStatus =
        | "confirmed"
        | "canceled"
        | "delivered"
        | "completed";
      const validStatuses: NotifiableStatus[] = [
        "confirmed",
        "canceled",
        "delivered",
        "completed",
      ];
      if (validStatuses.includes(nextStatus as NotifiableStatus)) {
        try {
          await sendStatusNotification(id, nextStatus as NotifiableStatus);
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 400);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect();
    const { id } = await params;
    const reservation = await Reservation.findByIdAndDelete(id);
    if (!reservation) return errorResponse("Reservation not found", 404);
    return successResponse({ message: "Reservation deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
