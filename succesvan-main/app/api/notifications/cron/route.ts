import { NextRequest } from "next/server";
import connect from "@/lib/data";
import Notification from "@/model/notification";
import { sendSMS } from "@/lib/sms";
import { successResponse, errorResponse } from "@/lib/api-response";

const MAX_ATTEMPTS = 3;
const STALE_CLAIM_MS = 15 * 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return errorResponse("Unauthorized", 401);
    }

    await connect();

    const now = new Date();
    const staleBefore = new Date(now.getTime() - STALE_CLAIM_MS);

    // A crashed cron invocation must not leave a reminder locked forever.
    await Notification.updateMany(
      {
        status: "processing",
        claimedAt: { $lte: staleBefore },
        attempts: { $lt: MAX_ATTEMPTS },
      },
      { $set: { status: "pending", claimedAt: null } },
    );
    await Notification.updateMany(
      {
        status: "processing",
        claimedAt: { $lte: staleBefore },
        attempts: { $gte: MAX_ATTEMPTS },
      },
      {
        $set: {
          status: "failed",
          claimedAt: null,
          error: "Processing claim expired after maximum attempts",
        },
      },
    );

    const dueNotifications = await Notification.find({
      status: "pending",
      scheduledFor: { $lte: now },
      attempts: { $lt: MAX_ATTEMPTS },
    })
      .sort({ scheduledFor: 1 })
      .select("_id")
      .limit(50);

    console.log(`[CRON] Found ${dueNotifications.length} pending notifications`);

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      deleted: 0,
    };

    for (const dueNotification of dueNotifications) {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: dueNotification._id,
          status: "pending",
          scheduledFor: { $lte: now },
          attempts: { $lt: MAX_ATTEMPTS },
        },
        {
          $set: { status: "processing", claimedAt: new Date() },
          $inc: { attempts: 1 },
        },
        { new: true },
      );
      if (!notification) continue;

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
          await Notification.updateOne(
            { _id: notification._id, status: "processing" },
            {
              $set: { status: "sent", sentAt: new Date(), claimedAt: null },
              $unset: { error: 1 },
            },
          );
        }
        results.sent++;
      } catch (error) {
        console.log(`[CRON] SMS failed to ${notification.phoneNumber}:`, error);
        const reachedAttemptLimit = notification.attempts >= MAX_ATTEMPTS;
        await Notification.updateOne(
          { _id: notification._id, status: "processing" },
          {
            $set: {
              status: reachedAttemptLimit ? "failed" : "pending",
              claimedAt: null,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          },
        );
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
