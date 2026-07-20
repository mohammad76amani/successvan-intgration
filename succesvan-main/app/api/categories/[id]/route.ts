import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
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

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect();
    const { id } = await params;
    const decodedId = decodeURIComponent(id).trim();
    const requestedSlug = categoryNameToSlug(decodedId);

    let category = mongoose.Types.ObjectId.isValid(decodedId)
      ? await Category.findById(decodedId)
      : null;

    if (!category) {
      const candidates = await Category.find({});
      category =
        candidates.find((c) => categoryNameToSlug(c.name) === requestedSlug) ||
        null;
    }

    if (!category) return addCorsHeaders(errorResponse("Category not found", 404));

    try {
      await category.populate("type");
    } catch (populateError) {
      console.warn("Failed to populate type field:", populateError);
    }

    return addCorsHeaders(successResponse(category));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return addCorsHeaders(errorResponse(message, 500));
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(req);
    if (!canAccessDashboard(auth.role)) {
      return addCorsHeaders(errorResponse("Admin access is required", 403));
    }
    await connect();
    const { id } = await params;
    const body = await req.json();
    const category = await Category.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!category) return addCorsHeaders(errorResponse("Category not found", 404));
    return addCorsHeaders(successResponse(category));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return addCorsHeaders(errorResponse("Unauthorized", 401));
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return addCorsHeaders(errorResponse(message, 400));
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(req);
    if (!canAccessDashboard(auth.role)) {
      return addCorsHeaders(errorResponse("Admin access is required", 403));
    }
    await connect();
    const { id } = await params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) return addCorsHeaders(errorResponse("Category not found", 404));
    return addCorsHeaders(successResponse({ message: "Category deleted" }));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return addCorsHeaders(errorResponse("Unauthorized", 401));
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return addCorsHeaders(errorResponse(message, 500));
  }
}
