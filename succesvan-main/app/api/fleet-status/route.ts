import connect from "@/lib/data";
import Vehicle from "@/model/vehicle";
import Reservation from "@/model/reservation";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    await connect();

    const totalVehicles = await Vehicle.countDocuments();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const inUseCount = await Reservation.countDocuments({
      status: "delivered",
      startDate: { $lt: tomorrow },
      endDate: { $gte: today },
    });

    const maintenanceCount = await Vehicle.countDocuments({
      needsService: true,
    });

    const available = Math.max(
      0,
      totalVehicles - inUseCount - maintenanceCount,
    );

    const todaysPickups = await Reservation.find({
      startDate: {
        $gte: today,
        $lt: tomorrow,
      },
      status: {
        $in: ["pending", "confirmed"],
      },
    })
      .populate({
        path: "vehicle",
        select: "title number keyNumber",
      })
      .populate({
        path: "category",
        select: "name",
      })
      .sort({ startDate: 1 })
      .lean();

    const todaysReturns = await Reservation.find({
      endDate: {
        $gte: today,
        $lt: tomorrow,
      },
      status: {
        $in: ["pending", "confirmed", "delivered"],
      },
    })
      .populate({
        path: "vehicle",
        select: "title number keyNumber",
      })
      .populate({
        path: "category",
        select: "name",
      })
      .sort({ endDate: 1 })
      .lean();

    return successResponse({
      fleet: {
        available,
        inUse: inUseCount,
        maintenance: maintenanceCount,
        total: totalVehicles,
      },
      today: {
        pickups: todaysPickups,
        returns: todaysReturns,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return errorResponse(message, 500);
  }
}