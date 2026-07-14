// app/van-hire-park-royal/page.tsx

import { Metadata } from "next";
import Script from "next/script";
import ParkRoyalVanHireStatic from "@/components/static/areas/parkRoyal";
import { parkRoyalSchema, parkRoyalFAQSchema } from "@/lib/schema";

const PAGE_URL_PARK_ROYAL = "https://successvanhire.co.uk/van-hire-park-royal";
const OG_IMAGE_PARK_ROYAL =
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/Park+Royal.webp";

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),

  title: "Van Hire Park Royal NW10 | Commercial Van Rental from £78/Day",

  description:
    "Book van hire in Park Royal from £78/day. Self-drive vans for business deliveries, stock movement, equipment transport, storage runs and Luton van hire near Park Royal industrial estate.",

  keywords: [
    "van hire Park Royal",
    "van rental Park Royal",
    "Park Royal van hire",
    "van hire Park Royal London",
    "van rental Park Royal London",
    "commercial van rental Park Royal",
    "van hire NW10",
    "van rental NW10",
    "local van hire Park Royal",
    "self-drive van hire Park Royal",
    "cheap van hire Park Royal",
    "Luton van hire Park Royal",
    "business van hire Park Royal",
    "moving van hire Park Royal",
    "removal van hire Park Royal",
    "van hire West London",
    "van rental West London",
    "van hire near Park Royal industrial estate",
    "van hire near Hanger Lane",
    "van hire near North Acton",
  ],

  openGraph: {
    title: "Van Hire Park Royal NW10 | Commercial Van Rental from £78/Day",
    description:
      "Self-drive van hire in Park Royal, NW10. Vans for business deliveries, stock movement, trade jobs and equipment transport near Park Royal industrial estate.",
    url: PAGE_URL_PARK_ROYAL,
    type: "website",
    siteName: "Success Van Hire",
    locale: "en_GB",
    images: [
      {
        url: OG_IMAGE_PARK_ROYAL,
        width: 1200,
        height: 630,
        alt: "Van hire Park Royal NW10 with commercial van rental options",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire Park Royal NW10 | Commercial Van Rental from £78/Day",
    description:
      "Self-drive van hire in Park Royal from £78/day. Business deliveries, stock movement, Luton van hire and trade transport near Park Royal industrial estate.",
    images: [OG_IMAGE_PARK_ROYAL],
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: PAGE_URL_PARK_ROYAL,
  },
};

export default function VanHireParkRoyalPage() {
  return (
    <main className="min-h-screen bg-[#0f172b]">
      <Script
        id="park-royal-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(parkRoyalSchema),
        }}
      />
      <Script
        id="park-royal-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(parkRoyalFAQSchema),
        }}
      />

      <ParkRoyalVanHireStatic />
    </main>
  );
}
