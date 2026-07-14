import { NextRequest } from "next/server";
import connect from "@/lib/data";
import Office from "@/model/office";
import Vehicle from "@/model/vehicle";
import Category from "@/model/category";
import { successResponse, errorResponse } from "@/lib/api-response";
import { normalizeOfficePayload } from "@/lib/officePayload";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect();
    const { id } = await params;
   
    const office = await Office.findById(id).populate([
      { path: "vehicles.vehicle", model: Vehicle },
      { path: "categories", model: Category },
    ]);
    if (!office) return errorResponse("Office not found", 404);
    return successResponse(
      normalizeOfficePayload(office.toObject() as Record<string, unknown>)
    );
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
    const body = normalizeOfficePayload(
      (await req.json()) as Record<string, unknown>
    );
    const office = await Office.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).populate([
      { path: "vehicles.vehicle", model: Vehicle },
      { path: "categories", model: Category },
    ]);
    if (!office) return errorResponse("Office not found", 404);
    return successResponse(
      normalizeOfficePayload(office.toObject() as Record<string, unknown>)
    );
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
    const office = await Office.findByIdAndDelete(id);
    if (!office) return errorResponse("Office not found", 404);
    return successResponse({ message: "Office deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
