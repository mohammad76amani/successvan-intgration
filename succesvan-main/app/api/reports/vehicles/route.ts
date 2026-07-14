import connect from "@/lib/data";
import Vehicle from "@/model/vehicle";
import { NextRequest, NextResponse } from "next/server";
import mongoose, { PipelineStage } from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await connect();
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const categoryId = searchParams.get("category");
    const status = searchParams.get("status"); // مثلاً فقط confirmed
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // فیلتر خودروها
    const vehicleMatch: any = {};
    if (categoryId) {
      vehicleMatch.category = new mongoose.Types.ObjectId(categoryId);
    }
    if (searchParams.get("office")) {
      vehicleMatch.office = new mongoose.Types.ObjectId(
        searchParams.get("office")!
      );
    }

    // فیلتر رزروها با overlap درست
    const reservationMatch: any = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      reservationMatch.$and = [
        { startDate: { $lte: end } },
        { endDate: { $gte: start } },
      ];
    }
    if (status) {
      reservationMatch.status = status;
    }

    const pipeline: PipelineStage[] = [
      { $match: vehicleMatch },

      // populate category
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      // populate office (اگر نیاز داری)
      {
        $lookup: {
          from: "offices",
          localField: "office",
          foreignField: "_id",
          as: "office",
        },
      },
      { $unwind: { path: "$office", preserveNullAndEmptyArrays: true } },

      // lookup رزروها
      {
        $lookup: {
          from: "reservations",
          let: { vehicleId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$vehicle", "$$vehicleId"] },
                ...reservationMatch,
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
              },
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                startDate: 1,
                endDate: 1,
                status: 1,
                totalPrice: 1,
                userName: "$user.name",
              },
            },
          ],
          as: "reservations",
        },
      },

      {
        $addFields: {
          reservationCount: { $size: "$reservations" },
          totalRevenue: { $sum: "$reservations.totalPrice" },
        },
      },

      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $project: {
                title: 1,
                number: 1,
                keyNumber: 1,
                images: 1,
                status: 1,
                needsService: 1,
                serviceHistory: 1,
                properties: 1,
                category: { name: "$category.name" },
                office: { name: "$office.name" },
                reservationCount: 1,
                totalRevenue: 1,
                reservations: 1,
              },
            },
          ],
        },
      },
    ];

    const result = await Vehicle.aggregate(pipeline);

    const total = result[0]?.metadata[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: result[0]?.data || [],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.log("Vehicle report error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
