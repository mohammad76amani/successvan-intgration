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
    const reservations = await Reservation.find({
      status: "refund_processing",
      "refund.status": { $in: ["approved", "processing"] },
      "refund.expectedBy": { $lte: now },
    })
      .populate({
        path: "user",
        model: User,
        select: "name lastName phoneData",
      })
      .populate({
        path: "vehicle",
        model: Vehicle,
        select: "title number keyNumber color",
      })
      .sort({ "refund.expectedBy": 1 })
      .lean();

    const totalRefundAmount = reservations.reduce(
      (total, reservation) =>
        total + Number(reservation.refund?.refundAmount || 0),
      0,
    );

    return successResponse({
      reservations,
      count: reservations.length,
      totalRefundAmount,
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
