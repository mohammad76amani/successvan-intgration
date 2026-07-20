import { NextRequest } from "next/server";
import connect from "@/lib/data";
import { requireAuth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/roles";
import { successResponse, errorResponse } from "@/lib/api-response";
import Reservation from "@/model/reservation";
import Vehicle from "@/model/vehicle";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAuth(req);
    if (!canAccessDashboard(auth.role)) {
      return errorResponse("Admin access is required", 403);
    }
    const { id } = await params;
    const body = await req.json();
    const startMileage = Number(body.startMileage);
    if (!Number.isFinite(startMileage) || startMileage < 0) {
      return errorResponse("Starting mileage is required", 400);
    }
    if (!String(body.startFuelLevel || "").trim()) {
      return errorResponse("Starting fuel level is required", 400);
    }

    await connect();
    const existing = await Reservation.findById(id);
    if (!existing) return errorResponse("Reservation not found", 404);
    if (!existing.vehicle) return errorResponse("Assign a vehicle first", 409);

    const now = new Date();
    const reservation = await Reservation.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "delivered",
          handover: {
            startedAt: now,
            startMileage,
            startFuelLevel: String(body.startFuelLevel).trim(),
            conditionNotes: String(body.conditionNotes || "").trim(),
            existingDamages: Array.isArray(body.existingDamages)
              ? body.existingDamages.filter(Boolean)
              : [],
            photos: Array.isArray(body.photos) ? body.photos.filter(Boolean) : [],
            customerSignature: String(body.customerSignature || "").trim(),
            staffSignature: String(body.staffSignature || "").trim(),
            keyCount: Math.max(0, Number(body.keyCount) || 0),
            equipment: Array.isArray(body.equipment)
              ? body.equipment.filter(Boolean)
              : [],
            completedAt: now,
          },
        },
        $push: {
          statusHistory: {
            $each: [
              {
                status: "handover_in_progress",
                changedAt: now,
                source: "admin",
                note: "Vehicle handover started",
              },
              {
                status: "delivered",
                changedAt: now,
                source: "admin",
                note: "Vehicle handover completed",
              },
            ],
          },
        },
      },
      { new: true, runValidators: true },
    );
    await Vehicle.findByIdAndUpdate(existing.vehicle, { available: false });
    return successResponse(reservation);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : "Could not complete handover",
      500,
    );
  }
}
