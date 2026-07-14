"use client";

import { Suspense } from "react";
import VanListingHome from "../global/vanListingBackup";

export function ReservationContent() {
  return (
    <div className="min-h-screen bg-[#0f172b] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <VanListingHome />
      </div>
    </div>
  );
}

export default function ReservationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0f172b] flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <ReservationContent />
    </Suspense>
  );
}
