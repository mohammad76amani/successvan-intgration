"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

// Types
interface BlogPost {
  _id: string;
  slug: string;
  seo?: {
    seoTitle?: string;
    canonicalUrl?: string;
    publishDate?: string | number | Date;
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

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface BlogListingClientProps {
  initialBlogs: BlogPost[];
  initialPage: number;
  initialTotal: number;
  initialTotalPages: number;
}

export default function BlogListingClient({
  initialBlogs,
  initialPage,
  initialTotal,
  initialTotalPages,
}: BlogListingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialBlogs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const POSTS_PER_PAGE = 9;

  // Fetch new data when page changes (client-side navigation)
  useEffect(() => {
    // Skip initial load since we already have data
    if (isFirstLoad) {
      setIsFirstLoad(false);
      return;
    }

    const fetchBlogs = async () => {
      try {
        setLoading(true);
        cardsRef.current = [];

        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: POSTS_PER_PAGE.toString(),
          status: "published",
        });

        const response = await fetch(`/api/blog?${params.toString()}`);

        if (!response.ok) throw new Error("Failed to fetch blogs");

        const data = await response.json();
        setBlogPosts(data.blogs || []);
        setTotalPages(data.pages || 1);
      } catch (err) {
        console.log("Error fetching blogs:");
        setError("Failed to load blogs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [currentPage, isFirstLoad]);

  // GSAP Animation - Most reliable version for pagination
  useEffect(() => {
    if (loading || blogPosts.length === 0) {
      return;
    }

    cardsRef.current = cardsRef.current.slice(0, blogPosts.length);

    const ctx = gsap.context(() => {
      gsap.killTweensOf(cardsRef.current); // Clean up any previous animations

      gsap.fromTo(
        cardsRef.current.filter((el) => el !== null),
        { opacity: 0, y: 50, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.75,
          ease: "power3.out",
          stagger: 0.06,
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [blogPosts, loading]); // Re-run when new posts are loaded

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);

      // Update URL with new page number
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      router.push(`/blog?${params.toString()}`, { scroll: false });

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
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our <span className="text-[#fe9a00] ">Blog & Insight</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Discover the latest insights, tips, and updates from our team.
          </p>
        </div>

        {/* --- MAIN CONTENT AREA --- */}

        {loading ? (
          // 1. SKELETON LOADING GRID
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {blogPosts.map((post, index) => (
                <div
                  key={post._id}
                  ref={(el) => {
                    cardsRef.current[index] = el;
                  }}
                  className="will-change-transform"
                >
                  <BlogCard post={post} index={index} />
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

function BlogCardSkeleton() {
  return (
    <div className="h-full flex flex-col bg-slate-900/40 border border-slate-800/60 rounded-3xl overflow-hidden">
      <div className="h-60 w-full bg-slate-800 animate-pulse relative">
        <div className="absolute bottom-4 left-4 flex gap-2">
          <div className="w-20 h-7 bg-slate-700/50 rounded-full" />
          <div className="w-16 h-7 bg-slate-700/50 rounded-full" />
        </div>
      </div>
      <div className="p-6 sm:p-7 flex flex-col grow">
        <div className="h-7 bg-slate-800 rounded-md w-3/4 mb-3 animate-pulse" />
        <div className="h-7 bg-slate-800 rounded-md w-1/2 mb-6 animate-pulse" />
        <div className="h-4 bg-slate-800/50 rounded w-full mb-2 animate-pulse" />
        <div className="h-4 bg-slate-800/50 rounded w-full mb-2 animate-pulse" />
        <div className="h-4 bg-slate-800/50 rounded w-2/3 mb-auto animate-pulse" />
        <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between">
          <div className="h-5 w-24 bg-slate-800 rounded animate-pulse" />
          <div className="h-8 w-8 bg-slate-800 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function BlogCard({ post, index = 0 }: { post: BlogPost; index?: number }) {
  const title = post.seo?.seoTitle || post.content?.topic || "Untitled Post";
  const summaryRaw = post.content?.summary || "";
  const summary = summaryRaw.replace(/<[^>]+>/g, "");
  const image = post.media?.featuredImage || "/images/placeholder.jpg";
  const slug = post?.seo?.canonicalUrl || "#";
  const dateRaw = post?.seo?.publishDate || post?.createdAt;
  const date = dateRaw
    ? new Date(dateRaw).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <Link href={`/blog${slug}`} className="blog-card group block h-full">
      <article className="h-full flex flex-col bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-3xl overflow-hidden hover:border-orange-500/30 hover:shadow-[0_20px_40px_-15px_rgba(254,154,0,0.15)] transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-3">
        <div className="relative h-60 w-full overflow-hidden border-b border-gray-800">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover    group-hover:brightness-75"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/30 to-transparent" />
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
