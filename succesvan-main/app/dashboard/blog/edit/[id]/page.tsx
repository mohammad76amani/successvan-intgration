"use client";

import AIBlogBuilder from "@/components/dashboard/addBlog";
import { useParams, useRouter } from "next/navigation";

export default function EditBlogPage() {
  const params = useParams();
  const router = useRouter();
  const blogId = params.id as string;

  return (
    <div className="min-h-screen bg-[#0f172b] p-4 9t-20">
      <AIBlogBuilder
        blogId={blogId}
        onBack={() => router.push("/dashboard#blogs")}
      />
    </div>
  );
}
