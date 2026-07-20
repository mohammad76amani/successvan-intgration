import { NextRequest } from "next/server";
import connect from "@/lib/data";
import { requireAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import Reservation from "@/model/reservation";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reservationId: string }> },
) {
  try {
    const { userId } = requireAuth(req);
    const { reservationId } = await params;
    await connect();

    const reservation = await Reservation.findOne({
      _id: reservationId,
      user: userId,
    }).select("statusHistory");

    if (!reservation) return errorResponse("Reservation not found", 404);
    return successResponse(reservation.statusHistory ?? []);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : "Could not load timeline",
      500,
    );
  }
}
