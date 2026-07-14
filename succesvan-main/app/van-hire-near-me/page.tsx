import { Metadata } from "next";
import {
  VanHireNearMeHero,
 
} from "@/components/pillar/VanHireNearMePillar";
import Script from "next/script";
import { vanHireNearMeSchema, vanHireNearMeFAQSchema } from "@/lib/schema";
import dynamic from "next/dynamic";


const WhyChooseVanHireNearMeSection = dynamic(
  () =>
    import("@/components/pillar/VanHireNearMePillar").then(
      (m) => m.WhyChooseVanHireNearMeSection,
    ),
  { loading: () => <div className="h-90" /> },
);

const VanFleetNearMeSection = dynamic(
  () =>
    import("@/components/pillar/VanHireNearMePillar").then(
      (m) => m.VanFleetNearMeSection,
    ),
  { loading: () => <div className="h-105" /> },
);

const VanCoverageAreasNearMeSection = dynamic(
  () =>
    import("@/components/pillar/VanHireNearMePillar").then(
      (m) => m.VanCoverageAreasNearMeSection,
    ),
  { loading: () => <div className="h-105" /> },
);

const VanUseCasesNearMeSection = dynamic(
  () =>
    import("@/components/pillar/VanHireNearMePillar").then(
      (m) => m.VanUseCasesNearMeSection,
    ),
  { loading: () => <div className="h-90" /> },
);

const VanBookingStepsNearMeSection = dynamic(
  () =>
    import("@/components/pillar/VanHireNearMePillar").then(
      (m) => m.VanBookingStepsNearMeSection,
    ),
  { loading: () => <div className="h-80" /> },
);

const VanFAQNearMeSection = dynamic(
  () =>
    import("@/components/pillar/VanHireNearMePillar").then(
      (m) => m.VanFAQNearMeSection,
    ),
  { loading: () => <div className="h-105" /> },
);

const VanFinalCTANearMeSection = dynamic(
  () =>
    import("@/components/pillar/VanHireNearMePillar").then(
      (m) => m.VanFinalCTANearMeSection,
    ),
  { loading: () => <div className="h-70" /> },
);


export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),
  title: "Van Hire Near Me London | Local Van Rental from £78/Day",
  description:
    "Find van hire near you in London with Success Van Hire. Local van rental from £78/day, including small, medium, large and Luton vans. Self-drive options available across Greater London.",

  robots: {
    index: true,
    follow: true,
  },

  keywords: [
    "van hire near me",
    "van rental near me",
    "hire a van near me",
    "local van hire London",
    "van hire near me London",
    "van rental near me London",
    "small van hire near me",
    "Luton van hire near me",
    "self-drive van hire near me",
    "cheap van hire near me",
    "van hire in my area",
    "van rental in my area",
  ],

  openGraph: {
    title: "Van Hire Near Me London | Local Van Rental from £78/Day",
    description:
      "Find local van hire near you in London. Small, medium, large and Luton vans available with self-drive rental options across Greater London.",
    url: "https://successvanhire.co.uk/van-hire-near-me",
    type: "website",
    images: [
      {
        url: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/van+hire+near+me.webp",
        width: 1200,
        height: 630,
        alt: "Van hire near me London - Success Van Hire",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire Near Me London | Local Van Rental from £78/Day",
    description:
      "Find local van hire near you in London. Self-drive vans available for moving, deliveries and business use.",
    images: [
      "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/van+hire+near+me.webp",
    ],
  },
  alternates: {
    canonical: "https://successvanhire.co.uk/van-hire-near-me",
  },

   
};

export default function VanHireNearMePage() {
  return (
    <>
      {/* Schema.org structured data */}
      <Script
        id="van-hire-near-me-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(vanHireNearMeSchema),
        }}
      />
      <Script
        id="van-hire-near-me-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(vanHireNearMeFAQSchema),
        }}
      />
      <main>
        <VanHireNearMeHero />
        <WhyChooseVanHireNearMeSection />
        <VanFleetNearMeSection />
        <VanCoverageAreasNearMeSection />
        <VanUseCasesNearMeSection />
        <VanBookingStepsNearMeSection />
        <VanFAQNearMeSection />
        <VanFinalCTANearMeSection />
      </main>
    </>
  );
}