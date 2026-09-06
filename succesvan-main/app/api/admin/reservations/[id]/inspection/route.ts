import { NextRequest } from "next/server";
import connect from "@/lib/data";
import { requireAuth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/roles";
import { successResponse, errorResponse } from "@/lib/api-response";
import Reservation from "@/model/reservation";
import User from "@/model/user";
import Notification from "@/model/notification";
import { customerReservationsSmsUrl, sendSMS } from "@/lib/sms";

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
    const returnMileage = Number(body.returnMileage);
    if (!Number.isFinite(returnMileage) || returnMileage < 0) {
      return errorResponse("Return mileage is required", 400);
    }
    if (!String(body.returnFuelLevel || "").trim()) {
      return errorResponse("Return fuel level is required", 400);
    }

    await connect();
    const existing = await Reservation.findById(id);
    if (!existing) return errorResponse("Reservation not found", 404);
    const staff = await User.findOne({
      _id: body.staffId,
      role: { $in: ["admin", "owner"] },
    }).select("name lastName role");
    if (!staff) {
      return errorResponse("Select a valid admin or owner", 400);
    }
    const staffName = [staff.name, staff.lastName].filter(Boolean).join(" ");

    const now = new Date();
    const depositPaid =
      existing.handoverDepositAmount ?? existing.deposit?.amount ?? 0;
    const reservation = await Reservation.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "deposit_review",
          inspection: {
            receivedAt: now,
            returnMileage,
            returnFuelLevel: String(body.returnFuelLevel).trim(),
            newDamages: Array.isArray(body.newDamages)
              ? body.newDamages.filter(Boolean)
              : [],
            lateReturn: Boolean(body.lateReturn),
            lateMinutes: Math.max(0, Number(body.lateMinutes) || 0),
            cleaningIssue: Boolean(body.cleaningIssue),
            missingEquipment: Array.isArray(body.missingEquipment)
              ? body.missingEquipment.filter(Boolean)
              : [],
            photos: Array.isArray(body.photos)
              ? body.photos.filter(Boolean)
              : [],
            notes: String(body.notes || "").trim(),
            staff: { user: staff._id, name: staffName, role: staff.role },
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
          "refund.depositPaid": depositPaid,
          "refund.status": "under_review",
        },
        $push: {
          statusHistory: {
            $each: [
              {
                status: "vehicle_returned",
                changedAt: now,
                source: "admin",
                note: "Vehicle received",
              },
              {
                status: "return_inspection",
                changedAt: now,
                source: "admin",
                note: "Return inspection completed",
              },
              {
                status: "deposit_review",
                changedAt: now,
                source: "admin",
                note: "Deposit review started",
              },
            ],
          },
        },
      },
      { new: true, runValidators: true },
    );

    // The vehicle is already back, so no future return reminder should fire.
    try {
      await Notification.deleteMany({
        reservation: id,
        status: "pending",
        type: "reservation_reminder",
      });
    } catch (notificationError) {
      console.log(
        "Return reminder cleanup error:",
        notificationError instanceof Error
          ? notificationError.message
          : "Unknown error",
      );
    }

    // Customer communication is best-effort and must not roll back a saved
    // return inspection if the external SMS provider is unavailable.
    try {
      const customer = await User.findById(existing.user).select("phoneData");
      const phoneNumber = customer?.phoneData?.phoneNumber;
      if (phoneNumber) {
        const messages = [
          `We have received and inspected the vehicle for reservation ${existing.reservationCode || id}. View the inspection and deposit review details: ${customerReservationsSmsUrl()}`,
          "Thank you for choosing Success Van Hire. We would appreciate your feedback: https://g.page/r/CZcNuTEcLJMAEBM/review",
        ];

        for (const message of messages) {
          try {
            await sendSMS(phoneNumber, message);
          } catch (smsError) {
            console.log(
              "Return inspection customer SMS error:",
              smsError instanceof Error ? smsError.message : "Unknown error",
            );
          }
        }
      }
    } catch (smsError) {
      console.log(
        "Return inspection customer lookup error:",
        smsError instanceof Error ? smsError.message : "Unknown error",
      );
    }

    return successResponse(reservation);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : "Could not save inspection",
      500,
    );
  }
}
