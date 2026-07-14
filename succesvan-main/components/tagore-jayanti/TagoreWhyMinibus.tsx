"use client";

import { useRef, useEffect, useState } from "react";
import { FiX, FiCheck, FiArrowRight, FiPhone } from "react-icons/fi";

const comparison = [
  {
    feature: "Coordination",
    cars: "Hard to coordinate multiple drivers",
    minibus: "One organised journey for everyone",
    icon: "🗂️",
  },
  {
    feature: "Parking",
    cars: "More parking problems at the venue",
    minibus: "Group arrives together, no parking stress",
    icon: "🅿️",
  },
  {
    feature: "Arrival Time",
    cars: "Guests may arrive late or get lost",
    minibus: "Everyone arrives on time, together",
    icon: "⏰",
  },
  {
    feature: "Navigation",
    cars: "Higher chance of route confusion",
    minibus: "Professional driver handles everything",
    icon: "🗺️",
  },
  {
    feature: "Comfort",
    cars: "Not ideal for elders or children",
    minibus: "Better for families and community groups",
    icon: "🛋️",
  },
  {
    feature: "Value",
    cars: "Fuel, parking and taxi costs add up",
    minibus: "10% discount for Tagore Jayanti travel",
    icon: "💰",
  },
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

export default function TagoreWhyMinibus() {
  const { ref: headerRef, inView: headerIn } = useInView(0.1);
  const { ref: tableRef, inView: tableIn } = useInView(0.05);
  const { ref: ctaRef, inView: ctaIn } = useInView(0.1);

  return (
    <section className="relative bg-linear-to-b from-[#0a0f1e] via-[#0d1627] to-[#0a0f1e] py-20 sm:py-24 lg:py-32 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 -left-24 w-87.5 h-87.5 bg-red-600/4 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 -right-24 w-87.5 h-87.5 bg-[#fe9a00]/6 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-2"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div
          ref={headerRef}
          className={`text-center max-w-4xl mx-auto mb-14 sm:mb-16 lg:mb-20 transition-all duration-700 ${
            headerIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 bg-[#fe9a00]/10 border border-[#fe9a00]/25 text-[#fe9a00] text-xs sm:text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-5 sm:mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fe9a00] animate-pulse" />
            The Smarter Choice
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-[1.1] tracking-tight mb-6 sm:mb-8">
            Why Choose{" "}
            <span className="bg-linear-to-r from-[#fe9a00] via-[#ffb84d] to-[#fe9a00] bg-clip-text text-transparent">
              Minibus Hire
            </span>{" "}
            Instead of Multiple Cars?
          </h2>

          <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
            For a busy cultural event, using several cars can create more
            problems than it solves. Different drivers may take different
            routes, parking may be limited, and guests may arrive at different
            times. Public transport can also be difficult when people are
            travelling with children, elderly relatives, event clothes,
            instruments or food.
          </p>

          {/* Highlight pill */}
          <div className="inline-flex flex-wrap justify-center gap-2 sm:gap-3 mt-2">
            {[
              "One Vehicle",
              "One Pickup Plan",
              "One Arrival Time",
              "One Easier Journey",
            ].map((pill, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-500 ${
                  headerIn
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${200 + i * 100}ms` }}
              >
                <FiCheck className="text-[#fe9a00] text-sm shrink-0" />
                {pill}
              </span>
            ))}
          </div>
        </div>

        {/* ── Comparison Table ── */}
        <div
          ref={tableRef}
          className={`max-w-5xl mx-auto mb-14 sm:mb-16 lg:mb-20 transition-all duration-700 delay-200 ${
            tableIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Column Headers */}
          <div className="grid grid-cols-2 sm:grid-cols-[auto_1fr_1fr] gap-0 mb-3 px-2">
            <div className="hidden sm:block" />
            <div className="flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl py-2.5 sm:py-3 mx-1 sm:mx-2">
              <FiX className="text-red-400 text-base sm:text-lg" />
              <span className="text-red-300 font-bold text-xs sm:text-sm uppercase tracking-wider">
                Multiple Cars
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-[#fe9a00]/10 border border-[#fe9a00]/25 rounded-xl py-2.5 sm:py-3 mx-1 sm:mx-2">
              <FiCheck className="text-[#fe9a00] text-base sm:text-lg" />
              <span className="text-[#fe9a00] font-bold text-xs sm:text-sm uppercase tracking-wider">
                Success Van
              </span>
            </div>
          </div>

          {/* Rows */}
          <div className="rounded-2xl overflow-hidden border border-white/8 bg-[#0d1627]">
            {comparison.map((item, i) => (
              <div
                key={i}
                className={`grid grid-cols-2 sm:grid-cols-[auto_1fr_1fr] transition-all duration-500 ${
                  tableIn
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-6"
                } ${
                  i !== comparison.length - 1 ? "border-b border-white/6" : ""
                } group hover:bg-white/2.5 `}
                style={{ transitionDelay: `${300 + i * 90}ms` }}
              >
                {/* Feature label — desktop */}
                <div className="hidden sm:flex items-center gap-2.5 px-4 lg:px-6 py-4 sm:py-5 border-r border-white/6  min-w-35 lg:min-w-40">
                  <span className="text-base lg:text-lg shrink-0">
                    {item.icon}
                  </span>
                  <span className="text-gray-300 font-semibold text-xs sm:text-sm">
                    {item.feature}
                  </span>
                </div>

                {/* Cars column */}
                <div className="flex items-start sm:items-center gap-2 sm:gap-3 px-3 sm:px-5 lg:px-6 py-4 sm:py-5 border-r border-white/6 bg-red-500/3">
                  <div className="shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mt-0.5 sm:mt-0">
                    <FiX className="text-red-400 text-[10px] sm:text-xs" />
                  </div>
                  <div className="min-w-0">
                    {/* Feature label — mobile only */}
                    <p className="sm:hidden text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                      <span>{item.icon}</span> {item.feature}
                    </p>
                    <p className="text-gray-400 text-xs sm:text-sm leading-snug">
                      {item.cars}
                    </p>
                  </div>
                </div>

                {/* Minibus column */}
                <div className="flex items-start sm:items-center gap-2 sm:gap-3 px-3 sm:px-5 lg:px-6 py-4 sm:py-5 bg-[#fe9a00]/4 group-hover:bg-[#fe9a00]/7 transition-colors duration-300">
                  <div className="shrink-0  w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#fe9a00]/15 border border-[#fe9a00]/30 flex items-center justify-center mt-0.5 sm:mt-0">
                    <FiCheck className="text-[#fe9a00] text-[10px] sm:text-xs" />
                  </div>
                  <div className="min-w-0">
                    {/* Feature label — mobile only */}
                    <p className="sm:hidden text-[10px] font-bold text-[#fe9a00]/60 uppercase tracking-wider mb-0.5">
                      Success Van
                    </p>
                    <p className="text-white text-xs sm:text-sm font-medium leading-snug">
                      {item.minibus}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table footer note */}
          <p className="text-center text-gray-500 text-xs sm:text-sm mt-4">
            🎉 Use code{" "}
            <code className="text-[#fe9a00] bg-[#fe9a00]/10 px-1.5 py-0.5 rounded font-bold">
              TJC2026
            </code>{" "}
            for 10% off your minibus booking
          </p>
        </div>

        {/* ── Visual Verdict Card ── */}
        <div
          ref={ctaRef}
          className={`max-w-5xl mx-auto transition-all duration-700 delay-400 ${
            ctaIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="relative">
            <div className="absolute -inset-0.5 bg-linear-to-r from-[#fe9a00]/40 via-[#ffb347]/20 to-[#fe9a00]/40 rounded-2xl sm:rounded-3xl blur-sm" />
            <div className="relative bg-[#0d1627] border border-[#fe9a00]/20 rounded-2xl sm:rounded-3xl overflow-hidden">
              {/* Top bar */}
              <div className="bg-linear-to-r from-[#fe9a00]/15 via-[#fe9a00]/8 to-transparent border-b border-[#fe9a00]/15 px-6 sm:px-10 py-4 flex items-center gap-3">
                <span className="text-xl">🏆</span>
                <p className="text-[#fe9a00] font-bold text-sm sm:text-base">
                  The Clear Winner
                </p>
              </div>

              <div className="px-6 sm:px-10 lg:px-14 py-8 sm:py-10">
                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                  {/* Left: Verdict scores */}
                  <div className="w-full lg:w-auto grid grid-cols-2 gap-3 sm:gap-4 lg:min-w-70">
                    {[
                      {
                        label: "Multiple Cars",
                        score: "2/6",
                        color: "text-red-400",
                        bg: "bg-red-500/8 border-red-500/15",
                        bar: "bg-red-400",
                        width: "w-1/3",
                      },
                      {
                        label: "Success Van",
                        score: "6/6",
                        color: "text-[#fe9a00]",
                        bg: "bg-[#fe9a00]/8 border-[#fe9a00]/20",
                        bar: "bg-[#fe9a00]",
                        width: "w-full",
                      },
                    ].map((v, i) => (
                      <div
                        key={i}
                        className={`${v.bg} border rounded-2xl px-4 py-4 sm:py-5 text-center col-span-1`}
                      >
                        <p className="text-gray-400 text-xs mb-1.5 truncate">
                          {v.label}
                        </p>
                        <p
                          className={`text-2xl sm:text-3xl font-black ${v.color} mb-2`}
                        >
                          {v.score}
                        </p>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${v.bar} ${v.width} rounded-full transition-all duration-1000 delay-700`}
                            style={{
                              width: ctaIn
                                ? v.width === "w-full"
                                  ? "100%"
                                  : "33%"
                                : "0%",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right: CTA */}
                  <div className="flex-1 text-center lg:text-left">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-3 sm:mb-4">
                      Make the smart choice for your group
                    </h3>
                    <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8">
                      Book your Tagore Jayanti minibus with Success Van today
                      and experience stress-free group travel across London.
                      Don't forget your 10% discount code.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                      <a
                        href="tel:+442030111198"
                        className="inline-flex items-center justify-center gap-2.5 bg-linear-to-r from-[#fe9a00] to-[#e58900] hover:from-[#ff8c00] hover:to-[#d47e00] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_32px_rgba(254,154,0,0.4)] active:scale-[0.98]"
                      >
                        <FiPhone className="text-lg" />
                        Call +44 20 3011 1198
                      </a>
                      <a
                        href="#booking"
                        className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
                      >
                        Get a Free Quote
                        <FiArrowRight />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
