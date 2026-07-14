// components/static/areas/HampsteadStatic.tsx
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
import { hampsteadFAQData } from "@/lib/schema";
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
    title: "Small Van Hire Hampstead",
    description:
      "Compact panel vans for light deliveries, single-item collections and smaller flat moves around Hampstead, NW3 and nearby North London streets.",
    capacity: "Up to 5 cubic metres",
    href: "/van-hire-london",
    anchor: "van hire London",
    featured: false,
    badge: null as string | null,
  },
  {
    title: "Medium Van Rental Hampstead",
    description:
      "Transit-size vans for multi-room flat moves, furniture pickup, retail stock runs and regular business deliveries across Hampstead and North London.",
    capacity: "Up to 9 cubic metres",
    href: "/van-hire-london",
    anchor: "medium van hire",
    featured: false,
    badge: null as string | null,
  },
  {
    title: "Large Van Hire Hampstead",
    description:
      "High-roof, extra-long load bay for house clearances, larger student moves, trade deliveries and bulky items in NW3 and surrounding areas.",
    capacity: "Up to 14 cubic metres",
    href: "/van-hire-london",
    anchor: "large van hire",
    featured: false,
    badge: null as string | null,
  },
  {
    title: "Luton Van Hire Hampstead",
    description:
      "Box-body Luton vans for full house moves and complete flat clearances in Hampstead and across North London. The highest-capacity option for larger loads.",
    capacity: "Up to 20 cubic metres",
    href: "/luton-van-hire-london",
    anchor: "Luton van hire London",
    featured: true,
    badge: "Most Popular for Moves",
  },
  {
    title: "Automatic Van Rental Hampstead",
    description:
      "Prefer an automatic gearbox? Automatic vans may be available for Hampstead customers — ideal for easier driving on Hampstead's narrow streets and the A41.",
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
    title: "Flat & House Moves",
    body: "Hampstead NW3 has a high concentration of Victorian houses, garden flats and period conversions. A self-drive van gives you full control of your move — without the expense of a full removals service.",
  },
  {
    icon: <FiBook className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Student Moves",
    body: "With UCL, Royal Free Hospital and several colleges nearby, student van hire in NW3 is in regular demand at the start and end of each term. Daily hire keeps costs manageable.",
  },
  {
    icon: <FiPackage className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Furniture Pickup & Collections",
    body: "Collecting from an antique dealer, a marketplace seller or a local Hampstead shop? Our medium and large vans give you the right covered load space — in one careful trip.",
  },
  {
    icon: <FiTruck className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Business Deliveries",
    body: "Local businesses, independent shops and professionals across Hampstead and North London use our vans for regular deliveries, equipment transport and stock runs.",
  },
  {
    icon: <FiPackage className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Storage Runs",
    body: "Moving items to or from a storage unit near Hampstead, Golders Green or Camden? Our large and Luton vans make storage trips efficient and cost-effective.",
  },
  {
    icon: <FiClock className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Short-Term & Weekend Rental",
    body: "Need a van for a day or weekend job in Hampstead? Daily hire is available with no long-term commitment. Same-day van hire may be possible — subject to availability.",
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
      "From compact panel vans to Luton vans for full moves. Automatic vans available on request. All vehicles are ULEZ compliant and regularly serviced.",
  },
  {
    icon: <FiClock className="text-2xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Flexible Rental Periods",
    description:
      "Daily, weekly and monthly van hire for Hampstead customers. Flexible pickup and return times built around your schedule.",
  },
  {
    icon: <FiShield className="text-2xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Fully Insured & ULEZ Compliant",
    description:
      "All vans meet ULEZ and LEZ emission standards. Comprehensive insurance options included — drive anywhere in London without penalty charges.",
  },
];

const nearbyAreaTags = [
  { name: "Hampstead Heath", isCurrent: true },
  { name: "Hampstead Station" },
   { name: "West Hampstead" },
  { name: "Golders Green" },
  { name: "Camden" },
  { name: "Finchley Road" },
   { name: "North London" },
];

const nearbyAreaLinks = [
  { name: "Golders Green", href: "/van-hire-golders-green" },
  { name: "Camden", href: "/van-hire-camden" },
  { name: "Hendon", href: "/van-hire-hendon" },
  { name: "Cricklewood", href: "/van-hire-cricklewood" },
  {
    name: "Brent Cross",
    href: "/success-van-hire-van-rental-in-brent-cross-london-last-minute-bookings",
  },
  { name: "NW London", href: "/van-hire-north-west-london" },
];

const useCaseSections = [
  {
    title: "Flat & House Moves in Hampstead",
    body: "Hampstead NW3 has one of North London's most active property markets — with frequent moves between garden flats, period houses and converted properties. A self-drive van rental in Hampstead gives you full control of your timeline and keeps moving costs clear.",
  },
  {
    title: "Furniture Pickup Near Hampstead Heath",
    body: "Whether you are collecting antique furniture, a second-hand sofa from a marketplace seller or a large flat-pack delivery near Hampstead, our medium and large vans give you the right covered space — in a single trip.",
  },
  {
    title: "Student Moves in NW3",
    body: "With several universities and hospitals accessible from Hampstead and Swiss Cottage, student van hire in NW3 is popular at term start and end. Daily hire is a cost-effective option for single-day moves.",
  },
  {
    title: "Business Deliveries Across North London",
    body: "Local businesses, independent shops and freelance professionals in Hampstead and North London use our vans for regular deliveries, equipment transport and stock movement. Daily and weekly hire available.",
  },
  {
    title: "Storage Trips",
    body: "Moving items to a storage unit near Hampstead, Golders Green or Camden? Our large and Luton vans reduce the number of trips needed and make storage runs far more practical.",
  },
  {
    title: "Weekend & Short-Term Jobs",
    body: "Prefer to move or sort at your own pace over a weekend? Short-term van rental in Hampstead lets you work without time pressure. Book in advance for the best choice of van sizes.",
  },
];

const premiumMoveSection = {
  heading: "Practical Van Rental for Hampstead Homes, Flats & Local Moves",
  paragraphs: [
    "Hampstead is one of North London's most sought-after residential areas — with a mix of period houses, garden flats and quiet village-feel streets close to the Heath. Whether you are moving between properties, decluttering, transporting carefully chosen furniture or managing a storage run, our self-drive vans give you a practical, affordable alternative to a full removals service.",
    "Our fleet is well maintained, clean and ULEZ compliant — suited to Hampstead's streets and the surrounding North London postcodes including NW3, NW6, NW11 and nearby Camden and Islington.",
    "Need advice on which van size to use for a Hampstead flat move? Call +44 20 3011 1198 and we can help you choose the right vehicle before you book.",
  ],
};

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
      "Choose your hire dates. Daily, weekly and monthly van rental in Hampstead is available.",
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

export default function HampsteadVanHireStatic() {
  return (
    <div className="relative w-full bg-[#0f172b]">
      {/* ═══════════════════════════════════════════════════════════════
          HERO
          Fixed height → no CLS.
          priority + fetchPriority="high" → fastest LCP paint.
      ═══════════════════════════════════════════════════════════════ */}
      <section aria-label="Van hire Hampstead hero">
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
            src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/hampstead+van+hire.jpg"
            alt="Van hire Hampstead NW3 with local van rental options"
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
                  HAMPSTEAD · NW3 / NORTH LONDON
                </span>
              </div>

              {/* ── H1 ── */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
                Van Hire Hampstead
              </h1>

              {/* Supporting line */}
              <p className="text-xl sm:text-2xl font-semibold text-[#fe9a00]">
                Local Van Rental in NW3 &amp; North London from £78/Day
              </p>

              {/* Primary intro */}
              <p className="text-base sm:text-lg text-gray-200 leading-relaxed">
                Success Van Hire provides reliable{" "}
                <strong className="text-white">van hire in Hampstead</strong>{" "}
                for customers across NW3, near Hampstead Heath and the wider
                North London area. Whether you need a van for a flat move,
                furniture pickup, student relocation or business deliveries, our
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
                Our fleet covers everything from compact panel vans for everyday
                jobs to{" "}
                <Link
                  href="/luton-van-hire-london"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  Luton van hire
                </Link>{" "}
                for full house moves across Hampstead and North London. We also
                offer{" "}
                <Link
                  href="/automatic-van-hire-london
"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  automatic van rental
                </Link>{" "}
                — practical for Hampstead&apos;s streets and the A41. Rates from
                £78/day with daily, weekly and monthly options.
              </p>

              {/* Location note */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                <FiNavigation
                  className="text-blue-400 text-lg mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-white font-bold text-sm mb-0.5">
                    Hampstead — A41, A406 &amp; Northern Line Access
                  </p>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Serving customers near Hampstead Heath, Hampstead Station,
                    Belsize Park, Swiss Cottage, West Hampstead and all NW3
                    postcodes via the A41 and A406.
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
                  Book Van in Hampstead
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
                Van Hire in Hampstead — Perfect For:
              </h2>
              <p className="text-gray-400 text-xs mb-5 leading-relaxed">
                Our Hampstead van hire service covers everyday and business
                needs across NW3 and North London.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  {
                    icon: (
                      <FiHome className="text-[#fe9a00]" aria-hidden="true" />
                    ),
                    label: "Flat & House Moves",
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
                    Daily, weekly or monthly van rental in Hampstead — flexible
                    to suit your schedule.
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
              Local Van Hire in Hampstead for Moving, Furniture &amp; Everyday
              Jobs
            </h2>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              Whether you are moving between flats in NW3, collecting furniture
              near Hampstead Heath or running deliveries across North London,
              our{" "}
              <strong className="text-white">van rental in Hampstead</strong>{" "}
              gives you the vehicle and flexibility you need — without long-term
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
            Need a van at short notice in Hampstead?{" "}
            <a
              href="tel:+442030111198"
              className="text-[#fe9a00] hover:underline font-semibold"
            >
              Call +44 20 3011 1198
            </a>{" "}
            — same-day van hire near Hampstead Heath may be available subject to
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
              Choose the Right Van Rental in Hampstead
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Not sure which van you need? Use this guide to find the right
              option for your job in Hampstead and NW3.
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
            options — call to confirm availability.
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
              <strong className="text-white">Hampstead van hire</strong> and van
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
                Van Hire Near Hampstead Heath, Belsize Park &amp; NW3
              </h2>

              <p className="text-gray-300 text-base leading-relaxed mb-4">
                Our{" "}
                <strong className="text-white">
                  van hire near Hampstead Heath
                </strong>{" "}
                service covers NW3 and all surrounding North London areas.
                Whether you are based near Hampstead Station, Belsize Park,
                Swiss Cottage, West Hampstead, Golders Green, Camden, Finchley
                Road or Highgate — we can advise on the right van and check
                availability for your dates.
              </p>

              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Hampstead is well connected via the Northern line, the A41 and
                A406 — giving customers in NW3 straightforward access across
                North London. Customers searching for{" "}
                <Link
                  href="/van-hire-near-me"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  van hire near me
                </Link>{" "}
                in Hampstead will find our North London service a practical and
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
                fromLocation="Hampstead"
                fromLat={51.55667}
                fromLng={-0.17855}
                distance="2.3 miles"
                duration="10–15 minutes via A41"
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
              Popular Reasons to Hire a Van in Hampstead
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Why NW3 and North London customers choose{" "}
              <strong className="text-white">van hire in Hampstead</strong> with
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
          PREMIUM RESIDENTIAL MOVE SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="premium-move-heading"
        className="py-16 md:py-24 border-t border-white/10"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-10">
            <h2
              id="premium-move-heading"
              className="text-2xl sm:text-3xl font-black text-white mb-6"
            >
              {premiumMoveSection.heading}
            </h2>
            <div className="space-y-4">
              {premiumMoveSection.paragraphs.map((para, i) => (
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
                Book van hire Hampstead online
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
              Book Van Hire in Hampstead in 4 Simple Steps
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
              Book van hire Hampstead online
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
        title="Van Hire Hampstead — Frequently Asked Questions"
        subtitle="Common questions from customers searching for van hire in Hampstead, NW3 and North London"
        faqs={hampsteadFAQData}
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
        description="Trusted by customers in Hampstead, Golders Green, Camden and across North London."
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
            Ready to Book Van Hire in Hampstead?
          </h2>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            Whether you need a small van for a quick furniture pickup or a Luton
            van for a full flat move,{" "}
            <strong className="text-white">
              self-drive van hire Hampstead
            </strong>{" "}
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
              Book van hire Hampstead online
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
