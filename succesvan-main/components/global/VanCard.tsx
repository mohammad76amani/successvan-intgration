"use client";

import { useState } from "react";
import Image from "next/image";
import { FiUsers, FiCheckCircle } from "react-icons/fi";
import { BsFuelPump } from "react-icons/bs";
import { MdDoorSliding } from "react-icons/md";

interface VanCardProps {
  van: {
    _id: string;
    name: string;
    image: string;
    seats: number;
    fuel: string;
    doors: number;
    expert: string;
    pricingTiers: { minDays: number; maxDays: number; pricePerDay: number }[];
    extrahoursRate: number;
    selloffer?: number;
  };
  isSelected: boolean;
  onSelect: () => void;
  calculatedPrice?: number;
  originalPrice?: number;
  breakdown?: string;
  specialDaysPrice?: number;
}

export default function VanCard({
  van,
  isSelected,
  onSelect,
  calculatedPrice,
  originalPrice,
  breakdown,
  specialDaysPrice,
}: VanCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hasCalculatedPrice =
    typeof calculatedPrice === "number" && Number.isFinite(calculatedPrice);
  const hasOriginalPrice =
    typeof originalPrice === "number" && Number.isFinite(originalPrice);

  // Generate GTM-friendly ID from van name
  const vanId = `gtm-van-${van.name.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div
      id={vanId}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 bg-[#0f172a]/80 border border-white/10 ${
        isSelected ? "ring-2 ring-[#fe9a00] shadow-lg shadow-[#fe9a00]/50" : ""
      } hover:shadow-lg hover:shadow-black/50`}
    >
      {/* Horizontal Layout - Image Left, Content Right */}
      <div className="flex flex-row">
        {/* Image Container - Left Side */}
        <div className="relative w-32 h-36   shrink-0 overflow-hidden">
          <Image
            src={van.image}
            alt={van.name}
            fill
            className={`object-cover transition-transform duration-500 ${
              isHovered ? "scale-110" : "scale-100"
            }`}
            unoptimized
          />
          {/* Gradient Overlay */}
          <div
            className={`absolute inset-0 transition-all duration-500 ${
              isHovered
                ? "bg-linear-to-r from-black/70 to-transparent"
                : "bg-linear-to-r from-black/60 to-transparent"
            }`}
          />
        </div>

        {/* Content - Right Side */}
        <div className="flex-1 flex flex-col p-3 justify-between">
          {/* Top Section */}
          <div>
            <h4 className="text-sm font-black text-white line-clamp-1">
              {van.name}
            </h4>
            <p className="text-gray-400 text-xs mb-2 line-clamp-1">
              {van.expert}
            </p>

            {/* Specs */}
            <div className="flex gap-1 flex-wrap">
              <div className="px-1.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center gap-0.5">
                <FiUsers className="text-[#fe9a00] text-[10px]" />
                <span className="text-white text-[10px] font-semibold">
                  {van.seats}
                </span>
              </div>
              <div className="px-1.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center gap-0.5">
                <BsFuelPump className="text-[#fe9a00] text-[10px]" />
                <span className="text-white text-[10px] font-semibold">
                  {van.fuel}
                </span>
              </div>
              <div className="px-1.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center gap-0.5">
                <MdDoorSliding className="text-[#fe9a00] text-[10px]" />
                <span className="text-white text-[10px] font-semibold">
                  {van.doors}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Section - Price */}
          <div>
            {hasCalculatedPrice ? (
              <>
                {van.selloffer && van.selloffer > 0 && hasOriginalPrice ? (
                  <>
                    <div className="flex items-baseline gap-1 mb-0.5">
                      <span className="text-xs font-bold text-gray-400 line-through">
                        £{originalPrice}
                      </span>
                      <span className="text-lg font-black text-[#37cf6f]">
                        £{calculatedPrice}
                      </span>
                    </div>
                    <p className="text-[#fe9a00] text-[10px] font-bold mb-0.5">
                      {van.selloffer}% OFF
                    </p>
                  </>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-[#37cf6f]">
                      <span className="font-medium text-gray-400 text-xs">
                        cost:
                      </span>{" "}
                      £{calculatedPrice}
                    </span>
                  </div>
                )}
                <p className="text-gray-300 text-[10px] line-clamp-1">
                  {breakdown}
                </p>
                { specialDaysPrice! > 0 && (
                  <div className="mt-1 flex items-center gap-1 text-[10px]">
                    <div className="w-1 h-1 rounded-full bg-blue-400" />
                    <span className="text-blue-300 font-semibold">
                      +£{specialDaysPrice} special days
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                {van.selloffer && van.selloffer > 0 ? (
                  <>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-gray-400 line-through">
                        £{van.pricingTiers[0]?.pricePerDay}
                      </span>
                      <span className="text-lg font-black text-[#37cf6f]">
                        £
                        {(
                          van.pricingTiers[0]?.pricePerDay *
                          (1 - van.selloffer / 100)
                        ).toFixed(2)}
                      </span>
                      <span className="text-gray-300 text-xs font-semibold">
                        /day
                      </span>
                    </div>
                    <p className="text-[#fe9a00] text-[10px] font-bold">
                      {van.selloffer}% OFF
                    </p>
                  </>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-white">
                      £{van.pricingTiers[0]?.pricePerDay}
                    </span>
                    <span className="text-gray-300 text-xs font-semibold">
                      /day
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#fe9a00] flex items-center justify-center shadow-lg">
          <FiCheckCircle className="text-white text-xs" />
        </div>
      )}
    </div>
  );
}
