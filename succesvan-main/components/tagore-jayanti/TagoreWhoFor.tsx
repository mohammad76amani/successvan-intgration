"use client";

import { useRef, useEffect, useState } from "react";
import {
  FiUsers,
  FiMusic,
  FiHome,
  FiBookOpen,
  FiMapPin,
  FiStar,
  FiArrowRight,
} from "react-icons/fi";

const groups = [
  {
    icon: FiUsers,
    title: "Families Attending Cultural Events",
    desc: "Travel with children, parents, grandparents and relatives in one comfortable vehicle without the stress of coordinating separate cars.",
    tag: "Most Popular",
    tagColor: "text-amber-400",
    tagBg: "bg-amber-400/10 border-amber-400/20",
    gradient: "from-amber-500/10 via-amber-600/5 to-transparent",
    border: "border-amber-500/20",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    glowColor: "rgba(245,158,11,0.15)",
  },
  {
    icon: FiMusic,
    title: "Performers and Artists",
    desc: "Carry costumes, instruments, props and performance materials without squeezing into small cars or relying on public transport.",
    tag: "Spacious Vehicles",
    tagColor: "text-purple-400",
    tagBg: "bg-purple-400/10 border-purple-400/20",
    gradient: "from-purple-500/10 via-purple-600/5 to-transparent",
    border: "border-purple-500/20",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    glowColor: "rgba(168,85,247,0.15)",
  },
  {
    icon: FiHome,
    title: "Community Groups",
    desc: "Make it easier for your members to attend the same venue at the same time, arriving together as one united group.",
    tag: "Group Friendly",
    tagColor: "text-emerald-400",
    tagBg: "bg-emerald-400/10 border-emerald-400/20",
    gradient: "from-emerald-500/10 via-emerald-600/5 to-transparent",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    glowColor: "rgba(52,211,153,0.15)",
  },
  {
    icon: FiBookOpen,
    title: "Schools and Students",
    desc: "Arrange organised travel for cultural performances, educational events or literature programmes with ease and confidence.",
    tag: "Safe & Reliable",
    tagColor: "text-blue-400",
    tagBg: "bg-blue-400/10 border-blue-400/20",
    gradient: "from-blue-500/10 via-blue-600/5 to-transparent",
    border: "border-blue-500/20",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    glowColor: "rgba(96,165,250,0.15)",
  },
  {
    icon: FiMapPin,
    title: "Temple & Cultural Centre Visitors",
    desc: "Travel to prayer halls, community centres, cultural venues and local event spaces across every borough of London.",
    tag: "All London",
    tagColor: "text-rose-400",
    tagBg: "bg-rose-400/10 border-rose-400/20",
    gradient: "from-rose-500/10 via-rose-600/5 to-transparent",
    border: "border-rose-500/20",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
    glowColor: "rgba(251,113,133,0.15)",
  },
  {
    icon: FiStar,
    title: "Event Guests",
    desc: "Book a minibus for guests who need a simple, comfortable way to get to and from the celebration without any hassle.",
    tag: "Premium Comfort",
    tagColor: "text-cyan-400",
    tagBg: "bg-cyan-400/10 border-cyan-400/20",
    gradient: "from-cyan-500/10 via-cyan-600/5 to-transparent",
    border: "border-cyan-500/20",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
    glowColor: "rgba(34,211,238,0.15)",
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

function GroupCard({
  group,
  index,
  inView,
}: {
  group: (typeof groups)[0];
  index: number;
  inView: boolean;
}) {
  const Icon = group.icon;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`relative transition-all duration-700 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hover glow */}
      <div
        className={`absolute -inset-0.5 rounded-2xl blur-md transition-opacity duration-500 ${
          hovered ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: `radial-gradient(ellipse at center, ${group.glowColor}, transparent 70%)`,
        }}
      />

      <div
        className={`relative h-full bg-[#0d1627] border ${group.border} rounded-2xl overflow-hidden flex flex-col transition-all duration-500 ${
          hovered ? "-translate-y-1 shadow-2xl" : ""
        }`}
      >
        {/* Top gradient wash */}
        <div
          className={`absolute inset-0 bg-linear-to-br ${group.gradient} opacity-60 pointer-events-none`}
        />

        <div className="relative z-10 p-6 sm:p-7 flex flex-col gap-4 flex-1">
          {/* Icon + Tag row */}
          <div className="flex items-start justify-between gap-3">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 ${group.iconBg} rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 ${
                hovered ? "scale-110" : ""
              }`}
            >
              <Icon className={`text-xl sm:text-2xl ${group.iconColor}`} />
            </div>
            <span
              className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${group.tagColor} ${group.tagBg} border px-2.5 py-1 rounded-full whitespace-nowrap`}
            >
              {group.tag}
            </span>
          </div>

          {/* Text */}
          <div className="flex flex-col gap-2 flex-1">
            <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
              {group.title}
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {group.desc}
            </p>
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          className={`h-0.5 bg-linear-to-r ${group.gradient} transition-all duration-500 ${
            hovered ? "opacity-100" : "opacity-40"
          }`}
        />
      </div>
    </div>
  );
}

export default function TagoreWhoFor() {
  const { ref: headerRef, inView: headerIn } = useInView(0.1);
  const { ref: gridRef, inView: gridIn } = useInView(0.05);
  const { ref: ctaRef, inView: ctaIn } = useInView(0.1);

  return (
    <section className="relative bg-linear-to-b from-[#0a0f1e] via-[#0d1627] to-[#0a0f1e] py-20 sm:py-24 lg:py-32 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-100 h-100 bg-[#fe9a00]/5 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 left-0 w-87.5 h-87.5 bg-purple-600/5 rounded-full blur-[110px]" />
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
          className={`text-center max-w-3xl mx-auto mb-14 sm:mb-16 lg:mb-20 transition-all duration-700 ${
            headerIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 bg-[#fe9a00]/10 border border-[#fe9a00]/25 text-[#fe9a00] text-xs sm:text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-5 sm:mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fe9a00] animate-pulse" />
            Who We Serve
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-[1.1] tracking-tight mb-5 sm:mb-6">
            Minibus Hire for{" "}
            <span className="bg-linear-to-r from-[#fe9a00] via-[#ffb84d] to-[#fe9a00] bg-clip-text text-transparent">
              Every Group
            </span>
          </h2>

          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            Success Van provides practical group transport for every type of
            Tagore Jayanti journey across London — from intimate family
            gatherings to large cultural performances.
          </p>
        </div>

        {/* ── Stats Bar ── */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-14 sm:mb-16 lg:mb-20 transition-all duration-700 delay-200 ${
            headerIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {[
            { value: "16+", label: "Seat Minibuses", emoji: "🚐" },
            { value: "24/7", label: "Available", emoji: "🕐" },
            { value: "1000+", label: "Groups Served", emoji: "👥" },
            { value: "100%", label: "London Coverage", emoji: "📍" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white/3 border border-white/8 rounded-2xl px-4 py-4 sm:py-5 text-center"
            >
              <div className="text-xl sm:text-2xl mb-1">{stat.emoji}</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
                {stat.value}
              </div>
              <div className="text-gray-500 text-xs sm:text-sm mt-0.5">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Cards Grid ── */}
        <div
          ref={gridRef}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-14 sm:mb-16 lg:mb-20"
        >
          {groups.map((group, i) => (
            <GroupCard key={i} group={group} index={i} inView={gridIn} />
          ))}
        </div>

        {/* ── Bottom CTA ── */}
        <div
          ref={ctaRef}
          className={`transition-all duration-700 delay-300 ${
            ctaIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="relative">
            <div className="absolute -inset-0.5 bg-linear-to-r from-[#fe9a00]/40 via-[#ffb347]/20 to-[#fe9a00]/40 rounded-2xl sm:rounded-3xl blur-sm" />
            <div className="relative bg-[#0d1627] border border-[#fe9a00]/20 rounded-2xl sm:rounded-3xl px-6 sm:px-10 lg:px-16 py-8 sm:py-10 lg:py-12">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
                {/* Left text */}
                <div className="text-center lg:text-left max-w-xl">
                  <p className="text-[#fe9a00] text-xs sm:text-sm font-bold uppercase tracking-widest mb-2">
                    Not sure which option fits you?
                  </p>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-2 sm:mb-3">
                    We'll find the right vehicle for your group
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Call us and describe your group — we'll match you to the
                    perfect minibus size and pick the best route for your Tagore
                    Jayanti journey.
                  </p>
                </div>

                {/* Right buttons */}
                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 w-full lg:w-auto shrink-0">
                  <a
                    href="tel:+442030111198"
                    className="group inline-flex items-center justify-center gap-2.5 bg-linear-to-r from-[#fe9a00] to-[#e58900] hover:from-[#ff8c00] hover:to-[#d47e00] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_32px_rgba(254,154,0,0.4)] active:scale-[0.98] whitespace-nowrap"
                  >
                    📞{" "}
                    <span>
                      Call{" "}
                      <span className="tracking-wide">+44 20 3011 1198</span>
                    </span>
                  </a>
                  <a
                    href="#booking"
                    className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] whitespace-nowrap"
                  >
                    Get a Free Quote
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
