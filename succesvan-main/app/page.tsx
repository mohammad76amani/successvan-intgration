import HomeContainer from "@/components/static/homeContainer";
import { homeFAQSchema, homeSchema } from "@/lib/schema";
import { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Success Van Hire | Van Rental Company in London",
  metadataBase: new URL("https://successvanhire.co.uk"),
  description:
    "Meet Success Van Hire, a London van rental company with self-drive vans, minibuses, clear booking, modern vehicles and helpful local support.",
  keywords:
    "Success Van Hire, van rental company London, London van rental company, self-drive van rental",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Success Van Hire | Van Rental Company in London",
    description:
      "Discover Success Van Hire, our self-drive fleet, company values, booking support and vehicle rental services across London.",
    type: "website",
  },
  alternates: {
    canonical: "https://successvanhire.co.uk",
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
