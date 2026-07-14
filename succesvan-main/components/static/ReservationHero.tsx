// components/ReservationHero.tsx
"use client";

import { useRef, useEffect, useState, memo, Suspense } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

// ✅ Lazy load فرم - چون زیر fold نیست ولی سنگینه
const ReservationForm = dynamic(
  () => import("@/components/global/ReservationForm"),
  {
    loading: () => <FormSkeleton />,
    ssr: true,
  },
);

// ✅ اسکلتون فرم برای CLS بهتر
function FormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-hidden="true">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-12 bg-white/5 rounded-xl" />
      ))}
      <div className="h-12 bg-[#fe9a00]/20 rounded-xl" />
    </div>
  );
}

// ✅ کامپوننت ویدیو جدا شده و memo شده
const BackgroundVideo = memo(function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = setTimeout(() => setShowVideo(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showVideo && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked - OK
      });
    }
  }, [showVideo]);

  if (!showVideo) return null;

  return (
    <video
      ref={videoRef}
      muted
      loop
      playsInline
      preload="none"
      className="absolute inset-0 w-full h-full object-cover will-change-auto"
      aria-hidden="true"
    >
      <source
        src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/videos/videoHero.mp4"
        type="video/mp4"
      />
    </video>
  );
});

// ✅ آیکون تقویم - inline SVG بدون import اضافی
const CalendarIcon = memo(function CalendarIcon({
  size = 20,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-white"
      aria-hidden="true"
    >
      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
});

// ✅ فرم هدر - استخراج شده برای عدم تکرار
const FormHeader = memo(function FormHeader({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 ${
        compact ? "mb-5 pb-4" : "mb-6 pb-5"
      } border-b border-white/10`}
    >
      <div
        className={`${
          compact ? "w-9 h-9 rounded-lg" : "w-10 h-10 rounded-xl"
        } bg-linear-to-br from-[#fe9a00] to-[#ff7b00] flex items-center justify-center shadow-lg shadow-[#fe9a00]/20 shrink-0`}
      >
        <CalendarIcon size={compact ? 16 : 20} />
      </div>
      <div>
        <h3
          className={`text-white font-semibold ${
            compact ? "text-base" : "text-lg"
          }`}
        >
          Book Your Van in London
        </h3>
        <p className={`text-gray-400 ${compact ? "text-[10px]" : "text-xs"}`}>
          Quick &amp; easy van hire reservation
        </p>
      </div>
    </div>
  );
});

// ============ کامپوننت اصلی ============
function ReservationHero({ onBookNow }: { onBookNow?: () => void }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    // ✅ تشخیص موبایل فقط یکبار - جلوگیری از رندر دوبل فرم
    const mql = window.matchMedia("(min-width: 768px)");
    setIsMobile(!mql.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(!e.matches);
    mql.addEventListener("change", handler);

    // ✅ تاخیر حداقلی برای انیمیشن - بدون setTimeout طولانی
    requestAnimationFrame(() => setIsLoaded(true));

    return () => mql.removeEventListener("change", handler);
  }, []);

  const scrollToVans = () => {
    document.getElementById("available-vans")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <>
      <section
        aria-label="Van hire reservation"
        className="relative w-full min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* ✅ Background: poster اول، ویدیو بعداً */}
        <div className="absolute inset-0 z-0" aria-hidden="true">
          {/* ✅ Poster با next/image - LCP بهینه */}
          <Image
            src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/poster.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
            quality={75}
            placeholder="blur"
            blurDataURL="data:image/webp;base64,UklGRkQAAABXRUJQVlA4IDgAAAAwAQCdASoQAAwAAUAmJaQAA3AA/v3AgAA="
            aria-hidden="true"
          />

          {/* ✅ ویدیو فقط بعد از لود صفحه */}
          <BackgroundVideo />

          {/* ✅ Overlay ها - ساده‌تر شده (3 لایه → 2 لایه) */}
          <div className="absolute inset-0 bg-linear-to-br from-black/70 via-black/40 to-black/60" />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/30" />
        </div>

        {/* Main Content */}
        <div
          className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full
            mt-20 lg:mt-0 pb-8 sm:pb-12 lg:pb-0
            transition-opacity duration-300 ease-out
            ${isLoaded ? "opacity-100" : "opacity-0"}`}
        >
          {/* ✅ شرطی رندر کردن بر اساس سایز صفحه - فقط یک فرم رندر شود */}
          {isMobile === null ? (
            <div className="grid min-h-160 place-items-center">
              <FormSkeleton />
            </div>
          ) : isMobile ? (
            <MobileLayout isLoaded={isLoaded} onBookNow={onBookNow} />
          ) : (
            <DesktopLayout isLoaded={isLoaded} onBookNow={onBookNow} />
          )}
        </div>

        <button
          type="button"
          title="Explore vans"
          onClick={() =>
            document.getElementById("available-vans")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
          className="absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/80 transition-opacity hover:text-white md:flex"
          aria-label="Scroll to available vans"
        >
          <span className="text-xs font-medium tracking-wide">
            Explore vans
          </span>
          <span className="flex h-10 w-6 items-start justify-center rounded-full border border-white/30 p-1">
            <span className="h-2 w-1 rounded-full bg-white/80 animate-bounce" />
          </span>
        </button>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-black/60 to-transparent z-3"
          aria-hidden="true"
        />
      </section>
    </>
  );
}

// ============ Desktop Layout ============
const DesktopLayout = memo(function DesktopLayout({
  isLoaded,
  onBookNow,
}: {
  isLoaded: boolean;
  onBookNow?: () => void;
}) {
  const scrollToVans = () => {
    document.getElementById("available-vans")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };
  return (
    <div className="hidden md:grid grid-cols-2 gap-8 lg:gap-16 items-center">
      {/* Left: Text Content */}
      <div className="text-white space-y-5 lg:space-y-7">
        <h1
          className={`text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight
    transition-opacity duration-300 delay-100
    ${isLoaded ? "opacity-100" : "opacity-0"}`}
        >
          <span className="block mt-1">
            Success Van{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#fe9a00] via-[#ffb940] to-[#fe9a00]">
              Hire
            </span>
          </span>
        </h1>

        <h2
          className={`text-xl md:text-2xl font-semibold transition-opacity duration-300 delay-150
    ${isLoaded ? "opacity-100" : "opacity-0"}`}
        >
          <span className="text-transparent bg-clip-text bg-linear-to-r from-[#fe9a00] to-[#ffcc66] tracking-widest">
            van Hire London
          </span>
        </h2>

        <p
          className={`text-sm md:text-base lg:text-lg text-gray-300/90 leading-relaxed max-w-lg
    transition-opacity duration-300 delay-200
    ${isLoaded ? "opacity-100" : "opacity-0"}`}
        >
          Affordable self-drive van hire in London for house moves, deliveries,
          student moves and business use. Choose your van, check availability
          and reserve online in less than 60 seconds with clear pricing and no
          hidden fees.
        </p>
        <div
          className={`flex flex-wrap gap-3 pt-2 transition-opacity duration-300 delay-300
    ${isLoaded ? "opacity-100" : "opacity-0"}`}
        >
          {["50+ Vehicles", "No Hidden Fees", "Fast Online Booking"].map(
            (item) => (
              <span
                title={
                  item === "50+ Vehicles"
                    ? "50+ different van models"
                    : item === "No Hidden Fees"
                      ? "Transparent pricing"
                      : "Fast and easy booking process"
                }
                key={item}
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-md"
              >
                {item}
              </span>
            ),
          )}
        </div>
        <div
          className={`flex flex-col sm:flex-row gap-3 pt-3 transition-opacity duration-300 delay-300
    ${isLoaded ? "opacity-100" : "opacity-0"}`}
        >
          <button
            type="button"
            aria-label="Book now"
            title="Book Your van"
            onClick={scrollToVans}
            className="rounded-xl bg-[#fe9a00] px-6 py-3 text-sm font-bold text-black transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            See Available Vans
          </button>
        </div>
      </div>

      {/* Right: Form */}
      <div
        className={`mt-16 transition-opacity duration-300 delay-300
          ${isLoaded ? "opacity-100" : "opacity-0"}`}
      >
        <div className="relative">
          <div className="glass-form backdrop-blur-lg rounded-3xl p-7 lg:p-9">
            <FormHeader />
            <Suspense fallback={<FormSkeleton />}>
              <ReservationForm isInline={false} onBookNow={onBookNow} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
});

// ============ Mobile Layout ============
const MobileLayout = memo(function MobileLayout({
  isLoaded,
  onBookNow,
}: {
  isLoaded: boolean;
  onBookNow?: () => void;
}) {
  return (
    <div className="md:hidden space-y-6 sm:space-y-8">
      <header className="text-white text-center">
        <h1
          className={`text-3xl sm:text-4xl font-bold mb-3 leading-tight tracking-tight
    transition-opacity duration-300
    ${isLoaded ? "opacity-100" : "opacity-0"}`}
        >
          {" "}
          Success Van Hire
        </h1>

        <h2
          className={`text-lg sm:text-xl font-semibold text-[#fe9a00] mb-4 tracking-widest
    transition-opacity duration-200 delay-100
    ${isLoaded ? "opacity-100" : "opacity-0"}`}
        >
          Van Hire London
        </h2>

        <p
          className={`text-sm sm:text-base text-gray-300/90 leading-relaxed max-w-md mx-auto
    transition-opacity duration-200 delay-150
    ${isLoaded ? "opacity-100" : "opacity-0"}`}
        >
          Rent a clean, reliable van in London for moving, deliveries or
          business use. Check availability and reserve online in under 60
          seconds.
        </p>
        <div
          className={`mt-5 flex flex-wrap justify-center gap-2 transition-opacity duration-300 delay-200
    ${isLoaded ? "opacity-100" : "opacity-0"}`}
        >
          {["50+ Vehicles", "No Hidden Fees", "Quick Booking"].map((item) => (
            <span
               key={item}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md"
            >
              {item}
            </span>
          ))}
        </div>
      </header>

      <div
        className={`transition-opacity duration-300
          ${isLoaded ? "opacity-100" : "opacity-0"}`}
      >
        <div className="glass-form backdrop-blur-2xl rounded-2xl p-5 sm:p-6">
          <FormHeader compact />
          <Suspense fallback={<FormSkeleton />}>
            <ReservationForm isModal={false} onBookNow={onBookNow} />
          </Suspense>
        </div>
      </div>
    </div>
  );
});

export default memo(ReservationHero);
