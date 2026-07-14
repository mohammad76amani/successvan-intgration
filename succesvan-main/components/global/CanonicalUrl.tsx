"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function CanonicalUrl() {
  const pathname = usePathname();

  useEffect(() => {
    // Get existing canonical element or create a new one
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }

    // Set the href attribute to the current page URL
    const baseUrl = "https://successvanhire.co.uk";
    link.setAttribute("href", `${baseUrl}${pathname}`);
  }, [pathname]);

  return null;
}
