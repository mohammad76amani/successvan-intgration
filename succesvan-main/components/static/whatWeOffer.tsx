"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import {
  FiTruck,
  FiClock,
  FiDollarSign,
  FiCheckCircle,
  FiCalendar,
  FiMapPin,
  FiSettings,
  FiZap,
} from "react-icons/fi";
import { BsSnow } from "react-icons/bs";
import { MdLocalShipping } from "react-icons/md";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const capabilities = [
  {
    icon: FiTruck,
    title: "Self-Drive Van Hire",
    description: "Take control with our flexible self-drive options",
    color: "#fe9a00",
  },
  {
    icon: FiClock,
    title: "Short & Long Term",
    description: "From a day to months - hire on your schedule",
    color: "#ff8800",
  },
  {
    icon: FiDollarSign,
    title: "Better Long-Term Prices",
    description: "Save more with our competitive long-term rates",
    color: "#ffa500",
  },
  {
    icon: FiCheckCircle,
    title: "Modern Fleet",
    description: "Well-maintained, reliable vehicles always ready",
    color: "#fe9a00",
  },
  {
    icon: FiCalendar,
    title: "Flexible Rental Periods",
    description: "Daily, weekly, or monthly - you choose",
    color: "#ff8800",
  },
  {
    icon: FiMapPin,
    title: "UK-Wide Service",
    description: "Great value for money across the United Kingdom",
    color: "#ffa500",
  },
];

const vanTypes = [
  {
    name: "LWB & SWB Vans",
    description: "Long and short wheelbase for all requirements",
    icon: FiTruck,
  },
  {
    name: "Transit Vans",
    description: "Reliable workhorses for any job",
    icon: MdLocalShipping,
  },
  {
    name: "Tipper Transits",
    description: "Perfect for construction and waste removal",
    icon: FiSettings,
  },
  {
    name: "Luton with Tail-Lift",
    description: "Easy loading for heavy items",
    icon: FiZap,
  },
  {
    name: "Refrigerated Vans",
    description: "Temperature-controlled transport",
    icon: BsSnow,
  },
];

export default function WhatWeOffer() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const vanTypesRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Capabilities cards animation
      cardsRef.current.forEach((card, index) => {
        if (!card) return;

        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 50,
            scale: 0.9,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              once: true,
            },
            delay: index * 0.1,
          }
        );
      });

      // Van types animation
      vanTypesRef.current.forEach((item, index) => {
        if (!item) return;

        gsap.fromTo(
          item,
          {
            opacity: 0,
            x: -30,
          },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            ease: "power2.out",
            scrollTrigger: {
              trigger: item,
              start: "top 90%",
              once: true,
            },
            delay: index * 0.08,
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full   bg-[#0f172b]     py-28   overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         
        <div className="absolute top-1/4 right-1/4 w-125 h-125 bg-[#fe9a00]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-125 h-125 bg-[#fe9a00]/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 lg:mb-20">
          <h2 className="text-2xl    lg:text-6xl font-black text-white mb-3 leading-tight">
            With Success Van Hire
            <br />
            <span className="bg-[#fe9a00] bg-clip-text text-transparent">
              You Are Able To
            </span>
          </h2>

          <p className="text-gray-300 text-sm sm:text-xl max-w-3xl mx-auto">
            Everything you need for a seamless van hire experience
          </p>
        </div>

        {/* Capabilities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {capabilities.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                ref={(el) => {
                  cardsRef.current[index] = el;
                }}
                className="group relative"
              >
                <div
                  className="relative h-full p-4 md:p-8 rounded-2xl border transition-all duration-500 hover:scale-105 cursor-pointer"
                  style={{
                    background: "rgba(15, 23, 42, 0.5)",
                    backdropFilter: "blur(30px)",
                    borderColor: "rgba(255,255,255,0.1)",
                  }}
                >
                  {/* Hover gradient */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                    style={{
                      background: `radial-gradient(circle at top, ${item.color}15, transparent)`,
                    }}
                  ></div>

                  <div className="relative">
                    {/* Icon */}
                    <div
                      className="w-12 md:w-16 h-12 md:h-16 rounded-xl bg-[#fe9a00] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl"
                      style={{
                        boxShadow: `0 10px 40px ${item.color}30`,
                      }}
                    >
                      <Icon className="text-2xl text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-base md:text-xl font-black text-white mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Glow */}
                  <div
                    className="absolute -inset-1 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-2xl -z-10"
                    style={{
                      background: `radial-gradient(circle, ${item.color}, transparent)`,
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Van Types Section */}
        <div className="relative">
          <div
            className="relative p-8 lg:p-12 rounded-3xl border overflow-hidden"
            style={{
              background: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(30px)",
              borderColor: "rgba(255,255,255,0.2)",
            }}
          >
            {/* Decorative gradient */}
            <div className="absolute inset-0 bg-linear-to-br from-[#fe9a00]/10 via-transparent to-orange-500/10"></div>

            <div className="relative">
              <h3 className="text-2xl sm:text-4xl font-black text-white mb-4 text-center lg:text-left">
                Our Van Types
              </h3>
              <p className="text-gray-300 text-sm md:text-lg mb-10 text-center lg:text-left max-w-2xl">
                Different types of vans for all your requirements
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {vanTypes.map((van, index) => {
                  const Icon = van.icon;
                  return (
                    <div
                      key={index}
                      ref={(el) => {
                        vanTypesRef.current[index] = el;
                      }}
                      className="group flex items-start gap-4 p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#fe9a00]/50 transition-all duration-300"
                    >
                      <div className="w-12 h-12 rounded-lg bg-[#fe9a00] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="text-xl text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold mb-1">
                          {van.name}
                        </h4>
                        <p className="text-gray-400 text-sm">
                          {van.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
