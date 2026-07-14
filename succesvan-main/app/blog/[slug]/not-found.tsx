import Link from "next/link";
import { FiArrowLeft, FiSearch } from "react-icons/fi";

export const metadata = {
  title: "Blog Post Not Found - Success Van Hire",
  description: "The blog post you are looking for does not exist.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BlogNotFound() {
  return (
    <main className="min-h-screen bg-linear-to-br from-[#0f172b] via-slate-900 to-[#0f172b] flex items-center justify-center px-4">
      <div className="text-center">
        <FiSearch className="w-24 h-24 mx-auto mb-6 text-[#fe9a00] opacity-50" />
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4">
          Blog Post Not Found
        </h1>
        <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
          Sorry, the blog post you are looking for doesn't exist or has been removed.
        </p>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#fe9a00] text-white font-bold hover:bg-[#e68900] transition-colors duration-300 shadow-lg shadow-[#fe9a00]/50"
        >
          <FiArrowLeft className="w-5 h-5" />
          Back to Blog
        </Link>
      </div>
    </main>
  );
}
