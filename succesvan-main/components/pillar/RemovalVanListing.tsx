"use client";

import { useState, useEffect } from "react";
import VanListingHome from "@/components/global/vanListingBackup";
import { VanData } from "@/types/type";

export default function RemovalVanListing() {
  const [removalVans, setRemovalVans] = useState<VanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories?status=active")
      .then((res) => res.json())
      .then((data) => {
        const categories = data?.data?.data || data?.data || [];
        const ids = [
          "6946787a1f709928d740651a",
          "694678761f709928d74064fd",
          "694678bd1f709928d7406583",
          "69467e791f709928d74069b8",
          "69467c301f709928d7406638",
          "69467cd21f709928d7406711",
          "69467d3c1f709928d74067b6",
          "69467fea1f709928d7406c9d",
        ];
        const filtered = categories.filter(
          (van: VanData) => van._id && ids.includes(van._id),
        );
        setRemovalVans(filtered);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return null;

  return <VanListingHome vans={removalVans} showHeader={false} gridCols={3} />;
}
