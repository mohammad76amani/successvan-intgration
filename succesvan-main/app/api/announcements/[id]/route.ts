import connect from "@/lib/data";
import { successResponse, errorResponse } from "@/lib/api-response";
import Announcement from "@/model/announcement";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect();
    const { id } = await params;
    const body = await req.json();

    // If this announcement is being set to active, deactivate all others
    if (body.isActive === true) {
      await Announcement.updateMany(
        { _id: { $ne: id }, isActive: true },
        { $set: { isActive: false } }
      );
    }

    const announcement = await Announcement.findByIdAndUpdate(id, body, {
      new: true,
    });

    if (!announcement) {
      return errorResponse("Announcement not found");
    }

    return successResponse(announcement);
  } catch (error) {
    console.log("Error updating announcement:", error);
    return errorResponse("Failed to update announcement");
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect();
    const { id } = await params;

    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      return errorResponse("Announcement not found");
    }

    return successResponse(announcement);
  } catch (error) {
    console.log("Error deleting announcement:", error);
    return errorResponse("Failed to delete announcement");
  }
}
