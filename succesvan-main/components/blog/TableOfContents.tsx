"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { FiList, FiChevronDown, FiArrowUp } from "react-icons/fi";

interface Heading {
  id: string;
  text: string;
  level: number;
  children?: Heading[];
}

interface TableOfContentsProps {
  contentRef: React.RefObject<HTMLDivElement>;
}

export default function TableOfContents({ contentRef }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Fade in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Extract headings
  useEffect(() => {
    if (!contentRef.current) return;

    const extract = () => {
      const elements = contentRef.current!.querySelectorAll("h2, h3, h4, h5");
      const flatHeadings: Heading[] = [];

      elements.forEach((element, index) => {
        const level = parseInt(element.tagName[1]);
        const text = element.textContent || `Heading ${index + 1}`;
        if (!element.id) {
          element.id = `heading-${index}-${text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")}`;
        }
        flatHeadings.push({ id: element.id, text, level });
      });

      const nestedHeadings: Heading[] = [];
      let currentH2: Heading | null = null;

      flatHeadings.forEach((heading) => {
        if (heading.level === 2) {
          currentH2 = { ...heading, children: [] };
          nestedHeadings.push(currentH2);
        } else if (heading.level > 2 && currentH2) {
          currentH2.children!.push(heading);
        } else {
          nestedHeadings.push({ ...heading, children: [] });
          currentH2 = null;
        }
      });

      setHeadings(nestedHeadings);
    };

    extract();

    const observer = new MutationObserver(() => extract());
    observer.observe(contentRef.current, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [contentRef]);

  // All heading IDs (flat) for scroll tracking
  const allIds = useMemo(() => {
    const ids: string[] = [];
    headings.forEach((h) => {
      ids.push(h.id);
      h.children?.forEach((c) => ids.push(c.id));
    });
    return ids;
  }, [headings]);

  // Scroll tracking
  const handleScroll = useCallback(() => {
    // Progress
    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);

    // Active heading
    let current = "";
    for (const id of allIds) {
      const el = document.getElementById(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120) {
          current = id;
        }
      }
    }
    setActiveId(current);
  }, [allIds]);

  useEffect(() => {
    if (allIds.length === 0) return;
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [allIds, handleScroll]);

  const handleHeadingClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const top =
        element.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: "smooth" });
      setActiveId(id);
      setIsOpen(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setActiveId("");
  };

  // Count total headings
  const totalHeadings = allIds.length;
  const activeIndex = activeId ? allIds.indexOf(activeId) + 1 : 0;

  if (headings.length === 0) return null;

  return (
    <div
      className={`sticky top-24 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* ========== MOBILE ========== */}
      <div className="lg:hidden">
        <div className="toc-glass-mobile rounded-2xl overflow-hidden">
          {/* Mobile Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 text-white font-semibold group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#fe9a00] to-[#ff7b00] flex items-center justify-center shadow-lg shadow-[#fe9a00]/20 group-hover:shadow-[#fe9a00]/40 transition-shadow duration-300">
                <FiList className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-semibold">
                  Table of Contents
                </span>
                <span className="block text-[10px] text-gray-400 font-normal">
                  {activeIndex > 0
                    ? `${activeIndex} of ${totalHeadings} sections`
                    : `${totalHeadings} sections`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Mini progress ring */}
              <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
                <circle
                  cx="14"
                  cy="14"
                  r="11"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="2.5"
                />
                <circle
                  cx="14"
                  cy="14"
                  r="11"
                  fill="none"
                  stroke="#fe9a00"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 11}`}
                  strokeDashoffset={`${2 * Math.PI * 11 * (1 - scrollProgress / 100)}`}
                  className="transition-all duration-300"
                />
              </svg>
              <FiChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {/* Progress bar */}
          <div className="h-0.5 bg-white/5 mx-5">
            <div
              className="h-full bg-linear-to-r from-[#fe9a00] to-[#ffb940] rounded-full transition-all duration-300"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>

          {/* Mobile Dropdown */}
          <div
            className={`transition-all duration-400 ease-out overflow-hidden ${
              isOpen ? "max-h-[60vh] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="p-4 space-y-1 overflow-y-auto max-h-[55vh] toc-scrollbar">
              {headings.map((heading, idx) => (
                <div key={heading.id}>
                  <button
                    onClick={() => handleHeadingClick(heading.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 group/item ${
                      activeId === heading.id
                        ? "toc-active-item text-white font-semibold"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span
                      className={`shrink-0 w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all duration-300 ${
                        activeId === heading.id
                          ? "bg-[#fe9a00] text-white shadow-md shadow-[#fe9a00]/30"
                          : "bg-white/10 text-gray-400 group-hover/item:bg-white/15"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-sm leading-snug">{heading.text}</span>
                  </button>

                  {heading.children && heading.children.length > 0 && (
                    <div className="ml-9 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                      {heading.children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => handleHeadingClick(child.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-300 text-xs ${
                            activeId === child.id
                              ? "text-[#fe9a00] bg-[#fe9a00]/10 font-semibold"
                              : "text-gray-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {child.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Mobile scroll to top */}
              {activeId && (
                <button
                  onClick={scrollToTop}
                  className="w-full flex items-center justify-center gap-2 py-3 mt-2 text-sm text-[#fe9a00] hover:text-white rounded-xl hover:bg-white/5 transition-all duration-300 border-t border-white/5"
                >
                  <FiArrowUp className="w-4 h-4" />
                  Back to top
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========== DESKTOP ========== */}
      <div className="hidden lg:block">
        <div className="toc-glass-desktop rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#fe9a00] to-[#ff7b00] flex items-center justify-center shadow-lg shadow-[#fe9a00]/20">
                  <FiList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">
                    On this page
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {activeIndex > 0
                      ? `Reading ${activeIndex} of ${totalHeadings}`
                      : `${totalHeadings} sections`}
                  </p>
                </div>
              </div>

              {/* Progress ring */}
              <div className="relative">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="url(#progressGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 16}`}
                    strokeDashoffset={`${2 * Math.PI * 16 * (1 - scrollProgress / 100)}`}
                    className="transition-all duration-300"
                  />
                  <defs>
                    <linearGradient
                      id="progressGrad"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#fe9a00" />
                      <stop offset="100%" stopColor="#ffb940" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">
                  {Math.round(scrollProgress)}%
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-[#fe9a00] to-[#ffb940] rounded-full transition-all duration-300"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-5 pb-5 max-h-[55vh] overflow-y-auto toc-scrollbar">
            <div className="space-y-1">
              {headings.map((heading, idx) => {
                const isActive = activeId === heading.id;
                const hasActiveChild = heading.children?.some(
                  (c) => c.id === activeId,
                );

                return (
                  <div key={heading.id}>
                    <button
                      onClick={() => handleHeadingClick(heading.id)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-3 group/item relative ${
                        isActive
                          ? "toc-active-item text-white font-semibold"
                          : hasActiveChild
                            ? "text-white/80 bg-white/3"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {/* Number badge */}
                      <span
                        className={`shrink-0 w-7 h-7 rounded-lg text-[11px] font-bold flex items-center justify-center transition-all duration-300 ${
                          isActive
                            ? "bg-linear-to-br from-[#fe9a00] to-[#ff7b00] text-white shadow-md shadow-[#fe9a00]/30"
                            : "bg-white/6 text-gray-500 group-hover/item:bg-white/10 group-hover/item:text-gray-300"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-sm leading-snug truncate">
                        {heading.text}
                      </span>

                      {/* Active indicator dot */}
                      {isActive && (
                        <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#fe9a00] shadow-sm shadow-[#fe9a00]/50 toc-pulse" />
                      )}
                    </button>

                    {/* Children */}
                    {heading.children && heading.children.length > 0 && (
                      <div
                        className={`ml-8 mt-1 mb-1 space-y-0.5 border-l-2 pl-4 transition-colors duration-300 ${
                          isActive || hasActiveChild
                            ? "border-[#fe9a00]/40"
                            : "border-white/6"
                        }`}
                      >
                        {heading.children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => handleHeadingClick(child.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-300 text-[13px] leading-snug relative ${
                              activeId === child.id
                                ? "text-[#fe9a00] bg-[#fe9a00]/8 font-medium"
                                : "text-gray-500 hover:text-gray-200 hover:bg-white/4"
                            }`}
                          >
                            {child.text}
                            {activeId === child.id && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4.5 w-1 h-4 rounded-full bg-[#fe9a00] transition-all duration-300" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* Scroll to top */}
          <div
            className={`transition-all duration-400 overflow-hidden ${
              activeId ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="px-5 pb-5">
              <button
                onClick={scrollToTop}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 toc-top-button group/top"
              >
                <FiArrowUp className="w-4 h-4 transition-transform duration-300 group-hover/top:-translate-y-0.5" />
                Back to top
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Glass Containers */
        .toc-glass-mobile {
          background: linear-gradient(
            145deg,
            rgba(15, 23, 43, 0.85) 0%,
            rgba(15, 23, 43, 0.65) 50%,
            rgba(15, 23, 43, 0.8) 100%
          );
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            inset 0 -1px 0 rgba(255, 255, 255, 0.02);
        }

        .toc-glass-desktop {
          background: linear-gradient(
            160deg,
            rgba(15, 23, 43, 0.8) 90%,
            rgba(20, 30, 55, 0.6) 50%,
            rgba(15, 23, 43, 0.75) 80%,
            rgba(10, 18, 35, 0.85) 100%
          );
          backdrop-filter: blur(28px) saturate(200%);
          -webkit-backdrop-filter: blur(28px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.45),
            0 4px 12px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            inset 0 -1px 0 rgba(255, 255, 255, 0.02),
            0 0 0 1px rgba(255, 255, 255, 0.03);
        }

        /* Active item */
        .toc-active-item {
          background: linear-gradient(
            135deg,
            rgba(254, 154, 0, 0.12) 0%,
            rgba(254, 154, 0, 0.05) 100%
          );
          box-shadow: inset 0 0 0 1px rgba(254, 154, 0, 0.15);
        }

        /* Scroll to top button */
        .toc-top-button {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #fe9a00;
        }
        .toc-top-button:hover {
          background: rgba(254, 154, 0, 0.1);
          border-color: rgba(254, 154, 0, 0.2);
          color: #ffb940;
        }

        /* Pulse dot */
        @keyframes tocPulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.8);
          }
        }
        .toc-pulse {
          animation: tocPulse 2s ease-in-out infinite;
        }

        /* Custom scrollbar */
        .toc-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .toc-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .toc-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(254, 154, 0, 0.2);
          border-radius: 3px;
        }
        .toc-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(254, 154, 0, 0.4);
        }
        .toc-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(254, 154, 0, 0.2) transparent;
        }

        /* Transition utility */
        .duration-400 {
          transition-duration: 400ms;
        }
      `}</style>
    </div>
  );
}
