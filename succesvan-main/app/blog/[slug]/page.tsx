import { Metadata, ResolvingMetadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Script from "next/script";
import {
  fetchBlogBySlug,
  fetchAllBlogs,
  generateBlogSchema,
  generateBreadcrumbSchema,
  generateOrganizationSchema,
} from "@/lib/blog-utils";
import BlogDetailClient from "@/components/blog/BlogDetailClient";
import BlogDetailSkeleton from "@/components/blog/BlogDetailSkeleton";
import { FiCalendar, FiUser, FiClock } from "react-icons/fi";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  try {
    const blogs = await fetchAllBlogs();
    return blogs.map((blog) => ({
      slug: blog.slug,
    }));
  } catch {
    return [];
  }
}

// Enable ISR with revalidation
export const revalidate = 60; // Revalidate every 60 seconds

// Generate metadata for blog post
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const resolvedParams = await params;
  const blog = await fetchBlogBySlug(resolvedParams.slug);

  if (!blog) {
    return {
      title: "Blog Post Not Found",
      description: "The blog post you are looking for does not exist.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://successvanhire.co.uk";

  const canonicalUrl = `${siteUrl}/blog/${resolvedParams.slug}`;

  return {
    title: blog.seoTitle || blog.title,
    description: blog.excerpt,

    alternates: {
      canonical: canonicalUrl,
    },

    keywords: [
      "van hire london",
      "moving tips",
      "van rental",
      blog.title,
      ...blog.title.split(" ").slice(0, 3),
    ],

    authors: [{ name: blog.author }],
    creator: blog.author,
    publisher: "Success Van Hire",

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },

    openGraph: {
      type: "article",
      title: blog.seoTitle || blog.title,
      description: blog.excerpt,
      url: canonicalUrl,
      siteName: "Success Van Hire",
      images: [
        {
          url: blog.image,
          width: 1200,
          height: 630,
          alt: blog.title,
          type: "image/jpeg",
        },
      ],
      authors: [blog.author],
      publishedTime: blog.createdAt,
      modifiedTime: blog.updatedAt,
      tags: ["van hire", "moving", blog.category],
    },

    twitter: {
      card: "summary_large_image",
      title: blog.seoTitle || blog.title,
      description: blog.seo?.seoDescription || blog.excerpt,
      images: [blog.image],
      creator: "@successvanhire",
      site: "@successvanhire",
    },

    metadataBase: new URL(siteUrl),
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const blog = await fetchBlogBySlug(resolvedParams.slug);

  if (!blog) {
    notFound();
  }

  // Debug: log content length to help diagnose empty content issues
  try {
    console.log(
      `[Blog Page] Fetched blog "${blog.title}" content length: ${String(blog.content || "").length}`,
    );
  } catch (e) {
    // ignore logging errors
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://successvanhire.co.uk";
  const blogSchema = generateBlogSchema(blog, siteUrl);
  const breadcrumbSchema = generateBreadcrumbSchema(siteUrl, blog.title);
  const organizationSchema = generateOrganizationSchema(siteUrl);

  const publishedDate = new Date(blog.seo.publishDate).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <>
      <Script
        id="blog-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
        strategy="beforeInteractive"
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        strategy="beforeInteractive"
      />
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        strategy="beforeInteractive"
      />

      <main className="min-h-screen bg-white">
        <Suspense
          fallback={
            <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 lg:pb-20">
              <BlogDetailSkeleton />
            </article>
          }
        >
          {/* Blog Detail Content */}
          <article className="bg-linear-to-b from-[#0f172b] via-slate-900 to-[#20283a]">
            {/* Header Section */}
            <header className=" pt-36  ">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 lg:pb-20">
                <h1 className="text-2xl lg:text-5xl font-black text-white mb-6 leading-tight">
                  {blog.seoTitle}
                </h1>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-3 md:gap-6 text-gray-400 pb-6 border-b border-white/20 text-sm md:text-base">
                  <div className="flex items-center gap-2">
                    <FiCalendar className="w-5 h-5 text-[#fe9a00]" />
                    <span>
                      Published:{" "}
                      <span className="text-white font-semibold">
                        {publishedDate}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FiUser className="w-5 h-5 text-[#fe9a00]" />
                    <span>
                      By:{" "}
                      <span className="text-white font-semibold">
                        {blog.author}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FiClock className="w-5 h-5 text-[#fe9a00]" />
                    <span>
                      <span className="text-white font-semibold">
                        {blog.readTime}
                      </span>{" "}
                      min read
                    </span>
                  </div>
                </div>
              </div>
            </header>
            <div
              className="max-w-7xl mx-auto rounded-xl px-4 sm:px-6 lg:px-8 pb-12 pt-6 md:pt-0"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                backgroundImage:
                  "linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                boxShadow:
                  "0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
              }}
            >
              {" "}
              {/* Featured Image */}
              <div className="md:mb-12 mb-6 rounded-2xl overflow-hidden bg-slate-800/50">
                <Image
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-auto object-cover rounded-2xl shadow-2xl"
                  style={{ aspectRatio: "16/9", minHeight: "200px" }}
                  loading="eager"
                  width={1000}
                  height={1000}
                  decoding="async"
                  fetchPriority="high"
                />
              </div>
              {/* Blog Content */}
              {(!blog.content || blog.content.trim() === "") && (
                <div className="mb-6 p-4 rounded-lg bg-yellow-900/20 border border-yellow-800 text-yellow-200">
                  ⚠️ This article has no compiled HTML. Showing available
                  summary/sections instead.
                </div>
              )}
              <BlogDetailClient content={blog.content || blog.excerpt || ""} />
              {/* Tags Section */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-white/20">
                  <h4 className="text-black font-bold text-lg mb-4">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {blog.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-[#fe9a00]/20 text-[#fe9a00] px-3 py-1 rounded-full text-sm font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>
        </Suspense>
      </main>
    </>
  );
}
