import { NextRequest } from "next/server";
import connect from "@/lib/data";
import { requireAuth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/roles";
import { successResponse, errorResponse } from "@/lib/api-response";
import Reservation from "@/model/reservation";
import {
  cancelRefundDueOwnerNotifications,
  scheduleRefundDueOwnerNotifications,
} from "@/lib/notification-scheduler";
import { createLondonDateTime, parseStorageDate } from "@/lib/englandTime";
import Vehicle from "@/model/vehicle";

const money = (value: unknown) => Math.max(0, Number(value) || 0);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAuth(req);
    if (!canAccessDashboard(auth.role)) {
      return errorResponse("Admin access is required", 403);
    }
    const { id } = await params;
    const body = await req.json();
    if (!["review", "approve", "complete"].includes(body.action)) {
      return errorResponse("Invalid refund action", 400);
    }

    await connect();
    const existing = await Reservation.findById(id);
    if (!existing) return errorResponse("Reservation not found", 404);

    const charges = {
      fuel: money(body.charges?.fuel),
      late: money(body.charges?.late),
      damage: money(body.charges?.damage),
      cleaning: money(body.charges?.cleaning),
      missingEquipment: money(body.charges?.missingEquipment),
      other: money(body.charges?.other),
    };
    const deductionsTotal = Object.values(charges).reduce(
      (total, charge) => total + charge,
      0,
    );
    const depositPaid = money(existing.refund?.depositPaid ?? existing.deposit?.amount);
    const refundAmount = Math.max(0, depositPaid - deductionsTotal);
    const now = new Date();
    const status =
      body.action === "complete"
        ? "completed"
        : body.action === "approve"
          ? "approved"
          : "under_review";
    const reservationStatus =
      body.action === "complete"
        ? "completed"
        : body.action === "approve"
          ? "refund_processing"
          : "deposit_review";

    if (body.action === "complete" && !String(body.reference || "").trim()) {
      return errorResponse("Refund reference is required", 400);
    }

    let expectedBy = existing.refund?.expectedBy;
    if (body.action === "approve") {
      const expectedDay = parseStorageDate(String(body.expectedBy || ""));
      if (!expectedDay) {
        return errorResponse("Expected refund date is required", 400);
      }
      expectedBy = new Date(createLondonDateTime(expectedDay, "23:59"));
    }

    const reservation = await Reservation.findByIdAndUpdate(
      id,
      {
        $set: {
          status: reservationStatus,
          refund: {
            depositPaid,
            charges,
            deductionsTotal,
            refundAmount,
            status,
            chargeReason: String(body.chargeReason || "").trim(),
            otherChargeReason: String(body.otherChargeReason || "").trim(),
            evidence: Array.isArray(body.evidence)
              ? body.evidence.filter(Boolean)
              : [],
            reference: String(body.reference || "").trim(),
            expectedBy,
            approvedAt: body.action === "approve" ? now : existing.refund?.approvedAt,
            processedAt: body.action === "complete" ? now : undefined,
          },
        },
        $push: {
          statusHistory: {
            status: reservationStatus,
            changedAt: now,
            source: "admin",
            note:
              body.action === "complete"
                ? "Refund completed"
                : body.action === "approve"
                  ? "Refund approved and processing"
                  : "Deposit deductions reviewed",
          },
        },
      },
      { new: true, runValidators: true },
    );

    if (!reservation) return errorResponse("Reservation not found", 404);

    if (body.action === "approve") {
      await scheduleRefundDueOwnerNotifications(id);
    } else if (body.action === "complete") {
      const linkedVehicleId =
        existing.vehicle || existing.vehicleSnapshot?.vehicleId;
      if (linkedVehicleId) {
        await Vehicle.findByIdAndUpdate(linkedVehicleId, {
          $set: { available: true },
          $unset: { reservation: 1 },
        });
      }
      await cancelRefundDueOwnerNotifications(id);
    }

    return successResponse(reservation);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : "Could not update refund",
      500,
    );
  }
}
