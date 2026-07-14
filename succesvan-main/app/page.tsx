import HomeContainer from "@/components/static/homeContainer";
import { homeFAQSchema, homeSchema } from "@/lib/schema";
import { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Success Van Hire | Professional Van Rental Services London",
  metadataBase: new URL("https://successvanhire.co.uk"),
  description:
    "Rent a van in London with Success Van Hire. Affordable, reliable van rental services with a wide selection of vehicles. Book your van today!",
  keywords:
    "van hire london, van rental london, rent a van, professional van hire, affordable van rental, london van rental company",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Success Van Hire - Professional Van Rental London",
    description:
      "Affordable and reliable van rental in London. Wide selection of vans, competitive prices, and exceptional service.",
    type: "website",
  },
  alternates: {
    canonical: "https://successvanhire.co.uk/",
  },
};

export default function Home() {
  return (
    <main>
      <Script
        id="home-page-schema"
        type="application/ld+json"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeSchema),
        }}
      />
      {/* FAQ Schema */}
      <Script
        id="home-faq-schema"
        type="application/ld+json"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeFAQSchema),
        }}
      />
      <HomeContainer />
    </main>
  );
}
