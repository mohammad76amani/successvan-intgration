// app/van-hire-kilburn/page.tsx

import { Metadata } from "next";
import Script from "next/script";
import KilburnVanHireStatic from "@/components/static/areas/kilburn";
import { kilburnSchema, kilburnFAQSchema } from "@/lib/schema";

const PAGE_URL_KILBURN = "https://successvanhire.co.uk/van-hire-kilburn";
// Note: the S3 file is named "killburn.webp" — keeping the existing filename.
const OG_IMAGE_KILBURN =
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/killburn.webp";

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),

  title: "Van Hire Kilburn NW6 | Local Van Rental from £78/Day",

  description:
    "Book van hire in Kilburn from £78/day. Self-drive vans for flat moves, furniture pickup, business deliveries and Luton van hire near Kilburn High Road.",

  keywords: [
    "van hire Kilburn",
    "van rental Kilburn",
    "Kilburn van hire",
    "van hire Kilburn London",
    "van rental Kilburn London",
    "van hire NW6",
    "van rental NW6",
    "local van hire Kilburn",
    "self drive van hire Kilburn",
    "cheap van hire Kilburn",
    "Luton van hire Kilburn",
    "moving van hire Kilburn",
    "removal van hire Kilburn",
    "van hire North West London",
    "van rental North West London",
    "van hire near Kilburn High Road",
    "van hire near Kilburn Station",
    "van hire near West Hampstead",
  ],

  openGraph: {
    title: "Van Hire Kilburn NW6 | Local Van Rental from £78/Day",
    description:
      "Reliable self-drive van hire in Kilburn for flat moves, furniture pickup, business deliveries and Luton van hire near Kilburn High Road and NW6.",
    url: PAGE_URL_KILBURN,
    type: "website",
    siteName: "Success Van Hire",
    locale: "en_GB",
    images: [
      {
        url: OG_IMAGE_KILBURN,
        width: 1200,
        height: 630,
        alt: "Van hire Kilburn NW6 with local van rental options",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire Kilburn NW6 | Local Van Rental from £78/Day",
    description:
      "Affordable self-drive van hire in Kilburn for flat moves, furniture pickup, business deliveries and Luton van hire near Kilburn High Road.",
    images: [OG_IMAGE_KILBURN],
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    // canonical without www — corrected from original
    canonical: PAGE_URL_KILBURN,
  },
};

export default function VanHireKilburnPage() {
  return (
    <main className="min-h-screen bg-[#0f172b]">
      <Script
        id="kilburn-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(kilburnSchema),
        }}
      />
      <Script
        id="kilburn-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(kilburnFAQSchema),
        }}
      />

      <KilburnVanHireStatic />
    </main>
  );
}
