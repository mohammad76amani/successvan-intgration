import { Metadata } from "next";
import Script from "next/script";
import dynamic from "next/dynamic";

import { CheapVanHireLondonHero } from "@/components/pillar/CheapVanHireLondonPillar";
import CheapVanListing from "@/components/pillar/CheapVanListing";
import {
  cheapVanHireLondonSchema,
  cheapVanHireLondonFAQSchema,
} from "@/lib/schema";

const PricingBenefitsSection = dynamic(
  () =>
    import("@/components/pillar/CheapVanHireLondonPillar").then(
      (m) => m.PricingBenefitsSection,
    ),
  { loading: () => <div className="h-90" /> },
);

const WhyCheapSection = dynamic(
  () =>
    import("@/components/pillar/CheapVanHireLondonPillar").then(
      (m) => m.WhyCheapSection,
    ),
  { loading: () => <div className="h-80" /> },
);

const PricingTableSection = dynamic(
  () =>
    import("@/components/pillar/CheapVanHireLondonPillar").then(
      (m) => m.PricingTableSection,
    ),
  { loading: () => <div className="h-105" /> },
);

const SavingTipsSection = dynamic(
  () =>
    import("@/components/pillar/CheapVanHireLondonPillar").then(
      (m) => m.SavingTipsSection,
    ),
  { loading: () => <div className="h-80" /> },
);

const FAQSection = dynamic(
  () =>
    import("@/components/pillar/CheapVanHireLondonPillar").then(
      (m) => m.FAQSection,
    ),
  { loading: () => <div className="h-105" /> },
);

const FinalCTASection = dynamic(
  () =>
    import("@/components/pillar/CheapVanHireLondonPillar").then(
      (m) => m.FinalCTASection,
    ),
  { loading: () => <div className="h-65" /> },
);

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),
  title: "Cheap Van Hire London | Budget Van Rental from £78/Day",
  description:
    "Book cheap van hire in London from £78/day with Success Van Hire. Budget van hire, affordable van rental, clear prices, no hidden fees and flexible daily, weekly or monthly hire.",

  robots: {
    index: true,
    follow: true,
  },
  keywords: [
    "cheap van hire london",
    "cheap van rental london",
    "budget van hire london",
    "affordable van rental london",
    "low cost van hire london",
    "low cost van rental london",
    "cheapest van hire london",
    "best price van hire london",
    "cheap van hire near me",
    "cheap rental vans near me",
  ],
  openGraph: {
    title: "Cheap Van Hire London from £78/Day | Budget Van Rental",
    description:
      "Budget-friendly van rental in London from £78/day with clear pricing, no hidden fees and reliable vans.",
    url: "https://successvanhire.co.uk/cheap-van-hire-london",
    type: "website",
    images: [
      {
        url: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/cheap+van+hire.webp",
        width: 1200,
        height: 630,
        alt: "Cheap van hire London from Success Van Hire",
      },
    ],
  },
  alternates: {
    canonical: "https://successvanhire.co.uk/cheap-van-hire-london",
  },
};

export default function CheapVanHireLondonPage() {
  return (
    <main className="bg-slate-950">
      <Script
        id="cheap-van-hire-london-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(cheapVanHireLondonSchema),
        }}
      />

      <Script
        id="cheap-van-hire-london-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(cheapVanHireLondonFAQSchema),
        }}
      />

      <CheapVanHireLondonHero />
      <PricingBenefitsSection />
      <WhyCheapSection />

      <PricingTableSection />
      <CheapVanListing />
      <SavingTipsSection />
      <FAQSection />
      <FinalCTASection />
    </main>
  );
}
