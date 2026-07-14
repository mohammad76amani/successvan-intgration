// components/static/areas/staplesCorner.tsx
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
  FiArchive,
} from "react-icons/fi";
import { TbAutomaticGearbox } from "react-icons/tb";
import { staplesCornerFAQData } from "@/lib/schema";
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
    title: "Small Van Hire Staples Corner",
    description:
      "Compact panel vans for light deliveries, single-item collections, marketplace pickups and smaller local jobs around Staples Corner, NW2 and nearby streets.",
    capacity: "Up to 5 cubic metres",
    href: "/van-hire-london",
    anchor: "van hire London",
    featured: false,
    badge: null as string | null,
  },
  {
    title: "Medium Van Rental Staples Corner",
    description:
      "Transit-size vans for furniture pickup, multi-item retail collections, flat moves and regular business deliveries across Staples Corner and North West London.",
    capacity: "Up to 9 cubic metres",
    href: "/van-hire-london",
    anchor: "medium van hire",
    featured: false,
    badge: null as string | null,
  },
  {
    title: "Large Van Hire Staples Corner",
    description:
      "High-roof, long-wheelbase vans for house clearances, storage runs, bulky furniture transport and larger trade deliveries across NW2 and North West London.",
    capacity: "Up to 14 cubic metres",
    href: "/van-hire-london",
    anchor: "large van hire",
    featured: false,
    badge: null as string | null,
  },
  {
    title: "Luton Van Hire Staples Corner",
    description:
      "Box-body Luton vans for full house moves, large furniture collections and complete flat clearances in Staples Corner and across North West London. Tail lift available.",
    capacity: "Up to 20 cubic metres",
    href: "/luton-van-hire-london",
    anchor: "Luton van hire London",
    featured: true,
    badge: "Most Popular for Moves",
  },
  {
    title: "Automatic Van Rental Staples Corner",
    description:
      "Automatic vans for drivers who prefer or require an automatic gearbox — ideal for navigating the A406 North Circular, the A5 Edgware Road and urban NW2 routes.",
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
    title: "Furniture Pickup & Collections",
    body: "Staples Corner sits at the junction of the A406 and A5, making it one of the most practical locations in North West London for large furniture collections, flat-pack pickup and bulky item transport. A medium or large self-drive van lets you collect and move items without relying on costly delivery services.",
  },
  {
    icon: <FiPackage className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Retail Collections",
    body: "Collecting from retail parks near Brent Cross, marketplace sellers or trade outlets in NW2? Our medium and large vans give you covered, secure load space for bulky retail purchases — usually in a single trip.",
  },
  {
    icon: <FiArchive className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Storage Runs",
    body: "Staples Corner is conveniently placed for self-storage facilities across NW2, Hendon and Brent Cross. Our large and Luton vans make storage trips more efficient — reducing the number of journeys and keeping overall costs down.",
  },
  {
    icon: <FiHome className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Flat & House Moves",
    body: "NW2 has a busy rental market with frequent tenant movement. A self-drive van gives you full control of your move without the cost of a full removals team. Our Luton vans handle full house moves in one trip.",
  },
  {
    icon: <FiTruck className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Business Deliveries",
    body: "Trades, retailers and small businesses across Staples Corner, Brent Cross and the A406 corridor use our vans for regular stock runs, deliveries and equipment transport across North West London.",
  },
  {
    icon: <FiClock className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Short-Term & Weekend Rental",
    body: "Need a van for a weekend job near Staples Corner? Daily hire is available with no long-term commitment. Same-day van hire near the North Circular may be possible — subject to availability.",
  },
];

const whyChooseUs = [
  {
    icon: <FiPackage className="text-2xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Transparent Pricing from £78/Day",
    description:
      "No hidden charges. Clear pricing on mileage, fuel and any optional extras — all confirmed before you collect.",
  },
  {
    icon: <FiTruck className="text-2xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Small, Large, Luton & Automatic",
    description:
      "From compact panel vans for light collections to Luton vans for full house moves. Automatic vans available on request. All vehicles are ULEZ compliant and regularly serviced.",
  },
  {
    icon: <FiClock className="text-2xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Flexible Rental Periods",
    description:
      "Daily, weekly and monthly van hire for Staples Corner customers. Flexible pickup and return times built around your schedule.",
  },
  {
    icon: <FiShield className="text-2xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Fully Insured & ULEZ Compliant",
    description:
      "All vans meet ULEZ and LEZ emission standards. Comprehensive insurance included — drive freely across Staples Corner, Central London and North West London without penalty charges.",
  },
];

const nearbyAreaTags = [
  { name: "Staples Corner", isCurrent: true },
   { name: "Brent Cross" },
  { name: "North Circular A406" },
  { name: "Cricklewood" },
  { name: "Hendon" },
  { name: "Dollis Hill" },
  { name: "Neasden" },
  { name: "West Hendon" },
  { name: "North West London" },
];

const nearbyAreaLinks = [
  {
    name: "Brent Cross",
    href: "/success-van-hire-van-rental-in-brent-cross-london-last-minute-bookings",
  },
  { name: "Cricklewood", href: "/van-hire-cricklewood" },
  { name: "Hendon", href: "/van-hire-hendon" },
  { name: "Neasden", href: "/van-hire-neasden" },
  { name: "Dollis Hill", href: "/van-hire-dollis-hill" },
  { name: "NW London", href: "/van-hire-north-west-london" },
];

const furnitureCollectionSection = {
  heading:
    "Van Rental in Staples Corner for Furniture Pickup & Retail Collections",
  paragraphs: [
    "Staples Corner sits at the intersection of the A406 North Circular and the A5 Edgware Road — one of the most practical junctions in North West London for van-based collections and local transport. Whether you are collecting large furniture, flat-pack items from a retail store near Brent Cross, or bulky purchases from a marketplace seller, a self-drive van gives you the covered load space and flexibility a courier cannot match.",
    "For single items or a small furniture collection, a medium Transit-size van is usually the most cost-effective option. For larger loads — a full room of furniture, a stack of flat-pack boxes or a large marketplace haul — a large van or Luton van will get it done in one trip and keep the overall cost lower than making multiple smaller journeys.",
    "Storage runs are also a common use for Staples Corner customers. The NW2 and Brent Cross area has a good selection of self-storage facilities and our large and Luton vans allow customers to move a full flat's contents in a single trip. If you are unsure which van size fits your load, call our team on +44 20 3011 1198 before you book.",
  ],
};

const businessDeliverySection = {
  heading: "Self-Drive Van Hire for Business Deliveries Around Staples Corner",
  paragraphs: [
    "Businesses operating in and around Staples Corner, Brent Cross and the A406 corridor have strong road access to the rest of North West London and Central London. Our self-drive van hire gives small businesses, sole traders, tradespeople and retailers a cost-effective way to manage deliveries, stock movement and equipment transport without the ongoing cost of a commercial fleet or courier contract.",
    "Common business uses near Staples Corner include local stock runs, trade material collections, equipment deliveries to nearby job sites, retail supply runs to shops around Brent Cross and Cricklewood, and short-term commercial transport where flexibility matters more than a fixed vehicle contract.",
    "Van rental in Staples Corner is available on daily, weekly and longer terms. If you have a recurring transport requirement, call us on +44 20 3011 1198 to discuss options. For last-minute or same-day van hire near Staples Corner, please call directly to check availability.",
  ],
};

const useCaseSections = [
  {
    title: "Furniture Pickup Near Staples Corner",
    body: "Collecting large or heavy furniture from a store near Brent Cross or a local seller? Our medium and large vans give you the right covered load space to move bulky items safely in one trip.",
  },
  {
    title: "Retail & Marketplace Collections",
    body: "Buying from retail parks, market sellers or online marketplace collections near NW2 and Brent Cross? Our vans give you the space and convenience to collect more in a single journey.",
  },
  {
    title: "Storage Runs Near the A406",
    body: "Moving items to or from storage near Hendon, Brent Cross or NW2? Our large and Luton vans make storage trips more efficient — fewer journeys, lower cost, more done in one go.",
  },
  {
    title: "Flat & House Moves in NW2",
    body: "Staples Corner NW2 has a busy rental market. A self-drive van lets you manage your move at your own pace without a full removals team. Luton vans handle full flat or house moves in one trip.",
  },
  {
    title: "Business Deliveries Across North West London",
    body: "Trades, retailers and small businesses use our vans for deliveries, stock runs and equipment transport across Staples Corner, Cricklewood, Hendon and the wider North West London area.",
  },
  {
    title: "Short-Term & Weekend Jobs",
    body: "Need a van for a day or a weekend near Staples Corner? Daily hire is available with no long-term commitment. Book in advance for the best choice of van size.",
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
      "Choose your hire dates. Daily, weekly and monthly van rental in Staples Corner is available.",
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
      "Complete your booking securely online at successvanhire.co.uk/reservation. We send instant email confirmation.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function StaplesCornerVanHireStatic() {
  return (
    <div className="relative w-full bg-[#0f172b]">
      {/* ═══════════════════════════════════════════════════════════════
          HERO
          Fixed height → no CLS.
          priority + fetchPriority="high" → fastest LCP paint.
      ═══════════════════════════════════════════════════════════════ */}
      <section aria-label="Van hire Staples Corner hero">
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
            src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/Staples+Corner.webp"
            alt="Van hire Staples Corner NW2 with local van rental options"
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
                  STAPLES CORNER · NW2 · NORTH WEST LONDON
                </span>
              </div>

              {/* ── H1 ── */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
                Van Hire Staples Corner
              </h1>

              {/* Supporting line */}
              <p className="text-xl sm:text-2xl font-semibold text-[#fe9a00]">
                Local Van Rental in NW2 &amp; North West London from £78/Day
              </p>

              {/* Primary intro */}
              <p className="text-base sm:text-lg text-gray-200 leading-relaxed">
                Success Van Hire provides reliable{" "}
                <strong className="text-white">
                  van hire in Staples Corner
                </strong>{" "}
                for customers across NW2, near Brent Cross and the A406 North
                Circular. Whether you need a van for furniture pickup, retail
                collections, storage runs or business deliveries, our
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
                From compact panel vans for light local collections to{" "}
                <Link
                  href="/luton-van-hire-london"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  Luton van hire
                </Link>{" "}
                for full house moves across Staples Corner and North West
                London. Automatic van hire is available on request. Rates from
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
                    Staples Corner — A406 North Circular &amp; A5 Edgware Road
                    Junction
                  </p>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Serving customers near the North Circular, Brent Cross,
                    Cricklewood, Hendon, Dollis Hill, Neasden, West Hendon and
                    all NW2 postcodes.
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
                  Book in Staples Corner
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
                Van Hire in Staples Corner — Perfect For:
              </h2>
              <p className="text-gray-400 text-xs mb-5 leading-relaxed">
                Our Staples Corner van hire service covers everyday and business
                needs across NW2 and North West London.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  {
                    icon: (
                      <FiHome className="text-[#fe9a00]" aria-hidden="true" />
                    ),
                    label: "Furniture Pickup",
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
                  {
                    icon: (
                      <FiArchive
                        className="text-[#fe9a00]"
                        aria-hidden="true"
                      />
                    ),
                    label: "Storage Runs",
                  },
                  {
                    icon: (
                      <FiTruck className="text-[#fe9a00]" aria-hidden="true" />
                    ),
                    label: "Business Deliveries",
                  },
                  {
                    icon: (
                      <FiHome className="text-[#fe9a00]" aria-hidden="true" />
                    ),
                    label: "Flat & House Moves",
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
                    Daily, weekly or monthly van rental in Staples Corner —
                    flexible to suit your schedule.
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
              Local Van Hire in Staples Corner for Furniture Pickup, Collections
              &amp; Everyday Jobs
            </h2>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              Whether you are picking up furniture near Brent Cross, making a
              storage run in NW2 or delivering stock across North West London,
              our{" "}
              <strong className="text-white">
                van rental in Staples Corner
              </strong>{" "}
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
            Need a van at short notice near Staples Corner?{" "}
            <a
              href="tel:+442030111198"
              className="text-[#fe9a00] hover:underline font-semibold"
            >
              Call +44 20 3011 1198
            </a>{" "}
            — same-day van hire near the North Circular may be available subject
            to availability.
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
              Choose the Right Van Rental in Staples Corner
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Not sure which van size fits your job? Use this guide to find the
              right van for collections, moves and deliveries in Staples Corner,
              NW2 and North West London.
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
              Your trusted partner for{" "}
              <strong className="text-white">van hire in Staples Corner</strong>{" "}
              and local van rental across North West London.
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
                Van Hire Near Staples Corner, Brent Cross &amp; the North
                Circular
              </h2>

              <p className="text-gray-300 text-base leading-relaxed mb-4">
                Our{" "}
                <strong className="text-white">
                  van hire near Staples Corner
                </strong>{" "}
                service covers NW2 and all surrounding North West London areas.
                Whether you are based near the A406 North Circular, Brent Cross,
                Cricklewood, Hendon, Dollis Hill, Neasden or West Hendon — we
                can advise on the right van and check availability for your
                dates.
              </p>

              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Staples Corner sits at the junction of the A406 North Circular
                and the A5 Edgware Road — giving customers in NW2 strong access
                to North West London and routes into Central London. Customers
                searching for{" "}
                <Link
                  href="/van-hire-near-me"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  van hire near me
                </Link>{" "}
                in NW2 or near the North Circular will find our North West
                London service a practical and convenient option.
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
                fromLocation="Staples Corner"
                fromLat={51.5727}
                fromLng={-0.2312}
                distance="0.5 miles"
                duration="3–5 minutes via A406"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FURNITURE PICKUP & RETAIL COLLECTIONS
      ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="furniture-collection-heading"
        className="py-16 md:py-24 border-t border-white/10"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#fe9a00]/15 flex items-center justify-center shrink-0">
                <FiHome className="text-[#fe9a00] text-xl" aria-hidden="true" />
              </div>
              <h2
                id="furniture-collection-heading"
                className="text-2xl sm:text-3xl font-black text-white"
              >
                {furnitureCollectionSection.heading}
              </h2>
            </div>

            <div className="space-y-4">
              {furnitureCollectionSection.paragraphs.map((para, i) => (
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
                Book van hire Staples Corner online
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
          BUSINESS DELIVERY SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="business-delivery-heading"
        className="py-16 md:py-24 border-t border-white/10"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#fe9a00]/15 flex items-center justify-center shrink-0">
                <FiTruck
                  className="text-[#fe9a00] text-xl"
                  aria-hidden="true"
                />
              </div>
              <h2
                id="business-delivery-heading"
                className="text-2xl sm:text-3xl font-black text-white"
              >
                {businessDeliverySection.heading}
              </h2>
            </div>

            <div className="space-y-4">
              {businessDeliverySection.paragraphs.map((para, i) => (
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
                Book van hire Staples Corner online
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
              Popular Reasons to Hire a Van in Staples Corner
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Why NW2 and North West London customers choose{" "}
              <strong className="text-white">van hire in Staples Corner</strong>{" "}
              with Success Van Hire.
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
              Book Van Hire in Staples Corner in 4 Simple Steps
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
              Book van hire Staples Corner online
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
        title="Van Hire Staples Corner — Frequently Asked Questions"
        subtitle="Common questions from customers searching for van hire in Staples Corner, NW2 and North West London"
        faqs={staplesCornerFAQData}
        showSearch={false}
        defaultOpen={0}
        accentColor="#fe9a00"
        backgroundColor="#0f172b"
      />

      {/* ═══════════════════════════════════════════════════════════════
          GOOGLE REVIEWS — reusable shared component
      ═══════════════════════════════════════════════════════════════ */}
      <GoogleReviewsBanner
        highlight="North West London"
        description="Trusted by customers in Staples Corner, Brent Cross, Cricklewood, Hendon and across North West London for local van hire."
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
            Ready to Book Van Hire in Staples Corner?
          </h2>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            Whether you need a medium van for a furniture pickup or a Luton van
            for a full flat move,{" "}
            <strong className="text-white">
              self-drive van hire in Staples Corner
            </strong>{" "}
            is straightforward with Success Van Hire. Rates from £78/day with no
            hidden charges. For urgent or same-day jobs, call us directly to
            check availability. For the best value, see our{" "}
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
              Book van hire Staples Corner online
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
