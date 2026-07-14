import { NextRequest } from "next/server";
import connect from "@/lib/data";
import AddOn from "@/model/addOn";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect();
    const { id } = await params;
    const addOn = await AddOn.findById(id);
    if (!addOn) return errorResponse("AddOn not found", 404);
    return successResponse(addOn);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect();
    const { id } = await params;
    const body = await req.json();
    const addOn = await AddOn.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!addOn) return errorResponse("AddOn not found", 404);
    return successResponse(addOn);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 400);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect();
    const { id } = await params;
    const addOn = await AddOn.findByIdAndDelete(id);
    if (!addOn) return errorResponse("AddOn not found", 404);
    return successResponse({ message: "AddOn deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
