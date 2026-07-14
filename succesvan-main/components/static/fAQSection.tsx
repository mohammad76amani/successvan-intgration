// components/FAQComponent.tsx
"use client";

import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import Link from "next/link";

// ============ Types ============
export interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

interface FAQProps {
  title?: string;
  subtitle?: string;
  faqs: FAQItem[];
  showSearch?: boolean;
  defaultOpen?: number;
  accentColor?: string;
  backgroundColor?: string;
}

// ============ Inline SVG Icons ============
const ChevronDownIcon = memo(function ChevronDownIcon({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
});

const SearchIcon = memo(function SearchIcon({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
});

const XIcon = memo(function XIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
});

const CheckIcon = memo(function CheckIcon({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
});

const HelpIcon = memo(function HelpIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
});

// ============ Custom Hook: Debounced Value ============
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ============ FAQ Item Component ============
const FAQItemComponent = memo(function FAQItemComponent({
  faq,
  index,
  isOpen,
  isVisible,
  onToggle,
  accentColor,
}: {
  faq: FAQItem;
  index: number;
  isOpen: boolean;
  isVisible: boolean;
  onToggle: () => void;
  accentColor: string;
}) {
  const answerId = `faq-answer-${index}`;
  const questionId = `faq-question-${index}`;

  return (
    <div
      className={`faq-item ${isVisible ? "faq-item-visible" : ""}`}
      style={{
        transitionDelay: isVisible ? `${Math.min(index * 40, 400)}ms` : "0ms",
      }}
    >
      <div
        className={`faq-card ${isOpen ? "faq-card-open" : ""}`}
        style={{
          borderColor: isOpen ? `${accentColor}60` : "rgba(255,255,255,0.1)",
        }}
      >
        {/* Question Button */}
        <button
          id={questionId}
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={answerId}
          type="button"
          className="relative w-full p-6 lg:p-7 flex items-start gap-5 text-left"
        >
          {/* Number Badge */}
          <div
            className={`faq-number ${isOpen ? "faq-number-open" : ""} shrink-0`}
            style={{
              background: isOpen
                ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`
                : "rgba(255, 255, 255, 0.05)",
              color: isOpen ? "#0f172b" : accentColor,
            }}
            aria-hidden="true"
          >
            {index + 1}
          </div>

          {/* Question Text */}
          <div className="flex-1 min-w-0">
            <h3
              className={`text-sm md:text-xl font-bold faq-question-text ${
                isOpen ? "text-white" : "text-gray-300"
              }`}
            >
              {faq.question}
            </h3>
            {faq.category && (
              <span
                className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: `${accentColor}20`,
                  color: accentColor,
                }}
              >
                {faq.category}
              </span>
            )}
          </div>

          {/* Arrow */}
          <div className="shrink-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isOpen ? "bg-white/10" : "bg-transparent"
              }`}
            >
              <ChevronDownIcon
                className={`faq-chevron ${isOpen ? "faq-chevron-open" : ""}`}
                style={{
                  color: isOpen ? accentColor : "rgb(156, 163, 175)",
                }}
              />
            </div>
          </div>
        </button>

        {/* Answer — animated with the grid-rows trick (no height measuring, no jank) */}
        <div
          id={answerId}
          role="region"
          aria-labelledby={questionId}
          className={`faq-answer ${isOpen ? "faq-answer-open" : ""}`}
        >
          <div className="faq-answer-clip">
            <div className="faq-answer-inner px-6 lg:px-7 pb-6 lg:pb-7 pt-0">
              <div className="pl-0 lg:pl-17">
                <div
                  className="h-px mb-5 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${accentColor}40, transparent)`,
                  }}
                  aria-hidden="true"
                />
                <p className="text-gray-300 text-sm lg:text-lg leading-relaxed whitespace-pre-line">
                  {faq.answer}
                </p>
                <div className="mt-6 flex items-center gap-2">
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-lg"
                    style={{
                      backgroundColor: `${accentColor}15`,
                      border: `1px solid ${accentColor}30`,
                    }}
                  >
                    <CheckIcon style={{ color: accentColor }} />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: accentColor }}
                    >
                      Hope this helps!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ============ Main Component ============
function FAQComponent({
  title = "Frequently Asked Questions",
  subtitle = "Find answers to common questions about our services",
  faqs,
  showSearch = true,
  defaultOpen = -1,
  accentColor = "#fe9a00",
  backgroundColor = "#0f172b",
}: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number>(defaultOpen);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsVisible, setItemsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // ✅ Debounce search - فقط ۲۰۰ms بعد از تایپ
  const debouncedSearch = useDebouncedValue(searchQuery, 200);

  // ✅ Filter با useMemo - فقط وقتی debounced یا faqs تغییر می‌کنه
  const filteredFAQs = useMemo(() => {
    if (debouncedSearch.trim() === "") return faqs;
    const query = debouncedSearch.toLowerCase();
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query),
    );
  }, [debouncedSearch, faqs]);

  // ✅ بستن FAQ ها هنگام search
  useEffect(() => {
    if (debouncedSearch.trim() !== "") {
      setOpenIndex(-1);
    }
  }, [debouncedSearch]);

  // ✅ Intersection Observer برای entrance animation
  useEffect(() => {
    if (!sectionRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      setItemsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setItemsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -100px 0px" },
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // ✅ Callbacks
  const toggleFAQ = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [],
  );

  return (
    <>
      {/*
        Animation layer — tuned for low-end devices:
        - Entrance: opacity + transform only (compositor-friendly, no layout).
        - Accordion: grid-template-rows 0fr→1fr (no JS measuring, no max-height hacks).
        - No animated box-shadows (glow is a pre-rendered ::after that only fades opacity).
        - No blur() filters in the background (radial-gradients instead).
        - Everything is killed by prefers-reduced-motion.
      */}
      <style>{`
        /* ---------- Entrance ---------- */
        .faq-item {
          opacity: 0;
          transform: translateY(14px);
          transition:
            opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: opacity, transform;
        }
        .faq-item-visible {
          opacity: 1;
          transform: none;
          will-change: auto;
        }

        /* ---------- Card ---------- */
        .faq-card {
          position: relative;
          border-radius: 1.5rem;
          border-width: 1px;
          background: rgba(255, 255, 255, 0.04);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          transition: border-color 0.25s ease;
          overflow: hidden;
          contain: content;
        }
        /* Glow is painted once on a pseudo-element; only its OPACITY animates
           (animating box-shadow itself forces repaints every frame). */
        .faq-card::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          box-shadow: 0 10px 40px var(--faq-accent-glow, rgba(254, 154, 0, 0.12));
          opacity: 0;
          transition: opacity 0.25s ease;
          pointer-events: none;
        }
        .faq-card-open::after {
          opacity: 1;
        }

        /* ---------- Number badge ---------- */
        .faq-number {
          width: 3rem;
          height: 3rem;
          border-radius: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 1rem;
          transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .faq-number-open {
          transform: scale(1.06);
        }

        /* ---------- Question text & chevron ---------- */
        .faq-question-text {
          transition: color 0.25s ease;
        }
        .faq-chevron {
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .faq-chevron-open {
          transform: rotate(180deg);
        }

        /* ---------- Accordion (grid-rows trick) ---------- */
        .faq-answer {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.32s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .faq-answer-open {
          grid-template-rows: 1fr;
        }
        .faq-answer-clip {
          overflow: hidden;
          min-height: 0;
        }
        .faq-answer-inner {
          opacity: 0;
          transform: translateY(-4px);
          transition:
            opacity 0.25s ease,
            transform 0.25s ease;
        }
        .faq-answer-open .faq-answer-inner {
          opacity: 1;
          transform: none;
          transition-delay: 0.08s;
        }

        /* ---------- Search / buttons ---------- */
        .faq-search-input {
          transition: border-color 0.25s ease;
        }
        .faq-clear-btn:hover,
        .faq-cta-btn-primary:hover {
          transform: translateY(-2px);
        }
        .faq-clear-btn:active,
        .faq-cta-btn-primary:active {
          transform: translateY(0) scale(0.98);
        }
        .faq-cta-btn-secondary {
          transition: background-color 0.25s ease, border-color 0.25s ease;
        }
        .faq-cta-btn-secondary:hover {
          background-color: rgba(255, 255, 255, 0.06);
        }
        .faq-cta-box {
          border-color: rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
        }

        /* ---------- Reduced motion: kill everything ---------- */
        @media (prefers-reduced-motion: reduce) {
          .faq-item,
          .faq-item-visible,
          .faq-card,
          .faq-card::after,
          .faq-number,
          .faq-question-text,
          .faq-chevron,
          .faq-answer,
          .faq-answer-inner,
          .faq-search-input,
          .faq-clear-btn,
          .faq-cta-btn-primary,
          .faq-cta-btn-secondary {
            transition: none !important;
          }
          .faq-item {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>

      <section
        ref={sectionRef}
        className="relative w-full py-20 overflow-hidden"
        style={
          {
            backgroundColor,
            // Pre-computed glow color for the card pseudo-element
            "--faq-accent-glow": `${accentColor}20`,
          } as React.CSSProperties
        }
        aria-labelledby="faq-title"
      >
        {/* Background — radial gradients instead of blur() filters.
            Two 24rem blur-3xl orbs are one of the heaviest things you can
            paint on a low-end GPU; gradients look the same and cost nothing. */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background: `
              radial-gradient(600px 600px at 25% 25%, ${accentColor}14, transparent 70%),
              radial-gradient(600px 600px at 75% 75%, ${accentColor}14, transparent 70%)
            `,
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="text-center mb-12 lg:mb-16">
            <h2
              id="faq-title"
              className="text-2xl lg:text-6xl font-black text-white mb-4 leading-tight"
            >
              {title}
            </h2>
            <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
              {subtitle}
            </p>
          </header>

          {/* Search */}
          {showSearch && (
            <div className="mb-10">
              <div className="relative">
                <label htmlFor="faq-search" className="sr-only">
                  Search FAQs
                </label>
                <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <SearchIcon className="text-gray-500" />
                </div>
                <input
                  id="faq-search"
                  type="search"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search questions..."
                  className="faq-search-input w-full pl-14 pr-14 py-5 rounded-2xl border bg-white/5 text-white placeholder-gray-500 focus:outline-none"
                  style={{
                    borderColor: searchQuery
                      ? accentColor
                      : "rgba(255,255,255,0.1)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                  }}
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    aria-label="Clear search"
                    type="button"
                    className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-300"
                  >
                    <XIcon className="text-gray-400" />
                  </button>
                )}
              </div>

              {/* Results Count */}
              {debouncedSearch && (
                <div className="mt-4 text-center" aria-live="polite">
                  <p className="text-gray-400 text-sm">
                    Found{" "}
                    <span className="font-bold" style={{ color: accentColor }}>
                      {filteredFAQs.length}
                    </span>{" "}
                    {filteredFAQs.length === 1 ? "result" : "results"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* FAQ List */}
          {filteredFAQs.length > 0 ? (
            <div className="space-y-4" role="list">
              {filteredFAQs.map((faq, index) => (
                <div key={`${faq.question}-${index}`} role="listitem">
                  <FAQItemComponent
                    faq={faq}
                    index={index}
                    isOpen={openIndex === index}
                    isVisible={itemsVisible}
                    onToggle={() => toggleFAQ(index)}
                    accentColor={accentColor}
                  />
                </div>
              ))}
            </div>
          ) : (
            // No Results
            <div className="text-center py-16">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
                  border: `2px solid ${accentColor}30`,
                }}
                aria-hidden="true"
              >
                <SearchIcon
                  style={{ color: accentColor, width: 32, height: 32 }}
                />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">
                No Results Found
              </h3>
              <p className="text-gray-400 mb-6">
                We couldn&apos;t find any questions matching &ldquo;
                <span className="font-semibold" style={{ color: accentColor }}>
                  {debouncedSearch}
                </span>
                &rdquo;
              </p>
              <button
                onClick={clearSearch}
                type="button"
                className="faq-clear-btn px-6 py-3 rounded-xl font-bold text-white transition-transform duration-300"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                  boxShadow: `0 10px 30px ${accentColor}30`,
                }}
              >
                Clear Search
              </button>
            </div>
          )}

          {/* CTA */}
          {filteredFAQs.length > 0 && (
            <div className="mt-16 text-center">
              <div className="faq-cta-box inline-block p-8 lg:p-10 rounded-3xl border">
                <h3 className="text-xl md:text-3xl font-black text-white mb-3">
                  Still have questions?
                </h3>
                <p className="text-gray-400 mb-6">
                  Can&apos;t find the answer you&apos;re looking for? Please get
                  in touch with our team.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href="tel:+442030111198"
                    className="faq-cta-btn-primary w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white transition-transform duration-300 flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                      boxShadow: `0 10px 30px ${accentColor}30`,
                    }}
                    aria-label="Call us at +44 20 3011 1198"
                  >
                    <HelpIcon />
                    Call Us Now
                  </a>
                  <Link
                    href="/contact-us"
                    prefetch={false}
                    className="faq-cta-btn-secondary w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white border transition-colors duration-300 text-center"
                    style={{ borderColor: `${accentColor}40` }}
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default memo(FAQComponent);
