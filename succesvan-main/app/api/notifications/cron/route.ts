import { NextRequest } from "next/server";
import connect from "@/lib/data";
import Notification from "@/model/notification";
import { sendSMS } from "@/lib/sms";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return errorResponse("Unauthorized", 401);
    }

    await connect();

    const now = new Date();
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);
    const hourEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 59, 59);

    const dueNotifications = await Notification.find({
      status: "pending",
      scheduledFor: { $gte: hourStart, $lte: hourEnd },
    }).limit(50);

    console.log(`[CRON] Found ${dueNotifications.length} pending notifications`);

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      deleted: 0,
    };

    for (const notification of dueNotifications) {
      results.processed++;
      console.log(`[CRON] Processing notification ${notification._id} to ${notification.phoneNumber}`);

      try {
        await sendSMS(
          notification.phoneNumber.replace("+", ""),
          notification.message
        );
        console.log(`[CRON] SMS sent successfully to ${notification.phoneNumber}`);

        // Delete reminder notifications after sending
        if (notification.type === "reservation_reminder") {
          await notification.deleteOne();
          results.deleted++;
        } else {
          notification.status = "sent";
          notification.sentAt = new Date();
          await notification.save();
        }
        results.sent++;
      } catch (error) {
        console.log(`[CRON] SMS failed to ${notification.phoneNumber}:`, error);
        notification.status = "failed";
        notification.error =
          error instanceof Error ? error.message : "Unknown error";
        await notification.save();
        results.failed++;
      }
    }

    console.log(`[CRON] Results:`, results);
    return successResponse(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
