// components/static/areas/NorthWestLondonStatic.tsx
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
  FiStar,
  FiClock,
  FiShield,
  FiCalendar,
  FiPackage,
} from "react-icons/fi";
import { northWestLondonFAQData } from "@/lib/schema";
import FAQComponent from "@/components/static/fAQSection";
import GoogleMapLoader from "@/components/static/areas/GoogleMapLoader";
import ExploreMoreVanHireOptions from "@/components/global/ExploreMoreVanHireOptions";

// Testimonials — heavy carousel, below fold, lazy loaded
const Testimonials = dynamic(
  () => import("@/components/static/testominial"),
  {},
);

// ─── Static data ─────────────────────────────────────────────────────────────

const whyChooseUs = [
  {
    icon: <FiPackage className="text-3xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Competitive Rates from £78/Day",
    description:
      "Transparent pricing with no hidden charges. Our van hire North West London rates cover a range of hire periods — daily, weekly and longer term — so you pay only for what you need.",
  },
  {
    icon: <FiTruck className="text-3xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Small, Large & Luton Vans",
    description:
      "From compact panel vans for light deliveries to Luton vans for full house moves. Every vehicle in our North West London fleet is regularly serviced, ULEZ compliant and ready to work.",
  },
  {
    icon: <FiClock className="text-3xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Flexible Rental Periods",
    description:
      "Need a van for a few hours, a day, a week or longer? Our flexible van rental North West London options are built around your schedule, not ours.",
  },
  {
    icon: <FiMapPin className="text-3xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Local North West London Knowledge",
    description:
      "Our team knows NW London — Brent, Harrow, Ealing, Wembley, Hendon and beyond. We can advise on routes, ULEZ zones and parking to help you avoid unnecessary delays or charges.",
  },
  {
    icon: <FiShield className="text-3xl text-[#fe9a00]" aria-hidden="true" />,
    title: "No Hidden Fees",
    description:
      "The price you see is the price you pay. We explain all costs upfront including mileage, fuel policy and any optional extras — so there are no surprises when you return the van.",
  },
];

const services = [
  {
    icon: <FiCalendar className="text-2xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Daily and Weekly Rentals",
    description:
      "Perfect for house moves, deliveries and one-off transport needs. Our daily van hire in North West London is competitively priced, with discounts available for weekly bookings.",
  },
  {
    icon: <FiTruck className="text-2xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Long-Term Van Hire",
    description:
      "Ideal for businesses and extended projects. Long-term van rental in North West London comes with priority support and flexible vehicle swap options as your needs change.",
  },
  {
    icon: <FiPackage className="text-2xl text-[#fe9a00]" aria-hidden="true" />,
    title: "Optional Extras",
    description:
      "Trolleys, moving blankets, additional driver options and extended insurance are all available on request. Ask our team when booking your North West London van hire.",
  },
];

const areas = [
  { name: "Hendon", href: "/van-hire-hendon" },
  {
    name: "Brent Cross",
    href: "/success-van-hire-van-rental-in-brent-cross-london-last-minute-bookings",
  },
  { name: "Cricklewood", href: "/van-hire-cricklewood" },
  { name: "Golders Green", href: "/van-hire-golders-green" },
  { name: "Hampstead", href: "/van-hire-hampstead" },
  { name: "Mill Hill", href: "/van-hire-mill-hill" },
  { name: "Camden", href: "/van-hire-camden" },
  { name: "Wembley", href: "/van-hire-wembley" },
];

const statBadges = [
  { value: "15+", label: "Years Experience" },
  { value: "50+", label: "Vans Available" },
  { value: "24/7", label: "Support" },
  { value: "5★", label: "Google Rating" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function NorthWestLondonStatic() {
  return (
    <div className="relative w-full bg-[#0f172b]">
      {/* ═══════════════════════════════════════════════════════════════
          HERO
          Image uses fixed aspect ratio container to prevent CLS.
          priority + fetchPriority="high" ensures fastest LCP.
      ═══════════════════════════════════════════════════════════════ */}
      <section aria-label="Van hire North West London hero">
        <div className="relative w-full h-[420px]  lg:h-[500px]">
          <div
            className="absolute inset-0 z-10"
            style={{
              background:
                "linear-gradient(to bottom, rgba(15,23,43,0.35) 10%, rgba(15,23,43,0.65) 55%, rgba(15,23,43,1) 100%)",
            }}
            aria-hidden="true"
          />

          <Image
            src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/north+west+london+vanhire.png"
            alt="Van hire North West London — Success Van Hire fleet of clean modern vans"
            fill
            priority
            fetchPriority="high"
            quality={65}
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-cover"
          />
        </div>
        <div className="  px-4 sm:px-6 lg:px-8 pt-20 pb-12">
          <div className="text-center">
            {/* ── H1 ── */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
              Van Hire North West London
            </h1>

            <p className="text-xl sm:text-2xl font-semibold text-[#fe9a00] mb-6">
              Local Van Rental from £78/Day
            </p>

            <p className="text-base sm:text-lg text-gray-300 max-w-3xl mx-auto mb-5 leading-relaxed">
              Success Van Hire provides affordable{" "}
              <strong className="text-white">
                van hire in North West London
              </strong>{" "}
              for moving home, transporting goods, furniture collection and
              business deliveries. Our modern, ULEZ-compliant fleet covers
              Brent, Harrow, Ealing, Wembley, Hendon and all NW postcodes.
            </p>

            <p className="text-sm sm:text-base text-gray-400 max-w-3xl mx-auto mb-8 leading-relaxed">
              Whether you need{" "}
              <Link
                href="/cheap-van-hire-london"
                className="text-[#fe9a00] hover:underline font-semibold"
              >
                cheap van hire London
              </Link>
              ,{" "}
              <Link
                href="/removal-van-hire-london"
                className="text-[#fe9a00] hover:underline font-semibold"
              >
                removal van hire London
              </Link>
              ,{" "}
              <Link
                href="/luton-van-hire-london"
                className="text-[#fe9a00] hover:underline font-semibold"
              >
                Luton van hire London
              </Link>{" "}
              or a straightforward self-drive van for a day, we have the right
              vehicle and flexible rental terms to match. Our team understands
              North West London — the routes, the ULEZ boundaries and the
              parking restrictions — so we can advise before you drive away.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <a
                href="tel:+442030111198"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#fe9a00] hover:bg-orange-500 text-white font-bold text-base transition-colors duration-200 shadow-lg"
              >
                <FiPhone aria-hidden="true" />
                Call: 020 3011 1198
              </a>
              <Link
                href="/reservation"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl border-2 border-white/25 hover:border-[#fe9a00]/60 bg-white/5 hover:bg-white/10 text-white font-bold text-base transition-colors duration-200"
              >
                <FiTruck aria-hidden="true" />
                Book Van Hire Online
              </Link>
            </div>

            {/* Stat badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {statBadges.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center"
                >
                  <p className="text-3xl font-black text-[#fe9a00] mb-1">
                    {stat.value}
                  </p>
                  <p className="text-gray-400 text-xs font-semibold">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
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
              We are committed to providing straightforward, reliable van rental
              across North West London.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyChooseUs.map((feature, i) => (
              <div
                key={i}
                className="flex gap-5 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#fe9a00]/30 transition-colors duration-200"
              >
                <div className="shrink-0 w-12 h-12 rounded-xl bg-[#fe9a00]/10 border border-[#fe9a00]/20 flex items-center justify-center">
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
          MAP
      ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-label="Directions from North West London to Success Van Hire"
        className="border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="rounded-2xl overflow-hidden border border-white/10 h-full">
            <GoogleMapLoader
              fromLocation="North West London"
              fromLat={51.556}
              fromLng={-0.198}
              distance="2.0 miles"
              duration="8–12 minutes via A406"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SERVICES
      ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="services-heading"
        className="py-16 md:py-24 border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              id="services-heading"
              className="text-3xl sm:text-4xl font-black text-white mb-4"
            >
              Our Van Hire <span className="text-[#fe9a00]">Services</span>
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Flexible rental options designed around how North West London
              customers actually use a van.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#fe9a00]/30 transition-colors duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-[#fe9a00]/15 border border-[#fe9a00]/20 flex items-center justify-center mb-4">
                  {service.icon}
                </div>
                <h3 className="text-white font-black text-base sm:text-lg mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-400 text-sm mt-8">
            Need{" "}
            <Link
              href="/self-drive-van-hire"
              className="text-[#fe9a00] hover:underline font-semibold"
            >
              self-drive van hire
            </Link>{" "}
            or{" "}
            <Link
              href="/automatic-van-hire-london
"
              className="text-[#fe9a00] hover:underline font-semibold"
            >
              automatic van rental
            </Link>
            ? Both are available across North West London. Call us to confirm
            options.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TESTIMONIALS — lazy loaded
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
          AREAS WE SERVE
      ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="areas-heading"
        className="py-16 md:py-24 border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              id="areas-heading"
              className="text-3xl sm:text-4xl font-black text-white mb-4"
            >
              Van Hire Across{" "}
              <span className="text-[#fe9a00]">North West London</span>
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-3xl mx-auto">
              Our{" "}
              <strong className="text-white">van hire North West London</strong>{" "}
              service covers Hendon, Wembley, Brent Cross, Cricklewood, Golders
              Green, Hampstead, Mill Hill and Camden. Whether you need{" "}
              <Link
                href="/van-hire-near-me"
                className="text-[#fe9a00] hover:underline font-semibold"
              >
                van hire near me
              </Link>{" "}
              in Harrow, Ealing or a Luton van in Stanmore — we can help.
            </p>
          </div>

          {/* Area cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
            {areas.map((area) => (
              <Link
                key={area.name}
                href={area.href}
                className="group flex flex-col items-center p-5 rounded-xl bg-white/5 border border-white/10 hover:border-[#fe9a00]/40 hover:bg-[#fe9a00]/5 transition-colors duration-200 text-center"
              >
                <div className="w-9 h-9 rounded-lg bg-[#fe9a00]/20 flex items-center justify-center mb-2">
                  <FiMapPin
                    className="text-[#fe9a00] text-sm"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-white text-sm font-bold group-hover:text-[#fe9a00] transition-colors duration-200">
                  {area.name}
                </h3>
              </Link>
            ))}
          </div>

          {/* Wider coverage note */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 sm:p-8 text-center max-w-3xl mx-auto">
            <FiNavigation
              className="text-blue-400 text-3xl mx-auto mb-3"
              aria-hidden="true"
            />
            <h3 className="text-xl font-black text-white mb-2">
              Serving Beyond North West London
            </h3>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              We also cover Central London, East London and parts of South
              London. Need{" "}
              <Link
                href="/van-hire-london"
                className="text-[#fe9a00] hover:underline font-semibold"
              >
                van hire London
              </Link>{" "}
              in another area? Contact us to discuss your requirements and we
              can advise on delivery or collection options to suit your
              location.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FAQ — your existing FAQComponent
      ═══════════════════════════════════════════════════════════════ */}
      <FAQComponent
        title="Van Hire North West London — Frequently Asked Questions"
        subtitle="Common questions from customers searching for van hire across NW London"
        faqs={northWestLondonFAQData}
        showSearch={false}
        defaultOpen={0}
        accentColor="#fe9a00"
        backgroundColor="#0f172b"
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
            Ready to Book Van Hire in North West London?
          </h2>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            Whether you need a small panel van for a quick collection or a Luton
            van for a full home move,{" "}
            <strong className="text-white">
              van rental in North West London
            </strong>{" "}
            is simple with Success Van Hire. Rates from £78/day with no hidden
            charges. For the best deals, check our{" "}
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
              Book Van Hire Online
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
