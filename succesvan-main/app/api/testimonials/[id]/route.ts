import { NextRequest } from "next/server";
import connect from "@/lib/data";
import Testimonial from "@/model/testimonial";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect();
    const { status, link } = await req.json();
    const { id } = await params;

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (link !== undefined) updateData.link = link;

    const testimonial = await Testimonial.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!testimonial) {
      return errorResponse("Testimonial not found", 404);
    }

    return successResponse(testimonial);
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
    const testimonial = await Testimonial.findByIdAndDelete(id);

    if (!testimonial) {
      return errorResponse("Testimonial not found", 404);
    }

    return successResponse({ message: "Testimonial deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 400);
  }
}
