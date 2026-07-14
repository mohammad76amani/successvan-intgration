import { NextRequest } from "next/server";
import connect from "@/lib/data";
import Office from "@/model/office";
import Vehicle from "@/model/vehicle";
import Category from "@/model/category";
import { successResponse, errorResponse } from "@/lib/api-response";
import { normalizeOfficePayload } from "@/lib/officePayload";

export async function GET(req: NextRequest) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const name = searchParams.get("name");
    const phone = searchParams.get("phone");
    const status = searchParams.get("status");

    // ✅ پارامترهای جدید برای تاریخ و سورت
    const createdAtStart = searchParams.get("createdAtStart");
    const createdAtEnd = searchParams.get("createdAtEnd");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const sortObj: any = { [sortBy]: sortOrder };

    const skip = (page - 1) * limit;

    const query: any = {}; // تغییر به any برای پشتیبانی از تاریخ

    if (name) {
      query.name = { $regex: name, $options: "i" };
    }
    if (phone) {
      query.phone = { $regex: phone, $options: "i" };
    }
    if (status) {
      query.status = status;
    }

    // ✅ فیلتر تاریخ (بدون مشکل Timezone)
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

    const offices = await Office.find(query)
      .populate([
        { path: "vehicles.vehicle", model: Vehicle },
        { path: "categories", model: Category },
      ])
      .sort(sortObj) // ✅ سورت داینامیک اضافه شد
      .skip(skip)
      .limit(limit);

    const total = await Office.countDocuments(query);
    const pages = Math.ceil(total / limit);

    const normalizedOffices = offices.map((office) =>
      normalizeOfficePayload(office.toObject() as Record<string, unknown>)
    );

    return successResponse({
      data: normalizedOffices,
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
    const body = normalizeOfficePayload(
      (await req.json()) as Record<string, unknown>
    );
    const office = await Office.create(body);
    await office.populate([
      { path: "vehicles.vehicle", model: Vehicle },
      { path: "categories", model: Category },
    ]);
    return successResponse(
      normalizeOfficePayload(office.toObject() as Record<string, unknown>),
      201
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 400);
  }
}
