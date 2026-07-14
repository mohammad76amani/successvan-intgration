// app/van-hire-hampstead/page.tsx

import { Metadata } from "next";
import Script from "next/script";
import HampsteadVanHireStatic from "@/components/static/areas/Hampstead";
import { hampsteadSchema, hampsteadFAQSchema } from "@/lib/schema";

const PAGE_URL_HAMPSTEAD = "https://successvanhire.co.uk/van-hire-hampstead";
const OG_IMAGE_HAMPSTEAD =
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/hampstead+van+hire.jpg";

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),

  title: "Van Hire Hampstead NW3 | Local Van Rental from £78/Day",

  description:
    "Book van hire in Hampstead from £78/day. Self-drive vans for flat moves, furniture pickup, business deliveries and Luton van hire near Hampstead Heath.",

  keywords: [
    "van hire Hampstead",
    "van rental Hampstead",
    "Hampstead van hire",
    "van hire Hampstead London",
    "van rental Hampstead London",
    "van hire NW3",
    "local van hire Hampstead",
    "self drive van hire Hampstead",
    "cheap van hire Hampstead",
    "Luton van hire Hampstead",
    "moving van hire Hampstead",
    "removal van hire Hampstead",
    "van hire North London",
    "van rental North London",
    "van hire near Hampstead Heath",
    "van hire near Belsize Park",
    "van hire near Swiss Cottage",
  ],

  openGraph: {
    title: "Van Hire Hampstead NW3 | Local Van Rental from £78/Day",
    description:
      "Reliable self-drive van hire in Hampstead for flat moves, furniture pickup, business deliveries and Luton van hire near Hampstead Heath and NW3.",
    url: PAGE_URL_HAMPSTEAD,
    type: "website",
    siteName: "Success Van Hire",
    locale: "en_GB",
    images: [
      {
        url: OG_IMAGE_HAMPSTEAD,
        width: 1200,
        height: 630,
        alt: "Van hire Hampstead NW3 with local van rental options",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire Hampstead NW3 | Local Van Rental from £78/Day",
    description:
      "Affordable self-drive van hire in Hampstead for flat moves, furniture pickup, business deliveries and Luton van hire near Hampstead Heath.",
    images: [OG_IMAGE_HAMPSTEAD],
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: PAGE_URL_HAMPSTEAD,
  },
};

export default function VanHireHampsteadPage() {
  return (
    <main className="min-h-screen bg-[#0f172b]">
      <Script
        id="hampstead-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(hampsteadSchema),
        }}
      />
      <Script
        id="hampstead-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(hampsteadFAQSchema),
        }}
      />

      <HampsteadVanHireStatic />
    </main>
  );
}
