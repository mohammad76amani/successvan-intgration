"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { FiUsers, FiTruck } from "react-icons/fi";
import { MdOutlineLocalParking } from "react-icons/md";
import { TbAutomaticGearbox } from "react-icons/tb";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function SuccessVanHire() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<(HTMLDivElement | null)[]>([]);
  const benefitsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate feature cards
      featuresRef.current.forEach((card, index) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { opacity: 0, y: 50, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none reverse",
              once: true,
            },
            delay: index * 0.1,
          }
        );
      });

      // Animate benefit items
      benefitsRef.current.forEach((item, index) => {
        if (!item) return;
        gsap.fromTo(
          item,
          { opacity: 0, x: -30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            ease: "power2.out",
            scrollTrigger: {
              trigger: item,
              start: "top 90%",
              toggleActions: "play none none reverse",
              once: true,
            },
            delay: index * 0.05,
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const features = [
    {
      icon: <FiTruck className="text-4xl" />,
      title: "All Types of Vans Available",
      description:
        "From compact city vans to spacious long-wheelbase models, we offer the right van for every job. Whether it's a quick move or a full-day project, you'll find a vehicle that fits your needs.",
      linear: " ",
      iconColor: "text-[#fe9a00]",
    },
    {
      icon: <TbAutomaticGearbox className="text-4xl" />,
      title: "Automatic Vans for Stress-Free Driving",
      description:
        "Prefer an automatic? Our fleet includes a selection of modern automatic vans, giving you a smooth and easy driving experience—perfect for both new and seasoned drivers.",
      linear: "from-[#fe9a00]/20 to-orange-500/20",
      iconColor: "text-[#fe9a00]",
    },
    {
      icon: <FiUsers className="text-4xl" />,
      title: "Minibus Hire for Group Travel",
      description:
        "Planning a trip with family, friends, or colleagues? Our comfortable minibuses are ideal for group travel, events, airport transfers, and more. Available in a range of sizes.",
      linear: "from-[#fe9a00]/20 to-orange-500/20",
      iconColor: "text-[#fe9a00]",
    },
    {
      icon: <MdOutlineLocalParking className="text-4xl" />,
      title: "Free Parking for Your car",
      description:
        "Hiring a van or minibus? Leave your Van with us at no extra cost. We offer free, secure parking for the duration of your hire, giving you one less thing to worry about.",
      linear: " ",
      iconColor: "text-[#fe9a00]",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#0f172b] py-20 overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#fe9a00]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-30 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
            Reliable, Comfortable, and
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#fe9a00] to-orange-500">
              Affordable Van Hire
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-4">
            Automatic Vans Available
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Looking for a dependable van hire service? We've got you covered.
            Whether you're moving house, transporting goods, or planning a group
            trip, our wide range of vans and minibuses is ready to meet your
            needs.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              ref={(el) => {
                featuresRef.current[index] = el;
              }}
              className="group relative"
            >
              <div
                className={`h-full bg-linear-to-br ${feature.linear} backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:border-[#fe9a00]/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#fe9a00]/10`}
              >
                {/* Icon */}
                <div className="mb-6">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center ${feature.iconColor} group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}
                  >
                    {feature.icon}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-black text-white mb-4 group-hover:text-[#fe9a00] transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {feature.description}
                </p>

                {/* Decorative element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-white/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
