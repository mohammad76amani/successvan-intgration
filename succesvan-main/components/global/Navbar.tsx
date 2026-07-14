"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import {
  FiChevronDown,
  FiChevronRight,
  FiUser,
  FiPhone,
  FiLogOut,
  FiLayout,
  FiMapPin,
  FiArrowRight,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAnnouncement } from "./AnnouncementBar";
import { canAccessDashboard, getRoleLabel } from "@/lib/roles";
import { categoryNameToSlug } from "@/lib/category-slug";

let gsap: typeof import("gsap").gsap | undefined;

interface MenuItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  children?: {
    label: string;
    href: string;
    category?: string;
    icon?: React.ReactNode;
  }[];
}

type NavbarCategory = {
  _id?: string;
  id?: string;
  name?: string;
  status?: string;
};

function getCategoriesFromPayload(payload: unknown): NavbarCategory[] {
  if (!payload || typeof payload !== "object") return [];

  const root = payload as Record<string, unknown>;
  const data = root.data;

  const candidates = [
    root.categories,
    data,
    data && typeof data === "object"
      ? (data as Record<string, unknown>).data
      : undefined,
    data && typeof data === "object"
      ? (data as Record<string, unknown>).categories
      : undefined,
  ];

  const categories = candidates.find(Array.isArray);
  return Array.isArray(categories) ? (categories as NavbarCategory[]) : [];
}

function categoryToMenuItem(category: NavbarCategory) {
  const name = typeof category.name === "string" ? category.name.trim() : "";
  if (!name || category.status === "inactive") return null;

  const slug = categoryNameToSlug(name);

  if (!slug) return null;

  return {
    label: name,
    href: `/categories/${encodeURIComponent(slug)}`,
  };
}

const fallbackCategoryMenuItems: NonNullable<MenuItem["children"]> = [
  "Short Wheel Base",
  "Medium Wheel Base",
  "Long Wheel Base",
  "Extra Long Wheel Base",
  "Luton With Tail-Lift",
  "CrewCab Van",
  "Flat Bed Pickup Van",
  "Fridge Van",
  "Tipper Van",
  "8 Seater Tourneo",
  "9 Seater Tourneo",
  "14 Seater Minibus",
  "17 Seater Minibus",
].map((name) => ({
  label: name,
  href: `/categories/${encodeURIComponent(categoryNameToSlug(name))}`,
}));

const staticMenuItems: MenuItem[] = [
  { label: "HOME", href: "/" },
  // {
  //   label: "Tagore Jayanti 🎉",
  //   href: "/tagore-jayanti-celebration-minibus-hire-london",
  //   icon: <HiSparkles className="text-[#fe9a00]" />,
  // },
  
  {
    label: "SERVICES",
    href: "#services",
    children: [
      { label: "Reservation", href: "/reservation" },
      { label: "Van Hire London", href: "/van-hire-london" },
      { label: "Van Hire Near Me", href: "/van-hire-near-me" },
      { label: "Minibus Hire London", href: "/minibus-hire-london" },
      { label: "Fridge Van Hire London", href: "/fridge-van-hire-london" },
      { label: "Self-Drive Van Hire", href: "/self-drive-van-hire-london" },
      { label: "Automatic Van Rental", href: "/automatic-van-hire-london" },
      { label: "Cheap van Hire London", href: "/cheap-van-hire-london" },
      { label: "Removal van Hire London ", href: "/removal-van-hire-london" },
      { label: "Luton Van Hire London", href: "/luton-van-hire-london" },
    ],
  },
  {
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
  },
  { label: "ABOUT US", href: "/aboutus" },
  { label: "CONTACT", href: "/contact-us" },
  { label: "BLOGS", href: "/blog" },
  { label: "TERMS AND CONDITIONS", href: "/terms-and-conditions" },
];

const subscribeToHydration = () => () => {};
const getClientHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

function useHasHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    getClientHydratedSnapshot,
    getServerHydratedSnapshot,
  );
}

// Animated Hamburger Icon
function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="relative w-6 h-4 flex flex-col justify-between">
      <span
        className={`block h-0.5 w-full bg-current rounded-full transition-transform duration-200 origin-center ${
          isOpen ? "rotate-45 translate-y-2" : ""
        }`}
      />
      <span
        className={`block h-0.5 w-full bg-current rounded-full transition-opacity duration-200 ${
          isOpen ? "opacity-0" : ""
        }`}
      />
      <span
        className={`block h-0.5 w-full bg-current rounded-full transition-transform duration-200 origin-center ${
          isOpen ? "-rotate-45 -translate-y-2" : ""
        }`}
      />
    </div>
  );
}

// User Avatar Component
function UserAvatar({ name, imageUrl }: { name: string; imageUrl?: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#fe9a00] to-amber-600 flex items-center justify-center text-slate-900 font-bold text-sm shadow-lg shadow-amber-500/20">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name || "User avatar"}
          width={36}
          height={36}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { hasAnnouncement } = useAnnouncement();
  const hasHydrated = useHasHydrated();

  const navRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<(HTMLDivElement | null)[]>([]);

  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [categoryMenuItems, setCategoryMenuItems] = useState<
    NonNullable<MenuItem["children"]>
  >(fallbackCategoryMenuItems);
  const dashboardHref = canAccessDashboard(user?.role)
    ? "/dashboard"
    : "/customerDashboard";
  const userEmail =
    user?.emaildata?.emailAddress || user?.emailData?.emailAddress || "";

  const menuItems = useMemo<MenuItem[]>(() => {
    const vansMenu: MenuItem = {
      label: "OUR VANS",
      href: "/categories",
      children: [
        { label: "View all vans", href: "/categories" },
        ...categoryMenuItems,
      ],
    };

    return [
      ...staticMenuItems.slice(0, 4),
      vansMenu,
      ...staticMenuItems.slice(4),
    ];
  }, [categoryMenuItems]);

  // Keep the vans menu in sync with active categories from the dashboard.
  useEffect(() => {
    const controller = new AbortController();

    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories?status=active&mode=nav", {
          signal: controller.signal,
        });

        if (!response.ok) return;

        const payload = await response.json();
        const items = getCategoriesFromPayload(payload)
          .map(categoryToMenuItem)
          .filter((item): item is NonNullable<typeof item> => Boolean(item));

        if (items.length > 0) setCategoryMenuItems(items);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    };

    fetchCategories();
    return () => controller.abort();
  }, []);

  // Lazy load GSAP
  useEffect(() => {
    import("gsap").then((module) => {
      gsap = module.gsap;
      if (navRef.current) {
        gsap.fromTo(
          navRef.current,
          { opacity: 0 },
          { duration: 0.4, opacity: 1, ease: "power2.out" },
        );
      }
    });
  }, []);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Scroll detection with throttle
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 30);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setActiveDropdown(null);
    if (gsap) {
      gsap.to(overlayRef.current, {
        duration: 0.2,
        opacity: 0,
        pointerEvents: "none",
        ease: "power1.in",
      });
      gsap.to(menuRef.current, {
        duration: 0.25,
        x: "-100%",
        ease: "power2.in",
      });
    }
  }, []);

  const toggleMenu = useCallback(() => {
    if (!gsap) return;
    if (!isOpen) {
      setIsOpen(true);
      gsap.to(overlayRef.current, {
        duration: 0.25,
        opacity: 1,
        pointerEvents: "auto",
        ease: "power1.out",
      });
      gsap.to(menuRef.current, {
        duration: 0.3,
        x: 0,
        ease: "power2.out",
      });
      gsap.to(menuItemsRef.current, {
        duration: 0.2,
        opacity: 1,
        delay: 0.15,
        ease: "power1.out",
      });
    } else {
      closeMenu();
    }
  }, [closeMenu, isOpen]);

  const handleLogout = useCallback(() => {
    logout();
    setShowDropdown(false);
    closeMenu();
  }, [logout, closeMenu]);

  const navTopPosition = !hasAnnouncement
    ? "0px"
    : isScrolled
      ? "0px"
      : isMobile
        ? "32px"
        : "41px";

  // Hide on dashboard pages
  if (
    pathname.startsWith("/dashboard/blog/edit") ||
    pathname === "/customerDashboard" ||
    pathname === "/register" ||
    pathname === "/dashboard"
  ) {
    return null;
  }

  return (
    <>
      {/* Main Navbar */}
      <nav
        ref={navRef}
        className={`fixed w-full z-9999 transition-[background,box-shadow] duration-300 ${
          isScrolled
            ? "bg-[#0a0f1c]/50 backdrop-blur-md shadow-lg shadow-black/10"
            : "bg-linear-to-b from-[#0a0f1c]/10 to-[#0a0f1c]/20 backdrop-blur-sm"
        }`}
        style={{ top: navTopPosition, willChange: "transform" }}
      >
        {/* Simplified linear line at top */}
        <div
          className={`absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-[#fe9a00] to-transparent transition-opacity duration-300 ${
            isScrolled ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-16">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              {/* Menu Toggle */}
              <button
                onClick={toggleMenu}
                className={`relative text-white z-999 p-2 rounded-xl transition-colors duration-200 ${
                  isOpen
                    ? "bg-[#fe9a00] text-slate-900"
                    : "hover:bg-white/10 hover:text-[#fe9a00]"
                }`}
                aria-label="Toggle menu"
                aria-expanded={isOpen}
              >
                <HamburgerIcon isOpen={isOpen} />
              </button>

              {/* Logo - Desktop */}
              <Link href="/" className="hidden md:block">
                <Image
                  src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/newww.png"
                  alt="Success Van Hire"
                  width={200}
                  height={200}
                  className=" md:h-24 w-auto group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl"
                  priority
                />
              </Link>
            </div>

            {/* Center Logo - Mobile */}
            <Link href="/" className="md:hidden">
              <Image
                src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/newww.png"
                alt="Success Van Hire"
                width={200}
                height={200}
                className=" md:h-24 w-auto group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl"
                priority
              />
            </Link>

            {/* Right Section */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* User Section - Desktop */}
              <div className="hidden md:block">
                {user ? (
                  <div ref={dropdownRef} className="relative">
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors duration-200 ${
                        showDropdown ? "bg-white/10" : "hover:bg-white/5"
                      }`}
                    >
                      <UserAvatar name={user.name} imageUrl={user.avatar} />
                      <div className="hidden lg:block text-left">
                        <p className="text-white text-sm font-medium leading-tight">
                          {user.name} {user.lastName || ""}
                        </p>
                        <p className="text-white/50 text-xs">
                          {getRoleLabel(user.role)}
                        </p>
                      </div>
                      <FiChevronDown
                        size={16}
                        className={`text-white/60 transition-transform duration-200 ${
                          showDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    <div
                      className={`absolute right-0 mt-2 w-56 origin-top-right transition-all duration-200 ${
                        showDropdown
                          ? "opacity-100 scale-100 translate-y-0"
                          : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                      }`}
                    >
                      <div className="bg-[#141f38] rounded-2xl shadow-xl border border-white/10 overflow-hidden">
                        {/* User Info Header */}
                        <div className="p-4 bg-linear-to-br from-[#fe9a00]/10 to-transparent border-b border-white/5">
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              name={user.name}
                              imageUrl={user.avatar}
                            />
                            <div>
                              <p className="text-white font-medium text-sm">
                                {user.name} {user.lastName || ""}
                              </p>
                              <p className="text-white/50 text-xs">
                                {userEmail}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                          <Link
                            href={dashboardHref}
                            className="flex items-center gap-3 px-3 py-2.5 text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-colors duration-200"
                            onClick={() => setShowDropdown(false)}
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#fe9a00]/10 flex items-center justify-center">
                              <FiLayout size={16} className="text-[#fe9a00]" />
                            </div>
                            <span className="text-sm font-medium">
                              Dashboard
                            </span>
                            <FiChevronRight
                              size={14}
                              className="ml-auto opacity-50"
                            />
                          </Link>

                          <button
                            onClick={handleLogout}
                            aria-label="logout"
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-white/80 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors duration-200 mt-1"
                          >
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                              <FiLogOut size={16} className="text-red-400" />
                            </div>
                            <span className="text-sm font-medium">Logout</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/register"
                    className="flex items-center gap-2 px-4 py-2.5 text-white/80 hover:text-white rounded-xl hover:bg-white/5 transition-colors duration-200 font-medium text-sm"
                  >
                    <FiUser size={18} />
                    <span>Login</span>
                  </Link>
                )}
              </div>

              {/* CTA Button - Phone */}
              <Link
                id="gtm-navbar-call"
                href="tel:+442030111198"
                aria-label="Call us at +44 20 3011 1198"
                className="flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-linear-to-r from-[#fe9a00] to-amber-500 text-slate-900 font-bold rounded-xl transition-transform duration-200 shadow-lg shadow-amber-500/25 hover:scale-[1.02] text-sm"
              >
                <FiPhone size={18} />
                <span className="hidden md:block">+44 20 3011 1198</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay - simplified */}
      <div
        ref={overlayRef}
        onClick={closeMenu}
        className="fixed inset-0 bg-black/60 z-998 opacity-0 pointer-events-none"
        style={{ willChange: "opacity" }}
      />

      {/* Slide-In Menu */}
      <div
        ref={menuRef}
        className="fixed left-0 w-[320px] md:w-95 h-screen bg-linear-to-b from-[#141f38] via-[#0f172a] to-[#080d17] transform -translate-x-full z-999 shadow-xl overflow-hidden"
        style={{ willChange: "transform" }}
      >
        {/* Scrollable Content */}
        <div
          className={`relative h-full ${
            isScrolled ? "mt-16" : "mt-20"
          } overflow-y-auto`}
        >
          {/* Menu Items */}
          <div className="px-4 space-y-1 overflow-visible">
            {hasHydrated
              ? menuItems.map((item, index) => (
                  <div
                    key={item.label}
                    ref={(el) => {
                      menuItemsRef.current[index] = el;
                    }}
                    className="relative overflow-visible"
                    style={{ opacity: isOpen ? 1 : 0 }}
                  >
                    {item.children ? (
                      <>
                        <button
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === item.label ? null : item.label,
                            )
                          }
                          aria-label={`Toggle ${item.label} submenu`}
                          onMouseEnter={() => setHoveredItem(item.label)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className={`flex items-center justify-between w-full text-sm md:text-base font-semibold py-2 px-4 rounded-xl transition-colors duration-200 ${
                            activeDropdown === item.label
                              ? "bg-[#fe9a00]/10 text-[#fe9a00]"
                              : "text-white hover:bg-white/5 hover:text-[#fe9a00]"
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <span
                              className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                                activeDropdown === item.label ||
                                hoveredItem === item.label
                                  ? "bg-[#fe9a00]"
                                  : "bg-white/30"
                              }`}
                            />
                            {item.label}
                          </span>
                          <FiChevronDown
                            size={18}
                            className={`transition-transform duration-200 ${
                              activeDropdown === item.label ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {/* Submenu */}
                        <div
                          className={`overflow-hidden transition-all duration-300 ease-out ${
                            activeDropdown === item.label
                              ? "max-h-150 opacity-100"
                              : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="ml-4 mt-1 mb-2 pl-4 border-l-2 border-[#fe9a00]/20 space-y-0.5 max-h-112.5 overflow-y-auto custom-scrollbar pr-2">
                            {item.children?.map((child) => (
                              <Link
                                key={child.label}
                                href={child.href}
                                className={`flex items-center gap-3 px-4 py-2 text-xs rounded-lg transition-colors duration-200 ${
                                  pathname === child.href
                                    ? "text-[#fe9a00] bg-[#fe9a00]/10"
                                    : "text-white/70 hover:text-[#fe9a00] hover:bg-[#fe9a00]/5"
                                }`}
                                onClick={closeMenu}
                              >
                                <FiChevronRight
                                  size={12}
                                  className="opacity-50"
                                />
                                <span>{child.label}</span>
                                {pathname === child.href && (
                                  <span className="ml-auto text-xs bg-[#fe9a00]/20 text-[#fe9a00] px-2 py-0.5 rounded-full">
                                    Active
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={closeMenu}
                        onMouseEnter={() => setHoveredItem(item.label)}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={`relative flex items-center gap-3 text-sm md:text-base font-semibold py-2 px-4 rounded-xl transition-all duration-200 ${
                          pathname === item.href
                            ? "bg-[#fe9a00]/10 text-[#fe9a00]"
                            : item.label.includes("Tagore")
                              ? "text-white hover:bg-linear-to-r hover:from-[#fe9a00]/20 hover:to-amber-500/20 hover:text-[#fe9a00] overflow-visible group"
                              : "text-white hover:bg-white/5 hover:text-[#fe9a00]"
                        }`}
                      >
                        {item.label.includes("Tagore") && (
                          <span className="absolute -top-2 -right-2 bg-linear-to-r from-[#fe9a00] to-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg z-50 animate-pulse">
                            10% OFF
                          </span>
                        )}
                        <span
                          className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                            pathname === item.href || hoveredItem === item.label
                              ? "bg-[#fe9a00]"
                              : "bg-white/30"
                          }`}
                        />
                        {item.icon && (
                          <span className="relative z-10">{item.icon}</span>
                        )}
                        <span className="relative z-10">{item.label}</span>
                        {pathname === item.href && (
                          <span className="ml-auto text-xs bg-[#fe9a00]/20 text-[#fe9a00] px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </Link>
                    )}
                  </div>
                ))
              : null}
          </div>

          {/* Quick Contact Section */}
          <div className="md:mt-8 mt-4 mx-4 p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="space-y-3">
              <a
                href="tel:+442030111198"
                className="flex items-center gap-3 text-white/80 hover:text-[#fe9a00] transition-colors duration-200"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-[#fe9a00]/10 flex items-center justify-center">
                  <FiPhone size={18} className="text-[#fe9a00]" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium">
                    +44 20 3011 1198
                  </p>
                  <p className="text-[10px] md:text-xs text-white/40">
                    Call us anytime
                  </p>
                </div>
              </a>

              <a
                href="https://maps.google.com/?q=Strata+House+Waterloo+Road+London+NW2+7UH"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-white/80 hover:text-[#fe9a00] transition-colors duration-200"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-[#fe9a00]/10 flex items-center justify-center">
                  <FiMapPin size={18} className="text-[#fe9a00]" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium">London, UK</p>
                  <p className="text-[10px] md:text-xs text-white/40">
                    Strata House,Waterloo Road, London, NW2 7UH
                  </p>
                </div>
              </a>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 md:mt-6 mt-1 p-4 bg-linear-to-t from-[#080d17] via-[#080d17] to-transparent">
            {user ? (
              <div className="flex gap-3">
                <Link
                  href={dashboardHref}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors duration-200 font-medium text-sm border border-white/10"
                  onClick={closeMenu}
                >
                  <FiLayout size={18} />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors duration-200 font-medium text-sm border border-red-500/20"
                >
                  <FiLogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link
                  href="/register"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors duration-200 font-medium text-sm border border-white/10"
                  onClick={closeMenu}
                >
                  <FiUser size={18} />
                  Login
                </Link>
                <Link
                  href="/reservation"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-[#fe9a00] to-amber-500 text-slate-900 rounded-xl transition-colors duration-200 font-bold text-sm"
                  onClick={closeMenu}
                >
                  <HiSparkles size={18} />
                  Reserve
                  <FiArrowRight size={16} />
                </Link>
              </div>
            )}

            {/* Copyright */}
            <p className="text-center text-white/30 text-xs mt-4">
              © {new Date().getFullYear()} SuccessVan. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
