import { NextRequest } from "next/server";
import connect from "@/lib/data";
import { requireAuth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/roles";
import { successResponse, errorResponse } from "@/lib/api-response";
import Reservation from "@/model/reservation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAuth(req);
    const { id } = await params;
    const body = await req.json();
    await connect();
    const reservation = await Reservation.findById(id);
    if (!reservation) return errorResponse("Reservation not found", 404);
    if (String(reservation.user) !== String(auth.userId)) {
      return errorResponse("Only the booking customer can submit a report", 403);
    }
    const canReport =
      Boolean(reservation.handover?.completedAt) &&
      !reservation.inspection?.receivedAt &&
      ["delivered", "rental_active"].includes(reservation.status);
    if (!canReport) {
      return errorResponse(
        "Vehicle reports can only be added after collection and before return",
        409,
      );
    }
    const note = String(body.note || "").trim();
    const imageUrl = String(body.imageUrl || "").trim();
    if (!note || note.length > 1000) {
      return errorResponse("Enter a note of 1,000 characters or fewer", 400);
    }
    if (!imageUrl) return errorResponse("Upload an image of the problem", 400);
    reservation.vehicleIssueNotes.push({
      note,
      imageUrl,
      status: "pending",
      createdAt: new Date(),
    });
    await reservation.save();
    return successResponse(reservation.vehicleIssueNotes.at(-1), 201);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : "Could not submit report",
      500,
    );
  }
}

export async function PATCH(
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
    if (!body.noteId || !["accepted", "refused"].includes(body.status)) {
      return errorResponse("Select a report and review decision", 400);
    }
    const reviewReason = String(body.reviewReason || "").trim();
    if (body.status === "refused" && !reviewReason) {
      return errorResponse("Enter a reason for refusing the report", 400);
    }
    await connect();
    const reservation = await Reservation.findById(id);
    if (!reservation) return errorResponse("Reservation not found", 404);
    const report = reservation.vehicleIssueNotes.id(body.noteId);
    if (!report) return errorResponse("Vehicle report not found", 404);
    if (report.status !== "pending") {
      return errorResponse("This report has already been reviewed", 409);
    }
    report.status = body.status;
    report.reviewReason = reviewReason || undefined;
    report.reviewedAt = new Date();
    report.reviewedBy = auth.userId;
    await reservation.save();
    return successResponse(report);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : "Could not review report",
      500,
    );
  }
}
