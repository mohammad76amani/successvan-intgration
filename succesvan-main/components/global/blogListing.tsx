"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import {
  FiCalendar,
  FiClock,
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
} from "react-icons/fi";
import Image from "next/image";
import Link from "next/link";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ... (Interfaces remain the same) ...
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface BlogPost {
  _id: string;
  slug: string;
  seo?: {
    seoTitle?: string;
    canonicalUrl?: string;
    publishDate:string | number | Date;
  };
  content?: {
    topic?: string;
    summary?: string;
  };
  media?: {
    featuredImage?: string;
  };
  readingTime?: number;
  createdAt: string;
}

export default function BlogListing() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const POSTS_PER_PAGE = 9;

  // ... (Fetch logic remains the same) ...
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        // Reset animation refs
        cardsRef.current = [];

        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: POSTS_PER_PAGE.toString(),
          status: 'published',
        });
        
        const response = await fetch(`/api/blog?${params.toString()}`);

        if (!response.ok) throw new Error("Failed to fetch blogs");

        const data = await response.json();
        setBlogPosts(data.blogs || []);
        setTotalPosts(data.total || (data.blogs ? data.blogs.length : 0));
      } catch (err) {
        console.log("Error fetching blogs:", err);
        setError("Failed to load blogs. Please try again later.");
      } finally {
        // Add a tiny artificial delay if fetch is too fast to prevent flashing
        // or just set loading false immediately
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [currentPage]);

  // ... (Animation Logic remains the same) ...
  useEffect(() => {
    if (!loading && blogPosts.length > 0) {
      const ctx = gsap.context(() => {
        cardsRef.current.forEach((card, index) => {
          if (card) {
            gsap.fromTo(
              card,
              { opacity: 0, y: 50, rotationX: 10 },
              {
                opacity: 1,
                y: 0,
                rotationX: 0,
                duration: 0.8,
                ease: "power3.out",
                delay: index * 0.1,
                scrollTrigger: {
                  trigger: card,
                  start: "top 90%",
                },
              },
            );
          }
        });
      }, sectionRef);
      return () => ctx.revert();
    }
  }, [loading, blogPosts]);

  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Smooth scroll to top of section
      sectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      ref={sectionRef}
      className="py-20 bg-linear-to-br from-slate-900 via-slate-900 to-slate-950 relative overflow-hidden min-h-screen"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center my-16 md:my-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our <span className="text-[#fe9a00] ">Blog</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Discover the latest insights, tips, and updates from our team.
          </p>
        </div>

        {/* --- MAIN CONTENT AREA --- */}

        {loading ? (
          // 1. SKELETON LOADING GRID
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Generate 6 skeletons to fill the view */}
            {Array.from({ length: 6 }).map((_, index) => (
              <BlogCardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          // 2. ERROR STATE
          <div className="text-center text-red-400 py-12 bg-slate-900/50 rounded-2xl border border-red-500/20">
            <p className="text-lg font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : blogPosts.length === 0 ? (
          // 3. EMPTY STATE
          <div className="flex flex-col items-center justify-center py-20 px-6   rounded-3xl   backdrop-blur-sm">
            <div className="mb-6 p-4 rounded-full bg-slate-800/50 border border-slate-700/50">
              <FiFileText className="w-12 h-12 text-[#fe9a00]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              No Blog Posts Yet
            </h3>
            <p className="text-slate-400 text-center max-w-md mb-6">
              We're working on creating amazing content for you. Check back
              soon!
            </p>
          </div>
        ) : (
          // 4. ACTUAL DATA GRID
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-1000">
              {blogPosts.map((post, index) => (
                <div
                  key={post._id}
                  ref={(el) => {
                    cardsRef.current[index] = el;
                  }} // Attach ref for GSAP
                >
                  <BlogCard post={post} />
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-20">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

// --- Components ---

// NEW: Skeleton Component
function BlogCardSkeleton() {
  return (
    <div className="h-full flex flex-col bg-slate-900/40 border border-slate-800/60 rounded-3xl overflow-hidden">
      {/* Image Skeleton */}
      <div className="h-60 w-full bg-slate-800 animate-pulse relative">
        <div className="absolute bottom-4 left-4 flex gap-2">
          {/* Chips Skeleton */}
          <div className="w-20 h-7 bg-slate-700/50 rounded-full" />
          <div className="w-16 h-7 bg-slate-700/50 rounded-full" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-6 sm:p-7 flex flex-col grow">
        {/* Title Lines */}
        <div className="h-7 bg-slate-800 rounded-md w-3/4 mb-3 animate-pulse" />
        <div className="h-7 bg-slate-800 rounded-md w-1/2 mb-6 animate-pulse" />

        {/* Summary Lines */}
        <div className="h-4 bg-slate-800/50 rounded w-full mb-2 animate-pulse" />
        <div className="h-4 bg-slate-800/50 rounded w-full mb-2 animate-pulse" />
        <div className="h-4 bg-slate-800/50 rounded w-2/3 mb-auto animate-pulse" />

        {/* Footer Skeleton */}
        <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between">
          <div className="h-5 w-24 bg-slate-800 rounded animate-pulse" />
          <div className="h-8 w-8 bg-slate-800 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function BlogCard({ post }: { post: BlogPost }) {
  const title = post.seo?.seoTitle || post.content?.topic || "Untitled Post";
  const summaryRaw = post.content?.summary || "";
  const summary = summaryRaw.replace(/<[^>]+>/g, "");
  const image = post.media?.featuredImage || "/images/placeholder.jpg";
  const slug = post?.seo?.canonicalUrl || "#";
  const date = new Date(post.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={`/blog/${slug}`} className="blog-card group block h-full">
      <article className="h-full flex flex-col bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-3xl overflow-hidden hover:border-orange-500/10 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 ease-out hover:-translate-y-2">
        <div className="relative h-60 w-full overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-all duration-700 group-hover:brightness-75"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/70 backdrop-blur-sm rounded-full border border-slate-700/50">
              <FiCalendar className="text-[#fe9a00]" size={12} />
              <span className="text-xs font-medium text-slate-200">{date}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/70 backdrop-blur-sm rounded-full border border-slate-700/50">
              <FiClock className="text-[#fe9a00]" size={12} />
              <span className="text-xs font-medium text-slate-200">
                {post.readingTime || 5} min
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col grow p-6 sm:p-7">
          <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-[#fe9a00] transition-colors">
            {title}
          </h3>
          <p className="text-slate-500 text-sm line-clamp-2 mb-6 grow leading-relaxed">
            {summary}
          </p>
          <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-white group-hover:text-[#fe9a00] transition-colors">
              Read Article
            </span>
            <span className="p-2 rounded-full bg-slate-800 text-white group-hover:bg-[#fe9a00] group-hover:text-white transition-all duration-300">
              <FiArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ... (Pagination component remains the same) ...
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const getPageNumbers = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }
    for (let i of range) {
      if (l) {
        if (i - l === 2) rangeWithDots.push(l + 1);
        else if (i - l !== 1) rangeWithDots.push("...");
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  };

  return (
    <div className="flex justify-center items-center gap-2 select-none">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 text-slate-300 hover:bg-orange-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-800 transition-all border border-slate-700 hover:border-orange-500"
      >
        <FiChevronLeft className="w-5 h-5" />
      </button>
      {getPageNumbers().map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === "number" && onPageChange(page)}
          disabled={page === "..."}
          className={`flex items-center justify-center w-10 h-10 rounded-xl font-medium transition-all ${
            page === currentPage
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
              : page === "..."
                ? "bg-transparent text-slate-500 cursor-default"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 text-slate-300 hover:bg-orange-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-800 transition-all border border-slate-700 hover:border-orange-500"
      >
        <FiChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
