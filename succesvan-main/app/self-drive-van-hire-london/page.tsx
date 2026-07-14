import { SelfDriveVanHireLondonContent } from "@/components/pillar/SelfDriveVanHireLondonContent";
import type { Metadata } from "next";
import Script from "next/script";

// ============================================================
// METADATA
// ============================================================

export const metadata: Metadata = {
  title:
    "Self-Drive Van Hire London | Flexible Van Rental from Success Van Hire",
  description:
    "Book self-drive van hire in London with Success Van Hire. Flexible short-term and long-term van rental, UK & EU licences accepted, insured vehicles, EU6 clean air vans, and fast booking from NW2.",
  keywords:
    "self-drive van hire London, self drive van rental London, van hire London, van rental London, cheap self drive van hire London, short term van hire London, long term van hire London, business van rental London, moving van hire London, Luton van hire London, automatic van hire London, van hire near me, van hire North West London, van hire Wembley, van hire Camden, van hire Brent Cross, van hire Hendon, van hire Kilburn, van hire Ealing, van hire Harrow",
  
  openGraph: {
    title:
      "Self-Drive Van Hire London | Flexible Van Rental from Success Van Hire",
    description:
      "Book self-drive van hire in London with Success Van Hire. Flexible short-term and long-term van rental, UK & EU licences accepted, insured vehicles, EU6 clean air vans, and fast booking from NW2.",
    url: "https://successvanhire.co.uk/self-drive-van-hire-london",
    siteName: "Success Van Hire",
    locale: "en_GB",
    type: "website",
    images:
      "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/Self-Drive+Van+Hire.webp",
  },
  twitter: {
    card: "summary_large_image",
    images:"https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/Self-Drive+Van+Hire.webp",
    title:
      "Self-Drive Van Hire London | Flexible Van Rental from Success Van Hire",
    description:
      "Book self-drive van hire in London with Success Van Hire. Flexible short-term and long-term van rental, UK & EU licences accepted, insured vehicles, EU6 clean air vans, and fast booking from NW2.",
  },
  alternates: {
    canonical: "https://successvanhire.co.uk/self-drive-van-hire-london",
  },
};

// ============================================================
// SCHEMA / STRUCTURED DATA
// ============================================================

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://successvanhire.co.uk/#localbusiness",
      name: "Success Van Hire",
      url: "https://successvanhire.co.uk",
      telephone: "+44 20 3011 1198",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Strata House, Waterloo Road",
        addressLocality: "London",
        postalCode: "NW2 7UH",
        addressCountry: "GB",
      },
      areaServed: [
        { "@type": "Place", name: "Brent Cross" },
        { "@type": "Place", name: "Camden" },
        { "@type": "Place", name: "Colindale" },
        { "@type": "Place", name: "Cricklewood" },
        { "@type": "Place", name: "Dollis Hill" },
        { "@type": "Place", name: "Ealing" },
        { "@type": "Place", name: "Edgware" },
        { "@type": "Place", name: "Golders Green" },
        { "@type": "Place", name: "Hampstead" },
        { "@type": "Place", name: "Harrow" },
        { "@type": "Place", name: "Hendon" },
        { "@type": "Place", name: "Kilburn" },
        { "@type": "Place", name: "Mill Hill" },
        { "@type": "Place", name: "Neasden" },
        { "@type": "Place", name: "Park Royal" },
        { "@type": "Place", name: "Staples Corner" },
        { "@type": "Place", name: "Wembley" },
        { "@type": "Place", name: "West Hampstead" },
        { "@type": "Place", name: "Willesden Green" },
      ],
    },
    {
      "@type": "Service",
      "@id": "https://successvanhire.co.uk/self-drive-van-hire-london/#service",
      name: "Self-Drive Van Hire London",
      serviceType: "Self-drive van hire and van rental",
      provider: {
        "@id": "https://successvanhire.co.uk/#localbusiness",
      },
      areaServed: {
        "@type": "City",
        name: "London",
      },
      url: "https://successvanhire.co.uk/self-drive-van-hire-london",
      description:
        "Need a reliable van you can drive yourself? Success Van Hire provides flexible self-drive van hire in London for moving home, business deliveries, events, student moves, trade jobs, and long or short-term rental needs.",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://successvanhire.co.uk",
        },

        {
          "@type": "ListItem",
          position: 2,
          name: "Self-Drive Van Hire London",
          item: "https://successvanhire.co.uk/self-drive-van-hire-london",
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is self-drive van hire?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Self-drive van hire means you rent a van and drive it yourself. It is a flexible option for moving home, business deliveries, furniture collection, student moves, trade work, and personal transport needs.",
          },
        },
        {
          "@type": "Question",
          name: "Do you offer self-drive van hire in London?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Success Van Hire provides self-drive van hire in London, with convenient access from our location at Strata House, Waterloo Road, London, NW2 7UH.",
          },
        },
        {
          "@type": "Question",
          name: "Can I book a van for short-term rental?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. We offer short-term van hire options for customers who need a van for a day, weekend, quick move, delivery, or temporary transport job.",
          },
        },
        {
          "@type": "Question",
          name: "Do you offer long-term van rental?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. We provide long-term van rental options for businesses, contractors, delivery work, trade use, and customers who need a vehicle for an extended period.",
          },
        },
        {
          "@type": "Question",
          name: "What driving licence do I need?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We accept full UK and EU driving licences. Licence verification is handled through a fast and simple process before the rental is confirmed.",
          },
        },
        {
          "@type": "Question",
          name: "Are your vans insured?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Rental reservations are backed by insurance coverage, helping customers drive with confidence.",
          },
        },
        {
          "@type": "Question",
          name: "Do your vans meet clean air standards?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Our vans meet EU6 emission standards as part of our commitment to cleaner and more environmentally responsible transport.",
          },
        },
        {
          "@type": "Question",
          name: "Can I hire a van for moving house?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Self-drive van hire is ideal for moving home, flat moves, furniture transport, storage runs, and bulky item collection.",
          },
        },
        {
          "@type": "Question",
          name: "Do you offer Luton van hire?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Luton vans are suitable for larger moves, bulky furniture, business deliveries, and high-volume transport needs. You can view our Luton Van Hire London service for more details.",
          },
        },
        {
          "@type": "Question",
          name: "Can businesses rent vans from Success Van Hire?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. We support B2B customers with business van rental for deliveries, stock movement, equipment transport, events, and long-term use.",
          },
        },
        {
          "@type": "Question",
          name: "Do you offer automatic vans?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Automatic van rental is available and is a convenient choice for drivers who prefer easier driving in London traffic.",
          },
        },
        {
          "@type": "Question",
          name: "Which areas of London do you cover?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We serve customers across London, especially North West London areas including Brent Cross, Camden, Colindale, Cricklewood, Dollis Hill, Ealing, Edgware, Golders Green, Hampstead, Harrow, Hendon, Kilburn, Mill Hill, Neasden, Park Royal, Staples Corner, Wembley, West Hampstead, and Willesden Green.",
          },
        },
        {
          "@type": "Question",
          name: "Can I book self-drive van hire online?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. You can start your reservation online through our booking page or contact our team by phone for assistance.",
          },
        },
        {
          "@type": "Question",
          name: "Is there a hidden fee?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. We aim to provide clear pricing with van hire options that fit different budgets and no hidden fees.",
          },
        },
        {
          "@type": "Question",
          name: "How do I contact Success Van Hire?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "You can call Success Van Hire on +44 20 3011 1198 or visit us at Strata House, Waterloo Road, London, NW2 7UH.",
          },
        },
      ],
    },
  ],
};

// ============================================================
// PAGE
// ============================================================

export default function SelfDriveVanHireLondonPage() {
  return (
    <>
      <Script
        id="self-drive-van-hire-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SelfDriveVanHireLondonContent />
    </>
  );
}
