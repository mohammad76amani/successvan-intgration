 "use client"
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  FiCheck,
  FiPhone,
  FiArrowRight,
  FiMapPin,
  FiClock,
  FiDollarSign,
  FiZap,
  FiShield,
  FiChevronDown,
  FiUsers,
  FiBriefcase,
  FiCalendar,
  FiStar,
  FiTruck,
  FiPackage,
} from "react-icons/fi";
import FAQComponent, { FAQItem } from "@/components/static/fAQSection";

 

// ─── HERO SECTION ───────────────────────────────────────────────────────────
export function VanHireNearMeHero() {
 

  return (
    <section className="relative min-h-screen flex items-center pt-36 md:pt-28 pb-16 overflow-hidden">
      {/* Layered Background */}
      <div className="absolute inset-0 bg-linear-to-br from-[#0a0e1a] via-[#0f1729] to-[#0a0e1a]" />
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-200 h-200 bg-linear-to-bl from-orange-500/8 via-amber-500/4 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-150 h-150 bg-linear-to-tr from-blue-500/5 via-cyan-500/3 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 h-100 bg-orange-500/3 rounded-full blur-[120px]" />
      </div>

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-2"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="order-2 lg:order-1">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white md:mt-12 mb-6 leading-[1.05] tracking-tight">
              Van Hire Near Me{"  "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-linear-to-r from-[#fe9a00] via-amber-400 to-[#fe9a00] bg-clip-text text-transparent">
                 Local Van Rental Across London
                </span>
                <span className="absolute -bottom-2 left-0 w-full h-3 bg-linear-to-r from-orange-500/20 to-amber-500/20 rounded-full blur-sm" />
              </span>
            </h1>

            <p className="text-sm md:text-base text-slate-300/90 mb-2 leading-relaxed max-w-xl">
          Looking for van hire near me in London? Success Van Hire helps you find local van rental options across Greater London, with small, medium, large and Luton vans available from £78/day. Whether you need to hire a van near you for moving house, collecting furniture, business deliveries or a quick local job, we make booking simple and transparent.

Choose your van size, check availability in your area and book online in minutes. Our self-drive van hire near me service is ideal for customers who want flexible pickup, clear prices and reliable vans across London.
            </p>
           

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href="/reservation"
                className="group px-8 py-4 bg-linear-to-r from-[#fe9a00] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5"
              >
                Find Van Hire Near Me
                <FiArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <a
                href="tel:+442030111198"
                className="group px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all duration-300 border border-white/10 hover:border-white/20 flex items-center justify-center gap-3 backdrop-blur-sm"
              >
                <FiPhone
                  size={18}
                  className="group-hover:rotate-12 text-[#fe9a00] transition-transform"
                />
                +44 20 3011 1198
              </a>
            </div>

            
          </div>

          {/* Right Image/Video */}
          <div className="order-1 lg:order-2">
            <div className="relative">
              <div className="absolute -inset-4 bg-linear-to-r from-orange-500/10 via-transparent to-amber-500/10 rounded-3xl blur-2xl" />
              <div className="relative h-54 md:h-100 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                  poster="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/van+hire+near+me.webp"
                >
                  <source
                    src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/van+hire+near+me.mp4"
                    type="video/mp4"
                  />
                </video>
                <div className="absolute inset-0 bg-linear-to-t from-[#0a0e1a]/60 via-transparent to-transparent" />

                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto">
                  <div className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-black/10 md:backdrop-blur-sm border border-white/10 rounded-xl">
                    <div className="md:w-2.5 md:h-2.5 w-1 h-1 bg-green-400 rounded-full md:animate-pulse" />
                    <span className="text-white text-[10px] md:text-sm font-semibold">
                      Small to Luton Vans Available
                    </span>
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

// ─── WHY CHOOSE SECTION ────────────────────────────────────────────────────
export function WhyChooseVanHireNearMeSection() {
  const reasons = [
    {
      icon: FiTruck,
      title: "Modern Fleet",
      description:
        "From small vans to luton box vans, we have the perfect vehicle for any job. All our vans are well-maintained, clean, and ready to go.",
      points: [
        "Small, Medium, Large & Luton",
        "Regularly serviced",
        "Clean & ready to drive",
      ],
      linear: "from-blue-500/10 to-cyan-500/10",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
    },
    {
      icon: FiDollarSign,
      title: "Transparent Pricing",
      description:
        "Clear, upfront rates with no hidden extras. Flexible daily, weekend, and weekly van hire options to suit your budget.",
      points: [
        "All‑inclusive pricing",
        "Flexible rental periods",
        "No hidden fees",
      ],
      linear: "from-green-500/10 to-emerald-500/10",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-400",
    },
    {
      icon: FiShield,
      title: "Fully Insured",
      description:
        "Every van in our fleet is fully insured, regularly serviced, and meticulously cleaned for your safety and comfort.",
      points: [
        "Comprehensive insurance",
        "Regular servicing",
        "24/7 roadside assistance",
      ],
      linear: "from-purple-500/10 to-violet-500/10",
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-400",
    },
    {
      icon: FiMapPin,
      title: "Convenient Locations",
      description:
        "Pickup locations across all London boroughs. We deliver the van to you, or you can collect from our depots.",
      points: [
        "Central London coverage",
        "All 32 boroughs",
        "Flexible pickup/drop‑off",
      ],
      linear: "from-orange-500/10 to-amber-500/10",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-400",
    },
  ];

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0a0e1a] via-[#0d1321] to-[#0a0e1a]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-px bg-linear-to-r from-transparent via-orange-500/20 to-transparent" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-semibold mb-6 tracking-wide uppercase">
            Why Us
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-5">
            Why Choose Local Van Hire Near You?{" "}
           
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
      When you search for van hire near me, you need more than just the closest option. You need a reliable van, clear pricing, flexible booking and the right vehicle size for your job. Success Van Hire provides local van hire London services for moving, deliveries, student moves, furniture pickups and business transport.
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
      </div>
    </section>
  );
}

// ─── VAN FLEET SECTION ─────────────────────────────────────────────────────
export function VanFleetNearMeSection() {
  const [activeVan, setActiveVan] = useState(0);

  const vans = [
    {
      name: "Small Van",
      subtitle: "City Friendly",
      icon: FiTruck,
      image: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/van+hire+near+Small+Van.webp",
      capacity: "2–3 passengers",
      luggage: "3–4 suitcases",
      bestFor: [
        "Small deliveries",
        "Furniture pickups",
        "City driving",
        "Easy parking",
      ],
      examples: "Ford Transit Connect, VW Caddy",
      color: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30",
      tagColor: "bg-blue-500/10 text-blue-400",
      iconColor: "text-blue-400",
    },
    {
      name: "Medium Van",
      subtitle: "Versatile",
      icon: FiTruck,
      image: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/van+hire+near+me+Medium+Van.webp",
      capacity: "3 passengers",
      luggage: "6–8 suitcases",
      bestFor: [
        "1-bed flat moves",
        "Business deliveries",
        "Student moves",
        "General transport",
      ],
      examples: "Ford Transit MWB, Mercedes Vito",
      color: "from-orange-500/20 to-amber-500/20",
      borderColor: "border-orange-500/30",
      tagColor: "bg-orange-500/10 text-orange-400",
      iconColor: "text-orange-400",
    },
    {
      name: "Large Van",
      subtitle: "Heavy Duty",
      icon: FiTruck,
      image: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/van+hire+near+me+large+van.webp",
      capacity: "3 passengers",
      luggage: "10–12 suitcases",
      bestFor: [
        "2-bed house moves",
        "Office relocations",
        "Large deliveries",
        "Long distance",
      ],
      examples: "Ford Transit LWB, Renault Master",
      color: "from-purple-500/20 to-violet-500/20",
      borderColor: "border-purple-500/30",
      tagColor: "bg-purple-500/10 text-purple-400",
      iconColor: "text-purple-400",
    },
    {
      name: "Luton Van",
      subtitle: "Maximum Capacity",
      icon: FiPackage,
      image: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/van+hire+near+me+luton+van.webp",
      capacity: "3 passengers",
      luggage: "20+ suitcases",
      bestFor: [
        "Full house moves",
        "3-4 bedroom homes",
        "Commercial logistics",
        "Bulk deliveries",
      ],
      examples: "Mercedes Sprinter Luton, Ford Luton",
      color: "from-emerald-500/20 to-green-500/20",
      borderColor: "border-emerald-500/30",
      tagColor: "bg-emerald-500/10 text-emerald-400",
      iconColor: "text-emerald-400",
    },
  ];

  const activeVanData = vans[activeVan];

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0a0e1a] via-[#0f1729] to-[#0a0e1a]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-semibold mb-6 tracking-wide uppercase">
            Our Fleet
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-5">
            Choose the Right   {" "}
            <span className="bg-linear-to-r from-[#fe9a00] to-amber-400 bg-clip-text text-transparent">
             Van Rental Near
            </span>{" "}
            You
          </h2>

          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Choose the right size for your move or delivery. All our vans are
            modern, clean, and fully equipped for a smooth journey.
          </p>
        </div>

        {/* Featured Image */}
        <div className="relative aspect-video rounded-2xl overflow-hidden mb-12 border border-white/5">
          <Image
            key={activeVanData.image}
            src={activeVanData.image}
            alt={`${activeVanData.name} hire in London`}
            fill
            className="object-cover transition-all duration-500"
            sizes="(max-width: 768px) 100vw, 80vw"
            priority
          />

          <div className="absolute inset-0 bg-linear-to-t from-[#0a0e1a] via-[#0a0e1a]/20 to-transparent" />

          <div className="absolute top-6 left-6">
            <div className="px-4 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
              <p className="text-white font-bold text-lg">
                {activeVanData.name}
              </p>
              <p className="text-slate-300 text-sm">{activeVanData.subtitle}</p>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-3">
            {vans.map((van, i) => {
              const Icon = van.icon;

              return (
                <button
                  key={van.name}
                  type="button"
                  onClick={() => setActiveVan(i)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                    activeVan === i
                      ? "bg-[#fe9a00] text-white shadow-lg shadow-orange-500/20"
                      : "bg-black/40 text-white/80 hover:bg-black/60 backdrop-blur-sm border border-white/10"
                  }`}
                >
                  <Icon size={16} />
                  {van.name}
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
              <button
                key={van.name}
                type="button"
                onClick={() => setActiveVan(i)}
                className={`group text-left relative p-6 rounded-2xl border transition-all duration-500 cursor-pointer overflow-hidden ${
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

                {/* Small image inside each box */}
                <div className="relative z-10 mb-5 aspect-video rounded-xl overflow-hidden border border-white/10">
                  <Image
                    src={van.image}
                    alt={`${van.name} rental`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-white/5 rounded-lg">
                      <Icon className={van.iconColor} size={28} />
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
                    <span>{van.luggage}</span>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                      Best for
                    </p>

                    <ul className="space-y-2">
                      {van.bestFor.map((item) => (
                        <li
                          key={item}
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
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── COVERAGE AREAS SECTION ─────────────────────────────────────────────────
export function VanCoverageAreasNearMeSection() {
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
      icon: FiMapPin,
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
      icon: FiMapPin,
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
      icon: FiMapPin,
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
      icon: FiMapPin,
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
    <section className="relative py-16 md:py-24 overflow-hidden">
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
              Van Hire Near Me Across {" "}
              <span className="bg-linear-to-r from-[#fe9a00] to-amber-400 bg-clip-text text-transparent">
                 greater London
              </span>
            </h2>
            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
         Our local van hire service covers Central London, North London, South London, East London and West London, including areas such as Finchley, Cricklewood, Wembley, Ealing, Croydon, Stratford, Westminster, Paddington and Canary Wharf. If you are searching for van rental near me or van hire in my area, Success Van Hire can help you find a suitable van across Greater London.
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

          {/* Right - Visual Stats */}
          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute -inset-8 bg-linear-to-r from-orange-500/5 to-amber-500/5 rounded-3xl blur-3xl" />
              <div className="relative bg-linear-to-br from-slate-800/40 to-slate-900/40 rounded-2xl border border-white/5 p-10 backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-20 h-20 bg-linear-to-br from-orange-500/20 to-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiMapPin className="text-[#fe9a00]" size={36} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    London-Wide Coverage
                  </h3>
                  <p className="text-slate-400 mb-8">
                    Our van hire service covers all 32 London boroughs plus the
                    City of London. Flexible pickup and drop‑off available
                    across Greater London.
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-left">
                    {[
                      { label: "Boroughs Covered", value: "32+" },
                      { label: "Pickup Points", value: "40+" },
                      { label: "Same‑Day Available", value: "Yes" },
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
export function VanUseCasesNearMeSection() {
  const useCases = [
    {
      title: "House Moves",
      icon: FiBriefcase,
      description:
        "From small flats to large houses, we have the perfect van for your move. Luton vans with tail lifts available for easy loading.",
      items: [
        "Flat moves",
        "House moves",
        "Student moves",
        "Office relocations",
      ],
      linear: "from-blue-500/8 to-cyan-500/8",
      accentColor: "text-blue-400",
      iconColor: "text-blue-400",
    },
    {
      title: "Deliveries",
      icon: FiPackage,
      description:
        "Fast and reliable van hire for all your delivery needs. From small parcels to large cargo, we've got you covered.",
      items: [
        "Business deliveries",
        "E-commerce parcels",
        "Furniture delivery",
        "Bulk cargo",
      ],
      linear: "from-emerald-500/8 to-green-500/8",
      accentColor: "text-emerald-400",
      iconColor: "text-emerald-400",
    },
    {
      title: "Airport Transfers",
      icon: FiCalendar,
      description:
        "Need to transport luggage? Our vans are perfect for airport transfers with plenty of cargo space.",
      items: [
        "Heathrow transfers",
        "Gatwick transfers",
        "Luton & Stansted",
        "London City Airport",
      ],
      linear: "from-purple-500/8 to-violet-500/8",
      accentColor: "text-purple-400",
      iconColor: "text-purple-400",
    },
    {
      title: "Commercial Use",
      icon: FiStar,
      description:
        "Reliable vans for contractors, traders, and businesses. Long-term rentals available with competitive rates.",
      items: [
        "Trade van hire",
        "Contractor vehicles",
        "Event equipment",
        "Maintenance supplies",
      ],
      linear: "from-orange-500/8 to-amber-500/8",
      accentColor: "text-orange-400",
      iconColor: "text-orange-400",
    },
  ];

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0a0e1a] via-[#0d1321] to-[#0a0e1a]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-px bg-linear-to-r from-transparent via-orange-500/20 to-transparent" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-semibold mb-6 tracking-wide uppercase">
            Use Cases
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-5">
            Perfect for Every Need –{" "}
            <span className="bg-linear-to-r from-[#fe9a00] to-amber-400 bg-clip-text text-transparent">
              Van Hire for Any Job
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
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
      </div>
    </section>
  );
}

// ─── BOOKING STEPS SECTION ──────────────────────────────────────────────────
export function VanBookingStepsNearMeSection() {
  const steps = [
    {
      number: "01",
      title: "Choose Van Size",
      description: "Select from small, medium, large or luton vans.",
      icon: FiTruck,
    },
    {
      number: "02",
      title: "Pick Date & Duration",
      description: "Daily, weekend, or weekly — flexible rental periods.",
      icon: FiClock,
    },
    {
      number: "03",
      title: "Set Pickup Location",
      description: "Choose a convenient pickup point in London.",
      icon: FiMapPin,
    },
    {
      number: "04",
      title: "Confirm & Drive",
      description: "Complete your booking and pick up your van.",
      icon: FiZap,
    },
  ];

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0a0e1a] via-[#0f1729] to-[#0a0e1a]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-semibold mb-6 tracking-wide uppercase">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-5">
            Book Your Van Hire{" "}
            <span className="bg-linear-to-r from-[#fe9a00] to-amber-400 bg-clip-text text-transparent">
              in 4 Easy Steps
            </span>
          </h2>
          <p className="text-slate-400 text-lg">
            From selection to confirmation — book a van in minutes.
          </p>
        </div>

        {/* Desktop Steps */}
        <div className="hidden lg:grid grid-cols-4 gap-6 mb-12">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="relative group">
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
export function VanFAQNearMeSection() {
 const faqs = [
  {
    question: "How do I find van hire near me in London?",
    answer:
      "You can find van hire near you in London by choosing your area, van size and hire duration through Success Van Hire. We provide local van rental options across Greater London, including small, medium, large and Luton vans.",
  },
  {
    question: "Do you offer cheap van hire near me?",
    answer:
      "Yes, cheap van hire near me options may be available depending on your location, van size, hire duration and booking date. Prices start from £78/day for selected vans.",
  },
  {
    question: "Can I book small van hire near me?",
    answer:
      "Yes, small van hire near me is available for light moves, student moves, furniture pickups, parcel deliveries and quick local jobs across London.",
  },
  {
    question: "Is Luton van hire near me available?",
    answer:
      "Yes, Luton van hire near me may be available for larger house moves, bulky furniture, business relocation and bigger delivery jobs. Availability depends on your area and selected date.",
  },
  {
    question: "Do you offer self-drive van hire near me?",
    answer:
      "Yes, Success Van Hire offers self-drive van hire near me options so you can collect the van, drive it yourself and return it based on your selected hire period.",
  },
  {
    question: "Can I hire a van near me today?",
    answer:
      "Same-day van hire near me may be available depending on fleet availability and your location. We recommend booking early for the best choice of van sizes.",
  },
];

  return (
    <FAQComponent
      title="Frequently Asked Questions about Van Hire in London"
      subtitle="Find answers to common questions about our van hire services"
      faqs={faqs}
      showSearch={false}
      defaultOpen={0}
      accentColor="#fe9a00"
      backgroundColor="#0a0e1a"
    />
  );
}

// ─── FINAL CTA SECTION ─────────────────────────────────────────────────────
export function VanFinalCTANearMeSection() {
  const benefits = [
    { icon: FiTruck, label: "Small to Luton vans" },
    { icon: FiDollarSign, label: "Transparent pricing" },
    { icon: FiShield, label: "Fully insured & maintained" },
    { icon: FiMapPin, label: "London‑wide pickup" },
  ];

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-[#0a0e1a] via-[#12182a] to-[#0a0e1a]" />
      <div className="absolute top-0 right-0 w-125 h-125 bg-linear-to-bl from-orange-500/8 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-100 h-100 bg-linear-to-tr from-amber-500/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-px bg-linear-to-r from-transparent via-orange-500/20 to-transparent" />

      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-full mb-8 md:backdrop-blur-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full md:animate-pulse" />
            <span className="text-amber-200/90 text-sm font-medium">
              Vans available for immediate booking
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
            Ready to Book Your
            <br />
            <span className="bg-linear-to-r from-[#fe9a00] via-amber-400 to-[#fe9a00] bg-clip-text text-transparent">
              Van Hire in London?
            </span>
          </h2>

          <p className="text-sm md:text-base text-slate-300/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Whether it's a house move, delivery, or any van rental need, Success
            Van Hire offers fast booking, fair pricing, and reliable vans across
            Greater London.
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
              Book Van Hire London Now
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
