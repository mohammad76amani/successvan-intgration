// components/static/areas/EalingStatic.tsx
// NO "use client" — pure React Server Component

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  FiMapPin,
  FiPhone,
  FiTruck,
  FiCheckCircle,
  FiNavigation,
  FiShield,
  FiClock,
  FiPackage,
  FiHome,
  FiBook,
  FiBriefcase,
} from "react-icons/fi";
import { ealingFAQData } from "@/lib/schema";
import FAQComponent from "@/components/static/fAQSection";
import GoogleMapLoader from "@/components/static/areas/GoogleMapLoader";
import GoogleReviewsBanner from "@/components/global/GoogleReviewsBanner";
import ExploreMoreVanHireOptions from "@/components/global/ExploreMoreVanHireOptions";

// Testimonials — heavy carousel, below fold, lazy loaded
const Testimonials = dynamic(
  () => import("@/components/static/testominial"),
  {},
);

// ─── Static data ──────────────────────────────────────────────────────────────

const vanTypes = [
  {
    title: "Small Van Hire Ealing",
    description:
      "Compact panel vans for light deliveries, single-item collections and smaller flat moves around Ealing, West Ealing and Hanwell.",
    capacity: "Up to 5 cubic metres",
    href: "/van-hire-london",
    anchor: "van hire London",
    featured: false,
  },
  {
    title: "Medium Van Rental Ealing",
    description:
      "Transit-size vans for multi-room flat moves, furniture pickup, retail stock transport and regular business deliveries across Ealing and West London.",
    capacity: "Up to 9 cubic metres",
    href: "/van-hire-london",
    anchor: "medium van hire",
    featured: false,
  },
  {
    title: "Large Van Hire Ealing",
    description:
      "High-roof, extra-long load bay for house clearances, construction materials, office equipment moves and larger student relocations in Ealing and W5.",
    capacity: "Up to 14 cubic metres",
    href: "/van-hire-london",
    anchor: "large van hire",
    featured: false,
  },
  {
    title: "Luton Van Hire Ealing",
    description:
      "Box-body Luton vans for full house moves and complete flat clearances in Ealing and across West London. The highest-capacity option for larger loads.",
    capacity: "Up to 20 cubic metres",
    href: "/luton-van-hire-london",
    anchor: "Luton van hire London",
    featured: true,
  },
];

const localBenefits = [
  {
    icon: <FiHome className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "House & Flat Moves",
    body: "Ealing has a mix of Victorian terraces, purpose-built flats and new-build apartments. Whether you are moving across the street or to another part of West London, a self-drive van keeps costs predictable.",
  },
  {
    icon: <FiBook className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Student Moves",
    body: "With several universities and colleges accessible from Ealing Broadway, student van hire in W5 is popular at the start and end of each academic year. Daily hire keeps the cost low.",
  },
  {
    icon: <FiPackage className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Furniture Pickup & Retail Collections",
    body: "Collecting from IKEA, a marketplace seller or a local Ealing shop? Our medium and large vans give you the covered space you need for bulky items — without multiple trips.",
  },
  {
    icon: <FiTruck className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Business Deliveries",
    body: "Trades, retailers and businesses across Ealing, Acton, Chiswick and Park Royal use our vans for regular deliveries, stock transport and equipment runs across West London.",
  },
  {
    icon: <FiPackage className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Storage Runs",
    body: "Moving items to or from a storage unit near Ealing or Brentford? Our large vans and Luton vans make storage trips efficient and cut the number of journeys needed.",
  },
  {
    icon: <FiClock className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Short-Term & Weekend Rental",
    body: "Need a van for a weekend job in Ealing? Daily hire is available with no long-term commitment. Same-day van hire may be possible — subject to availability. Book early for the best choice.",
  },
];

const whyChooseUs = [
  {
    icon: <FiPackage className="text-2xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Transparent Pricing from £78/Day",
    description:
      "No hidden charges. Clear pricing for mileage, fuel and any optional extras — confirmed before you drive away.",
  },
  {
    icon: <FiTruck className="text-2xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Small, Large & Luton Vans",
    description:
      "From compact panel vans for quick deliveries to Luton vans for full house moves. All vehicles are ULEZ compliant and regularly serviced.",
  },
  {
    icon: <FiClock className="text-2xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Flexible Rental Periods",
    description:
      "Daily, weekly and monthly van hire available for Ealing customers. Flexible pickup and return times built around your schedule.",
  },
  {
    icon: <FiShield className="text-2xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Fully Insured & ULEZ Compliant",
    description:
      "All vans meet ULEZ and LEZ emission standards. Comprehensive insurance options included — drive anywhere in London without penalty charges.",
  },
];

const nearbyAreaTags = [
  { name: "Ealing Broadway", isCurrent: true },
  { name: "West Ealing" },
   { name: "Park Royal" },
   { name: "West London" },
];

const nearbyAreaLinks = [
  { name: "Van Hire London", href: "/van-hire-london" },
  { name: "Removal Van Hire", href: "/removal-van-hire-london" },
  { name: "Luton Van Hire", href: "/luton-van-hire-london" },
  { name: "Van Hire Near Me", href: "/van-hire-near-me" },
  { name: "Self-Drive Van Hire", href: "/self-drive-van-hire" },
];

const useCaseSections = [
  {
    title: "House & Flat Moves in Ealing",
    body: "Ealing's high demand rental market means frequent moves between properties in W5 and surrounding postcodes. A self-drive van rental in Ealing is the most cost-effective way to manage your own move without relying on a full removals service.",
  },
  {
    title: "Student Moves Near Ealing Broadway",
    body: "With several colleges and universities accessible from Ealing Broadway, student van hire in West London sees peak demand at term start and end. Flexible daily hire keeps the cost manageable.",
  },
  {
    title: "Furniture Pickup & Marketplace Collections",
    body: "Whether you are collecting flat-pack furniture, a second-hand sofa or multiple items from a local seller near Ealing, our medium and large vans give you the right load space — in one trip.",
  },
  {
    title: "Business Deliveries Across West London",
    body: "Businesses in Ealing, Acton, Chiswick and Park Royal use our van hire for regular stock runs, trade deliveries and equipment transport across West London. Daily and weekly hire options available.",
  },
  {
    title: "Storage Trips",
    body: "Moving items to a storage facility near Ealing or Brentford? Our Luton vans and large panel vans reduce the number of trips needed and make storage runs far more efficient.",
  },
  {
    title: "Weekend & Short-Term Moving Jobs",
    body: "Prefer to move over a weekend? Short-term van rental in Ealing lets you work at your own pace. Book in advance for the best choice of van sizes and a smooth start to moving day.",
  },
];

const businessSection = {
  heading: "Van Rental in Ealing for Local Businesses",
  body: [
    "Ealing is one of West London's most active commercial areas — from independent traders and retailers along Ealing Broadway to businesses in the Park Royal industrial zone. Many local companies rely on flexible van rental to keep operations moving without the overhead of a dedicated vehicle.",
    "Whether you need a van for regular deliveries, stock collection, event equipment transport or moving office supplies, our van rental in Ealing can be arranged on a daily, weekly or longer-term basis. No long-term contract is required for short-term commercial hire.",
    "Call us on +44 20 3011 1198 to discuss your business van hire requirements, or book online at your convenience.",
  ],
};

const bookingSteps = [
  {
    step: "1",
    title: "Choose Your Van Size",
    description:
      "Select from small, medium, large or Luton vans based on your load and the type of job.",
  },
  {
    step: "2",
    title: "Select Pickup & Return Dates",
    description:
      "Choose your hire dates. Daily, weekly and monthly van rental in Ealing is available.",
  },
  {
    step: "3",
    title: "Add Driver & Booking Details",
    description:
      "Enter your driving licence details, contact information and confirm the hire period.",
  },
  {
    step: "4",
    title: "Confirm Your Reservation Online",
    description:
      "Complete your booking securely online. We send instant email confirmation.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function EalingVanHireStatic() {
  return (
    <div className="relative w-full bg-[#0f172b]">
      {/* ═══════════════════════════════════════════════════════════════
          HERO
          Fixed height → no CLS.
          priority + fetchPriority="high" → fastest LCP paint.
      ═══════════════════════════════════════════════════════════════ */}
      <section aria-label="Van hire Ealing hero">
        {/* Fixed-height image wrapper */}
        <div className="relative w-full h-[420px] sm:h-[520px] lg:h-[600px]">
          <div
            className="absolute inset-0 z-10"
            style={{
              background:
                "linear-gradient(to bottom, rgba(15,23,43,0.30) 0%, rgba(15,23,43,0.62) 52%, rgba(15,23,43,1) 100%)",
            }}
            aria-hidden="true"
          />
          <Image
            src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/ealing.webp"
            alt="Van hire Ealing West London with local van rental options"
            fill
            priority
            fetchPriority="high"
            quality={65}
            sizes="100vw"
            className="object-cover"
          />
        </div>

        {/* Hero text */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-64 sm:-mt-72 lg:-mt-80 relative z-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* ── Left column ── */}
            <div className="space-y-5">
              {/* Location badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fe9a00]/10 border border-[#fe9a00]/30">
                <FiMapPin
                  className="text-[#fe9a00] text-sm"
                  aria-hidden="true"
                />
                <span className="text-[#fe9a00] font-bold text-xs sm:text-sm tracking-wide">
                  EALING · W5 / WEST LONDON
                </span>
              </div>

              {/* ── H1 ── */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
                Van Hire Ealing
              </h1>

              {/* Supporting line */}
              <p className="text-xl sm:text-2xl font-semibold text-[#fe9a00]">
                Local Van Rental in West London from £78/Day
              </p>

              {/* Primary intro */}
              <p className="text-base sm:text-lg text-gray-200 leading-relaxed">
                Success Van Hire provides reliable{" "}
                <strong className="text-white">van hire in Ealing</strong> for
                customers across W5, Ealing Broadway and the wider West London
                area. Whether you need a van for a house move, furniture pickup,
                student relocation or business deliveries, our modern
                ULEZ-compliant fleet is ready when you are. All vans are
                available as{" "}
                <Link
                  href="/self-drive-van-hire"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  self-drive van hire
                </Link>{" "}
                with transparent pricing and no hidden charges.
              </p>

              {/* Secondary copy */}
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                Our fleet covers everything from compact panel vans for everyday
                deliveries to{" "}
                <Link
                  href="/luton-van-hire-london"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  Luton van hire
                </Link>{" "}
                for full house moves across Ealing and West London. Need a
                managed move?{" "}
                <Link
                  href="/removal-van-hire-london"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  Removal van hire London
                </Link>{" "}
                is also available. Rates from £78/day with daily, weekly and
                monthly options.
              </p>

              {/* Location note */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                <FiNavigation
                  className="text-blue-400 text-lg mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-white font-bold text-sm mb-0.5">
                    Ealing — A406, M4 &amp; Ealing Broadway Access
                  </p>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Serving van hire near Ealing Broadway, West Ealing, Acton,
                    Hanwell, Park Royal, Chiswick and across West London via the
                    A406 and M4.
                  </p>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/reservation"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#fe9a00] hover:bg-orange-500 text-white font-bold text-base transition-colors duration-200 shadow-lg"
                >
                  <FiTruck aria-hidden="true" />
                  Book Van Hire in Ealing
                </Link>
                <a
                  href="tel:+442030111198"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl border-2 border-white/25 hover:border-[#fe9a00]/60 bg-white/5 hover:bg-white/10 text-white font-bold text-base transition-colors duration-200"
                >
                  <FiPhone aria-hidden="true" />
                  Call +44 20 3011 1198
                </a>
              </div>
            </div>

            {/* ── Right column — use cases card ── */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl font-black text-white mb-2">
                Van Hire in Ealing — Perfect For:
              </h2>
              <p className="text-gray-400 text-xs mb-5 leading-relaxed">
                Our Ealing van hire service covers a wide range of everyday and
                business needs across W5 and West London.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  {
                    icon: (
                      <FiHome className="text-[#fe9a00]" aria-hidden="true" />
                    ),
                    label: "House & Flat Moves",
                  },
                  {
                    icon: (
                      <FiBook className="text-[#fe9a00]" aria-hidden="true" />
                    ),
                    label: "Student Moves",
                  },
                  {
                    icon: (
                      <FiPackage
                        className="text-[#fe9a00]"
                        aria-hidden="true"
                      />
                    ),
                    label: "Furniture Pickup",
                  },
                  {
                    icon: (
                      <FiTruck className="text-[#fe9a00]" aria-hidden="true" />
                    ),
                    label: "Business Deliveries",
                  },
                  {
                    icon: (
                      <FiPackage
                        className="text-[#fe9a00]"
                        aria-hidden="true"
                      />
                    ),
                    label: "Storage Runs",
                  },
                  {
                    icon: (
                      <FiBriefcase
                        className="text-[#fe9a00]"
                        aria-hidden="true"
                      />
                    ),
                    label: "Retail Collections",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#fe9a00]/20 transition-colors duration-200"
                  >
                    <div className="shrink-0">{item.icon}</div>
                    <span className="text-white font-semibold text-xs sm:text-sm">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3">
                <FiCheckCircle
                  className="text-green-400 text-lg mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-green-300 font-bold text-sm mb-0.5">
                    Long &amp; Short Term Available
                  </p>
                  <p className="text-green-200 text-xs leading-relaxed">
                    Daily, weekly or monthly van rental in Ealing — flexible to
                    suit your schedule.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          LOCAL BENEFITS
      ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="local-benefits-heading"
        className="py-16 md:py-24 border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2
              id="local-benefits-heading"
              className="text-3xl sm:text-4xl font-black text-white mb-4"
            >
              Local Van Hire in Ealing for Moving, Deliveries &amp; Everyday
              Jobs
            </h2>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              Whether you are relocating a flat near Ealing Broadway, collecting
              furniture from a local seller or delivering stock across West
              London, our{" "}
              <strong className="text-white">van rental in Ealing</strong> gives
              you the vehicle and flexibility you need without long-term
              commitment or inflated pricing.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {localBenefits.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#fe9a00]/30 transition-colors duration-200"
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-[#fe9a00]/15 flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm sm:text-base mb-1">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-400 text-sm mt-10">
            Need a van at short notice in Ealing?{" "}
            <a
              href="tel:+442030111198"
              className="text-[#fe9a00] hover:underline font-semibold"
            >
              Call +44 20 3011 1198
            </a>{" "}
            — same-day van hire near Ealing Broadway may be available subject to
            availability.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          VAN TYPES
      ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="van-types-heading"
        className="py-16 md:py-24 border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              id="van-types-heading"
              className="text-3xl sm:text-4xl font-black text-white mb-4"
            >
              Choose the Right Van Rental in Ealing
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Not sure which van size you need? Use this guide to find the right
              van for your job in Ealing and West London.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {vanTypes.map((van, i) => (
              <article
                key={i}
                className={`flex flex-col rounded-2xl border p-6 transition-colors duration-200 ${
                  van.featured
                    ? "border-[#fe9a00]/40 bg-[#fe9a00]/5"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                {van.featured && (
                  <span className="inline-block mb-3 px-3 py-1 text-xs font-bold text-[#fe9a00] bg-[#fe9a00]/10 rounded-full w-fit">
                    Most Popular for Moves
                  </span>
                )}
                <h3 className="text-white font-black text-base sm:text-lg mb-2">
                  {van.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed flex-1 mb-3">
                  {van.description}
                </p>
                <p className="text-[#fe9a00] text-xs font-semibold mb-4">
                  {van.capacity}
                </p>
                <Link
                  href={van.href}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#fe9a00] hover:underline"
                >
                  View {van.anchor} →
                </Link>
              </article>
            ))}
          </div>

          <p className="text-center text-gray-400 text-sm mt-8">
            All vans are ULEZ compliant and available for{" "}
            <Link
              href="/self-drive-van-hire"
              className="text-[#fe9a00] hover:underline font-semibold"
            >
              self-drive van hire
            </Link>{" "}
            from £78/day. Need an automatic?{" "}
            <Link
                  href="/automatic-van-hire-london"
              className="text-[#fe9a00] hover:underline font-semibold"
            >
              Automatic van rental
            </Link>{" "}
            is also available — call to confirm options.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          WHY CHOOSE US
      ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="why-choose-heading"
        className="py-16 md:py-24 border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              id="why-choose-heading"
              className="text-3xl sm:text-4xl font-black text-white mb-4"
            >
              Why Hire From{" "}
              <span className="text-[#fe9a00]">Success Van Hire?</span>
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Your trusted partner for affordable{" "}
              <strong className="text-white">Ealing van hire</strong> and van
              rental across West London.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChooseUs.map((feature, i) => (
              <div
                key={i}
                className="flex flex-col gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#fe9a00]/30 transition-colors duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-[#fe9a00]/10 border border-[#fe9a00]/20 flex items-center justify-center shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-white font-black text-base sm:text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          AREA COVERAGE + MAP
      ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="area-coverage-heading"
        className="py-16 md:py-24 border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-1 gap-12 items-start">
            <div>
              <h2
                id="area-coverage-heading"
                className="text-3xl sm:text-4xl font-black text-white mb-4"
              >
                Van Hire Near Ealing Broadway, Acton &amp; West London
              </h2>

              <p className="text-gray-300 text-base leading-relaxed mb-4">
                Our{" "}
                <strong className="text-white">
                  van hire near Ealing Broadway
                </strong>{" "}
                service covers W5 and all surrounding West London areas. Whether
                you are based near West Ealing, Acton, Chiswick, Hanwell, Park
                Royal, Brentford, Hammersmith or Northfields — we can advise on
                the right van size and check availability for your dates.
              </p>

              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Ealing is one of West London's most well-connected areas, with
                easy access via the M4, A406 and the Elizabeth line — making
                collections and returns straightforward from most W postcodes.
                Customers searching for{" "}
                <Link
                  href="/van-hire-near-me"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  van hire near me
                </Link>{" "}
                in West London will find our fleet a practical and accessible
                option.
              </p>

              {/* Area tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {nearbyAreaTags.map((area) => (
                  <span
                    key={area.name}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      area.isCurrent
                        ? "bg-[#fe9a00]/10 border-[#fe9a00]/40 text-[#fe9a00]"
                        : "bg-white/5 border-white/10 text-gray-300"
                    }`}
                  >
                    <FiMapPin
                      className="text-[#fe9a00] text-xs shrink-0"
                      aria-hidden="true"
                    />
                    {area.name}
                  </span>
                ))}
              </div>

              {/* Linked area cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {nearbyAreaLinks.map((area) => (
                  <Link
                    key={area.name}
                    href={area.href}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs font-medium hover:border-[#fe9a00]/30 hover:text-white transition-colors duration-200"
                  >
                    <FiMapPin
                      className="text-[#fe9a00] text-xs shrink-0"
                      aria-hidden="true"
                    />
                    {area.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Map — fixed height wrapper */}
            <div className="rounded-2xl overflow-hidden border border-white/10 h-full">
              <GoogleMapLoader
                fromLocation="Ealing"
                fromLat={51.50614}
                fromLng={-0.2708}
                distance="3.5 miles"
                duration="12–18 minutes via A406"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          USE CASES
      ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="use-cases-heading"
        className="py-16 md:py-24 border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              id="use-cases-heading"
              className="text-3xl sm:text-4xl font-black text-white mb-4"
            >
              Popular Reasons to Hire a Van in Ealing
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Why West London customers choose{" "}
              <strong className="text-white">van hire in Ealing</strong> with
              Success Van Hire.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {useCaseSections.map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#fe9a00]/25 transition-colors duration-200"
              >
                <div className="w-8 h-8 rounded-lg bg-[#fe9a00]/15 flex items-center justify-center mb-3">
                  <FiCheckCircle
                    className="text-[#fe9a00] text-base"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-white font-bold text-base mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          BUSINESS / COMMERCIAL SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="business-heading"
        className="py-16 md:py-24 border-t border-white/10"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#fe9a00]/15 flex items-center justify-center shrink-0">
                <FiBriefcase
                  className="text-[#fe9a00] text-xl"
                  aria-hidden="true"
                />
              </div>
              <h2
                id="business-heading"
                className="text-2xl sm:text-3xl font-black text-white"
              >
                {businessSection.heading}
              </h2>
            </div>

            <div className="space-y-4">
              {businessSection.body.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-gray-300 text-sm sm:text-base leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/reservation"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#fe9a00] hover:bg-orange-500 text-white font-bold text-sm transition-colors duration-200"
              >
                <FiTruck aria-hidden="true" />
                Book van hire Ealing online
              </Link>
              <a
                href="tel:+442030111198"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/20 hover:border-[#fe9a00]/40 bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-colors duration-200"
              >
                <FiPhone aria-hidden="true" />
                Discuss Business Hire
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          BOOKING STEPS
      ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="booking-steps-heading"
        className="py-16 md:py-24 border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              id="booking-steps-heading"
              className="text-3xl sm:text-4xl font-black text-white mb-4"
            >
              Book Van Hire in Ealing in 4 Simple Steps
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
              Quick, straightforward and fully online — from choosing your van
              to confirmed booking.
            </p>
          </div>

          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 max-w-6xl mx-auto list-none">
            {bookingSteps.map((step) => (
              <li
                key={step.step}
                className="flex flex-col items-start p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <span
                  className="w-10 h-10 rounded-full bg-[#fe9a00] text-white font-black text-lg flex items-center justify-center mb-4 shrink-0"
                  aria-hidden="true"
                >
                  {step.step}
                </span>
                <h3 className="text-white font-bold text-base mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>

          <div className="text-center mt-10">
            <Link
              href="/reservation"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#fe9a00] hover:bg-orange-500 text-white font-bold text-base transition-colors duration-200"
            >
              <FiTruck aria-hidden="true" />
              Book van hire Ealing online
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TESTIMONIALS — lazy, ssr:false
      ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-label="Customer testimonials"
        className="py-16 md:py-24 border-t border-white/10"
      >
        <Testimonials
          layout="carousel"
          autoPlay={true}
          autoPlayInterval={4000}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════════════════════ */}
      <FAQComponent
        title="Van Hire Ealing — Frequently Asked Questions"
        subtitle="Common questions from customers searching for van hire in Ealing and West London"
        faqs={ealingFAQData}
        showSearch={false}
        defaultOpen={0}
        accentColor="#fe9a00"
        backgroundColor="#0f172b"
      />

      {/* ═══════════════════════════════════════════════════════════════
          GOOGLE REVIEWS — reusable shared component
      ═══════════════════════════════════════════════════════════════ */}
      <GoogleReviewsBanner
        highlight="West London"
        description="Trusted by customers in Ealing, Acton, Chiswick and across West London."
      />

      {/* ═══════════════════════════════════════════════════════════════
          RELATED PAGES — reusable shared component
      ═══════════════════════════════════════════════════════════════ */}
      <ExploreMoreVanHireOptions />

      {/* ═══════════════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="final-cta-heading"
        className="py-16 md:py-24 border-t border-white/10"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2
            id="final-cta-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4"
          >
            Ready to Book Van Hire in Ealing?
          </h2>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            Whether you need a small van for a quick furniture pickup or a Luton
            van for a full house move,{" "}
            <strong className="text-white">self-drive van hire Ealing</strong>{" "}
            is simple with Success Van Hire. Rates from £78/day with no hidden
            charges. For the best value, also see our{" "}
            <Link
              href="/cheap-van-hire-london"
              className="text-[#fe9a00] hover:underline font-semibold"
            >
              cheap van hire London
            </Link>{" "}
            page.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/reservation"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#fe9a00] hover:bg-orange-500 text-white font-bold text-base transition-colors duration-200 shadow-lg"
            >
              <FiTruck aria-hidden="true" />
              Book van hire Ealing online
            </Link>
            <a
              href="tel:+442030111198"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl border-2 border-white/25 hover:border-[#fe9a00]/50 bg-white/5 hover:bg-white/10 text-white font-bold text-base transition-colors duration-200"
            >
              <FiPhone aria-hidden="true" />
              Call +44 20 3011 1198
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
            {[
              "No Hidden Charges",
              "ULEZ Compliant Fleet",
              "Fully Insured",
              "Flexible Hire Periods",
            ].map((badge) => (
              <div key={badge} className="flex items-center gap-1.5">
                <FiCheckCircle
                  className="text-green-400 shrink-0"
                  aria-hidden="true"
                />
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
