import { NextRequest } from "next/server";
import connect from "@/lib/data";
import Vehicle from "@/model/vehicle";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/roles";

const updateVehicle = async (
  req: NextRequest,
  params: Promise<{ id: string }>,
) => {
  const auth = requireAuth(req);
  if (!canAccessDashboard(auth.role)) {
    return errorResponse("Admin access is required", 403);
  }

  await connect();
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;
  const updateData: Record<string, unknown> = { ...body };
  let update: Record<string, unknown> = updateData;

  // A manually released vehicle must never retain a stale reservation link.
  if (body.available === true) {
    delete updateData.reservation;
    update = {
      $set: updateData,
      $unset: { reservation: 1 },
    };
  }

  const vehicle = await Vehicle.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).populate("reservation");
  if (!vehicle) return errorResponse("Vehicle not found", 404);
  return successResponse(vehicle);
};

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await updateVehicle(req, params);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 400);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await updateVehicle(req, params);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 400);
  }
}
