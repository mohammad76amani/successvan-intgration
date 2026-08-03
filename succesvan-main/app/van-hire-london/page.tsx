// app/van-hire-london/page.tsx

import { Metadata } from "next";
import Script from "next/script";
import dynamic from "next/dynamic";
import {
  VanHireLondonHero,
  WhyChooseSection,
  VanTypesSection,
} from "@/components/pillar/VanHireLondonPillar";
import { vanHireLondonFAQSchema, vanHireLondonSchema } from "@/lib/schema";

// Dynamic imports برای کامپوننت‌های below-the-fold
const AllVanListing = dynamic(
  () => import("@/components/pillar/AllVanListing"),
  {
    loading: () => <div className="h-96" />,
  },
);

const CoverageAreasSection = dynamic(
  () =>
    import("@/components/pillar/VanHireLondonPillar").then(
      (m) => m.CoverageAreasSection,
    ),
  { loading: () => <div className="h-96" /> },
);

const UseCasesSection = dynamic(
  () =>
    import("@/components/pillar/VanHireLondonPillar").then(
      (m) => m.UseCasesSection,
    ),
  { loading: () => <div className="h-96" /> },
);

const BookingStepsSection = dynamic(
  () =>
    import("@/components/pillar/VanHireLondonPillar").then(
      (m) => m.BookingStepsSection,
    ),
  { loading: () => <div className="h-96" /> },
);

const FAQSection = dynamic(
  () =>
    import("@/components/pillar/VanHireLondonPillar").then((m) => m.FAQSection),
  { loading: () => <div className="h-96" /> },
);

const FinalCTASection = dynamic(
  () =>
    import("@/components/pillar/VanHireLondonPillar").then(
      (m) => m.FinalCTASection,
    ),
  { loading: () => <div className="h-96" /> },
);

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),
  title: "Van Hire London | Self-Drive Van Rental | Success Van Hire",
  description:
    "Book van hire in London with Success Van Hire. Compare small, Transit, large and Luton vans for moves, deliveries and business use with clear self-drive booking.",
  robots: { index: true, follow: true },
  keywords: [
    "van hire london",
    "london van hire",
    "van rental london",
    "van rental in london",
    "hire a van london",
    "self-drive van hire london",
  ],
  openGraph: {
    title: "Van Hire London | Self-Drive Van Rental | Success Van Hire",
    description:
      "Self-drive van hire in London with small, Transit, large and Luton vans for moving, furniture pickup, business deliveries and short-term transport.",
    url: "https://successvanhire.co.uk/van-hire-london",
    type: "website",
    images: [
      {
        url: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/van-hire-london.jpg",
        width: 1200,
        height: 630,
        alt: "Self-drive van hire London - Success Van Hire",
      },
    ],
  },
  alternates: {
    canonical: "https://successvanhire.co.uk/van-hire-london",
  },

  twitter: {
    card: "summary_large_image",
    title: "Van Hire London | Self-Drive Van Rental | Success Van Hire",
    description:
      "Compare self-drive vans in London and book online with Success Van Hire.",
    images: [
      "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/van-hire-london.jpg",
    ],
  },
};

export default function VanHireLondonPage() {
  return (
    <main className="bg-slate-950">
      {/* Schemas - با strategy="afterInteractive" برای عدم بلاک کردن */}
      <Script
        id="van-hire-london-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(vanHireLondonSchema),
        }}
      />
      <Script
        id="van-hire-london-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(vanHireLondonFAQSchema),
        }}
      />

      <VanHireLondonHero />
      <AllVanListing />

      <WhyChooseSection />
      <VanTypesSection />
      <CoverageAreasSection />
      <UseCasesSection />
      <BookingStepsSection />
      <FAQSection />
      <FinalCTASection />
    </main>
  );
}
