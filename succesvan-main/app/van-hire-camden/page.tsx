// app/van-hire-camden/page.tsx
import { Metadata } from "next";
import Script from "next/script";

import { camdenFAQSchema, camdenSchema } from "@/lib/schema";
import CamdenVanHireStatic from "@/components/static/areas/Camedan";

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),

  title: "Van Hire Camden | Local Van Rental from £78/Day",

  description:
    "Book van hire in Camden from £78/day. Small vans, Transit vans & Luton vans for moving, furniture pickup, student moves and business deliveries in North London.",

  keywords: [
    "van hire Camden",
    "van rental Camden",
    "Camden van hire",
    "van hire Camden London",
    "van rental Camden London",
    "local van hire Camden",
    "self-drive van hire Camden",
    "cheap van hire Camden",
    "Luton van hire Camden",
    "moving van hire Camden",
    "removal van hire Camden",
    "van hire near Camden Market",
    "van hire near Camden Town",
    "small van hire Camden",
    "large van hire Camden",
    "van hire near me",
  ],

  openGraph: {
    title: "Van Hire Camden | Local Van Rental from £78/Day",
    description:
      "Local van rental in Camden for moving, deliveries, student moves, furniture pickup and business use. Book online or call today.",
    url: "https://successvanhire.co.uk/van-hire-camden",
    type: "website",
    siteName: "Success Van Hire",
    locale: "en_GB",
    images: [
      {
        url: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/van+hire+camden.png",
        width: 1200,
        height: 630,
        alt: "Van hire Camden London with local van rental options",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire Camden | Local Van Rental from £78/Day",
    description:
      "Book local van hire in Camden from £78/day. Moving, deliveries, furniture pickup and business use covered across North London.",
    images: [
      "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/van+hire+camden.png",
    ],
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: "https://successvanhire.co.uk/van-hire-camden",
  },
};

export default function VanHireCamdenPage() {
  return (
    <main className="bg-[#0f172b]">
      <Script
        id="camden-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(camdenSchema) }}
      />
      <Script
        id="camden-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(camdenFAQSchema) }}
      />

      <CamdenVanHireStatic />
    </main>
  );
}
