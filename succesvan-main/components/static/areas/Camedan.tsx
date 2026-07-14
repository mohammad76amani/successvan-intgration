// components/static/areas/Camedan.tsx
// NO "use client" — this is a React Server Component

import Image from "next/image";
import Link from "next/link";
import {
  FiMapPin,
  FiPhone,
  FiTruck,
  FiCheckCircle,
  FiPackage,
  FiHome,
  FiBook,
} from "react-icons/fi";
import { camdenFAQData } from "@/lib/schema";
import FAQComponent from "@/components/static/fAQSection";
import GoogleMapLoader from "@/components/static/areas/GoogleMapLoader";
import GoogleReviewsBanner from "@/components/global/GoogleReviewsBanner";
import ExploreMoreVanHireOptions from "@/components/global/ExploreMoreVanHireOptions";

const vanTypes = [
  {
    title: "Small Van Hire Camden",
    description:
      "Ideal for light deliveries, courier runs, single-item collections and smaller flat moves around Camden Town and the surrounding streets.",
    capacity: "Up to 5 cubic metres",
    href: "/van-hire-london",
    anchor: "van hire London",
  },
  {
    title: "Medium Van Rental Camden",
    description:
      "A versatile Transit-size option suited to multi-room flat moves, furniture pickup, market stall supplies and regular business deliveries.",
    capacity: "Up to 9 cubic metres",
    href: "/van-hire-london",
    anchor: "medium van hire",
  },
  {
    title: "Large Van Hire Camden",
    description:
      "High-roof, extra-long load area for house clearances, storage runs, trade deliveries and larger student moves in North London.",
    capacity: "Up to 14 cubic metres",
    href: "/van-hire-london",
    anchor: "large van hire",
  },
  {
    title: "Luton Van Hire Camden",
    description:
      "The largest option in our fleet. Box-body Luton vans are the go-to choice for full house moves and complete flat clearances across Camden and North London.",
    capacity: "Up to 20 cubic metres",
    href: "/luton-van-hire-london",
    anchor: "Luton van hire London",
    featured: true,
  },
];

const useCaseItems = [
  {
    icon: <FiHome className="text-[#fe9a00] text-xl" />,
    label: "House & Flat Moves",
  },
  {
    icon: <FiBook className="text-[#fe9a00] text-xl" />,
    label: "Student Moves",
  },
  {
    icon: <FiPackage className="text-[#fe9a00] text-xl" />,
    label: "Furniture Pickup",
  },
  {
    icon: <FiTruck className="text-[#fe9a00] text-xl" />,
    label: "Business Deliveries",
  },
  {
    icon: <FiPackage className="text-[#fe9a00] text-xl" />,
    label: "Event Equipment",
  },
  {
    icon: <FiHome className="text-[#fe9a00] text-xl" />,
    label: "Storage Trips",
  },
];

const bookingSteps = [
  {
    step: "1",
    title: "Choose Your Van Size",
    description:
      "Select from small, medium, large or Luton vans based on your load.",
  },
  {
    step: "2",
    title: "Select Your Dates",
    description:
      "Pick your pickup and return dates. Flexible daily, weekly and monthly hire available.",
  },
  {
    step: "3",
    title: "Add Your Details",
    description:
      "Enter your driver details and check availability for your chosen period.",
  },
  {
    step: "4",
    title: "Confirm Online",
    description:
      "Complete your booking securely online. We'll send confirmation instantly.",
  },
];

const nearbyAreas = [
  "Camden Town",
  "Camden Market",
  "Hampstead",
  "West Hampstead",
  "Kilburn",
  "North West London",
];

export default function CamdenVanHireStatic() {
  return (
    <div className="relative w-full bg-[#0f172b]">
      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section aria-label="Van hire Camden hero">
        {/* Hero image wrapper — fixed height prevents CLS */}
        <div className="relative w-full h-[420px] sm:h-[520px] lg:h-[600px]">
          <div
            className="absolute inset-0 z-10"
            style={{
              background:
                "linear-gradient(to bottom, rgba(15,23,43,0.35) 0%, rgba(15,23,43,0.65) 55%, rgba(15,23,43,1) 100%)",
            }}
            aria-hidden="true"
          />

          <Image
            src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/van+hire+camden.png"
            alt="Van hire Camden London with local van rental options"
            fill
            priority
            fetchPriority="high"
            quality={65}
            sizes="100vw"
            className="object-cover"
          />
        </div>

        {/* Hero text content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-64 sm:-mt-72 lg:-mt-80 relative z-20 pb-16">
          <div className="max-w-3xl">
            {/* Location badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fe9a00]/10 border border-[#fe9a00]/30 mb-5">
              <FiMapPin className="text-[#fe9a00] text-sm" aria-hidden="true" />
              <span className="text-[#fe9a00] font-bold text-xs sm:text-sm tracking-wide">
                NORTH LONDON · NW1
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-3 leading-tight">
              Van Hire Camden
            </h1>

            <p className="text-xl sm:text-2xl font-semibold text-[#fe9a00] mb-6">
              Local Van Rental in Camden from £78/Day
            </p>

            <p className="text-base sm:text-lg text-gray-200 leading-relaxed mb-4 max-w-2xl">
              Success Van Hire provides reliable{" "}
              <strong className="text-white">van hire in Camden</strong> for
              customers across Camden Town, Camden Market and the wider North
              London area. Whether you need a van for a flat move, furniture
              pickup, student relocation or business deliveries, our modern
              fleet is ready when you are. We offer{" "}
              <Link
                href="/self-drive-van-hire"
                className="text-[#fe9a00] hover:underline font-semibold"
              >
                self-drive van hire
              </Link>{" "}
              with no hidden charges and transparent daily rates.
            </p>

            <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-8 max-w-2xl">
              Our fleet includes small panel vans, Transit-size medium vans,
              large high-roof vans and{" "}
              <Link
                href="/luton-van-hire-london"
                className="text-[#fe9a00] hover:underline font-semibold"
              >
                Luton van hire London
              </Link>{" "}
              — all ULEZ compliant, well maintained and available for daily,
              weekly or monthly rental. Need{" "}
              <Link
                href="/removal-van-hire-london"
                className="text-[#fe9a00] hover:underline font-semibold"
              >
                removal van hire London
              </Link>
              ? We have you covered.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/reservation"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#fe9a00] hover:bg-orange-500 text-white font-bold text-base transition-colors duration-200 shadow-lg"
              >
                <FiTruck aria-hidden="true" />
                Book Van Hire in Camden
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
              Local Van Hire in Camden for Moving, Deliveries &amp; Business Use
            </h2>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              Whether you&apos;re relocating a Camden flat, collecting furniture
              from a local market, running trade deliveries or moving into
              student accommodation, our{" "}
              <strong className="text-white">van rental in Camden</strong> gives
              you the flexibility and load space you need — without long-term
              commitment.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCaseItems.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#fe9a00]/30 transition-colors duration-200"
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-[#fe9a00]/15 flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm sm:text-base">
                    {item.label}
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1 leading-relaxed">
                    Available for daily or short-term hire across Camden and
                    North London.
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-gray-400 text-sm sm:text-base">
              Short on time? Same-day van hire near Camden may be available —{" "}
              <a
                href="tel:+442030111198"
                className="text-[#fe9a00] hover:underline font-semibold"
              >
                call us on +44 20 3011 1198
              </a>{" "}
              to check subject to availability.
            </p>
          </div>
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
              Choose the Right Van Rental in Camden
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Not sure which size you need? Here&apos;s a simple guide to help
              you pick the right van for your job in Camden.
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
                <h3 className="text-white font-black text-lg mb-2">
                  {van.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed flex-1 mb-4">
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
            All vans are ULEZ compliant, fully insured and available for{" "}
            <Link
              href="/self-drive-van-hire"
              className="text-[#fe9a00] hover:underline font-semibold"
            >
              self-drive van hire
            </Link>
            . Prices from £78/day.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          AREA COVERAGE SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="area-coverage-heading"
        className="py-16 md:py-24 border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-1 gap-12 items-center">
            <div>
              <h2
                id="area-coverage-heading"
                className="text-3xl sm:text-4xl font-black text-white mb-4"
              >
                Van Hire Near Camden and North London
              </h2>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-6">
                Our <strong className="text-white">van hire near Camden</strong>{" "}
                service covers the full NW1 postcode and neighbouring areas.
                Whether you&apos;re based near Camden Town station, close to
                Chalk Farm, or just off the Kentish Town Road, we can arrange
                collection or check availability for your local needs.
              </p>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
                Customers regularly hire vans from us for moves between Camden
                Market, King&apos;s Cross, Regent&apos;s Park and across North
                West London — including Hampstead, West Hampstead and Kilburn.
                For customers looking for{" "}
                <Link
                  href="/van-hire-near-me"
                  className="text-[#fe9a00] hover:underline font-semibold"
                >
                  van hire near me
                </Link>
                , our North London location makes us a practical local choice.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {nearbyAreas.map((area) => (
                  <div
                    key={area}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm font-medium"
                  >
                    <FiMapPin
                      className="text-[#fe9a00] text-xs shrink-0"
                      aria-hidden="true"
                    />
                    {area}
                  </div>
                ))}
              </div>
            </div>

            {/* Google Map — lazy loaded via client wrapper */}
            <div className="rounded-2xl overflow-hidden border border-white/10 h-full">
              <GoogleMapLoader
                fromLocation="Camden"
                fromLat={51.5207782}
                fromLng={-0.1295421}
                distance="3.2 miles"
                duration="12–18 minutes via A41"
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
              Popular Reasons to Hire a Van in Camden
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Camden has one of the highest concentrations of rental demand in
              North London. Here&apos;s why local customers choose our{" "}
              <strong className="text-white">Camden van hire</strong> service.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: "House and Flat Moves",
                body: "Camden has thousands of rental properties. A self-drive van is the most cost-effective way to move between flats, especially for shorter distances within the borough.",
              },
              {
                title: "Student Moves",
                body: "With UCL, SOAS and the London School of Fashion all nearby, student van hire in Camden is high demand at the start and end of term.",
              },
              {
                title: "Furniture Pickup",
                body: "Collecting from IKEA, Facebook Marketplace or a local shop? Our medium and large vans give you the load space to handle bulky items safely.",
              },
              {
                title: "Business Deliveries",
                body: "Traders, market vendors and Camden-based businesses use our vans for regular deliveries. Van rental for business in Camden is available on short or extended terms.",
              },
              {
                title: "Event and Equipment Transport",
                body: "Moving PA equipment, market stall supplies or event props? A larger panel van or Luton gives you the covered space you need.",
              },
              {
                title: "Storage Trips",
                body: "Need to move items to or from a self-storage unit? Our large vans and Luton vans make light work of storage runs across North London.",
              },
            ].map((item, i) => (
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
          BOOKING STEPS SECTION
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
              Book Van Hire in Camden in 4 Simple Steps
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
              Our booking process is quick, straightforward and fully online.
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
              Book van hire Camden online
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FAQ SECTION — Using your existing FAQComponent
      ═══════════════════════════════════════════════════════════════ */}
      <FAQComponent
        title="Van Hire Camden — Frequently Asked Questions"
        subtitle="Common questions from customers looking for van hire in Camden and North London"
        faqs={camdenFAQData}
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
          FINAL CTA SECTION
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
            Ready to Book Van Hire in Camden?
          </h2>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            Whether you need a small van for a quick furniture pickup or a Luton
            van for a full house move,{" "}
            <strong className="text-white">van hire in Camden</strong> is simple
            with Success Van Hire. Rates from £78/day with no hidden charges.
            Need{" "}
            <Link
              href="/cheap-van-hire-london"
              className="text-[#fe9a00] hover:underline font-semibold"
            >
              cheap van hire London
            </Link>
            ? Check our latest offers online.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/reservation"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#fe9a00] hover:bg-orange-500 text-white font-bold text-base transition-colors duration-200 shadow-lg"
            >
              <FiTruck aria-hidden="true" />
              Book Van Hire in Camden Online
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
