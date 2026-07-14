import { Metadata } from "next";
import Script from "next/script";
import { LutonVanHireLondonHero } from "@/components/pillar/LutonVanHireLondonPillar";
import LutonVanListing from "@/components/pillar/LutonVanListing";
import {
  lutonVanHireLondonSchema,
  lutonVanHireLondonFAQSchema,
} from "@/lib/schema";
import dynamic from "next/dynamic";
const WhyChooseLutonSection = dynamic(
  () =>
    import("@/components/pillar/LutonVanHireLondonPillar").then(
      (m) => m.WhyChooseLutonSection,
    ),
  { loading: () => <div className="h-90" /> },
);

const LutonSpecificationsSection = dynamic(
  () =>
    import("@/components/pillar/LutonVanHireLondonPillar").then(
      (m) => m.LutonSpecificationsSection,
    ),
  { loading: () => <div className="h-105" /> },
);

const TailLiftBenefitsSection = dynamic(
  () =>
    import("@/components/pillar/LutonVanHireLondonPillar").then(
      (m) => m.TailLiftBenefitsSection,
    ),
  { loading: () => <div className="h-90" /> },
);

const LutonUseCasesSection = dynamic(
  () =>
    import("@/components/pillar/LutonVanHireLondonPillar").then(
      (m) => m.LutonUseCasesSection,
    ),
  { loading: () => <div className="h-90" /> },
);

const LutonFAQSection = dynamic(
  () =>
    import("@/components/pillar/LutonVanHireLondonPillar").then(
      (m) => m.LutonFAQSection,
    ),
  { loading: () => <div className="h-105" /> },
);

const LutonFinalCTA = dynamic(
  () =>
    import("@/components/pillar/LutonVanHireLondonPillar").then(
      (m) => m.LutonFinalCTA,
    ),
  { loading: () => <div className="h-70" /> }, 
);
export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),
  title: "Luton Van Hire London | Tail Lift Van Rental from £132/Day",
  description:
    "Book Luton van hire in London from £132/day. Large 20m³ Luton van rental with tail lift, ideal for house moves, furniture transport and commercial deliveries.",

  robots: {
    index: true,
    follow: true,
  },

  keywords: [
    "luton van hire london",
    "luton van rental london",
    "hire a luton van london",
    "rent a luton van london",
    "luton van hire with tail lift london",
    "tail lift van hire london",
    "luton van hire london prices",
    "large van hire london",
    "big van hire london",
    "box van hire london",
    "luton van for house move",
    "moving house luton van hire",
    "commercial luton van hire",
  ],
  alternates: {
    canonical: "https://successvanhire.co.uk/luton-van-hire-london",
  },

  openGraph: {
    title: "Luton Van Hire London | Tail Lift Van Rental from £132/Day",
    description:
      "Large 20m³ Luton van hire in London with tail lift. Ideal for house moves, bulky furniture and commercial deliveries.",
    url: "https://successvanhire.co.uk/luton-van-hire-london",
    type: "website",
    images: [
      {
        url: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/luton+van+.jpg",
        width: 1200,
        height: 630,
        alt: "Luton van hire London with tail lift",
      },
    ],
  },
};

export default function LutonVanHireLondonPage() {
  return (
    <main className="bg-slate-950">
      <Script
        id="luton-van-hire-london-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(lutonVanHireLondonSchema),
        }}
      />

      <Script
        id="luton-van-hire-london-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(lutonVanHireLondonFAQSchema),
        }}
      />

      <LutonVanHireLondonHero />
      <WhyChooseLutonSection />
      <LutonVanListing />
      <LutonSpecificationsSection />
      <TailLiftBenefitsSection />
      <LutonUseCasesSection />
      <LutonFAQSection />
      <LutonFinalCTA />
    </main>
  );
}
