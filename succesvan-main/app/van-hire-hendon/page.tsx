// app/van-hire-hendon/page.tsx

import { Metadata } from "next";
import Script from "next/script";
import HendonVanHireStatic from "@/components/static/areas/hendon";
import { hendonSchema, hendonFAQSchema } from "@/lib/schema";

const PAGE_URL_HENDON = "https://successvanhire.co.uk/van-hire-hendon";
const OG_IMAGE_HENDON =
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/van+hire+in+hendon.png";

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),

  title: "Van Hire Hendon NW4 | Local Van Rental from £78/Day",

  description:
    "Book van hire in Hendon from £78/day. Self-drive vans for house moves, student moves, furniture pickup, business deliveries and Luton van hire near Hendon Central.",

  keywords: [
    "van hire Hendon",
    "van rental Hendon",
    "Hendon van hire",
    "van hire Hendon London",
    "van rental Hendon London",
    "van hire NW4",
    "local van hire Hendon",
    "self drive van hire Hendon",
    "cheap van hire Hendon",
    "Luton van hire Hendon",
    "moving van hire Hendon",
    "removal van hire Hendon",
    "van hire North London",
    "van rental North London",
    "van hire near Hendon Central",
    "van hire near Brent Cross",
    "van hire near Colindale",
    "van hire near Mill Hill",
  ],

  openGraph: {
    title: "Van Hire Hendon NW4 | Local Van Rental from £78/Day",
    description:
      "Reliable self-drive van hire in Hendon for house moves, student moves, furniture pickup, business deliveries and Luton van hire across North London.",
    url: PAGE_URL_HENDON,
    type: "website",
    siteName: "Success Van Hire",
    locale: "en_GB",
    images: [
      {
        url: OG_IMAGE_HENDON,
        width: 1200,
        height: 630,
        alt: "Van hire Hendon NW4 with local van rental options",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire Hendon NW4 | Local Van Rental from £78/Day",
    description:
      "Affordable self-drive van hire in Hendon for house moves, student moves, furniture pickup, business deliveries and Luton van hire near Hendon Central.",
    images: [OG_IMAGE_HENDON],
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: PAGE_URL_HENDON,
  },
};

export default function VanHireHendonPage() {
  return (
    <main className="min-h-screen bg-[#0f172b]">
      <Script
        id="hendon-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(hendonSchema),
        }}
      />
      <Script
        id="hendon-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(hendonFAQSchema),
        }}
      />

      <HendonVanHireStatic />
    </main>
  );
}
