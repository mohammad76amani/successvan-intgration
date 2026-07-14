import { Metadata } from "next";
import {
  FridgeVanHireLondonHero,
  WhyChooseFridgeVanSection,
  FridgeVanFleetSection,
  FridgeVanCoverageAreasSection,
  FridgeVanUseCasesSection,
  FridgeVanBookingStepsSection,
  FridgeVanFAQSection,
  FridgeVanFinalCTASection,
} from "@/components/pillar/FridgeVanHireLondonPillar";
import Script from "next/script";
import { fridgeVanFAQSchema, fridgeVanSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Fridge Van Hire London | Refrigerated Van Rental from £99/day",
  description:
    "Affordable fridge van hire in London for chilled & frozen goods. Food delivery, catering, pharmaceuticals & florists. Small, medium & Luton refrigerated vans, +8°C to −20°C. Self‑drive or with driver. Book online.",
  keywords:
    "fridge van hire london, refrigerated van hire london, chiller van rental london, freezer van hire, food delivery van london, catering van hire, temperature controlled van london, frozen goods van hire",
  openGraph: {
    title: "Fridge Van Hire London | Refrigerated Van Rental from £99/Day",
    description:
      "Temperature‑controlled fridge van hire in London for chilled and frozen goods. +8°C to −20°C, ULEZ compliant, fully insured, and available today. Self‑drive or with a driver.",
    url: "https://successvanhire.co.uk/fridge-van-hire-london",
    type: "website",
    images: [
      {
        url: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/minibushire.webp",
        width: 1200,
        height: 630,
        alt: "Fridge Van Hire London - Success Van Hire",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fridge Van Hire London | Refrigerated Van Rental from £99/Day",
    description:
      "Chilled & frozen deliveries made easy with fridge van hire London. Small, medium & Luton refrigerated vans, ULEZ compliant, fully insured. Book online now.",
    images: ["https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/minibushire.webp"],
  },
  alternates: {
    canonical: "https://successvanhire.co.uk/fridge-van-hire-london",
  },
};

export default function FridgeVanHireLondonPage() {
  return (
    <>
      {/* Schema.org structured data */}
      <Script
        id="fridge-van-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(fridgeVanSchema),
        }}
      />
      <Script
        id="fridge-van-faq-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(fridgeVanFAQSchema),
        }}
      />
      <main>
        <FridgeVanHireLondonHero />
        <WhyChooseFridgeVanSection />
        <FridgeVanFleetSection />
        <FridgeVanCoverageAreasSection />
        <FridgeVanUseCasesSection />
        <FridgeVanBookingStepsSection />
        <FridgeVanFAQSection />
        <FridgeVanFinalCTASection />
      </main>
    </>
  );
}
