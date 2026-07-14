"use client";

import { useState, useEffect } from "react";
import BlogDetailSkeleton from "./BlogDetailSkeleton";

interface BlogData {
  seoTitle?: string;
  title: string;
  author: string;
  createdAt: string;
  readTime?: number;
  image: string;
  content?: string;
  excerpt?: string;
  tags?: string[];
}

interface BlogDetailClientWrapperProps {
  initialBlog: BlogData | null;
  children: React.ReactNode;
}

export default function BlogDetailClientWrapper({
  initialBlog,
  children,
}: BlogDetailClientWrapperProps) {
  const [loading, setLoading] = useState(!initialBlog);
  const [blog] = useState<BlogData | null>(initialBlog);

  useEffect(() => {
    // Simulate loading for demo - in real app, this could be for additional data fetching
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading || !blog) {
    return (
      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 lg:pb-20">
        <BlogDetailSkeleton />
      </article>
    );
  }

  return <>{children}</>;
}
