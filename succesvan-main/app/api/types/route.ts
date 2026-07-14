import { NextRequest } from "next/server";
import connect from "@/lib/data";
import Type from "@/model/type";
import { successResponse, errorResponse } from "@/lib/api-response";
import Office from "@/model/office";

export async function GET(req: NextRequest) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const name = searchParams.get("name");
    const status = searchParams.get("status");

    // ✅ پارامترهای جدید برای تاریخ و سورت
    const createdAtStart = searchParams.get("createdAtStart");
    const createdAtEnd = searchParams.get("createdAtEnd");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const sortObj: any = { [sortBy]: sortOrder };

    const skip = (page - 1) * limit;

    const query: any = {};
    if (name) query.name = { $regex: name, $options: "i" };
    if (status) {
      query.status = status;
    }

    // ✅ اصلاح لاجیک تاریخ برای هماهنگی کامل با کلاینت و حذف مشکل Timezone
    if (createdAtStart || createdAtEnd) {
      query.createdAt = {};
      if (createdAtStart) {
        const [y, m, d] = createdAtStart.split('-').map(Number);
        query.createdAt.$gte = new Date(y, m - 1, d, 0, 0, 0, 0);
      }
      if (createdAtEnd) {
        const [y, m, d] = createdAtEnd.split('-').map(Number);
        query.createdAt.$lte = new Date(y, m - 1, d, 23, 59, 59, 999);
      }
    }

    const types = await Type.find(query)
      .populate({
        path: "offices",
        model: Office,
      })
      .sort(sortObj) // ✅ سورت داینامیک جایگزین شد
      .skip(skip)
      .limit(limit);

    const total = await Type.countDocuments(query);
    const pages = Math.ceil(total / limit);

    return successResponse({
      data: types,
      pagination: { page, limit, total, pages },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connect();
    const body = await req.json();
    const type = await Type.create(body);
    return successResponse(type, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 400);
  }
}
