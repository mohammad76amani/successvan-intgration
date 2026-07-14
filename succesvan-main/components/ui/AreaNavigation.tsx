"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { FaMap } from "react-icons/fa";

interface AreaChild {
  label: string;
  href: string;
}

interface AreaNavigationProps {
  data: {
    label: string;
    href: string;
    children: AreaChild[];
  };
  title?: string;
  description?: string;
  variant?: "glass" | "outline" | "minimal";
  columns?: 3 | 4 | 5 | 6;
  className?: string;
}

export const areasData = {
  label: "AREAS",
  href: "#AREAS",
  children: [
    { label: "North west london", href: "/van-hire-north-west-london" },
    {
      label: "Brent Cross",
      href: "/success-van-hire-van-rental-in-brent-cross-london-last-minute-bookings",
    },
    { label: "Camden", href: "/van-hire-camden" },
    { label: "Colindale", href: "/van-hire-colindale" },
    { label: "Cricklewood", href: "/van-hire-cricklewood" },
    { label: "Dollis Hill", href: "/van-hire-dollis-hill" },
    { label: "Ealing", href: "/van-hire-ealing" },
    { label: "Edgware", href: "/van-hire-edgware" },
    { label: "Finchley", href: "/van-hire-finchley" },
    { label: "Golders Green", href: "/van-hire-golders-green" },
    { label: "Hampstead", href: "/van-hire-hampstead" },
    { label: "Harrow", href: "/van-hire-harrow" },
    { label: "Hendon", href: "/van-hire-hendon" },
    { label: "Kilburn", href: "/van-hire-kilburn" },
    { label: "Mill Hill", href: "/van-hire-mill-hill" },
    { label: "Neasden", href: "/van-hire-neasden" },
    { label: "Park Royal", href: "/van-hire-park-royal" },
    { label: "Staples Corner", href: "/van-hire-staples-corner" },
    { label: "Wembley", href: "/van-hire-wembley" },
    { label: "West Hampstead", href: "/van-hire-west-hampstead" },
    { label: "Willesden Green", href: "/van-hire-willesden-green" },
  ],
};

export default function AreaNavigation({
  data,
  title = "Our Service Areas in London",
  description = "Premium van hire available across North West London and beyond. Click any location to view local availability and special offers.",
  variant = "glass",
  columns = 4,
  className = "",
}: AreaNavigationProps) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => {
    return pathname === href || pathname === `${href}/`;
  };

  // Grid column classes
  const gridCols = {
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
  };

  // Variant-specific card styles
  const getCardClasses = (active: boolean) => {
    const base = `
      group relative flex items-center gap-3 p-4 rounded-2xl transition-all duration-300
      focus:outline-none focus:ring-2 focus:ring-[#fe9a00]/50
    `;

    switch (variant) {
      case "outline":
        return `
          ${base} border-2 backdrop-blur-sm
          ${
            active
              ? "bg-[#fe9a00]/10 border-[#fe9a00] text-slate-900 shadow-lg shadow-[#fe9a00]/20"
              : "bg-white/80 border-slate-200 text-slate-700 hover:border-[#fe9a00]/50 hover:bg-white"
          }
        `;

      case "minimal":
        return `
          ${base} border-b-2 rounded-none px-2
          ${
            active
              ? "border-[#fe9a00] text-[#fe9a00] font-semibold"
              : "border-transparent text-slate-600 hover:text-[#fe9a00] hover:border-[#fe9a00]/30"
          }
        `;

      case "glass":
      default:
        return `
          ${base} backdrop-blur-md shadow-xl border border-white/20
          ${
            active
              ? "bg-linear-to-br from-[#fe9a00] to-[#fe9a00]/90 text-white border-[#fe9a00]/50 shadow-[#fe9a00]/30"
              : "bg-[#0f172b]/90 text-slate-100 hover:bg-white/90 hover:text-black hover:shadow-2xl hover:border-[#fe9a00]/30"
          }
        `;
    }
  };

  // Hover animation handlers (GSAP for micro-interactions)
  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (variant === "minimal") return; // Skip hover scale for minimal
    gsap.to(e.currentTarget, {
      scale: 1.02,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (variant === "minimal") return;
    gsap.to(e.currentTarget, {
      scale: 1,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      {/* SEO-Optimized Heading Section */}
      <div
        ref={headingRef}
        className="mb-10  w-full mx-auto text-center flex flex-col justify-center items-center"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            {title}
          </h2>
        </div>
        <p className="text-lg text-slate-600 leading-relaxed max-w-sm md:max-w-3xl ">
          {description}
        </p>
      </div>

      {/* Navigation Grid */}
      <nav aria-label="Area navigation">
        <div
          ref={gridRef}
          className={`grid ${gridCols[columns]} gap-4 md:gap-5`}
        >
          {data.children.map((area) => {
            const active = isActive(area.href);
            return (
              <Link
                key={area.href}
                href={active ? "#" : area.href}
                className={getCardClasses(active)}
                aria-current={active ? "page" : undefined}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {/* Icon */}
                <div
                  className={`
                    shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
                    transition-all duration-300
                    ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-[#fe9a00]/10 text-[#fe9a00] group-hover:bg-[#fe9a00] group-hover:text-white"
                    }
                  `}
                >
                  <FaMap className="w-5 h-5" />
                </div>

                {/* Label */}
                <span className="font-medium text-base md:text-lg tracking-wide">
                  {area.label}
                </span>

                {/* Decorative gradient line (only for glass/outline) */}
                {variant !== "minimal" && (
                  <span
                    className={`
                      absolute bottom-0 left-4 right-4 h-0.5 bg-linear-to-r from-transparent via-[#fe9a00] to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-500
                      ${active ? "opacity-100" : ""}
                    `}
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Optional decorative background element */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#fe9a00]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#fe9a00]/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}

// <AreaNavigation
//     data={areasData}
//     title="Premium Van Hire Areas"
//     description="From Brent Cross to Wembley, we deliver exceptional van rental service across North West London with last-minute availability."
//     variant="glass"
//     columns={4}
//   />{" "}

// title = "SuccessVan Hire Service Areas";
// description =
//   "Premium van rental across North West London. From last‑minute bookings to long‑term hires, we deliver exceptional service in every neighbourhood we serve.";
// title = "Where We Operate";
// description =
//   "Proudly serving London's most vibrant communities with a fleet of immaculate vans and a commitment to seamless, stress‑free hire. Find your local SuccessVan Hire branch below.";

// title = "Van Hire Near You";
// description =
//   "Select your area to view local availability, exclusive rates, and instant booking. SuccessVan Hire – premium vans, delivered to your doorstep across North West London.";

// title = "SuccessVan Hire London";
// description =
//   "Discover the convenience of van rental in your neighbourhood. Professional fleet, transparent pricing, and 5‑star service – now in 20+ London locations.";

// title = "Your Local Van Hire Experts";
// description =
//   "From Brent Cross to Wembley, we're the trusted choice for van rental in North West London. Fast, flexible, and always reliable – SuccessVan Hire is where you need us.";
