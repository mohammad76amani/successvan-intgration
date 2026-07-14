"use client";

import { useState, Suspense, useEffect } from "react";
import dynamic from "next/dynamic";
import ReservationHero from "@/components/static/ReservationHero";
import VanListingHome from "@/components/global/vanListingBackup";

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

const FAQ_DATA = [
  {
    question: "What types of vans are available for van hire in London?",
    answer:
      "Success Van Hire offers a wide range of vans for van hire in London, including Small Vans for light deliveries, Medium Vans for flexible everyday use, Large Vans for house moves and business transport, and Luton Vans for bigger moves with maximum loading capacity and tail lift options.",
    category: "Vehicles",
  },
  {
    question: "How long has Success Van Hire provided van rental in London?",
    answer:
      "Success Van Hire has been a trusted London van rental specialist for over 15 years, supporting customers with short-term and long-term self-drive van hire for personal, moving and business needs.",
    category: "About Us",
  },
  {
    question: "What driving licences do I need to rent a van in London?",
    answer:
      "To rent a van in London with us, you need a full valid UK or EU driving licence. We make the licence verification process quick and simple so you can get on the road faster.",
    category: "Requirements",
  },
  {
    question: "Are your vans suitable for eco-friendly van hire in London?",
    answer:
      "Yes, our modern van hire fleet meets EU6 emission standards. We aim to provide reliable and more environmentally responsible van rental in London with clean, well-maintained vehicles.",
    category: "Vehicles",
  },
  {
    question: "Is insurance included with your self-drive van hire?",
    answer:
      "Yes, our self-drive van hire includes comprehensive insurance coverage for peace of mind. Your rental reservation is secure, and our team will explain the insurance options clearly before you drive away.",
    category: "Booking",
  },
  {
    question: "How does your van hire pricing work?",
    answer:
      "We provide clear and competitive van hire London pricing with options for different budgets. Our rates are transparent, with no hidden charges, so you know what you are paying for before confirming your booking.",
    category: "Pricing",
  },
  {
    question: "How many vehicles are in your van rental fleet?",
    answer:
      "We have a modern fleet of 50+ vehicles available for van rental in London, including different van sizes and minibuses, all maintained to high safety and reliability standards.",
    category: "About Us",
  },
  {
    question: "Can I book van hire in London online?",
    answer:
      "Yes, you can book your van hire in London online anytime. We offer flexible availability, simple booking and support to help you choose the right vehicle for your move, delivery or business trip.",
    category: "Booking",
  },
  {
    question:
      "Do you provide van hire for moving, deliveries and business use?",
    answer:
      "Yes, Success Van Hire provides flexible van rental in London for house moves, student moves, furniture collection, courier work, business deliveries, events and everyday transport needs.",
    category: "Services",
  },
  {
    question: "How can I contact Success Van Hire to rent a van in London?",
    answer:
      "You can reserve your van online or call Success Van Hire on +44 20 3011 1198. Our team is ready to help you rent a van in London, choose the right vehicle and complete your booking.",
    category: "Contact",
  },
] as const;

const SEO_CONTENT = `<h2>Van Hire London – Self-Drive Van &amp; Minibus Hire in North West London</h2>
<p>
  Looking for reliable <strong>van hire in London</strong>? Success Van Hire makes it simple to
  rent a van in London for moving home, business deliveries, student moves,
  furniture collection, airport transport and group travel. Based in North West London,
  we provide clean, well-maintained vans and minibuses with flexible self-drive hire
  options designed around your schedule.
</p>
<p>
  Whether you need <strong>van rental in London</strong> for one day, a weekend, a longer business
  contract or a regular transport solution, our local team helps you choose the right
  vehicle quickly and confidently. Book online in minutes or call us on
  <strong>+44 20 3011 1198</strong> for friendly support.
</p>
<p>
  We proudly serve customers across Golders Green, Cricklewood, Brent Cross,
  Finchley, Mill Hill, Colindale, Edgware, Neasden, Ealing, Hampstead, Watford,
  Wembley and the wider London area.
</p>

<h3>Why Choose Success Van Hire for Van Hire in London?</h3>
<ul>
  <li><strong>Self-drive freedom</strong> – hire the vehicle, choose your route and drive on your own schedule.</li>
  <li><strong>Flexible van rental options</strong> – daily, weekend, short-term and longer-term van hire available.</li>
  <li><strong>Clean, well-maintained fleet</strong> – modern vans and minibuses, regularly serviced and safety checked.</li>
  <li><strong>Transparent pricing</strong> – clear van hire rates with no hidden surprises when you collect the keys.</li>
  <li><strong>Easy online booking</strong> – check availability, choose your vehicle and reserve in just a few clicks.</li>
  <li><strong>Local London support</strong> – real help from a friendly team that knows North West London's roads and traffic.</li>
</ul>

<h3>Self-Drive Van Hire London for Moving, Deliveries &amp; Business Use</h3>
<p>
  Our <strong>self-drive van hire in London</strong> is ideal for house moves, flat moves,
  student relocations, furniture collection, DIY projects, event equipment,
  courier work and everyday business deliveries. From compact vans for busy
  London streets to larger panel vans with generous load space, we help you choose
  the right size so you only pay for the capacity you actually need.
</p>
<p>
  If you want to <strong>rent a van in London</strong> without the stress of complicated booking,
  Success Van Hire gives you a practical, local and flexible solution. Every van is
  inspected before collection, with fuel-efficient engines, comfortable seats and
  practical loading areas to make your journey easier from start to finish.
</p>

<h3>Van Rental in London with a Vehicle for Every Job</h3>
<p>
  Different jobs need different vehicles. That is why our London van rental fleet
  includes small vans for light loads, medium vans for everyday transport, large vans
  for heavier items and Luton vans for bigger house moves. Whether you are moving
  boxes, collecting stock, transporting tools or managing business deliveries, our
  team can guide you toward the most suitable van.
</p>
<p>
  Success Van Hire is built for customers who need dependable <strong>van hire London</strong>
  service with simple booking, honest pricing and vehicles ready for real-world use.
</p>

<h3>Comfortable Minibus Hire London for Groups</h3>
<p>
  Need to travel together? Alongside our van hire services, we also offer
  <strong>self-drive minibus hire in London</strong> for family trips, airport runs, school travel,
  sports teams, corporate events, weddings and group days out.
</p>
<p>
  Choose from 8-seater, 14-seater and 17-seater minibuses, giving you the flexibility
  to match your passenger numbers and luggage needs. Comfortable seating, modern
  safety features and spacious interiors help everyone arrive relaxed and on time.
</p>

<h3>Simple, Clear &amp; Honest Van Hire Pricing</h3>
<p>
  At Success Van Hire, we believe <strong>van hire in London</strong> should be easy to understand.
  Our prices are clearly displayed during the booking process, with straightforward
  mileage and insurance options so you can see exactly what you are paying for before
  confirming your reservation.
</p>
<p>
  No confusing extras, no last-minute surprises – just reliable vans and minibuses
  at competitive North West London rates.
</p>

<h3>Van Hire UK – Local London Service with Flexible Rental Options</h3>
<p>
  If you are searching for <strong>van hire UK</strong> services with a reliable local London team,
  Success Van Hire gives you the convenience of a trusted North West London provider
  with flexible self-drive options for both personal and business use.
</p>
<p>
  We support customers who need short-term van hire, weekend van rental, business van
  rental and minibus hire, all with a simple booking process and helpful customer care.
</p>

<h3>Van &amp; Minibus Hire Across North West London</h3>
<p>
  We serve customers across a wide area of North West London and nearby locations,
  including:
</p>
<ul>
  <li>Golders Green, Cricklewood &amp; Brent Cross</li>
  <li>Finchley, Mill Hill &amp; Colindale</li>
  <li>Edgware, Neasden &amp; Ealing</li>
  <li>Hampstead, Watford &amp; Wembley</li>
</ul>
<p>
  If you live, work or are travelling through any of these areas, Success Van Hire is
  your convenient local choice for <strong>self-drive van hire London</strong>,
  <strong>van rental in London</strong> and flexible minibus hire.
</p>

<h3>Book Your Van Hire London Today</h3>
<p>
  Ready to get moving? Book your self-drive van or minibus online with Success Van Hire
  today. Choose your date, select your vehicle and we will have it prepared and ready
  for collection.
</p>
<p>
  Whether you need one-day van hire for a quick job, a Luton van for a house move,
  a long-term van rental for business use or a minibus for group travel, our team is
  here to help you get on the road quickly and confidently across London.
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
        faqs={FAQ_DATA as unknown as any[]}
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
