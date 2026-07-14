"use client";

import { useState, useEffect } from "react";
import VanListingHome from "@/components/global/vanListingBackup";
import { VanData } from "@/types/type";

export default function AllVanListing() {
  const [allVans, setAllVans] = useState<VanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories?status=active")
      .then((res) => res.json())
      .then((data) => {
        const categories = data?.data?.data || data?.data || [];
        setAllVans(categories);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return null;

  return <VanListingHome vans={allVans} showHeader={false} gridCols={3} />;
}
