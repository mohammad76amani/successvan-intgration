import { Inter, JetBrains_Mono } from "next/font/google";
import { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/global/Navbar";
import Footer from "@/components/global/footer";
import AnnouncementBar, { AnnouncementProvider } from "@/components/global/AnnouncementBar";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import Script from "next/script";
import Breadcrumbs from "@/components/global/breadcrumbs";
import ClockGuard from "@/components/global/ClockGuard";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
  adjustFontFallback: true, // ✅ کاهش CLS
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  alternates: {
    canonical: "/",
  },
  title: "SuccessVan - Van Hire & Rental in London | Last Minute Bookings",
  description:
    "Premium van hire and rental services in North West London. Book your van today with SuccessVan - serving Cricklewood, Golders Green, Hampstead, Hendon, Mill Hill, Wembley and more.",
  keywords:
    "van hire London, van rental, last minute van hire, North West London, Cricklewood, Golders Green, Hampstead, Hendon, Mill Hill, Wembley",
  authors: [{ name: "SuccessVan" }],
  applicationName: "SuccessVan",
  creator: "SuccessVan",
  publisher: "SuccessVan",
  robots: "index, follow",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://successvanhire.co.uk/",
    siteName: "SuccessVan",
    title: "SuccessVan - Van Hire & Rental in London",
    description: "Premium van hire and rental services in North West London",
    images: [
      {
        url: "https://successvanhire.co.uk/icon.png",
        width: 512,
        height: 512,
        alt: "SuccessVan - Van Hire London",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "SuccessVan - Van Hire & Rental in London",
    description: "Premium van hire and rental services in North West London",
    images: ["https://successvanhire.co.uk/icon.png"],
  },
  appleWebApp: {
    capable: true,
    title: "SuccessVan",
    statusBarStyle: "black-translucent",
    startupImage: [
      {
        url: "/android-chrome-512x512.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#fe9a00",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        <link
          rel="preconnect"
          href="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com"
        />

        {/* ✅ Preload فقط LCP image - مهم‌ترین تصویر */}
        <link
          rel="preload"
          as="image"
          href="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/poster.webp"
          type="image/webp"
          fetchPriority="high"
          imageSizes="100vw"
        />
        <meta name="theme-color" content="#fe9a00" />
        <meta name="application-name" content="SuccessVan" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="SuccessVan" />
        <meta name="msapplication-TileColor" content="#fe9a00" />
         <Script
          id="gtm-script"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
          (function(w,d,s,l,i){w[l]=w[l]=[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-54WH9BWV');
        `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased custom-scrollbar`}
      >
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-54WH9BWV"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <AuthProvider>
          <AnnouncementProvider>
            <ClockGuard />
            <AnnouncementBar />
            <Breadcrumbs />
            <Navbar />
            <Toaster position="bottom-center" />
            {/* <MobileAppPrompt /> */}

            {/* <ErrorBoundary> */}
            <main id="main-content">{children}</main>
            {/* </ErrorBoundary> */}
            <Footer />
            {/* <FloatingActionMenu /> */}
          </AnnouncementProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
