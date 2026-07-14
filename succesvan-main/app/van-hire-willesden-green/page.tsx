// app/van-hire-willesden-green/page.tsx

import { Metadata } from "next";
import Script from "next/script";
import WillesdenGreenVanHireStatic from "@/components/static/areas/willesdenGreen";
import { willesdenGreenSchema, willesdenGreenFAQSchema } from "@/lib/schema";

const PAGE_URL_WILLESDEN_GREEN =
  "https://successvanhire.co.uk/van-hire-willesden-green";
const OG_IMAGE_WILLESDEN_GREEN =
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/Willesden+Green.webp";

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),

  title: "Van Hire Willesden Green NW2 | Local Van Rental from £78/Day",

  description:
    "Book van hire in Willesden Green from £78/day. Self-drive vans for flat moves, furniture pickup, storage trips, business deliveries and Luton van hire near Willesden Green Station.",

  keywords: [
    "van hire Willesden Green",
    "van rental Willesden Green",
    "Willesden Green van hire",
    "van hire Willesden Green London",
    "van rental Willesden Green London",
    "van hire NW2",
    "van rental NW2",
    "local van hire Willesden Green",
    "self-drive van hire Willesden Green",
    "cheap van hire Willesden Green",
    "Luton van hire Willesden Green",
    "moving van hire Willesden Green",
    "removal van hire Willesden Green",
    "van hire North West London",
    "van rental North West London",
    "van hire near Willesden Green Station",
    "van hire near Cricklewood",
    "van hire near Dollis Hill",
    "van hire near Kilburn",
    "van hire for flat moves Willesden Green",
  ],

  openGraph: {
    title: "Van Hire Willesden Green NW2 | Local Van Rental from £78/Day",
    description:
      "Self-drive van hire in Willesden Green, NW2. Vans for flat moves, furniture pickup, storage trips, business deliveries and Luton van hire near Willesden Green Station.",
    url: PAGE_URL_WILLESDEN_GREEN,
    type: "website",
    siteName: "Success Van Hire",
    locale: "en_GB",
    images: [
      {
        url: OG_IMAGE_WILLESDEN_GREEN,
        width: 1200,
        height: 630,
        alt: "Van hire Willesden Green NW2 with local van rental options",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire Willesden Green NW2 | Local Van Rental from £78/Day",
    description:
      "Self-drive van hire in Willesden Green from £78/day. Flat moves, furniture pickup, storage trips and Luton van hire near Willesden Green Station.",
    images: [OG_IMAGE_WILLESDEN_GREEN],
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: PAGE_URL_WILLESDEN_GREEN,
  },
};

export default function VanHireWillesdenGreenPage() {
  return (
    <main className="min-h-screen bg-[#0f172b]">
      <Script
        id="willesden-green-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(willesdenGreenSchema),
        }}
      />
      <Script
        id="willesden-green-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(willesdenGreenFAQSchema),
        }}
      />

      <WillesdenGreenVanHireStatic />
    </main>
  );
}
