// components/Testimonials.tsx
"use client";

import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Testimonial, TestimonialsProps } from "@/types/type";

// ============ Inline SVG Icons ============
const ChevronLeftIcon = memo(() => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
));
ChevronLeftIcon.displayName = "ChevronLeftIcon";

const ChevronRightIcon = memo(() => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
));
ChevronRightIcon.displayName = "ChevronRightIcon";

const StarIcon = memo(function StarIcon({
  filled,
  color,
}: {
  filled: boolean;
  color: string;
}) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      stroke={filled ? color : "#666"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
});

 

// ============ Star Rating Component ============
const StarRating = memo(function StarRating({
  rating,
  color,
}: {
  rating: number;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-1 mb-6"
      role="img"
      aria-label={`Rating: ${rating} out of 5 stars`}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <StarIcon key={i} filled={i < rating} color={color} />
      ))}
    </div>
  );
});

// ============ Avatar Component ============
const Avatar = memo(function Avatar({
  name,
  image,
  color,
}: {
  name: string;
  image?: string;
  color: string;
}) {
  if (image) {
    return (
      <div className="w-12 md:w-16 h-12 md:h-16 rounded-2xl overflow-hidden shrink-0">
        <Image
          src={image}
          alt={`${name}'s avatar`}
          width={64}
          height={64}
          className="w-full h-full object-cover"
          loading="lazy"
          sizes="64px"
        />
      </div>
    );
  }

  return (
    <div
      className="w-12 md:w-16 h-12 md:h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shrink-0"
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}80)`,
      }}
      aria-hidden="true"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
});

// ============ Testimonial Card (slide) ============
const TestimonialSlide = memo(function TestimonialSlide({
  testimonial,
  showRating,
  accentColor,
  isActive,
}: {
  testimonial: Testimonial;
  showRating: boolean;
  accentColor: string;
  isActive: boolean;
}) {
  return (
    <article
      className={`testimonial-slide ${isActive ? "testimonial-slide-active" : ""}`}
      aria-hidden={!isActive}
      aria-label={`Testimonial from ${testimonial.name}`}
    >
      <div
        className="testimonial-card-bg"
        style={{
          borderColor: `${accentColor}40`,
          boxShadow: `0 20px 60px ${accentColor}20`,
        }}
      >
      

        <div className="mt-6">
          {showRating && (
            <StarRating rating={testimonial.rating} color={accentColor} />
          )}

          <blockquote className="text-gray-200 line-clamp-3 text-sm lg:text-xl mb-8 italic">
            <p>&ldquo;{testimonial.message}&rdquo;</p>
          </blockquote>

          <footer className="flex items-center gap-4">
            <Avatar
              name={testimonial.name}
              image={testimonial.image}
              color={accentColor}
            />
            <div>
              <cite className="not-italic text-white font-black text-sm md:text-xl block">
                {testimonial.name}
              </cite>
              {testimonial.location && (
                <p className="text-gray-400 text-xs md:text-sm">
                  {testimonial.location}
                </p>
              )}
              {testimonial.link && (
                <a
                  href={testimonial.link}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-block mt-2 px-3 py-1 bg-[#fe9a00]/20 border border-[#fe9a00] rounded-lg text-xs md:text-sm text-[#fe9a00] hover:bg-[#fe9a00]/30 transition-colors duration-300 font-semibold"
                  aria-label={`View ${testimonial.name}'s review source (opens in new tab)`}
                >
                  View Source →
                </a>
              )}
            </div>
          </footer>
        </div>

        {/* Decorative gradient */}
        <div
          className="testimonial-decoration"
          style={{
            background: `radial-gradient(circle, ${accentColor}, transparent)`,
          }}
          aria-hidden="true"
        />
      </div>
    </article>
  );
});

// ============ Navigation Buttons ============
const NavButton = memo(function NavButton({
  direction,
  onClick,
  accentColor,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  accentColor: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={`${direction === "prev" ? "Previous" : "Next"} testimonial`}
      className={`testimonial-nav-btn testimonial-nav-${direction}`}
      style={{ boxShadow: `0 10px 30px ${accentColor}20` }}
      type="button"
    >
      {direction === "prev" ? <ChevronLeftIcon /> : <ChevronRightIcon />}
    </button>
  );
});

// ============ Dots Navigation ============
const DotsNav = memo(function DotsNav({
  total,
  current,
  onSelect,
  accentColor,
}: {
  total: number;
  current: number;
  onSelect: (index: number) => void;
  accentColor: string;
}) {
  return (
    <div
      className="flex items-center justify-center gap-3 mt-12"
      role="tablist"
      aria-label="Testimonial navigation"
    >
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          aria-label={`Go to testimonial ${i + 1}`}
          aria-selected={i === current}
          role="tab"
          type="button"
          className={`testimonial-dot ${
            i === current ? "testimonial-dot-active" : ""
          }`}
          style={
            i === current
              ? {
                  background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`,
                  boxShadow: `0 0 20px ${accentColor}80`,
                }
              : undefined
          }
        />
      ))}
    </div>
  );
});

// ============ Main Component ============
function Testimonials({
  testimonials,
  autoPlay = true,
  autoPlayInterval = 5000,
  showRating = true,
  accentColor = "#fe9a00",
}: TestimonialsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [displayTestimonials, setDisplayTestimonials] = useState<Testimonial[]>(
    testimonials || [],
  );
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef = useRef(0);
  const touchEndRef = useRef(0);

  // ✅ Fetch با AbortController و cache
  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    const fetchApprovedTestimonials = async () => {
      try {
        const res = await fetch("/api/testimonials?status=approved", {
          signal: controller.signal,
          // ✅ Cache برای 5 دقیقه
          next: { revalidate: 300 },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        if (mounted && data.success && data.data.length > 0) {
          setDisplayTestimonials(
            data.data.map(
              (t: {
                _id: string;
                name: string;
                message: string;
                rating: number;
                link?: string;
                location?: string;
                image?: string;
              }) => ({
                id: t._id,
                name: t.name,
                message: t.message,
                rating: t.rating,
                link: t.link,
                location: t.location,
                image: t.image,
              }),
            ),
          );
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Failed to fetch testimonials:", error);
        }
      }
    };

    fetchApprovedTestimonials();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  // ✅ Intersection Observer برای entrance animation
  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" },
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // ✅ Auto-play با Page Visibility API
  useEffect(() => {
    if (!autoPlay || isPaused || displayTestimonials.length <= 1) return;

    // ✅ متوقف کردن وقتی tab مخفی است
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      } else {
        startAutoplay();
      }
    };

    const startAutoplay = () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % displayTestimonials.length);
      }, autoPlayInterval);
    };

    startAutoplay();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [autoPlay, isPaused, displayTestimonials.length, autoPlayInterval]);

  // ✅ Callbacks
  const nextTestimonial = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % displayTestimonials.length);
    setIsPaused(true);
  }, [displayTestimonials.length]);

  const prevTestimonial = useCallback(() => {
    setCurrentIndex(
      (prev) =>
        (prev - 1 + displayTestimonials.length) % displayTestimonials.length,
    );
    setIsPaused(true);
  }, [displayTestimonials.length]);

  const goToTestimonial = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsPaused(true);
  }, []);

  // ✅ Touch handlers برای swipe روی موبایل
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.changedTouches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      touchEndRef.current = e.changedTouches[0].clientX;
      const distance = touchStartRef.current - touchEndRef.current;
      if (distance > 50) nextTestimonial();
      else if (distance < -50) prevTestimonial();
    },
    [nextTestimonial, prevTestimonial],
  );

  // ✅ Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevTestimonial();
      else if (e.key === "ArrowRight") nextTestimonial();
    },
    [nextTestimonial, prevTestimonial],
  );

  // ✅ JSON-LD برای SEO (Reviews)
  const jsonLd = useMemo(() => {
    if (displayTestimonials.length === 0) return null;

    const avgRating =
      displayTestimonials.reduce((sum, t) => sum + t.rating, 0) /
      displayTestimonials.length;

    return {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Success Van Hire",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating.toFixed(1),
        bestRating: "5",
        worstRating: "1",
        ratingCount: displayTestimonials.length,
      },
      review: displayTestimonials.slice(0, 10).map((t) => ({
        "@type": "Review",
        author: {
          "@type": "Person",
          name: t.name,
        },
        reviewRating: {
          "@type": "Rating",
          ratingValue: t.rating,
          bestRating: "5",
        },
        reviewBody: t.message,
      })),
    };
  }, [displayTestimonials]);

  const current = displayTestimonials[currentIndex];

  if (displayTestimonials.length === 0) return null;

  return (
    <>
    

      <section
        ref={sectionRef}
        className="relative w-full bg-[#0f172b] py-20 overflow-hidden"
        aria-labelledby="testimonials-title"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: accentColor }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: accentColor }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <header
            className={`  text-center mb-16 lg:mb-20  `}
          >
            <h2
              id="testimonials-title"
              className="text-2xl lg:text-7xl font-black text-white mb-6 leading-tight"
            >
              What Our Clients
              <br />
              <span style={{ color: accentColor }}>Say About Us</span>
            </h2>
            <p className="text-gray-400 text-base md:text-lg max-w-3xl mx-auto">
              Don&apos;t just take our word for it — hear from our satisfied
              customers
            </p>
          </header>

          {/* Carousel */}
          <div
            className="relative"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label="Customer testimonials"
          >
            <div className="max-w-5xl mx-auto">
              <TestimonialSlide
                key={current.id}
                testimonial={current}
                showRating={showRating}
                accentColor={accentColor}
                isActive
              />
            </div>

            {displayTestimonials.length > 1 && (
              <>
                <NavButton
                  direction="prev"
                  onClick={prevTestimonial}
                  accentColor={accentColor}
                />
                <NavButton
                  direction="next"
                  onClick={nextTestimonial}
                  accentColor={accentColor}
                />
                {/* <DotsNav
                  total={displayTestimonials.length}
                  current={currentIndex}
                  onSelect={goToTestimonial}
                  accentColor={accentColor}
                /> */}
              </>
            )}
          </div>

          {/* CTA */}
          <div className="md:mt-20 mt-8 text-center">
            <p className="text-gray-400 text-lg mb-6">
              Want to share your experience with us?
            </p>
            <Link
              href="/contact-us"
              prefetch={false}
              className="inline-flex items-center gap-3 md:px-8 md:py-4 px-5 py-3 rounded-2xl font-bold text-base md:text-lg text-white transition-transform duration-300 hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                boxShadow: `0 20px 60px ${accentColor}40`,
              }}
            >
              Leave a Review
             </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default memo(Testimonials);
