"use client";

import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiExternalLink, FiX } from "react-icons/fi";
import { useModalAccessibility } from "@/hooks/useModalAccessibility";

export default function EvidenceThumbnail({
  url,
  alt = "Deduction evidence",
  size = "sm",
}: {
  url?: string;
  alt?: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closePreview = useCallback(() => setOpen(false), []);

  useModalAccessibility({
    open,
    onClose: closePreview,
    dialogRef,
    initialFocusRef: closeRef,
  });

  if (!url) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={`group relative shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/25 focus:outline-none focus:ring-2 focus:ring-[#fe9a00]/50 ${size === "md" ? "h-16 w-20" : "h-11 w-14"}`}
        aria-label={`Open ${alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} className="h-full w-full object-cover transition duration-200 group-hover:scale-105" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
          <FiExternalLink aria-hidden="true" />
        </span>
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          tabIndex={-1}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePreview();
          }}
        >
          <div className="relative flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#07101f] shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <p className="truncate text-sm font-black text-white">{alt}</p>
              <button
                ref={closeRef}
                type="button"
                onClick={closePreview}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] text-white transition hover:bg-white/10"
                aria-label="Close evidence preview"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={alt} className="min-h-0 w-full flex-1 object-contain" />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
