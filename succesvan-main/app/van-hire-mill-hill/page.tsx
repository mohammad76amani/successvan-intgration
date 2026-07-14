// app/van-hire-mill-hill/page.tsx

import { Metadata } from "next";
import Script from "next/script";
import MillHillVanHireStatic from "@/components/static/areas/millHill";
import { millHillSchema, millHillFAQSchema } from "@/lib/schema";

const PAGE_URL_MILL_HILL = "https://successvanhire.co.uk/van-hire-mill-hill";
const OG_IMAGE_MILL_HILL =
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/van+hire+mill+hill.png";

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),

  title: "Van Hire Mill Hill NW7 | Local Van Rental from £78/Day",

  description:
    "Book van hire in Mill Hill from £78/day. Self-drive vans for house moves, furniture pickup, storage runs, business deliveries and Luton van hire near Mill Hill Broadway.",

  keywords: [
    "van hire Mill Hill",
    "van rental Mill Hill",
    "Mill Hill van hire",
    "van hire Mill Hill London",
    "van rental Mill Hill London",
    "van hire NW7",
    "local van hire Mill Hill",
    "self drive van hire Mill Hill",
    "cheap van hire Mill Hill",
    "Luton van hire Mill Hill",
    "moving van hire Mill Hill",
    "removal van hire Mill Hill",
    "van hire North West London",
    "van rental North West London",
    "van hire near Mill Hill Broadway",
    "van hire Mill Hill East",
    "van hire near Edgware",
    "van hire near Hendon",
    "van hire near Brent Cross",
  ],

  openGraph: {
    title: "Van Hire Mill Hill NW7 | Local Van Rental from £78/Day",
    description:
      "Reliable self-drive van hire in Mill Hill for house moves, furniture pickup, storage runs, business deliveries and Luton van hire across North West London.",
    url: PAGE_URL_MILL_HILL,
    type: "website",
    siteName: "Success Van Hire",
    locale: "en_GB",
    images: [
      {
        url: OG_IMAGE_MILL_HILL,
        width: 1200,
        height: 630,
        alt: "Van hire Mill Hill NW7 with local van rental options",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire Mill Hill NW7 | Local Van Rental from £78/Day",
    description:
      "Affordable self-drive van hire in Mill Hill for house moves, furniture pickup, storage runs, business deliveries and Luton van hire near Mill Hill Broadway.",
    images: [OG_IMAGE_MILL_HILL],
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: PAGE_URL_MILL_HILL,
  },
};

export default function VanHireMillHillPage() {
  return (
    <main className="min-h-screen bg-[#0f172b]">
      <Script
        id="mill-hill-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(millHillSchema),
        }}
      />
      <Script
        id="mill-hill-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(millHillFAQSchema),
        }}
      />

      <MillHillVanHireStatic />
    </main>
  );
}
