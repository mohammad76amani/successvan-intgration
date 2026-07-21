import { NextRequest } from "next/server";
import connect from "@/lib/data";
import Reservation from "@/model/reservation";
import User from "@/model/user";
import { successResponse, errorResponse } from "@/lib/api-response";
import { sendSMS } from "@/lib/sms";
import { requireAuth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/roles";
import { createContractForBooking } from "@/lib/contracts/service";
import {
  DEPOSIT_OPTIONS,
  type DepositOption,
} from "@/lib/reservation-status";

// Customer chooses how to cover the deposit and (for bank transfers)
// uploads the payment slip. The admin verifies the payment and moves the
// reservation to deposit_paid from the dashboard.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAuth(req);
    await connect();
    const { id } = await params;
    const body = (await req.json()) as {
      option?: string;
      receiptUrl?: string;
    };

    const option = body.option as DepositOption;
    if (!option || !DEPOSIT_OPTIONS.includes(option)) {
      return errorResponse(`Invalid deposit option: ${body.option}`, 400);
    }

    const reservation = await Reservation.findById(id).populate("category");
    if (!reservation) return errorResponse("Reservation not found", 404);
    if (
      !canAccessDashboard(auth.role) &&
      String(reservation.user) !== String(auth.userId)
    ) {
      return errorResponse("Forbidden", 403);
    }

    const categoryDeposit = (
      reservation.category as {
        deposit?: {
          fullPayDiscountPercent?: number;
          securePayPrice?: number;
          officePayPrice?: number;
        };
      } | null
    )?.deposit;

    const amount =
      option === "full"
        ? (reservation.totalPrice ?? 0)
        : option === "secure"
          ? (categoryDeposit?.securePayPrice ?? 0)
          : (categoryDeposit?.officePayPrice ?? 0);

    const receiptUrl =
      typeof body.receiptUrl === "string" && body.receiptUrl.trim()
        ? body.receiptUrl.trim()
        : undefined;

    // Bank-transfer options need the payment slip before we can verify.
    if (option !== "office" && !receiptUrl) {
      return errorResponse(
        "Please upload your payment receipt to continue.",
        400,
      );
    }

    reservation.deposit = {
      ...(reservation.deposit?.toObject?.() ?? reservation.deposit ?? {}),
      amount,
      option,
      method: option === "office" ? "office" : "bank_transfer",
      receiptUrl,
      receiptUploadedAt: receiptUrl ? new Date() : undefined,
      // "pending" = waiting for admin verification of the transfer.
      status: receiptUrl ? "pending" : "not_paid",
      discountPercent:
        option === "full" ? (categoryDeposit?.fullPayDiscountPercent ?? 0) : 0,
    };

    if (receiptUrl && ["confirmed", "deposit_pending"].includes(reservation.status)) {
      reservation.status = "deposit_pending";
      reservation.statusHistory = [
        ...(reservation.statusHistory || []),
        {
          status: "deposit_pending",
          changedAt: new Date(),
          source: "customer",
          note: "Customer uploaded deposit receipt. Admin verification required.",
        },
      ];
    }
    await reservation.save();

    // Let the admins know a deposit needs verification.
    if (receiptUrl) {
      try {
        const admins = await User.find({ role: "admin" });
        for (const admin of admins) {
          if (admin.phoneData?.phoneNumber) {
            try {
              await sendSMS(
                admin.phoneData.phoneNumber.replace("+", ""),
                `Deposit receipt uploaded for reservation ${reservation.reservationCode || id}. Verify in the admin dashboard.`,
              );
            } catch (smsError) {
              console.log("Admin deposit SMS error:", smsError);
            }
          }
        }
      } catch (error) {
        console.log(
          "Deposit admin notification error:",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAuth(req);
    if (!canAccessDashboard(auth.role)) {
      return errorResponse("Admin access is required", 403);
    }

    const { id } = await params;
    const body = (await req.json()) as {
      action?: "approve" | "reject";
      transactionRef?: string;
      failureReason?: string;
    };
    if (body.action !== "approve" && body.action !== "reject") {
      return errorResponse("Action must be approve or reject", 400);
    }

    await connect();
    const reservation = await Reservation.findById(id);
    if (!reservation) return errorResponse("Reservation not found", 404);
    if (reservation.deposit?.status !== "pending") {
      return errorResponse("This deposit is not awaiting verification", 409);
    }

    const now = new Date();
    if (body.action === "approve") {
      reservation.deposit.status = "paid";
      reservation.deposit.paidAt = now;
      reservation.deposit.verifiedAt = now;
      reservation.deposit.verifiedBy = auth.userId as never;
      reservation.deposit.failureReason = undefined;
      if (body.transactionRef?.trim()) {
        reservation.deposit.transactionRef = body.transactionRef.trim();
      }
      if (["confirmed", "deposit_pending"].includes(reservation.status)) {
        reservation.status = "deposit_paid";
        reservation.statusHistory.push({
          status: "deposit_paid",
          changedAt: now,
          source: "admin",
          note: "Deposit receipt verified",
        });
      }
    } else {
      reservation.deposit.status = "failed";
      reservation.deposit.verifiedAt = now;
      reservation.deposit.verifiedBy = auth.userId as never;
      reservation.deposit.failureReason =
        body.failureReason?.trim() || "Payment receipt could not be verified";
      if (reservation.status === "confirmed") {
        reservation.status = "deposit_pending";
      }
      reservation.statusHistory.push({
        status: "deposit_pending",
        changedAt: now,
        source: "admin",
        note: reservation.deposit.failureReason,
      });
    }

    await reservation.save();

    if (body.action === "approve") {
      try {
        await createContractForBooking(
          id,
          { actorId: auth.userId, source: "admin" },
          true,
        );

        const latestReservation = await Reservation.findById(id);
        if (
          latestReservation &&
          ["deposit_paid", "contract_pending"].includes(latestReservation.status)
        ) {
          latestReservation.status = "contract_pending";
          latestReservation.statusHistory.push({
            status: "contract_pending",
            changedAt: new Date(),
            source: "system",
            note: "Rental agreement created and sent for customer signature.",
          });
          await latestReservation.save();
          return successResponse(latestReservation);
        }
      } catch (contractError) {
        console.error(
          "Automatic contract creation failed:",
          contractError instanceof Error
            ? contractError.message
            : "Unknown contract error",
        );
        reservation.statusHistory.push({
          status: "deposit_paid",
          changedAt: new Date(),
          source: "system",
          note: "Deposit verified, but automatic contract creation needs admin attention.",
        });
        await reservation.save();
      }
    }

    return successResponse(reservation);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : "Could not verify deposit",
      500,
    );
  }
}
