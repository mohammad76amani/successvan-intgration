import { NextRequest } from "next/server";
import connect from "@/lib/data";
import { requireAuth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/roles";
import { successResponse, errorResponse } from "@/lib/api-response";
import Reservation from "@/model/reservation";
import Vehicle from "@/model/vehicle";
import User from "@/model/user";

type CustomFieldPayload = {
  templateFieldId?: unknown;
  label?: unknown;
  fieldType?: unknown;
  inputType?: unknown;
  value?: unknown;
  files?: unknown;
  helpText?: unknown;
};

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
    const staff = await User.findOne({
      _id: body.staffId,
      role: { $in: ["admin", "owner"] },
    }).select("name lastName role");
    if (!staff) {
      return errorResponse("Select a valid admin or owner", 400);
    }
    const staffName = [staff.name, staff.lastName].filter(Boolean).join(" ");

    const now = new Date();
    const handoverDepositAmount = Math.max(
      0,
      Number(body.handoverDepositAmount) || 0,
    );
    const reservation = await Reservation.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "delivered",
          handoverDepositAmount,
          handover: {
            startedAt: now,
            startMileage,
            startFuelLevel: String(body.startFuelLevel).trim(),
            conditionNotes: String(body.conditionNotes || "").trim(),
            existingDamages: Array.isArray(body.existingDamages)
              ? body.existingDamages.filter(Boolean)
              : [],
            staffSignature: staffName,
            staff: { user: staff._id, name: staffName, role: staff.role },
            keyCount: Math.max(0, Number(body.keyCount) || 0),
            equipment: Array.isArray(body.equipment)
              ? body.equipment.filter(Boolean)
              : [],
            customFields: Array.isArray(body.customFields)
              ? body.customFields
                  .filter((field: CustomFieldPayload) => field && field.label)
                  .map((field: CustomFieldPayload) => ({
                    templateFieldId: String(field.templateFieldId || "").trim(),
                    label: String(field.label || "").trim(),
                    fieldType: field.fieldType === "file" ? "file" : "input",
                    inputType: String(field.inputType || ""),
                    value: String(field.value || "").trim(),
                    files: Array.isArray(field.files)
                      ? field.files.filter(Boolean)
                      : [],
                    helpText: String(field.helpText || "").trim(),
                  }))
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
