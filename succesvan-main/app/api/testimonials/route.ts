import { NextRequest } from "next/server";
import connect from "@/lib/data";
import Testimonial from "@/model/testimonial";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");

    // ✅ پارامترهای جدید برای تاریخ و سورت
    const createdAtStart = searchParams.get("createdAtStart");
    const createdAtEnd = searchParams.get("createdAtEnd");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const sortObj: any = { [sortBy]: sortOrder };

    const query: any = {};
    if (status) query.status = status;

    // ✅ اصلاح لاجیک تاریخ (بدون مشکل Timezone)
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

    const testimonials = await Testimonial.find(query)
      .sort(sortObj) // ✅ سورت داینامیک جایگزین شد
      .skip(skip)
      .limit(limit);

    const total = await Testimonial.countDocuments(query);
    const pages = Math.ceil(total / limit);

    return successResponse({
      data: testimonials,
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
    const { name, email, message, rating, link } = await req.json();

    if (!name || !email || !message) {
      return errorResponse("All fields are required", 400);
    }

    const testimonial = await Testimonial.create({
      name,
      email,
      message,
      rating: rating || 5,
      status: "pending",
      link: link || "",
    });

    return successResponse(testimonial, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 400);
  }
}
