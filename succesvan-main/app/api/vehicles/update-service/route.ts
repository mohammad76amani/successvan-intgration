import { NextRequest } from "next/server";
import connect from "@/lib/data";
import Vehicle from "@/model/vehicle";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/roles";

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!canAccessDashboard(auth.role)) {
      return errorResponse("Admin access is required", 403);
    }
    await connect();
    const { vehicleId, serviceType, serviceDate } = await req.json();

    if (!vehicleId || !serviceType) {
      return errorResponse("vehicleId and serviceType are required", 400);
    }

    const validServiceTypes = ["tire", "oil", "battery", "air", "service"];
    if (!validServiceTypes.includes(serviceType)) {
      return errorResponse(
        `Invalid serviceType. Must be one of: ${validServiceTypes.join(", ")}`,
        400
      );
    }

    const updateData: Record<string, Date | string> = {};
    updateData[`serviceHistory.${serviceType}`] = serviceDate || new Date();

    const vehicle = await Vehicle.findByIdAndUpdate(vehicleId, updateData, {
      new: true,
      runValidators: true,
    }).populate("category");

    if (!vehicle) return errorResponse("Vehicle not found", 404);

    return successResponse({
      message: `${serviceType} service updated successfully`,
      vehicle,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 400);
  }
}
