// components/AboutUs.tsx
"use client";

import { useRef, useEffect, useState, memo, useMemo } from "react";
import Link from "next/link";

// ============ Inline SVG Icons ============
const TruckIcon = memo(function TruckIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
});

const CheckIcon = memo(function CheckIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
});

// ============ Data ============
const vanRanges = [
  {
    id: "small",
    title: "Small Vans",
    description: "Compact & efficient for light deliveries",
    features: ["Easy parking", "Low fuel costs", "Perfect for couriers"],
  },
  {
    id: "medium",
    title: "Medium Vans",
    description: "Versatile solution for most requirements",
    features: ["Ample cargo space", "Comfortable seating", "Best value"],
  },
  {
    id: "large",
    title: "Large Vans",
    description: "Heavy-duty for major relocations",
    features: [
      "Maximum load capacity",
      "Tail lift option",
      "Professional grade",
    ],
  },
  {
    id: "luton",
    title: "Luton Vans",
    description: "Premium choice for house moves",
    features: ["Largest capacity", "Tail lift included", "Climate controlled"],
  },
] as const;

// ============ Van Range Card ============
const VanRangeCard = memo(function VanRangeCard({
  range,
  index,
  isVisible,
}: {
  range: (typeof vanRanges)[number];
  index: number;
  isVisible: boolean;
}) {
  return (
    <article
      role="listitem"
      className={`about-card ${isVisible ? "about-card-visible" : ""}`}
      style={{ transitionDelay: isVisible ? `${index * 80}ms` : "0ms" }}
    >
      <div className="about-card-inner">
        <TruckIcon className="md:text-4xl text-2xl text-[#fe9a00] mb-4 w-8 h-8 md:w-10 md:h-10" />
        <h3 className="md:text-xl text-base font-black text-white mb-2">
          {range.title}
        </h3>
        <p className="text-gray-400 text-[10px] md:text-sm mb-4">
          {range.description}
        </p>
        <ul
          className="md:space-y-2 space-y-1"
          aria-label={`${range.title} features`}
        >
          {range.features.map((feature, idx) => (
            <li
              key={idx}
              className="flex items-center md:gap-2 gap-1 text-[10px] md:text-xs text-gray-300"
            >
              <CheckIcon className="text-[#fe9a00] shrink-0 w-3 h-3" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
});

// ============ Main Component ============
function AboutUs() {
  const sectionRef = useRef<HTMLElement>(null);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [companyVisible, setCompanyVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);

  // ✅ Single IntersectionObserver - بهینه‌تر از GSAP
  useEffect(() => {
    if (!sectionRef.current) return;

    // ✅ Respect user preferences
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      setHeaderVisible(true);
      setCompanyVisible(true);
      setCardsVisible(true);
      setCtaVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            const type = target.dataset.observe;

            if (type === "header") setHeaderVisible(true);
            else if (type === "company") setCompanyVisible(true);
            else if (type === "cards") setCardsVisible(true);
            else if (type === "cta") setCtaVisible(true);

            observer.unobserve(target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px",
      },
    );

    const targets = sectionRef.current.querySelectorAll("[data-observe]");
    targets.forEach((t) => observer.observe(t));

    return () => observer.disconnect();
  }, []);

  // ✅ JSON-LD برای SEO (About Page)
  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "AboutPage",
      mainEntity: {
        "@type": "LocalBusiness",
        "@id": "https://successvanhire.co.uk/#organization",
        name: "Success Van Hire",
        description:
          "London's trusted van rental specialist with over 15 years of experience. Reliable, affordable van rentals with a modern fleet of 50+ vehicles.",
        foundingDate: "2009",
        areaServed: {
          "@type": "City",
          name: "London",
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Van Rental Fleet",
          itemListElement: vanRanges.map((range, i) => ({
            "@type": "Offer",
            position: i + 1,
            itemOffered: {
              "@type": "Product",
              name: range.title,
              description: range.description,
            },
          })),
        },
      },
    }),
    [],
  );

  return (
    <>
     

      <section
        ref={sectionRef}
        className="relative w-full bg-[#0f172b] overflow-hidden"
        aria-labelledby="about-us-title"
      >
        {/* Background */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#fe9a00]/20 rounded-full blur-3xl animate-about-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#fe9a00]/20 rounded-full blur-3xl animate-about-pulse-slower" />
        </div>

        <div className="relative z-10">
          {/* Hero Section */}
          <div className="md:pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <header
                data-observe="header"
                className={`about-fade-up text-center mb-16 ${
                  headerVisible ? "about-fade-up-visible" : ""
                }`}
              >
                {/* ✅ h2 بجای h1 - چون h1 در صفحه دیگری است */}
                <h2
                  id="about-us-title"
                  className="text-3xl lg:text-7xl font-black text-white mb-6 leading-tight"
                >
                  What Do You Know
                  <br />
                  <span className="text-[#fe9a00]">About Us?</span>
                </h2>

                <div className="max-w-4xl mx-auto space-y-6">
                  <p className="text-gray-300 text-sm sm:text-2xl leading-relaxed">
                    <span className="text-[#fe9a00] font-bold">
                      London&apos;s trusted van rental specialist
                    </span>{" "}
                    for over 15 years
                  </p>

                  <p className="text-gray-200 text-sm sm:text-2xl leading-relaxed">
                    We provide{" "}
                    <span className="text-white font-semibold">
                      reliable, affordable van rentals
                    </span>{" "}
                    with a modern fleet of{" "}
                    <span className="text-[#fe9a00] font-bold">
                      50+ vehicles
                    </span>
                    , all maintained to the highest standards.
                  </p>

                  <p className="text-gray-200 text-sm sm:text-2xl leading-relaxed">
                    From small deliveries to house moves, we offer{" "}
                    <span className="text-white font-semibold">
                      flexible solutions
                    </span>{" "}
                    with transparent pricing and exceptional customer service.
                  </p>

                  <div className="pt-6">
                    <div className="about-highlight-box">
                      <p className="text-white text-sm sm:text-2xl font-bold leading-relaxed">
                        Self-drive with{" "}
                        <span className="text-[#fe9a00]">
                          complete peace of mind
                        </span>
                        . All vans fully insured and EU6 compliant.
                      </p>
                    </div>
                  </div>
                </div>
              </header>
            </div>
          </div>

          {/* Our Company Section */}
          <div className="md:py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div
                data-observe="company"
                className={`about-fade-up text-center md:mb-16 mb-8 ${
                  companyVisible ? "about-fade-up-visible" : ""
                }`}
              >
                <h2 className="text-2xl lg:text-7xl font-black text-white mb-4">
                  Our Company
                </h2>
                <p className="text-gray-400 text-base md:text-lg max-w-3xl mx-auto">
                  Comprehensive van rental solutions for all your needs
                </p>
              </div>

              {/* Van Ranges Grid */}
              <div
                data-observe="cards"
                className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
                role="list"
                aria-label="Van categories"
              >
                {vanRanges.map((range, index) => (
                  <VanRangeCard
                    key={range.id}
                    range={range}
                    index={index}
                    isVisible={cardsVisible}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="md:pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div
                data-observe="cta"
                className={`about-fade-up ${
                  ctaVisible ? "about-fade-up-visible" : ""
                }`}
              >
                <h3 className="text-xl sm:text-3xl font-black text-white mb-4">
                  Ready to Rent Your Van?
                </h3>
                <p className="text-gray-300 text-sm mb-8 max-w-2xl mx-auto">
                  Experience the Success Van Hire difference today
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/reservation"
                    prefetch={false}
                    className="about-cta-btn"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default memo(AboutUs);
