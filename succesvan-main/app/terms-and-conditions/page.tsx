import { Metadata } from "next";
import TermsAndConditions from "@/components/static/terms";
import Script from "next/script";
import { termsSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Terms and Conditions - Success Van Hire | Van Rental Terms London",
  description:
    "Read Success Van Hire's terms and conditions for van rental services in London. Important rental policies, insurance details, and booking conditions.",
  keywords:
    "success van hire terms, van rental conditions london, van hire policies, rental agreement terms, success van hire legal",
  openGraph: {
    title: "Terms and Conditions - Success Van Hire",
    description:
      "Important terms and conditions for van rental services. Read our policies before booking.",
    type: "website",
  },
  alternates: {
    canonical: "https://www.successvanhire.co.uk/terms-and-conditions",
  },
};

export default function TermsAndConditionsPage() {
  return (
    <>
      {/* ✅ Schema.org JSON-LD */}
      <Script
        id="about-us-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(termsSchema),
        }}
      />
      <TermsAndConditions />
    </>
  );
}
