/**
 * Categories Report Builder
 * Reusable function for generating vehicle category performance stats
 */

import connect from "@/lib/data";
import Reservation from "@/model/reservation";

export interface CategoryReportResult {
  data: Array<{
    _id: string;
    categoryName: string;
    count: number;
    totalPrice: number;
    avgPrice: number;
  }>;
  summary: {
    mostUsed: any;
    leastUsed: any;
    totalRevenue: number;
    totalReservations: number;
    categoriesCount: number;
  };
}

export async function buildCategoriesReport(
  startDate?: string,
  endDate?: string
): Promise<CategoryReportResult> {
  await connect();

  const query: any = { category: { $ne: null } };

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query.createdAt = { $gte: start, $lte: end };
  }

  const allCategoryReports = await Reservation.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        totalPrice: { $sum: "$totalPrice" },
        avgPrice: { $avg: "$totalPrice" },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "categoryData",
      },
    },
    { $unwind: { path: "$categoryData", preserveNullAndEmptyArrays: false } },
    {
      $project: {
        _id: 1,
        categoryName: "$categoryData.name",
        count: 1,
        totalPrice: { $round: ["$totalPrice", 2] },
        avgPrice: { $round: ["$avgPrice", 2] },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const mostUsed = allCategoryReports[0] || null;
  const leastUsed = allCategoryReports[allCategoryReports.length - 1] || null;
  const totalRevenue = allCategoryReports.reduce(
    (sum, cat) => sum + (cat.totalPrice || 0),
    0
  );
  const totalReservations = allCategoryReports.reduce(
    (sum, cat) => sum + (cat.count || 0),
    0
  );

  return {
    data: allCategoryReports,
    summary: {
      mostUsed,
      leastUsed,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalReservations,
      categoriesCount: allCategoryReports.length,
    },
  };
}
