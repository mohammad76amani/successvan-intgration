// app/api/reports/customers/route.ts
import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/data";
import User from "@/model/user";
import Reservation from "@/model/reservation";
import mongoose from "mongoose";
import { PipelineStage } from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");
    const status = searchParams.get("status"); // optional: confirmed, completed, etc.
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    // Date range for filtering reservations
    const reservationMatch: any = {};
    if (status) {
      reservationMatch.status = status;
    }

    if (startDateStr && endDateStr) {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      end.setHours(23, 59, 59, 999);
      reservationMatch.createdAt = { $gte: start, $lte: end };
    }

    const pipeline: PipelineStage[] = [
      // Step 1: Get all users (base)
      { $match: {} }, // You can add filters like role: "customer" if needed
      { $project: { name: 1, lastName: 1, createdAt: 1 } },

      // Step 2: Lookup their reservations
      {
        $lookup: {
          from: "reservations",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$user", "$$userId"] },
                ...reservationMatch,
              },
            },
            { $project: { totalPrice: 1, createdAt: 1, status: 1 } },
          ],
          as: "reservations",
        },
      },

      // Step 3: Calculate stats per user
      {
        $addFields: {
          fullName: { $concat: ["$name", " ", "$lastName"] },
          reservationCount: { $size: "$reservations" },
          totalSpent: {
            $sum: "$reservations.totalPrice",
          },
          reservations: "$reservations", // keep for later if needed
        },
      },

      // Step 4: Sort by total spent (desc) for ranking
      { $sort: { totalSpent: -1 } },

      // Step 5: Facet for pagination + summary
      {
        $facet: {
          metadata: [{ $count: "totalCustomers" }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],

          // Summary calculations
          totalRevenue: [
            { $group: { _id: null, sum: { $sum: "$totalSpent" } } },
          ],
          totalReservations: [
            { $group: { _id: null, count: { $sum: "$reservationCount" } } },
          ],

          // Most & least active customers
          mostActive: [{ $limit: 1 }],
          leastActive: [{ $sort: { reservationCount: 1 } }, { $limit: 1 }],

          // New users this month
          newUsersThisMonth: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    1
                  ),
                  $lte: new Date(
                    new Date().getFullYear(),
                    new Date().getMonth() + 1,
                    0
                  ),
                },
              },
            },
            { $count: "count" },
          ],

          // Active users this month (had at least one reservation)
          activeUsersThisMonth: [
            {
              $match: { reservationCount: { $gt: 0 } },
            },
            {
              $lookup: {
                from: "reservations",
                let: { userId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$user", "$$userId"] },
                      createdAt: {
                        $gte: new Date(
                          new Date().getFullYear(),
                          new Date().getMonth(),
                          1
                        ),
                        $lte: new Date(
                          new Date().getFullYear(),
                          new Date().getMonth() + 1,
                          0
                        ),
                      },
                    },
                  },
                ],
                as: "monthlyReservations",
              },
            },
            {
              $match: {
                $expr: { $gt: [{ $size: "$monthlyReservations" }, 0] },
              },
            },
            { $count: "count" },
          ],
        },
      },
    ];

    // Execute aggregation on User model
    const result = await User.aggregate(pipeline);
    const facet = result[0];

    const data = facet.data.map((user: any) => ({
      _id: user._id,
      name: user.fullName,
      reservationCount: user.reservationCount,
      totalSpent: Math.round(user.totalSpent * 100) / 100,
      createdAt: user.createdAt,
    }));

    const totalCustomers = facet.metadata[0]?.totalCustomers || 0;

    const summary = {
      totalCustomers,
      totalRevenue: Math.round((facet.totalRevenue[0]?.sum || 0) * 100) / 100,
      avgReservationsPerCustomer:
        totalCustomers > 0
          ? Math.round(
              ((facet.totalReservations[0]?.count || 0) / totalCustomers) * 100
            ) / 100
          : 0,
      newUsersThisMonth: facet.newUsersThisMonth[0]?.count || 0,
      activeUsersThisMonth: facet.activeUsersThisMonth[0]?.count || 0,
      mostActive: facet.mostActive[0]
        ? {
            name: facet.mostActive[0].fullName,
            reservationCount: facet.mostActive[0].reservationCount,
            totalSpent: Math.round(facet.mostActive[0].totalSpent * 100) / 100,
          }
        : null,
      leastActive: facet.leastActive[0]
        ? {
            name: facet.leastActive[0].fullName,
            reservationCount: facet.leastActive[0].reservationCount,
            totalSpent: Math.round(facet.leastActive[0].totalSpent * 100) / 100,
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      data,
      summary,
      pagination: {
        total: totalCustomers,
        page,
        limit,
        pages: Math.ceil(totalCustomers / limit),
      },
    });
  } catch (error: any) {
    console.log("Customer report error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch customer report",
      },
      { status: 500 }
    );
  }
}
