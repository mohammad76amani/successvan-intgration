// app/van-hire-dollis-hill/page.tsx

import { Metadata } from "next";
import Script from "next/script";
import DollisHillVanHireStatic from "@/components/static/areas/dollisHill";
import { dollisHillSchema, dollisHillFAQSchema } from "@/lib/schema";

const PAGE_URL = "https://successvanhire.co.uk/van-hire-dollis-hill";
const OG_IMAGE =
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/dollis+hills.webp";

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),

  title: "Van Hire Dollis Hill | Local Van Rental NW2 from £78/Day",

  description:
    "Book van hire in Dollis Hill NW2 from £78/day. Self-drive vans for flat moves, furniture pickup, business deliveries and Luton van hire near Dollis Hill Station.",

  keywords: [
    "van hire Dollis Hill",
    "van rental Dollis Hill",
    "Dollis Hill van hire",
    "van hire NW2",
    "van rental NW2",
    "local van hire Dollis Hill",
    "self drive van hire Dollis Hill",
    "cheap van hire Dollis Hill",
    "Luton van hire Dollis Hill",
    "moving van hire Dollis Hill",
    "removal van hire Dollis Hill",
    "van hire near Dollis Hill Station",
    "van hire near Gladstone Park",
    "van hire near Willesden Green",
    "van hire North West London",
  ],

  openGraph: {
    title: "Van Hire Dollis Hill | Local Van Rental NW2 from £78/Day",
    description:
      "Reliable self-drive van hire in Dollis Hill NW2 for flat moves, furniture pickup, business deliveries and Luton van hire across North West London.",
    url: PAGE_URL,
    type: "website",
    siteName: "Success Van Hire",
    locale: "en_GB",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Van hire Dollis Hill NW2 with local van rental options",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire Dollis Hill | Local Van Rental NW2 from £78/Day",
    description:
      "Affordable self-drive van hire in Dollis Hill NW2 for flat moves, furniture pickup, business deliveries and Luton van hire.",
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

export default function VanHireDollisHillPage() {
  return (
    <main className="min-h-screen bg-[#0f172b]">
      <Script
        id="dollis-hill-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(dollisHillSchema),
        }}
      />
      <Script
        id="dollis-hill-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(dollisHillFAQSchema),
        }}
      />

      <DollisHillVanHireStatic />
    </main>
  );
}
