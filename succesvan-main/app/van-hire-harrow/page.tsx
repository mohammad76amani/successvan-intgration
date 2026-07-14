// app/van-hire-harrow/page.tsx

import { Metadata } from "next";
import Script from "next/script";
import HarrowVanHireStatic from "@/components/static/areas/harrow";
import { harrowSchema, harrowFAQSchema } from "@/lib/schema";

const PAGE_URL_HARROW = "https://successvanhire.co.uk/van-hire-harrow";
const OG_IMAGE_HARROW =
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/harrow.webp";

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),

  title: "Van Hire Harrow HA1 | Local Van Rental from £78/Day",

  description:
    "Book van hire in Harrow from £78/day. Self-drive vans for house moves, furniture pickup, student moves, business deliveries and Luton van hire near Harrow-on-the-Hill.",

  keywords: [
    "van hire Harrow",
    "van rental Harrow",
    "Harrow van hire",
    "van hire Harrow London",
    "van rental Harrow London",
    "van hire HA1",
    "van hire HA2",
    "local van hire Harrow",
    "self drive van hire Harrow",
    "cheap van hire Harrow",
    "Luton van hire Harrow",
    "moving van hire Harrow",
    "removal van hire Harrow",
    "van hire North West London",
    "van rental North West London",
    "van hire near Harrow-on-the-Hill",
    "van hire near Kenton",
    "van hire near Wembley",
  ],

  openGraph: {
    title: "Van Hire Harrow HA1 | Local Van Rental from £78/Day",
    description:
      "Reliable self-drive van hire in Harrow for house moves, furniture pickup, student moves, business deliveries and Luton van hire across North West London.",
    url: PAGE_URL_HARROW,
    type: "website",
    siteName: "Success Van Hire",
    locale: "en_GB",
    images: [
      {
        url: OG_IMAGE_HARROW,
        width: 1200,
        height: 630,
        alt: "Van hire Harrow North West London with local van rental options",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire Harrow HA1 | Local Van Rental from £78/Day",
    description:
      "Affordable self-drive van hire in Harrow for house moves, furniture pickup, student moves, business deliveries and Luton van hire.",
    images: [OG_IMAGE_HARROW],
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: PAGE_URL_HARROW,
  },
};

export default function VanHireHarrowPage() {
  return (
    <main className="min-h-screen bg-[#0f172b]">
      <Script
        id="harrow-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(harrowSchema),
        }}
      />
      <Script
        id="harrow-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(harrowFAQSchema),
        }}
      />

      <HarrowVanHireStatic />
    </main>
  );
}
