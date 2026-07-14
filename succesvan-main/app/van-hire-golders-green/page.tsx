// app/van-hire-golders-green/page.tsx

import { Metadata } from "next";
import Script from "next/script";
import GoldersGreenVanHireStatic from "@/components/static/areas/GoldersGreen";
import { goldersGreenSchema, goldersGreenFAQSchema } from "@/lib/schema";

const PAGE_URL_GOLDERS_GREEN =
  "https://successvanhire.co.uk/van-hire-golders-green";
const OG_IMAGE_GOLDERS_GREEN =
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/Golders+Green+van+hire.png";

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),

  title: "Van Hire Golders Green NW11 | Self-Drive Vans from £78/Day",

  description:
    "Book van hire in Golders Green from £78/day. Self-drive vans for house moves, furniture pickup, business deliveries and Luton van hire near Golders Green Station.",

  keywords: [
    "van hire Golders Green",
    "Golders Green van hire",
    "van rental Golders Green",
    "self drive van hire Golders Green",
    "cheap van hire Golders Green",
    "automatic van hire Golders Green",
    "Luton van hire Golders Green",
    "moving van hire Golders Green",
    "van hire near Golders Green Station",
    "van hire NW11",
    "van hire Hampstead",
    "van hire Hendon",
    "van hire Cricklewood",
    "van hire Brent Cross",
    "van hire North West London",
    "NW London van rental",
  ],

  openGraph: {
    title: "Van Hire Golders Green NW11 | Self-Drive Vans from £78/Day",
    description:
      "Reliable self-drive van hire in Golders Green for house moves, furniture pickup, business deliveries and Luton van hire across NW London.",
    url: PAGE_URL_GOLDERS_GREEN,
    type: "website",
    siteName: "Success Van Hire",
    locale: "en_GB",
    images: [
      {
        url: OG_IMAGE_GOLDERS_GREEN,
        width: 1200,
        height: 630,
        alt: "Van hire Golders Green NW11 with local van rental options",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire Golders Green NW11 | Self-Drive Vans from £78/Day",
    description:
      "Affordable self-drive van hire in Golders Green for house moves, furniture pickup, business deliveries and Luton van hire near Golders Green Station.",
    images: [OG_IMAGE_GOLDERS_GREEN],
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: PAGE_URL_GOLDERS_GREEN,
  },
};

export default function VanHireGoldersGreenPage() {
  return (
    <main className="min-h-screen bg-[#0f172b]">
      <Script
        id="golders-green-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(goldersGreenSchema),
        }}
      />
      <Script
        id="golders-green-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(goldersGreenFAQSchema),
        }}
      />

      <GoldersGreenVanHireStatic />
    </main>
  );
}
