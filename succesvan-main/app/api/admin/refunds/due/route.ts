import { NextRequest } from "next/server";
import connect from "@/lib/data";
import { requireAuth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/roles";
import { successResponse, errorResponse } from "@/lib/api-response";
import Reservation from "@/model/reservation";
import User from "@/model/user";
import Vehicle from "@/model/vehicle";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!canAccessDashboard(auth.role)) {
      return errorResponse("Admin access is required", 403);
    }

    await connect();
    const now = new Date();
    const includeAll = req.nextUrl.searchParams.get("all") === "true";
    const query: Record<string, unknown> = {
      status: "refund_processing",
      "refund.status": { $in: ["approved", "processing"] },
    };

    if (!includeAll) {
      query["refund.expectedBy"] = { $lte: now };
    }

    const reservations = await Reservation.find(query)
      .populate({
        path: "user",
        model: User,
        select: "name lastName phoneData emaildata",
      })
      .populate({
        path: "vehicle",
        model: Vehicle,
        select: "title make number keyNumber color",
      })
      .lean();

    reservations.sort((first, second) => {
      const firstDue = first.refund?.expectedBy
        ? new Date(first.refund.expectedBy).getTime()
        : Number.POSITIVE_INFINITY;
      const secondDue = second.refund?.expectedBy
        ? new Date(second.refund.expectedBy).getTime()
        : Number.POSITIVE_INFINITY;

      if (firstDue !== secondDue) return firstDue - secondDue;

      const firstCreated = new Date(
        first.refund?.approvedAt || first.updatedAt || first.createdAt || 0,
      ).getTime();
      const secondCreated = new Date(
        second.refund?.approvedAt || second.updatedAt || second.createdAt || 0,
      ).getTime();
      return firstCreated - secondCreated;
    });

    const totalRefundAmount = reservations.reduce(
      (total, reservation) =>
        total + Number(reservation.refund?.refundAmount || 0),
      0,
    );
    const totalDepositAmount = reservations.reduce(
      (total, reservation) =>
        total + Number(reservation.refund?.depositPaid || 0),
      0,
    );
    const totalDeductions = reservations.reduce(
      (total, reservation) =>
        total + Number(reservation.refund?.deductionsTotal || 0),
      0,
    );

    return successResponse({
      reservations,
      count: reservations.length,
      totalRefundAmount,
      totalDepositAmount,
      totalDeductions,
      generatedAt: now,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : "Could not load due refunds",
      500,
    );
  }
}
