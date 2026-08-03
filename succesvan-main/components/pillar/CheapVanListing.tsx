"use client";

import { useState, useEffect } from "react";
import VanListingHome from "@/components/global/vanListingBackup";
import { VanData } from "@/types/type";

export default function CheapVanListing() {
  const [cheapVans, setCheapVans] = useState<VanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories?status=active")
      .then((res) => res.json())
      .then((data) => {
        const categories = data?.data?.data || data?.data || [];
        const ids = [
          "6946787a1f709928d740651a",
          "69467e791f709928d74069b8",
          "69467c301f709928d7406638",
          "69467d3c1f709928d74067b6",
        ];
        const filtered = categories.filter(
          (van: VanData) => van._id && ids.includes(van._id),
        );
        setCheapVans(filtered);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return null;

  return <VanListingHome vans={cheapVans} gridCols={3} />;
}
