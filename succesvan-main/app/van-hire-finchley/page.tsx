// app/van-hire-finchley/page.tsx

import { Metadata } from "next";
import Script from "next/script";
import FinchleyVanHireStatic from "@/components/static/areas/Finchley";
import { finchleySchema, finchleyFAQSchema } from "@/lib/schema";

const PAGE_URL_FINCHLEY = "https://successvanhire.co.uk/van-hire-finchley";
const OG_IMAGE_FINCHLEY =
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/Finchley.webp";

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),

  title: "Van Hire Finchley N3/N12 | Self-Drive Vans from £78/Day",

  description:
    "Book van hire in Finchley from £78/day. Self-drive vans for house moves, furniture pickup, shop stock, business deliveries and Luton van hire near Finchley Central.",

  keywords: [
    "van hire Finchley",
    "Finchley van hire",
    "van rental Finchley",
    "self drive van hire Finchley",
    "cheap van hire Finchley",
    "automatic van hire Finchley",
    "Luton van hire Finchley",
    "moving van hire Finchley",
    "van hire Finchley Central",
    "van hire North Finchley",
    "van hire East Finchley",
    "van hire West Finchley",
    "van hire N3",
    "van hire N12",
    "van hire North London",
    "van rental North London",
  ],

  openGraph: {
    title: "Van Hire Finchley N3/N12 | Self-Drive Vans from £78/Day",
    description:
      "Reliable self-drive van hire in Finchley for house moves, furniture pickup, shop stock, business deliveries and Luton van hire across North London.",
    url: PAGE_URL_FINCHLEY,
    type: "website",
    siteName: "Success Van Hire",
    locale: "en_GB",
    images: [
      {
        url: OG_IMAGE_FINCHLEY,
        width: 1200,
        height: 630,
        alt: "Van hire Finchley North London with local van rental options",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire Finchley N3/N12 | Self-Drive Vans from £78/Day",
    description:
      "Affordable self-drive van hire in Finchley for house moves, furniture pickup, shop stock, business deliveries and Luton van hire.",
    images: [OG_IMAGE_FINCHLEY],
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: PAGE_URL_FINCHLEY,
  },
};

export default function VanHireFinchleyPage() {
  return (
    <main className="min-h-screen bg-[#0f172b]">
      <Script
        id="finchley-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(finchleySchema),
        }}
      />
      <Script
        id="finchley-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(finchleyFAQSchema),
        }}
      />

      <FinchleyVanHireStatic />
    </main>
  );
}
