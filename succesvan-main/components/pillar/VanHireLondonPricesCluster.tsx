"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  FiCheck,
  FiPhone,
  FiArrowRight,
  FiDollarSign,
  FiClock,
  FiTrendingDown,
  FiCalendar,
  FiInfo,
} from "react-icons/fi";
import FAQComponent, { FAQItem } from "@/components/static/fAQSection";

export function VanHireLondonPricesHero() {
  return (
    <section className="relative min-h-[70vh] flex items-center pt-28 md:pt-20 pb-16 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-[#0a0e1a] via-[#0f1729] to-[#0a0e1a]" />
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-200 h-200 bg-linear-to-bl from-orange-500/8 via-amber-500/4 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-150 h-150 bg-linear-to-tr from-blue-500/5 via-cyan-500/3 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full mb-6">
            <FiDollarSign className="text-[#fe9a00]" size={18} />
            <span className="text-sm text-slate-300 font-medium">
              Updated Pricing Guide 2025
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-[1.05] tracking-tight">
            Van Hire London{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-linear-to-r from-[#fe9a00] via-amber-400 to-[#fe9a00] bg-clip-text text-transparent">
                Prices
              </span>
              <span className="absolute -bottom-2 left-0 w-full h-3 bg-linear-to-r from-orange-500/20 to-amber-500/20 rounded-full blur-sm" />
            </span>
          </h1>

          <p className="text-lg text-slate-300/90 mb-10 leading-relaxed">
            Complete guide to van hire London prices for daily, weekly, and
            monthly rentals. Compare transparent pricing across all van sizes
            with no hidden fees. Get the best{" "}
            <Link
              href="/cheap-van-hire-london"
              className="text-[#fe9a00] hover:text-amber-400 underline"
            >
              cheap van hire London
            </Link>{" "}
            rates from £78/day.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/reservation"
              className="group px-8 py-4 bg-linear-to-r from-[#fe9a00] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20"
            >
              Get Instant Quote
              <FiArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <a
              href="tel:+442030111198"
              className="group px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all duration-300 border border-white/10 hover:border-white/20 flex items-center justify-center gap-3"
            >
              <FiPhone size={18} className="text-[#fe9a00]" />
              +44 20 3011 1198
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PricingOverviewSection() {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0a0e1a] via-[#0d1321] to-[#0a0e1a]" />
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Understanding Van Hire London Prices
          </h2>
          <p className="text-slate-300 leading-relaxed">
            Van hire London prices vary based on van size, rental duration, and
            season. At Success Van Hire, we offer transparent van hire London
            prices with no hidden fees. Whether you need{" "}
            <Link
              href="/van-hire-london"
              className="text-[#fe9a00] hover:text-amber-400 underline"
            >
              van hire london
            </Link>{" "}
            for a day, week, or month, our pricing structure is designed to give
            you the best value. Daily van hire London prices start from just
            £25, with significant discounts for weekly and monthly van hire
            London prices. All our van rental London prices include
            comprehensive insurance, unlimited mileage, and 24/7 roadside
            assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: FiClock,
              title: "Daily Rates",
              description:
                "Perfect for quick moves and short-term needs. Van hire London prices from £78/day.",
              color: "blue",
            },
            {
              icon: FiCalendar,
              title: "Weekly Rates",
              description:
                "Save up to 30% with weekly van hire London prices. Ideal for extended projects.",
              color: "green",
            },
            {
              icon: FiTrendingDown,
              title: "Monthly Rates",
              description:
                "Best value for long-term rentals. Monthly van hire London prices with maximum savings.",
              color: "purple",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="p-6 bg-white/5 border border-white/10 rounded-xl hover:border-[#fe9a00]/30 transition-all"
            >
              <div
                className={`w-12 h-12 rounded-lg bg-${item.color}-500/10 flex items-center justify-center mb-4`}
              >
                <item.icon className={`text-${item.color}-400`} size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {item.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DetailedPricingTableSection() {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");

  const pricingData = {
    daily: [
      {
        name: "Small Van (SWB)",
        price: "£78",
        savings: "",
        features: [
          "Perfect for small moves",
          "Easy to drive & park",
          "Fuel efficient",
        ],
      },
      {
        name: "Medium Van (MWB)",
        price: "£96",
        savings: "",
        features: [
          "Ideal for 1-2 bedroom flats",
          "Good cargo capacity",
          "Comfortable drive",
        ],
      },
      {
        name: "Large Van (LWB)",
        price: "£102",
        savings: "",
        features: [
          "Spacious for house moves",
          "Maximum cargo space",
          "Professional choice",
        ],
      },
      {
        name: "Luton Van",
        price: "£132",
        savings: "",
        features: [
          "Largest capacity",
          "Tail lift available",
          "Best for full house moves",
        ],
      },
    ],
    weekly: [
      {
        name: "Small Van (SWB)",
        price: "£60",
        savings: "Save £126/week",
        features: [
          "£420 per week total",
          "23% cheaper than daily",
          "Unlimited mileage",
        ],
      },
      {
        name: "Medium Van (MWB)",
        price: "£78",
        savings: "Save £126/week",
        features: [
          "£546 per week total",
          "19% cheaper than daily",
          "Unlimited mileage",
        ],
      },
      {
        name: "Large Van (LWB)",
        price: "£72",
        savings: "Save £210/week",
        features: [
          "£504 per week total",
          "29% cheaper than daily",
          "Unlimited mileage",
        ],
      },
      {
        name: "Luton Van",
        price: "£100",
        savings: "Save £224/week",
        features: [
          "£700 per week total",
          "24% cheaper than daily",
          "Unlimited mileage",
        ],
      },
    ],
    monthly: [
      {
        name: "Small Van (SWB)",
        price: "£55",
        savings: "Save £690/month",
        features: [
          "£1,650 per month",
          "29% cheaper than daily",
          "Best long-term value",
        ],
      },
      {
        name: "Medium Van (MWB)",
        price: "£70",
        savings: "Save £780/month",
        features: [
          "£2,100 per month",
          "27% cheaper than daily",
          "Best long-term value",
        ],
      },
      {
        name: "Large Van (LWB)",
        price: "£65",
        savings: "Save £1,110/month",
        features: [
          "£1,950 per month",
          "36% cheaper than daily",
          "Best long-term value",
        ],
      },
      {
        name: "Luton Van",
        price: "£90",
        savings: "Save £1,260/month",
        features: [
          "£2,700 per month",
          "32% cheaper than daily",
          "Best long-term value",
        ],
      },
    ],
  };

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0d1321] via-[#0a0e1a] to-[#0d1321]" />
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Van Hire London Prices by Size
          </h2>
          <p className="text-slate-300 leading-relaxed mb-8">
            Compare van hire London prices across all van sizes. Our transparent
            pricing includes insurance, unlimited mileage, and breakdown cover.
            Choose daily, weekly, or monthly van rental London prices to see
            your savings.
          </p>

          <div className="inline-flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
            {(["daily", "weekly", "monthly"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  selectedPeriod === period
                    ? "bg-[#fe9a00] text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pricingData[selectedPeriod].map((van, i) => (
            <div
              key={i}
              className="p-6 bg-white/5 border border-white/10 rounded-xl hover:border-[#fe9a00]/30 transition-all"
            >
              <h3 className="text-xl font-bold text-white mb-2">{van.name}</h3>
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-[#fe9a00]">
                    {van.price}
                  </span>
                  <span className="text-slate-400 text-sm">/day</span>
                </div>
                {van.savings && (
                  <p className="text-green-400 text-sm font-semibold mt-1">
                    {van.savings}
                  </p>
                )}
              </div>
              <ul className="space-y-2 mb-6">
                {van.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <FiCheck className="text-green-400 mt-0.5 shrink-0" />
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/reservation"
                className="block w-full py-3 bg-[#fe9a00]/10 hover:bg-[#fe9a00]/20 text-[#fe9a00] font-semibold rounded-lg transition-all text-center border border-[#fe9a00]/20"
              >
                Book Now
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <FiInfo className="text-blue-400 mt-1 shrink-0" size={20} />
            <div>
              <h4 className="text-white font-semibold mb-2">
                All Van Hire London Prices Include:
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                Comprehensive insurance, unlimited mileage, 24/7 breakdown
                assistance, free additional driver, and no hidden fees. Our van
                rental London prices are transparent and competitive. Need{" "}
                <Link
                  href="/cheap-van-hire-london"
                  className="text-[#fe9a00] hover:text-amber-400 underline"
                >
                  cheap van hire London
                </Link>
                ? We price match any genuine quote.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PriceComparisonSection() {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0a0e1a] via-[#0d1321] to-[#0a0e1a]" />
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Why Our Van Hire London Prices Are Better
          </h2>
          <p className="text-slate-300 leading-relaxed">
            Compare our van hire London prices with competitors and see the
            difference. We offer the most competitive van rental London prices
            without compromising on quality or service. Our transparent pricing
            model means what you see is what you pay — no surprise charges at
            pickup.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="p-8 bg-white/5 border border-white/10 rounded-xl">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Success Van Hire
              </h3>
              <p className="text-green-400 font-semibold">Best Value</p>
            </div>
            <ul className="space-y-3">
              {[
                "Transparent van hire London prices",
                "No hidden fees or charges",
                "Unlimited mileage included",
                "Full insurance coverage",
                "Free additional driver",
                "24/7 breakdown assistance",
                "Price match guarantee",
                "Flexible cancellation",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <FiCheck className="text-green-400 mt-1 shrink-0" />
                  <span className="text-slate-300 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-8 bg-white/5 border border-white/10 rounded-xl opacity-60">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Typical Competitors
              </h3>
              <p className="text-red-400 font-semibold">Hidden Costs</p>
            </div>
            <ul className="space-y-3">
              {[
                "Low advertised prices",
                "Hidden insurance fees (£15-30/day)",
                "Mileage limits & excess charges",
                "Basic insurance only",
                "Extra driver fees (£10-15/day)",
                "Limited breakdown cover",
                "No price matching",
                "Strict cancellation fees",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-red-400 mt-1 shrink-0">✗</span>
                  <span className="text-slate-400 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-300 mb-6">
            Our van hire London prices are up to 40% cheaper than competitors
            when you factor in all the extras. Get honest, transparent{" "}
            <Link
              href="/van-hire-london"
              className="text-[#fe9a00] hover:text-amber-400 underline"
            >
              van hire london
            </Link>{" "}
            pricing with no surprises.
          </p>
          <Link
            href="/reservation"
            className="inline-flex items-center gap-3 px-8 py-4 bg-linear-to-r from-[#fe9a00] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20"
          >
            Compare Prices Now
            <FiArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function PricingFactorsSection() {
  const factors = [
    {
      title: "Van Size",
      description:
        "Van hire London prices increase with van size. Small vans start from £78/day, while Luton vans cost more due to their larger capacity. Choose the right size to optimize your van rental London prices.",
    },
    {
      title: "Rental Duration",
      description:
        "Longer rentals offer better value. Weekly van hire London prices save up to 30%, while monthly rates can save 40% compared to daily van hire London prices. Book longer to save more.",
    },
    {
      title: "Season & Demand",
      description:
        "Van hire London prices can vary by season. Summer months and weekends see higher demand. Book in advance for the best van rental London prices, especially during peak moving season.",
    },
    {
      title: "Pickup Location",
      description:
        "Central London locations may have slightly higher van hire London prices due to operating costs. Our competitive pricing ensures you get fair rates regardless of pickup location.",
    },
    {
      title: "Insurance Level",
      description:
        "All our van hire London prices include comprehensive insurance. Unlike competitors who charge extra for full coverage, our transparent pricing includes everything you need.",
    },
    {
      title: "Additional Services",
      description:
        "Optional extras like sat nav, moving blankets, or trolleys are available at low cost. Our base van rental London prices already include unlimited mileage and breakdown cover.",
    },
  ];

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0d1321] via-[#0a0e1a] to-[#0d1321]" />
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            What Affects Van Hire London Prices?
          </h2>
          <p className="text-slate-300 leading-relaxed">
            Understanding the factors that influence van hire London prices
            helps you make informed decisions and get the best value for your
            money. Here's what determines van rental London prices at Success
            Van Hire.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {factors.map((factor, i) => (
            <div
              key={i}
              className="p-6 bg-white/5 border border-white/10 rounded-xl hover:border-[#fe9a00]/30 transition-all"
            >
              <h3 className="text-xl font-bold text-white mb-3">
                {factor.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {factor.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingFAQSection() {
  const faqs: FAQItem[] = [
    {
      question: "What are the cheapest van hire London prices?",
      answer:
        "Our cheapest van hire London prices start from £25 per day for a small van (SWB). Weekly rates from £60/day and monthly rates from £55/day offer even better value. All prices include insurance, unlimited mileage, and breakdown cover with no hidden fees.",
    },
    {
      question: "Do van hire London prices include insurance?",
      answer:
        "Yes, all our van hire London prices include comprehensive insurance coverage. Unlike many competitors who advertise low prices then add insurance fees at pickup, our transparent van rental London prices include full coverage from the start.",
    },
    {
      question: "Are there hidden fees in your van hire London prices?",
      answer:
        "No hidden fees whatsoever. Our van hire London prices are completely transparent and include insurance, unlimited mileage, breakdown assistance, and free additional driver. What you see online is exactly what you pay at pickup.",
    },
    {
      question: "How much can I save with weekly van hire London prices?",
      answer:
        "Weekly van hire London prices save 20-30% compared to daily rates. For example, a medium van costs £96/day but only £78/day on weekly rental — saving you £126 per week. Monthly rates offer even bigger savings.",
    },
    {
      question: "Do van hire London prices include unlimited mileage?",
      answer:
        "Yes, all our van hire London prices include unlimited mileage as standard. Drive as far as you need without worrying about excess mileage charges. This is included in our transparent van rental London prices.",
    },
    {
      question: "What's included in your van rental London prices?",
      answer:
        "Our van rental London prices include: comprehensive insurance, unlimited mileage, 24/7 breakdown assistance, free additional driver, full tank of fuel, and no hidden fees. Everything you need is included in the price you see.",
    },
    {
      question: "Are van hire London prices higher on weekends?",
      answer:
        "Our van hire London prices remain consistent throughout the week. We don't charge premium rates for weekend rentals. However, booking in advance is recommended as weekend availability can be limited during peak season.",
    },
    {
      question: "Do you offer price matching on van hire London prices?",
      answer:
        "Yes, we offer a price match guarantee. If you find cheaper van hire London prices elsewhere with the same inclusions (insurance, unlimited mileage, etc.), we'll match or beat that price. Just show us the quote.",
    },
  ];

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0a0e1a] via-[#0d1321] to-[#0a0e1a]" />
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Van Hire London Prices FAQ
          </h2>
          <p className="text-slate-300 leading-relaxed">
            Common questions about van hire London prices, van rental London
            prices, and our transparent pricing policy.
          </p>
        </div>
        <FAQComponent faqs={faqs} />
      </div>
    </section>
  );
}

export function PricingFinalCTA() {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0d1321] via-[#0a0e1a] to-[#0d1321]" />
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="p-8 md:p-12 bg-linear-to-br from-[#fe9a00]/10 via-amber-500/5 to-orange-500/10 border border-[#fe9a00]/20 rounded-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Get the Best Van Hire London Prices Today
          </h2>
          <p className="text-slate-300 leading-relaxed mb-8 max-w-2xl mx-auto">
            Ready to book? Our transparent van hire London prices start from
            just £78/day with no hidden fees. Whether you need{" "}
            <Link
              href="/cheap-van-hire-london"
              className="text-[#fe9a00] hover:text-amber-400 underline"
            >
              cheap van hire London
            </Link>{" "}
            for a quick move or long-term{" "}
            <Link
              href="/van-hire-london"
              className="text-[#fe9a00] hover:text-amber-400 underline"
            >
              van hire london
            </Link>{" "}
            rental, we offer the best van rental London prices with
            comprehensive insurance, unlimited mileage, and 24/7 support.
            Compare our prices and see why thousands choose Success Van Hire for
            honest, affordable van hire London prices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/reservation"
              className="group px-8 py-4 bg-linear-to-r from-[#fe9a00] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20"
            >
              Check Prices & Book Now
              <FiArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <a
              href="tel:+442030111198"
              className="group px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all duration-300 border border-white/10 hover:border-white/20 flex items-center justify-center gap-3"
            >
              <FiPhone size={18} className="text-[#fe9a00]" />
              Call for Best Price
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
