// app/van-hire-colindale/page.tsx

import { Metadata } from "next";
import Script from "next/script";
import ColindaleVanHireStatic from "@/components/static/areas/colindale";
import { colindaleSchema, colindaleFAQSchema } from "@/lib/schema";

const PAGE_URL = "https://successvanhire.co.uk/van-hire-colindale";
const OG_IMAGE =
  "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/colindale.png";

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),

  title: "Van Hire Colindale | Local Van Rental NW9 from £78/Day",

  description:
    "Book van hire in Colindale NW9 from £78/day. Self-drive vans for moving, furniture pickup, business deliveries and Luton van hire near Colindale Station.",

  keywords: [
    "van hire Colindale",
    "van rental Colindale",
    "Colindale van hire",
    "van hire NW9",
    "van rental NW9",
    "cheap van hire Colindale",
    "Luton van hire Colindale",
    "self drive van hire Colindale",
    "moving van hire Colindale",
    "removal van hire Colindale",
    "van hire near Colindale Station",
    "van hire Hendon",
    "van hire Edgware",
    "van hire Burnt Oak",
    "van hire North West London",
  ],

  openGraph: {
    title: "Van Hire Colindale | Local Van Rental NW9 from £78/Day",
    description:
      "Reliable self-drive van hire in Colindale NW9 for moving, furniture pickup, business deliveries and Luton van hire across North West London.",
    url: PAGE_URL,
    type: "website",
    siteName: "Success Van Hire",
    locale: "en_GB",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Van hire Colindale NW9 — Success Van Hire local van rental",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire Colindale | Local Van Rental NW9 from £78/Day",
    description:
      "Affordable self-drive van hire in Colindale NW9 for house moves, furniture collection, business deliveries and Luton van hire.",
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

export default function VanHireColindalePage() {
  return (
    <main className="min-h-screen bg-[#0f172b]">
      <Script
        id="colindale-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(colindaleSchema) }}
      />
      <Script
        id="colindale-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(colindaleFAQSchema),
        }}
      />

      <ColindaleVanHireStatic />
    </main>
  );
}
