import Script from "next/script";
import { Metadata } from "next";
import AutomaticVanHire from "@/components/static/automaticvanHire";
import { automaticVanHireSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title:
    "Automatic Van Hire London | Automatic Transmission Van Rental | Success Van Hire",
  description:
    "Rent automatic vans in London with Success Van Hire. Easy-to-drive automatic transmission vans perfect for stress-free moving and deliveries.",
  keywords:
    "automatic van hire london, automatic van rental, easy drive vans london, automatic transmission van hire, success van hire automatic",
  openGraph: {
    title: "Automatic Van Hire London - Easy Drive Van Rental",
    description:
      "Stress-free van rental with automatic transmission. Perfect for comfortable driving in London traffic.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.successvanhire.co.uk/automatic-van-hire-london",
  },
};

export default function AutomaticVanHirePage() {
  return (
    <>
      {/* ✅ Service Schema */}
      <Script
        id="automatic-van-hire-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(automaticVanHireSchema),
        }}
      />

      <AutomaticVanHire />
    </>
  );
}
