"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiPhone, FiCopy, FiCheck, FiArrowRight } from "react-icons/fi";
import Image from "next/image";

export default function TagoreHero() {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [pulseCode, setPulseCode] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setPulseCode((prev) => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText("TJC2026");
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = "TJC2026";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleBookNow = () => {
    window.scrollBy({ top: 2000, behavior: "smooth" });
  };

  return (
    <section className="relative bg-linear-to-br from-[#0a0f1e] via-[#131c33] to-[#0a0f1e] text-white min-h-screen flex items-center overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-75 h-75 sm:w-125 sm:h-125 bg-[#fe9a00]/8 rounded-full blur-25 animate-pulse" />
        <div
          className="absolute bottom-[10%] right-[5%] w-32.5h-32.5sm:w-100 sm:h-100 bg-[#ff6b00]/6 rounded-full blur-25 animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-50 h-50  sm:w-75 sm:h-75 bg-[#fe9a00]/5 rounded-full blur-[80px] animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Subtle Grid Pattern */}
      <div
        className="absolute inset-0 opacity-3 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div
        className={`relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-30 sm:py-28 lg:py-32 transition-all duration-1000 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="text-center max-w-5xl mx-auto">
          {/* Discount Banner */}
          <div
            className={`inline-block mb-8 sm:mb-10 transition-all duration-700 delay-200 ${
              isVisible
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 -translate-y-6 scale-95"
            }`}
          >
            <div className="relative group">
              {/* Outer Glow */}
              <div className="absolute -inset-1 bg-linear-to-r from-[#fe9a00] via-[#ff6b00] to-[#fe9a00] rounded-2xl sm:rounded-3xl blur-sm opacity-60 group-hover:opacity-80 transition-opacity duration-500 animate-pulse" />

              <div className="relative bg-linear-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] border border-[#fe9a00]/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 backdrop-blur-xl">
                <div className="flex flex-col lg:flex-row items-center gap-3 sm:gap-7 lg:gap-9">
                  {/* Offer Text */}
                  <div className="flex items-center gap-2 sm:gap-5">
                    <span className="text-2xl sm:text-3xl animate-bounce">
                      🎉
                    </span>
                    <div className="text-left">
                      <p className="text-[#fe9a00] text-[10px] sm:text-xs font-semibold uppercase tracking-widest">
                        Limited Celebration Offer
                      </p>
                      <p className="text-white text-base sm:text-lg lg:text-xl font-black">
                        Get{" "}
                        <span className="text-[#fe9a00] text-xl sm:text-2xl lg:text-3xl">
                          10% OFF
                        </span>{" "}
                        Your Booking
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden lg:block w-px h-12 bg-linear-to-b from-transparent via-[#fe9a00]/40 to-transparent" />
                  <div className="lg:hidden w-32 h-px bg-linear-to-r from-transparent via-[#fe9a00]/40 to-transparent" />

                  {/* Coupon Code Box */}
                  <div className="flex items-center gap-2 sm:gap-5 w-full">
                    <div
                      className={`relative bg-[#0a0f1e] border-2 border-dashed rounded-xl px-8 sm:px-5 py-2.5 sm:py-3 transition-all duration-500 w-full lg:w-fit ${
                        pulseCode
                          ? "border-[#fe9a00] shadow-[0_0_20px_rgba(254,154,0,0.2)]"
                          : "border-[#fe9a00]/50"
                      }`}
                    >
                      <p className="text-[12px] text-[#fe9a00]/70 uppercase tracking-wider md:px-5 mb-0.5">
                        Use Code
                      </p>
                      <code className="text-white font-black text-md sm:text-sm lg:text-base tracking-wider select-all">
                        TJC2026
                      </code>
                    </div>

                    <button
                      onClick={handleCopyCode}
                      className={`flex items-center justify-center w-12 h-15 sm:w-16 sm:h-16 rounded-xl font-semibold transition-all duration-300 active:scale-90 px-3 ${
                        copied
                          ? "bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                          : "bg-[#fe9a00] hover:bg-[#ff8c00] text-white hover:shadow-[0_0_20px_rgba(254,154,0,0.4)] hover:scale-105"
                      }`}
                      aria-label="Copy discount code"
                      title={copied ? "Copied!" : "Copy code"}
                    >
                      {copied ? (
                        <FiCheck className="text-2xl sm:text-2xl" />
                      ) : (
                        <FiCopy className="text-2xl sm:text-2xl" />
                      )}
                    </button>
 <button
                      onClick={handleBookNow}
                      className="md:flex hidden items-center  justify-center gap-2 bg-green-500 lg:ml-4 hover:bg-green-600 text-white px-8 sm:px-6 lg:px-30 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] active:scale-90 shadow-lg"
                      aria-label="Book now and view vans"
                      title="Book Now"
                    >
                      <span className="text-xl sm:text-2xl">🚐</span>
                      <span className=" inline">Book Now</span>
                    </button>
                   
                  </div>
                   <button
                      onClick={handleBookNow}
                      className="flex md:hidden items-center w-full justify-center gap-2 bg-green-500 lg:ml-6 hover:bg-green-600 text-white px-8 sm:px-6 lg:px-30 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] active:scale-90 shadow-lg"
                      aria-label="Book now and view vans"
                      title="Book Now"
                    >
                      <span className="text-xl sm:text-2xl">🚐</span>
                      <span className=" inline">Book Now</span>
                    </button>
                </div>

                {/* Copied Toast */}
                <div
                  className={`absolute -bottom-8 left-1/2 -translate-x-1/2 transition-all duration-300 ${
                    copied
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2 pointer-events-none"
                  }`}
                >
                  <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                    ✓ Code copied to clipboard!
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <h1
            className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-6 sm:mb-8 leading-[1.1] tracking-tight transition-all duration-700 delay-400 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <span className="block text-white">Tagore Jayanti</span>
            <span className="block mt-1 sm:mt-2">
              <span className="bg-linear-to-r from-[#fe9a00] via-[#ffb84d] to-[#fe9a00] bg-clip-text text-transparent">
                Celebration
              </span>
            </span>
            <span className="block text-white/90 text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-2 sm:mt-3 font-bold">
              Minibus Hire in London
            </span>
          </h1>

          {/* Description */}
          <p
            className={`text-base sm:text-lg lg:text-xl text-gray-300 mb-5 sm:mb-6 leading-relaxed max-w-3xl mx-auto transition-all duration-700 delay-500 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Planning to attend a Tagore Jayanti Celebration in London with
            family, friends, performers, students, or your community group?
            Travel together with{" "}
            <span className="text-[#fe9a00] font-semibold">Success Van</span>{" "}
            and enjoy comfortable, simple and reliable minibus hire for this
            special cultural occasion.
          </p>

          <p
            className={`text-sm sm:text-base text-gray-400/90 mb-8 sm:mb-10 lg:mb-12 leading-relaxed max-w-3xl mx-auto transition-all duration-700 delay-600 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Tagore Jayanti, also known as{" "}
            <em className="text-gray-300">Rabindra Jayanti</em>, is a meaningful
            cultural celebration honouring the life, poetry, music and legacy of
            Rabindranath Tagore. Whether you are travelling to a temple,
            cultural hall, school programme, community centre, private gathering
            or stage performance, Success Van helps your group arrive together,
            on time and without the stress of multiple cars or complicated
            public transport.
          </p>

          <Image
            src={
              "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/1777473941549-What_Is_Tagore_Jayanti_and_Why_Is_It_Celebrated_.webp"
              
            }
            width={2000}
            height={2000}
            className="rounded-xl mb-4"
            alt="Tagore Jayanti
Celebration"
          />

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-5 justify-center items-center transition-all duration-700 delay-700 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <a
              href="tel:+442030111198"
              className="group relative inline-flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-center bg-linear-to-r from-[#fe9a00] to-[#e58900] hover:from-[#ff8c00] hover:to-[#d47e00] text-white px-6 sm:px-8 lg:px-10 py-3.5 sm:py-4 lg:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_40px_rgba(254,154,0,0.35)] active:scale-[0.98] shadow-xl"
            >
              <FiPhone className="text-lg sm:text-xl group-hover:animate-[wiggle_0.5s_ease-in-out]" />
              <span>
                Call Now:{" "}
                <span className="tracking-wide">+44 20 3011 1198</span>
              </span>
            </a>

            <Link
              href="#booking"
              className="group relative inline-flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-center bg-white hover:bg-gray-50 text-[#0f172b] px-6 sm:px-8 lg:px-10 py-3.5 sm:py-4 lg:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_40px_rgba(255,255,255,0.15)] active:scale-[0.98] shadow-xl"
            >
              <span>Book Your 10% Off Minibus</span>
              <FiArrowRight className="text-lg sm:text-xl group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>

          {/* Trust Info */}
          <div
            className={`mt-10 sm:mt-12 lg:mt-14 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 transition-all duration-700 delay-800 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span>Available 24/7</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-600" />
            <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm">
              <span>📍</span>
              <span>Strata House, Waterloo Road, London, NW2 7UH</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-600" />
            <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm">
              <span>⭐</span>
              <span>Trusted by 1000+ groups</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 bg-linear-to-t from-[#0a0f1e] to-transparent pointer-events-none" />
    </section>
  );
}
