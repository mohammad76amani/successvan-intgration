import Link from "next/link";
import Image from "next/image";
import FAQComponent from "@/components/static/fAQSection";
import VanListingHome from "../global/vanListingBackup";

// ============================================================
// SMALL REUSABLE SUB-COMPONENTS
// ============================================================

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4"
      style={{
        backgroundColor: "#fe9a0022",
        color: "#fe9a00",
        border: "1px solid #fe9a0044",
      }}
    >
      {children}
    </span>
  );
}

function OrangeBtn({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-xl text-base transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 shadow-lg"
      style={{ backgroundColor: "#fe9a00", color: "#0f172b" }}
    >
      {children}
    </Link>
  );
}

function OutlineBtn({
  href,
  children,
  tel,
}: {
  href: string;
  children: React.ReactNode;
  tel?: boolean;
}) {
  const cls =
    "inline-flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-xl text-base transition-all duration-200 hover:opacity-90 border-2";
  const style = {
    borderColor: "#fe9a00",
    color: "#fe9a00",
    backgroundColor: "transparent",
  };
  if (tel) {
    return (
      <a href={href} className={cls} style={style}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} style={style}>
      {children}
    </Link>
  );
}

// ============================================================
// SECTION 1 — HERO
// ============================================================

function HeroSection() {
  return (
    <section
      className="relative overflow-hidden py-28 md:py-28 lg:py-36"
      style={{ backgroundColor: "#0f172b" }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute top-0 left-0 w-125 h-125 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{
          backgroundColor: "#fe9a00",
          transform: "translate(-30%, -30%)",
        }}
      />
      <div
        className="absolute bottom-40 left-0 w-100 h-100 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ backgroundColor: "#fe9a00", transform: "translate(30%, 30%)" }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center  ">
          {/* Left Content */}
          <div className="order-2 lg:order-1">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight text-white mb-6">
              Flexible <span style={{ color: "#fe9a00" }}>Self-Drive</span>{" "}
              <span style={{ color: "#fe9a00" }}>Van Hire</span> in{" "}
              <span style={{ color: "#fe9a00" }}>London</span>
            </h1>

            <p className="text-lg sm:text-xl leading-relaxed mb-10 text-gray-400">
              Need a reliable van you can drive yourself? Success Van Hire
              provides flexible self-drive van hire in London for moving home,
              business deliveries, events, student moves, trade jobs, and long
              or short-term rental needs.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <OrangeBtn href="/reservation">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 17a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0zM3 5h11l1 6H4L3 5zm13 0h2l2 4v4h-4V5z"
                  />
                </svg>
                Book Your Van
              </OrangeBtn>
              <OutlineBtn href="tel:+442030111198" tel>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5a2 2 0 012-2h2.28a1 1 0 01.95.68l1.06 3.18a1 1 0 01-.23 1.04l-1.4 1.4a11.04 11.04 0 005.02 5.02l1.4-1.4a1 1 0 011.04-.23l3.18 1.06a1 1 0 01.68.95V19a2 2 0 01-2 2A17 17 0 013 5z"
                  />
                </svg>
                Call +44 20 3011 1198
              </OutlineBtn>
            </div>
          </div>

          {/* Right Image */}
          <div className="order-1 lg:order-2 ">
            <div className="relative w-full aspect-auto rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/Self-Drive+Van+Hire.webp"
                alt="Self-Drive Van Hire London - Success Van Hire"
                className="object-cover"
                width={2000}
                height={1000}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// SECTION 2 — INTRO
// ============================================================

function IntroSection() {
  return (
    <section
      className="py-16 md:py-20  "
      style={{ backgroundColor: "#0f172b" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-6"
            style={{ color: "#fff" }}
          >
            Self-Drive Van Rental Built Around Your Journey
          </h2>
          <p className="text-lg leading-relaxed mb-6 text-gray-300">
            Our self-drive van hire service gives you the freedom to rent a van
            and drive it yourself across London. Whether you are moving
            furniture, collecting stock, transporting equipment, managing
            business deliveries, or planning a weekend project, we make the
            process simple, secure, and budget-friendly.
          </p>
          <p className="text-lg leading-relaxed mb-6 text-gray-250">
            Based in North West London, Success Van Hire serves customers across
            London with a modern fleet of more than 50 vehicles. We support both
            personal and business van rental needs, including same-day bookings
            where availability allows.
          </p>
          <p className="text-base leading-relaxed mb-6 text-gray-400">
            {" "}
            With simple licence verification, secure booking, competitive
            prices, and friendly service, our self-drive van hire is ideal for
            customers who want control, flexibility, and a professional rental
            experience without unnecessary complications.
          </p>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// SECTION 4 — WHY CHOOSE US
// ============================================================

function WhyChooseUsSection() {
  const points = [
    {
      title: "Flexible Rental Options",
      description:
        "Choose short-term van hire for a quick move or long-term van rental for business use, trade work, delivery routes, or ongoing transport needs.",
    },
    {
      title: "Modern Fleet of Over 50 Vehicles",
      description:
        "Our fleet is suitable for different rental needs, from smaller vans for light loads to larger vans for removals, deliveries, and commercial use.",
    },
    {
      title: "Fast Booking Process",
      description:
        "Book online or call our team directly. We keep the rental process simple so you can get on the road quickly.",
    },
    {
      title: "London-Based Convenience",
      description:
        "Located at Strata House, Waterloo Road, London NW2 7UH, we are well-positioned for customers across North West London and beyond.",
    },
    {
      title: "Suitable for Personal and Business Use",
      description:
        "Our vans are used by individuals, families, students, tradespeople, contractors, retailers, and businesses across London.",
    },
    {
      title: "Clear Pricing",
      description:
        "We offer rental options for different budgets with transparent pricing and no hidden fees.",
    },
  ];

  return (
    <section className="py-16 md:py-20" style={{ backgroundColor: "#0f172b" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <SectionLabel>Our Advantages</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Why Choose Success Van Hire for Self-Drive Van Hire?
          </h2>
          <p
            className="mt-4 text-lg max-w-3xl mx-auto"
            style={{ color: "#ffffffcc" }}
          >
            When you hire a self-drive van, you need more than just a vehicle.
            You need the right size, fair pricing, fast support, insurance peace
            of mind, and a location that works for your journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {points.map((point) => (
            <div
              key={point.title}
              className="rounded-2xl p-6 lg:p-8 border transition-all duration-300 hover:border-opacity-40"
              style={{ backgroundColor: "#ffffff0d", borderColor: "#ffffff15" }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: "#fe9a0020" }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#fe9a00"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {point.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#ffffffaa" }}
              >
                {point.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <OrangeBtn href="/reservation">Book Your Self-Drive Van</OrangeBtn>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// SECTION 5 — USE CASES
// ============================================================

function UseCasesSection() {
  const useCases = [
    {
      title: "House Moves",
      description:
        "Ideal for moving furniture, boxes, appliances, and personal belongings across London.",
      link: {
        label: "Removal Van Hire London",
        href: "/removal-van-hire-london",
      },
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-4h4v4h4a1 1 0 001-1V10"
          />
        </svg>
      ),
    },
    {
      title: "Business Deliveries",
      description:
        "Perfect for shops, contractors, online sellers, event suppliers, and local businesses needing reliable transport.",
      link: null,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3"
          />
        </svg>
      ),
    },
    {
      title: "Student Moves",
      description:
        "A flexible choice for students moving between halls, flats, and storage units.",
      link: null,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-4-4l4 4 4-4"
          />
        </svg>
      ),
    },
    {
      title: "Event Transport",
      description:
        "Useful for transporting displays, equipment, decorations, catering items, and event materials.",
      link: null,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 3l14 9-14 9V3z"
          />
        </svg>
      ),
    },
    {
      title: "Trade & Construction Work",
      description:
        "Suitable for tools, materials, stock, and job-site equipment.",
      link: null,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      title: "Airport Runs & Group Luggage",
      description:
        "Great for customers who need extra luggage space for airport travel or group trips.",
      link: { label: "Airport Van Hire", href: "/van-hire-london" },
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      ),
    },
  ];

  return (
    <section
      className="py-16 md:py-20  "
      style={{ backgroundColor: "#0f172b" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <SectionLabel>Use Cases</SectionLabel>
          <h2
            className="text-3xl sm:text-4xl font-bold"
            style={{ color: "#fff" }}
          >
            What Can You Use a Self-Drive Van For?
          </h2>
          <p className="mt-4 text-lg max-w-3xl mx-auto text-gray-400">
            Self-drive van hire is one of the most practical rental options in
            London because it gives you control over your schedule, route,
            loading time, and journey.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {useCases.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl p-6 lg:p-8 bg-transparent border border-gray-800 hover:shadow-lg hover:border-orange-200 transition-all duration-300"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: "#fe9a0015", color: "#fe9a00" }}
              >
                {item.icon}
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "#fff" }}>
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-400 mb-3">
                {item.description}
              </p>
              {item.link && (
                <Link
                  href={item.link.href}
                  className="inline-flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-80"
                  style={{ color: "#fe9a00" }}
                >
                  {item.link.label}
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// SECTION 6 — VAN TYPES
// ============================================================

function VanTypesSection() {
  const vanTypes = [
    {
      title: "Small Vans",
      description:
        "Best for light loads, boxes, tools, small furniture, and quick city jobs.",
      link: null,
    },
    {
      title: "Medium Vans",
      description:
        "A balanced option for moving stock, equipment, luggage, and medium-sized items.",
      link: null,
    },
    {
      title: "Large Vans",
      description:
        "Suitable for bigger loads, house moves, deliveries, and business transport.",
      link: null,
    },
    {
      title: "Luton Vans",
      description:
        "Ideal for larger removals, bulky furniture, and high-volume loads.",
      link: { label: "Luton Van Hire London", href: "/luton-van-hire-london" },
    },
    {
      title: "Automatic Vans",
      description:
        "A convenient option for drivers who prefer automatic transmission in London traffic.",
      link: {
        label: "Automatic Van Hire London",
        href: "/automatic-van-hire-london",
      },
    },
    {
      title: "Minibuses",
      description:
        "For group travel, events, family trips, and passenger transport needs.",
      link: { label: "Minibus Hire London", href: "/minibus-hire-london" },
    },
  ];

  return (
    <section className="py-16 md:py-20" style={{ backgroundColor: "#0f172b" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <SectionLabel>Fleet</SectionLabel>
          <h2
            className="text-3xl sm:text-4xl font-black"
            style={{ color: "#fff" }}
          >
            Self-Drive Van Options Available
          </h2>
          <p className="mt-4 text-lg max-w-3xl mx-auto text-gray-400">
            We offer a practical range of vans for different load sizes and
            rental needs. Availability may vary, so we recommend booking early
            for peak dates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {vanTypes.map((van) => (
            <div
              key={van.title}
              className="bg-white rounded-2xl p-6 lg:p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:border-orange-200 transition-all duration-300 group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: "#0f172b10", color: "#0f172b" }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 17a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0zM3 5h11l1 6H4L3 5zm13 0h2l2 4v4h-4V5z"
                  />
                </svg>
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ color: "#0f172b" }}
              >
                {van.title}
              </h3>
              <p
                className="text-sm leading-relaxed mb-3"
                style={{ color: "#4b5563" }}
              >
                {van.description}
              </p>
              {van.link && (
                <Link
                  href={van.link.href}
                  className="inline-flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-80"
                  style={{ color: "#fe9a00" }}
                >
                  {van.link.label}
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <OrangeBtn href="/reservation">Reserve a Van Now</OrangeBtn>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// SECTION 7 — LONDON AREAS
// ============================================================

function LondonAreasSection() {
  const areas = [
    {
      name: "Brent Cross",
      href: "/success-van-hire-van-rental-in-brent-cross-london-last-minute-bookings",
      text: "Book self-drive van hire near Brent Cross for shopping collections, business transport, and last-minute rental needs.",
    },
    {
      name: "Camden",
      href: "/van-hire-camden",
      text: "Hire a van in Camden for flat moves, student moves, creative projects, and business deliveries.",
    },
    {
      name: "Colindale",
      href: "/van-hire-colindale",
      text: "Self-drive van rental near Colindale is ideal for local moves, storage runs, and furniture transport.",
    },
    {
      name: "Cricklewood",
      href: "/van-hire-cricklewood",
      text: "Choose van hire in Cricklewood for convenient access to NW London and surrounding routes.",
    },
    {
      name: "Dollis Hill",
      href: "/van-hire-dollis-hill",
      text: "Rent a self-drive van near Dollis Hill for home moves, local deliveries, and personal transport jobs.",
    },
    {
      name: "Ealing",
      href: "/van-hire-ealing",
      text: "Our self-drive van hire service supports Ealing customers who need flexible van rental across West London.",
    },
    {
      name: "Edgware",
      href: "/van-hire-edgware",
      text: "Van hire near Edgware is useful for household moves, trade work, and larger shopping collections.",
    },
    {
      name: "Finchley",
      href: "/van-hire-finchley",
      text: "Book van hire near Finchley for home moves, Persian business stock runs, furniture collection, and flexible North London transport.",
    },
    {
      name: "Golders Green",
      href: "/van-hire-golders-green",
      text: "Book van rental near Golders Green for moving, deliveries, events, and business use.",
    },
    {
      name: "Hampstead",
      href: "/van-hire-hampstead",
      text: "Self-drive van hire near Hampstead helps with apartment moves, furniture collection, and local transport.",
    },
    {
      name: "Harrow",
      href: "/van-hire-harrow",
      text: "Hire a van near Harrow for moving home, business deliveries, or long-term rental needs.",
    },
    {
      name: "Hendon",
      href: "/van-hire-hendon",
      text: "Our van hire near Hendon is convenient for students, families, tradespeople, and business customers.",
    },
    {
      name: "Kilburn",
      href: "/van-hire-kilburn",
      text: "Book self-drive van hire in Kilburn for quick access to central and North West London.",
    },
    {
      name: "Mill Hill",
      href: "/van-hire-mill-hill",
      text: "Van rental near Mill Hill is suitable for furniture moves, stock transport, and flexible personal use.",
    },
    {
      name: "Neasden",
      href: "/van-hire-neasden",
      text: "Hire a self-drive van near Neasden for affordable transport across NW London.",
    },
    {
      name: "Park Royal",
      href: "/van-hire-park-royal",
      text: "Self-drive van hire near Park Royal is ideal for businesses, warehouses, suppliers, and trade users.",
    },
    {
      name: "Staples Corner",
      href: "/van-hire-staples-corner",
      text: "Rent a van near Staples Corner for convenient access to major routes and commercial areas.",
    },
    {
      name: "Wembley",
      href: "/van-hire-wembley",
      text: "Book van hire near Wembley for events, group needs, business transport, and local removals.",
    },
    {
      name: "West Hampstead",
      href: "/van-hire-west-hampstead",
      text: "Our self-drive van hire near West Hampstead is a practical option for flat moves and city transport.",
    },
    {
      name: "Willesden Green",
      href: "/van-hire-willesden-green",
      text: "Choose van hire near Willesden Green for flexible rental close to our NW2 base.",
    },
  ];

  return (
    <section
      className="py-16 md:py-20  "
      style={{ backgroundColor: "#0f172b" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <SectionLabel>Coverage</SectionLabel>
          <h2
            className="text-3xl sm:text-4xl font-bold"
            style={{ color: "#fff" }}
          >
            Self-Drive Van Hire Across London
          </h2>
          <p
            className="mt-4 text-lg max-w-3xl mx-auto"
            style={{ color: "#4b5563" }}
          >
            Success Van Hire supports customers across London, with strong
            coverage in North West London and nearby areas. Whether you are
            searching for self-drive van hire near me, van hire in North West
            London, or affordable van rental for a move, our location makes
            collection and return simple.
          </p>
        </div>

        {/* North West London highlight */}
        <div
          className="rounded-2xl p-6 lg:p-10 mb-10 border"
          style={{ backgroundColor: "#0f172b08", borderColor: "#0f172b15" }}
        >
          <h3 className="text-2xl font-bold mb-3" style={{ color: "#e4e4e4" }}>
            Self-Drive Van Hire in North West London
          </h3>
          <p className="leading-relaxed mb-4 text-gray-400">
            Our NW2 location is convenient for customers in Brent, Camden,
            Barnet, Harrow, Ealing, and surrounding London areas. We are a
            strong choice for anyone looking for van hire near North West London
            with flexible booking and friendly support.
          </p>
          <Link
            href="/van-hire-north-west-london"
            className="inline-flex items-center gap-2 font-semibold transition-colors hover:opacity-80"
            style={{ color: "#fe9a00" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Van Hire North West London
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        {/* Areas Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {areas.map((area) => (
            <Link
              key={area.name}
              href={area.href}
              className="group rounded-xl p-5 border border-gray-200 hover:border-orange-300 transition-all duration-200"
              style={{ backgroundColor: "#f8fafc" }}
            >
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#fe9a00"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div>
                  <h4
                    className="font-bold mb-1 transition-colors group-hover:opacity-80"
                    style={{ color: "#0f172b" }}
                  >
                    Van Hire {area.name}
                  </h4>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "#6b7280" }}
                  >
                    {area.text}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// SECTION 8 — INTERNAL SERVICE LINKS
// ============================================================

function InternalLinksSection() {
  const links = [
    {
      label: "Van Hire London",
      href: "/van-hire-london",
      description: "General van rental services across London.",
    },
    {
      label: "Van Hire Near Me",
      href: "/van-hire-near-me",
      description: "Find local van hire options close to your area.",
    },
    {
      label: "Cheap Van Hire London",
      href: "/cheap-van-hire-london",
      description: "Budget-friendly van rental options with clear pricing.",
    },
    {
      label: "Removal Van Hire London",
      href: "/removal-van-hire-london",
      description: "Van hire for moving home, furniture, and bulky items.",
    },
    {
      label: "Luton Van Hire London",
      href: "/luton-van-hire-london",
      description: "Large-capacity vans for bigger moves and deliveries.",
    },
    {
      label: "Automatic Van Rental",
      href: "/automatic-van-hire-london",
      description: "Automatic vans for easier driving in London traffic.",
    },
    {
      label: "Minibus Hire London",
      href: "/minibus-hire-london",
      description: "Passenger transport for groups, events, and trips.",
    },
    {
      label: "Reservation",
      href: "/reservation",
      description: "Start your booking online.",
    },
  ];

  return (
    <section className="py-16 md:py-20" style={{ backgroundColor: "#f8fafc" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <SectionLabel>Services</SectionLabel>
          <h2
            className="text-3xl sm:text-4xl font-bold"
            style={{ color: "#0f172b" }}
          >
            Explore More Van Hire Services
          </h2>
          <p
            className="mt-4 text-lg max-w-2xl mx-auto"
            style={{ color: "#4b5563" }}
          >
            Find the right service for your journey, vehicle type, budget, or
            London location.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="group bg-white border border-gray-200 hover:border-orange-300 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <h3
                className="text-lg font-bold mb-2 transition-colors group-hover:opacity-80"
                style={{ color: "#0f172b" }}
              >
                {link.label}
              </h3>
              <p
                className="text-sm leading-relaxed mb-3"
                style={{ color: "#6b7280" }}
              >
                {link.description}
              </p>
              <span
                className="inline-flex items-center gap-1 text-sm font-semibold"
                style={{ color: "#fe9a00" }}
              >
                Learn More
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// SECTION 9 — BOOKING PROCESS
// ============================================================

function BookingProcessSection() {
  const steps = [
    {
      number: "01",
      title: "Choose Your Van",
      description:
        "Select the van size or rental type that matches your journey, load, and budget.",
    },
    {
      number: "02",
      title: "Pick Your Dates",
      description:
        "Choose your rental date, time, collection details, and return schedule.",
    },
    {
      number: "03",
      title: "Verify Your Licence",
      description:
        "We accept full UK and EU driving licences with a quick verification process.",
    },
    {
      number: "04",
      title: "Confirm Your Booking",
      description:
        "Secure your reservation online or by phone and get ready to collect your van.",
    },
    {
      number: "05",
      title: "Drive with Confidence",
      description:
        "Collect your insured vehicle and complete your move, delivery, or business journey.",
    },
  ];

  return (
    <section
      className="py-16 md:py-20  "
      style={{ backgroundColor: "#0f172b" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <SectionLabel>How It Works</SectionLabel>
          <h2
            className="text-3xl sm:text-4xl font-bold"
            style={{ color: "#fff" }}
          >
            How to Book Self-Drive Van Hire
          </h2>
          <p className="mt-4 text-lg max-w-2xl mx-auto text-gray-400">
            Booking your self-drive van with Success Van Hire is simple, fast,
            and secure.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative text-center group">
              {/* Connector line (desktop only) */}
              {index < steps.length - 1 && (
                <div
                  className="hidden lg:block absolute top-10 left-[62%] w-[76%] h-0.5"
                  style={{ backgroundColor: "#fe9a0030" }}
                />
              )}
              <div className="relative z-10">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-extrabold shadow-lg transition-all duration-300 group-hover:scale-105"
                  style={{ backgroundColor: "#0f172b", color: "#fe9a00" }}
                >
                  {step.number}
                </div>
                <h3
                  className="text-base font-bold mb-2"
                  style={{ color: "#fff" }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#4b5563" }}
                >
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <OrangeBtn href="/reservation">Start Your Booking</OrangeBtn>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// SECTION 12 — FAQ ACCORDION
// ============================================================

function FaqSection() {
  const faqs = [
    {
      question: "What is self-drive van hire?",
      answer:
        "Self-drive van hire means you rent a van and drive it yourself. It is a flexible option for moving home, business deliveries, furniture collection, student moves, trade work, and personal transport needs.",
    },
    {
      question: "Do you offer self-drive van hire in London?",
      answer:
        "Yes. Success Van Hire provides self-drive van hire in London, with convenient access from our location at Strata House, Waterloo Road, London, NW2 7UH.",
    },
    {
      question: "Can I book a van for short-term rental?",
      answer:
        "Yes. We offer short-term van hire options for customers who need a van for a day, weekend, quick move, delivery, or temporary transport job.",
    },
    {
      question: "Do you offer long-term van rental?",
      answer:
        "Yes. We provide long-term van rental options for businesses, contractors, delivery work, trade use, and customers who need a vehicle for an extended period.",
    },
    {
      question: "What driving licence do I need?",
      answer:
        "We accept full UK and EU driving licences. Licence verification is handled through a fast and simple process before the rental is confirmed.",
    },
    {
      question: "Are your vans insured?",
      answer:
        "Yes. Rental reservations are backed by insurance coverage, helping customers drive with confidence.",
    },
    {
      question: "Do your vans meet clean air standards?",
      answer:
        "Yes. Our vans meet EU6 emission standards as part of our commitment to cleaner and more environmentally responsible transport.",
    },
    {
      question: "Can I hire a van for moving house?",
      answer:
        "Yes. Self-drive van hire is ideal for moving home, flat moves, furniture transport, storage runs, and bulky item collection.",
    },
    {
      question: "Do you offer Luton van hire?",
      answer:
        "Yes. Luton vans are suitable for larger moves, bulky furniture, business deliveries, and high-volume transport needs. You can view our Luton Van Hire London service for more details.",
    },
    {
      question: "Can businesses rent vans from Success Van Hire?",
      answer:
        "Yes. We support B2B customers with business van rental for deliveries, stock movement, equipment transport, events, and long-term use.",
    },
    {
      question: "Do you offer automatic vans?",
      answer:
        "Yes. Automatic van rental is available and is a convenient choice for drivers who prefer easier driving in London traffic.",
    },
    {
      question: "Which areas of London do you cover?",
      answer:
        "We serve customers across London, especially North West London areas including Brent Cross, Camden, Colindale, Cricklewood, Dollis Hill, Ealing, Edgware, Golders Green, Hampstead, Harrow, Hendon, Kilburn, Mill Hill, Neasden, Park Royal, Staples Corner, Wembley, West Hampstead, and Willesden Green.",
    },
    {
      question: "Can I book self-drive van hire online?",
      answer:
        "Yes. You can start your reservation online through our booking page or contact our team by phone for assistance.",
    },
    {
      question: "Is there a hidden fee?",
      answer:
        "No. We aim to provide clear pricing with van hire options that fit different budgets and no hidden fees.",
    },
    {
      question: "How do I contact Success Van Hire?",
      answer:
        "You can call Success Van Hire on +44 20 3011 1198 or visit us at Strata House, Waterloo Road, London, NW2 7UH.",
    },
  ];

  return (
    <FAQComponent
      title="Frequently Asked Questions"
      subtitle="Everything you need to know about self-drive van hire in London."
      faqs={faqs}
    />
  );
}

// ============================================================
// SECTION 13 — FINAL CTA
// ============================================================

function FinalCtaSection() {
  return (
    <section
      className="py-16 md:py-24 relative overflow-hidden"
      style={{ backgroundColor: "#0f172b" }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute top-0 right-0 w-112.5] h-112.5] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{
          backgroundColor: "#fe9a00",
          transform: "translate(30%, -30%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-87.5 h-87.5 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{
          backgroundColor: "#fe9a00",
          transform: "translate(-30%, 30%)",
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* CTA Block 1 */}
        <SectionLabel>Get Started</SectionLabel>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">
          Ready to Book Self-Drive Van Hire in London?
        </h2>
        <p
          className="text-lg mb-8 max-w-2xl mx-auto"
          style={{ color: "#ffffffcc" }}
        >
          Reserve your van today with Success Van Hire. Book online or call our
          friendly team for help choosing the right vehicle.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <OrangeBtn href="/reservation">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 17a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0zM3 5h11l1 6H4L3 5zm13 0h2l2 4v4h-4V5z"
              />
            </svg>
            Start Reservation
          </OrangeBtn>
          <OutlineBtn href="tel:+442030111198" tel>
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5a2 2 0 012-2h2.28a1 1 0 01.95.68l1.06 3.18a1 1 0 01-.23 1.04l-1.4 1.4a11.04 11.04 0 005.02 5.02l1.4-1.4a1 1 0 011.04-.23l3.18 1.06a1 1 0 01.68.95V19a2 2 0 01-2 2A17 17 0 013 5z"
              />
            </svg>
            Call +44 20 3011 1198
          </OutlineBtn>
        </div>

        {/* Divider */}
        <div className="border-t mb-16" style={{ borderColor: "#ffffff15" }} />

        {/* CTA Block 2 */}
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Need Help Choosing the Right Van?
        </h2>
        <p
          className="text-lg mb-8 max-w-2xl mx-auto"
          style={{ color: "#ffffffcc" }}
        >
          Tell us what you need to move, where you are going, and how long you
          need the van for. Our team can help you choose a suitable rental
          option.
        </p>
        <OrangeBtn href="/contact-us">Contact Us</OrangeBtn>

        {/* Contact Info Bar */}
        <div
          className="mt-12 pt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm border-t"
          style={{ borderColor: "#ffffff15", color: "#ffffff66" }}
        >
          <span className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5a2 2 0 012-2h2.28a1 1 0 01.95.68l1.06 3.18a1 1 0 01-.23 1.04l-1.4 1.4a11.04 11.04 0 005.02 5.02l1.4-1.4a1 1 0 011.04-.23l3.18 1.06a1 1 0 01.68.95V19a2 2 0 01-2 2A17 17 0 013 5z"
              />
            </svg>
            +44 20 3011 1198
          </span>
          <span className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Strata House, Waterloo Road, London, NW2 7UH
          </span>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// ROOT EXPORT — COMBINES ALL SECTIONS
// ============================================================

export function SelfDriveVanHireLondonContent() {
  return (
    <main>
      <HeroSection />
      <VanListingHome showHeader={true} gridCols={3} />

      <IntroSection />
      <WhyChooseUsSection />
      <UseCasesSection />

      <VanTypesSection />
      <LondonAreasSection />
      <InternalLinksSection />
      <BookingProcessSection />
      <FaqSection />
      <FinalCtaSection />
    </main>
  );
}
