// app/van-hire-ealing/page.tsx

import { Metadata } from "next";
import Script from "next/script";
import EalingVanHireStatic from "@/components/static/areas/ealing";
import { ealingSchema, ealingFAQSchema } from "@/lib/schema";

const PAGE_URL = "https://successvanhire.co.uk/van-hire-ealing";
const OG_IMAGE =
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/ealing.webp";

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),

  title: "Van Hire Ealing | Local Van Rental West London from £78/Day",

  description:
    "Book van hire in Ealing from £78/day. Self-drive vans for house moves, furniture pickup, business deliveries and Luton van hire near Ealing Broadway.",

  keywords: [
    "van hire Ealing",
    "van rental Ealing",
    "Ealing van hire",
    "van hire Ealing London",
    "van rental Ealing London",
    "local van hire Ealing",
    "self drive van hire Ealing",
    "cheap van hire Ealing",
    "Luton van hire Ealing",
    "moving van hire Ealing",
    "removal van hire Ealing",
    "van hire West London",
    "van rental West London",
    "van hire near Ealing Broadway",
    "van hire near Acton",
    "van hire near Chiswick",
  ],

  openGraph: {
    title: "Van Hire Ealing | Local Van Rental West London from £78/Day",
    description:
      "Reliable self-drive van hire in Ealing for house moves, furniture pickup, business deliveries and Luton van hire across West London.",
    url: PAGE_URL,
    type: "website",
    siteName: "Success Van Hire",
    locale: "en_GB",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Van hire Ealing West London with local van rental options",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire Ealing | Local Van Rental West London from £78/Day",
    description:
      "Affordable self-drive van hire in Ealing for house moves, furniture pickup, business deliveries and Luton van hire near Ealing Broadway.",
    images: [OG_IMAGE],
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: PAGE_URL,
  },
};

export default function VanHireEalingPage() {
  return (
    <main className="min-h-screen bg-[#0f172b]">
      <Script
        id="ealing-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(ealingSchema),
        }}
      />
      <Script
        id="ealing-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(ealingFAQSchema),
        }}
      />

      <EalingVanHireStatic />
    </main>
  );
}
