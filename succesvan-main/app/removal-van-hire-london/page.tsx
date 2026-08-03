import { Metadata } from "next";
import Script from "next/script";
import { RemovalVanHireLondonHero } from "@/components/pillar/RemovalVanHireLondonPillar";
import RemovalVanListing from "@/components/pillar/RemovalVanListing";
import { removalVanSchema, removalFAQSchema } from "@/lib/schema";
import dynamic from "next/dynamic";
const WhyChooseRemovalSection = dynamic(
  () =>
    import("@/components/pillar/RemovalVanHireLondonPillar").then(
      (m) => m.WhyChooseRemovalSection,
    ),
  { loading: () => <div className="h-90" /> },
);

const VanSizesForMovingSection = dynamic(
  () =>
    import("@/components/pillar/RemovalVanHireLondonPillar").then(
      (m) => m.VanSizesForMovingSection,
    ),
  { loading: () => <div className="h-105" /> },
);

const MovingTipsSection = dynamic(
  () =>
    import("@/components/pillar/RemovalVanHireLondonPillar").then(
      (m) => m.MovingTipsSection,
    ),
  { loading: () => <div className="h-90" /> },
);

const RemovalFAQSection = dynamic(
  () =>
    import("@/components/pillar/RemovalVanHireLondonPillar").then(
      (m) => m.RemovalFAQSection,
    ),
  { loading: () => <div className="h-105" /> },
);

const RemovalFinalCTA = dynamic(
  () =>
    import("@/components/pillar/RemovalVanHireLondonPillar").then(
      (m) => m.RemovalFinalCTA,
    ),
  { loading: () => <div className="h-70" /> },
);
export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),
  title: "Removal Van Hire London | Moving Vans from £132/Day",
  description:
    "Book removal van hire in London from £132/day. Self-drive moving vans for house moves, flat moves, furniture transport, storage runs and office relocations.",

  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://successvanhire.co.uk/removal-van-hire-london",
  },

  keywords: [
    "removal van hire London",
    "moving van hire London",
    "self drive removal van hire London",
    "house move van hire London",
    "van hire for moving London",
    "moving van rental London",
    "van rental for house move",
    "flat move van hire London",
    "office move van hire London",
    "furniture removal van hire",
    "cheap removal van hire London",
    "Luton van hire for moving",
    "large van hire London",
    "short term removal van hire",
    "weekend moving van hire London",
    "storage run van hire",
  ],

  openGraph: {
    title: "Removal Van Hire London | Moving Vans from £132/Day",
    description:
      "Affordable self-drive removal vans for house moves, flat moves, furniture transport, office moves and storage runs across London.",
    url: "https://successvanhire.co.uk/removal-van-hire-london",
    type: "website",
    siteName: "Success Van Hire",
    locale: "en_GB",
    images: [
      {
        url: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/crew+cab+van+removal+van+hire.webp",
        width: 1200,
        height: 630,
        alt: "Removal van hire London for house moves and furniture transport",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Removal Van Hire London | Self-Drive Moving Vans",
    description:
      "Book affordable self-drive removal vans in London for house moves, flat moves and furniture transport from £132/day.",
    images: [
      "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/crew+cab+van+removal+van+hire.webp",
    ],
  },
};

export default function RemovalVanHireLondonPage() {
  return (
    <main className="min-h-screen bg-[#0a0e1a]">
      <Script
        id="removal-van-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(removalVanSchema),
        }}
      />
      <Script
        id="removal-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(removalFAQSchema),
        }}
      />
      <RemovalVanHireLondonHero />
      <WhyChooseRemovalSection />
      <VanSizesForMovingSection />
      <RemovalVanListing />
      <MovingTipsSection />
      <RemovalFAQSection />
      <RemovalFinalCTA />
    </main>
  );
}
