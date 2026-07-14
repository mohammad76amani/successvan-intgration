// app/api/reports/categories/route.ts
import { NextRequest } from "next/server";
import connect from "@/lib/data";
import Reservation from "@/model/reservation";
import { PipelineStage } from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status"); // e.g., confirmed, completed
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Base match: only reservations with a valid category
    const match: any = {
      category: { $exists: true, $ne: null },
    };

    // Date filter on reservation creation (or you can use startDate/endDate of booking)
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      match.createdAt = { $gte: start, $lte: end };
    }

    // Optional: only count specific statuses (e.g., completed for real revenue)
    if (status) {
      match.status = status;
    }

    const pipeline: PipelineStage[] = [
      { $match: match },

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
          categoryId: "$_id",
          categoryName: "$categoryData.name",
          count: 1,
          totalPrice: { $round: ["$totalPrice", 2] },
          avgPrice: { $round: ["$avgPrice", 2] },
        },
      },

      { $sort: { count: -1 } },

      // Facet: pagination + summary in one go
      {
        $facet: {
          metadata: [{ $count: "totalCategories" }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],

          // Summary stats
          totalRevenue: [
            { $group: { _id: null, sum: { $sum: "$totalPrice" } } },
          ],
          totalReservations: [
            { $group: { _id: null, sum: { $sum: "$count" } } },
          ],
          mostUsed: [{ $limit: 1 }], // already sorted by count desc
          leastUsed: [{ $sort: { count: 1 } }, { $limit: 1 }], // reverse for least
        },
      },
    ];

    const result = await Reservation.aggregate(pipeline);
    const facet = result[0];

    const data = facet.data || [];
    const totalCategories = facet.metadata[0]?.totalCategories || 0;

    const summary = {
      mostUsed: facet.mostUsed[0] || null,
      leastUsed: facet.leastUsed[0] || null,
      totalRevenue: Math.round((facet.totalRevenue[0]?.sum || 0) * 100) / 100,
      totalReservations: facet.totalReservations[0]?.sum || 0,
      categoriesCount: totalCategories,
    };

    return Response.json({
      success: true,
      data,
      summary,
      pagination: {
        total: totalCategories,
        page,
        limit,
        pages: Math.ceil(totalCategories / limit),
      },
    });
  } catch (error: any) {
    console.log("Category report error:", error);
    return Response.json(
      {
        success: false,
        error: error.message || "Failed to fetch category report",
      },
      { status: 500 }
    );
  }
}
