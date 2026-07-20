import { NextRequest } from "next/server";
import connect from "@/lib/data";
import { requireAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { listCustomerContracts } from "@/lib/contracts/service";
import { buildReservationJourney } from "@/lib/reservation-journey";
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
    })
      .populate("user", "-password")
      .populate("office")
      .populate("category")
      .populate("vehicle")
      .populate("addOns.addOn")
      .lean();

    if (!reservation) return errorResponse("Reservation not found", 404);

    const contracts = await listCustomerContracts(userId, {
      bookingId: reservationId,
    });
    const contract = contracts[0] ?? null;

    return successResponse({
      reservation,
      contract,
      journey: buildReservationJourney(reservation as never, contract),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : "Could not load booking journey",
      500,
    );
  }
}
