/**
 * Vehicles Report Builder
 * Reusable function for generating vehicle utilization stats
 */

import connect from "@/lib/data";
import Vehicle from "@/model/vehicle";
import Reservation from "@/model/reservation";

export interface VehicleReportResult {
  data: Array<{
    _id: string;
    title: string;
    number: string;
    keyNumber?: string;
    category: { name: string };
    office: { name: string };
    reservationCount: number;
    reservations: Array<{
      _id: string;
      startDate: Date;
      endDate: Date;
      user: any;
      status: string;
    }>;
  }>;
}

export async function buildVehiclesReport(): Promise<VehicleReportResult> {
  await connect();

  const vehicles = await Vehicle.find()
    .populate("category", "name")
    .populate("office", "name")
    .lean();

  const vehicleReports = await Promise.all(
    vehicles.map(async (vehicle: any) => {
      const reservations = await Reservation.find({
        vehicle: vehicle._id,
      })
        .populate("user", "name")
        .lean();

      return {
        _id: vehicle._id,
        title: vehicle.title,
        number: vehicle.number,
        keyNumber: vehicle.keyNumber,
        category: vehicle.category,
        office: vehicle.office,
        reservationCount: reservations.length,
        reservations: reservations.map((res: any) => ({
          _id: res._id,
          startDate: res.startDate,
          endDate: res.endDate,
          user: res.user,
          status: res.status,
        })),
      };
    })
  );

  return { data: vehicleReports };
}
