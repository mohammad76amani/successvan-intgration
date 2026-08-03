"use client";

import { useEffect, useState } from "react";
import VanListingHome from "@/components/global/vanListingBackup";
import { VanData } from "@/types/type";

const FRIDGE_VAN_ID = "69467e001f709928d7406873";

export default function FridgeVanListing() {
  const [fridgeVans, setFridgeVans] = useState<VanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories?status=active")
      .then((res) => res.json())
      .then((data) => {
        const categories = data?.data?.data || data?.data || [];
        const filtered = categories.filter((van: VanData) => {
          const name = van.name?.trim().toLowerCase();
          return van._id === FRIDGE_VAN_ID || name === "fridge van";
        });

        setFridgeVans(filtered);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return null;

  return <VanListingHome vans={fridgeVans} showHeader={false} gridCols={1} />;
}
