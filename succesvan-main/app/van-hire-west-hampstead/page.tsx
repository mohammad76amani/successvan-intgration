// app/van-hire-west-hampstead/page.tsx

import { Metadata } from "next";
import Script from "next/script";
import WestHampsteadVanHireStatic from "@/components/static/areas/westHampstead";
import {
  westHampsteadSchema,
  westHampsteadFAQSchema,
 } from "@/lib/schema";

const PAGE_URL_WEST_HAMPSTEAD =
  "https://successvanhire.co.uk/van-hire-west-hampstead";
const OG_IMAGE_WEST_HAMPSTEAD =
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/west+hampstead.webp";

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),

  title: "Van Hire West Hampstead NW6 | Local Van Rental from £78/Day",

  description:
    "Book van hire in West Hampstead from £78/day. Self-drive vans for flat moves, furniture pickup, storage trips, business deliveries and Luton van hire near West Hampstead Station.",

  keywords: [
    "van hire West Hampstead",
    "van rental West Hampstead",
    "West Hampstead van hire",
    "van hire West Hampstead London",
    "van rental West Hampstead London",
    "van hire NW6",
    "van rental NW6",
    "local van hire West Hampstead",
    "self-drive van hire West Hampstead",
    "cheap van hire West Hampstead",
    "Luton van hire West Hampstead",
    "moving van hire West Hampstead",
    "removal van hire West Hampstead",
    "van hire North West London",
    "van rental North West London",
    "van hire near West Hampstead Station",
    "van hire near West Hampstead Thameslink",
    "van hire near Finchley Road",
    "van hire near Kilburn",
    "van hire for flat moves West Hampstead",
  ],

  openGraph: {
    title: "Van Hire West Hampstead NW6 | Local Van Rental from £78/Day",
    description:
      "Self-drive van hire in West Hampstead, NW6. Vans for flat moves, furniture pickup, storage trips, business deliveries and Luton van hire near West Hampstead Station.",
    url: PAGE_URL_WEST_HAMPSTEAD,
    type: "website",
    siteName: "Success Van Hire",
    locale: "en_GB",
    images: [
      {
        url: OG_IMAGE_WEST_HAMPSTEAD,
        width: 1200,
        height: 630,
        alt: "Van hire West Hampstead NW6 with local van rental options",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire West Hampstead NW6 | Local Van Rental from £78/Day",
    description:
      "Self-drive van hire in West Hampstead from £78/day. Flat moves, furniture pickup, storage trips and Luton van hire near West Hampstead Station.",
    images: [OG_IMAGE_WEST_HAMPSTEAD],
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: PAGE_URL_WEST_HAMPSTEAD,
  },
};

export default function VanHireWestHampsteadPage() {
  return (
    <main className="min-h-screen bg-[#0f172b]">
      <Script
        id="west-hampstead-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(westHampsteadSchema),
        }}
      />
      <Script
        id="west-hampstead-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(westHampsteadFAQSchema),
        }}
      />

      <WestHampsteadVanHireStatic />
    </main>
  );
}
