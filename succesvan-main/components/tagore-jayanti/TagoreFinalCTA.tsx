"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FiPhone,
  FiMapPin,
  FiCopy,
  FiCheck,
  FiArrowRight,
} from "react-icons/fi";

export default function TagoreFinalCTA() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("TJC2026");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = "TJC2026";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <section className="relative bg-linear-to-b from-[#0a0f1e] via-[#0d1627] to-[#0a0f1e] py-24 sm:py-28 lg:py-32 overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-100 h-100  bg-[#fe9a00]/8 rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-10 right-10 w-125 h-125 bg-[#fe9a00]/6 rounded-full blur-35 animate-pulse"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-[#fe9a00]/4 rounded-full blur-40 animate-pulse"
          style={{ animationDelay: "3s" }}
        />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-3"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow + Heading */}
        <div className="mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 bg-[#fe9a00]/10 border border-[#fe9a00]/25 text-[#fe9a00] text-xs sm:text-sm font-bold uppercase tracking-widest px-5 py-2.5 rounded-full mb-6 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fe9a00] animate-ping" />
            Limited Celebration Offer – Ends Soon
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
            Book Your Tagore Jayanti
            <br />
            <span className="bg-linear-to-r from-[#fe9a00] via-[#ffb84d] to-[#fe9a00] bg-clip-text text-transparent">
              Minibus Hire Today
            </span>
          </h2>
        </div>

        <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 leading-relaxed max-w-4xl mx-auto mb-10 sm:mb-12">
          Make your Tagore Jayanti Celebration travel simple, organised and
          comfortable with Success Van. Whether you are travelling with family,
          friends, performers, students or your community group — arrive
          together, on time and stress-free.
        </p>

        {/* Discount Hero Box */}
        <div className="relative inline-block mb-12 sm:mb-14 group">
          {/* Outer glow */}
          <div className="absolute -inset-1 bg-linear-to-r from-[#fe9a00] via-[#ffb347] to-[#fe9a00] rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500 animate-pulse" />

          <div className="relative bg-linear-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] border border-[#fe9a00]/40 rounded-3xl p-4 sm:p-10 backdrop-blur-xl">
            <p className="text-[#fe9a00] text-xs sm:text-base font-bold uppercase tracking-widest mb-2">
              Celebration Exclusive
            </p>
            <p className="text-lg sm:text-4xl lg:text-5xl font-black text-white mb-3">
              Claim Your <span className="text-[#fe9a00]">10% OFF</span>
            </p>
            <p className="text-gray-300 text-xs sm:text-lg mb-6">
              Limited offer for Tagore Jayanti groups across London
            </p>

            {/* Coupon Code with Copy */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-linear-to-r from-[#fe9a00]/50 to-[#ffb347]/50 rounded-2xl blur-sm opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-[#060d1a] border-2 border-dashed border-[#fe9a00]/60 rounded-2xl px-6 sm:px-8 py-4 flex items-center gap-3">
                  <div>
                    <p className="text-[#fe9a00]/70 text-xs uppercase tracking-widest mb-0.5">
                      Discount Code
                    </p>
                    <code className="text-white font-black text-xs sm:text-xl tracking-wider select-all">
                      TJC2026
                    </code>
                  </div>
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-2 md:px-4 md:py-2 p-2 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 ${
                      copied
                        ? "bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                        : "bg-[#fe9a00] hover:bg-[#e58900] text-white hover:shadow-[0_0_20px_rgba(254,154,0,0.5)] hover:scale-105"
                    }`}
                  >
                    {copied ? (
                      <>
                        <FiCheck className="text-lg" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <FiCopy className="text-lg" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Copied toast */}
            <div
              className={`absolute -bottom-10 left-1/2 -translate-x-1/2 transition-all duration-300 ${copied ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
            >
              <span className="bg-green-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                Code copied! Use it when you call
              </span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-16 sm:mb-20">
          <a
            href="tel:+442030111198"
            className="group relative inline-flex items-center gap-3 bg-linear-to-r from-[#fe9a00] to-[#e58900] hover:from-[#ff8c00] hover:to-[#d47e00] text-white px-10 sm:px-12 py-5 sm:py-6 rounded-2xl font-bold text-base sm:text-xl transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_10px_40px_rgba(254,154,0,0.4)] active:scale-[0.98] shadow-2xl"
          >
            <FiPhone className="text-2xl group-hover:animate-[wiggle_0.6s_ease-in-out]" />
            <span>
              Call Now: <span className="tracking-wide">+44 20 3011 1198</span>
            </span>
          </a>

          <Link
            href="#booking"
            className="group inline-flex items-center gap-3 bg-white hover:bg-gray-50 text-[#0f172b] px-10 sm:px-12 py-5 sm:py-6 rounded-2xl font-bold text-lg sm:text-xl transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_10px_40px_rgba(255,255,255,0.2)] active:scale-[0.98] shadow-2xl"
          >
            Book Your 10% Off Minibus
            <FiArrowRight className="text-2xl group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>

        {/* Trust Footer */}
        <div className="pt-12 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-gray-400">
            <div className="flex items-center gap-3">
              <FiMapPin className="text-[#fe9a00] text-2xl" />
              <div className="text-left">
                <p className="text-white font-bold text-lg">Success Van</p>
                <p className="text-sm">
                  Strata House, Waterloo Road,
                  <br />
                  London, NW2 7UH
                </p>
              </div>
            </div>

            <div className="hidden sm:block w-px h-16 bg-white/10" />

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span>Available 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <span>⭐</span>
                <span>Trusted by 1000+ groups</span>
              </div>
            </div>
          </div>

          <p className="text-gray-500 text-xs mt-6">
            Call us any time — we're here to help your Tagore Jayanti
            Celebration run smoothly
          </p>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32  bg-linear-to-t from-[#0a0f1e] to-transparent pointer-events-none" />
    </section>
  );
}
