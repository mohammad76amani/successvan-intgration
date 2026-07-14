import connect from "@/lib/data";
import { successResponse, errorResponse } from "@/lib/api-response";
import Announcement from "@/model/announcement";

export async function GET() {
  try {
    await connect();
    
    // First, fix any existing multiple active announcements
    const activeAnnouncements = await Announcement.find({ isActive: true }).sort({ createdAt: -1 });
    
    if (activeAnnouncements.length > 1) {
      // Keep only the most recent one active
      const toDeactivate = activeAnnouncements.slice(1);
      for (const ann of toDeactivate) {
        await Announcement.findByIdAndUpdate(ann._id, { isActive: false });
      }
    }
    
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    return successResponse(announcements);
  } catch (error) {
    console.log("Error fetching announcements:", error);
    return errorResponse("Failed to fetch announcements");
  }
}

export async function POST(req: Request) {
  try {
    await connect();
    const body = await req.json();
    const { text, link, textColor, backgroundColor, isActive } = body;

    if (!text?.trim()) {
      return errorResponse("Text is required");
    }

    // If this announcement is being set to active, deactivate all others
    if (isActive === true) {
      await Announcement.updateMany(
        { isActive: true },
        { $set: { isActive: false } }
      );
    }

    const announcement = new Announcement({
      text,
      link: link || "",
      textColor: textColor || "#ffffff",
      backgroundColor: backgroundColor || "#fe9a00",
      isActive: isActive !== undefined ? isActive : true,
    });

    await announcement.save();
    return successResponse(announcement);
  } catch (error) {
    console.log("Error creating announcement:", error);
    return errorResponse("Failed to create announcement");
  }
}
