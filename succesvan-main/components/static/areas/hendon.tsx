// components/static/areas/HendonStatic.tsx
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
} from "react-icons/fi";
import { TbAutomaticGearbox } from "react-icons/tb";
import { hendonFAQData } from "@/lib/schema";
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
    title: "Small Van Hire Hendon",
    description:
      "Compact panel vans for light deliveries, single-item collections and smaller flat moves around Hendon Central, NW4 and nearby streets.",
    capacity: "Up to 5 cubic metres",
    href: "/van-hire-london",
    anchor: "van hire London",
    featured: false,
    badge: null as string | null,
  },
  {
    title: "Medium Van Rental Hendon",
    description:
      "Transit-size vans for multi-room flat and house moves, furniture pickup, retail stock runs and regular business deliveries across Hendon and North London.",
    capacity: "Up to 9 cubic metres",
    href: "/van-hire-london",
    anchor: "medium van hire",
    featured: false,
    badge: null as string | null,
  },
  {
    title: "Large Van Hire Hendon",
    description:
      "High-roof, extra-long load bay for house clearances, trade deliveries, construction materials and larger student or family moves in NW4 and surrounding areas.",
    capacity: "Up to 14 cubic metres",
    href: "/van-hire-london",
    anchor: "large van hire",
    featured: false,
    badge: null as string | null,
  },
  {
    title: "Luton Van Hire Hendon",
    description:
      "Box-body Luton vans for full house moves and complete flat clearances in Hendon and across North London. The highest-capacity option for larger loads.",
    capacity: "Up to 20 cubic metres",
    href: "/luton-van-hire-london",
    anchor: "Luton van hire London",
    featured: true,
    badge: "Most Popular for Moves",
  },
  {
    title: "Automatic Van Rental Hendon",
    description:
      "Prefer an automatic gearbox? Automatic vans may be available for Hendon customers — ideal for easier driving on NW4 streets, the A41 and North London routes.",
    capacity: "Various sizes",
    href: "/automatic-van-hire-london",
    anchor: "Automatic van rental",
    featured: false,
    badge: "Automatic Gearbox",
  },
];

const localBenefits = [
  {
    icon: <FiHome className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "House & Flat Moves",
    body: "Hendon NW4 has a wide mix of semi-detached houses, period terraces and converted flats. A self-drive van lets you manage your own move on your timeline — without the cost of a full removals team.",
  },
  {
    icon: <FiBook className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Student Moves Near Middlesex University",
    body: "With Middlesex University based in Hendon, student van hire in NW4 is in high demand at the start and end of each term. Flexible daily hire keeps costs manageable for students.",
  },
  {
    icon: <FiPackage className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Furniture Pickup & Collections",
    body: "Collecting from IKEA, a marketplace seller or a local Hendon shop? Our medium and large vans give you the covered load space to handle bulky items safely — in a single trip.",
  },
  {
    icon: <FiTruck className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Business Deliveries",
    body: "Trades, retailers and businesses across Hendon, Brent Cross and Colindale use our vans for regular deliveries, stock transport and equipment runs across North London.",
  },
  {
    icon: <FiPackage className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Storage Runs",
    body: "Moving items to or from a storage unit near Hendon, Brent Cross or Colindale? Our large and Luton vans make storage trips efficient and reduce the number of journeys needed.",
  },
  {
    icon: <FiClock className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Short-Term & Weekend Rental",
    body: "Need a van for a day or weekend job in Hendon? Daily hire is available with no long-term commitment. Same-day van hire may be possible — subject to availability.",
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
    title: "Small, Large, Luton & Automatic",
    description:
      "From compact panel vans to Luton vans for full house moves. Automatic vans available on request. All vehicles are ULEZ compliant and regularly serviced.",
  },
  {
    icon: <FiClock className="text-2xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Flexible Rental Periods",
    description:
      "Daily, weekly and monthly van hire for Hendon customers. Flexible pickup and return times built around your schedule.",
  },
  {
    icon: <FiShield className="text-2xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Fully Insured & ULEZ Compliant",
    description:
      "All vans meet ULEZ and LEZ emission standards. Comprehensive insurance options included — drive anywhere in London without penalty charges.",
  },
];

const nearbyAreaTags = [
  { name: "Hendon Central", isCurrent: true },
  { name: "Hendon Station" },
   { name: "Brent Cross" },
  { name: "Colindale" },
  { name: "Golders Green" },
  { name: "Mill Hill" },
  { name: "Finchley" },
  { name: "West Hendon" },
  { name: "North London" },
];

const nearbyAreaLinks = [
  { name: "Mill Hill", href: "/van-hire-mill-hill" },
  { name: "Golders Green", href: "/van-hire-golders-green" },
  { name: "Colindale", href: "/van-hire-colindale" },
  {
    name: "Brent Cross",
    href: "/success-van-hire-van-rental-in-brent-cross-london-last-minute-bookings",
  },
  { name: "Cricklewood", href: "/van-hire-cricklewood" },
  { name: "NW London", href: "/van-hire-north-west-london" },
];

const studentLocalSection = {
  heading: "Van Rental in Hendon for Student Moves, Flats & Local Families",
  paragraphs: [
    "Hendon NW4 is home to Middlesex University — one of North London's largest universities — making it one of the busiest areas for student van hire in the region. Whether you are moving into halls, relocating to a private flat or taking belongings home at the end of term, our self-drive vans give you an affordable, flexible solution.",
    "Local families moving between properties in Hendon, West Hendon or nearby Colindale also benefit from our straightforward daily and weekly van hire. No long-term contract is needed for short-term local moves.",
    "If you are unsure which van size you need for a student room or a Hendon flat move, call our team on +44 20 3011 1198 and we can advise based on your load before you book.",
  ],
};

const useCaseSections = [
  {
    title: "House & Flat Moves in NW4",
    body: "Hendon has a consistently active rental property market across NW4. A self-drive van rental in Hendon gives you full control of your move — without relying on a full removals service.",
  },
  {
    title: "Student Moves Near Middlesex University",
    body: "Middlesex University is based in Hendon — making student van hire in NW4 one of the most common use cases in the area. Flexible daily hire is available at the start and end of each academic term.",
  },
  {
    title: "Furniture Pickup & Marketplace Collections",
    body: "Collecting a sofa, a wardrobe or multiple flat-pack items from a seller near Hendon? Our medium and large vans give you the right covered load space — usually in a single trip.",
  },
  {
    title: "Business Deliveries Across North London",
    body: "Local businesses and sole traders in Hendon, Brent Cross and Colindale use our vans for regular stock runs, trade deliveries and equipment transport across North London.",
  },
  {
    title: "Storage Trips",
    body: "Moving items to a storage unit near Hendon, Brent Cross or Colindale? Our large and Luton vans reduce the number of trips needed and make storage runs far more efficient.",
  },
  {
    title: "Weekend & Short-Term Moving Jobs",
    body: "Prefer to move over a weekend? Short-term van rental in Hendon lets you work at your own pace. Book in advance for the best choice of van sizes.",
  },
];

const bookingSteps = [
  {
    step: "1",
    title: "Choose Your Van Size",
    description:
      "Select from small, medium, large, Luton or automatic vans based on your load and the type of job.",
  },
  {
    step: "2",
    title: "Select Pickup & Return Dates",
    description:
      "Choose your hire dates. Daily, weekly and monthly van rental in Hendon is available.",
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

export default function HendonVanHireStatic() {
  return (
    <div className="relative w-full bg-[#0f172b]">
      {/* ═══════════════════════════════════════════════════════════════
          HERO
          Fixed height → no CLS.
          priority + fetchPriority="high" → fastest LCP paint.
      ═══════════════════════════════════════════════════════════════ */}
      <section aria-label="Van hire Hendon hero">
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
            src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/van+hire+in+hendon.png"
            alt="Van hire Hendon NW4 with local van rental options"
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
                  HENDON · NW4 / NORTH LONDON
                </span>
              </div>

              {/* ── H1 ── */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
                Van Hire Hendon
              </h1>

              {/* Supporting line */}
              <p className="text-xl sm:text-2xl font-semibold text-[#fe9a00]">
                Local Van Rental in NW4 &amp; North London from £78/Day
              </p>

              {/* Primary intro */}
              <p className="text-base sm:text-lg text-gray-200 leading-relaxed">
                Success Van Hire provides reliable{" "}
                <strong className="text-white">van hire in Hendon</strong> for
                customers across NW4, near Hendon Central and the wider North
                London area. Whether you need a van for a house move, student
                relocation, furniture pickup or business deliveries, our
                ULEZ-compliant fleet is ready when you are. We offer{" "}
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
                Our fleet covers compact panel vans for everyday jobs through to{" "}
                <Link
                  href="/luton-van-hire-london"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  Luton van hire
                </Link>{" "}
                for full house moves across Hendon and North London. We also
                offer{" "}
                <Link
                  href="/automatic-van-hire-london
"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  automatic van rental
                </Link>{" "}
                — ideal for driving around NW4 and the A41. Rates from £78/day
                with daily, weekly and monthly options.
              </p>

              {/* Location note */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                <FiNavigation
                  className="text-blue-400 text-lg mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-white font-bold text-sm mb-0.5">
                    Hendon — A41, A406 &amp; Northern Line Access
                  </p>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Serving customers near Hendon Central, Hendon Station,
                    Middlesex University, Brent Cross, Colindale, Golders Green,
                    Mill Hill and all NW4 postcodes via the A41 and A406.
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
                  Book Van Hire in Hendon
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
                Van Hire in Hendon — Perfect For:
              </h2>
              <p className="text-gray-400 text-xs mb-5 leading-relaxed">
                Our Hendon van hire service covers everyday and business needs
                across NW4 and North London.
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
                      <TbAutomaticGearbox
                        className="text-[#fe9a00]"
                        aria-hidden="true"
                      />
                    ),
                    label: "Automatic Vans",
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
                    Daily, weekly or monthly van rental in Hendon — flexible to
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
              Local Van Hire in Hendon for Moving, Deliveries &amp; Everyday
              Jobs
            </h2>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              Whether you are moving a flat in NW4, collecting furniture near
              Hendon Central or running business deliveries across North London,
              our <strong className="text-white">van rental in Hendon</strong>{" "}
              gives you the vehicle and flexibility you need without long-term
              commitment.
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
            Need a van at short notice in Hendon?{" "}
            <a
              href="tel:+442030111198"
              className="text-[#fe9a00] hover:underline font-semibold"
            >
              Call +44 20 3011 1198
            </a>{" "}
            — same-day van hire near Hendon Central may be available subject to
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
              Choose the Right Van Rental in Hendon
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Not sure which van size you need? Use this guide to find the right
              van for your job in Hendon and NW4.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vanTypes.map((van, i) => (
              <article
                key={i}
                className={`flex flex-col rounded-2xl border p-6 transition-colors duration-200 ${
                  van.featured
                    ? "border-[#fe9a00]/40 bg-[#fe9a00]/5"
                    : van.href === "/automatic-van-hire-london"
                      ? "border-blue-500/30 bg-blue-500/5 hover:border-blue-400/50"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                {van.badge && van.featured && (
                  <span className="inline-block mb-3 px-3 py-1 text-xs font-bold text-[#fe9a00] bg-[#fe9a00]/10 rounded-full w-fit">
                    {van.badge}
                  </span>
                )}
                {van.badge && !van.featured && (
                  <span className="inline-block mb-3 px-3 py-1 text-xs font-bold text-blue-300 bg-blue-500/10 rounded-full w-fit">
                    {van.badge}
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
            from £78/day. Need an automatic? See our{" "}
            <Link
              href="/automatic-van-hire-london
"
              className="text-[#fe9a00] hover:underline font-semibold"
            >
              automatic van rental
            </Link>{" "}
            options — call to confirm current availability.
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
              <strong className="text-white">Hendon van hire</strong> and van
              rental across North London.
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
                Van Hire Near Hendon Central, Brent Cross &amp; NW4
              </h2>

              <p className="text-gray-300 text-base leading-relaxed mb-4">
                Our{" "}
                <strong className="text-white">
                  van hire near Hendon Central
                </strong>{" "}
                service covers the NW4 postcode and all surrounding North London
                areas. Whether you are based near Hendon Station, Middlesex
                University, Brent Cross, Colindale, Golders Green, Mill Hill,
                Finchley or West Hendon — we can advise on the right van and
                check availability for your dates.
              </p>

              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Hendon sits between the A41 and A406 with strong Northern line
                connections — giving customers in NW4 straightforward access
                across North London. Customers searching for{" "}
                <Link
                  href="/van-hire-near-me"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  van hire near me
                </Link>{" "}
                in NW4 will find our North London service a practical and
                convenient option.
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
                fromLocation="Hendon"
                fromLat={51.5836}
                fromLng={-0.2259}
                distance="1.5 miles"
                duration="6–10 minutes via A41"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          STUDENT & LOCAL MOVE SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="student-local-heading"
        className="py-16 md:py-24 border-t border-white/10"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#fe9a00]/15 flex items-center justify-center shrink-0">
                <FiBook className="text-[#fe9a00] text-xl" aria-hidden="true" />
              </div>
              <h2
                id="student-local-heading"
                className="text-2xl sm:text-3xl font-black text-white"
              >
                {studentLocalSection.heading}
              </h2>
            </div>

            <div className="space-y-4">
              {studentLocalSection.paragraphs.map((para, i) => (
                <p
                  key={i}
                  className="text-gray-300 text-sm sm:text-base leading-relaxed"
                >
                  {para}
                </p>
              ))}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/reservation"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#fe9a00] hover:bg-orange-500 text-white font-bold text-sm transition-colors duration-200"
              >
                <FiTruck aria-hidden="true" />
                Book van hire Hendon online
              </Link>
              <a
                href="tel:+442030111198"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/20 hover:border-[#fe9a00]/40 bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-colors duration-200"
              >
                <FiPhone aria-hidden="true" />
                Call for Advice
              </a>
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
              Popular Reasons to Hire a Van in Hendon
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Why NW4 and North London customers choose{" "}
              <strong className="text-white">van hire in Hendon</strong> with
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
              Book Van Hire in Hendon in 4 Simple Steps
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
              Book van hire Hendon online
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
        title="Van Hire Hendon — Frequently Asked Questions"
        subtitle="Common questions from customers searching for van hire in Hendon, NW4 and North London"
        faqs={hendonFAQData}
        showSearch={false}
        defaultOpen={0}
        accentColor="#fe9a00"
        backgroundColor="#0f172b"
      />

      {/* ═══════════════════════════════════════════════════════════════
          GOOGLE REVIEWS — reusable shared component
      ═══════════════════════════════════════════════════════════════ */}
      <GoogleReviewsBanner
        highlight="North London"
        description="Trusted by customers in Hendon, Brent Cross, Colindale and across North London."
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
            Ready to Book Van Hire in Hendon?
          </h2>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            Whether you need a small van for a quick furniture pickup or a Luton
            van for a full house move,{" "}
            <strong className="text-white">self-drive van hire Hendon</strong>{" "}
            is simple with Success Van Hire. Rates from £78/day with no hidden
            charges. For the best value, see our{" "}
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
              Book van hire Hendon online
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
              "Automatic Available",
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
