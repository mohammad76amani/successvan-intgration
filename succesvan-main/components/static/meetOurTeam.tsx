"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { FiMail, FiLinkedin, FiUser } from "react-icons/fi";
import { FaXTwitter } from "react-icons/fa6";
import Image from "next/image";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const team = [
  {
    name: "MATIN DIBA",
    role: "Director",
    image: "/assets/images/team/mehdi.jpg",
    bio: "Leading Success Van Hire with vision and expertise",
    color: "#ff8800",
    social: {
      twitter: "#",
      linkedin: "#",
      email: "mehdi@successvanhire.com",
    },
  },
];

export default function MeetOurTeam() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, index) => {
        if (!card) return;

        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 80,
            rotateY: -20,
            scale: 0.9,
          },
          {
            opacity: 1,
            y: 0,
            rotateY: 0,
            scale: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              once: true,
            },
            delay: index * 0.2,
          },
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#0f172b]  py-20   overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-150 h-150 bg-[#fe9a00]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/3 w-150 h-150 bg-orange-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 lg:mb-24">
          <h2 className="text-2xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
            Meet Our
            <br />
            <span className="bg-[#fe9a00] bg-clip-text text-transparent">
              Expert Team
            </span>
          </h2>

          <p className="text-gray-300 text-sm sm:text-xl max-w-3xl mx-auto">
            Success Van Hire offers affordable van rental services in London,
            providing reliable options for individuals, businesses, and movers
            alike.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {team.map((member, index) => (
            <div
              key={index}
              ref={(el) => {
                cardsRef.current[index] = el;
              }}
              className="group relative perspective-1000"
            >
              <div
                className="relative overflow-hidden rounded-3xl border transition-all duration-500 hover:scale-105"
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  backdropFilter: "blur(30px)",
                  borderColor: "rgba(255,255,255,0.2)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                }}
              >
                {/* Gradient overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background: `linear-gradient(180deg, ${member.color}20, transparent)`,
                  }}
                ></div>

                {/* Image Container */}
                <div className="relative h-80 overflow-hidden bg-slate-800">
                  {/* Placeholder with icon - replace with actual image */}
                  <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-slate-800 to-slate-900">
                    <FiUser className="text-9xl text-white/20" />
                  </div>

                  {/* Uncomment when you have images */}
                  {/* <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  /> */}

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>

                  {/* Role badge */}
                  <div className="absolute top-4 right-4">
                    <div
                      className="px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md"
                      style={{
                        background: `linear-gradient(135deg, ${member.color}80, ${member.color}40)`,
                        border: `1px solid ${member.color}`,
                        color: "white",
                      }}
                    >
                      {member.role}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="relative p-8">
                  <h3 className="md:text-xl text-lg font-black text-white mb-2">
                    {member.name}
                  </h3>

                  <p className="text-gray-400 text-xs mb-6 leading-relaxed">
                    {member.bio}
                  </p>

                  {/* Social Links */}
                  <div className="flex items-center gap-3">
                    <a
                      href={member.social.twitter}
                      className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#fe9a00] hover:border-amber-500 transition-all duration-300 group/social"
                      aria-label="Twitter"
                    >
                      <FaXTwitter className="text-gray-400 group-hover/social:text-white transition-colors" />
                    </a>
                    <a
                      href={member.social.linkedin}
                      className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#fe9a00] hover:border-amber-500 transition-all duration-300 group/social"
                      aria-label="LinkedIn"
                    >
                      <FiLinkedin className="text-gray-400 group-hover/social:text-white transition-colors" />
                    </a>
                    <a
                      href={`mailto:${member.social.email}`}
                      className="flex-1 px-4 py-2 rounded-lg bg-[#fe9a00]  text-white text-sm font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform duration-300"
                    >
                      <FiMail className="text-base" />
                      Contact
                    </a>
                  </div>
                </div>

                {/* Bottom glow */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${member.color}, transparent)`,
                    boxShadow: `0 0 20px ${member.color}`,
                  }}
                ></div>
              </div>

              {/* Card shadow */}
              <div
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-4/5 h-10 rounded-full blur-2xl -z-10 opacity-50 group-hover:opacity-70 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(ellipse, ${member.color}40, transparent)`,
                }}
              ></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
