// components/WhyChooseUs.tsx
"use client";

import { useRef, useEffect, useState, memo } from "react";
import Link from "next/link";

// ============ Inline SVG Icons (سبک و سریع) ============
const TruckIcon = memo(() => (
  <svg
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
));
TruckIcon.displayName = "TruckIcon";

const GlobeIcon = memo(() => (
  <svg
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
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
));
GlobeIcon.displayName = "GlobeIcon";

const ShieldIcon = memo(() => (
  <svg
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
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
));
ShieldIcon.displayName = "ShieldIcon";

const PoundIcon = memo(() => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M9.5 21c0-1.4.7-2.7 1.9-3.5H3v-2h10.4c.4-.8.6-1.6.6-2.5 0-.9-.2-1.7-.6-2.5H3V8.5h7.5c-.7-.8-1.2-1.8-1.5-2.9C8.7 3.7 10.1 2 12 2c2.2 0 4 1.8 4 4 0 .7-.2 1.4-.5 2H21v2h-5.6c.4.8.6 1.6.6 2.5 0 .9-.2 1.7-.6 2.5H21v2h-5.4c1.2.8 1.9 2.1 1.9 3.5h-8z" />
  </svg>
));
PoundIcon.displayName = "PoundIcon";

const LeafIcon = memo(() => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
  </svg>
));
LeafIcon.displayName = "LeafIcon";

const SupportIcon = memo(() => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M11 14h2v2h-2v-2zm10-9v14c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2l.01-14c0-1.1.88-2 1.99-2h1V2h2v2h8V2h2v2h1c1.1 0 2 .9 2 2zm-2 2H5v12h14V7zm-7 4c-1.65 0-3 1.35-3 3h2c0-.55.45-1 1-1s1 .45 1 1c0 1-1.5.875-1.5 2.5h2c0-1.125 1.5-1.25 1.5-2.5 0-1.65-1.35-3-3-3z" />
  </svg>
));
SupportIcon.displayName = "SupportIcon";

const CheckIcon = memo(() => (
  <svg
    width="18"
    height="18"
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
));
CheckIcon.displayName = "CheckIcon";

const ArrowRightIcon = memo(() => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
));
ArrowRightIcon.displayName = "ArrowRightIcon";

const PhoneIcon = memo(() => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
));
PhoneIcon.displayName = "PhoneIcon";

// ============ Icon Map ============
const ICON_MAP = {
  truck: TruckIcon,
  globe: GlobeIcon,
  shield: ShieldIcon,
  pound: PoundIcon,
  leaf: LeafIcon,
  support: SupportIcon,
} as const;

type IconKey = keyof typeof ICON_MAP;

// ============ Data ============
const whyChooseUsData: ReadonlyArray<{
  id: number;
  iconKey: IconKey;
  title: string;
  shortDesc: string;
  description: string;
}> = [
  {
    id: 1,
    iconKey: "truck",
    title: "Expert in Work",
    shortDesc: "Long & short-term rentals",
    description:
      "We are expert in long-term and short-term business van rental with a modern fleet of over 50 vehicles.",
  },
  {
    id: 2,
    iconKey: "globe",
    title: "Licences",
    shortDesc: "UK & EU accepted",
    description:
      "We do accept full UK and EU driving licences with a fast and simple verification process.",
  },
  {
    id: 3,
    iconKey: "shield",
    title: "Best Guarantee",
    shortDesc: "100% secure booking",
    description:
      "The rental reservation you make with us is 100% guaranteed with full insurance coverage.",
  },
  {
    id: 4,
    iconKey: "pound",
    title: "Our Prices",
    shortDesc: "Fit every budget",
    description:
      "The vans we offer have a wide range of prices, and we have vans that fit every budget. No hidden fees.",
  },
  {
    id: 5,
    iconKey: "leaf",
    title: "Clean Air Standard",
    shortDesc: "Eco-friendly fleet",
    description:
      "As part of our commitment to the environment, all our vans meet EU6 emission standards.",
  },
  {
    id: 6,
    iconKey: "support",
    title: "Easy Service Delivery",
    shortDesc: "Friendly & professional",
    description:
      "In addition to providing full business insurance to B2B clients, we provide very friendly and easy service.",
  },
];

// ============ Card Component ============
interface CardProps {
  item: (typeof whyChooseUsData)[number];
  index: number;
  isVisible: boolean;
}

const WhyChooseUsCard = memo(function WhyChooseUsCard({
  item,
  index,
  isVisible,
}: CardProps) {
  const Icon = ICON_MAP[item.iconKey];

  return (
    <article
      className={`wcu-card ${isVisible ? "wcu-card-visible" : ""}`}
      style={{
        // ✅ stagger delay با CSS variable
        transitionDelay: isVisible ? `${index * 80}ms` : "0ms",
      }}
    >
      <div className="wcu-card-inner">
        {/* Icon */}
        <div className="wcu-icon-wrapper">
          <div className="wcu-icon-bg mb-3">
            <span className="text-white">
              <Icon />
            </span>
          </div>
        </div>

        {/* Content */}
        <h3 className="text-xl lg:text-2xl font-black text-white mb-2">
          {item.title}
        </h3>
        <p className="text-amber-400 font-bold text-sm lg:text-base mb-4">
          {item.shortDesc}
        </p>

        <div className="wcu-divider" aria-hidden="true" />

        <p className="text-gray-300 text-sm lg:text-base leading-relaxed">
          {item.description}
        </p>
      </div>
    </article>
  );
});

// ============ Main Component ============
function WhyChooseUs() {
  const sectionRef = useRef<HTMLElement>(null);
  const [titleVisible, setTitleVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);

  // ✅ Single IntersectionObserver - بهینه‌تر از GSAP ScrollTrigger
  useEffect(() => {
    if (!sectionRef.current) return;

    // ✅ بررسی prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      setTitleVisible(true);
      setCardsVisible(true);
      setCtaVisible(true);
      return;
    }

    const section = sectionRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            const type = target.dataset.observe;

            if (type === "title") setTitleVisible(true);
            else if (type === "cards") setCardsVisible(true);
            else if (type === "cta") setCtaVisible(true);

            // ✅ بعد از مشاهده، observer رو حذف کن
            observer.unobserve(target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px",
      },
    );

    // ✅ همه المان‌های قابل مشاهده رو ثبت کن
    const targets = section.querySelectorAll("[data-observe]");
    targets.forEach((t) => observer.observe(t));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section
        ref={sectionRef}
        className="relative py-16 md:py-24 lg:py-32 overflow-hidden bg-[#0f172b]"
        aria-labelledby="why-choose-us-title"
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div
            data-observe="title"
            className={`text-center mb-12 lg:mb-20 wcu-fade-up ${
              titleVisible ? "wcu-fade-up-visible" : ""
            }`}
          >
            <h2
              id="why-choose-us-title"
              className="text-3xl md:text-6xl font-black text-white md:leading-tight"
            >
              Why Choose
              <span className="block mt-2">
                <span className="wcu-shimmer-text">Success Van Hire</span>
              </span>
            </h2>
            <p className="mt-2 text-sm sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Trusted by thousands of businesses and individuals across London
              for reliable, affordable, and hassle-free van rental.
            </p>
          </div>

          {/* Cards Grid */}
          <div
            data-observe="cards"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10"
          >
            {whyChooseUsData.map((item, index) => (
              <WhyChooseUsCard
                key={item.id}
                item={item}
                index={index}
                isVisible={cardsVisible}
              />
            ))}
          </div>

          {/* CTA */}
          <div
            data-observe="cta"
            className={`mt-20 lg:mt-28 text-center wcu-fade-up ${
              ctaVisible ? "wcu-fade-up-visible" : ""
            }`}
          >
            <div className="wcu-cta-box">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6">
                Ready to Hire Your Van?
              </h3>
              <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto">
                Get instant booking and the best rates in London
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link
                  href="/reservation"
                  className="wcu-cta-btn-primary"
                  prefetch={false}
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Book Now
                    <ArrowRightIcon />
                  </span>
                </Link>

                <a
                  href="tel:+442030111198"
                  className="wcu-cta-btn-secondary"
                  aria-label="Call us at +44 20 3011 1198"
                >
                  <PhoneIcon />
                  +44 20 3011 1198
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default memo(WhyChooseUs);
