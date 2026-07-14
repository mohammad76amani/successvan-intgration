import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/data";
import Blog from "@/model/blogs";

/**
 * GET /api/blog/list
 * 
 * Returns a list of blogs with minimal fields for AI content generation.
 * Used to provide blog linking context when generating new content.
 * 
 * Query parameters:
 * - status: Filter by blog status (default: "published")
 * 
 * Response: { blogs: [{ slug, topic, summary, conclusion }] }
 */
export const GET = async (req: NextRequest) => {
  await connect();
  
  if (!connect) {
    return new NextResponse("Database connection error", { status: 500 });
  }

  try {
    // Read status query parameter (default to "published")
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "published";

    // Fetch blogs filtered by status with minimal fields for AI context
    const blogs = await Blog.find({ status })
      .sort({ createdAt: -1 })
      .select("slug content.topic content.summary content.conclusion")
      .lean();

    // Transform to simpler format for AI context
    const blogList = blogs
      .filter((blog) => blog.content?.topic) // Only include blogs with content
      .map((blog) => ({
        slug: blog.slug,
        topic: blog.content?.topic || "",
        summary: blog.content?.summary || "",
        conclusion: blog.content?.conclusion || "",
      }));

    return NextResponse.json({ blogs: blogList });
  } catch (error) {
    console.error("Error fetching blog list:", error);
    return NextResponse.json(
      { message: "Error fetching blog list", error: String(error) },
      { status: 500 }
    );
  }
};
