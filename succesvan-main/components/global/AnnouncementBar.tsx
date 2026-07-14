"use client";

import useSWR from "swr";
import { FiExternalLink, FiChevronRight } from "react-icons/fi";
import { useState, useEffect, createContext, useContext, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface Announcement {
  _id: string;
  text: string;
  link?: string;
  textColor: string;
  backgroundColor: string;
  isActive: boolean;
  type?: "info" | "warning" | "success" | "promo" | "urgent";
  emoji?: string;
}

interface AnnouncementContextType {
  hasAnnouncement: boolean;
  cachedAnnouncement?: Announcement | null;
}

const AnnouncementContext = createContext<AnnouncementContextType>({
  hasAnnouncement: false,
  cachedAnnouncement: null,
});

export function useAnnouncement() {
  return useContext(AnnouncementContext);
}

// Export separate provider component for layout-level context
const ANNOUNCEMENT_CACHE_KEY = "cachedAnnouncements";
const ANNOUNCEMENT_DATA_VERSION = "v1";

export function AnnouncementProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Try to get cached data from localStorage first
  const [cachedData, setCachedData] = useState<
    { data: Announcement[] } | undefined
  >(undefined);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cached data on mount
  useEffect(() => {
    const cached = localStorage.getItem(ANNOUNCEMENT_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.version === ANNOUNCEMENT_DATA_VERSION && parsed.data) {
          setCachedData({ data: parsed.data });
        }
      } catch {
        // Ignore parse errors
      }
    }
    setIsHydrated(true);
  }, []);

  // Fetch fresh data, but don't show loading state
  const { data } = useSWR<{ data: Announcement[] }>(
    "/api/announcements",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      fallbackData: cachedData as { data: Announcement[] } | undefined, // Use cached data while loading
      onSuccess: (newData) => {
        // Cache the fresh data
        try {
          localStorage.setItem(
            ANNOUNCEMENT_CACHE_KEY,
            JSON.stringify({
              version: ANNOUNCEMENT_DATA_VERSION,
              data: newData.data,
              timestamp: Date.now(),
            }),
          );
        } catch {
          // Ignore storage errors
        }
      },
    },
  );

  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("dismissedAnnouncements");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setDismissed(parsed);
        } else {
          const validDismissals = Object.keys(parsed);
          setDismissed(validDismissals);
        }
      } catch {
        setDismissed([]);
      }
    }
  }, []);

  // Use data from SWR (which has cached data as fallback)
  const announcements = data?.data || [];
  const activeAnnouncements = announcements.filter(
    (a: Announcement) => a.isActive,
  );
  const active = activeAnnouncements.filter(
    (a: Announcement) => !dismissed.includes(a._id),
  );

  // Show no announcement until hydrated, then based on actual data
  const hasAnnouncement = isHydrated && active.length > 0;

  // Get first active announcement for caching
  const firstActiveAnnouncement = active.length > 0 ? active[0] : null;

  return (
    <AnnouncementContext.Provider
      value={{
        hasAnnouncement,
        cachedAnnouncement: firstActiveAnnouncement,
      }}
    >
      {children}
    </AnnouncementContext.Provider>
  );
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AnnouncementBar() {
  const pathname = usePathname();

  // Get from context
  const { cachedAnnouncement } = useAnnouncement();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const barRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  // Load dismissed
  useEffect(() => {
    const stored = localStorage.getItem("dismissedAnnouncements");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDismissed(Array.isArray(parsed) ? parsed : Object.keys(parsed));
      } catch {
        setDismissed([]);
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Use cached announcement if available and not dismissed
  const announcement =
    cachedAnnouncement && !dismissed.includes(cachedAnnouncement._id)
      ? cachedAnnouncement
      : null;

  // No announcement to show
  if (!announcement) {
    return null;
  }

  const textContent = (
    <span className="flex items-center gap-2">
      {announcement.link ? (
        <Link
          href={announcement.link}
          id="gtm-announcement-learn-more"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Learn more about ${announcement.text}`}
          className="group inline-flex items-center gap-2 text-white text-sm md:text-base font-medium hover:text-white/90 transition-colors"
        >
          <span className="border-b border-white/30 group-hover:border-white/60 transition-colors">
            {/https?:\/\/|www\.|\.(co\.uk|com|net|org)/i.test(announcement.text)
              ? `Learn more: ${announcement.text}`
              : announcement.text}
          </span>
          <FiExternalLink
            size={14}
            className="opacity-70 group-hover:opacity-100 transition-opacity"
          />
        </Link>
      ) : (
        <span className="text-white text-sm md:text-base font-medium">
          {announcement.text}
        </span>
      )}
    </span>
  );

  if (
    pathname === "/dashboard" ||
    pathname === "/customerDashboard" ||
    pathname === "/register"
  ) {
    return null;
  }

  return (
    <>
      <div
        ref={barRef}
        className={`
          w-full relative overflow-hidden transition-all duration-300 ease-out
          ${
            !isVisible
              ? "opacity-0 -translate-y-full"
              : "opacity-100 translate-y-0"
          }
        `}
        style={{
          animation: isVisible ? "slideDown 0.4s ease-out" : undefined,
        }}
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: announcement.backgroundColor }}
        />

        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-size-[16px_16px]" />

        <div className="relative py-1 px-4 md:px-6 flex items-center gap-4">
          {announcement.emoji && (
            <span className="text-xl hidden sm:block shrink-0">
              {announcement.emoji}
            </span>
          )}

          <div
            className="flex-1 overflow-hidden scrollbar-hide"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              className={`
                inline-flex items-center gap-8 whitespace-nowrap
                ${!isPaused ? "animate-marquee" : ""}
              `}
              style={{
                animationPlayState: isPaused ? "paused" : "running",
              }}
            >
              {textContent}
              <span className="text-white/40 mx-4">•</span>
              {textContent}
              <span className="text-white/40 mx-4">•</span>
              {textContent}
            </div>
          </div>

          {announcement.link && (
            <Link
              href={announcement.link}
              id="gtm-announcement-learn-more"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Learn more about ${announcement.text}`}
              className="
                hidden md:flex items-center gap-1.5
                px-4 py-1.5 rounded-full
                bg-white/20 hover:bg-white/30
                backdrop-blur-sm
                text-white text-sm font-semibold
                transition-all duration-200
                hover:scale-105 active:scale-95
                border border-white/20
                group shrink-0
              "
            >
              <span>
                {announcement.text.length > 40
                  ? `Learn more about: ${announcement.text.substring(0, 37)}...`
                  : `Learn more about: ${announcement.text}`}
              </span>
              <FiChevronRight
                size={14}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
        
        .animate-marquee {
          animation: marquee 10s linear infinite;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}
