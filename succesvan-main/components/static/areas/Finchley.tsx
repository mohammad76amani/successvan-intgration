// components/static/areas/FinchleyStatic.tsx
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
  FiShoppingBag,
} from "react-icons/fi";
import { TbAutomaticGearbox } from "react-icons/tb";
import { finchleyFAQData } from "@/lib/schema";
import FAQComponent from "@/components/static/fAQSection";
import GoogleMapLoader from "@/components/static/areas/GoogleMapLoader";
import ExploreMoreVanHireOptions from "@/components/global/ExploreMoreVanHireOptions";
import GoogleReviewsBanner from "@/components/global/GoogleReviewsBanner";
 

// Testimonials — heavy carousel, below fold, lazy loaded
const Testimonials = dynamic(
  () => import("@/components/static/testominial"),
 );

// ─── Static data ──────────────────────────────────────────────────────────────

const vanTypes = [
  {
    title: "Small Van Hire Finchley",
    description:
      "Compact panel vans for light deliveries, single-item collections, shop stock runs and smaller flat moves around Finchley Central, N3 and N12.",
    capacity: "Up to 5 cubic metres",
    href: "/van-hire-london",
    anchor: "van hire London",
    featured: false,
    isAuto: false,
  },
  {
    title: "Medium Van Rental Finchley",
    description:
      "Transit-size vans for multi-room flat moves, furniture pickup, retail stock transport and regular business deliveries across Finchley and North London.",
    capacity: "Up to 9 cubic metres",
    href: "/van-hire-london",
    anchor: "medium van hire",
    featured: false,
    isAuto: false,
  },
  {
    title: "Large Van Hire Finchley",
    description:
      "High-roof, extra-long load bay for house clearances, construction materials, trade deliveries and larger student moves in N3, N12 and surrounding areas.",
    capacity: "Up to 14 cubic metres",
    href: "/van-hire-london",
    anchor: "large van hire",
    featured: false,
    isAuto: false,
  },
  {
    title: "Luton Van Hire Finchley",
    description:
      "Box-body Luton vans for full house moves and complete flat clearances in Finchley and across North London. The highest-capacity option for larger loads.",
    capacity: "Up to 20 cubic metres",
    href: "/luton-van-hire-london",
    anchor: "Luton van hire London",
    featured: true,
    isAuto: false,
  },
  {
    title: "Automatic Van Hire Finchley",
    description:
      "Prefer an automatic gearbox? Automatic vans may be available for Finchley customers — ideal for urban routes around the A406, A1 and North London streets.",
    capacity: "Various sizes",
    href: "/automatic-van-hire-london",
    anchor: "Automatic van rental",
    featured: false,
    isAuto: true,
  },
];

const localBenefits = [
  {
    icon: <FiHome className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "House & Flat Moves",
    body: "Finchley N3 and N12 have a wide mix of period houses, converted flats and new-build apartments. A self-drive van in Finchley puts you in full control of your move — without the cost of a full removals team.",
  },
  {
    icon: <FiBook className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Student Moves",
    body: "With several universities accessible from Finchley Central and East Finchley, student van hire in N3 and N12 is popular at the start and end of each academic year.",
  },
  {
    icon: (
      <FiShoppingBag className="text-[#fe9a00] text-xl" aria-hidden="true" />
    ),
    title: "Shop Stock & Business Deliveries",
    body: "Local shops, Persian and Iranian businesses, caterers and independent retailers along Ballards Lane and the Finchley high streets use our vans for regular stock runs and deliveries.",
  },
  {
    icon: <FiPackage className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Furniture Pickup & Collections",
    body: "Collecting from IKEA, a marketplace seller or a local Finchley shop? Our medium and large vans give you the covered space you need — often in a single trip.",
  },
  {
    icon: <FiPackage className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Storage Runs",
    body: "Moving items to or from a storage unit near Finchley, Hendon or Mill Hill? Our large and Luton vans make storage trips far more efficient and reduce the number of journeys.",
  },
  {
    icon: <FiClock className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Short-Term & Weekend Rental",
    body: "Need a van for a day or weekend job in Finchley? Daily hire is available with no long-term commitment. Same-day van hire may be possible — subject to availability.",
  },
];

const whyChooseUs = [
  {
    icon: (
      <FiPackage className="text-2xl text-[#fe9a00]" aria-hidden="true" />
    ),
    title: "Transparent Pricing from £78/Day",
    description:
      "No hidden charges. Clear pricing for mileage, fuel and any optional extras — confirmed before you drive away.",
  },
  {
    icon: <FiTruck className="text-2xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Small, Large, Luton & Automatic",
    description:
      "From compact panel vans to Luton vans for full house moves. Automatic vans available on request. All vehicles are ULEZ compliant and serviced regularly.",
  },
  {
    icon: <FiClock className="text-2xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Flexible Rental Periods",
    description:
      "Daily, weekly and monthly van hire for Finchley customers. Flexible pickup and return times designed around your schedule.",
  },
  {
    icon: (
      <FiShield className="text-2xl text-[#fe9a00]" aria-hidden="true" />
    ),
    title: "Fully Insured & ULEZ Compliant",
    description:
      "All vans meet ULEZ and LEZ emission standards. Comprehensive insurance options included — drive anywhere in London without penalty charges.",
  },
];

const nearbyAreaTags = [
  { name: "Finchley Central", isCurrent: true },
  { name: "North Finchley" },
  { name: "East Finchley" },
  { name: "West Finchley" },
  { name: "Golders Green" },
  { name: "Hendon" },
  { name: "Mill Hill" },
  { name: "Hampstead Garden Suburb" },
   { name: "North London" },
];

const nearbyAreaLinks = [
  { name: "Golders Green", href: "/van-hire-golders-green" },
  { name: "Hendon", href: "/van-hire-hendon" },
  { name: "Mill Hill", href: "/van-hire-mill-hill" },
  { name: "Edgware", href: "/van-hire-edgware" },
  {
    name: "Brent Cross",
    href: "/success-van-hire-van-rental-in-brent-cross-london-last-minute-bookings",
  },
  { name: "NW London", href: "/van-hire-north-west-london" },
];

const useCaseSections = [
  {
    title: "House & Flat Moves in N3 and N12",
    body: "Finchley's strong residential property market means regular moves between flats and houses in N3 and N12. A self-drive van rental in Finchley puts you in control of timing and cost.",
  },
  {
    title: "Student Moves Near Finchley Central",
    body: "With the Northern line connecting Finchley Central to UCL, SOAS and other universities, student van hire near Finchley is popular at term start and end. Daily hire keeps costs manageable.",
  },
  {
    title: "Shop Stock & Persian Business Deliveries",
    body: "Finchley is home to a well-established Persian and Iranian community — with food shops, patisseries, restaurants and family businesses along Ballards Lane. Our vans support regular stock runs, catering deliveries and supply transport.",
  },
  {
    title: "Furniture Pickup & Marketplace Collections",
    body: "Collecting flat-pack furniture, a second-hand sofa or multiple marketplace items? Our medium and large vans give you the right covered load space — usually in a single trip.",
  },
  {
    title: "Storage Trips Across North London",
    body: "Moving items to a storage unit near Finchley, Hendon or Mill Hill? Our large and Luton vans reduce the number of trips needed and make storage runs far more efficient.",
  },
  {
    title: "Weekend & Short-Term Moving Jobs",
    body: "Prefer to move at your own pace over a weekend? Short-term van rental in Finchley lets you work without time pressure. Book in advance for the best choice of van sizes.",
  },
];

const communitySection = {
  heading:
    "Van Rental in Finchley for Local Shops, Families & Community Businesses",
  paragraphs: [
    "Finchley connects quickly to the A406 North Circular, A1, A1000, Barnet, Hendon, Golders Green and Brent Cross. That makes it a practical base for self-drive van rental, furniture collection, storage trips and business transport across North London.",
    "The area has a well-established Persian and Iranian community presence, with many local food, grocery, catering and family businesses around Ballards Lane, Tally Ho Corner and the Finchley high streets. Our vans are used for stock movement, event supplies, home relocation and regular commercial errands.",
    "Whether you are a local shop owner needing a regular delivery van, a family planning a home move or a sole trader transporting equipment across North London — our team can help you choose the right vehicle before you book.",
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
      "Choose your hire dates. Daily, weekly and monthly van rental in Finchley is available.",
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

export default function FinchleyVanHireStatic() {
  return (
    <div className="relative w-full bg-[#0f172b]">

      {/* ═══════════════════════════════════════════════════════════════
          HERO
          Fixed height → no CLS.
          priority + fetchPriority="high" → fastest LCP paint.
      ═══════════════════════════════════════════════════════════════ */}
      <section aria-label="Van hire Finchley hero">

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
            src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/Finchley.webp"
            alt="Van hire Finchley North London with local van rental options"
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
                  FINCHLEY · N3 / N12 / NORTH LONDON
                </span>
              </div>

              {/* ── H1 ── */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
                Van Hire Finchley
              </h1>

              {/* Supporting line */}
              <p className="text-xl sm:text-2xl font-semibold text-[#fe9a00]">
                Local Van Rental in N3, N12 &amp; North London from £78/Day
              </p>

              {/* Primary intro */}
              <p className="text-base sm:text-lg text-gray-200 leading-relaxed">
                Success Van Hire provides reliable{" "}
                <strong className="text-white">van hire in Finchley</strong> for
                customers across N3, N12, Finchley Central, North Finchley and
                the wider North London area. Whether you need a van for a house
                move, furniture pickup, shop stock, student relocation or
                business deliveries, our ULEZ-compliant fleet is ready when you
                are. We offer{" "}
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
                Our fleet ranges from compact panel vans for everyday jobs to{" "}
                <Link
                  href="/luton-van-hire-london"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  Luton van hire
                </Link>{" "}
                for full house moves. We also offer{" "}
                <Link
                  href="/automatic-van-hire-london"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  automatic van rental
                </Link>{" "}
                — ideal for easier driving on the A406, A1 and urban routes
                across North London. Rates from £78/day.
              </p>

              {/* Location note */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                <FiNavigation
                  className="text-blue-400 text-lg mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-white font-bold text-sm mb-0.5">
                    Finchley — A406, A1 &amp; Northern Line Access
                  </p>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Serving customers near Finchley Central, North Finchley,
                    East Finchley, West Finchley, Golders Green and all N3 /
                    N12 postcodes via the A406 North Circular and A1.
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
                  Book Van Hire in Finchley
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
                Van Hire in Finchley — Perfect For:
              </h2>
              <p className="text-gray-400 text-xs mb-5 leading-relaxed">
                Our Finchley van hire service covers everyday and business needs
                across N3, N12 and North London.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  {
                    icon: (
                      <FiHome
                        className="text-[#fe9a00]"
                        aria-hidden="true"
                      />
                    ),
                    label: "House & Flat Moves",
                  },
                  {
                    icon: (
                      <FiBook
                        className="text-[#fe9a00]"
                        aria-hidden="true"
                      />
                    ),
                    label: "Student Moves",
                  },
                  {
                    icon: (
                      <FiShoppingBag
                        className="text-[#fe9a00]"
                        aria-hidden="true"
                      />
                    ),
                    label: "Shop Stock Runs",
                  },
                  {
                    icon: (
                      <FiTruck
                        className="text-[#fe9a00]"
                        aria-hidden="true"
                      />
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
                    Daily, weekly or monthly van rental in Finchley — flexible
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
              Local Van Hire in Finchley for Moving, Deliveries &amp; Everyday
              Jobs
            </h2>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              Whether you are relocating a flat in N3, running shop stock across
              North London or collecting furniture from a local seller, our{" "}
              <strong className="text-white">van rental in Finchley</strong>{" "}
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
            Need a van at short notice in Finchley?{" "}
            <a
              href="tel:+442030111198"
              className="text-[#fe9a00] hover:underline font-semibold"
            >
              Call +44 20 3011 1198
            </a>{" "}
            — same-day van hire near Finchley Central may be available subject
            to availability.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          VAN TYPES (including automatic card)
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
              Choose the Right Van Rental in Finchley
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Not sure which size you need? Use this guide to find the right
              van for your job in Finchley, N3, N12 and North London.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vanTypes.map((van, i) => (
              <article
                key={i}
                className={`flex flex-col rounded-2xl border p-6 transition-colors duration-200 ${
                  van.featured
                    ? "border-[#fe9a00]/40 bg-[#fe9a00]/5"
                    : van.isAuto
                      ? "border-blue-500/30 bg-blue-500/5 hover:border-blue-400/50"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                {van.featured && (
                  <span className="inline-block mb-3 px-3 py-1 text-xs font-bold text-[#fe9a00] bg-[#fe9a00]/10 rounded-full w-fit">
                    Most Popular for Moves
                  </span>
                )}
                {van.isAuto && (
                  <span className="inline-block mb-3 px-3 py-1 text-xs font-bold text-blue-300 bg-blue-500/10 rounded-full w-fit">
                    Automatic Gearbox
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
            from £78/day. Need an automatic? Check our{" "}
            <Link
                  href="/automatic-van-hire-london"
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
              <strong className="text-white">Finchley van hire</strong> and van
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
                Van Hire Near Finchley Central, North Finchley &amp; N3/N12
              </h2>

              <p className="text-gray-300 text-base leading-relaxed mb-4">
                Our{" "}
                <strong className="text-white">
                  van hire near Finchley Central
                </strong>{" "}
                covers N3 and N12 and all surrounding North London areas.
                Whether you are based near North Finchley, East Finchley, West
                Finchley, Golders Green, Hendon, Mill Hill, Hampstead Garden
                Suburb or Whetstone — we can advise on the right van and check
                availability for your dates.
              </p>

              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Finchley sits between the A406 North Circular and the Northern
                line, giving customers in N3 and N12 straightforward access
                across North London. Customers searching for{" "}
                <Link
                  href="/van-hire-near-me"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  van hire near me
                </Link>{" "}
                in Finchley will find our North London service a practical and
                accessible choice.
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
                  fromLocation="Finchley"
                  fromLat={51.6013}
                  fromLng={-0.1932}
                  distance="4.5 miles"
                  duration="15–25 minutes via A406"
                />
             </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          COMMUNITY & BUSINESS SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="community-heading"
        className="py-16 md:py-24 border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div>
              <h2
                id="community-heading"
                className="text-3xl sm:text-4xl font-black text-white mb-5"
              >
                {communitySection.heading}
              </h2>
              <div className="space-y-4">
                {communitySection.paragraphs.map((para, i) => (
                  <p
                    key={i}
                    className="text-gray-300 text-sm sm:text-base leading-relaxed"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </div>

            {/* Highlights */}
            <div className="space-y-4">
              {[
                {
                  icon: (
                    <FiHome
                      className="text-[#fe9a00] text-xl"
                      aria-hidden="true"
                    />
                  ),
                  title: "Home Moves",
                  text: "Flat and house moves across Finchley Central, North Finchley and nearby Barnet areas.",
                },
                {
                  icon: (
                    <FiShoppingBag
                      className="text-[#fe9a00] text-xl"
                      aria-hidden="true"
                    />
                  ),
                  title: "Local Shops & Businesses",
                  text: "Stock runs, catering supplies and commercial deliveries for local shops and businesses along the Finchley high streets.",
                },
                {
                  icon: (
                    <FiPackage
                      className="text-[#fe9a00] text-xl"
                      aria-hidden="true"
                    />
                  ),
                  title: "Collections & Storage",
                  text: "Furniture, appliances, marketplace purchases, storage runs and family errands across North London.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#fe9a00]/10 border border-[#fe9a00]/20 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-black text-base mb-1">
                      {item.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
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
              Popular Reasons to Hire a Van in Finchley
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Why N3, N12 and North London customers choose{" "}
              <strong className="text-white">van hire in Finchley</strong> with
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
              Book Van Hire in Finchley in 4 Simple Steps
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
              Book van hire Finchley online
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
        title="Van Hire Finchley — Frequently Asked Questions"
        subtitle="Common questions from customers searching for van hire in Finchley, N3, N12 and North London"
        faqs={finchleyFAQData}
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
        description="Trusted by customers in Finchley, Golders Green, Hendon and across North London."
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
            Ready to Book Van Hire in Finchley?
          </h2>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            Whether you need a small van for a quick shop stock run or a Luton
            van for a full house move,{" "}
            <strong className="text-white">
              self-drive van hire Finchley
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
              Book van hire Finchley online
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