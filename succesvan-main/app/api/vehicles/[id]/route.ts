import { NextRequest } from "next/server";
import connect from "@/lib/data";
import Vehicle from "@/model/vehicle";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect();
    const { id } = await params;
    const body = await req.json();
    const vehicle = await Vehicle.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).populate("reservation");
    if (!vehicle) return errorResponse("Vehicle not found", 404);
    return successResponse(vehicle);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 400);
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
    const vehicle = await Vehicle.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).populate("reservation");
    if (!vehicle) return errorResponse("Vehicle not found", 404);
    return successResponse(vehicle);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 400);
  }
}
