"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import {
  FiTruck,
  FiShield,
  FiHeart,
  FiDollarSign,
  FiClock,
  FiAward,
  FiCheckCircle,
  FiStar,
} from "react-icons/fi";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const features = [
  {
    icon: FiTruck,
    title: "Reliable & Flexible",
    description: "Specializing in dependable van and minibus hire for any need",
    color: "#fe9a00",
  },
  {
    icon: FiDollarSign,
    title: "Affordable Rates",
    description: "Competitive pricing for both personal and commercial use",
    color: "#ff8800",
  },
  {
    icon: FiShield,
    title: "Fully Insured",
    description:
      "All vehicles regularly maintained and comprehensively insured",
    color: "#ffa500",
  },
  {
    icon: FiClock,
    title: "Flexible Terms",
    description: "Short or long-term hire available at your convenience",
    color: "#fe9a00",
  },
  {
    icon: FiHeart,
    title: "Friendly Service",
    description:
      "We pride ourselves on transparent pricing and excellent customer care",
    color: "#ff8800",
  },
  {
    icon: FiAward,
    title: "Extra Perks",
    description: "Free parking for your car while you hire with us",
    color: "#ffa500",
  },
];

const stats = [
  { value: "10+", label: "  Experience", icon: FiAward },
  { value: "50+", label: "Modern Vehicles", icon: FiTruck },
  { value: "5000+", label: "Happy Customers", icon: FiStar },
  { value: "100%", label: "  Rate", icon: FiCheckCircle },
];

export default function WhyWereDifferent() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<(HTMLDivElement | null)[]>([]);
  const statsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Main content animation
      if (contentRef.current) {
        gsap.fromTo(
          contentRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: contentRef.current,
              start: "top 80%",
              once: true,
            },
          }
        );
      }

      // Features animation
      featuresRef.current.forEach((feature, index) => {
        if (!feature) return;

        gsap.fromTo(
          feature,
          {
            opacity: 0,
            x: index % 2 === 0 ? -50 : 50,
            scale: 0.9,
          },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: feature,
              start: "top 85%",
              once: true,
            },
            delay: index * 0.1,
          }
        );
      });

      // Stats animation
      statsRef.current.forEach((stat, index) => {
        if (!stat) return;

        gsap.fromTo(
          stat,
          {
            opacity: 0,
            scale: 0.5,
          },
          {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: stat,
              start: "top 90%",
              once: true,
            },
            delay: index * 0.15,
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#0f172b]  py-20  overflow-hidden"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 lg:mb-20">
          <h2 className="text-2xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
            Why We Are
            <br />
            <span className="bg-[#fe9a00] bg-clip-text text-transparent">
              Different?
            </span>
          </h2>
        </div>

        {/* Main Content Card */}
        <div ref={contentRef} className="mb-16">
          <div
            className="relative p-8 lg:p-12 rounded-3xl border overflow-hidden"
            style={{
              background: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(30px)",
              borderColor: "rgba(255,255,255,0.2)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 via-transparent to-orange-500/5"></div>

            <div className="relative">
              <p className="text-gray-200 text-sm sm:text-xl leading-relaxed mb-6">
                At Success van hire, we specialise in{" "}
                <span className="text-[#fe9a00] font-bold">
                  reliable, flexible, and affordable
                </span>{" "}
                van and minibus hire for personal and commercial use. Whether
                you're moving house, transporting goods, or organising group
                travel, we have the right vehicle for you — from small vans to
                spacious minibuses, including automatic options for extra
                comfort and ease.
              </p>

              <p className="text-gray-200 text-sm sm:text-xl leading-relaxed mb-6">
                With{" "}
                <span className="text-[#fe9a00] font-bold">
                  years of experience
                </span>{" "}
                in the vehicle hire industry, our goal is simple: to make your
                rental experience as{" "}
                <span className="text-[#fe9a00] font-bold">
                  smooth and stress-free
                </span>{" "}
                as possible.
              </p>

              <p className="text-gray-200 text-sm sm:text-xl leading-relaxed">
                Whether you're a business owner needing a van for the day or a
                family heading out on a road trip, we're here to help you{" "}
                <span className="text-[#fe9a00] font-bold">
                  get on the road with confidence
                </span>
                .
              </p>
            </div>

            {/* Decorative corner */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#fe9a00]/20 rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                ref={(el) => {
                  featuresRef.current[index] = el;
                }}
                className="group relative"
              >
                <div
                  className="relative h-full p-4 md:p-8 rounded-2xl border transition-all duration-500 hover:scale-105"
                  style={{
                    background: "rgba(15, 23, 42, 0.5)",
                    backdropFilter: "blur(30px)",
                    borderColor: "rgba(255,255,255,0.1)",
                  }}
                >
                  {/* Hover effect */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                    style={{
                      background: `radial-gradient(circle at center, ${feature.color}10, transparent)`,
                    }}
                  ></div>

                  <div className="relative">
                    <div
                      className="w-12 md:w-16 h-12 md:h-16 rounded-xl bg-[#fe9a00] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
                      style={{
                        boxShadow: `0 10px 30px ${feature.color}30`,
                      }}
                    >
                      <Icon className="text-2xl text-white" />
                    </div>

                    <h3 className="text-base md:text-xl font-black text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                ref={(el) => {
                  statsRef.current[index] = el;
                }}
                className="relative group"
              >
                <div
                  className="relative p-4 md:p-8 rounded-2xl border text-center transition-all duration-500 hover:scale-105"
                  style={{
                    background: "rgba(15, 23, 42, 0.5)",
                    backdropFilter: "blur(30px)",
                    borderColor: "rgba(255,255,255,0.15)",
                  }}
                >
                  <Icon className="text-4xl text-[#fe9a00] mx-auto mb-4" />
                  <div className="text-2xl sm:text-5xl font-black text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm text-gray-400 font-semibold uppercase tracking-wide">
                    {stat.label}
                  </div>

                  {/* Glow */}
                  <div className="absolute inset-0 bg-linear-to-t from-[#fe9a00]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
