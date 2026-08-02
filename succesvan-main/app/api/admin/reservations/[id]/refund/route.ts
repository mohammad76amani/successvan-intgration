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
      other: 0,
    };
    const submittedAdditionalCharges = Array.isArray(body.additionalCharges)
      ? body.additionalCharges
      : [];
    if (submittedAdditionalCharges.length > 50) {
      return errorResponse("A maximum of 50 additional deductions is allowed", 400);
    }
    const additionalCharges = submittedAdditionalCharges.map(
      (item: { amount?: unknown; reason?: unknown }) => ({
        amount: money(item?.amount),
        reason: String(item?.reason || "").trim(),
      }),
    );
    if (
      additionalCharges.some(
        (item: { amount: number; reason: string }) =>
          item.amount <= 0 || !item.reason || item.reason.length > 300,
      )
    ) {
      return errorResponse(
        "Each additional deduction needs a positive amount and a reason of 300 characters or fewer",
        400,
      );
    }
    const fixedDeductions = Object.values(charges).reduce(
      (total, charge) => total + charge,
      0,
    );
    const deductionsTotal = additionalCharges.reduce(
      (total: number, charge: { amount: number }) => total + charge.amount,
      fixedDeductions,
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

    // Save nested refund values explicitly. Replacing the whole refund object
    // can discard newly introduced fields when an older/partial subdocument is
    // loaded, which previously caused additional deduction rows to disappear.
    existing.set("status", reservationStatus);
    existing.set("refund.depositPaid", depositPaid);
    existing.set("refund.charges", charges);
    existing.set("refund.additionalCharges", additionalCharges);
    existing.set("refund.deductionsTotal", deductionsTotal);
    existing.set("refund.refundAmount", refundAmount);
    existing.set("refund.status", status);
    existing.set(
      "refund.chargeReason",
      String(body.chargeReason || "").trim(),
    );
    existing.set("refund.otherChargeReason", "");
    existing.set(
      "refund.evidence",
      Array.isArray(body.evidence) ? body.evidence.filter(Boolean) : [],
    );
    existing.set("refund.reference", String(body.reference || "").trim());
    existing.set("refund.expectedBy", expectedBy);
    if (body.action === "approve") {
      existing.set("refund.approvedAt", now);
    }
    if (body.action === "complete") {
      existing.set("refund.processedAt", now);
    }
    existing.statusHistory.push({
      status: reservationStatus,
      changedAt: now,
      source: "admin",
      note:
        body.action === "complete"
          ? "Refund completed"
          : body.action === "approve"
            ? "Refund approved and processing"
            : "Deposit deductions reviewed",
    });
    existing.markModified("refund.additionalCharges");
    const reservation = await existing.save();

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
