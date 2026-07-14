// app/van-hire-cricklewood/page.tsx

import { Metadata } from "next";
import Script from "next/script";
import CricklewoodVanHireStatic from "@/components/static/areas/cricklewood";
import { cricklewoodSchema, cricklewoodFAQSchema } from "@/lib/schema";

const PAGE_URL = "https://successvanhire.co.uk/van-hire-cricklewood";
const OG_IMAGE =
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/+crickle+wood.jpg";

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),

  title: "Van Hire Cricklewood | Local Van Rental from £78/Day",

  description:
    "Book van hire in Cricklewood from £78/day. Self-drive vans for house moves, furniture pickup, business deliveries and Luton van hire near Cricklewood Broadway.",

  keywords: [
    "van hire Cricklewood",
    "van rental Cricklewood",
    "Cricklewood van hire",
    "van hire Cricklewood London",
    "van rental Cricklewood London",
    "local van hire Cricklewood",
    "self drive van hire Cricklewood",
    "cheap van hire Cricklewood",
    "Luton van hire Cricklewood",
    "moving van hire Cricklewood",
    "removal van hire Cricklewood",
    "van hire near Cricklewood Broadway",
    "van hire near Willesden Green",
    "van hire near Kilburn",
    "van hire North West London",
  ],

  openGraph: {
    title: "Van Hire Cricklewood | Local Van Rental from £78/Day",
    description:
      "Reliable self-drive van hire in Cricklewood for house moves, furniture pickup, business deliveries and Luton van hire across North West London.",
    url: PAGE_URL,
    type: "website",
    siteName: "Success Van Hire",
    locale: "en_GB",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Van hire Cricklewood London with local van rental options",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire Cricklewood | Local Van Rental from £78/Day",
    description:
      "Affordable self-drive van hire in Cricklewood for house moves, furniture pickup, business deliveries and Luton van hire near Cricklewood Broadway.",
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

export default function VanHireCricklewoodPage() {
  return (
    <main className="min-h-screen bg-[#0f172b]">
      <Script
        id="cricklewood-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(cricklewoodSchema),
        }}
      />
      <Script
        id="cricklewood-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(cricklewoodFAQSchema),
        }}
      />

      <CricklewoodVanHireStatic />
    </main>
  );
}
