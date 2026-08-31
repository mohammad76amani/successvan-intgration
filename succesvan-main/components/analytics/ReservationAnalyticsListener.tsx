"use client";

import { useEffect } from "react";
import { startReservationFlow } from "@/lib/analytics";

export default function ReservationAnalyticsListener() {
  useEffect(() => {
    const captureReservationEntry = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;

      try {
        const destination = new URL(anchor.href, window.location.href);
        if (
          destination.origin === window.location.origin &&
          destination.pathname === "/reservation" &&
          window.location.pathname !== "/reservation"
        ) {
          startReservationFlow(true);
        }
      } catch {
        // Ignore malformed or non-navigation links.
      }
    };

    document.addEventListener("click", captureReservationEntry, true);
    return () =>
      document.removeEventListener("click", captureReservationEntry, true);
  }, []);

  return null;
}

