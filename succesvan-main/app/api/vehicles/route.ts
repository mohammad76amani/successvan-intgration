import { NextRequest } from "next/server";
import connect from "@/lib/data";
import Vehicle from "@/model/vehicle";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/roles";
 

export async function GET(req: NextRequest) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50"); // higher limit for dropdown
    const title = searchParams.get("title");
    const number = searchParams.get("number");
    const keyNumber = searchParams.get("keyNumber");
    const office = searchParams.get("office");
    const status = searchParams.get("status");
    const available = searchParams.get("available");
    const category = searchParams.get("category");
    
    // ✅ پارامترهای جدید برای تاریخ و سورت
    const createdAtStart = searchParams.get("createdAtStart");
    const createdAtEnd = searchParams.get("createdAtEnd");
    const sortBy = searchParams.get("sortBy");
    const sortOrderParam = searchParams.get("sortOrder");
    
    // حفظ لاجیک قبلی: اگر سورتی ارسال نشد، بر اساس title سورت شود
    const sortObj: Record<string, 1 | -1> = sortBy
      ? { [sortBy]: sortOrderParam === "desc" ? -1 : 1 }
      : { title: 1 };

    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    // Text search
    if (title) query.title = { $regex: title, $options: "i" };
    if (number) query.number = { $regex: number, $options: "i" };
    if (keyNumber) query.keyNumber = { $regex: keyNumber, $options: "i" };
    if (office) query.office = office;
    if (status) query.status = status;
    if (category) query.category = category;

    // Special: only available vehicles
    if (available === "true") {
      query.available = true; 
      query.needsService = false;
      query.status = "active";
    }

    // ✅ فیلتر تاریخ (بدون مشکل Timezone)
    if (createdAtStart || createdAtEnd) {
      const createdAtFilter: { $gte?: Date; $lte?: Date } = {};
      if (createdAtStart) {
        const [y, m, d] = createdAtStart.split('-').map(Number);
        createdAtFilter.$gte = new Date(y, m - 1, d, 0, 0, 0, 0);
      }
      if (createdAtEnd) {
        const [y, m, d] = createdAtEnd.split('-').map(Number);
        createdAtFilter.$lte = new Date(y, m - 1, d, 23, 59, 59, 999);
      }
      query.createdAt = createdAtFilter;
    }

    const vehicles = await Vehicle.find(query)
      .populate("category", "name")
      .populate("office", "name")
      .skip(skip)
      .limit(limit)
      .sort(sortObj) // ✅ سورت داینامیک جایگزین شد
      .lean();

    const total = await Vehicle.countDocuments(query);

    return successResponse({
      data: vehicles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!canAccessDashboard(auth.role)) {
      return errorResponse("Admin access is required", 403);
    }
    await connect();
    const body = await req.json();
    const vehicle = await Vehicle.create(body);
    await vehicle.populate("category");
    return successResponse(vehicle, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 400);
  }
}
