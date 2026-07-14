// app/api/reports/offices/route.ts
import { NextRequest } from "next/server";
import connect from "@/lib/data";
import Reservation from "@/model/reservation";
import mongoose from "mongoose";
import { PipelineStage } from "mongoose"; // برای type-safety

export async function GET(req: NextRequest) {
  try {
    await connect();

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status"); // optional: confirmed, completed, etc.
    const officeId = searchParams.get("office"); // optional: filter single office
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Base match
    const match: any = {
      office: { $exists: true, $ne: null },
    };

    // Date filter on createdAt (or you can use reservation dates if needed)
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      match.createdAt = { $gte: start, $lte: end };
    }

    // Status filter (recommended: only count paid/completed reservations)
    if (status) {
      match.status = status;
    }

    // Single office filter
    if (officeId) {
      match.office = new mongoose.Types.ObjectId(officeId);
    }

    const pipeline: PipelineStage[] = [
      { $match: match },

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
          officeId: "$_id",
          officeName: "$officeData.name",
          count: 1,
          totalPrice: { $round: ["$totalPrice", 2] },
          avgPrice: { $round: ["$avgPrice", 2] },
        },
      },

      { $sort: { count: -1 } },

      // Facet for pagination + summary in one query
      {
        $facet: {
          metadata: [{ $count: "totalOffices" }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],

          // Summary stats
          totalRevenue: [
            { $group: { _id: null, sum: { $sum: "$totalPrice" } } },
          ],
          totalReservations: [
            { $group: { _id: null, sum: { $sum: "$count" } } },
          ],
          mostUsed: [{ $limit: 1 }], // already sorted by count desc
          leastUsed: [{ $sort: { count: 1 } }, { $limit: 1 }], // reverse sort for least
        },
      },
    ];

    const result = await Reservation.aggregate(pipeline);
    const facet = result[0];

    const data = facet.data || [];
    const totalOffices = facet.metadata[0]?.totalOffices || 0;

    const summary = {
      mostUsed: facet.mostUsed[0] || null,
      leastUsed: facet.leastUsed[0] || null,
      totalRevenue: Math.round((facet.totalRevenue[0]?.sum || 0) * 100) / 100,
      totalReservations: facet.totalReservations[0]?.sum || 0,
      officesCount: totalOffices,
    };

    return Response.json({
      success: true,
      data,
      summary,
      pagination: {
        total: totalOffices,
        page,
        limit,
        pages: Math.ceil(totalOffices / limit),
      },
    });
  } catch (error) {
    console.log("Office report error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
