// app/van-hire-neasden/page.tsx

import { Metadata } from "next";
import Script from "next/script";
import NeasdenVanHireStatic from "@/components/static/areas/neasden";
import { neasdenSchema, neasdenFAQSchema } from "@/lib/schema";

const PAGE_URL_NEASDEN = "https://successvanhire.co.uk/van-hire-neasden";
const OG_IMAGE_NEASDEN =
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/Neasden.webp";

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),

  title: "Van Hire Neasden NW10 | Local Van Rental from £78/Day",

  description:
    "Book van hire in Neasden from £78/day. Self-drive vans for flat moves, furniture pickup, storage runs, business deliveries and Luton van hire near Neasden Station.",

  keywords: [
    "van hire Neasden",
    "van rental Neasden",
    "Neasden van hire",
    "van hire Neasden London",
    "van rental Neasden London",
    "van hire NW10",
    "van rental NW10",
    "local van hire Neasden",
    "self drive van hire Neasden",
    "cheap van hire Neasden",
    "Luton van hire Neasden",
    "moving van hire Neasden",
    "removal van hire Neasden",
    "van hire North West London",
    "van rental North West London",
    "van hire near Neasden Station",
    "van hire near North Circular",
    "van hire near Wembley",
    "van hire near Dollis Hill",
  ],

  openGraph: {
    title: "Van Hire Neasden NW10 | Local Van Rental from £78/Day",
    description:
      "Reliable self-drive van hire in Neasden for flat moves, furniture pickup, storage runs, business deliveries and Luton van hire across North West London.",
    url: PAGE_URL_NEASDEN,
    
    type: "website",
    siteName: "Success Van Hire",
    locale: "en_GB",
    images: [
      {
        url: OG_IMAGE_NEASDEN,
        width: 1200,
        height: 630,
        alt: "Van hire Neasden NW10 with local van rental options",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire Neasden NW10 | Local Van Rental from £78/Day",
    description:
      "Affordable self-drive van hire in Neasden for flat moves, furniture pickup, storage runs, business deliveries and Luton van hire near Neasden Station.",
    images: [OG_IMAGE_NEASDEN],

  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    // canonical without www — corrected from original
    canonical: PAGE_URL_NEASDEN,
  },
};

export default function VanHireNeasdenPage() {
  return (
    <main className="min-h-screen bg-[#0f172b]">
      <Script
        id="neasden-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(neasdenSchema),
        }}
      />
      <Script
        id="neasden-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(neasdenFAQSchema),
        }}
      />

      <NeasdenVanHireStatic />
    </main>
  );
}
