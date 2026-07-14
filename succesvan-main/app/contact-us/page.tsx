import { Metadata } from "next";
import FAQComponent from "@/components/static/fAQSection";
import Contact from "@/components/static/contactUs";
import Script from "next/script";
import { contactSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Contact Us - Success Van Hire | Get in Touch for Van Rental London",
  description:
    "Contact Success Van Hire for reliable van rental services in London. Get quotes, ask questions, or book your van today. Phone, email, and online booking available.",
  keywords:
    "contact success van hire, van rental london contact, book van hire, van rental quotes london, success van hire phone number",
  openGraph: {
    title: "Contact Success Van Hire - Van Rental London",
    description:
      "Get in touch with London's trusted van rental service. Quick quotes, easy booking, and expert support available.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.successvanhire.co.uk/contact-us",
  },
};

export default function ContactUs() {
  const vanHireFAQs = [
    {
      question: "What is the age requirement to rent a van?",
      answer:
        "We accept drivers aged 25-70yrs with a full clean licence. If you are 21-24, 70-76, or have certain endorsements it may still be possible to hire if arranged by phone with the branch prior to pick up. Insurance charges and the excess may vary.",
      category: "Requirements",
    },
    {
      question: "How can I rent a van?",
      answer:
        "You can do this by sending your request on our website or by sending an Email or giving a call.",
      category: "Booking",
    },
    {
      question: "What does the breakdown cover include?",
      answer:
        "This breakdown cover is exclusive to the UK and the insured drivers only. Driver induced faults are not covered by our breakdown insurance and therefore are chargeable. These include, but are not limited to: Misfuel, Wheel change, damaged tyres, Out of fuel, Lockout, Lost/broken key, RTA recovery (unless fault of 3rd party). We do not provide breakdown cover for vehicles going off the UK mainland.",
      category: "Insurance",
    },
    {
      question: "What do I need to rent a van?",
      answer:
        "Your ID, Valid driving licences, A proof of address, and your bank card.",
      category: "Requirements",
    },
    {
      question: "What is your cancellation policy?",
      answer:
        "We recognise that some travel plans may change. We can therefore offer to move your booking to another date in the future without charge. If you wish to cancel your booking you will be charged a third of the cost of the booking unless it is cancelled within 24 hours of the booking being made. Bookings cancelled 24hrs before the day of collection will lose full payment.",
      category: "Policies",
    },
    {
      question: "Can I get the van delivered to my address?",
      answer: "Yes, you can order it. But it may cause extra charge.",
      category: "Delivery",
    },
    {
      question: "What does the rental insurance cover?",
      answer:
        "Our insurance covers third-party liability and damage to the rented van. However, it excludes personal belongings, negligence-related damage, and unauthorized driver use.",
      category: "Insurance",
    },
    {
      question: "Can I purchase additional coverage?",
      answer:
        "Yes, you can opt for comprehensive coverage for added peace of mind.",
      category: "Insurance",
    },
    {
      question: "What happens if I return the van late?",
      answer:
        "Late returns are subject to additional charges based on the rental agreement. Contact us immediately to avoid penalties.",
      category: "Policies",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept credit and debit cards, bank transfers, and cash. Ensure all payments are completed before the rental start date.",
      category: "Payment",
    },
    {
      question: "Is there a mileage cap for rentals?",
      answer:
        "Standard rentals come with unlimited mileage unless stated otherwise. Check your agreement for specifics.",
      category: "Rental Terms",
    },
    {
      question: "Can another person drive the van?",
      answer:
        "Yes, additional drivers are allowed if pre-registered and meet our criteria. An extra fee may apply.",
      category: "Rental Terms",
    },
    {
      question: "What vans are available for hire?",
      answer:
        "We offer a variety of van types, including small transit vans, medium-sized panel vans, and large Luton vans with tail lifts.",
      category: "Fleet",
    },
    {
      question: "Is breakdown assistance included?",
      answer:
        "Yes, all rentals include roadside assistance for mechanical issues. You'll receive a contact number with your rental documentation.",
      category: "Support",
    },
    {
      question: "Do I need to refuel the van before returning it?",
      answer:
        "Yes, we operate a 'full-to-full' fuel policy. This means the van will be provided with a full tank, and it should be returned the same way. Failure to do so may result in refueling charges. And do read all FAQ questions.",
      category: "Policies",
    },
  ];
  return (
    <>
      {/* ✅ Schema.org JSON-LD */}
      <Script
        id="contact-us-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(contactSchema),
        }}
      />
      <Contact />
      <FAQComponent
        title="Frequently Asked Questions"
        subtitle="Find answers to common questions about our van hire services"
        faqs={vanHireFAQs}
        showSearch={true}
        defaultOpen={0}
        accentColor="#fe9a00"
        backgroundColor="#0f172b"
      />{" "}
    </>
  );
}
