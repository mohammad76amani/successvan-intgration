import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/data";
import Blog from "@/model/blogs";
import Jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
interface CustomJwtPayload extends JwtPayload {
  storeId: string;
}

export async function POST(req: Request) {
  const BlogData = await req.json();

  try {
    await connect();
    if (!connect) {
      console.log("POST_ERROR", "Database connection failed");
      return new NextResponse("Database connection error", { status: 500 });
    }
    const newBlog = new Blog(BlogData);
    console.log(newBlog);

    await newBlog.save();
    console.log("POST_SUCCESS", "Blog created successfully");
    return NextResponse.json(newBlog, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Error logging in", error },
      { status: 500 },
    );
  }
}

export const GET = async (req: NextRequest) => {
  await connect();
  if (!connect) {
    return new NextResponse("Database connection error", { status: 500 });
  }

  try {
    // Parse query parameters for pagination and filtering
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "seo.publishDate";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build query filter
    const filter: any = {};

    if (search) {
      filter.$or = [
        { "content.topic": { $regex: search, $options: "i" } },
        { "seo.seoTitle": { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    if (
      status &&
      ["draft", "published", "archived", "scheduled"].includes(status)
    ) {
      filter["status"] = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with pagination
    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .select(
          "_id slug status scheduledPublishDate views readingTime wordCount createdAt updatedAt seo.canonicalUrl seo.seoTitle seo.publishDate content.topic content.compiledHtml content.summary media.featuredImage generationProgress.currentStep",
        ),
      Blog.countDocuments(filter),
    ]);

    return NextResponse.json(
      {
        blogs,
        total, // ← Add this
        page,
        pages: Math.ceil(total / limit), // ← Add this (or totalPages)
        limit,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log("GET_BLOGS_ERROR", error);
    return NextResponse.json(
      { message: "Error fetching blogs", error },
      { status: 500 },
    );
  }
};

export const DELETE = async (req: NextRequest) => {
  const id = req.headers.get("id");

  if (!id) {
    return new NextResponse("Blog ID is required", { status: 400 });
  }
  await connect();
  if (!connect) {
    return new NextResponse("Database connection error", { status: 500 });
  }

  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const decodedToken = Jwt.decode(token) as CustomJwtPayload;
  if (!decodedToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const blogId = id;
  if (!blogId) {
    return new NextResponse("Blog ID is required", { status: 400 });
  }
  console.log(blogId);

  await Blog.findByIdAndDelete({ _id: id });
  return new NextResponse(
    JSON.stringify({ message: "Blog deleted successfully" }),
    { status: 200 },
  );
};

export async function PATCH(req: NextRequest) {
  const id = req.headers.get("id");

  if (!id) {
    return new NextResponse("Blog ID is required", { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Invalid blog ID format" },
      { status: 400 },
    );
  }

  await connect();
  if (!connect) {
    return new NextResponse("Database connection error", { status: 500 });
  }

  try {
    const body = await req.json();
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = Jwt.decode(token) as CustomJwtPayload;

    // Check if status is being changed to published
    const isPublishing = body.status === "published";

    // Only update seo.publishDate if publishing and not already set
    if (isPublishing) {
      const existingBlog = await Blog.findById(id);
      if (existingBlog && !existingBlog.seo?.publishDate) {
        body.seo = { ...body.seo, publishDate: new Date() };
      }
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      body,
      { new: true },
    );

    if (!updatedBlog) {
      return NextResponse.json({ message: "Blog not found" }, { status: 404 });
    }

    // Revalidate blog pages to show updated content immediately
    try {
      revalidatePath('/blog');
      if (updatedBlog.slug) {
        revalidatePath(`/blog/${updatedBlog.slug}`);
      }
      if (updatedBlog.seo?.canonicalUrl) {
        revalidatePath(`/blog${updatedBlog.seo.canonicalUrl}`);
      }
    } catch (revalidateError) {
      console.log('Revalidation warning:', revalidateError);
    }

    return NextResponse.json(updatedBlog, { status: 200 });
  } catch (error) {
    console.log("PATCH_ERROR", id, error);
    return NextResponse.json(
      { message: "Error updating blog" },
      { status: 500 },
    );
  }
}
