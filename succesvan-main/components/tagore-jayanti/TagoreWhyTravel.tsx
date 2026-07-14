"use client";

import { useState, useRef, useEffect } from "react";
import { FiUsers, FiClock, FiHeart, FiMusic } from "react-icons/fi";

const benefits = [
  {
    icon: FiUsers,
    title: "Travel Together as One Group",
    desc: "Keep your family, performers, guests or community members together throughout the entire journey without splitting up.",
    stat: "16+ Seats",
    color: "from-blue-500/10 to-blue-600/5",
    border: "border-blue-500/20",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    statColor: "text-blue-400",
  },
  {
    icon: FiClock,
    title: "Save Time on Event Day",
    desc: "Avoid coordinating multiple cars, taxis or separate public transport routes across London on your cultural celebration day.",
    stat: "On-Time Always",
    color: "from-emerald-500/10 to-emerald-600/5",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    statColor: "text-emerald-400",
  },
  {
    icon: FiHeart,
    title: "Easier for Families & Elders",
    desc: "A minibus makes group travel smoother for children, elderly guests and people carrying event items or traditional attire.",
    stat: "All Ages Welcome",
    color: "from-rose-500/10 to-rose-600/5",
    border: "border-rose-500/20",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
    statColor: "text-rose-400",
  },
  {
    icon: FiMusic,
    title: "Perfect for Cultural Programmes",
    desc: "Ideal for music, poetry, dance, theatre, school events, temple visits and community celebrations across London.",
    stat: "Any Venue",
    color: "from-purple-500/10 to-purple-600/5",
    border: "border-purple-500/20",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    statColor: "text-purple-400",
  },
];

function useInView(threshold = 0.15) {
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

function BenefitCard({
  benefit,
  index,
  inView,
}: {
  benefit: (typeof benefits)[0];
  index: number;
  inView: boolean;
}) {
  const Icon = benefit.icon;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`relative group transition-all duration-700 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: `${index * 120}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Glow on hover */}
      <div
        className={`absolute -inset-0.5 rounded-2xl bg-linear-to-br ${benefit.color} blur-sm transition-opacity duration-500 ${
          hovered ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`relative h-full bg-[#0d1627] border ${benefit.border} rounded-2xl p-6 sm:p-7 flex flex-col gap-5 transition-all duration-500 ${
          hovered
            ? "border-opacity-60 shadow-2xl -translate-y-1"
            : "border-opacity-30"
        }`}
      >
        {/* Top row: icon + stat */}
        <div className="flex items-start justify-between">
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 ${benefit.iconBg} rounded-xl flex items-center justify-center transition-transform duration-300 ${
              hovered ? "scale-110" : ""
            }`}
          >
            <Icon className={`text-xl sm:text-2xl ${benefit.iconColor}`} />
          </div>
          <span
            className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${benefit.statColor} bg-white/5 border border-white/10 px-2.5 py-1 rounded-full`}
          >
            {benefit.stat}
          </span>
        </div>

        {/* Text */}
        <div className="flex flex-col gap-2 flex-1">
          <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
            {benefit.title}
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            {benefit.desc}
          </p>
        </div>

        {/* Bottom accent line */}
        <div
          className={`h-0.5 rounded-full bg-linear-to-r ${benefit.color} transition-all duration-500 ${
            hovered ? "opacity-100" : "opacity-30"
          }`}
        />
      </div>
    </div>
  );
}

export default function TagoreWhyTravel() {
  const { ref: sectionRef, inView } = useInView(0.1);
  const { ref: cardsRef, inView: cardsInView } = useInView(0.1);

  return (
    <section className="relative bg-linear-to-b from-[#0a0f1e] via-[#0d1627] to-[#0a0f1e] py-20 sm:py-24 lg:py-32 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-100 h-100 bg-[#fe9a00]/4 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-75 h-75 bg-purple-600/4 rounded-full blur-25" />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-2.5"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div
          ref={sectionRef}
          className={`text-center max-w-3xl mx-auto mb-14 sm:mb-16 lg:mb-20 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-[#fe9a00]/10 border border-[#fe9a00]/20 text-[#fe9a00] text-xs sm:text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-5 sm:mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fe9a00] animate-pulse" />
            Why Choose Group Travel
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-[1.1] tracking-tight mb-5 sm:mb-6">
            Make Your{" "}
            <span className="bg-linear-to-r from-[#fe9a00] via-[#ffb84d] to-[#fe9a00] bg-clip-text text-transparent">
              Tagore Jayanti
            </span>{" "}
            Journey Easier
          </h2>

          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            A Tagore Jayanti Celebration often brings people together from
            different parts of London. When everyone travels separately, the day
            can quickly become stressful.
          </p>
        </div>

        {/* Two-column intro text */}
        <div
          className={`grid md:grid-cols-2 gap-4 sm:gap-6 mb-14 sm:mb-16 lg:mb-20 transition-all duration-700 delay-200 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 sm:p-8">
            <div className="w-10 h-10 rounded-xl bg-[#fe9a00]/10 flex items-center justify-center mb-4">
              <span className="text-xl">🎶</span>
            </div>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Families may be travelling with elderly guests, children, musical
              instruments, traditional clothing, decorations, food, flowers,
              books, sound equipment or performance materials.
            </p>
          </div>
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 sm:p-8">
            <div className="w-10 h-10 rounded-xl bg-[#fe9a00]/10 flex items-center justify-center mb-4">
              <span className="text-xl">🚐</span>
            </div>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              With{" "}
              <span className="text-[#fe9a00] font-semibold">Success Van</span>{" "}
              minibus hire, your group stays together from pickup to drop-off.
              No waiting for late cars, no last-minute parking panic, no
              confusion at the venue entrance.
            </p>
          </div>
        </div>

        {/* Benefit Cards */}
        <div
          ref={cardsRef}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-14 sm:mb-16 lg:mb-20"
        >
          {benefits.map((benefit, i) => (
            <BenefitCard
              key={i}
              benefit={benefit}
              index={i}
              inView={cardsInView}
            />
          ))}
        </div>

        {/* Bottom CTA Strip */}
        <div
          className={`relative transition-all duration-700 delay-500 ${
            cardsInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="absolute -inset-0.5 bg-linear-to-r from-[#fe9a00]/40 via-[#ffb84d]/20 to-[#fe9a00]/40 rounded-2xl sm:rounded-3xl blur-sm" />
          <div className="relative bg-linear-to-r from-[#0d1627] via-[#111827] to-[#0d1627] border border-[#fe9a00]/20 rounded-2xl sm:rounded-3xl px-6 sm:px-10 lg:px-16 py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8">
            <div className="text-center sm:text-left">
              <p className="text-[#fe9a00] text-xs sm:text-sm font-bold uppercase tracking-widest mb-1 sm:mb-2">
                Ready to travel together?
              </p>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
                Book your minibus in minutes
              </h3>
              <p className="text-gray-400 text-sm mt-1 sm:mt-2">
                Use code{" "}
                <code className="text-[#fe9a00] font-bold bg-[#fe9a00]/10 px-2 py-0.5 rounded-md text-xs sm:text-sm">
                  TJC2026
                </code>{" "}
                for 10% off
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <a
                href="tel:+442030111198"
                className="inline-flex items-center justify-center gap-2 bg-linear-to-r from-[#fe9a00] to-[#e58900] hover:from-[#ff8c00] hover:to-[#d47e00] text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_30px_rgba(254,154,0,0.35)] active:scale-[0.98] whitespace-nowrap"
              >
                📞 Call Now
              </a>
              <a
                href="#booking"
                className="inline-flex items-center justify-center gap-2 bg-white/8 hover:bg-white/12 border border-white/15 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] whitespace-nowrap"
              >
                Get a Quote →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
