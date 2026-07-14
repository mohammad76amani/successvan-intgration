// app/van-hire-wembley/page.tsx

import { Metadata } from "next";
import Script from "next/script";
import WembleyVanHireStatic from "@/components/static/areas/wembley";
import { wembleySchema, wembleyFAQSchema } from "@/lib/schema";

const PAGE_URL_WEMBLEY = "https://successvanhire.co.uk/van-hire-wembley";
const OG_IMAGE_WEMBLEY =
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/van+hire+wembley.png";

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),

  title: "Van Hire Wembley HA9 | Local Van Rental from £78/Day",

  description:
    "Book van hire in Wembley from £78/day. Self-drive vans for house moves, event equipment, furniture pickup, business deliveries and Luton van hire near Wembley Stadium.",

  keywords: [
    "van hire Wembley",
    "van rental Wembley",
    "Wembley van hire",
    "van hire Wembley London",
    "van rental Wembley London",
    "van hire HA9",
    "van rental HA9",
    "local van hire Wembley",
    "self-drive van hire Wembley",
    "cheap van hire Wembley",
    "Luton van hire Wembley",
    "moving van hire Wembley",
    "removal van hire Wembley",
    "van hire North West London",
    "van rental North West London",
    "van hire near Wembley Stadium",
    "van hire near Wembley Park",
    "van hire near Alperton",
    "van hire near Harlesden",
    "van hire for event equipment Wembley",
  ],

  openGraph: {
    title: "Van Hire Wembley HA9 | Local Van Rental from £78/Day",
    description:
      "Self-drive van hire in Wembley, HA9. Vans for house moves, event equipment, furniture pickup, business deliveries and Luton van hire near Wembley Stadium.",
    url: PAGE_URL_WEMBLEY,
    type: "website",
    siteName: "Success Van Hire",
    locale: "en_GB",
    images: [
      {
        url: OG_IMAGE_WEMBLEY,
        width: 1200,
        height: 630,
        alt: "Van hire Wembley HA9 with local van rental options",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire Wembley HA9 | Local Van Rental from £78/Day",
    description:
      "Self-drive van hire in Wembley from £78/day. House moves, event equipment, furniture pickup, business deliveries and Luton van hire near Wembley Stadium.",
    images: [OG_IMAGE_WEMBLEY],
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: PAGE_URL_WEMBLEY,
  },
};

export default function VanHireWembleyPage() {
  return (
    <main className="min-h-screen bg-[#0f172b]">
      <Script
        id="wembley-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(wembleySchema),
        }}
      />
      <Script
        id="wembley-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(wembleyFAQSchema),
        }}
      />

      <WembleyVanHireStatic />
    </main>
  );
}
