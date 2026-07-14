/**
 * Offices Report Builder
 * Reusable function for generating office location performance stats
 */

import connect from "@/lib/data";
import Reservation from "@/model/reservation";

export interface OfficeReportResult {
  data: Array<{
    _id: string;
    officeName: string;
    count: number;
    totalPrice: number;
    avgPrice: number;
  }>;
  summary: {
    mostUsed: any;
    leastUsed: any;
    totalRevenue: number;
    totalReservations: number;
    officesCount: number;
  };
}

export async function buildOfficesReport(
  startDate?: string,
  endDate?: string
): Promise<OfficeReportResult> {
  await connect();

  const query: any = { office: { $ne: null } };

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query.createdAt = { $gte: start, $lte: end };
  }

  const allOfficeReports = await Reservation.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$office",
        count: { $sum: 1 },
        totalPrice: { $sum: "$totalPrice" },
        avgPrice: { $avg: "$totalPrice" },
      },
    },
    {
      $lookup: {
        from: "offices",
        localField: "_id",
        foreignField: "_id",
        as: "officeData",
      },
    },
    { $unwind: { path: "$officeData", preserveNullAndEmptyArrays: false } },
    {
      $project: {
        _id: 1,
        officeName: "$officeData.name",
        count: 1,
        totalPrice: { $round: ["$totalPrice", 2] },
        avgPrice: { $round: ["$avgPrice", 2] },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const mostUsed = allOfficeReports[0] || null;
  const leastUsed = allOfficeReports[allOfficeReports.length - 1] || null;
  const totalRevenue = allOfficeReports.reduce(
    (sum, office) => sum + (office.totalPrice || 0),
    0
  );
  const totalReservations = allOfficeReports.reduce(
    (sum, office) => sum + (office.count || 0),
    0
  );

  return {
    data: allOfficeReports,
    summary: {
      mostUsed,
      leastUsed,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalReservations,
      officesCount: allOfficeReports.length,
    },
  };
}
