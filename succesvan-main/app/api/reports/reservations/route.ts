// app/api/reports/reservations/route.ts
import connect from "@/lib/data";
import Reservation from "@/model/reservation";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { PipelineStage } from "mongoose"; // این خط خیلی مهمه!
export async function GET(request: NextRequest) {
  try {
    await connect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status"); // e.g., confirmed, completed
    const officeId = searchParams.get("office");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build dynamic match for reservations
    const reservationMatch: any = {};
    if (status) reservationMatch.status = status;
    if (officeId)
      reservationMatch.office = new mongoose.Types.ObjectId(officeId);

   if (startDate || endDate) {
  reservationMatch.createdAt = {};
  if (startDate) {
    reservationMatch.createdAt.$gte = new Date(startDate);
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // تا آخر روز
    reservationMatch.createdAt.$lte = end;
  }
}

    const pipeline: PipelineStage[] = [
      { $match: reservationMatch },

      // Populate user (only name)
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      // Populate vehicle → category (only name)
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicle",
          foreignField: "_id",
          as: "vehicle",
        },
      },
      { $unwind: { path: "$vehicle", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "categories",
          localField: "vehicle.category",
          foreignField: "_id",
          as: "vehicle.category",
        },
      },
      {
        $unwind: {
          path: "$vehicle.category",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Populate office name
      {
        $lookup: {
          from: "offices",
          localField: "office",
          foreignField: "_id",
          as: "office",
        },
      },
      { $unwind: { path: "$office", preserveNullAndEmptyArrays: true } },

      // Project clean fields
      {
        $project: {
          customerName: "$user.name",
          categoryName: "$vehicle.category.name",
          vehicleTitle: "$vehicle.title",
          vehicleNumber: "$vehicle.number",
          officeName: "$office.name",
          totalPrice: 1,
          startDate: 1,
          endDate: 1,
          status: 1,
          createdAt: 1,
        },
      },

      // Sort by totalPrice descending (highest first)
      { $sort: { totalPrice: -1 } },

      // Facet: one for data (paginated), one for summary stats
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],

          // Summary aggregations
          totalRevenue: [
            { $group: { _id: null, sum: { $sum: "$totalPrice" } } },
          ],
          totalReservations: [{ $group: { _id: null, count: { $sum: 1 } } }],
          avgPrice: [
            {
              $group: {
                _id: null,
                avg: { $avg: "$totalPrice" },
              },
            },
          ],

          // Top customers by spending
          topCustomers: [
            {
              $group: {
                _id: "$customerName",
                count: { $sum: 1 },
                totalSpent: { $sum: "$totalPrice" },
              },
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 10 },
          ],
        },
      },
    ];

    const result = await Reservation.aggregate(pipeline);
    const facet = result[0];

    const summary = {
      totalRevenue: facet.totalRevenue[0]?.sum || 0,
      totalReservations: facet.totalReservations[0]?.count || 0,
      avgPrice: facet.avgPrice[0]?.avg ? Math.round(facet.avgPrice[0].avg) : 0,
      topReservation: facet.data[0] || null,
      topCustomers: facet.topCustomers.map((c: any) => ({
        customerName: c._id || "Unknown",
        reservations: c.count,
        totalSpent: c.totalSpent,
      })),
    };

    const total = facet.metadata[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: facet.data,
      summary,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.log("Error fetching reservation report:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch report" },
      { status: 500 }
    );
  }
}
