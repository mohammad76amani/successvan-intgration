import { NextRequest } from "next/server";
import connect from "@/lib/data";
import { requireAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import Reservation from "@/model/reservation";

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    await connect();

    const reservations = await Reservation.find({ user: userId })
      .populate("office")
      .populate("category")
      .populate("vehicle")
      .populate("addOns.addOn")
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(reservations);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : "Could not load reservations",
      500,
    );
  }
}
