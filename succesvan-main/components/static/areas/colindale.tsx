// components/static/areas/ColindaleStatic.tsx
// NO "use client" — pure React Server Component

import Image from "next/image";
import Link from "next/link";
import {
  FiPhone,
  FiTruck,
  FiCheckCircle,
  FiStar,
  FiExternalLink,
  FiNavigation,
  FiMapPin,
  FiPackage,
  FiHome,
  FiShield,
  FiClock,
  FiBook,
} from "react-icons/fi";
import { colindaleFAQData } from "@/lib/schema";
import FAQComponent from "@/components/static/fAQSection";
import GoogleMapLoader from "@/components/static/areas/GoogleMapLoader";
import ExploreMoreVanHireOptions from "@/components/global/ExploreMoreVanHireOptions";
import GoogleReviewsBanner from "@/components/global/GoogleReviewsBanner";

// ─── Static data ──────────────────────────────────────────────────────────────

const vanTypes = [
  {
    title: "Small Van Hire Colindale",
    description:
      "Compact panel vans ideal for single-item collections, light deliveries and smaller flat moves around NW9. A cost-effective option when you do not need a full-size Transit.",
    capacity: "Up to 5 cubic metres",
    href: "/van-hire-london",
    anchor: "van hire London",
    featured: false,
  },
  {
    title: "Medium Van Rental Colindale",
    description:
      "Transit-size vans suited to multi-room flat moves, furniture pickup, retail stock runs and regular business deliveries across Colindale and North West London.",
    capacity: "Up to 9 cubic metres",
    href: "/van-hire-london",
    anchor: "medium van hire",
    featured: false,
  },
  {
    title: "Large Van Hire Colindale",
    description:
      "High-roof, extra-long load bay for house clearances, construction materials, trade deliveries and larger student moves in NW9 and surrounding areas.",
    capacity: "Up to 14 cubic metres",
    href: "/van-hire-london",
    anchor: "large van hire",
    featured: false,
  },
  {
    title: "Luton Van Hire Colindale",
    description:
      "Box-body Luton vans for full house moves and complete flat clearances across Colindale, Hendon, Edgware and wider North West London. The highest-capacity option in our fleet.",
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
    body: "Colindale has a large proportion of rental flats and new-build apartments. A self-drive van is the most practical and affordable way to move between properties in NW9.",
  },
  {
    icon: <FiBook className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Student Moves",
    body: "Close to Middlesex University and a number of student-heavy postcodes, Colindale sees high demand for student van hire at the start and end of the academic year.",
  },
  {
    icon: <FiPackage className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Furniture Pickup",
    body: "Collecting from IKEA, Facebook Marketplace or a local seller? Our medium and large vans give you the space to handle bulky items without stress.",
  },
  {
    icon: <FiTruck className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Business Deliveries",
    body: "Trade and business customers in Colindale and across NW London use our vans for regular deliveries, stock transport and equipment runs.",
  },
  {
    icon: <FiPackage className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Storage Runs",
    body: "Moving items to or from a self-storage unit? Our large vans and Luton vans make short work of storage trips across North West London.",
  },
  {
    icon: <FiHome className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Short-Term Rental",
    body: "Need a van for just a day or two? Daily hire is available with no long-term commitment. Subject to availability — call to confirm on the day.",
  },
];

const whyChooseUs = [
  {
    icon: <FiPackage className="text-2xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Transparent Pricing from £78/Day",
    description:
      "No hidden charges. Clear breakdowns for mileage, fuel and any optional extras — agreed before you drive away.",
  },
  {
    icon: <FiTruck className="text-2xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Small, Large & Luton Vans",
    description:
      "From compact panel vans for light deliveries to Luton vans for full house moves. Every vehicle is ULEZ compliant and regularly serviced.",
  },
  {
    icon: <FiClock className="text-2xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Flexible Rental Periods",
    description:
      "Daily, weekly and monthly van hire in Colindale. Flexible pickup and return times built around your schedule.",
  },
  {
    icon: <FiShield className="text-2xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Fully Insured & ULEZ Compliant",
    description:
      "All vans include comprehensive insurance options and meet ULEZ and LEZ standards — drive anywhere in London without penalty charges.",
  },
];

const nearbyAreas = [
  { name: "Colindale Station", isCurrent: true },
  { name: "Edgware Road" },
   { name: "Hendon" },
  { name: "Edgware" },
  { name: "Mill Hill" },
   { name: "Brent Cross" },
  { name: "North West London" },
];

const nearbyAreaLinks = [
  { name: "Hendon", href: "/van-hire-hendon" },
  { name: "Mill Hill", href: "/van-hire-mill-hill" },
  {
    name: "Brent Cross",
    href: "/success-van-hire-van-rental-in-brent-cross-london-last-minute-bookings",
  },
  { name: "Cricklewood", href: "/van-hire-cricklewood" },
  { name: "Golders Green", href: "/van-hire-golders-green" },
  { name: "Wembley", href: "/van-hire-wembley" },
  { name: "NW London", href: "/van-hire-north-west-london" },
];

const useCaseSections = [
  {
    title: "Flat and House Moves",
    body: "Colindale's growing residential developments — particularly around The Hyde and Colindale Avenue — generate consistent demand for short-notice flat moves. A self-drive van rental in NW9 puts you in control of timing and cost.",
  },
  {
    title: "Student Moves",
    body: "With Middlesex University and several student accommodation blocks nearby, van hire in Colindale is popular at the start and end of term for moving boxes, furniture and bikes.",
  },
  {
    title: "Furniture Pickup & Retail Collections",
    body: "Brent Cross Shopping Centre is a short drive from Colindale NW9. Our medium and large vans make it easy to collect large items, flat-pack furniture or multiple shopping bags without squeezing everything into a car.",
  },
  {
    title: "Business Deliveries",
    body: "Local businesses and sole traders across NW9 use our vans for stock runs, trade deliveries and equipment transport. Van rental in Colindale on daily or weekly terms keeps your operations flexible.",
  },
  {
    title: "Storage Trips",
    body: "Several self-storage facilities operate near Colindale and Hendon. Our Luton vans are the most efficient way to move a full household load in a single trip.",
  },
  {
    title: "Office & Equipment Transport",
    body: "Planning an office relocation or moving equipment between sites in North West London? Our large and Luton vans can handle desks, racking, server equipment and more.",
  },
];

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
      "Pick your hire dates. Daily, weekly and monthly van rental in Colindale is available.",
  },
  {
    step: "3",
    title: "Add Driver & Booking Details",
    description:
      "Enter your driver licence details, contact information and confirm the hire period.",
  },
  {
    step: "4",
    title: "Confirm Your Reservation Online",
    description:
      "Complete your booking securely online. We send confirmation instantly by email.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ColindaleVanHireStatic() {
  return (
    <div className="relative w-full bg-[#0f172b]">
      {/* ═══════════════════════════════════════════════════════════════
          HERO
          Fixed container height → no CLS.
          priority + fetchPriority="high" → fastest possible LCP.
      ═══════════════════════════════════════════════════════════════ */}
      <section aria-label="Van hire Colindale hero">
        {/* Fixed-height image wrapper prevents layout shift on all viewports */}
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
            src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/colindale.png"
            alt="Van hire Colindale NW9 with local van rental options"
            fill
            priority
            fetchPriority="high"
            quality={65}
            sizes="100vw"
            className="object-cover"
          />
        </div>

        {/* Hero text — overlaps image via negative top margin */}
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
                  COLINDALE · NW9
                </span>
              </div>

              {/* ── H1 — exact match to brief ── */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
                Van Hire Colindale
              </h1>

              {/* Supporting line — exact match to brief */}
              <p className="text-xl sm:text-2xl font-semibold text-[#fe9a00]">
                Local Van Rental in NW9 from £78/Day
              </p>

              {/* Primary intro — keyword targets naturally embedded */}
              <p className="text-base sm:text-lg text-gray-200 leading-relaxed">
                Success Van Hire provides reliable{" "}
                <strong className="text-white">van hire in Colindale</strong>{" "}
                for customers across NW9, Edgware Road and the wider
                North West London area. Whether you need a van for a flat move,
                furniture pickup, student relocation or business deliveries, our
                modern fleet is ready when you are. All vans are available as{" "}
                <Link
                  href="/self-drive-van-hire"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  self-drive van hire
                </Link>{" "}
                with transparent daily rates and no hidden charges.
              </p>

              {/* Secondary copy — Luton, removal, NW9 */}
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                Our fleet ranges from compact panel vans for everyday jobs to{" "}
                <Link
                  href="/luton-van-hire-london"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  Luton van hire
                </Link>{" "}
                for full house moves across NW9 and beyond — all ULEZ compliant.
                Planning a bigger move? See our{" "}
                <Link
                  href="/removal-van-hire-london"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  removal van hire London
                </Link>{" "}
                options. For van hire near Colindale Station and Edgware Road,
                we are conveniently located with easy access via the A41 and M1.
              </p>

              {/* Access note */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                <FiNavigation
                  className="text-blue-400 text-lg mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-white font-bold text-sm mb-0.5">
                    Colindale — Northern Line &amp; A41 Edgware Road
                  </p>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Well connected via Colindale Underground Station, the A41
                    Edgware Road and M1 — covering Hendon, Edgware
                    and all NW postcodes.
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
                  Book Van Hire in Colindale
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
                Van Hire in NW9 — Perfect For:
              </h2>
              <p className="text-gray-400 text-xs mb-5 leading-relaxed">
                Our Colindale van hire service covers a wide range of everyday
                and business needs across NW9 and North West London.
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
                      <FiPackage
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
                    Daily, weekly or monthly — flexible van rental in Colindale
                    to suit your schedule.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          LOCAL BENEFITS SECTION
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
              Local Van Hire in Colindale for Moving, Deliveries &amp; Everyday
              Jobs
            </h2>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              Whether you are moving between flats in NW9, collecting furniture
              from a local seller or running trade deliveries across North West
              London, our{" "}
              <strong className="text-white">van rental in Colindale</strong>{" "}
              gives you the vehicle, the flexibility and the load space you need
              — without long-term commitment or inflated pricing.
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
            Need a van at short notice?{" "}
            <a
              href="tel:+442030111198"
              className="text-[#fe9a00] hover:underline font-semibold"
            >
              Call +44 20 3011 1198
            </a>{" "}
            — same-day van hire near Colindale may be available subject to
            availability.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          VAN TYPES SECTION
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
              Choose the Right Van Rental in Colindale
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Not sure which size you need? Use this guide to pick the right van
              for your job in NW9.
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
            from £78/day. Prefer an automatic?{" "}
            <Link
              href="/automatic-van-hire-london
"
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
              <strong className="text-white">Colindale van hire</strong> and van
              rental across North West London.
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
          Heading updated to match brief exactly.
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
                Van Hire Near Colindale Station, Edgware Road &amp; NW9
              </h2>

              <p className="text-gray-300 text-base leading-relaxed mb-4">
                Our{" "}
                <strong className="text-white">
                  van hire near Colindale Station
                </strong>{" "}
                covers the full NW9 postcode and the surrounding North West
                London areas. Whether you are located near the Edgware Road, Hendon, Edgware, Mill Hill, Kingsbury or Brent Cross
                — we can advise on the right van and check availability for your
                dates.
              </p>

              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Colindale sits at a natural hub for NW London — close to the
                A41, M1 and North Circular, making collections and returns
                straightforward from most NW postcodes. Customers searching for{" "}
                <Link
                  href="/van-hire-near-me"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  van hire near me
                </Link>{" "}
                in NW9 will find our North West London depot a practical and
                accessible option.
              </p>

              {/* Plain area tags — not linked to avoid self-linking on current page */}
              <div className="flex flex-wrap gap-2 mb-6">
                {nearbyAreas.map((area) => (
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

            {/* Map — client wrapper, below fold */}
            <div className="rounded-2xl overflow-hidden border border-white/10 h-full">
              <GoogleMapLoader
                fromLocation="Colindale"
                fromLat={51.5953}
                fromLng={-0.2497}
                distance="2 miles"
                duration="8–12 minutes via A41"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          USE CASES SECTION
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
              Popular Reasons to Hire a Van in Colindale
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Here is why NW9 and North West London customers choose our{" "}
              <strong className="text-white">van hire in Colindale</strong>.
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
              Book Van Hire in Colindale in 4 Simple Steps
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
              Book van hire Colindale online
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FAQ — existing FAQComponent (already "use client")
      ═══════════════════════════════════════════════════════════════ */}
      <FAQComponent
        title="Van Hire Colindale — Frequently Asked Questions"
        subtitle="Common questions from customers searching for van hire in Colindale and NW9"
        faqs={colindaleFAQData}
        showSearch={false}
        defaultOpen={0}
        accentColor="#fe9a00"
        backgroundColor="#0f172b"
      />

      {/* ═══════════════════════════════════════════════════════════════
                GOOGLE RATING BANNER
            ═══════════════════════════════════════════════════════════════ */}
      <GoogleReviewsBanner
        highlight="NW London"
        description="Rated highly by customers in Coldinate, Hendon, Cricklewood and across North West London."
      />

      {/* ═══════════════════════════════════════════════════════════════
               RELATED PAGES
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
            Ready to Book Van Hire in Colindale?
          </h2>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            Whether you need a small van for a quick furniture pickup or a Luton
            van for a full house move,{" "}
            <strong className="text-white">
              self-drive van hire Colindale
            </strong>{" "}
            is simple with Success Van Hire. Rates from £78/day with no hidden
            charges. Looking for the best value?{" "}
            <Link
              href="/cheap-van-hire-london"
              className="text-[#fe9a00] hover:underline font-semibold"
            >
              cheap van hire London
            </Link>{" "}
            options are also available — check online or call our team.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/reservation"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#fe9a00] hover:bg-orange-500 text-white font-bold text-base transition-colors duration-200 shadow-lg"
            >
              <FiTruck aria-hidden="true" />
              Book van hire Colindale online
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
