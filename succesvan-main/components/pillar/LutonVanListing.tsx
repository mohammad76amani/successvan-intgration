"use client";

import { useState, useEffect } from "react";
import VanListingHome from "@/components/global/vanListingBackup";
import { VanData } from "@/types/type";

export default function LutonVanListing() {
  const [lutonVans, setLutonVans] = useState<VanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories?status=active")
      .then((res) => res.json())
      .then((data) => {
        const categories = data?.data?.data || data?.data || [];
        const filtered = categories.filter(
          (van: VanData) => van._id === "69467c301f709928d7406638",
        );
        setLutonVans(filtered);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return null;

  return <VanListingHome vans={lutonVans} gridCols={1} />;
}
