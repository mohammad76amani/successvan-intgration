"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  FiCheck,
  FiPhone,
  FiArrowRight,
  FiMapPin,
  FiTruck,
  FiClock,
  FiDollarSign,
  FiZap,
  FiSliders,
  FiAward,
  FiShield,
  FiChevronDown,
  FiArrowDown,
  FiPackage,
  FiBox,
  FiArrowUp,
  FiArrowLeft,
} from "react-icons/fi";
import FAQComponent, { FAQItem } from "@/components/static/fAQSection";
import { ReadMore } from "../ui/ReadMore";

// ─── Animated Counter Component ─────────────────────────────────────────────

// ─── HERO SECTION ───────────────────────────────────────────────────────────
export function VanHireLondonHero() {
  return (
    <section className="relative min-h-[100svh] md:min-h-screen flex items-center pt-26 md:pt-28 pb-16 overflow-hidden">
      {/* Background - حذف blur های سنگین در موبایل */}
      <div className="absolute inset-0 bg-[#0a0e1a]" />
      <div className="absolute inset-0 hidden md:block pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-linear-to-bl from-orange-500/8 via-amber-500/4 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-linear-to-tr from-blue-500/5 via-cyan-500/3 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image - اول در موبایل برای LCP بهتر */}
          <div className="order-1 lg:order-2">
            <div className="relative">
              {/* حذف blur decoration در موبایل */}
              <div className="hidden md:block absolute -inset-4 bg-linear-to-r from-orange-500/10 via-transparent to-amber-500/10 rounded-3xl blur-2xl pointer-events-none" />

              <div className="relative h-[216px] md:h-[400px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
                <Image
                  src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/van-hire-london.jpg"
                  alt="Van Hire London - Success Van Hire"
                  fill
                  className="object-cover"
                  priority
                  fetchPriority="high"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
                  quality={70}
                  loading="eager"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#0a0e1a]/60 via-transparent to-transparent pointer-events-none" />

                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto">
                  <div className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl">
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-white text-xs md:text-sm font-semibold">
                      Vans Available Today
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="order-2 lg:order-1">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white md:mt-12 mb-6 leading-[1.05] tracking-tight">
              Van Hire in London{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-linear-to-r from-[#fe9a00] via-amber-400 to-[#fe9a00] bg-clip-text text-transparent">
                  Self-Drive Rental for Moves and Business
                </span>
              </span>
            </h1>

            <p className="text-sm md:text-base text-slate-300/90 mb-2 leading-relaxed max-w-xl">
              Book self-drive van hire in London with Success Van Hire for house
              moves, business deliveries, furniture collection and short-term
              transport needs. Compare small vans, Transit vans, large vans and
              Luton vans, then reserve online with clear pricing. Daily, weekend
              and regular business bookings are available across Greater London,
              with same-day options subject to availability. Book online in
              minutes or call{" "}
              <a
                href="tel:+442030111198"
                className="text-amber-400 hover:text-blue-300 underline"
              >
                +44 20 3011 1198
              </a>{" "}
              for help choosing the right van size.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href="/reservation"
                className="group px-8 py-4 bg-linear-to-r from-[#fe9a00] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20"
              >
                Book Your Van Now
                <FiArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <a
                href="tel:+442030111198"
                className="group px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all duration-300 border border-white/10 flex items-center justify-center gap-3"
              >
                <FiPhone size={18} className="text-[#fe9a00]" />
                +44 20 3011 1198
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── WHY CHOOSE SECTION ────────────────────────────────────────────────────
export function WhyChooseSection() {
  const reasons = [
    {
      icon: FiDollarSign,
      title: "Clear Van Hire Prices",
      description:
        "Compare daily, weekend, weekly and monthly van hire in London prices with no hidden charges. Get a clear van hire cost before you book, with flexible options for small, medium, large and Luton vans.",

      points: [
        "Clear upfront van hire cost",
        "Daily, weekend & weekly prices",
        "No hidden booking charges",
      ],
      linear: "from-green-500/10 to-emerald-500/10",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-400",
    },
    {
      icon: FiZap,
      title: "Fast Online Van Booking",
      description:
        "Book van hire in London online in minutes. Choose your van size, pickup date and hire duration, then reserve your van with quick confirmation.",
      points: [
        "Simple online reservation",
        "Quick booking confirmation",
        "Same-day options when available",
      ],
      linear: "from-blue-500/10 to-cyan-500/10",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
    },
    {
      icon: FiTruck,
      title: "Small, Transit, Large & Luton Vans",
      description:
        "Our fleet includes small van hire, transit van hire, large van hire and Luton van hire options for moving, delivery, business and furniture transport jobs.",
      points: [
        "Small vans for quick jobs",
        "Transit vans for everyday moves",
        "Large & Luton vans for bigger loads",
      ],
      linear: "from-purple-500/10 to-violet-500/10",
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-400",
    },
    {
      icon: FiMapPin,
      title: "Van Rental Across Greater London",
      description:
        "Hire a van in London with coverage across Central, North, South, East and West London. We serve local customers, businesses and movers across Greater London.",
      points: [
        "Central London coverage",
        "North, South, East & West London",
        "Flexible pickup support",
      ],
      linear: "from-orange-500/10 to-amber-500/10",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-400",
    },
  ];

  const ReadMoreData = {
    linkUrl: "/blog/van-hire-london-prices-in-2026-daily-weekly-monthly-rates",
    title: "Van Rental In London Prices in 2026",
    description:
      "Imagine cruising through the bustling streets of London with ease, all thanks to the perfect van hire that suits your needs and budget.",
    iconType: "chevron", // or "chevron" or "custom"
    themeColors: {
      primary: "#fff", // Orange – your brand accent for headlines
      secondary: "#0f172b", // Slate – used for subtle borders
      background: "rgba(15, 23, 43, 0.2)",
      text: "#fff", // Slate text
      accent: "#fe9a00", // Orange CTA & icon
    },
  } as const;

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0a0e1a] via-[#0d1321] to-[#0a0e1a]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-px bg-linear-to-r from-transparent via-orange-500/20 to-transparent" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-semibold mb-6 tracking-wide uppercase">
            Why Us
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-5">
            Why Choose Success Van Hire for{" "}
            <span className="bg-linear-to-r from-[#fe9a00] to-amber-400 bg-clip-text text-transparent">
              Van Hire in London
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            We deliver reliability, transparent pricing, and exceptional service
            for every van rental in London. Our fleet covers{" "}
            <Link
              href="/self-drive-van-hire-london"
              target="_blank"
              className="text-amber-400 hover:text-blue-300 underline"
            >
              self-drive van hire
            </Link>{" "}
            self-drive van hire across North, South, East, West, Central, and
            Greater London with competitive rates and easy online booking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {reasons.map((reason, i) => {
            const Icon = reason.icon;
            return (
              <div
                key={i}
                className="group relative p-7 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-500 bg-white/2 hover:bg-white/4 backdrop-blur-sm overflow-hidden"
              >
                {/* Card linear glow on hover */}
                <div
                  className={`absolute inset-0 bg-linear-to-br ${reason.linear} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                <div className="relative z-10">
                  <div
                    className={`mb-5 p-3.5 ${reason.iconBg} rounded-xl w-fit group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={reason.iconColor} size={26} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2.5">
                    {reason.title}
                  </h3>
                  <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                    {reason.description}
                  </p>
                  <ul className="space-y-2.5">
                    {reason.points.map((point, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-2.5 text-slate-300"
                      >
                        <FiCheck
                          className="text-[#fe9a00] shrink-0 mt-0.5"
                          size={16}
                        />
                        <span className="text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
        <ReadMore data={ReadMoreData} layout="compact" />
      </div>
    </section>
  );
}

// ─── VAN TYPES SECTION ──────────────────────────────────────────────────────
export function VanTypesSection() {
  const [activeVan, setActiveVan] = useState(0);

  const vans = [
    {
      name: "Small Van",
      subtitle: "City Van",
      icon: FiPackage,
      capacity: "Up to 3.5m³",
      payload: "Up to 600kg",
      bestFor: [
        "Small deliveries & parcels",
        "IKEA & furniture pickups",
        "Student moves",
        "Business parcels",
      ],
      examples: "Ford Transit Courier, VW Caddy",
      color: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30",
      tagColor: "bg-blue-500/10 text-blue-400",
      iconColor: "text-blue-400",
    },
    {
      name: "Medium Van",
      subtitle: "Transit Van Hire",
      icon: FiBox,
      capacity: "Up to 6m³",
      payload: "Up to 1,000kg",
      bestFor: [
        "1-bed flat moves",
        "Business delivery routes",
        "Equipment transport",
        "Trade tools & supplies",
      ],
      examples:
        "Ford Transit Custom, Vauxhall Vivaro, transit van rental options",
      color: "from-purple-500/20 to-violet-500/20",
      borderColor: "border-purple-500/30",
      tagColor: "bg-purple-500/10 text-purple-400",
      iconColor: "text-purple-400",
    },
    {
      name: "Large Van",
      subtitle: "Large Van Hire",
      icon: FiTruck,
      capacity: "Up to 11m³",
      payload: "Up to 1,300kg",
      bestFor: [
        "House removals",
        "Office relocations",
        "Heavy furniture",
        "Long-distance moves",
      ],
      examples:
        "Ford Transit LWB, Mercedes Sprinter, large transit van rental London",
      color: "from-orange-500/20 to-amber-500/20",
      borderColor: "border-orange-500/30",
      tagColor: "bg-orange-500/10 text-orange-400",
      iconColor: "text-orange-400",
    },
    {
      name: "Luton Van",
      subtitle: "Luton Van Hire",
      icon: FiTruck,
      capacity: "Up to 17m³",
      payload: "Up to 1,500kg",
      bestFor: [
        "Full house removals",
        "Business relocation",
        "Large delivery jobs",
        "Commercial logistics",
      ],
      examples: "Box van hire, tail lift options, ideal for larger house moves",
      color: "from-emerald-500/20 to-green-500/20",
      borderColor: "border-emerald-500/30",
      tagColor: "bg-emerald-500/10 text-emerald-400",
      iconColor: "text-emerald-400",
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0a0e1a] via-[#0f1729] to-[#0a0e1a]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-semibold mb-6 tracking-wide uppercase">
            Our Fleet
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-5">
            Choose the{" "}
            <span className="bg-linear-to-r from-[#fe9a00] to-amber-400 bg-clip-text text-transparent">
              Right Van
            </span>{" "}
            for Your Job
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Choose the right van size for your job and avoid paying for more
            space than you need. Our London fleet includes small vans for quick
            city trips, Transit-size vans for everyday moves, large vans for
            furniture and office jobs, and Luton vans for bigger house moves.
          </p>
        </div>

        {/* Featured Image */}
        <div className="relative aspect-21/9 rounded-2xl overflow-hidden mb-12 border border-white/5">
          <Image
            src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/van-hire-london2.png"
            alt="Van hire London"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 80vw"
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#0a0e1a] via-[#0a0e1a]/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-3">
            {vans.map((van, i) => {
              const Icon = van.icon;
              return (
                <button
                  key={i}
                  onClick={() => setActiveVan(i)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                    activeVan === i
                      ? "bg-[#fe9a00] text-white shadow-lg shadow-orange-500/20"
                      : "bg-black/40 text-white/80 hover:bg-black/60 backdrop-blur-sm border border-white/10"
                  }`}
                >
                  <Icon size={16} /> {van.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Van Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {vans.map((van, i) => {
            const Icon = van.icon;
            return (
              <div
                key={i}
                onClick={() => setActiveVan(i)}
                className={`group relative p-6 rounded-2xl border transition-all duration-500 cursor-pointer overflow-hidden ${
                  activeVan === i
                    ? `${van.borderColor} bg-white/4`
                    : "border-white/5 bg-white/2 hover:border-white/10"
                }`}
              >
                <div
                  className={`absolute inset-0 bg-linear-to-br ${van.color} transition-opacity duration-500 ${
                    activeVan === i ? "opacity-100" : "opacity-0"
                  }`}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-white/5 rounded-lg">
                      <Icon className={`${van.iconColor}`} size={28} />
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold ${van.tagColor}`}
                    >
                      {van.subtitle}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1">
                    {van.name}
                  </h3>

                  <div className="flex gap-4 mb-4 text-xs text-slate-400">
                    <span>{van.capacity}</span>
                    <span>•</span>
                    <span>{van.payload}</span>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                      Best for
                    </p>
                    <ul className="space-y-2">
                      {van.bestFor.map((item, j) => (
                        <li
                          key={j}
                          className="text-sm text-slate-300 flex items-start gap-2"
                        >
                          <span className="text-[#fe9a00] mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <p className="text-xs text-slate-500">{van.examples}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── COVERAGE AREAS SECTION ─────────────────────────────────────────────────
export function CoverageAreasSection() {
  const [expandedRegion, setExpandedRegion] = useState<string | null>(
    "Central London",
  );

  const areas = [
    {
      region: "Central London",
      icon: FiMapPin,
      iconColor: "text-blue-400",
      areas: [
        "Westminster",
        "London Bridge",
        "Paddington",
        "Kings Cross",
        "Victoria",
        "Soho",
        "Covent Garden",
      ],
    },
    {
      region: "North London",
      icon: FiArrowUp,
      iconColor: "text-purple-400",
      areas: [
        "Enfield",
        "Barnet",
        "Finchley",
        "Tottenham",
        "Wood Green",
        "Highgate",
        "Muswell Hill",
      ],
    },
    {
      region: "South London",
      icon: FiArrowDown,
      iconColor: "text-green-400",
      areas: [
        "Croydon",
        "Wimbledon",
        "Brixton",
        "Clapham",
        "Lewisham",
        "Greenwich",
        "Dulwich",
      ],
    },
    {
      region: "East London",
      icon: FiArrowRight,
      iconColor: "text-orange-400",
      areas: [
        "Stratford",
        "Barking",
        "Ilford",
        "Romford",
        "Canary Wharf",
        "Hackney",
        "Tower Hamlets",
      ],
    },
    {
      region: "West London",
      icon: FiArrowLeft,
      iconColor: "text-amber-400",
      areas: [
        "Hounslow",
        "Ealing",
        "Acton",
        "Wembley",
        "Harrow",
        "Richmond",
        "Hammersmith",
      ],
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0a0e1a] via-[#0d1321] to-[#0a0e1a]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-px bg-linear-to-r from-transparent via-orange-500/20 to-transparent" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <span className="inline-block px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-semibold mb-6 tracking-wide uppercase">
              Coverage
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-5">
              Van Hire Across{" "}
              <span className="bg-linear-to-r from-[#fe9a00] to-amber-400 bg-clip-text text-transparent">
                All of London
              </span>
            </h2>
            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
              Our van rental London service covers Central London, North London,
              South London, East London and West London, including Westminster,
              Paddington, Kings Cross, Finchley, Wembley, Croydon, Stratford,
              Ealing and Canary Wharf. Whether you want to hire a van in London
              for a local move, business delivery or furniture pickup, Success
              Van Hire gives you flexible self-drive options across Greater
              London.
            </p>

            {/* Accordion Style Areas */}
            <div className="space-y-3">
              {areas.map((area) => {
                const Icon = area.icon;
                return (
                  <div
                    key={area.region}
                    className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                      expandedRegion === area.region
                        ? "border-orange-500/30 bg-orange-500/5"
                        : "border-white/5 bg-white/2 hover:border-white/10"
                    }`}
                  >
                    <button
                      onClick={() =>
                        setExpandedRegion(
                          expandedRegion === area.region ? null : area.region,
                        )
                      }
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-1.5 bg-white/5 rounded-lg ${area.iconColor}`}
                        >
                          <Icon size={18} />
                        </div>
                        <span className="font-bold text-white">
                          {area.region}
                        </span>
                        <span className="text-xs text-slate-500">
                          {area.areas.length} areas
                        </span>
                      </div>
                      <FiChevronDown
                        className={`text-slate-400 transition-transform duration-300 ${
                          expandedRegion === area.region ? "rotate-180" : ""
                        }`}
                        size={20}
                      />
                    </button>
                    {expandedRegion === area.region && (
                      <div className="px-4 pb-4">
                        <div className="flex flex-wrap gap-2">
                          {area.areas.map((a, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 hover:border-orange-500/30 hover:text-orange-300 transition-colors cursor-default"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right - Visual Map Placeholder */}
          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute -inset-8 bg-linear-to-r from-orange-500/5 to-amber-500/5 rounded-3xl blur-3xl" />
              <div className="relative bg-linear-to-br from-slate-800/40 to-slate-900/40 rounded-2xl border border-white/5 p-10 backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-20 h-20 bg-linear-to-br from-orange-500/20 to-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiMapPin className="text-[#fe9a00]" size={36} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Greater London Coverage
                  </h3>
                  <p className="text-slate-400 mb-8">
                    Our London van rental service covers all 32 London boroughs
                    plus the City of London, with flexible pickup and drop-off
                    locations available across Greater London.
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-left">
                    {[
                      { label: "Boroughs Covered", value: "32+" },
                      { label: "Pickup Points", value: "50+" },
                      { label: "Same-Day Available", value: "Yes" },
                      { label: "Weekend Service", value: "Yes" },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className="p-4 bg-white/3 rounded-xl border border-white/5"
                      >
                        <div className="text-xl font-bold text-[#fe9a00]">
                          {stat.value}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {stat.label}
                        </div>
                      </div>
                    ))}
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

// ─── USE CASES SECTION ──────────────────────────────────────────────────────
export function UseCasesSection() {
  const useCases = [
    {
      title: "Moving House Van Hire",
      icon: FiTruck,
      description:
        "Book moving house van hire in London for flat moves, student relocations, furniture transport and storage trips. Choose a medium van, large van or Luton van depending on your home size, load volume and moving distance.",
      items: [
        "Flat & house moves",
        "Student accommodation",
        "Furniture transport",
        "Storage unit trips",
      ],
      linear: "from-blue-500/8 to-cyan-500/8",
      accentColor: "text-blue-400",
      iconColor: "text-blue-400",
    },
    {
      title: "Business Van Rental London",
      description:
        "Flexible business van rental London for couriers, retail teams, trades, construction supplies and e-commerce deliveries. Daily, weekly and long-term van hire options are available.",
      icon: FiPackage,

      items: [
        "Courier & parcels",
        "Retail deliveries",
        "Construction supplies",
        "E-commerce fulfilment",
      ],
      linear: "from-emerald-500/8 to-green-500/8",
      accentColor: "text-emerald-400",
      iconColor: "text-emerald-400",
    },
    {
      title: "Small Van Hire for Furniture Pickups",
      icon: FiBox,
      description:
        "Use small van hire or transit van hire for IKEA collections, Facebook Marketplace purchases, Gumtree pickups, appliances, sofas and bulky household items.",
      items: [
        "Sofas & beds",
        "Wardrobes & desks",
        "Appliances",
        "Large item collections",
      ],
      linear: "from-purple-500/8 to-violet-500/8",
      accentColor: "text-purple-400",
      iconColor: "text-purple-400",
    },
  ];
  const ReadMoreData2 = {
    linkUrl: "/blog/best-van-size-for-moving-house-in-london-2026",
    title: "Best Van Size For Moving House In London 2026",
    description:
      "Are you planning a move in the bustling city of London and wondering what van size will best fit your needs?",
    iconType: "chevron", // or "chevron" or "custom"
    themeColors: {
      primary: "#fff", // Orange – your brand accent for headlines
      secondary: "#0f172b", // Slate – used for subtle borders
      background: "rgba(15, 23, 43, 0.2)",
      text: "#fff", // Slate text
      accent: "#fe9a00", // Orange CTA & icon
    },
  } as const;

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0a0e1a] via-[#0d1321] to-[#0a0e1a]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-px bg-linear-to-r from-transparent via-orange-500/20 to-transparent" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-semibold mb-6 tracking-wide uppercase">
            Use Cases
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-5">
            Perfect for Every Situation –{" "}
            <span className="bg-linear-to-r from-[#fe9a00] to-amber-400 bg-clip-text text-transparent">
              Moves, Deliveries & Business Use
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {useCases.map((useCase, i) => {
            const Icon = useCase.icon;
            return (
              <div
                key={i}
                className="group relative p-8 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-500 bg-white/2 hover:bg-white/4 overflow-hidden"
              >
                <div
                  className={`absolute inset-0 bg-linear-to-br ${useCase.linear} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className={`p-2.5 bg-white/5 rounded-lg ${useCase.iconColor}`}
                    >
                      <Icon size={24} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {useCase.title}
                  </h3>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    {useCase.description}
                  </p>
                  <ul className="space-y-3">
                    {useCase.items.map((item, j) => (
                      <li
                        key={j}
                        className="flex items-center gap-3 text-slate-300"
                      >
                        <div className="w-1.5 h-1.5 bg-[#fe9a00] rounded-full shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
        <ReadMore data={ReadMoreData2} layout="compact" />
      </div>
    </section>
  );
}

// ─── BOOKING STEPS SECTION ──────────────────────────────────────────────────
export function BookingStepsSection() {
  const steps = [
    {
      number: "01",
      title: "Choose Your Van Hire Option",
      description: "Pick a small, Transit, large or Luton van for your job.",
      icon: FiTruck,
    },
    {
      number: "02",
      title: "Check Van Hire Prices",
      description: "Choose daily, weekend, weekly or long-term hire.",
      icon: FiClock,
    },
    {
      number: "03",
      title: "Reserve Your Van in London",
      description: "Set your pickup date, time and booking details.",
      icon: FiMapPin,
    },

    {
      number: "04",
      title: "Collect & Drive",
      description: "Your self-drive van is ready for your move or delivery.",
      icon: FiZap,
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0a0e1a] via-[#0f1729] to-[#0a0e1a]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-semibold mb-6 tracking-wide uppercase">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-5">
            Book Your Van{" "}
            <span className="bg-linear-to-r from-[#fe9a00] to-amber-400 bg-clip-text text-transparent">
              in 4 Easy Steps
            </span>
          </h2>
          <p className="text-slate-400 text-lg">
            From choosing your van size to confirming your pickup time, you can
            book a van in London online in minutes. Compare van rental options,
            select your hire duration and reserve your self-drive van with fast
            confirmation.
          </p>
        </div>

        {/* Desktop Steps */}
        <div className="hidden lg:grid grid-cols-4 gap-6 mb-12">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="relative group">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute top-10 left-[60%] w-[80%] h-px bg-linear-to-r from-orange-500/30 to-transparent z-0" />
                )}

                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 mx-auto mb-5 relative">
                    <div className="absolute inset-0 bg-linear-to-br from-orange-500/20 to-amber-500/20 rounded-2xl rotate-3 group-hover:rotate-6 transition-transform" />
                    <div className="relative w-full h-full bg-[#0f1729] border border-white/10 rounded-2xl flex flex-col items-center justify-center group-hover:border-orange-500/30 transition-colors">
                      <Icon className="text-[#fe9a00]" size={24} />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#fe9a00] rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {step.number}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-bold text-white text-sm mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Steps */}
        <div className="lg:hidden space-y-4 mb-12">
          {steps.map((step, i) => {
            return (
              <div
                key={i}
                className="flex items-start gap-4 p-5 bg-white/2 border border-white/5 rounded-xl"
              >
                <div className="w-12 h-12 bg-linear-to-br from-orange-500/20 to-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[#fe9a00]">
                    {step.number}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-400">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Link
            href="/reservation"
            className="group inline-flex items-center gap-3 px-10 py-4 bg-linear-to-r from-[#fe9a00] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5"
          >
            Book Your Van in London Today
            <FiArrowRight
              size={20}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ SECTION ────────────────────────────────────────────────────────────
export function FAQSection() {
  const faqs: FAQItem[] = [
    {
      question: "How much does it cost to hire a van in London?",
      answer:
        "Van hire prices in London depend on van size, duration, and location. Small van rental in London is usually the most affordable option, while Luton van hire London costs more due to its larger capacity. Contact Success Van Hire to get a quick quote and reserve a van in London with transparent pricing.",
    },
    {
      question: "Can I hire a van in London for one day?",
      answer:
        "Yes! You can book a van in London for one day, a weekend, or longer. We offer flexible daily van rental London options plus weekly packages.",
    },
    {
      question: "Do you offer van hire in Central London?",
      answer:
        "Absolutely. We provide comprehensive coverage across Central London, including Westminster, Paddington, Kings Cross, and all major areas throughout Greater London.",
    },
    {
      question: "What size van do I need for moving house?",
      answer:
        "For a studio or 1-bedroom flat, a medium van is typically sufficient. For 2+ bedroom homes or large amounts of furniture, we recommend a large or Luton van. Our team can help you choose the right size.",
    },
    {
      question: "Can I hire a van in London for business deliveries?",
      answer:
        "Yes, we offer both short-term and long-term business rental options with competitive rates and flexible packages designed for commercial use.",
    },
    {
      question: "Is van hire available on weekends?",
      answer:
        "Yes, weekend van hire is available. We recommend booking in advance to guarantee availability, especially during busy periods.",
    },
    {
      question: "What are your London van hire prices?",
      answer:
        "London van hire prices depend on the van size, hire duration, date and availability. Small vans usually cost less than large vans or Luton vans. Success Van Hire provides clear pricing before booking, so you can compare your hire cost and choose the right option.",
    },
    {
      question: "Can I rent a Transit van in London?",
      answer:
        "Yes, Transit van hire and transit van rental options are available for moving, deliveries, trade work and furniture transport. A Transit van is a practical choice if you need more space than a small van but do not need a full Luton van.",
    },
    {
      question: "Do you offer self-drive van hire in London?",
      answer:
        "Yes, Success Van Hire focuses on self-drive van hire in London. You can book a van, collect it, drive it yourself and return it based on your selected hire duration.",
    },
    {
      question: "Can I hire a van in London for a few hours?",
      answer:
        "Short-duration and 4 hour van hire may be available depending on the date, van type and booking schedule. Contact us or start an online reservation to check availability.",
    },
  ];

  return (
    <FAQComponent
      title="Frequently Asked Questions about Van Hire in London"
      subtitle="Find answers to common questions about our van hire services in London"
      faqs={faqs}
      showSearch={false}
      defaultOpen={0}
      accentColor="#fe9a00"
      backgroundColor="#0a0e1a"
    />
  );
}

// ─── FINAL CTA SECTION ─────────────────────────────────────────────────────
export function FinalCTASection() {
  const benefits = [
    { icon: FiZap, label: "Same-day booking available" },
    { icon: FiSliders, label: "Daily, weekly & long-term plans" },
    { icon: FiTruck, label: "Moving, business & delivery vans" },
    { icon: FiAward, label: "Trusted across all of London" },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-[#0a0e1a] via-[#12182a] to-[#0a0e1a]" />

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-125 h-125 bg-linear-to-bl from-orange-500/8 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-100 h-100 bg-linear-to-tr from-amber-500/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-px bg-linear-to-r from-transparent via-orange-500/20 to-transparent" />

      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-full mb-8 backdrop-blur-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-amber-200/90 text-sm font-medium">
              Vans available for immediate booking
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
            Ready to Book Your
            <br />
            <span className="bg-linear-to-r from-[#fe9a00] via-amber-400 to-[#fe9a00] bg-clip-text text-transparent">
              Van in London?
            </span>
          </h2>

          <p className="text-sm md:text-base text-slate-300/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Whether you need to rent a van in London for a quick IKEA run, book
            moving van hire for a full house move, or arrange business van
            rental for regular deliveries, Success Van Hire gives you reliable
            self-drive vans, clear van hire prices and flexible daily or weekly
            hire options across Greater London.
          </p>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10">
            {benefits.map(({ icon: Icon, label }, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 rounded-xl bg-white/3 border border-white/5 hover:border-orange-500/20 transition-all duration-300 group"
              >
                <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                  <Icon className="text-[#fe9a00]" size={20} />
                </div>
                <span className="text-slate-200 text-sm font-medium">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/reservation"
              className="group px-10 py-4 bg-linear-to-r from-[#fe9a00] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 text-lg"
            >
              Book Your Van Online
              <FiArrowRight
                size={22}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <a
              href="tel:+442030111198"
              className="group px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all duration-300 border border-white/10 hover:border-white/20 flex items-center justify-center gap-3 backdrop-blur-sm text-lg"
            >
              <FiPhone
                size={20}
                className="group-hover:rotate-12 transition-transform"
              />
              Call Us
            </a>
          </div>

          {/* Trust line */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <FiShield size={14} className="text-green-400/60" />
              Fully insured vans
            </span>
            <span className="flex items-center gap-1.5">
              <FiCheck size={14} className="text-green-400/60" />
              No hidden charges
            </span>
            <span className="flex items-center gap-1.5">
              <FiClock size={14} className="text-green-400/60" />
              24/7 customer support
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
