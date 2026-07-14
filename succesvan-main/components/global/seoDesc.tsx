"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { FaArrowDown } from "react-icons/fa";
import { gsap } from "gsap";

interface SEODescriptionProps {
  content: string;
  collapsedLines?: number;
}

const SEODescription: React.FC<SEODescriptionProps> = ({
  content,
  collapsedLines = 5,
}) => {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const fullTextRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);

  const lineHeight = 28;

  useEffect(() => {
    if (fullTextRef.current) {
      const fullHeight = fullTextRef.current.scrollHeight;
      const collapsedHeight = lineHeight * collapsedLines;
      setContentHeight(isExpanded ? fullHeight : collapsedHeight);
      setShowToggle(fullHeight > collapsedHeight);
    }
  }, [isExpanded, collapsedLines]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        height: contentHeight,
        duration: 0.35,
        ease: "power2.inOut",
      });
    }

    if (overlayRef.current) {
      gsap.to(overlayRef.current, {
        opacity: !isExpanded && showToggle ? 1 : 0,
        duration: 0.3,
      });
    }

    if (arrowRef.current) {
      gsap.to(arrowRef.current, {
        rotation: isExpanded ? 180 : 0,
        duration: 0.3,
        transformOrigin: "center center",
      });
    }
  }, [isExpanded, showToggle, contentHeight]);

  if (pathname === "/admin" || pathname === "/auth") return null;

  return (
    <div className="w-full mx-auto px-4 md:px-6 py-8 bg-linear-to-b from-[#0f172b] to-[#0f172b]">
      <div className="relative   backdrop-blur-xl border border-white/10 text-white overflow-hidden p-6 md:p-8 rounded-2xl max-w-4xl mx-auto">
        {/* Invisible measuring block */}
        <div
          ref={fullTextRef}
          className="absolute invisible pointer-events-none leading-7 text-base"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Animated container */}
        <div ref={containerRef} className="relative overflow-hidden">
          <div
            className="text-justify leading-7 text-base text-gray-300   whitespace-break-spaces max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

        {/* Gradient overlay */}
        <div
          ref={overlayRef}
          className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-[#0f172b] to-transparent pointer-events-none"
        />

        {/* Toggle button */}
        {showToggle && (
          <div className="flex justify-start mt-6">
            <button
              aria-label="toggle"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-sm md:text-base cursor-pointer font-semibold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <span
                ref={arrowRef}
                className="w-4 h-4 inline-flex items-center justify-center"
              >
                <FaArrowDown />
              </span>
              {isExpanded ? "show less" : "show more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SEODescription;
