import connect from "@/lib/data";
import Vehicle from "@/model/vehicle";
import Office from "@/model/office";
import Reservation from "@/model/reservation";
import Category from "@/model/category";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    await connect();

    const [vehicleCount, officeCount, reservationCount, categoryCount] =
      await Promise.all([
        Vehicle.countDocuments(),
        Office.countDocuments(),
        Reservation.countDocuments(),
        Category.countDocuments(),
      ]);

    return successResponse({
      vehicles: vehicleCount,
      offices: officeCount,
      reservations: reservationCount,
      categories: categoryCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
