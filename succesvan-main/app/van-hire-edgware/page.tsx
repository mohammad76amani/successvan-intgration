// app/van-hire-edgware/page.tsx

import { Metadata } from "next";
import Script from "next/script";
import EdgwareVanHireStatic from "@/components/static/areas/edgware";
import { edgwareSchema, edgwareFAQSchema } from "@/lib/schema";

const PAGE_URL_EDGWARE = "https://successvanhire.co.uk/van-hire-edgware";
const OG_IMAGE_EDGWARE =
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/edgware.webp";

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),

  title: "Van Hire Edgware | Local Van Rental North London from £78/Day",

  description:
    "Book van hire in Edgware from £78/day. Self-drive vans for house moves, furniture pickup, business deliveries and Luton van hire near Edgware Station.",

  keywords: [
    "van hire Edgware",
    "van rental Edgware",
    "Edgware van hire",
    "van hire Edgware London",
    "van rental Edgware London",
    "local van hire Edgware",
    "self drive van hire Edgware",
    "cheap van hire Edgware",
    "Luton van hire Edgware",
    "moving van hire Edgware",
    "removal van hire Edgware",
    "van hire North London",
    "van rental North London",
    "van hire near Edgware Station",
    "van hire HA8",
    "van hire Burnt Oak",
    "van hire Mill Hill",
  ],

  openGraph: {
    title: "Van Hire Edgware | Local Van Rental North London from £78/Day",
    description:
      "Reliable self-drive van hire in Edgware for house moves, furniture pickup, business deliveries and Luton van hire across North London.",
    url: PAGE_URL_EDGWARE,
    type: "website",
    siteName: "Success Van Hire",
    locale: "en_GB",
    images: [
      {
        url: OG_IMAGE_EDGWARE,
        width: 1200,
        height: 630,
        alt: "Van hire Edgware North London with local van rental options",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire Edgware | Local Van Rental North London from £78/Day",
    description:
      "Affordable self-drive van hire in Edgware for house moves, furniture pickup, business deliveries and Luton van hire near Edgware Station.",
    images: [OG_IMAGE_EDGWARE],
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: PAGE_URL_EDGWARE,
  },
};

export default function VanHireEdgwarePage() {
  return (
    <main className="min-h-screen bg-[#0f172b]">
      <Script
        id="edgware-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(edgwareSchema),
        }}
      />
      <Script
        id="edgware-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(edgwareFAQSchema),
        }}
      />

      <EdgwareVanHireStatic />
    </main>
  );
}
