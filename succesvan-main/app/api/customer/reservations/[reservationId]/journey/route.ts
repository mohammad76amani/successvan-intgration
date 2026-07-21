import { NextRequest } from "next/server";
import connect from "@/lib/data";
import { requireAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import {
  listCustomerContracts,
  refreshContractStatus,
} from "@/lib/contracts/service";
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

    let reservation = await Reservation.findOne({
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

    let contracts = await listCustomerContracts(userId, {
      bookingId: reservationId,
    });
    let contract = contracts[0] ?? null;

    if (
      contract?.docusign?.envelopeId &&
      ["sent", "delivered", "viewed", "signing"].includes(contract.status)
    ) {
      try {
        await refreshContractStatus(contract._id, {
          actorId: userId,
          source: "customer",
        });
        contracts = await listCustomerContracts(userId, {
          bookingId: reservationId,
        });
        contract = contracts[0] ?? null;
        reservation = await Reservation.findOne({
          _id: reservationId,
          user: userId,
        })
          .populate("user", "-password")
          .populate("office")
          .populate("category")
          .populate("vehicle")
          .populate("addOns.addOn")
          .lean();
      } catch (refreshError) {
        console.log(
          "Customer journey contract refresh error:",
          refreshError instanceof Error
            ? refreshError.message
            : "Unknown error",
        );
      }
    }

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
