import { Metadata } from "next";
import {
  MinibusHireLondonHero,
  WhyChooseMinibusSection,
  MinibusFleetSection,
  MinibusCoverageAreasSection,
  MinibusUseCasesSection,
  MinibusBookingStepsSection,
  MinibusFAQSection,
  MinibusFinalCTASection,
} from "@/components/pillar/MinibusHireLondonPillar";
import Script from "next/script";
import { minibusFAQSchema, minibusSchema } from "@/lib/schema";
import VanListingHome from "@/components/global/vanListingBackup";

export const metadata: Metadata = {
  title: "Minibus Hire London | 8–17 Seater Minibus Rental from £89/day",
  description:
    "Affordable minibus hire in London for groups, airport transfers, weddings & corporate events. Self‑drive or with driver. 8, 9, 12, 15 & 17‑seater options. Book online.",
  keywords:
    "minibus hire london, minibus rental london, 9 seater hire london, 12 seater minibus hire, 15 seater hire london, 17 seater minibus london, group travel london, airport transfer minibus",
  openGraph: {
    title: "Minibus Hire London | 8–17 Seater Minibus Rental from £89/Day",
    description:
      "Spacious minibus hire in London for groups of any size. Self‑drive or with a professional driver. ULEZ compliant, fully insured, and available today.",
    url: "https://successvanhire.co.uk/minibus-hire-london",
    type: "website",
    images: [
      {
        url: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/minibushire.webp",
        width: 1200,
        height: 630,
        alt: "Minibus Hire London - Success Van Hire",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Minibus Hire London | 8–17 Seater Rental from £89/Day",
    description:
      "Group travel made easy with minibus hire London. 8–17 seater options, ULEZ compliant, fully insured. Book online now.",
    images: [
      "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/minibushire.webp",
    ],
  },
  alternates: {
    canonical: "https://successvanhire.co.uk/minibus-hire-london",
  },
};

export default function MinibusHireLondonPage() {
  return (
    <>
      {/* Schema.org structured data */}
      <Script
        id="minibus-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(minibusSchema),
        }}
      />
      <Script
        id="minibus-faq-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(minibusFAQSchema),
        }}
      />
      <main>
        <MinibusHireLondonHero />
        <VanListingHome />
        <WhyChooseMinibusSection />
        <MinibusFleetSection />
        <MinibusCoverageAreasSection />
        <MinibusUseCasesSection />
        <MinibusBookingStepsSection />
        <MinibusFAQSection />
        <MinibusFinalCTASection />
      </main>
    </>
  );
}
