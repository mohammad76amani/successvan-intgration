import { Metadata } from "next";
import Script from "next/script";
import TagoreHero from "@/components/tagore-jayanti/TagoreHero";
import TagoreWhyTravel from "@/components/tagore-jayanti/TagoreWhyTravel";
import TagoreDiscount from "@/components/tagore-jayanti/TagoreDiscount";
import TagoreWhoFor from "@/components/tagore-jayanti/TagoreWhoFor";
import TagoreWhyMinibus from "@/components/tagore-jayanti/TagoreWhyMinibus";
import TagoreMinibusListing from "@/components/tagore-jayanti/TagoreMinibusListing";
import TagoreFAQ from "@/components/tagore-jayanti/TagoreFAQ";
import TagoreFinalCTA from "@/components/tagore-jayanti/TagoreFinalCTA";
import { tagoreJayantiFAQSchema, tagoreJayantiSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title:
    "Tagore Jayanti Celebration Minibus Hire in London | 10% Off Group Travel",
  description:
    "Celebrate Tagore Jayanti in London with easy group travel from Success Van. Book minibus hire for families, performers and community groups, and get 10% off for Tagore Jayanti Celebration travel.",
  keywords: [
    "Tagore Jayanti Celebration",
    "Tagore Jayanti Celebration London",
    "Tagore Jayanti minibus hire",
    "Tagore Jayanti group travel London",
    "Rabindra Jayanti transport London",
    "Indian cultural event minibus hire",
    "Bengali festival transport London",
    "minibus hire for Indian events London",
    "group transport for Tagore Jayanti",
    "Success Van minibus hire London",
  ],
  openGraph: {
    title:
      "Tagore Jayanti Celebration Minibus Hire in London | 10% Off Group Travel",
    description:
      "Celebrate Tagore Jayanti in London with easy group travel from Success Van. Book minibus hire for families, performers and community groups, and get 10% off for Tagore Jayanti Celebration travel.",
    url: "https://successvanhire.co.uk/tagore-jayanti-celebration-minibus-hire-london",
    type: "website",
    siteName: "Success Van Hire",
    images: [
      {
        url: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/tagore+jayanti+minibus+hire+London.webp",
        width: 1200,
        height: 630,
        alt: "Tagore Jayanti minibus hire in London for cultural celebrations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Tagore Jayanti Celebration Minibus Hire in London | 10% Off Group Travel",
    description:
      "Celebrate Tagore Jayanti in London with easy group travel from Success Van. Book minibus hire for families, performers and community groups, and get 10% off for Tagore Jayanti Celebration travel.",
    images:
      "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/tagore+jayanti+minibus+hire+London.webp",
  },
  alternates: {
    canonical: "https://successvanhire.co.uk/tagore-jayanti-celebration-minibus-hire-london",
  },
};

export default function TagoreJayantiPage() {
  return (
    <>
      {/* Service Schema */}
      <Script
        id="tagore-jayanti-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(tagoreJayantiSchema),
        }}
      />

      {/* FAQ Schema */}
      <Script
        id="tagore-jayanti-faq-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(tagoreJayantiFAQSchema),
        }}
      />

      <main className="bg-white">
        <TagoreHero />
        <TagoreMinibusListing />
        <TagoreWhyTravel />
        <TagoreDiscount />
        <TagoreMinibusListing />
        <TagoreWhoFor />
        <TagoreWhyMinibus />
        <TagoreMinibusListing />
        <TagoreFAQ />
        <TagoreFinalCTA />
      </main>
    </>
  );
}
