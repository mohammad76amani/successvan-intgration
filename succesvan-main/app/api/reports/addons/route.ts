// app/api/reports/addons/route.ts
import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/data";
import Reservation from "@/model/reservation";
import { PipelineStage } from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const match: any = { addOns: { $exists: true, $ne: [] } };

    if (status) match.status = status;

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        match.createdAt.$lte = end;
      }
    }

    const pipeline: PipelineStage[] = [
      { $match: match },
      { $unwind: "$addOns" },
      { $match: { "addOns.addOn": { $exists: true } } },

      // Lookup AddOn
      {
        $lookup: {
          from: "addons",
          localField: "addOns.addOn",
          foreignField: "_id",
          as: "addOnData",
        },
      },
      { $unwind: { path: "$addOnData", preserveNullAndEmptyArrays: false } },

      // Lookup User
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userData",
        },
      },
      { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },

      // محاسبه قیمت درست بر اساس نوع Add-On
      {
        $addFields: {
          // تعداد روز رزرو
          rentalDays: {
            $ceil: {
              $divide: [
                { $subtract: ["$endDate", "$startDate"] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
          // قیمت واحد بر اساس نوع
          unitPrice: {
            $switch: {
              branches: [
                // Flat price
                {
                  case: { $eq: ["$addOnData.pricingType", "flat"] },
                  then: { $ifNull: ["$addOnData.flatPrice.amount", 0] },
                },
                // Tiered price - پیدا کردن tier مناسب
                {
                  case: { $eq: ["$addOnData.pricingType", "tiered"] },
                  then: {
                    $let: {
                      vars: {
                        matchedTier: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$addOnData.tieredPrice.tiers",
                                as: "tier",
                                cond: {
                                  $and: [
                                    {
                                      $gte: [
                                        "$$tier.maxDays",
                                        {
                                          $ceil: {
                                            $divide: [
                                              {
                                                $subtract: [
                                                  "$endDate",
                                                  "$startDate",
                                                ],
                                              },
                                              1000 * 60 * 60 * 24,
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                    {
                                      $lte: [
                                        "$$tier.minDays",
                                        {
                                          $ceil: {
                                            $divide: [
                                              {
                                                $subtract: [
                                                  "$endDate",
                                                  "$startDate",
                                                ],
                                              },
                                              1000 * 60 * 60 * 24,
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                  ],
                                },
                              },
                            },
                            0,
                          ],
                        },
                      },
                      in: { $ifNull: ["$$matchedTier.price", 0] },
                    },
                  },
                },
              ],
              default: 0,
            },
          },
        },
      },

      // Group by Add-On
      {
        $group: {
          _id: "$addOnData._id",
          name: { $first: "$addOnData.name" },
          usageCount: { $sum: { $ifNull: ["$addOns.quantity", 1] } },
          totalRevenue: {
            $sum: {
              $multiply: [{ $ifNull: ["$addOns.quantity", 1] }, "$unitPrice"],
            },
          },
          customers: {
            $push: {
              name: { $ifNull: ["$userData.name", "Unknown"] },
              quantity: { $ifNull: ["$addOns.quantity", 1] },
              spent: {
                $multiply: [{ $ifNull: ["$addOns.quantity", 1] }, "$unitPrice"],
              },
            },
          },
          reservationCount: { $addToSet: "$_id" },
        },
      },

      {
        $addFields: {
          reservationCount: { $size: "$reservationCount" },
          topCustomerObj: {
            $cond: [
              { $eq: [{ $size: "$customers" }, 0] },
              null,
              {
                $arrayElemAt: [
                  {
                    $sortArray: {
                      input: "$customers",
                      sortBy: { quantity: -1 },
                    },
                  },
                  0,
                ],
              },
            ],
          },
        },
      },

      {
        $project: {
          _id: 1,
          name: 1,
          usageCount: 1,
          totalRevenue: { $round: ["$totalRevenue", 2] },
          avgUsagePerReservation: {
            $cond: [
              { $eq: ["$reservationCount", 0] },
              0,
              {
                $round: [{ $divide: ["$usageCount", "$reservationCount"] }, 2],
              },
            ],
          },
          topCustomer: { $ifNull: ["$topCustomerObj.name", "N/A"] },
          topCustomerUsage: { $ifNull: ["$topCustomerObj.quantity", 0] },
        },
      },

      { $sort: { usageCount: -1 } },

      {
        $facet: {
          metadata: [{ $count: "totalAddOns" }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          totalRevenue: [
            { $group: { _id: null, sum: { $sum: "$totalRevenue" } } },
          ],
          totalUsage: [{ $group: { _id: null, sum: { $sum: "$usageCount" } } }],
          mostUsed: [{ $limit: 1 }],
          leastUsed: [{ $sort: { usageCount: 1 } }, { $limit: 1 }],
        },
      },
    ];

    const result = await Reservation.aggregate(pipeline);
    const facet = result[0] || {};

    const data = facet.data || [];
    const totalAddOns = facet.metadata[0]?.totalAddOns || 0;

    const summary = {
      totalAddOns,
      totalAddOnRevenue:
        Math.round((facet.totalRevenue[0]?.sum || 0) * 100) / 100,
      totalAddOnUsage: facet.totalUsage[0]?.sum || 0,
      avgAddOnsPerReservation:
        totalAddOns > 0
          ? Math.round(((facet.totalUsage[0]?.sum || 0) / totalAddOns) * 100) /
            100
          : 0,
      mostUsedAddOn: facet.mostUsed[0] || null,
      leastUsedAddOn: facet.leastUsed[0] || null,
    };

    return NextResponse.json({
      success: true,
      data,
      summary,
      pagination: {
        total: totalAddOns,
        page,
        limit,
        pages: Math.ceil(totalAddOns / limit),
      },
    });
  } catch (error: any) {
    console.log("Add-On report error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch add-on report",
      },
      { status: 500 }
    );
  }
}
