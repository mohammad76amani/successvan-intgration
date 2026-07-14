// components/HeroSection.tsx
"use client";

import {
  useRef,
  useLayoutEffect,
  useState,
  useEffect,
  memo,
  useCallback,
} from "react";
import Image from "next/image";
import Link from "next/link";

let gsap: any;
let ScrollTrigger: any;

// ✅ Inline SVG icons - بجای react-icons (حذف bundle اضافی)
const ArrowRightIcon = memo(function ArrowRightIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
});

const ArrowLeftIcon = memo(function ArrowLeftIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
});

const GearIcon = memo(function GearIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 01-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 01.872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 012.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 012.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 01.872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 01-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 01-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 100-5.86 2.929 2.929 0 000 5.858z" />
    </svg>
  );
});

const SeatIcon = memo(function SeatIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V7H1v10h22v-6c0-2.21-1.79-4-4-4z" />
    </svg>
  );
});

const DoorIcon = memo(function DoorIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M1 1v14h3v-2h2v2h8V1H1zm2 10H2V4h1v7zm3 0H4V4h2v7zm6 0H8V4h4v7z" />
      <circle cx="11" cy="8" r="1" />
    </svg>
  );
});

const FuelIcon = memo(function FuelIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3 2.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5v5a.5.5 0 01-.5.5h-5a.5.5 0 01-.5-.5v-5z" />
      <path d="M1 2a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 012 2v.5a.5.5 0 001 0V8h-.5a.5.5 0 01-.5-.5V4.375a.5.5 0 01.5-.5h1.5V5H14v.5a.5.5 0 01-.5.5H13v4.5a1.5 1.5 0 01-3 0V12a1 1 0 00-1-1H3a2 2 0 01-2-2V2zm2-1a1 1 0 00-1 1v7a1 1 0 001 1h6a1 1 0 001-1V2a1 1 0 00-1-1H3z" />
    </svg>
  );
});

// ✅ Feature icon mapping - بدون dynamic import
const ICON_MAP = {
  gear: GearIcon,
  seat: SeatIcon,
  door: DoorIcon,
  fuel: FuelIcon,
} as const;

// ✅ Data با icon key بجای component reference
const vansData = [
  {
    id: 1,
    name: "Luton With Tail-Lift",
    tagline: "Ford Transit High Roof With TAIL-LIFT or Similar",
    description:
      "Luton van with tail lift ideal for moving heavy or bulky items. Spacious cargo area, hydraulic lift for easy loading, flexible hire options, well-maintained vehicles, and affordable rates for home moves, deliveries, or business transport in London.",
    image: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/louton.png",
    price: "£115",
    features: [
      { iconKey: "gear" as const, label: "Gear : Manual & Automatic" },
      { iconKey: "seat" as const, label: "Seat : 2" },
      { iconKey: "door" as const, label: "Door : 4" },
      { iconKey: "fuel" as const, label: "Fuel : Diesel" },
    ],
    color: "#fe9a00",
    gradient: "from-amber-500 to-[#fe9a00]",
  },
  {
    id: 2,
    name: "14 Seater Minibus",
    tagline: "Ford Transit or Similar",
    description:
      "Comfortable 14-seater minibus perfect for group travel, events, tours, or corporate transport. Spacious interior, modern safety features, flexible rental periods, competitive pricing, and reliable performance for both short and long journeys across London.",
    image:
      "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/14seater.png",
    price: "£175",
    features: [
      { iconKey: "gear" as const, label: "Gear : Manual & Automatic" },
      { iconKey: "seat" as const, label: "Seat : 14" },
      { iconKey: "door" as const, label: "Door : 4" },
      { iconKey: "fuel" as const, label: "Fuel : Diesel" },
    ],
    color: "#ff8800",
    gradient: "from-amber-500 to-[#fe9a00]",
  },
  {
    id: 3,
    name: "Short Wheel Base",
    tagline: "Ford Transit Custom or Similar",
    description:
      "Compact and fuel-efficient short wheelbase van designed for city driving. Easy to maneuver and park, yet spacious enough for deliveries or small moves. Ideal for businesses or individuals needing a reliable, cost-effective transport solution.",
    image:
      "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/shortee.png",
    price: "£60",
    features: [
      { iconKey: "gear" as const, label: "Gear : Manual & Automatic" },
      { iconKey: "seat" as const, label: "Seat : 3" },
      { iconKey: "door" as const, label: "Door : 4" },
      { iconKey: "fuel" as const, label: "Fuel : Diesel" },
    ],
    color: "#ffa500",
    gradient: "from-amber-500 to-[#fe9a00]",
  },
] as const;

// ✅ Preload images array
const VAN_IMAGES = vansData.map((v) => v.image);

// ✅ Feature Card - memo شده
const FeatureCard = memo(function FeatureCard({
  iconKey,
  label,
  color,
}: {
  iconKey: keyof typeof ICON_MAP;
  label: string;
  color: string;
}) {
  const Icon = ICON_MAP[iconKey];
  return (
    <div className="group relative overflow-hidden">
      <div className="flex items-center gap-2.5 p-2.5 lg:p-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:border-amber-500/40 transition-colors duration-300 relative z-10">
        <div
          className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0 group-hover:scale-110 transition-transform duration-300"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            boxShadow: `0 4px 15px ${color}40`,
          }}
        >
          <Icon />
        </div>
        <span className="text-white font-semibold text-xs">{label}</span>
      </div>
    </div>
  );
});

// ✅ Price & CTA - استخراج شده برای جلوگیری از تکرار
const PriceCTA = memo(function PriceCTA({
  price,
  color,
  gradient,
  compact = false,
}: {
  price: string;
  color: string;
  gradient: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2 ${
        compact ? "sm:hidden" : "hidden sm:flex"
      }`}
    >
      <div className="relative">
        <div
          className={`text-gray-500 ${compact ? "text-[10px]" : "text-xs"} font-semibold mb-1 tracking-wide uppercase`}
        >
          Starting from
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl lg:text-5xl font-black text-white">
            {price}
          </span>
          <span
            className={`${compact ? "text-xs" : "text-lg"} text-gray-400 font-semibold`}
          >
            /day
          </span>
        </div>
        <div
          className="absolute -inset-2 opacity-20 blur-2xl -z-10"
          style={{
            background: `radial-gradient(circle, ${color}60, transparent)`,
          }}
          aria-hidden="true"
        />
      </div>

      <div className="sm:ml-auto w-full sm:w-auto">
        <Link href="/reservation" prefetch={false}>
          <button
            title="Book Now"
            className={`group relative w-full sm:w-auto px-6 py-3 bg-linear-to-r ${gradient} text-white font-bold text-base lg:text-lg rounded-xl overflow-hidden transition-transform duration-300 hover:scale-105 active:scale-95`}
            style={{ boxShadow: `0 10px 40px ${color}50` }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Book Now
              <ArrowRightIcon className="text-xl group-hover:translate-x-1 transition-transform duration-300" />
            </span>
            <span
              className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
              aria-hidden="true"
            />
          </button>
        </Link>
      </div>
    </div>
  );
});

// ✅ Speed Particles - memo
const SpeedParticles = memo(function SpeedParticles({
  color,
  particlesRef,
}: {
  color: string;
  particlesRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={particlesRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: color,
            top: `${20 + i * 8}%`,
            right: "10%",
            opacity: 0.6,
            boxShadow: `0 0 10px ${color}`,
          }}
        />
      ))}
    </div>
  );
});

// ============ Main Component ============
function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [gsapReady, setGsapReady] = useState(false);
  const isAnimatingRef = useRef(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef = useRef(0);
  const touchEndRef = useRef(0);

  const vanImageRef = useRef<HTMLDivElement>(null);
  const vanContentRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const roadLinesRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  const currentVan = vansData[currentIndex];

  // ✅ Lazy load GSAP after initial render
  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(async () => {
      const [gsapModule, stModule] = await Promise.all([
        import("gsap"),
        import("gsap/dist/ScrollTrigger"),
      ]);
      gsap = gsapModule.default || gsapModule.gsap;
      ScrollTrigger = stModule.default || stModule.ScrollTrigger;
      if (ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
      }
      if (mounted) setGsapReady(true);
    }, 1000);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  // ✅ Preload other van images after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      VAN_IMAGES.forEach((src, i) => {
        if (i === 0) return; // first already loaded with priority
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.as = "image";
        link.href = src;
        document.head.appendChild(link);
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const animateVanEntrance = useCallback((isInitial = false) => {
    if (!gsap) return;
    setProgress(0);

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      onStart: () => {
        isAnimatingRef.current = true;
      },
      onComplete: () => {
        isAnimatingRef.current = false;
      },
    });

    if (vanImageRef.current) {
      gsap.set(vanImageRef.current, {
        x: 1400,
        opacity: 0,
        rotation: 3,
        scale: 0.9,
      });
      gsap.to("h2", {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        delay: 0.3,
      });

      tl.to(
        vanImageRef.current,
        {
          x: 0,
          opacity: 1,
          rotation: 0,
          scale: 1,
          duration: 0.8,
          ease: "power3.out",
        },
        0,
      );
    }

    if (glowRef.current) {
      tl.fromTo(
        glowRef.current,
        { opacity: 0, scale: 0.4 },
        { opacity: 0.7, scale: 1, duration: 0.6, ease: "power2.out" },
        "-=0.5",
      );
    }

    if (shadowRef.current) {
      tl.fromTo(
        shadowRef.current,
        { opacity: 0, scaleX: 0.6 },
        { opacity: 0.5, scaleX: 1, duration: 0.6, ease: "power2.out" },
        "-=0.6",
      );
    }

    if (roadLinesRef.current) {
      tl.fromTo(
        roadLinesRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
        "-=0.5",
      );
    }

    if (particlesRef.current) {
      tl.fromTo(
        particlesRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
        "-=0.4",
      );
    }

    if (vanContentRef.current) {
      tl.fromTo(
        vanContentRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.15, ease: "power2.out" },
        "-=0.3",
      );
    }
  }, []);

  const updateVanData = useCallback((index: number) => {
    if (glowRef.current) {
      glowRef.current.style.background = `radial-gradient(circle at center, ${vansData[index].color}70 0%, ${vansData[index].color}40 40%, transparent 70%)`;
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    stopAutoPlay();
    autoPlayRef.current = setInterval(() => {
      changeVan("next");
    }, 4000);
  }, []);

  const stopAutoPlay = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  }, []);

  const changeVan = useCallback(
    (direction: "next" | "prev") => {
      if (isAnimatingRef.current || !gsap) return;

      stopAutoPlay();

      const newIndex =
        direction === "next"
          ? (currentIndex + 1) % vansData.length
          : (currentIndex - 1 + vansData.length) % vansData.length;

      const exitTl = gsap.timeline({
        onComplete: () => {
          setCurrentIndex(newIndex);
          updateVanData(newIndex);
          animateVanEntrance();
          startAutoPlay();
        },
      });

      if (vanImageRef.current) {
        exitTl.to(vanImageRef.current, {
          x: -1400,
          opacity: 0,
          rotation: -3,
          scale: 0.9,
          duration: 0.6,
          ease: "power3.in",
        });
      }

      if (vanContentRef.current) {
        exitTl.to(
          vanContentRef.current,
          { opacity: 0, duration: 0.15, ease: "power2.in" },
          "-=0.3",
        );
      }

      if (glowRef.current && shadowRef.current && roadLinesRef.current) {
        exitTl.to(
          [
            glowRef.current,
            shadowRef.current,
            roadLinesRef.current,
            particlesRef.current,
          ].filter(Boolean),
          { opacity: 0, duration: 0.3, ease: "power2.in" },
          "-=0.4",
        );
      }
    },
    [
      currentIndex,
      stopAutoPlay,
      updateVanData,
      animateVanEntrance,
      startAutoPlay,
    ],
  );

  // ✅ GSAP animations - فقط بعد از لود GSAP
  useLayoutEffect(() => {
    if (!gsapReady || !gsap) return;

    const ctx = gsap.context(() => {
      gsap.from(".hero-background", {
        scale: 1.1,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
      });

      animateVanEntrance(true);

      ScrollTrigger.create({
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self: any) => {
          gsap.to(".hero-background", {
            y: self.progress * 150,
            ease: "none",
          });
        },
      });

      // Shadow breathing
      if (shadowRef.current) {
        const shadowTl = gsap.timeline({ repeat: -1, ease: "none" });
        shadowTl
          .to(shadowRef.current, {
            scaleX: 0.92,
            opacity: 0.3,
            duration: 1.5,
            ease: "sine.inOut",
          })
          .to(shadowRef.current, {
            scaleX: 1,
            opacity: 0.5,
            duration: 1.5,
            ease: "sine.inOut",
          })
          .to(shadowRef.current, {
            scaleX: 0.96,
            opacity: 0.4,
            duration: 1.2,
            ease: "sine.inOut",
          });
      }

      // Road lines
      if (roadLinesRef.current?.children) {
        gsap.to(roadLinesRef.current.children, {
          x: -100,
          repeat: -1,
          duration: 3,
          ease: "none",
          stagger: 0.05,
        });
      }

      // Glow pulse
      if (glowRef.current) {
        gsap.to(glowRef.current, {
          scale: 1.08,
          opacity: 0.75,
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      // Particles
      if (particlesRef.current) {
        Array.from(particlesRef.current.children).forEach((particle, i) => {
          gsap.to(particle, {
            x: -200 - Math.random() * 100,
            opacity: 0,
            duration: 0.8 + Math.random() * 0.8,
            repeat: -1,
            delay: i * 0.08,
            ease: "power1.out",
          });
        });
      }
    }, heroRef);

    startAutoPlay();

    return () => {
      ctx.revert();
      stopAutoPlay();
    };
  }, [gsapReady]);

  // ✅ Progress bar timer
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 100 / 40;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [currentIndex]);

  // ✅ Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.changedTouches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      touchEndRef.current = e.changedTouches[0].clientX;
      const distance = touchStartRef.current - touchEndRef.current;
      if (distance > 50) changeVan("next");
      else if (distance < -50) changeVan("prev");
    },
    [changeVan],
  );

  const handleNext = useCallback(() => changeVan("next"), [changeVan]);
  const handlePrev = useCallback(() => changeVan("prev"), [changeVan]);

  return (
    <>
      <section
        ref={heroRef}
        className="relative min-h-screen w-full bg-[#0f172b] overflow-hidden"
        onMouseEnter={stopAutoPlay}
        onMouseLeave={startAutoPlay}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label="Most popular vans for hire"
        role="region"
      >
        {/* Section Title */}
        <div
          className="absolute -top-20 md:top-4 left-0 right-0 z-20 pointer-events-none mb-20"
          aria-hidden="true"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
            <h2 className="text-center font-black tracking-tight text-white opacity-0 translate-y-8">
              <span className="block text-3xl md:text-5xl">
                Most Popular Vans
              </span>
              <span className="block text-xl md:text-3xl mt-1 sm:mt-2">
                in{" "}
                <span className="inline-block bg-linear-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                  Success Van Hire
                </span>
              </span>
            </h2>
          </div>
        </div>

        {/* Background - GPU composited */}
        <div
          className="hero-background overflow-hidden absolute inset-0 opacity-30"
          aria-hidden="true"
        >
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-3xl animate-hero-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-orange-500/15 rounded-full blur-3xl animate-hero-pulse-slower" />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent" />
        </div>

        {/* Main Content */}
        <div className="relative h-screen overflow-hidden flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
              {/* LEFT - Text Content */}
              <div className="lg:col-span-6 order-2 lg:order-1 z-10">
                <div ref={vanContentRef} className="space-y-2 md:space-y-4">
                  {/* Van Name */}
                  <div>
                    <h2 className="text-2xl lg:text-4xl font-black text-white leading-tight tracking-tight">
                      {currentVan.name}
                    </h2>
                    <div
                      className="h-1.5 w-20 hidden md:block rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${currentVan.color}, transparent)`,
                        boxShadow: `0 0 15px ${currentVan.color}60`,
                      }}
                      aria-hidden="true"
                    />
                  </div>

                  {/* Tagline */}
                  <p
                    className="text-base lg:text-lg font-bold"
                    style={{ color: currentVan.color }}
                  >
                    {currentVan.tagline}
                  </p>

                  {/* Description */}
                  <p className="text-gray-400 text-xs lg:text-sm leading-relaxed max-w-xl">
                    {currentVan.description}
                  </p>

                  {/* Mobile Price/CTA */}
                  <PriceCTA
                    price={currentVan.price}
                    color={currentVan.color}
                    gradient={currentVan.gradient}
                    compact
                  />

                  {/* Features Grid */}
                  <div
                    className="grid grid-cols-2 gap-2.5 pt-2 pb-16 md:pb-0"
                    role="list"
                    aria-label="Van features"
                  >
                    {currentVan.features.map((feature, index) => (
                      <div key={`${currentVan.id}-${index}`} role="listitem">
                        <FeatureCard
                          iconKey={feature.iconKey}
                          label={feature.label}
                          color={currentVan.color}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Desktop Price/CTA */}
                  <PriceCTA
                    price={currentVan.price}
                    color={currentVan.color}
                    gradient={currentVan.gradient}
                  />
                </div>
              </div>

              {/* RIGHT - Van Image */}
              <div className="lg:col-span-6 order-1 lg:order-2 relative">
                <div className="relative" style={{ perspective: "1000px" }}>
                  {/* Glow */}
                  <div
                    ref={glowRef}
                    className="absolute inset-0 top-15 -z-10 blur-xl transition-colors duration-700"
                    style={{
                      background: `radial-gradient(circle at center, ${currentVan.color}70 0%, ${currentVan.color}40 40%, transparent 70%)`,
                    }}
                    aria-hidden="true"
                  />

                  {/* Particles */}
                  <SpeedParticles
                    color={currentVan.color}
                    particlesRef={particlesRef}
                  />

                  {/* Van Container */}
                  <div
                    ref={vanImageRef}
                    className="relative transform-gpu"
                    style={{ transformOrigin: "center center" }}
                  >
                    <div className="relative w-[85%] sm:w-[80%] mx-auto aspect-square">
                      {/* ✅ فقط تصویر فعلی + priority فقط برای اولی */}
                      <Image
                        src={currentVan.image}
                        alt={`${currentVan.name} - ${currentVan.tagline}`}
                        fill
                        sizes="(max-width: 768px) 85vw, (max-width: 1200px) 40vw, 500px"
                        className="object-contain drop-shadow-2xl"
                        priority={currentIndex === 0}
                        loading={currentIndex === 0 ? "eager" : "lazy"}
                        quality={75}
                      />
                    </div>
                  </div>

                  {/* Shadow */}
                  <div
                    ref={shadowRef}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-6 rounded-full blur-xl -z-20 opacity-50"
                    style={{
                      background: `radial-gradient(ellipse, ${currentVan.color}40, transparent 70%)`,
                    }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav aria-label="Van carousel navigation" className="contents">
          <button
            onClick={handlePrev}
            className="absolute left-3 sm:left-6 lg:left-8 top-[20%] md:top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full text-white transition-transform duration-300 hover:scale-110 active:scale-95 shadow-xl cursor-pointer"
            aria-label="Previous van"
            type="button"
          >
            <ArrowLeftIcon className="text-lg sm:text-xl lg:text-2xl" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-3 sm:right-6 lg:right-8 top-[20%] md:top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full text-white transition-transform duration-300 hover:scale-110 active:scale-95 shadow-xl cursor-pointer"
            aria-label="Next van"
            type="button"
          >
            <ArrowRightIcon className="text-lg sm:text-xl lg:text-2xl" />
          </button>
        </nav>

        {/* ✅ Carousel indicators for accessibility */}
        {/* <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2"
          role="tablist"
          aria-label="Van slides"
        >
          {vansData.map((van, i) => (
            <button
              key={van.id}
              role="tab"
              aria-selected={i === currentIndex}
              aria-label={`View ${van.name}`}
              className={`h-12 rounded-full transition-all duration-300 flex items-center justify-center ${
                i === currentIndex
                  ? "w-12 bg-[#fe9a00]"
                  : "w-12 bg-white/30 hover:bg-white/50"
              }`}
              onClick={() => {
                if (i !== currentIndex && !isAnimatingRef.current) {
                  stopAutoPlay();
                  const direction = i > currentIndex ? "next" : "prev";
                  // Direct index change
                  const exitTl = gsap?.timeline({
                    onComplete: () => {
                      setCurrentIndex(i);
                      updateVanData(i);
                      animateVanEntrance();
                      startAutoPlay();
                    },
                  });
                  if (exitTl && vanImageRef.current) {
                    exitTl.to(vanImageRef.current, {
                      x: direction === "next" ? -1400 : 1400,
                      opacity: 0,
                      rotation: direction === "next" ? -3 : 3,
                      scale: 0.9,
                      duration: 0.6,
                      ease: "power3.in",
                    });
                    if (vanContentRef.current) {
                      exitTl.to(
                        vanContentRef.current,
                        { opacity: 0, duration: 0.15, ease: "power2.in" },
                        "-=0.3",
                      );
                    }
                    if (glowRef.current) {
                      exitTl.to(
                        [
                          glowRef.current,
                          shadowRef.current,
                          roadLinesRef.current,
                          particlesRef.current,
                        ].filter(Boolean),
                        { opacity: 0, duration: 0.3, ease: "power2.in" },
                        "-=0.4",
                      );
                    }
                  }
                }
              }}
              type="button"
            />
          ))}
        </div> */}
      </section>
    </>
  );
}

export default memo(HeroSection);
