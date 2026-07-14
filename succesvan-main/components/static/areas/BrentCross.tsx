// components/static/areas/BrentCrossStatic.tsx
// NO "use client" — pure React Server Component

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  FiMapPin,
  FiPhone,
  FiTruck,
  FiCheckCircle,
  FiZap,
  FiNavigation,
  FiStar,
  FiExternalLink,
  FiShield,
  FiClock,
  FiPackage,
  FiHome,
  FiBook,
} from "react-icons/fi";
import { brentCrossFAQData } from "@/lib/schema";
import FAQComponent from "@/components/static/fAQSection";
import GoogleMapLoader from "@/components/static/areas/GoogleMapLoader";
import GoogleReviewsBanner from "@/components/global/GoogleReviewsBanner";
import ExploreMoreVanHireOptions from "@/components/global/ExploreMoreVanHireOptions";

// ─── Testimonials — heavy carousel, lazy loaded, client only ─────────────────
const Testimonials = dynamic(
  () => import("@/components/static/testominial"),
  {},
);

// ─── Static data ──────────────────────────────────────────────────────────────

const vanTypes = [
  {
    title: "Small Van Hire Brent Cross",
    description:
      "Compact panel vans for light deliveries, single-item collections, courier runs and smaller flat moves around Brent Cross and NW4.",
    capacity: "Up to 5 cubic metres",
    href: "/van-hire-london",
    anchor: "van hire London",
    featured: false,
  },
  {
    title: "Medium Van Rental Brent Cross",
    description:
      "Transit-size vans for multi-room flat moves, furniture collection from Brent Cross Shopping Centre, retail stock runs and regular business deliveries.",
    capacity: "Up to 9 cubic metres",
    href: "/van-hire-london",
    anchor: "medium van hire",
    featured: false,
  },
  {
    title: "Large Van Hire Brent Cross",
    description:
      "High-roof, extra-long load bay for house clearances, bulky appliances, trade deliveries and larger student moves across North West London.",
    capacity: "Up to 14 cubic metres",
    href: "/van-hire-london",
    anchor: "large van hire",
    featured: false,
  },
  {
    title: "Luton Van Hire Brent Cross",
    description:
      "Box-body Luton vans for full house moves and complete flat clearances. The highest-capacity option in our fleet — ideal for larger loads across Brent Cross and NW London.",
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
    body: "Brent Cross and surrounding NW4 postcodes have a large stock of rental flats and new-build properties. Self-drive van hire is the most cost-effective way to manage your own move.",
  },
  {
    icon: <FiPackage className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Furniture & Shopping Centre Collections",
    body: "Brent Cross Shopping Centre is one of North London's largest retail destinations. Our medium and large vans give you the space to collect large purchases, flat-pack furniture and bulky items.",
  },
  {
    icon: <FiTruck className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Business Deliveries",
    body: "Trade and business customers across Brent Cross, Hendon and Cricklewood use our vans for regular stock runs, trade deliveries and equipment transport across NW London.",
  },
  {
    icon: <FiHome className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Storage Trips",
    body: "Several self-storage facilities operate near Brent Cross and Staples Corner. Our Luton vans make it efficient to move a full household load in a single trip.",
  },
  {
    icon: <FiBook className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Student Moves",
    body: "With several universities accessible from NW4, student van hire near Brent Cross is in regular demand at the start and end of the academic year.",
  },
  {
    icon: <FiClock className="text-[#fe9a00] text-xl" aria-hidden="true" />,
    title: "Same-Day & Short-Term Rental",
    body: "Same-day van hire in Brent Cross may be available subject to fleet availability. For urgent jobs, call us directly — booking early gives you the best choice of van sizes.",
  },
];

const useCaseSections = [
  {
    title: "Furniture Collection from Brent Cross",
    body: "Brent Cross Shopping Centre is one of North London's most popular retail destinations. Whether you are collecting a new sofa, a flat-pack wardrobe or multiple large items, a medium or large van gives you the covered load space to do it in one trip.",
  },
  {
    title: "Retail & Marketplace Pickups",
    body: "Buying from Facebook Marketplace, Gumtree or a local seller near Brent Cross or Cricklewood? Our compact and medium vans are ideal for bulky second-hand collections across NW London.",
  },
  {
    title: "Flat & House Moves",
    body: "Brent Cross and NW4 have a high turnover of rental properties. A self-drive van rental lets you move on your own schedule without relying on a removals team for smaller jobs.",
  },
  {
    title: "Business Deliveries Across NW London",
    body: "Traders and businesses near Brent Cross, Hendon and Staples Corner use our vans regularly for stock transport, wholesale pickups and trade deliveries across North West London.",
  },
  {
    title: "Storage Trips",
    body: "Moving items to or from a self-storage facility near Brent Cross or Golders Green? Our large and Luton vans make short work of storage runs, reducing the number of trips you need.",
  },
  {
    title: "Last-Minute Jobs — Subject to Availability",
    body: "Plans change. If you need a van at short notice, call us on +44 20 3011 1198 to check what is available. Same-day van hire in Brent Cross may be possible, subject to fleet availability — book early for the best choice.",
  },
];

const nearbyAreaLinks = [
  { name: "Hendon", href: "/van-hire-hendon" },
  { name: "Cricklewood", href: "/van-hire-cricklewood" },
  { name: "Golders Green", href: "/van-hire-golders-green" },
  { name: "Wembley", href: "/van-hire-wembley" },
  { name: "NW London", href: "/van-hire-north-west-london" },
];

const nearbyAreaTags = [
  "Brent Cross Shopping Centre",
  "Staples Corner",
  "Hendon",
  "Cricklewood",
  "Golders Green",
  "West Hendon",
  "Dollis Hill",
  "Neasden",
  "Finchley",
  "North West London",
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
      "Choose your hire dates. Daily, weekly and monthly van rental in Brent Cross is available.",
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
      "Complete your booking securely online. We send instant email confirmation.",
  },
];

const statBadges = [
  { value: "24/7", label: "Support" },
  { value: "50+", label: "Vans in Fleet" },
  { value: "5★", label: "Google Rating" },
  { value: "£78+", label: "Per Day" },
];

const whyChooseUs = [
  {
    icon: <FiPackage className="text-3xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Transparent Rates from £78/Day",
    description:
      "Competitive van hire prices for Brent Cross customers. Clear costs, no hidden charges and flexible options for short-term, same-day and longer rentals.",
  },
  {
    icon: <FiTruck className="text-3xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Small, Large & Luton Vans",
    description:
      "From practical panel vans for boxes and deliveries to Luton vans for full house moves and furniture clearances across NW London.",
  },
  {
    icon: <FiClock className="text-3xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Same-Day Availability",
    description:
      "Same-day van hire near Brent Cross may be available subject to fleet availability. Call us to check — we recommend booking early for the best van choice.",
  },
  {
    icon: <FiShield className="text-3xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Transparent Hire Terms",
    description:
      "Straightforward booking, clear rental requirements and no hidden charges. Our team explains everything before you drive away.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function BrentCrossVanHireStatic() {
  return (
    <div className="relative w-full bg-[#0f172b]">
      {/* ═══════════════════════════════════════════════════════════════
          HERO
          Fixed container height → eliminates CLS.
          priority + fetchPriority="high" → fastest LCP paint.
      ═══════════════════════════════════════════════════════════════ */}
      <section aria-label="Van hire Brent Cross hero">
        {/* Fixed-height wrapper — prevents layout shift across all viewports */}
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
            src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/brent+cross+van+hire.jpg"
            alt="Van hire Brent Cross London with local van rental options"
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
                  BRENT CROSS · NW4
                </span>
              </div>

              {/* ── H1 — exact match to brief ── */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
                Van Hire Brent Cross
              </h1>

              {/* Supporting line */}
              <p className="text-xl sm:text-2xl font-semibold text-[#fe9a00]">
                Local Van Rental Near Brent Cross from £78/Day
              </p>

              {/* Primary intro — primary keywords embedded naturally */}
              <p className="text-base sm:text-lg text-gray-200 leading-relaxed">
                Need reliable{" "}
                <strong className="text-white">van hire in Brent Cross</strong>?
                Success Van Hire provides affordable{" "}
                <Link
                  href="/self-drive-van-hire"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  self-drive van hire
                </Link>{" "}
                for house moves, flat moves, furniture collection, business
                deliveries, storage runs and same-day transport across Brent
                Cross and North West London — subject to availability.
              </p>

              {/* Secondary copy */}
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                Conveniently located for Brent Cross Shopping Centre, Staples
                Corner, Hendon, Cricklewood and Golders Green, with easy access
                via the A41, A406 North Circular and M1. Our fleet includes
                small vans, medium vans, large vans and{" "}
                <Link
                  href="/luton-van-hire-london"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  Luton van hire
                </Link>{" "}
                — all ULEZ compliant with transparent daily rates. Need a
                managed move?{" "}
                <Link
                  href="/removal-van-hire-london"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  Removal van hire London
                </Link>{" "}
                is also available.
              </p>

              {/* Access note */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                <FiNavigation
                  className="text-blue-400 text-lg mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-white font-bold text-sm mb-0.5">
                    Brent Cross — A41, A406 &amp; M1 Access
                  </p>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Easy access via the A41, North Circular and M1 — covering
                    Hendon, Cricklewood, Golders Green, Staples Corner and all
                    NW postcodes.
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
                  Book Van in Brent Cross
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

            {/* ── Right column — service areas card ── */}
            <div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-[#fe9a00]/20 flex items-center justify-center shrink-0">
                    <FiMapPin
                      className="text-[#fe9a00] text-xl"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">
                      Van Hire Near Brent Cross
                    </h2>
                    <p className="text-gray-400 text-xs">
                      NW London &amp; surrounding areas
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-5">
                  {nearbyAreaLinks.map((area) => (
                    <Link
                      key={area.name}
                      href={area.href}
                      className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 text-white hover:border-[#fe9a00]/30 hover:bg-white/10 transition-colors duration-200"
                    >
                      <FiMapPin
                        className="text-gray-400 text-xs shrink-0"
                        aria-hidden="true"
                      />
                      {area.name}
                    </Link>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
                  <FiNavigation
                    className="text-blue-400 text-sm mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <p className="text-blue-300 text-xs leading-relaxed">
                    Easy access via A41, M1 and North Circular — convenient for
                    all NW London areas.
                  </p>
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-9 h-9 rounded-lg bg-[#fe9a00]/20 flex items-center justify-center shrink-0">
                    <FiCheckCircle
                      className="text-[#fe9a00]"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-white text-sm font-bold leading-tight">
                    Same-Day Hire
                    <span className="block text-gray-400 font-normal text-xs">
                      Subject to availability
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                    <FiStar className="text-green-400" aria-hidden="true" />
                  </div>
                  <span className="text-white text-sm font-bold">
                    5★ Google Rating
                  </span>
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
              Local Van Hire in Brent Cross for Moving, Collections &amp;
              Deliveries
            </h2>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              Whether you are moving between flats in NW4, collecting large
              items from Brent Cross Shopping Centre or running trade deliveries
              across North West London, our{" "}
              <strong className="text-white">van rental in Brent Cross</strong>{" "}
              gives you the vehicle and flexibility you need.
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
              Choose the Right Van Rental in Brent Cross
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Not sure which size you need? Use this guide to find the right van
              for your job near Brent Cross.
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
              Why Choose{" "}
              <span className="text-[#fe9a00]">Success Van Hire?</span>
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Your trusted partner for{" "}
              <strong className="text-white">Brent Cross van hire</strong> and
              van rental across North West London.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {whyChooseUs.map((item, i) => (
              <div
                key={i}
                className="flex gap-5 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#fe9a00]/30 transition-colors duration-200"
              >
                <div className="shrink-0 w-12 h-12 rounded-xl bg-[#fe9a00]/10 border border-[#fe9a00]/20 flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-white font-black text-base sm:text-lg mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          AREA COVERAGE + MAP
          Heading matches brief exactly.
          Map uses fixed height to prevent CLS.
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
                Van Hire Near Brent Cross Shopping Centre, Staples Corner &amp;
                NW London
              </h2>

              <p className="text-gray-300 text-base leading-relaxed mb-4">
                Our{" "}
                <strong className="text-white">
                  van hire near Brent Cross Shopping Centre
                </strong>{" "}
                service covers NW4 and all surrounding North West London areas.
                Whether you are near Staples Corner, Hendon, Cricklewood,
                Golders Green, West Hendon, Dollis Hill, Neasden or Finchley —
                we can check availability and recommend the right van for your
                dates.
              </p>

              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Brent Cross sits at the junction of the A41, A406 North Circular
                and M1, making it one of NW London's most accessible points for
                van collections. Customers searching for{" "}
                <Link
                  href="/van-hire-near-me"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  van hire near me
                </Link>{" "}
                in NW4 or NW11 will find our base a convenient local option.
              </p>

              {/* Area tags — plain, not linked to avoid self-link */}
              <div className="flex flex-wrap gap-2 mb-6">
                {nearbyAreaTags.map((area) => (
                  <span
                    key={area}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-gray-300"
                  >
                    <FiMapPin
                      className="text-[#fe9a00] text-xs shrink-0"
                      aria-hidden="true"
                    />
                    {area}
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

            {/* Map — fixed height prevents CLS */}

            <div className="rounded-2xl overflow-hidden border border-white/10 h-full">
              {" "}
              <GoogleMapLoader
                fromLocation="Brent Cross"
                fromLat={51.57679}
                fromLng={-0.21834}
                distance="1.5 miles"
                duration="5–8 minutes via A406"
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
              Popular Reasons to Hire a Van in Brent Cross
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Why NW London customers choose{" "}
              <strong className="text-white">van hire in Brent Cross</strong>{" "}
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
          SAME-DAY / LAST-MINUTE SECTION
          Heading includes "Subject to Availability" as required by brief.
      ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="last-minute-heading"
        className="py-16 md:py-24 border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-[#fe9a00]/25 bg-[#fe9a00]/5 p-6 sm:p-10 lg:p-14">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#fe9a00]/20 border border-[#fe9a00]/30 text-[#fe9a00] text-xs font-bold mb-4">
                  <FiZap className="text-sm" aria-hidden="true" />
                  LAST-MINUTE BOOKINGS
                </div>

                {/* Heading matches brief: includes "Subject to Availability" */}
                <h2
                  id="last-minute-heading"
                  className="text-3xl sm:text-4xl font-black text-white mb-4"
                >
                  Same-Day Van Hire Brent Cross, Subject to Availability
                </h2>

                <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-5">
                  Plans change — and sometimes you need a van at short notice.{" "}
                  <strong className="text-white">
                    Same-day van hire in Brent Cross
                  </strong>{" "}
                  may be available depending on fleet availability. For urgent
                  jobs,{" "}
                  <a
                    href="tel:+442030111198"
                    className="text-[#fe9a00] hover:underline font-semibold"
                  >
                    call us directly
                  </a>{" "}
                  and we will check what is available. We recommend booking
                  early for the best choice of van sizes.
                </p>

                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-6">
                  Last-minute van bookings in Brent Cross are subject to fleet
                  availability. Online booking is best for planned rentals. Call
                  us if your job is urgent — we will always do our best to help.
                </p>

                <ul className="space-y-3 mb-6">
                  {[
                    "Same-day van hire may be available — call to confirm, subject to availability",
                    "Last-minute bookings accepted — book as early as possible",
                    "Urgent business deliveries and emergency moves",
                    "Flexible periods — daily, weekly or longer hire",
                  ].map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-3 text-white text-sm"
                    >
                      <FiCheckCircle
                        className="text-green-400 mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      {point}
                    </li>
                  ))}
                </ul>

                <a
                  href="tel:+442030111198"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-[#fe9a00] hover:bg-orange-500 text-white font-bold text-sm sm:text-base transition-colors duration-200"
                >
                  <FiPhone aria-hidden="true" />
                  Call to Check Same-Day Availability
                </a>
              </div>

              {/* Stat grid */}
              <div className="grid grid-cols-2 gap-4">
                {statBadges.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 text-center"
                  >
                    <span className="text-3xl sm:text-4xl font-black text-[#fe9a00] mb-1">
                      {stat.value}
                    </span>
                    <span className="text-gray-300 text-sm font-semibold">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
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
              Book Van Hire in Brent Cross in 4 Simple Steps
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
              Book van hire Brent Cross online
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TESTIMONIALS — lazy loaded, ssr:false via GoogleMapLoader pattern
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
          FAQ — existing FAQComponent (already "use client")
      ═══════════════════════════════════════════════════════════════ */}
      <FAQComponent
        title="Van Hire Brent Cross — Frequently Asked Questions"
        subtitle="Common questions from customers searching for van hire near Brent Cross and NW London"
        faqs={brentCrossFAQData}
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
        description="Rated highly by customers in Brent Cross, Hendon, Cricklewood and across North West London."
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
            Ready to Book Van Hire in Brent Cross?
          </h2>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            Whether you need a small van for a quick furniture collection or a
            Luton van for a full house move,{" "}
            <strong className="text-white">van rental in Brent Cross</strong> is
            straightforward with Success Van Hire — from £78/day with no hidden
            charges. For the best rates, also check our{" "}
            <Link
              href="/cheap-van-hire-london"
              className="text-[#fe9a00] hover:underline font-semibold"
            >
              cheap van hire London
            </Link>{" "}
            page. For urgent or same-day jobs, call us to check availability.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/reservation"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#fe9a00] hover:bg-orange-500 text-white font-bold text-base transition-colors duration-200 shadow-lg"
            >
              <FiTruck aria-hidden="true" />
              Book van hire Brent Cross online
            </Link>
            <a
              href="tel:+442030111198"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl border-2 border-white/25 hover:border-[#fe9a00]/50 bg-white/5 hover:bg-white/10 text-white font-bold text-base transition-colors duration-200"
            >
              <FiPhone aria-hidden="true" />
              Call +44 20 3011 1198
            </a>
          </div>

          <p className="text-gray-400 text-xs mb-6">
            For same-day and last-minute van hire, call us directly —
            availability is subject to fleet availability.
          </p>

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
