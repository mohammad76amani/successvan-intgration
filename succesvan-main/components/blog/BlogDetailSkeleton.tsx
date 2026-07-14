"use client";

export default function BlogDetailSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header Section Skeleton */}
      <div className="mb-12 pt-26">
        <div className="h-10 lg:h-16 bg-slate-800 rounded-lg w-3/4 mb-6" />
        
        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-3 md:gap-6 pb-6 border-b border-white/20">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-slate-700 rounded" />
            <div className="h-5 bg-slate-700 rounded w-32" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-slate-700 rounded" />
            <div className="h-5 bg-slate-700 rounded w-24" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-slate-700 rounded" />
            <div className="h-5 bg-slate-700 rounded w-16" />
          </div>
        </div>
      </div>

      {/* Featured Image Skeleton */}
      <div className="mb-12 rounded-2xl overflow-hidden">
        <div className="w-full h-64 lg:h-96 bg-slate-800 rounded-2xl" />
      </div>

      {/* Blog Content Skeleton */}
      <div className="space-y-4">
        <div className="h-4 bg-slate-800 rounded w-full" />
        <div className="h-4 bg-slate-800 rounded w-5/6" />
        <div className="h-4 bg-slate-800 rounded w-4/6" />
        <div className="h-6 bg-slate-800 rounded w-1/2 mt-6" />
        <div className="h-4 bg-slate-800 rounded w-full" />
        <div className="h-4 bg-slate-800 rounded w-5/6" />
        <div className="h-4 bg-slate-800 rounded w-full" />
        <div className="h-4 bg-slate-800 rounded w-3/4" />
      </div>

      {/* Tags Section Skeleton */}
      <div className="mt-12 pt-8 border-t border-white/20">
        <div className="h-6 bg-slate-800 rounded w-20 mb-4" />
        <div className="flex flex-wrap gap-2">
          <div className="w-16 h-7 bg-slate-800 rounded-full" />
          <div className="w-20 h-7 bg-slate-800 rounded-full" />
          <div className="w-14 h-7 bg-slate-800 rounded-full" />
        </div>
      </div>

      {/* Related Articles Section Skeleton */}
      <section className="bg-white/5 backdrop-blur-xl border-t border-white/10 py-16 mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-9 bg-slate-800 rounded w-48 mb-2" />
          <div className="h-5 bg-slate-800 rounded w-64 mb-8" />
          <div className="h-12 bg-slate-800 rounded w-48" />
        </div>
      </section>
    </div>
  );
}
