import { NextRequest } from "next/server";
import connect from "@/lib/data";
import Discount from "@/model/discount";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const code = searchParams.get("code");
    const status = searchParams.get("status");
    const createdAtStart = searchParams.get("createdAtStart");
    const createdAtEnd = searchParams.get("createdAtEnd");
    const validFromStart = searchParams.get("validFromStart");
    const validFromEnd = searchParams.get("validFromEnd");
    const validToStart = searchParams.get("validToStart");
    const validToEnd = searchParams.get("validToEnd");

    // ✅ پارامترهای سورت
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const sortObj: any = { [sortBy]: sortOrder };

    // ✅ تابع کمکی برای تبدیل تاریخ (بدون مشکل Timezone)
    const parseStartDate = (dateStr: string) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d, 0, 0, 0, 0);
    };
    const parseEndDate = (dateStr: string) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d, 23, 59, 59, 999);
    };

    const query: any = {};
    if (code) {
      query.code = { $regex: code, $options: "i" };
    }
    if (status) {
      query.status = status;
    }

    // ✅ اصلاح فیلتر createdAt
    if (createdAtStart || createdAtEnd) {
      query.createdAt = {};
      if (createdAtStart) query.createdAt.$gte = parseStartDate(createdAtStart);
      if (createdAtEnd) query.createdAt.$lte = parseEndDate(createdAtEnd);
    }

    // ✅ اصلاح فیلتر validFrom
    if (validFromStart || validFromEnd) {
      query.validFrom = {};
      if (validFromStart) query.validFrom.$gte = parseStartDate(validFromStart);
      if (validFromEnd) query.validFrom.$lte = parseEndDate(validFromEnd);
    }

    // ✅ اصلاح فیلتر validTo
    if (validToStart || validToEnd) {
      query.validTo = {};
      if (validToStart) query.validTo.$gte = parseStartDate(validToStart);
      if (validToEnd) query.validTo.$lte = parseEndDate(validToEnd);
    }

    // بدون صفحه‌بندی
    if (!page && !limit) {
      const discounts = await Discount.find(query)
        .populate("categories")
        .sort(sortObj); // ✅ سورت داینامیک
      return successResponse({ data: discounts });
    }

    // با صفحه‌بندی
    const pageNum = parseInt(page || "1");
    const limitNum = parseInt(limit || "10");
    const skip = (pageNum - 1) * limitNum;

    const [discounts, total] = await Promise.all([
      Discount.find(query)
        .populate("categories")
        .sort(sortObj) // ✅ سورت داینامیک
        .skip(skip)
        .limit(limitNum),
      Discount.countDocuments(query),
    ]);

    return successResponse({
      data: discounts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
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
    const discount = await Discount.create(body);
    return successResponse(discount, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 400);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const body = await req.json();
    
    // Handle adding user to usedBy array
    if (body.addUserToUsedBy) {
      const userId = body.addUserToUsedBy;
      delete body.addUserToUsedBy;
      
      const discount = await Discount.findByIdAndUpdate(
        id,
        { 
          $inc: { usageCount: 1 },
          $addToSet: { usedBy: userId }
        },
        { new: true }
      );
      return successResponse(discount);
    }
    
    const discount = await Discount.findByIdAndUpdate(id, body, { new: true });
    return successResponse(discount);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.log("PATCH discount error:", error);
    return errorResponse(message, 400);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    await Discount.findByIdAndDelete(id);
    return successResponse({ message: "Discount deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 400);
  }
}
