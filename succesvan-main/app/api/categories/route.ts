import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/data";
import Category from "@/model/category";
import { successResponse, errorResponse } from "@/lib/api-response";
import { categoryNameToSlug } from "@/lib/category-slug";
import { requireAuth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/roles";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function addCorsHeaders(response: NextResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

const navFallbackCategories = [
  "Short Wheel Base",
  "Medium Wheel Base",
  "Long Wheel Base",
  "Extra Long Wheel Base",
  "Luton With Tail-Lift",
  "CrewCab Van",
  "Flat Bed Pickup Van",
  "Fridge Van",
  "Tipper Van",
  "8 Seater Tourneo",
  "9 Seater Tourneo",
  "14 Seater Minibus",
  "17 Seater Minibus",
].map((name) => ({
  name,
  slug: categoryNameToSlug(name),
  status: "active",
}));

type CategoryQuery = {
  name?: { $regex: string; $options: string };
  type?: string;
  status?: string;
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
};

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }));
}

export async function GET(req: NextRequest) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const name = searchParams.get("name");
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    // ✅ پارامترهای سورت و تاریخ
    const sortBy = searchParams.get("sortBy");
    const sortOrderParam = searchParams.get("sortOrder");
    // حفظ لاجیک قبلی: اگر سورتی ارسال نشد، showPrice: 1 اعمال شود
    const sortObj: Record<string, 1 | -1> = sortBy
      ? { [sortBy]: sortOrderParam === "desc" ? -1 : 1 } 
      : { showPrice: 1 };

    const createdAtStart = searchParams.get("createdAtStart");
    const createdAtEnd = searchParams.get("createdAtEnd");

    if (!page && !limit) {
      const query: CategoryQuery = {};
      if (name) query.name = { $regex: name, $options: "i" };
      if (type) query.type = type;
      if (status) query.status = status;

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

      let categories = await Category.find(query)
        .sort(sortObj); // ✅ سورت داینامیک جایگزین شد

      // Try to populate type field, but don't fail if it doesn't work
      try {
        categories = await Category.populate(categories, {
          path: "type",
          options: { strictPopulate: false }
        });
      } catch (populateError) {
        console.warn("Failed to populate type field:", populateError);
        // Continue without populated data
      }

      return addCorsHeaders(successResponse({ data: categories }));
    }

    const pageNum = parseInt(page || "1");
    const limitNum = parseInt(limit || "10");
    const skip = (pageNum - 1) * limitNum;
    const query: CategoryQuery = {};
    if (name) query.name = { $regex: name, $options: "i" };
    if (type) query.type = type;
    if (status) query.status = status;

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

    let categories = await Category.find(query)
      .sort(sortObj) // ✅ سورت داینامیک جایگزین شد
      .skip(skip)
      .limit(limitNum);

    // Try to populate type field, but don't fail if it doesn't work
    try {
      categories = await Category.populate(categories, {
        path: "type",
        options: { strictPopulate: false }
      });
    } catch (populateError) {
      console.warn("Failed to populate type field:", populateError);
      // Continue without populated data
    }

    const total = await Category.countDocuments(query);

    return addCorsHeaders(successResponse({
      data: categories,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    }));
  } catch (error) {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("mode") === "nav") {
      return addCorsHeaders(successResponse({ data: navFallbackCategories }));
    }
    



    
    console.log("Categories API Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return addCorsHeaders(errorResponse(message, 500));
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!canAccessDashboard(auth.role)) {
      return addCorsHeaders(errorResponse("Admin access is required", 403));
    }
    await connect();
    const body = await req.json();
    const category = await Category.create(body);

    // Try to populate type field, but don't fail if it doesn't work
    try {
      await category.populate("type");
    } catch (populateError) {
      console.warn("Failed to populate type field on create:", populateError);
      // Continue without populated data
    }

    return addCorsHeaders(successResponse(category, 201));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return addCorsHeaders(errorResponse("Unauthorized", 401));
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return addCorsHeaders(errorResponse(message, 400));
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!canAccessDashboard(auth.role)) {
      return addCorsHeaders(errorResponse("Admin access is required", 403));
    }
    await connect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const body = await req.json();
    const category = await Category.findByIdAndUpdate(id, body, {
      new: true,
    });

    if (!category) {
      return addCorsHeaders(errorResponse("Category not found", 404));
    }

    // Try to populate type field, but don't fail if it doesn't work
    try {
      await category.populate("type");
    } catch (populateError) {
      console.warn("Failed to populate type field on update:", populateError);
      // Continue without populated data
    }

    return addCorsHeaders(successResponse(category));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return addCorsHeaders(errorResponse("Unauthorized", 401));
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return addCorsHeaders(errorResponse(message, 400));
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!canAccessDashboard(auth.role)) {
      return addCorsHeaders(errorResponse("Admin access is required", 403));
    }
    await connect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    await Category.findByIdAndDelete(id);
    return addCorsHeaders(successResponse({ message: "Category deleted" }));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return addCorsHeaders(errorResponse("Unauthorized", 401));
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return addCorsHeaders(errorResponse(message, 400));
  }
}
