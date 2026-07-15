import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // CommonJS SDKs with dynamic internal requires that bundlers can't resolve
  serverExternalPackages: ["docusign-esign", "pdfkit"],

  experimental: {
    optimizeCss: true,
  },



  // REDIRECTING
  async redirects() {
    return [
      // 301 (دائمی) برای SEO
      {
        source: "/contact",
        destination: "/contact-us",
        permanent: true,

      },



      {
        source: "/last-minute-automatic-van-hire-brent-cross",
        destination:
          "/success-van-hire-van-rental-in-brent-cross-london-last-minute-bookings",
        permanent: true,
      },

      {
        source: "/our-vehicles",
        destination: "/reservation",
        permanent: true,
      },
      {
        source: "/luton-van-hire-london-prices-a-2026-guide",
        destination: "/blog/luton-van-hire-london-prices-a-2026-guide",
        permanent: true,
      },
      {
        source: "/luton-van-vs-long-wheelbase-van-best-choice-2026",
        destination: "/blog/luton-van-vs-long-wheelbase-van-best-choice-2026",
        permanent: true,
      },
      {
        source: "/automatic-van-hire-london/feed/",
        destination: "/automatic-van-hire-london",
        permanent: true,
      },
      {
        source: "/How-to-Hire-a-Van-in-London",
        destination: "/blog/How-to-Hire-a-Van-in-London",
        permanent: true,
      },

      {
        source: "/faq",
        destination: "/contact-us",
        permanent: true,
      },
      {
        source: "/&",
        destination: "/",
        permanent: true,
      },
      {
        source: "/$",
        destination: "/",
        permanent: true,
      },
      {
        source: "/17-seater-minibus-hire-nw-london",
        destination: "/reservation",
        permanent: true,
      },
      {
        source: "/blog/hiring-vans-in-london-your-complete-guide-for-2026",
        destination: "/blog/How-to-Hire-a-Van-in-London",
        permanent: true,
      },

      {
        source: "/discover-the-ease-and-affordability-of-automatic-van-hire-with-success-van-hire-in-nw-london/",
        destination: "/automatic-van-hire-london",
        permanent: true,
      },
      {
        source: "/automatic-van-rental-north-west-london/",
        destination: "/automatic-van-hire-london",
        permanent: true,
      },
      {
        source: "/reviews",
        destination: "/aboutus",
        permanent: true,
      },
      {
        source: "/van-hire-brent-cross",
        destination: "/success-van-hire-van-rental-in-brent-cross-london-last-minute-bookings",
        permanent: true,
      },
      {
        source: "/van-hire-willesden",
        destination: "/van-hire-willesden-green",
        permanent: true,
      },
      {
        source: "/local-van-rental-golders-green-a-seamless-journey-with-success-van-hire/",
        destination: "/van-hire-golders-green",
        permanent: true,
      },
      {
        source: "/van-hire-kingsbury",
        destination: "/",
        permanent: true,
      },
      {
        source: "/van-hire-wembley-2-2/",
        destination: "/van-hire-wembley",
        permanent: true,
      },
      {
        source: "/car-hire-nw-london/",
        destination: "/van-hire-north-west-london",
        permanent: true,
      },
      {
        source: "/affordable-self-drive-minibus-hire-in-london-success-van-hire/",
        destination: "/minibus-hire-london",
        permanent: true,
      },
      {
        source: "/blog/about-van-hire-in-london",
        destination: "/blog/Van-Hire-London-Open-Now-Same-Day-Booking-Guide",
        permanent: true,
      },
      {
        source: "/blog/ultimate-van-hire-guide-in-london-2026-top-tips-trends",
        destination: "/blog/van-hire-london-prices-in-2026-daily-weekly-monthly-rates",
        permanent: true,
      },
      {
        source: "/self-drive-van-minibus-hire-in-northwest-london-success-van-hire",
        destination: "/minibus-hire-london",
        permanent: true,
      },
      {
        source: "/starting-a-van-rental-business-a-comprehensive-guide/",
        destination: "/",
        permanent: true,
      },
      {
        source: "/minibus-hire-for-tagore-jayanti-in-london",
        destination: "/minibus-hire-london",
        permanent: true,
      },
      {
        source: "/effortlessly-move-into-a-new-flat-in-london-2026-guide",
        destination: "/blog/effortlessly-move-into-a-new-flat-in-london-2026-guide",
        permanent: true,
      },
      {
        source: "/luton-van-carrying-capacity-guide-2026-maximize-your-move",
        destination: "/blog/luton-van-carrying-capacity-guide-2026-maximize-your-move",
        permanent: true,
      },
      {
        source: "/safely-move-a-sofa-in-a-van-no-damage-tips-2026",
        destination: "/blog/safely-move-a-sofa-in-a-van-no-damage-tips-2026",
        permanent: true,
      },
      {
        source: "/top-occasions-for-minibus-hire-in-london-2026",
        destination: "/blog/top-occasions-for-minibus-hire-in-london-2026",
        permanent: true,
      },
      {
        source: "/how-to-move-a-fridge-using-a-rental-van-in-2026",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/top-7-reasons-to-choose-local-van-hire-in-2026",
        destination: "/blog/top-7-reasons-to-choose-local-van-hire-in-2026",
        permanent: true,
      },
      {
        source: "/minibus-hire-london-guide-2026-essential-tips-info",
        destination: "/blog/minibus-hire-london-guide-2026-essential-tips-info",
        permanent: true,
      },
      {
        source: "/can-i-hire-a-van-at-21-in-london-uk-age-rules-2026",
        destination: "/blog/can-i-hire-a-van-at-21-in-london-uk-age-rules-2026",
        permanent: true,
      },
      {
        source: "/choosing-the-right-van-hire-in-2026-avoid-overpaying",
        destination: "/blog/choosing-the-right-van-hire-in-2026-avoid-overpaying",
        permanent: true,
      },
      {
        source: "/van-hire-near-me-costs-in-2026-full-breakdown",
        destination: "/van-hire-near-me",
        permanent: true,
      },

    ];
  },

  // S3
  images: {
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vhsbuckets3.s3.eu-north-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "svh-bucket-s3.s3.eu-west-2.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.s3.eu-west-2.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.s3.eu-north-1.amazonaws.com",
        pathname: "/**",
      },
    ],
  },



  // Turbopack configuration (required for Next.js 16+)
  turbopack: {},
};

// PWA Configuration - only for webpack build
const withPWA = (config: NextConfig): NextConfig => {
  // Dynamic import to avoid webpack-only code in Turbopack
  if (process.env.TURBOPACK) {
    console.log("PWA disabled in Turbopack mode");
    return config;
  }

  try {
    const nextPWA = require("next-pwa");
    return nextPWA({
      dest: "public",
      register: true,
      skipWaiting: true,
      disable: process.env.NODE_ENV === "development",
      runtimeCaching: [
        {
          urlPattern: /^https?.*\/api\/.*/i,
          handler: "NetworkFirst",
          options: {
            cacheName: "api-cache",
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https?.*\.(png|jpg|jpeg|svg|gif|webp|avif)/i,
          handler: "CacheFirst",
          options: {
            cacheName: "image-cache",
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https?.*\.(js|css|woff|woff2|ttf|eot)/i,
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "static-cache",
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 * 30,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https?.*/i,
          handler: "NetworkFirst",
          options: {
            cacheName: "pages-cache",
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    })(config);
  } catch (e) {
    console.log("PWA not available:", e);
    return config;
  }
};

export default withPWA(nextConfig);
