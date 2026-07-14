// app/success-van-hire-van-rental-in-brent-cross-london-last-minute-bookings/page.tsx

import { Metadata } from "next";
import Script from "next/script";
import BrentCrossVanHireStatic from "@/components/static/areas/BrentCross";
import { brentCrossSchema, brentCrossFAQSchema } from "@/lib/schema";

const PAGE_URL =
  "https://successvanhire.co.uk/success-van-hire-van-rental-in-brent-cross-london-last-minute-bookings";
const OG_IMAGE =
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/brent+cross+van+hire.jpg";

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),

  title: "Van Hire Brent Cross | Same-Day Van Rental from £78/Day",

  description:
    "Book van hire in Brent Cross from £78/day. Self-drive vans for same-day bookings, house moves, furniture collection and business deliveries near Brent Cross.",

  keywords: [
    "van hire Brent Cross",
    "van rental Brent Cross",
    "Brent Cross van hire",
    "same day van hire Brent Cross",
    "last minute van booking Brent Cross",
    "Luton van hire Brent Cross",
    "self drive van hire Brent Cross",
    "moving van hire Brent Cross",
    "van hire near Brent Cross Shopping Centre",
    "van hire Hendon",
    "van hire Cricklewood",
    "van hire Golders Green",
    "van hire NW London",
    "van hire near Staples Corner",
    "van rental North West London",
  ],

  openGraph: {
    title: "Van Hire Brent Cross | Same-Day Van Rental from £78/Day",
    description:
      "Reliable self-drive van hire in Brent Cross for moving, furniture collection, business deliveries and same-day bookings across NW London.",
    url: PAGE_URL,
    type: "website",
    siteName: "Success Van Hire",
    locale: "en_GB",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Van hire in Brent Cross London with Success Van Hire",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire Brent Cross | Same-Day Van Rental from £78/Day",
    description:
      "Affordable self-drive van hire in Brent Cross for house moves, furniture collection, business deliveries and urgent same-day bookings.",
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

export default function VanHireBrentCrossPage() {
  return (
    <main className="min-h-screen bg-[#0f172b]">
      <Script
        id="brent-cross-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(brentCrossSchema) }}
      />
      <Script
        id="brent-cross-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(brentCrossFAQSchema),
        }}
      />

      <BrentCrossVanHireStatic />
    </main>
  );
}
