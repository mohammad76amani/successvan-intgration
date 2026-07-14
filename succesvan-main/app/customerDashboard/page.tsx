"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import CustomerDashboard from "@/components/customerDashboard/CustomerDashboard";
import { useRouter } from "next/navigation";
import { canAccessDashboard } from "@/lib/roles";

const Page = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (user === null) {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/register");
        return;
      }
    } else {
      if (canAccessDashboard(user.role)) {
        router.replace("/dashboard");
        return;
      }
      document.title = `${user.name}'s Dashboard | SuccessVan`;
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || canAccessDashboard(user.role)) {
    return (
      <div className="h-screen bg-[#0f172b] flex items-center justify-center p-4 sm:p-8">
        <div className="flex flex-col items-center space-y-6 text-center max-w-md w-full animate-fade-in">
          {/* Spinner */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto  shrink-0">
            <div className="absolute inset-0 w-full h-full border-4 border-[#fe9a00]/20 border-t-[#fe9a00] rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-full h-full border-4 border-transparent border-t-[#fe9a00]/50 rounded-full animate-pulse [animation-delay:-0.5s]"></div>
          </div>
          {/* Text */}
          <div className="space-y-2 px-4">
            <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#fe9a00] to-orange-500 bg-clip-text text-transparent drop-shadow-lg">
              Verifying Access
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              Checking your account and loading dashboard...
            </p>
          </div>
          {/* Brand */}
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-500 hidden sm:block">
            Success Van Hire
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <CustomerDashboard />
    </div>
  );
};

export default Page;
