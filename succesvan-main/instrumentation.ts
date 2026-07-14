/**
 * Next.js Instrumentation Hook
 * 
 * Runs once when the Next.js server starts.
 * Sets up a background interval to auto-publish scheduled blogs.
 * 
 * This replaces the need for an external cron service.
 * Checks every 60 seconds for blogs whose scheduledPublishDate has passed.
 */

export async function register() {
  // Only run on the server (not during build or on edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("📅 [Scheduler] Blog publish scheduler starting...");

    const INTERVAL_MS = 60 * 10000; // Check every 60 seconds

    const runPublishCheck = async () => {
      try {
        // Dynamic imports to avoid issues during build
        const mongoose = (await import("mongoose")).default;
        const connect = (await import("@/lib/data")).default;
        const Blog = (await import("@/model/blogs")).default;

        await connect();

        const now = new Date();

        // Find all scheduled blogs whose publish date has passed
        const blogsToPublish = await Blog.find({
          status: "scheduled",
          scheduledPublishDate: { $lte: now },
        });

        if (blogsToPublish.length === 0) return;

        for (const blog of blogsToPublish) {
          try {
            blog.status = "published";
            blog.seo.publishDate = blog.scheduledPublishDate || now;
            blog.scheduledPublishDate = null;
            await blog.save();
            console.log(
              `✅ [Scheduler] Published blog: ${blog.seo?.seoTitle || blog.content?.topic || blog._id}`
            );
          } catch (err: any) {
            console.error(
              `❌ [Scheduler] Failed to publish blog ${blog._id}:`,
              err.message
            );
          }
        }

        console.log(`📅 [Scheduler] Published ${blogsToPublish.length} blog(s)`);
      } catch (error: any) {
        // Silently fail - don't crash the server
        console.error("[Scheduler] Error checking scheduled blogs:", error.message);
      }
    };

    // Run immediately on server start
    setTimeout(runPublishCheck, 5000); // 5s delay to let DB connect

    // Then run every 60 seconds
    setInterval(runPublishCheck, INTERVAL_MS);

    console.log("📅 [Scheduler] Blog publish scheduler active (checking every 60s)");
  }
}
