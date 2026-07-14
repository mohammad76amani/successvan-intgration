// app/van-hire-staples-corner/page.tsx

import { Metadata } from "next";
import Script from "next/script";
import StaplesCornerVanHireStatic from "@/components/static/areas/staplesCorner";
import { staplesCornerSchema, staplesCornerFAQSchema } from "@/lib/schema";

const PAGE_URL_STAPLES_CORNER =
  "https://successvanhire.co.uk/van-hire-staples-corner";
const OG_IMAGE_STAPLES_CORNER =
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/Staples+Corner.webp";

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),

  title: "Van Hire Staples Corner NW2 | Local Van Rental from £78/Day",

  description:
    "Book van hire in Staples Corner from £78/day. Self-drive vans for furniture pickup, retail collections, business deliveries, storage runs and Luton van hire near Brent Cross and the A406.",

  keywords: [
    "van hire Staples Corner",
    "van rental Staples Corner",
    "Staples Corner van hire",
    "van hire Staples Corner London",
    "van rental Staples Corner London",
    "van hire NW2",
    "van rental NW2",
    "local van hire Staples Corner",
    "self-drive van hire Staples Corner",
    "cheap van hire Staples Corner",
    "Luton van hire Staples Corner",
    "moving van hire Staples Corner",
    "removal van hire Staples Corner",
    "van hire North West London",
    "van rental North West London",
    "van hire Brent Cross",
    "van hire near Staples Corner",
    "van hire near North Circular",
    "van hire near Hendon",
    "van hire near Cricklewood",
  ],

  openGraph: {
    title: "Van Hire Staples Corner NW2 | Local Van Rental from £78/Day",
    description:
      "Self-drive van hire in Staples Corner, NW2. Vans for furniture pickup, retail collections, business deliveries, storage runs and Luton van hire near Brent Cross and the A406.",
    url: PAGE_URL_STAPLES_CORNER,
    type: "website",
    siteName: "Success Van Hire",
    locale: "en_GB",
    images: [
      {
        url: OG_IMAGE_STAPLES_CORNER,
        width: 1200,
        height: 630,
        alt: "Van hire Staples Corner NW2 with local van rental options",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire Staples Corner NW2 | Local Van Rental from £78/Day",
    description:
      "Self-drive van hire in Staples Corner from £78/day. Furniture pickup, retail collections, business deliveries and Luton van hire near Brent Cross and the North Circular.",
    images: [OG_IMAGE_STAPLES_CORNER],
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: PAGE_URL_STAPLES_CORNER,
  },
};

export default function VanHireStaplesCornerPage() {
  return (
    <main className="min-h-screen bg-[#0f172b]">
      <Script
        id="staples-corner-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(staplesCornerSchema),
        }}
      />
      <Script
        id="staples-corner-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(staplesCornerFAQSchema),
        }}
      />

      <StaplesCornerVanHireStatic />
    </main>
  );
}
