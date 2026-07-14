import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/data";
import Blog from "@/model/blogs";

/**
 * GET /api/cron/publish-blogs
 * 
 * Worker/cron endpoint that publishes all scheduled blogs whose
 * scheduledPublishDate has passed.
 * 
 * This endpoint should be called periodically by a cron service:
 * - AWS EventBridge (CloudWatch Events) if deployed on Amplify
 * - Vercel Cron if deployed on Vercel
 * - External cron service (e.g., cron-job.org, UptimeRobot)
 * - Or called from the admin dashboard on load
 * 
 * Security: Uses a CRON_SECRET header to prevent unauthorized access.
 * Set CRON_SECRET in your .env.local file.
 * 
 * If no CRON_SECRET is set, the endpoint works without auth (for dev).
 */

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret if configured
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { message: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    await connect();

    const now = new Date();

    // Find all scheduled blogs whose publish date has passed
    const blogsToPublish = await Blog.find({
      status: "scheduled",
      scheduledPublishDate: { $lte: now },
    });

    if (blogsToPublish.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: "No blogs to publish",
          published: 0,
        },
        { status: 200 }
      );
    }

    // Publish each blog
    const publishedIds: string[] = [];
    const errors: string[] = [];

    for (const blog of blogsToPublish) {
      try {
        blog.status = "published";
        blog.seo.publishDate = blog.scheduledPublishDate || now;
        blog.scheduledPublishDate = null;
        await blog.save();
        publishedIds.push(blog._id.toString());
        console.log(`✅ [Cron] Published blog: ${blog.seo?.seoTitle || blog.content?.topic || blog._id}`);
      } catch (err: any) {
        console.error(`❌ [Cron] Failed to publish blog ${blog._id}:`, err.message);
        errors.push(`${blog._id}: ${err.message}`);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Published ${publishedIds.length} blog(s)`,
        published: publishedIds.length,
        publishedIds,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Cron] Publish blogs error:", error);
    return NextResponse.json(
      { message: "Error running publish cron", error: error.message },
      { status: 500 }
    );
  }
}
