import { NextRequest } from "next/server";
import connect from "@/lib/data";
import { requireAuth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/roles";
import { successResponse, errorResponse } from "@/lib/api-response";
import { createLondonDateTime, parseStorageDate } from "@/lib/englandTime";
import Reservation from "@/model/reservation";
import Vehicle from "@/model/vehicle";

const registrationPattern = (value: string) => {
  const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!normalized) return null;
  const flexible = normalized
    .split("")
    .map((character) => character.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[\\s-]*");
  return new RegExp(`^\\s*${flexible}\\s*$`, "i");
};

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!canAccessDashboard(auth.role)) {
      return errorResponse("Admin access is required", 403);
    }

    const { searchParams } = new URL(req.url);
    const vehicleNumber = searchParams.get("vehicleNumber")?.trim() || "";
    const violationDate = searchParams.get("violationDate")?.trim() || "";
    const numberPattern = registrationPattern(vehicleNumber);
    const day = parseStorageDate(violationDate);

    if (vehicleNumber && !numberPattern) {
      return errorResponse("Enter a valid vehicle registration", 400);
    }
    if (violationDate && !day) {
      return errorResponse("A valid violation date is required", 400);
    }

    await connect();
    const query: Record<string, unknown> = {
      status: { $in: ["deposit_review", "refund_processing"] },
    };

    if (day) {
      const startOfDay = new Date(createLondonDateTime(day, "00:00"));
      const endOfDay = new Date(createLondonDateTime(day, "23:59"));
      query.startDate = { $lte: endOfDay };
      query.endDate = { $gte: startOfDay };
    }

    if (numberPattern) {
      const vehicleIds = await Vehicle.find({
        number: numberPattern,
      }).distinct("_id");
      query.$or = [
        { "vehicleSnapshot.number": numberPattern },
        ...(vehicleIds.length > 0 ? [{ vehicle: { $in: vehicleIds } }] : []),
      ];
    }

    const reservations = await Reservation.find(query)
      .populate("user", "name lastName emaildata phoneData")
      .populate("vehicle", "title number color")
      .populate("office", "name address")
      .sort({ startDate: -1 })
      .lean();

    return successResponse(reservations);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : "Could not search reservations",
      500,
    );
  }
}
