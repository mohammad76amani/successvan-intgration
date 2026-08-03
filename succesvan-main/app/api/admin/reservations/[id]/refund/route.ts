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
    if (
      !["review", "approve", "complete", "add_deduction"].includes(body.action)
    ) {
      return errorResponse("Invalid refund action", 400);
    }

    await connect();
    const existing = await Reservation.findById(id);
    if (!existing) return errorResponse("Reservation not found", 404);

    if (body.action === "add_deduction") {
      if (!["deposit_review", "refund_processing"].includes(existing.status)) {
        return errorResponse(
          "Traffic deductions can only be added during deposit review or refund processing",
          409,
        );
      }

      const amount = money(body.amount);
      const ticketReference = String(body.ticketReference || "")
        .trim()
        .toUpperCase();
      const reason = String(body.reason || "").trim();
      const vehicleNumber = String(body.vehicleNumber || "")
        .trim()
        .toUpperCase();
      const violationDate = String(body.violationDate || "").trim();
      const violationDay = parseStorageDate(violationDate);
      if (amount <= 0)
        return errorResponse("A positive amount is required", 400);
      if (ticketReference.length < 3 || ticketReference.length > 80) {
        return errorResponse(
          "A valid ticket or PCN reference is required",
          400,
        );
      }
      if (!reason) return errorResponse("A reason is required", 400);
      if (!violationDay) {
        return errorResponse("A valid violation date is required", 400);
      }

      const violationStart = new Date(
        createLondonDateTime(violationDay, "00:00"),
      );
      const violationEnd = new Date(
        createLondonDateTime(violationDay, "23:59"),
      );
      if (
        new Date(existing.startDate) > violationEnd ||
        new Date(existing.endDate) < violationStart
      ) {
        return errorResponse(
          "The violation date is outside this reservation's rental period",
          409,
        );
      }

      let reservationVehicleNumber = String(
        existing.vehicleSnapshot?.number || "",
      ).trim();
      if (!reservationVehicleNumber && existing.vehicle) {
        const linkedVehicle = await Vehicle.findById(existing.vehicle)
          .select("number")
          .lean<{ number?: string }>();
        reservationVehicleNumber = String(linkedVehicle?.number || "").trim();
      }
      const normalizeRegistration = (value: string) =>
        value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (
        !reservationVehicleNumber ||
        normalizeRegistration(reservationVehicleNumber) !==
          normalizeRegistration(vehicleNumber)
      ) {
        return errorResponse(
          "The vehicle registration does not match this reservation",
          409,
        );
      }

      const savedReason = `Traffic violation · ${vehicleNumber} · ${violationDate} · Ticket ${ticketReference} · ${reason}`;
      if (savedReason.length > 300) {
        return errorResponse("The deduction reason is too long", 400);
      }

      const additionalCharges = [
        ...(existing.refund?.additionalCharges || []).map(
          (charge: { amount?: unknown; reason?: unknown }) => ({
            amount: money(charge.amount),
            reason: String(charge.reason || "").trim(),
          }),
        ),
      ];
      const normalizeTicketText = (value: string) =>
        value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const normalizedTicketReference = normalizeTicketText(ticketReference);
      const duplicate = additionalCharges.some(
        (charge: { reason: string }) =>
          charge.reason.toLowerCase().startsWith("traffic violation") &&
          normalizeTicketText(charge.reason).includes(
            normalizedTicketReference,
          ),
      );
      if (duplicate) {
        return errorResponse(
          "This traffic deduction has already been added",
          409,
        );
      }
      additionalCharges.push({ amount, reason: savedReason });

      const savedCharges = (existing.refund?.charges?.toObject?.() ||
        existing.refund?.charges ||
        {}) as Record<string, unknown>;
      const fixedDeductions = Object.values(savedCharges).reduce<number>(
        (total, charge) => total + money(charge),
        0,
      );
      const deductionsTotal = additionalCharges.reduce(
        (total: number, charge: { amount: number }) => total + charge.amount,
        fixedDeductions,
      );
      const depositPaid = money(
        existing.refund?.depositPaid ?? existing.deposit?.amount,
      );

      existing.set("refund.depositPaid", depositPaid);
      existing.set("refund.additionalCharges", additionalCharges);
      existing.set("refund.deductionsTotal", deductionsTotal);
      existing.set(
        "refund.refundAmount",
        Math.max(0, depositPaid - deductionsTotal),
      );
      existing.statusHistory.push({
        status: existing.status,
        changedAt: new Date(),
        source: "admin",
        note: `${savedReason} (£${amount.toFixed(2)})`,
      });
      existing.markModified("refund.additionalCharges");
      return successResponse(await existing.save());
    }

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
      return errorResponse(
        "A maximum of 50 additional deductions is allowed",
        400,
      );
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
    const depositPaid = money(
      existing.refund?.depositPaid ?? existing.deposit?.amount,
    );
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
    existing.set("refund.chargeReason", String(body.chargeReason || "").trim());
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
      const linkedVehicleId =
        existing.vehicle || existing.vehicleSnapshot?.vehicleId;
      if (linkedVehicleId) {
        await Vehicle.findByIdAndUpdate(linkedVehicleId, {
          $set: { available: true },
          $unset: { reservation: 1 },
        });
      }
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
