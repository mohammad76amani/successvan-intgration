"use client";

import { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiPhone, FiMessageCircle } from "react-icons/fi";

const faqs = [
  {
    question: "What is Tagore Jayanti Celebration?",
    answer:
      "Tagore Jayanti, also known as Rabindra Jayanti, is a cultural celebration honouring Rabindranath Tagore, the famous poet, writer, composer and cultural figure. It is often marked with music, poetry, dance, theatre and community programmes.",
    emoji: "🌸",
    tag: "About the Event",
  },
  {
    question: "Do you offer minibus hire for Tagore Jayanti events in London?",
    answer:
      "Yes. Success Van offers minibus hire for groups travelling to Tagore Jayanti Celebration events across London. We cover all boroughs and surrounding areas, ensuring your group arrives together, comfortably and on time.",
    emoji: "🚐",
    tag: "Our Service",
  },
  {
    question: "Can I get a discount for Tagore Jayanti minibus hire?",
    answer:
      "Yes. Success Van is offering 10% off minibus hire for Tagore Jayanti Celebration travel. Call +44 20 3011 1198 and use discount code 'TJC2026' to claim your offer. This is a limited celebration offer so book early.",
    emoji: "🎉",
    tag: "Discount Offer",
    highlight: true,
  },
  {
    question: "Is minibus hire suitable for families attending Tagore Jayanti?",
    answer:
      "Yes. Minibus hire is a practical choice for families travelling with children, elderly relatives, traditional clothing, food, flowers, instruments or other event items. Everyone travels together in one comfortable vehicle.",
    emoji: "👨‍👩‍👧‍👦",
    tag: "Families",
  },
  {
    question: "Can performers use minibus hire for Tagore Jayanti programmes?",
    answer:
      "Yes. Minibus hire is ideal for performers, musicians, dancers, speakers and students who need to travel with costumes, instruments, props or programme materials. Our vehicles have ample space for everything you need.",
    emoji: "🎭",
    tag: "Performers",
  },
  {
    question: "Which areas of London do you cover?",
    answer:
      "Success Van supports group travel across London, including areas such as Wembley, Harrow, Brent, Ealing, Southall, Ilford, Croydon, Hounslow, Stratford, Finchley, Hendon and nearby locations. If you're unsure, just call us.",
    emoji: "📍",
    tag: "Coverage",
  },
  {
    question: "Should I book early for Tagore Jayanti Celebration travel?",
    answer:
      "Yes. It is best to book early, especially if your event is on a weekend or in the evening. Early booking helps you plan your pickup, return journey and group size more easily — and guarantees your 10% discount.",
    emoji: "📅",
    tag: "Booking Tips",
  },
  {
    question: "How do I book a minibus with Success Van?",
    answer:
      "Simply call Success Van on +44 20 3011 1198 and share your date, pickup point, destination, passenger number and return journey details. Our team will confirm everything quickly and clearly.",
    emoji: "📞",
    tag: "How to Book",
  },
];

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function FAQItem({
  faq,
  index,
  isOpen,
  onToggle,
  inView,
}: {
  faq: (typeof faqs)[0];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  inView: boolean;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div
      className={`transition-all duration-500 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div
        className={`relative group rounded-2xl overflow-hidden border transition-all duration-300 ${
          isOpen
            ? faq.highlight
              ? "border-[#fe9a00]/50 shadow-[0_0_30px_rgba(254,154,0,0.1)]"
              : "border-white/15 shadow-[0_0_20px_rgba(255,255,255,0.04)]"
            : "border-white/8 hover:border-white/15"
        } bg-[#0d1627]`}
      >
        {/* Highlight glow for discount FAQ */}
        {faq.highlight && (
          <div
            className={`absolute -inset-0.5 bg-linear-to-r from-[#fe9a00]/30 via-[#ffb347]/15 to-[#fe9a00]/30 rounded-2xl blur-sm transition-opacity duration-300 -z-10 ${
              isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-60"
            }`}
          />
        )}

        {/* Question Button */}
        <button
          onClick={onToggle}
          className="w-full text-left px-5 sm:px-6 lg:px-7 py-5 sm:py-6 flex items-start gap-3 sm:gap-4 focus:outline-none"
          aria-expanded={isOpen}
        >
          {/* Emoji */}
          <span
            className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-base sm:text-lg transition-all duration-300 ${
              isOpen
                ? faq.highlight
                  ? "bg-[#fe9a00]/20"
                  : "bg-white/8"
                : "bg-white/5 group-hover:bg-white/8"
            }`}
          >
            {faq.emoji}
          </span>

          {/* Text block */}
          <div className="flex-1 min-w-0 pt-0.5">
            {/* Tag */}
            <span
              className={`inline-block text-[10px] font-bold uppercase tracking-widest mb-1.5 transition-colors duration-300 ${
                isOpen
                  ? faq.highlight
                    ? "text-[#fe9a00]"
                    : "text-gray-400"
                  : "text-gray-500"
              }`}
            >
              {faq.tag}
            </span>
            {/* Question */}
            <p
              className={`text-sm sm:text-base lg:text-lg font-bold leading-snug transition-colors duration-300 pr-2 ${
                isOpen ? "text-white" : "text-gray-200 group-hover:text-white"
              }`}
            >
              {faq.question}
            </p>
          </div>

          {/* Chevron */}
          <div
            className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mt-0.5 transition-all duration-300 ${
              isOpen
                ? faq.highlight
                  ? "bg-[#fe9a00] text-white rotate-180"
                  : "bg-white/10 text-white rotate-180"
                : "bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-gray-200"
            }`}
          >
            <FiChevronDown className="text-sm sm:text-base" />
          </div>
        </button>

        {/* Answer — smooth height animation */}
        <div
          style={{
            height,
            overflow: "hidden",
            transition: "height 0.35s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <div ref={contentRef}>
            <div className="px-5 sm:px-6 lg:px-7 pb-5 sm:pb-6">
              {/* Divider */}
              <div
                className={`h-px mb-4 sm:mb-5 ${
                  faq.highlight
                    ? "bg-linear-to-r from-[#fe9a00]/30 via-[#fe9a00]/15 to-transparent"
                    : "bg-linear-to-r from-white/10 via-white/5 to-transparent"
                }`}
              />
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed pl-[52px] sm:pl-[56px]">
                {faq.answer}
              </p>

              {/* Inline CTA for discount FAQ */}
              {faq.highlight && (
                <div className="mt-4 sm:mt-5 ml-[52px] sm:ml-[56px] flex flex-col xs:flex-row gap-2 sm:gap-3">
                  <a
                    href="tel:+442030111198"
                    className="inline-flex items-center gap-2 bg-[#fe9a00] hover:bg-[#e58900] text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
                  >
                    <FiPhone className="text-sm" />
                    Call to Claim 10% Off
                  </a>
                  <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl">
                    <span className="text-gray-400 text-[10px] sm:text-xs">
                      Code:
                    </span>
                    <code className="text-[#fe9a00] font-black text-[10px] sm:text-xs tracking-wider">
                      TJC2026
                    </code>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TagoreFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { ref: headerRef, inView: headerIn } = useInView(0.1);
  const { ref: listRef, inView: listIn } = useInView(0.05);
  const { ref: ctaRef, inView: ctaIn } = useInView(0.1);

  return (
    <section className="relative bg-linear-to-b from-[#0a0f1e] via-[#0d1627] to-[#0a0f1e] py-20 sm:py-24 lg:py-32 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -right-24 w-87.5 h-87.5 bg-[#fe9a00]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -left-24 w-75 h-75 bg-blue-600/4 rounded-full blur-[110px]" />
        <div
          className="absolute inset-0 opacity-2"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div
          ref={headerRef}
          className={`text-center mb-12 sm:mb-14 lg:mb-16 transition-all duration-700 ${
            headerIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 bg-[#fe9a00]/10 border border-[#fe9a00]/25 text-[#fe9a00] text-xs sm:text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-5 sm:mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fe9a00] animate-pulse" />
            Common Questions
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-[1.1] tracking-tight mb-4 sm:mb-5">
            Frequently Asked{" "}
            <span className="bg-linear-to-r from-[#fe9a00] via-[#ffb84d] to-[#fe9a00] bg-clip-text text-transparent">
              Questions
            </span>
          </h2>

          <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Everything you need to know about booking a minibus for your Tagore
            Jayanti Celebration in London. Can't find your answer?{" "}
            <a
              href="tel:+442030111198"
              className="text-[#fe9a00] hover:text-[#ffb347] font-semibold transition-colors duration-200"
            >
              Just call us.
            </a>
          </p>

          {/* Quick stats */}
          <div
            className={`flex flex-wrap justify-center gap-3 sm:gap-4 mt-7 sm:mt-8 transition-all duration-700 delay-200 ${
              headerIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {[
              { label: "Questions Answered", value: `${faqs.length}` },
              { label: "Response Time", value: "< 1 min" },
              { label: "Available", value: "7 Days" },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-white/3 border border-white/8 rounded-xl px-4 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2.5"
              >
                <span className="text-white font-black text-sm sm:text-base">
                  {s.value}
                </span>
                <span className="text-gray-500 text-xs sm:text-sm">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ List ── */}
        <div
          ref={listRef}
          className="space-y-3 sm:space-y-3.5 mb-12 sm:mb-14 lg:mb-16"
        >
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              faq={faq}
              index={i}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              inView={listIn}
            />
          ))}
        </div>

        {/* ── Bottom CTA ── */}
        <div
          ref={ctaRef}
          className={`transition-all duration-700 delay-300 ${
            ctaIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="relative">
            <div className="absolute -inset-0.5 bg-linear-to-r from-[#fe9a00]/40 via-[#ffb347]/20 to-[#fe9a00]/40 rounded-2xl sm:rounded-3xl blur-sm" />
            <div className="relative bg-[#0d1627] border border-[#fe9a00]/20 rounded-2xl sm:rounded-3xl px-6 sm:px-10 py-8 sm:py-10 text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#fe9a00]/10 border border-[#fe9a00]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-5">
                <FiMessageCircle className="text-[#fe9a00] text-xl sm:text-2xl" />
              </div>

              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-2 sm:mb-3">
                Still have questions?
              </h3>
              <p className="text-gray-400 text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto">
                Our team is ready to help you plan the perfect group journey for
                your Tagore Jayanti Celebration. We'll answer everything in
                under a minute.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="tel:+442030111198"
                  className="inline-flex items-center justify-center gap-2.5 bg-linear-to-r from-[#fe9a00] to-[#e58900] hover:from-[#ff8c00] hover:to-[#d47e00] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_32px_rgba(254,154,0,0.4)] active:scale-[0.98]"
                >
                  <FiPhone className="text-lg" />
                  Call +44 20 3011 1198
                </a>
                <a
                  href="#booking"
                  className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
                >
                  Book Online Instead
                </a>
              </div>

              <p className="text-gray-600 text-xs mt-4 sm:mt-5">
                📍 Strata House, Waterloo Road, London, NW2 7UH · Available 7
                days a week
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
