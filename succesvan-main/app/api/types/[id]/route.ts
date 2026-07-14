import { NextRequest } from "next/server";
import connect from "@/lib/data";
import Type from "@/model/type";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect();
    const { id } = await params;
    const type = await Type.findById(id).populate('offices');
    if (!type) return errorResponse("Type not found", 404);
    return successResponse(type);
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
    const type = await Type.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).populate('offices');
    if (!type) return errorResponse("Type not found", 404);
    return successResponse(type);
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
    const type = await Type.findByIdAndDelete(id);
    if (!type) return errorResponse("Type not found", 404);
    return successResponse({ message: "Type deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
