"use client";

import { useState, Suspense, useEffect } from "react";
import dynamic from "next/dynamic";
import ReservationHero from "@/components/static/ReservationHero";
import VanListingHome from "@/components/global/vanListingBackup";
import type { FAQItem } from "@/components/static/fAQSection";

// Dynamically import below-the-fold components
const HeroSlider = dynamic(() => import("@/components/static/HeroSlider"), {
  loading: () => <div className="min-h-100" />,
  ssr: true,
});

const WhyUs = dynamic(() => import("@/components/static/whyus"), {
  loading: () => <div className="min-h-75" />,
  ssr: true,
});

const Testimonials = dynamic(() => import("@/components/static/testominial"), {
  loading: () => <div className="min-h-75" />,
  ssr: false,
});

const AboutUs = dynamic(() => import("@/components/static/aboutHome"), {
  loading: () => <div className="min-h-75" />,
  ssr: false,
});

const FAQComponent = dynamic(() => import("@/components/static/fAQSection"), {
  loading: () => <div className="min-h-100" />,
  ssr: false,
});

const SEODescription = dynamic(() => import("@/components/global/seoDesc"), {
  loading: () => <div className="min-h-25" />,
  ssr: false,
});

// Modal loaded only when needed — no SSR, no preload
const ReservationModal = dynamic(
  () => import("@/components/global/ReservationModal"),
  { ssr: false },
);

const FAQ_DATA: FAQItem[] = [
  {
    question: "What does Success Van Hire offer?",
    answer:
      "Success Van Hire provides self-drive vans and minibuses for personal, moving, group travel and business transport needs. The fleet includes small, medium, large and Luton-style van options, plus minibuses for larger passenger groups.",
    category: "Vehicles",
  },
  {
    question: "How long has Success Van Hire been operating?",
    answer:
      "The project describes Success Van Hire as a London rental specialist with over 15 years of experience supporting short-term and long-term self-drive customers.",
    category: "About Us",
  },
  {
    question: "What driving licences do you accept?",
    answer:
      "You need a full valid UK or EU driving licence. The team can help with the licence verification process before collection.",
    category: "Requirements",
  },
  {
    question: "Are the vehicles suitable for London driving?",
    answer:
      "The fleet is described in the project as modern, clean and well maintained, with EU6 emission standards referenced across the site.",
    category: "Vehicles",
  },
  {
    question: "Is insurance included with self-drive rental?",
    answer:
      "The site states that self-drive rental includes insurance cover. The team will explain the booking, documents and any relevant terms before you drive away.",
    category: "Booking",
  },
  {
    question: "How does pricing work?",
    answer:
      "Pricing depends on the vehicle, dates and hire duration. Success Van Hire presents costs during the booking process so customers can review the details before confirming.",
    category: "Pricing",
  },
  {
    question: "How many vehicles are in the fleet?",
    answer:
      "The site references a modern fleet of 50+ vehicles, including different van sizes and minibuses.",
    category: "About Us",
  },
  {
    question: "Can I reserve online?",
    answer:
      "Yes. You can choose a vehicle, select dates and submit a reservation online, with support available if you need help choosing the right option.",
    category: "Booking",
  },
  {
    question: "What jobs can the vehicles be used for?",
    answer:
      "Customers use Success Van Hire vehicles for house moves, student moves, furniture collection, courier work, business deliveries, events, group travel and everyday transport needs.",
    category: "Services",
  },
  {
    question: "Where can I compare dedicated London van options?",
    answer:
      "For transactional booking details, vehicle comparisons and local service information, visit the dedicated van hire in London page or call Success Van Hire on +44 20 3011 1198.",
    category: "Contact",
  },
];

const SEO_CONTENT = `<h2>About Success Van Hire</h2>
<p>
  Success Van Hire is a London van rental company helping customers find practical
  self-drive vehicles for moving, business transport, deliveries and group travel.
  The homepage introduces the company, the fleet and the support available before
  you choose a dedicated service page or start a reservation.
</p>
<p>
  Our team supports short-term and longer-term rentals with clear booking steps,
  helpful vehicle guidance and a modern fleet maintained for everyday use. You can
  book online or call <strong>+44 20 3011 1198</strong> if you want help choosing the right size.
</p>
<p>
  If you are ready to compare vehicles for a local booking, explore our
  <a href="/van-hire-london">van hire in London</a> page for the dedicated service
  details.
</p>

<h3>Company Trust Signals</h3>
<ul>
  <li><strong>Established local team</strong> - the site describes more than 15 years of rental experience.</li>
  <li><strong>Modern fleet</strong> - 50+ vehicles are referenced across the project.</li>
  <li><strong>Self-drive convenience</strong> - choose the vehicle, route and hire period that suit your job.</li>
  <li><strong>Clear reservations</strong> - review dates, vehicle details and costs before confirming.</li>
  <li><strong>Helpful support</strong> - call the team if you need advice before booking.</li>
</ul>

<h3>Fleet Overview</h3>
<p>
  The fleet includes small vans for lighter loads, medium vans for flexible everyday
  jobs, large vans for bigger items and Luton vans for house moves or bulky
  transport. Minibus options are also available for group journeys.
</p>
<p>
  Each vehicle type has different seating, loading and licence considerations, so the
  booking journey is designed to help customers choose an option that fits the job.
</p>

<h3>Service Overview</h3>
<p>
  Success Van Hire supports personal moves, student relocations, furniture
  collection, business deliveries, events and longer rental needs. Customers can
  reserve online or contact the team for guidance.
</p>
<p>
  Dedicated pages cover specific services in more detail, including the main London
  van rental service, minibuses, Luton vans, removal vans, automatic vans and fridge
  vans.
</p>

<h3>Locations Served</h3>
<p>
  The project references service across London and nearby North West London areas,
  including:
</p>
<ul>
  <li>Golders Green, Cricklewood &amp; Brent Cross</li>
  <li>Finchley, Mill Hill &amp; Colindale</li>
  <li>Edgware, Neasden &amp; Ealing</li>
  <li>Hampstead, Watford &amp; Wembley</li>
</ul>
<p>
  Coverage information helps customers orient themselves, while the dedicated
  service pages provide the commercial booking details for each rental need.
</p>

<h3>Choose the Next Step</h3>
<p>
  Start with the fleet section if you know the size you need, use the reservation form
  if you are ready to book, or visit the dedicated London page if you want to compare
  local self-drive van options in more detail.
</p>`;

export default function HomeContainer() {
  const [showReservationModal, setShowReservationModal] = useState(false);
  useEffect(() => {
    if (!showReservationModal) return;

    const scrollY = window.scrollY;
    const originalBodyStyle = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      left: document.body.style.left,
      right: document.body.style.right,
    };

    const originalHtmlStyle = {
      overflow: document.documentElement.style.overflow,
    };

    document.documentElement.style.overflow = "hidden";

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    return () => {
      document.documentElement.style.overflow = originalHtmlStyle.overflow;

      document.body.style.overflow = originalBodyStyle.overflow;
      document.body.style.position = originalBodyStyle.position;
      document.body.style.top = originalBodyStyle.top;
      document.body.style.width = originalBodyStyle.width;
      document.body.style.left = originalBodyStyle.left;
      document.body.style.right = originalBodyStyle.right;

      window.scrollTo(0, scrollY);
    };
  }, [showReservationModal]);
  return (
    <>
      {/* Above-the-fold: statically imported for fastest FCP / LCP */}
      <ReservationHero onBookNow={() => setShowReservationModal(true)} />
      <section id="available-vans">
        <VanListingHome />
      </section>

      {/* Below-the-fold: dynamically imported, code-split */}
      <HeroSlider />
      <WhyUs />
      <Testimonials layout="carousel" autoPlay={true} autoPlayInterval={2000} />
      <AboutUs />
      <FAQComponent
        title="Frequently Asked Questions"
        subtitle="Find answers to common questions about our van hire services"
        faqs={FAQ_DATA}
        showSearch={false}
        defaultOpen={0}
        accentColor="#fe9a00"
        backgroundColor="#0f172b"
      />
      <SEODescription content={SEO_CONTENT} collapsedLines={4} />

      {/* Modal: loaded only on user interaction */}
      {showReservationModal && (
        <Suspense fallback={null}>
          <ReservationModal onClose={() => setShowReservationModal(false)} />
        </Suspense>
      )}
    </>
  );
}
