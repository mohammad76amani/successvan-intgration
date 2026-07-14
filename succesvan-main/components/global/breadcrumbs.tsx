"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { FiChevronRight, FiHome } from "react-icons/fi";
import { useState, useEffect } from "react";

export default function Breadcrumbs() {
  const pathname = usePathname();
  const hiddenPaths = ["/", "/register", "/admin", "/dashboard"];
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const segments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment, index, arr) => ({
      label: segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()),
      href: "/" + arr.slice(0, index + 1).join("/"),
    }));

  useEffect(() => {
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: typeof window !== "undefined" ? window.location.origin : "",
        },
        ...segments.map((segment, index) => ({
          "@type": "ListItem",
          position: index + 2,
          name: segment.label,
          item:
            typeof window !== "undefined"
              ? `${window.location.origin}${segment.href}`
              : "",
        })),
      ],
    };

    let script = document.getElementById(
      "breadcrumb-schema",
    ) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "breadcrumb-schema";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(breadcrumbSchema);
  }, [pathname, segments]);

  if (hiddenPaths.includes(pathname)) {
    return null;
  }

  if (
    pathname.startsWith("/dashboard/blog/edit") ||
    pathname === "/customerDashboard" ||
    pathname === "/register" ||
    pathname === "/dashboard"
  ) {
    return null;
  }

  return (
    <nav
      className="fixed left-0 right-0 z-40 py-4  transition-all duration-75"
      style={{
        top: isScrolled ? "-40px" : isMobile ? "92px" : "96px",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-[#fe9a00] transition-colors"
          >
            <FiHome className="text-lg" />
            <span>Home</span>
          </Link>

          {segments.map((segment, index) => (
            <div key={segment.href} className="flex items-center gap-2">
              <FiChevronRight className="text-gray-600" />
              {index === segments.length - 1 ? (
                <>
                  {" "}
                  <span className="text-white font-semibold sm:hidden">
                    {segment.label.slice(0, 26)}
                  </span>
                  <span className="text-white font-semibold hidden sm:block">
                    {segment.label}
                  </span>
                </>
              ) : (
                <Link
                  href={segment.href}
                  className="text-gray-400 hover:text-[#fe9a00]  transition-colors"
                >
                  {segment.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
