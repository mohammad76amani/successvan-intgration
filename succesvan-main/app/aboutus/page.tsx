import Script from "next/script";
import { Metadata } from "next";
import MeetOurTeam from "@/components/static/meetOurTeam";
import WhatWeOffer from "@/components/static/whatWeOffer";
import WhyWereDifferent from "@/components/static/whyWereDifferent";
import { aboutUsSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title:
    "About Us - Success Van Hire | Professional Van Rental Services London",
  description:
    "Learn about Success Van Hire - London's trusted van rental company. Discover our team, services, and commitment to providing reliable, affordable van hire solutions.",
  keywords:
    "about success van hire, van rental london, professional van hire, reliable van rental, london van hire company",
  openGraph: {
    title: "About Success Van Hire - Professional Van Rental London",
    description:
      "Meet the team behind London's most reliable van rental service. Quality vans, exceptional service, competitive prices.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.successvanhire.co.uk/aboutus",
  },
};

export default function AboutUs() {
  return (
    <>
      {/* ✅ Schema.org JSON-LD */}
      <Script
        id="about-us-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(aboutUsSchema),
        }}
      />

      <WhatWeOffer />
      <WhyWereDifferent />
      <MeetOurTeam />
    </>
  );
}
