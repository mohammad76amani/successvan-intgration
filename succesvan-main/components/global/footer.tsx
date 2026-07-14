// components/Footer.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { memo } from "react";

// ============ Hidden Routes ============
const HIDDEN_ROUTES = new Set([
  "/terms-and-conditions",
  "/register",
  "/dashboard",
  "/customerDashboard",
]);

// ============ Inline SVG Icons (سبک‌ترین راه) ============
const PhoneIcon = memo(() => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
));
PhoneIcon.displayName = "PhoneIcon";

const MailIcon = memo(() => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
));
MailIcon.displayName = "MailIcon";

const MapPinIcon = memo(() => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
));
MapPinIcon.displayName = "MapPinIcon";

const ClockIcon = memo(() => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
));
ClockIcon.displayName = "ClockIcon";

const ArrowRightIcon = memo(() => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
));
ArrowRightIcon.displayName = "ArrowRightIcon";

const CheckIcon = memo(() => (
  <svg
    className="w-7 h-7 text-[#fe9a00]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
));
CheckIcon.displayName = "CheckIcon";

// ============ Social Icons (inline برای حذف react-icons) ============
const FacebookIcon = memo(() => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
));
FacebookIcon.displayName = "FacebookIcon";

const InstagramIcon = memo(() => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
));
InstagramIcon.displayName = "InstagramIcon";

const XIcon = memo(() => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
));
XIcon.displayName = "XIcon";

const YoutubeIcon = memo(() => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
));
YoutubeIcon.displayName = "YoutubeIcon";

const WhatsappIcon = memo(() => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.157 5.335 5.493 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
));
WhatsappIcon.displayName = "WhatsappIcon";

const HomeIcon = memo(() => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
));
HomeIcon.displayName = "HomeIcon";

const VanIcon = memo(() => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 7h11v10H3z" />
    <path d="M14 10h4l3 3v4h-7z" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="18" cy="18" r="2" />
  </svg>
));
VanIcon.displayName = "VanIcon";

const MessageIcon = memo(() => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
));
MessageIcon.displayName = "MessageIcon";

const InfoIcon = memo(() => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
));
InfoIcon.displayName = "InfoIcon";

const HelpIcon = memo(() => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
));
HelpIcon.displayName = "HelpIcon";

const FileTextIcon = memo(() => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
));
FileTextIcon.displayName = "FileTextIcon";

const FilePlusIcon = memo(() => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
));
FilePlusIcon.displayName = "FilePlusIcon";

// ============ Data ============
const menuLinks = [
  { name: "HOME", href: "/", Icon: HomeIcon },
  { name: "OUR VANS", href: "/categories", Icon: VanIcon },
  { name: "CONTACT", href: "/contact-us", Icon: MessageIcon },
  { name: "ABOUT", href: "/aboutus", Icon: InfoIcon },
  { name: "BLOG", href: "/blog", Icon: HelpIcon },
  { name: "TERMS & CONDITIONS", href: "/terms-and-conditions", Icon: FileTextIcon },
  { name: "POLICY", href: "/policy", Icon: FilePlusIcon },
] as const;

const socialLinks = [
  {
    name: "Facebook",
    Icon: FacebookIcon,
    href: "https://www.facebook.com/topvanhire",
    color: "#1877F2",
    className: "social-facebook",
  },
  {
    name: "Instagram",
    Icon: InstagramIcon,
    href: "https://www.instagram.com/success.van.hire",
    color: "#E4405F",
    className: "social-instagram",
  },
  {
    name: "X (Twitter)",
    Icon: XIcon,
    href: "https://twitter.com/MatinDiba?t=GKR1BWNSQK6yB2Rj4W5Jhg&s=09",
    color: "#ffffff",
    className: "social-x",
  },
  {
    name: "YouTube",
    Icon: YoutubeIcon,
    href: "https://youtube.com/channel/UCTSPTUFbkBJSHu5oLiXTJAQ",
    color: "#FF0000",
    className: "social-youtube",
  },
  {
    name: "WhatsApp",
    Icon: WhatsappIcon,
    href: "https://api.whatsapp.com/send/?phone=447915193000&text=Hello%2C+I+need+help%21&type=phone_number&app_absent=0",
    color: "#25D366",
    className: "social-whatsapp",
  },
] as const;

// ============ Social Link Component ============
const SocialLink = memo(function SocialLink({
  social,
}: {
  social: (typeof socialLinks)[number];
}) {
  const { Icon } = social;
  return (
    <a
      href={social.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Follow us on ${social.name}`}
      className={`social-icon ${social.className}`}
    >
      <Icon />
    </a>
  );
});

// ============ Menu Link Component ============
const MenuLink = memo(function MenuLink({
  link,
  isActive,
}: {
  link: (typeof menuLinks)[number];
  isActive: boolean;
}) {
  const { Icon } = link;
  return (
    <li>
      <Link
        href={link.href}
        prefetch={false}
        className={`footer-menu-link ${isActive ? "footer-menu-link-active" : ""}`}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon />
        <span className="font-semibold text-sm">{link.name}</span>
        {isActive && (
          <span className="ml-1 inline-flex h-1.5 w-1.5 rounded-full bg-[#fe9a00]" aria-hidden="true" />
        )}
      </Link>
    </li>
  );
});

// ============ Main Component ============
function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // ✅ Early return با Set lookup (O(1))
  if (pathname && HIDDEN_ROUTES.has(pathname)) {
    return null;
  }

    

  return (
    <>
     

      <footer
        className="relative bg-[#0f172b] overflow-hidden border-t border-white/10"
        role="contentinfo"
      >
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-linear-to-t from-[#020617]/50 via-transparent to-transparent" aria-hidden="true" />
        <div className="absolute inset-0 bg-linear-to-r from-[#020617] via-transparent to-[#020617]" aria-hidden="true" />

        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 md:pt-2 pb-10 md:pb-14">
            {/* Top: Logo & Tagline */}
            <div className="mb-12 md:mb-16 text-center">
              <Link
                href="/"
                prefetch={false}
                className="inline-flex flex-col items-center group mb-2 md:mb-6"
                aria-label="Success Van Hire - Home"
              >
                <Image
                  src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/newww.png"
                  alt="Success Van Hire"
                  width={200}
                  height={200}
                  className="h-30 md:h-40 w-auto group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl"
                  loading="lazy"
                  sizes="200px"
                  quality={75}
                />
                <span className="md:-mt-10 -mt-6 inline-flex items-center gap-2 rounded-full border border-[#fe9a00]/30 bg-black/20 px-4 py-1 text-[8px] uppercase tracking-[0.18em] text-[#fbbf24]">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#22c55e]" aria-hidden="true" />
                  Trusted Self-Drive Van &amp; Minibus Hire in London
                </span>
              </Link>
              <p className="text-gray-400 text-xs sm:text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
                Clean, reliable vehicles. Transparent pricing. Easy online
                booking. Everything you need to keep your move or journey on
                track.
              </p>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-14 md:mb-16">
              {/* Contact Info */}
              <section aria-labelledby="footer-contact">
                <h3 id="footer-contact" className="text-white text-lg md:text-xl font-black mb-5 flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-[#fe9a00] rounded-full" aria-hidden="true" />
                  CONTACT INFO
                </h3>
                <ul className="space-y-5">
                  <li>
                    <a
                      href="tel:+442030111198"
                      aria-label="Call us at +44 20 3011 1198"
                      className="footer-contact-link"
                    >
                      <div className="footer-icon-box">
                        <PhoneIcon />
                      </div>
                      <div>
                        <div className="text-[10px] md:text-xs text-gray-500 mb-1 font-semibold uppercase tracking-[0.18em]">
                          Car Rental Office
                        </div>
                        <div className="font-bold text-sm md:text-base">
                          +44 20 3011 1198
                        </div>
                      </div>
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:Info@successvanhire.com"
                      aria-label="Email us"
                      className="footer-contact-link"
                    >
                      <div className="footer-icon-box">
                        <MailIcon />
                      </div>
                      <div>
                        <div className="text-[10px] md:text-xs text-gray-500 mb-1 font-semibold uppercase tracking-[0.18em]">
                          Email
                        </div>
                        <div className="font-bold text-sm md:text-base break-all">
                          Info@successvanhire.com
                        </div>
                      </div>
                    </a>
                  </li>
                </ul>
              </section>

              {/* Address */}
              <section aria-labelledby="footer-address">
                <h3 id="footer-address" className="text-white text-lg md:text-xl font-black mb-5 flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-[#fe9a00] rounded-full" aria-hidden="true" />
                  ADDRESS
                </h3>
                <div className="footer-contact-link">
                  <div className="footer-icon-box">
                    <MapPinIcon />
                  </div>
                  <div>
                    <div className="text-[10px] md:text-xs text-gray-500 mb-2 font-semibold uppercase tracking-[0.18em]">
                      Our Location
                    </div>
                    <address className="not-italic font-bold text-sm md:text-base leading-relaxed text-gray-400">
                      Strata House, Waterloo Road,
                      <br />
                      London, NW2 7UH
                    </address>
                    <a
                      href="https://maps.google.com/?q=Strata+House+Waterloo+Road+London+NW2+7UH"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer-directions-link"
                      aria-label="Get directions on Google Maps (opens in new tab)"
                    >
                      Get Directions
                      <ArrowRightIcon />
                    </a>
                  </div>
                </div>
              </section>

              {/* Service Hours */}
              <section aria-labelledby="footer-hours">
                <h3 id="footer-hours" className="text-white text-lg md:text-xl font-black mb-5 flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-[#fe9a00] rounded-full" aria-hidden="true" />
                  SERVICE HOURS
                </h3>
                <div className="flex items-start gap-4">
                  <div className="footer-icon-box-static">
                    <ClockIcon />
                  </div>
                  <dl className="space-y-3 w-full">
                    <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/10">
                      <dt className="text-gray-400 font-semibold text-xs md:text-sm">
                        Monday - Friday
                      </dt>
                      <dd className="text-[#fe9a00] font-bold text-xs md:text-sm whitespace-nowrap">
                        9:00 AM - 6:00 PM
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/10">
                      <dt className="text-gray-400 font-semibold text-xs md:text-sm">
                        Saturday
                      </dt>
                      <dd className="text-[#fe9a00] font-bold text-xs md:text-sm whitespace-nowrap">
                        10:00 AM - 4:00 PM
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-gray-400 font-semibold text-xs md:text-sm">
                        Sunday
                      </dt>
                      <dd className="text-red-400 font-bold text-xs md:text-xs">
                        09:00 AM - 14:00 PM (With Extra)
                      </dd>
                    </div>
                  </dl>
                </div>
              </section>

              {/* Quick Links */}
              <nav aria-labelledby="footer-links">
                <h3 id="footer-links" className="text-white text-lg md:text-xl font-black mb-5 flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-[#fe9a00] rounded-full" aria-hidden="true" />
                  QUICK LINKS
                </h3>
                <ul className="space-y-3">
                  {menuLinks.map((link) => (
                    <MenuLink
                      key={link.href}
                      link={link}
                      isActive={pathname === link.href}
                    />
                  ))}
                </ul>
              </nav>
            </div>

            {/* Social Section */}
            <div className="mb-10 md:mb-12">
              <div className="footer-social-box relative px-4 py-9 md:p-8 rounded-3xl border overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-r from-[#fe9a00]/5 via-transparent to-[#fe9a00]/5" aria-hidden="true" />
                <div className="relative text-center">
                  <h3 className="text-white text-lg md:text-2xl font-black mb-2 md:mb-3">
                    Follow Us on Social Media
                  </h3>
                  <p className="text-gray-400 mb-6 text-xs md:text-sm">
                    Stay connected for the latest vehicle availability, offers,
                    and updates.
                  </p>
                  <ul
                    className="grid grid-cols-5 items-center justify-center gap-4 md:gap-10 max-w-md mx-auto list-none"
                    role="list"
                  >
                    {socialLinks.map((social) => (
                      <li key={social.name} className="flex justify-center">
                        <SocialLink social={social} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative mb-6 md:mb-8" aria-hidden="true">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <div className="px-5 py-2.5 bg-[#020617] rounded-full border border-white/10 shadow-lg shadow-black/40">
                  <CheckIcon />
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 text-center md:text-left">
                <div className="text-gray-500 text-xs md:text-sm leading-relaxed">
                  © {currentYear}{" "}
                  <span className="text-[#fe9a00] font-bold">
                    SuccessVanHire
                  </span>
                  , Inc.
                  <br className="md:hidden" />
                  <span className="hidden md:inline mx-2">•</span>
                  <span>All rights reserved.</span>
                </div>
                <div className="mt-3 md:mt-0 md:ml-6 text-sm">
                  <Link
                    href="/policy#cookie-settings"
                    prefetch={false}
                    className="text-gray-400 hover:text-[#fe9a00] font-semibold transition-colors"
                  >
                    Cookie settings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default memo(Footer);
