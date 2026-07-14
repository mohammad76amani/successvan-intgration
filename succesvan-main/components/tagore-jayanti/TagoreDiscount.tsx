"use client";

import { useState, useRef, useEffect } from "react";
import {
  FiCheck,
  FiPhone,
  FiCopy,
  FiCheck as FiCheckCopied,
} from "react-icons/fi";
import { ReadMore } from "../ui/ReadMore";

const offers = [
  { label: "Tagore Jayanti Celebration events", emoji: "🎉" },
  { label: "Rabindra Jayanti programmes", emoji: "🌸" },
  { label: "Indian and Bengali cultural gatherings", emoji: "🪔" },
  { label: "Family group travel", emoji: "👨‍👩‍👧‍👦" },
  { label: "Community centre visits", emoji: "🏛️" },
  { label: "Temple visits", emoji: "🛕" },
  { label: "School and university cultural events", emoji: "🎓" },
  { label: "Music, poetry, dance and theatre performances", emoji: "🎭" },
];

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

export default function TagoreDiscount() {
  const [copied, setCopied] = useState(false);
  const { ref: headerRef, inView: headerIn } = useInView(0.1);
  const { ref: cardRef, inView: cardIn } = useInView(0.1);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("TJC2026");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = "TJC2026";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };
  const ReadMoreData = {
    linkUrl: "/blog/minibus-hire-for-tagore-jayanti-in-london",
    title: "Planning a Tagore Jayanti Celebration in London?",
    description:
      "Planning a Tagore Jayanti celebration in London is much easier when group travel is organised in advance.",
    iconType: "chevron", // or "chevron" or "custom"
    themeColors: {
      primary: "#fff", // Orange – your brand accent for headlines
      secondary: "#0f172b", // Slate – used for subtle borders
      background: "#0f172b",
      text: "#fff", // Slate text
      accent: "#fe9a00", // Orange CTA & icon
    },
  } as const;

  return (
    <section className="relative bg-linear-to-b from-[#0a0f1e] via-[#0d1627] to-[#0a0f1e] py-20 sm:py-24 lg:py-32 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-87.5 h-87.5 bg-[#fe9a00]/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-87.5 h-87.5 bg-[#fe9a00]/6 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-2"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div
          ref={headerRef}
          className={`text-center max-w-3xl mx-auto mb-14 sm:mb-16 transition-all duration-700 ${
            headerIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 bg-[#fe9a00]/10 border border-[#fe9a00]/25 text-[#fe9a00] text-xs sm:text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-5 sm:mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fe9a00] animate-pulse" />
            Limited Celebration Offer
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-[1.1] tracking-tight mb-5 sm:mb-6">
            Get{" "}
            <span className="relative inline-block">
              <span className="bg-linear-to-r from-[#fe9a00] via-[#ffb84d] to-[#fe9a00] bg-clip-text text-transparent">
                10% Off
              </span>
              {/* underline squiggle */}
              <svg
                className="absolute -bottom-1 left-0 w-full"
                viewBox="0 0 200 8"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 6 Q50 0 100 4 Q150 8 200 2"
                  stroke="#fe9a00"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.5"
                />
              </svg>
            </span>{" "}
            Minibus Hire
          </h2>

          <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-4">
            To support London's cultural communities during Tagore Jayanti,
            Success Van is offering a special{" "}
            <span className="text-white font-semibold">10% discount</span> on
            minibus hire for groups travelling to Tagore Jayanti Celebration
            events.
          </p>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            Whether you are attending a small family gathering or a larger
            cultural programme, this offer helps make your group transport more
            affordable and easier to organise.
          </p>
        </div>

        {/* ── Main Card ── */}
        <div
          ref={cardRef}
          className={`relative transition-all duration-700 delay-200 ${
            cardIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* outer glow ring */}
          <div className="absolute -inset-0.5 bg-linear-to-br from-[#fe9a00]/50 via-[#ffb84d]/20 to-[#fe9a00]/50 rounded-3xl blur-sm" />

          <div className="relative  bg-[#0d1627] border border-[#fe9a00]/20 rounded-3xl overflow-hidden">
            {/* card header strip */}
            <div className="bg-linear-to-r from-[#fe9a00] via-[#ffb347] to-[#fe9a00] px-6 sm:px-10 lg:px-14 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-white/80 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-1">
                  This offer applies to
                </p>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
                  All Eligible Events &amp; Groups
                </h3>
              </div>
              <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-5 py-3 text-center">
                <p className="text-white/70 text-[10px] uppercase tracking-widest mb-0.5">
                  Discount
                </p>
                <p className="text-white font-black text-3xl sm:text-4xl leading-none">
                  10%
                </p>
                <p className="text-white/70 text-[10px] uppercase tracking-widest mt-0.5">
                  Off Total
                </p>
              </div>
            </div>

            {/* card body */}
            <div className="px-6 sm:px-10 lg:px-14 py-8 sm:py-10">
              {/* offer list */}
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 sm:gap-y-4 mb-10 sm:mb-12">
                {offers.map((offer, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 group transition-all duration-500 ${
                      cardIn
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-4"
                    }`}
                    style={{ transitionDelay: `${300 + i * 80}ms` }}
                  >
                    <div className="shrink-0 w-7 h-7 rounded-lg bg-[#fe9a00]/12 border border-[#fe9a00]/25 flex items-center justify-center transition-colors duration-300 group-hover:bg-[#fe9a00]/20">
                      <FiCheck className="text-[#fe9a00] text-sm" />
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base leading-none shrink-0">
                        {offer.emoji}
                      </span>
                      <span className="text-gray-300 text-sm sm:text-base group-hover:text-white transition-colors duration-300 truncate">
                        {offer.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="h-px bg-linear-to-r from-transparent via-[#fe9a00]/30 to-transparent mb-10 sm:mb-12" />

              {/* Coupon + CTA */}
              <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8 lg:gap-10">
                {/* Coupon box */}
                <div className="w-full lg:w-auto flex-1">
                  <p className="text-gray-400 text-xs sm:text-sm mb-3 text-center lg:text-left">
                    Apply this code when you call or book online:
                  </p>
                  <div className="relative group/coupon">
                    {/* dashed border glow */}
                    <div className="absolute -inset-0.5 bg-linear-to-r from-[#fe9a00]/40 to-[#ffb84d]/40 rounded-2xl blur-sm opacity-0 group-hover/coupon:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex items-center justify-between gap-3 bg-[#060d1a] border-2 border-dashed border-[#fe9a00]/40 group-hover/coupon:border-[#fe9a00]/70 rounded-2xl px-5 py-4 transition-all duration-300">
                      <div className="min-w-0">
                        <p className="text-[#fe9a00]/70 text-[10px] uppercase tracking-widest mb-1">
                          Discount Code
                        </p>
                        <code className="text-white font-black text-sm sm:text-base lg:text-lg tracking-wider break-all select-all">
                          TJC2026
                        </code>
                      </div>
                      <button
                        onClick={handleCopy}
                        aria-label="Copy discount code"
                        className={`shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 active:scale-90 ${
                          copied
                            ? "bg-green-500 text-white shadow-[0_0_16px_rgba(34,197,94,0.4)]"
                            : "bg-[#fe9a00] hover:bg-[#e58900] text-white hover:shadow-[0_0_16px_rgba(254,154,0,0.4)] hover:scale-105"
                        }`}
                      >
                        {copied ? (
                          <>
                            <FiCheckCopied className="text-base" />
                            <span className="hidden sm:inline">Copied!</span>
                          </>
                        ) : (
                          <>
                            <FiCopy className="text-base" />
                            <span className="hidden sm:inline">Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* copied toast */}
                    <div
                      className={`absolute -bottom-8 left-1/2 -translate-x-1/2 transition-all duration-300 pointer-events-none ${
                        copied
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-2"
                      }`}
                    >
                      <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                        ✓ Code copied to clipboard!
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vertical divider (desktop only) */}
                <div className="hidden lg:block w-px self-stretch bg-linear-to-b from-transparent via-white/10 to-transparent" />

                {/* CTA */}
                <div className="w-full lg:w-auto shrink-0 text-center lg:text-left">
                  <p className="text-gray-400 text-xs sm:text-sm mb-3">
                    Ready to book? Call us directly:
                  </p>
                  <a
                    href="tel:+442030111198"
                    className="group/btn inline-flex items-center justify-center gap-2.5 sm:gap-3 bg-linear-to-r from-[#fe9a00] to-[#e58900] hover:from-[#ff8c00] hover:to-[#d47e00] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_32px_rgba(254,154,0,0.4)] active:scale-[0.98] w-full lg:w-auto"
                  >
                    <FiPhone className="text-lg sm:text-xl group-hover/btn:rotate-12 transition-transform duration-300" />
                    <div className="text-left">
                      <p className="text-[10px] text-white/75 leading-none mb-0.5 uppercase tracking-wider">
                        Call Now
                      </p>
                      <p className="leading-none tracking-wide">
                        +44 20 3011 1198
                      </p>
                    </div>
                  </a>
                  <p className="text-gray-500 text-xs mt-2">
                    Available 7 days a week
                  </p>
                </div>
              </div>
            </div>

            {/* card footer */}
            <div className="bg-white/2 border-t border-white/8 px-6 sm:px-10 lg:px-14 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Available across all of London
              </div>
              <p className="text-gray-600 text-xs text-center sm:text-right">
                Strata House, Waterloo Road, London, NW2 7UH
              </p>
            </div>
          
          </div>
        </div>
         <ReadMore data={ReadMoreData} layout="compact" />
      </div>
       
    </section>
  );
}
