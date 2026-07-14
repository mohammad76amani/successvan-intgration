"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Link from "next/link";
import { FiHome, FiArrowRight } from "react-icons/fi";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function NotFound() {
  const containerRef = useRef<HTMLDivElement>(null);
  const vanRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<(SVGGElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Van driving animation
      gsap.fromTo(
        vanRef.current,
        { x: -500, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1.5,
          ease: "power2.out",
        },
      );

      // Wheel rotation
      wheelRef.current.forEach((wheel) => {
        if (wheel) {
          gsap.to(wheel, {
            rotation: 360,
            duration: 0.8,
            repeat: -1,
            ease: "none",
          });
        }
      });

      // Text animations
      gsap.fromTo(
        ".error-title",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          delay: 0.3,
        },
      );

      gsap.fromTo(
        ".error-subtitle",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          delay: 0.5,
        },
      );

      gsap.fromTo(
        ".error-description",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          delay: 0.7,
        },
      );

      gsap.fromTo(
        ".error-button",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          delay: 0.9,
        },
      );

      // Floating animation for background elements
      gsap.to(".floating-element", {
        y: 20,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.2,
      });

      // Bump animation for van on load
      gsap.to(vanRef.current, {
        y: -10,
        duration: 0.5,
        delay: 1.5,
        ease: "power2.inOut",
      });

      gsap.to(vanRef.current, {
        y: 0,
        duration: 0.5,
        delay: 2,
        ease: "bounce.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <main
      ref={containerRef}
      className="min-h-screen bg-linear-to-br from-[#0f172b] via-slate-900 to-[#0f172b] overflow-hidden flex flex-col items-center justify-center relative"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-element absolute top-20 right-10 w-40 h-40 bg-[#fe9a00]/5 rounded-full blur-3xl"></div>
        <div className="floating-element absolute bottom-20 left-10 w-48 h-48 bg-[#fe9a00]/5 rounded-full blur-3xl"></div>
        <div className="floating-element absolute top-1/2 left-1/4 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 mt-16 py-4 flex flex-col items-center">
        {/* Error Content */}
        <div ref={textRef} className="text-center mb-12">
          <h1 className="error-title text-3xl lg:text-7xl font-black mb-2">
            <span className="text-[#fe9a00]">404</span>
          </h1>

          <h2 className="error-subtitle text-3xl lg:text-5xl font-black text-white mb-4">
            Oops! Page Not Found
          </h2>

          <p className="error-description text-base lg:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Looks like the page you're looking for has been driven off course.
            Don't worry, our van will help you get back on track!
          </p>

          {/* Status Info */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <div className="px-6 py-3 rounded-xl bg-white/5 border border-[#fe9a00]/30 backdrop-blur-xl">
              <p className="text-[#fe9a00] font-bold text-sm">Status Code</p>
              <p className="text-white text-2xl font-black">404</p>
            </div>

            <div className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
              <p className="text-gray-400 font-bold text-sm">Error Type</p>
              <p className="text-white text-2xl font-black">Not Found</p>
            </div>

            <div className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
              <p className="text-gray-400 font-bold text-sm">Reason</p>
              <p className="text-white text-2xl font-black">Lost Route</p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="error-button flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="group relative px-8 py-4 rounded-xl bg-[#fe9a00] text-white font-bold text-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-[#fe9a00]/50 hover:scale-105 flex items-center gap-2 justify-center"
          >
            <span className="relative z-10 flex items-center gap-2">
              <FiHome className="w-5 h-5" />
              Back to Home
            </span>
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </Link>

          <Link
            href="/reservation"
            className="group relative px-8 py-4 rounded-xl bg-white/10 text-white font-bold text-lg border border-white/20 overflow-hidden transition-all duration-300 hover:bg-white/20 hover:border-[#fe9a00] flex items-center gap-2 justify-center"
          >
            <span className="relative z-10 flex items-center gap-2">
              See Our Fleet
              <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center text-gray-500 text-sm">
          <p>If you think this is a mistake, please contact support</p>
          <p className="mt-2">
            Need help? Visit our{" "}
            <Link
              href="/"
              className="text-[#fe9a00] hover:text-white transition-colors"
            >
              homepage
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
