import { NextRequest, NextResponse } from "next/server";
import Blog from "@/model/blogs";
import connect from "@/lib/data";

/**
 * GET /api/blog/[id]
 * Get a single blog by ID or slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  console.log("📖 [Blog API] Fetching blog:", resolvedParams.id);

  try {
    await connect();

    // Normalize identifier
    const rawId = String(resolvedParams.id || "").trim();
    const decodedId = decodeURIComponent(rawId);

    // Try to find by MongoDB ID first
    let blog = await Blog.findById(decodedId).catch(() => null);

    // Try slug second
    if (!blog) {
      blog = await Blog.findOne({ slug: decodedId }).catch(() => null);
    }

    // Try seo.canonicalUrl variants (supports full URL, pathname, or relative path)
    if (!blog) {
      const candidates: string[] = [decodedId];

      // If it's a full URL, extract pathname
      try {
        if (/^https?:\/\//i.test(decodedId)) {
          const u = new URL(decodedId);
          candidates.push(u.href, u.pathname, u.pathname.replace(/\/$/, ""));

          // Also construct a site-prefix version if NEXT_PUBLIC_SITE_URL is set
          const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
          if (siteUrl) candidates.push(`${siteUrl}${u.pathname}`);
        }
      } catch (e) {
        // Not a full URL, ignore
      }

      // Try exact matches first
      for (const c of Array.from(new Set(candidates))) {
        blog = await Blog.findOne({ "seo.canonicalUrl": c }).catch(() => null);
        if (blog) break;
      }

      // As a final attempt, try a case-insensitive ends-with match (helps if stored with/without host)
      if (!blog) {
        const last = decodedId.split("/").filter(Boolean).pop();
        if (last) {
          blog = await Blog.findOne({ "seo.canonicalUrl": { $regex: `${last}$`, $options: "i" } }).catch(() => null);
        }
      }
    }

    if (!blog) {
      return NextResponse.json(
        { success: false, error: "Blog not found" },
        { status: 404 }
      );
    }

    // Increment view count
    blog.views += 1;
    await blog.save();

    console.log(`✅ [Blog API] Blog found: ${blog.seo.seoTitle}`);
    console.log(`   - Views: ${blog.views}`);
    console.log(`   - Reading time: ${blog.readingTime} min`);

    return NextResponse.json({
      success: true,
      blog
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.log("❌ [Blog API] Error:", message);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/blog/[id]
 * Partially update a blog (useful for status changes, publish, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  console.log("🔧 [Blog API] Patching blog:", resolvedParams.id);

  try {
    await connect();

    const body = await request.json();
    
    const blog = await Blog.findById(resolvedParams.id);

    if (!blog) {
      return NextResponse.json(
        { success: false, error: "Blog not found" },
        { status: 404 }
      );
    }

    // Apply updates
    Object.keys(body).forEach(key => {
      if (body[key] !== undefined) {
        (blog as any)[key] = body[key];
      }
    });

    // Auto-set seo.publishDate when status changes to "published" for the first time
    if (body.status === "published" && !blog.seo.publishDate) {
      blog.seo.publishDate = new Date();
    }

    await blog.save();

    console.log(`✅ [Blog API] Blog patched: ${blog._id}`);

    return NextResponse.json({
      success: true,
      blog,
      message: "Blog updated successfully"
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.log("❌ [Blog API] Error:", message);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
