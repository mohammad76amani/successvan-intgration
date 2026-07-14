import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/data";
import Blog from "@/model/blogs";
import { requireAuth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/roles";

/**
 * POST /api/blog/schedule
 * Schedule a blog for future publishing.
 * 
 * Body: { blogId: string, scheduledPublishDate: string (ISO date) }
 * - Sets blog status to "scheduled" and stores the publish date
 * 
 * DELETE /api/blog/schedule
 * Cancel a scheduled publish and revert blog to draft.
 * 
 * Body: { blogId: string }
 */

export async function POST(req: NextRequest) {
  try {
    // Verify dashboard access
    const auth = requireAuth(req);
    if (!canAccessDashboard(auth.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    await connect();

    const { blogId, scheduledPublishDate } = await req.json();

    if (!blogId || !scheduledPublishDate) {
      return NextResponse.json(
        { message: "blogId and scheduledPublishDate are required" },
        { status: 400 }
      );
    }

    const publishDate = new Date(scheduledPublishDate);
    if (isNaN(publishDate.getTime())) {
      return NextResponse.json(
        { message: "Invalid date format" },
        { status: 400 }
      );
    }

    if (publishDate <= new Date()) {
      return NextResponse.json(
        { message: "Scheduled date must be in the future" },
        { status: 400 }
      );
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return NextResponse.json(
        { message: "Blog not found" },
        { status: 404 }
      );
    }

    // Update blog to scheduled status
    blog.status = "scheduled";
    blog.scheduledPublishDate = publishDate;
    await blog.save();

    return NextResponse.json(
      {
        success: true,
        message: `Blog scheduled for ${publishDate.toISOString()}`,
        data: {
          _id: blog._id,
          status: blog.status,
          scheduledPublishDate: blog.scheduledPublishDate,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Schedule blog error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { message: "Error scheduling blog", error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Verify dashboard access
    const auth = requireAuth(req);
    if (!canAccessDashboard(auth.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    await connect();

    const { blogId } = await req.json();

    if (!blogId) {
      return NextResponse.json(
        { message: "blogId is required" },
        { status: 400 }
      );
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return NextResponse.json(
        { message: "Blog not found" },
        { status: 404 }
      );
    }

    if (blog.status !== "scheduled") {
      return NextResponse.json(
        { message: "Blog is not scheduled" },
        { status: 400 }
      );
    }

    // Revert to draft
    blog.status = "draft";
    blog.scheduledPublishDate = null;
    await blog.save();

    return NextResponse.json(
      {
        success: true,
        message: "Schedule cancelled, blog reverted to draft",
        data: {
          _id: blog._id,
          status: blog.status,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Cancel schedule error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { message: "Error cancelling schedule", error: message },
      { status: 500 }
    );
  }
}
