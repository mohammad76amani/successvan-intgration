/**
 * Reservations Report Builder
 * Reusable function for generating booking trends and revenue stats
 */

import connect from "@/lib/data";
import Reservation from "@/model/reservation";

export interface ReservationReportResult {
  data: Array<{
    _id: string;
    customerName: string;
    categoryName: string;
    totalPrice: number;
    startDate: Date;
    endDate: Date;
    status: string;
  }>;
  summary: {
    totalRevenue: number;
    totalReservations: number;
    avgPrice: number;
    topReservation: any;
    customerStats: Record<string, { count: number; totalPrice: number }>;
  };
}

export async function buildReservationsReport(
  startDate?: string,
  endDate?: string
): Promise<ReservationReportResult> {
  await connect();

  // Build query with optional date filter
  const query: any = {};
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query.createdAt = { $gte: start, $lte: end };
  }

  const reservations = await Reservation.find(query)
    .populate("user", "name")
    .populate({
      path: "vehicle",
      populate: { path: "category", select: "name" },
    })
    .lean();

  const data = reservations
    .map((res: any) => ({
      _id: res._id,
      customerName: res.user?.name || "Unknown",
      categoryName: res.vehicle?.category?.name || "Unknown",
      totalPrice: res.totalPrice || 0,
      startDate: res.startDate,
      endDate: res.endDate,
      status: res.status,
    }))
    .sort((a: any, b: any) => b.totalPrice - a.totalPrice);

  const customerStats = data.reduce((acc: any, res: any) => {
    if (!acc[res.customerName]) {
      acc[res.customerName] = { count: 0, totalPrice: 0 };
    }
    acc[res.customerName].count += 1;
    acc[res.customerName].totalPrice += res.totalPrice;
    return acc;
  }, {});

  return {
    data,
    summary: {
      totalRevenue: data.reduce((sum: number, res: any) => sum + res.totalPrice, 0),
      totalReservations: data.length,
      avgPrice:
        data.length > 0
          ? Math.round(
              data.reduce((sum: number, res: any) => sum + res.totalPrice, 0) /
                data.length
            )
          : 0,
      topReservation: data[0] || null,
      customerStats,
    },
  };
}
