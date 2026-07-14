// app/van-hire-north-west-london/page.tsx

import { Metadata } from "next";
import Script from "next/script";
import NorthWestLondonStatic from "@/components/static/areas/NorthWestLondonStatic";
import {
  northWestLondonSchema,
  northWestLondonFAQSchema,
 } from "@/lib/schema";

const PAGE_URL = "https://successvanhire.co.uk/van-hire-north-west-london";
const OG_IMAGE =
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/north+west+london+vanhire.png";

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),

  title: "Van Hire North West London | Local Van Rental from £78/Day",

  description:
    "Book van hire in North West London from £78/day. Self-drive vans for moving, business deliveries, furniture collection and Luton van hire across Brent, Wembley, Hendon and surrounding NW areas.",

  keywords: [
    "van hire North West London",
    "van rental North West London",
    "van hire NW London",
    "cheap van hire North West London",
    "Luton van hire North West London",
    "self drive van hire North West London",
    "removal van hire North West London",
    "van hire Brent",
    "van hire Wembley",
    "van hire Hendon",
    "van hire Cricklewood",
    "van hire Golders Green",
    "van hire Harrow",
    "van hire Ealing",
    "van hire near me NW London",
  ],

  openGraph: {
    title: "Van Hire North West London | Local Van Rental from £78/Day",
    description:
      "Reliable self-drive van hire across North West London for moving, deliveries, furniture collection and business transport. Rates from £78/day.",
    url: PAGE_URL,
    type: "website",
    siteName: "Success Van Hire",
    locale: "en_GB",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Van hire North West London — Success Van Hire fleet of modern vans",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire North West London | Local Van Rental from £78/Day",
    description:
      "Affordable self-drive van hire in North West London for house moves, furniture pickup, business deliveries and Luton van hire.",
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

export default function VanHireNorthWestLondonPage() {
  return (
    <main className="min-h-screen bg-[#0f172b]">
      <Script
        id="nw-london-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(northWestLondonSchema),
        }}
      />
      <Script
        id="nw-london-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(northWestLondonFAQSchema),
        }}
      />
 
      <NorthWestLondonStatic />
    </main>
  );
}
