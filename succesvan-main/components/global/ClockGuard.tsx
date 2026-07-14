"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiAlertTriangle, FiClock, FiRefreshCw } from "react-icons/fi";
import { syncServerClock } from "@/lib/englandTime";

// Maximum tolerated difference between device clock and server clock.
// Devices with automatic time enabled are within seconds; a manually
// back-dated clock (used to book past dates) is off by hours or days.
const MAX_CLOCK_DRIFT_MS = 5 * 60 * 1000;

export default function ClockGuard() {
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [driftMs, setDriftMs] = useState<number>(0);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // Baseline pair used to detect clock changes locally: performance.now()
  // is monotonic and unaffected by system clock changes, so if Date.now()
  // stops matching its progression, the user changed the clock.
  const baselineRef = useRef<{ dateNow: number; perfNow: number } | null>(
    null,
  );
  const checkingRef = useRef<boolean>(false);

  const checkClock = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    setIsChecking(true);
    try {
      const offset = await syncServerClock(true);
      baselineRef.current = {
        dateNow: Date.now(),
        perfNow: performance.now(),
      };
      setDriftMs(offset);
      setIsBlocked(Math.abs(offset) > MAX_CLOCK_DRIFT_MS);
    } catch {
      // Fail open: never lock users out because the time check itself failed.
      // Server-side validation still rejects past-dated reservations.
      setIsBlocked(false);
    } finally {
      checkingRef.current = false;
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkClock();

    // Re-check when the tab becomes visible or the window regains focus
    // (e.g. after visiting the system date & time settings).
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkClock();
      }
    };
    const handleFocus = () => checkClock();
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    // Instant, network-free detection of mid-session clock changes:
    // every second compare Date.now() against the monotonic baseline.
    // A jump beyond the tolerance means the clock was changed - re-verify
    // against the server (checkClock also refreshes the baseline).
    const interval = setInterval(() => {
      const baseline = baselineRef.current;
      if (!baseline) return;
      const expectedNow =
        baseline.dateNow + (performance.now() - baseline.perfNow);
      const jump = Date.now() - expectedNow;
      if (Math.abs(jump) > MAX_CLOCK_DRIFT_MS) {
        checkClock();
      }
    }, 1000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [checkClock]);

  if (!isBlocked) return null;

  const driftHours = Math.abs(driftMs) / (60 * 60 * 1000);
  const deviceIsBehind = driftMs > 0;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4">
      <div className="max-w-md w-full bg-slate-800 border border-amber-500/40 rounded-2xl p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-amber-500/15 flex items-center justify-center">
          <FiClock className="text-amber-400 text-3xl" />
        </div>
        <h2 className="text-white text-xl font-bold mb-3">
          Your device&apos;s date &amp; time is incorrect
        </h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-2">
          Your device clock is{" "}
          {driftHours >= 1
            ? `about ${Math.round(driftHours)} hour${
                Math.round(driftHours) === 1 ? "" : "s"
              }`
            : "several minutes"}{" "}
          {deviceIsBehind ? "behind" : "ahead of"} the actual time. To keep
          bookings accurate, SuccessVan cannot be used until it is fixed.
        </p>
        <p className="text-gray-400 text-xs leading-relaxed mb-6 flex items-center justify-center gap-1.5">
          <FiAlertTriangle className="text-amber-400 shrink-0" />
          Enable &quot;Set date &amp; time automatically&quot; in your device
          settings, then try again.
        </p>
        <button
          type="button"
          onClick={checkClock}
          disabled={isChecking}
          className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-amber-500 to-amber-600 text-slate-900 font-bold rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all duration-300 disabled:opacity-50 text-sm"
        >
          <FiRefreshCw className={isChecking ? "animate-spin" : ""} />
          {isChecking ? "Checking..." : "I've fixed it - check again"}
        </button>
      </div>
    </div>
  );
}
