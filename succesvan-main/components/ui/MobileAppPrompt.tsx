"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function MobileAppPrompt() {
  const [isMobile, setIsMobile] = useState(false);
  const [os, setOs] = useState<"ios" | "android" | null>(null);
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const STORAGE_KEY = "appPromptDismissed";

  useEffect(() => {
    if (typeof navigator === "undefined") return;

    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";

    const isiOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);

    setIsMobile(isiOS || isAndroid);
    setOs(isiOS ? "ios" : isAndroid ? "android" : null);

    // Try to extract a friendly device name from the user agent
    try {
      let name = null;
      const paren = ua.match(/\(([^)]+)\)/);
      if (paren && paren[1]) {
        const parts = paren[1].split(";").map((p) => p.trim());
        const model = parts.find(
          (p) =>
            !/Android|Linux|Windows|iPhone|iPad|iPod|CPU|Mac OS X|Win32/i.test(
              p,
            ),
        );
        name = model || parts[parts.length - 1] || platform;
      } else {
        name =
          platform ||
          (isiOS ? "iOS device" : isAndroid ? "Android device" : "Unknown");
      }
    } catch (e) {
      console.log("Error parsing device name:", e);
    }

    // show modal if mobile and not dismissed
    const dismissed =
      typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY);
    if ((isiOS || isAndroid) && !dismissed) {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const ctx = gsap.context(() => {
      if (overlayRef.current) {
        gsap.fromTo(
          overlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3 },
        );
      }
      if (modalRef.current) {
        gsap.fromTo(
          modalRef.current,
          { y: 600, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" },
        );
      }
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      ctx.revert();
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // prevent background scrolling while modal is open

  useEffect(() => {
    if (typeof document === "undefined") return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    if (open) {
      const scrollBarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
      document.body.style.overflow = "hidden";
      document.documentElement.style.touchAction = "none";
    } else {
      document.body.style.overflow = originalOverflow || "";
      document.body.style.paddingRight = originalPaddingRight || "";
      document.documentElement.style.touchAction = "";
    }

    return () => {
      document.body.style.overflow = originalOverflow || "";
      document.body.style.paddingRight = originalPaddingRight || "";
      document.documentElement.style.touchAction = "";
    };
  }, [open]);

  const onClose = (dontShowAgain = false) => {
    if (dontShowAgain && typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    if (overlayRef.current && modalRef.current) {
      gsap
        .to([modalRef.current, overlayRef.current], {
          opacity: 0,
          y: 300,
          duration: 0.25,
        })
        .then(() => {
          setOpen(false);
        });
    } else {
      setOpen(false);
    }
  };

  if (!isMobile || !open) return null;

  // TODO: replace with real store links
  const iosLink = "https://apps.apple.com/";
  const playStoreLink =
    "https://play.google.com/store/apps/details?id=com.yourapp";
  const apkLink = "/downloads/your-app-latest.apk";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-app-prompt-title"
      className="fixed inset-0 z-99999 flex items-end sm:items-center justify-center px-4 pointer-events-none"
    >
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/60 pointer-events-auto"
        onClick={() => onClose(false)}
      />

      <div
        ref={modalRef}
        className="relative w-full max-w-md pointer-events-auto"
      >
        <div className="bg-white/6 backdrop-blur-md border border-white/10 rounded-t-2xl sm:rounded-2xl p-6 sm:p-8 text-white shadow-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 id="mobile-app-prompt-title" className="text-lg font-extrabold text-white mb-1">
                Get the Success Van app
              </h3>
            </div>
            <button
              onClick={() => onClose(true)}
              className="text-white/60 hover:text-white"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3">
            {os === "ios" && (
              <a
                href={iosLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 justify-center px-4 py-3 bg-white/10 hover:bg-white/12 rounded-xl text-white font-semibold transition"
              >
                <span className="text-2xl"></span>
                <span>Download on the App Store</span>
              </a>
            )}

            {os === "android" && (
              <>
                <a
                  href={playStoreLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 justify-center px-4 py-3 bg-white/10 hover:bg-white/12 rounded-xl text-white font-semibold transition"
                >
                  <span className="text-2xl">▣</span>
                  <span>Get it on Google Play</span>
                </a>

                <a
                  href={apkLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 justify-center px-4 py-3 bg-white/5 hover:bg-white/8 rounded-xl text-white font-semibold transition"
                >
                  <span className="text-2xl">⬇️</span>
                  <span>Download APK</span>
                </a>
              </>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                onChange={(e) => onClose(e.target.checked)}
                className="w-4 h-4"
              />
              Don't show again
            </label>

            <button
              onClick={() => onClose(false)}
              className="text-sm text-[#fe9a00] font-semibold"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
