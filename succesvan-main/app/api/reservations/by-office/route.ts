import { NextRequest } from "next/server";
import connect from "@/lib/data";
import Reservation from "@/model/reservation";
import { successResponse, errorResponse } from "@/lib/api-response";
import office from "@/model/office";

type ReservationSlotSource = {
  _id: { toString: () => string } | string;
  startDate: Date | string;
  endDate: Date | string;
  startDateDisplay?: string;
  endDateDisplay?: string;
  pickupTime?: string;
  returnTime?: string;
};

const formatDateForSlot = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTimeForSlot = (date: Date) => {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
};

export async function GET(req: NextRequest) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const officeId = searchParams.get("office");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const excludeReservation = searchParams.get("excludeReservation");

    if (!officeId) return errorResponse("Office ID is required", 400);

    const query: Record<string, unknown> = { office: officeId };
    if (excludeReservation) {
      query._id = { $ne: excludeReservation };
    }

    if (type === "start" && startDate) {
      const date = new Date(startDate);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      query.$or = [
        { startDate: { $gte: dayStart, $lte: dayEnd } },
        { startDateDisplay: startDate },
      ];
    } else if (type === "end" && endDate) {
      const date = new Date(endDate);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      query.$or = [
        { endDate: { $gte: dayStart, $lte: dayEnd } },
        { endDateDisplay: endDate },
      ];
    } else if (startDate) {
      const date = new Date(startDate);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      query.$or = [
        { startDate: { $gte: dayStart, $lte: dayEnd } },
        { endDate: { $gte: dayStart, $lte: dayEnd } },
        { startDate: { $lt: dayStart }, endDate: { $gt: dayEnd } },
      ];
    }

    const reservations = await Reservation.find(query).populate({
      path: "office",
      model: office,
    });

    const reservedSlots = reservations.map((r: ReservationSlotSource) => {
      const resStart = new Date(r.startDate);
      const resEnd = new Date(r.endDate);
      const startDateDisplay = r.startDateDisplay || formatDateForSlot(resStart);
      const endDateDisplay = r.endDateDisplay || formatDateForSlot(resEnd);
      const isSameDay = startDateDisplay === endDateDisplay;

      return {
        reservationId: r._id.toString(),
        startDate: startDateDisplay,
        endDate: endDateDisplay,
        startTime: r.pickupTime || formatTimeForSlot(resStart),
        endTime: r.returnTime || formatTimeForSlot(resEnd),
        isSameDay,
      };
    });

    return successResponse({ reservations, reservedSlots });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
