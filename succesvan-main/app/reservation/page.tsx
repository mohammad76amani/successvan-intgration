import { Metadata } from "next";
import { ReservationContent } from "@/components/static/reservationContainer";
import Script from "next/script";
import { ReservationPageSchema } from "@/lib/schema";
import SEODescription from "@/components/global/seoDesc";
import FAQSection from "@/components/static/fAQSection";

export const metadata: Metadata = {
  metadataBase: new URL("https://successvanhire.co.uk"),
  title: "Book Van Hire London Online | Reserve Your Van Today",
  description:
    "Book van hire in London online with Success Van Hire. Reserve a small van, Luton van, self-drive van or minibus with fast confirmation, clear prices and flexible hire options.",
  keywords: [
    "book van hire london",
    "van reservation london",
    "book van online",
    "reserve van hire london",
    "van rental booking london",
    "online van booking london",
    "book self drive van hire",
    "reserve luton van london",
    "minibus booking london",
  ],
  alternates: {
    canonical: "https://successvanhire.co.uk/reservation",
  },
  openGraph: {
    title: "Book Van Hire London Online | Success Van Hire",
    description:
      "Reserve your van online in minutes. Small vans, Luton vans, self-drive rental and minibus hire available across London.",
    url: "https://successvanhire.co.uk/reservation",
    type: "website",
  },
 
};

 const faqs = [
  {
    question: "How do I book van hire in London online?",
    answer:
      "You can book van hire in London online by choosing your vehicle, selecting your rental dates and submitting your reservation details. Success Van Hire will confirm availability and help you complete your booking quickly.",
  },
  {
    question: "Can I reserve a van for the same day?",
    answer:
      "Same-day van reservation may be available depending on vehicle availability, location and booking time. We recommend booking as early as possible to get the best choice of vans.",
  },
  {
    question: "What vans can I reserve online?",
    answer:
      "You can reserve small vans, medium vans, large vans, Luton vans and minibuses depending on availability. Our team can help you choose the right vehicle for moving, deliveries, business use or group travel.",
  },
  {
    question: "Do I need to pay when I reserve a van?",
    answer:
      "Payment and deposit requirements may depend on the vehicle type, hire duration and booking details. During the reservation process, we explain the costs clearly before confirmation.",
  },
  {
    question: "Can I book self-drive van hire online?",
    answer:
      "Yes. Success Van Hire offers self-drive van hire in London. You can reserve your van online, collect it, drive it yourself and return it based on your selected hire period.",
  },
  {
    question: "Can I reserve a Luton van for moving house?",
    answer:
      "Yes. Luton van hire is suitable for larger house moves, bulky furniture and business relocation jobs. You can request a Luton van during the reservation process.",
  },
  {
    question: "Can I book a minibus online?",
    answer:
      "Yes. Minibus hire can be requested for group travel, airport transfers, events, weddings and day trips. Availability depends on your selected date and passenger requirements.",
  },
  {
    question: "Can I change my reservation after booking?",
    answer:
      "Reservation changes may be possible depending on availability and notice period. Contact Success Van Hire as soon as possible if you need to change your date, vehicle type or hire duration.",
  },
];

export default function ReservationPage() {
  return (
    <div>
      {/* ✅ Schema.org JSON-LD */}
      <Script
        id="reservation-page-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(ReservationPageSchema),
        }}
      />
      <ReservationContent />
        <FAQSection
            title="Frequently Asked Questions About Van Reservation in London"
            subtitle="Find answers to common questions about our van hire services"
            faqs={faqs}
            showSearch={false}
            defaultOpen={0}
            accentColor="#fe9a00"
            backgroundColor="#0a0e1a"
          />
      <SEODescription
        content="<h2><strong>Reserve a Van or Minibus in London – Fast & Easy Booking</strong></h2>
<p>
  Looking to reserve a van in London quickly and without hassle? Success Van Hire makes van rental simple, secure and flexible. Whether you need a vehicle for moving house, business deliveries or group travel, our easy online reservation system lets you book your van or minibus in minutes.
</p>
<p>
  This page is designed for customers who want to book van hire London online without calling multiple rental companies. You can submit your van reservation request, choose your hire dates and tell us whether you need a small van, large van, Luton van, automatic van or minibus.
</p>
<p>
  Serving customers across North West London and surrounding areas, we offer reliable vehicles, competitive prices and instant booking confirmation so you can plan your journey with confidence.
</p>

<h3>Book Your Van Hire in London in Minutes</h3>
<p>
  Our online reservation system is designed for speed and convenience. Simply select your dates, choose your vehicle and confirm your booking. Whether you need a small van for city use or a larger vehicle for heavy loads, we have options to suit every requirement.
</p>
<ul>
  <li><strong>Quick online van reservation</strong> – secure your vehicle in just a few clicks</li>
  <li><strong>Flexible hire options</strong> – daily, weekend and long-term rentals available</li>
  <li><strong>Wide range of vans</strong> – from compact vans to large panel vans</li>
  <li><strong>Minibus hire available</strong> – perfect for group travel and events</li>
</ul>

<h3>Affordable Van Rental in London</h3>
<p>
  We offer some of the best van hire prices in London with transparent rates and no hidden fees. During the booking process, you will see all costs clearly so you can reserve your van with confidence.
</p>
<p>
  Whether you are searching for cheap van hire in London, short-term van rental or reliable business vehicle hire, Success Van Hire delivers excellent value without compromising on quality.
</p>
<h3>Same-Day and Advance Van Booking</h3>
<p>
  If you need urgent transport, same-day van booking may be available depending on fleet availability. For weekends, house moves and busy periods, we recommend reserving your van in advance to secure the best vehicle size and price.
</p>

<h3>Self-Drive Van Hire for Every Need</h3>
<p>
  Our self-drive van hire service gives you complete control. Ideal for house moves, furniture transport, courier work, construction jobs and everyday logistics, our vans are clean, well-maintained and ready for the road.
</p>
<p>
  Reserve your van in advance to ensure availability during busy periods and avoid last-minute stress.
</p>

<h3>Minibus Reservation for Group Travel</h3>
<p>
  Planning a trip with friends, family or colleagues? Our minibus hire options make group travel easy and cost-effective. Choose from 8-seater to 17-seater minibuses, perfect for airport transfers, events, weddings and day trips.
</p>

<h3>Why Reserve with Success Van Hire?</h3>
<ul>
  <li>Easy online booking system</li>
  <li>Reliable and modern vehicles</li>
  <li>Competitive London van hire rates</li>
  <li>Flexible pick-up and return options</li>
  <li>Friendly and professional local service</li>
</ul>
<h3>Choose the Right Vehicle Before You Reserve</h3>
<p>
  If you are unsure what to book, compare our van hire London, cheap van hire London, van hire near me, Luton van hire London, removal van hire London, self-drive van hire, automatic van rental and minibus hire London pages before completing your reservation.
</p>

<h3>Reserve Your Van in London Today</h3>
<p>
  Don’t wait until the last minute. Reserve your van or minibus today with Success Van Hire and enjoy a smooth, stress-free rental experience. Choose your vehicle, book online and get ready to hit the road anywhere in London.
</p>

"
        collapsedLines={4}
      />
    </div>
  );
}
