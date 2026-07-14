import Link from "next/link";
import Image from "next/image";
import {
  FiPhone,
  FiArrowRight,
  FiDollarSign,
  FiClock,
  FiShield,
  FiZap,
  FiTrendingDown,
  FiPercent,
  FiAlertCircle,
} from "react-icons/fi";
import FAQComponent, { FAQItem } from "@/components/static/fAQSection";
import { ReadMore } from "../ui/ReadMore";

export function CheapVanHireLondonHero() {
  const stats = [
    { value: 78, prefix: "£", suffix: "+", label: "Starting From" },
    { value: 100, suffix: "%", label: "Price Match" },
    { value: 0, label: "Hidden Fees" },
  ];

  return (
    <section className="relative min-h-screen flex items-center pt-28 md:pt-36  pb-16 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-[#0a0e1a] via-[#0f1729] to-[#0a0e1a]" />
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-200 h-200 bg-linear-to-bl from-orange-500/8 via-amber-500/4 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-150 h-150 bg-linear-to-tr from-blue-500/5 via-cyan-500/3 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 h-100 bg-orange-500/3 rounded-full blur-[120px]" />
      </div>

      <div
        className="absolute inset-0 opacity-2 hidden md:block"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-2 lg:order-1">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-[1.05] tracking-tight">
              Cheap Van Hire London{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-linear-to-r from-[#fe9a00] via-amber-400 to-[#fe9a00] bg-clip-text text-transparent">
                  Budget Van Rental from £78/Day
                </span>
                <span className="absolute -bottom-2 left-0 w-full h-3 bg-linear-to-r from-orange-500/20 to-amber-500/20 rounded-full blur-sm" />
              </span>
            </h1>
            <p className="text-sm md:text-base text-slate-300/90 mb-6 leading-relaxed max-w-xl">
              Need cheap{" "}
              <Link
                href="/van-hire-london"
                className="text-[#fe9a00] hover:text-amber-400  "
              >
                van hire in London
              </Link>{" "}
              without hidden fees? Success Van Hire offers budget van hire
              London from £78/day, with clear pricing for small vans, Ford
              Transit vans and Luton vans. Our cheap van rental London service
              is ideal for students, small moves, IKEA runs, furniture pickups,
              business deliveries and cost-conscious customers across Greater
              London.
            </p>

            <p className="text-sm md:text-base text-slate-300/90 mb-10 leading-relaxed max-w-xl">
              Compare affordable van rental London options, choose your hire
              duration and book online in minutes. Same-day and last-minute
              availability may be available depending on fleet demand. Call{" "}
              <Link
                href="tel:+442030111198"
                className="text-[#fe9a00] hover:text-amber-400 underline"
              >
                +44 20 3011 1198
              </Link>{" "}
              or reserve your van online today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href="/reservation"
                className="group px-8 py-4 bg-linear-to-r from-[#fe9a00] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5"
              >
                Get Cheap Van Hire Quote
                <FiArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <a
                href="tel:+442030111198"
                className="group px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all duration-300 border border-white/10 hover:border-white/20 flex items-center justify-center gap-3 backdrop-blur-sm"
              >
                <FiPhone
                  size={18}
                  className="group-hover:rotate-12 text-[#fe9a00] transition-transform"
                />
                +44 20 3011 1198
              </a>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative">
              <div className="absolute -inset-4 bg-linear-to-r from-orange-500/10 via-transparent to-amber-500/10 rounded-3xl blur-2xl" />
              <div className="relative h-54 md:h-100 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
                {" "}
                <Image
                  src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/cheap+van+hire.webp"
                  alt="Cheap van hire London with budget van rental prices"
                  fill
                  className="object-cover"
                  priority
                  fetchPriority="high"
                  quality={65}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
                  placeholder="blur"
                  blurDataURL="data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoKAAoAAUAmJQBOgB6AA/vuUAAA"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#0a0e1a]/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto">
                  <div className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-black/40 md:backdrop-blur-sm border border-white/10 rounded-xl">
                    <FiDollarSign className="text-[#fe9a00]" size={18} />
                    <span className="text-white text-[10px] md:text-sm font-semibold">
                      Best Prices Guaranteed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PricingBenefitsSection() {
  const benefits = [
    {
      icon: FiDollarSign,
      title: "Clear Budget Van Hire Prices",
      description:
        "See your van hire cost before you book, with cheap van rental London rates from £78/day and no confusing add-ons.",
      iconColor: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      icon: FiPercent,
      title: "No Hidden Fees",
      description:
        "Our affordable van rental London pricing is transparent, with essential costs explained upfront before checkout.",
      iconColor: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: FiClock,
      title: "Daily, Weekly & Monthly Hire",
      description:
        "Choose low cost van hire London for one day, a weekend, a full week or longer-term business use.",
      iconColor: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: FiShield,
      title: "Reliable Vans, Fair Prices",
      description:
        "Cheap van hire London should still be safe and dependable, so our vans are maintained, insured and ready for real jobs.",
      iconColor: "text-orange-400",
      bgColor: "bg-orange-500/10",
    },
  ];
  const ReadMoreData = {
    linkUrl: "/blog/best-cheap-van-hire-london-for-students-2026",
    title: "Best Cheap Van Hire London For Students 2026",
    description:
      "Moving to a new city for university can be both thrilling and a tad overwhelming.",
    iconType: "chevron", // or "chevron" or "custom"
    themeColors: {
      primary: "#fff", // Orange – your brand accent for headlines
      secondary: "#0f172b", // Slate – used for subtle borders
      background: "rgba(15, 23, 43, 0.2)",
      text: "#fff", // Slate text
      accent: "#fe9a00", // Orange CTA & icon
    },
  } as const;

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0a0e1a] via-[#0d1321] to-[#0a0e1a]" />
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-semibold mb-6 tracking-wide uppercase">
            Best Value
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-5">
            Budget Van Hire London with{" "}
            <span className="bg-linear-to-r from-[#fe9a00] to-amber-400 bg-clip-text text-transparent">
              Clear Prices & No Hidden Fees
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Looking for cheap van hire London that still feels professional?
            Success Van Hire combines affordable van rental London prices with
            clean, reliable vans for moving, deliveries, student moves and
            business jobs. Choose from small vans, Transit vans and Luton vans,
            with simple booking and transparent pricing across Greater London.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {benefits.map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <div
                key={i}
                className="group relative p-7 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-500 bg-white/2 hover:bg-white/4"
              >
                <div
                  className={`mb-5 p-3.5 ${benefit.bgColor} rounded-xl w-fit group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className={benefit.iconColor} size={26} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2.5">
                  {benefit.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
        <ReadMore data={ReadMoreData} layout="compact" />
      </div>
    </section>
  );
}

export function WhyCheapSection() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0a0e1a] via-[#0d1321] to-[#0a0e1a]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-px bg-linear-to-r from-transparent via-orange-500/20 to-transparent" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-8 text-center">
            Why Choose{" "}
            <span className="bg-linear-to-r from-[#fe9a00] to-amber-400 bg-clip-text text-transparent">
              Low Cost Van Hire London?
            </span>
          </h2>

          <div className="space-y-6 text-slate-300 leading-relaxed">
            <p>
              Choosing cheap van hire in London should not mean accepting poor
              service, unclear prices or unreliable vehicles. Success Van Hire
              is built for people who want practical,{" "}
              <Link
                href="/removal-van-hire-london"
                className="text-[#fe9a00] hover:text-amber-400  "
              >
                affordable van rental London options for moving house
              </Link>{" "}
              , collecting furniture, student relocations, trade work and short
              business deliveries.
            </p>

            <p>
              Our budget van hire London fleet includes small vans for quick
              city jobs, Ford Transit vans for everyday moves and larger vans
              for heavier loads. Each vehicle is maintained and checked
              regularly, so you can keep your costs down without gambling on
              quality.
            </p>

            <p>
              The biggest difference is transparency. Many providers promote
              cheap van rental London rates, then add extra charges later. We
              focus on clear pricing, fair hire terms and no hidden fees, so you
              can understand your van hire cost before you book.
            </p>

            <p>
              Whether you need low cost van hire London for a few hours, one
              day, a weekend or a longer period, our team can help you choose
              the right van size and hire duration. Book online or call us for
              the best price van hire London option available for your date.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PricingTableSection() {
  const pricing = [
    {
      size: "Short Wheel Base",
      daily: "£78",
      weekly: "£60",
      monthly: "£55",
      bestFor: "Trades, small furniture",
    },
    {
      size: "Medium Wheel Base",
      daily: "£96",
      weekly: "£78",
      monthly: "£70",
      bestFor: "Furniture moves, trade jobs",
    },
    {
      size: "Long Wheel Base",
      daily: "£102",
      weekly: "£72",
      monthly: "£65",
      bestFor: "House removals, office moves",
    },
    {
      size: "Luton With Tail-Lift",
      daily: "£132",
      weekly: "£100",
      monthly: "£90",
      bestFor: "Full house removals",
    },
  ];

  const ReadMoreData2 = {
    linkUrl: "/blog/avoid-hidden-fees-in-cheap-van-hire-london-2026",
    title: "Avoid Hidden Fees In Cheap Van Hire London 2026",
    description:
      "Planning a move or a big project in London? Opting for a Cheap Van Hire London can be a brilliant way to keep costs down.",
    iconType: "chevron", // or "chevron" or "custom"
    themeColors: {
      primary: "#fff", // Orange – your brand accent for headlines
      secondary: "#0f172b", // Slate – used for subtle borders
      background: "rgba(15, 23, 43, 0.2)",
      text: "#fff", // Slate text
      accent: "#fe9a00", // Orange CTA & icon
    },
  } as const;

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0a0e1a] via-[#0f1729] to-[#0a0e1a]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-px bg-linear-to-r from-transparent via-orange-500/20 to-transparent" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-5">
            Cheap Van Rental London{" "}
            <span className="bg-linear-to-r from-[#fe9a00] to-amber-400 bg-clip-text text-transparent">
              Prices by Van Size
            </span>
          </h2>
          <p className="text-slate-400 text-lg">
            Compare our budget van hire London prices by vehicle size. Daily,
            weekly and monthly options help you choose the cheapest van hire
            London plan for your move, delivery or business job.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-white font-bold">Van Size</th>
                <th className="text-left p-4 text-white font-bold">
                  Daily (1-6 days)
                </th>
                <th className="text-left p-4 text-white font-bold">
                  Weekly (7-28 days)
                </th>
                <th className="text-left p-4 text-white font-bold">
                  Monthly (29+ days)
                </th>
                <th className="text-left p-4 text-white font-bold">Best For</th>
              </tr>
            </thead>
            <tbody>
              {pricing.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-white/5 hover:bg-white/2 transition-colors"
                >
                  <td className="p-4 text-white font-semibold">{row.size}</td>
                  <td className="p-4 text-[#fe9a00] font-bold">{row.daily}</td>
                  <td className="p-4 text-slate-300">{row.weekly}</td>
                  <td className="p-4 text-slate-300">{row.monthly}</td>
                  <td className="p-4 text-slate-400 text-sm">{row.bestFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 p-6 bg-orange-500/5 border border-orange-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <FiAlertCircle
              className="text-orange-400 shrink-0 mt-1"
              size={20}
            />
            <div>
              <h4 className="text-white font-bold mb-2">
                Best Price Van Hire London Promise
              </h4>
              <p className="text-slate-400 text-sm">
                Found a genuine cheaper quote for a similar van, date and hire
                duration? Send it to us and we will do our best to match or beat
                it. Our goal is to keep cheap van hire London simple, fair and
                transparent, without hidden fees or last-minute surprises.
              </p>
            </div>
          </div>
        </div>
        <ReadMore data={ReadMoreData2} layout="compact" />
      </div>
    </section>
  );
}

export function SavingTipsSection() {
  const tips = [
    {
      icon: FiClock,
      title: "Book Early for the Cheapest Rates",
      description:
        "Early bookings usually get better cheap van hire London availability and more choice of van sizes.",
    },
    {
      icon: FiTrendingDown,
      title: "Choose Weekday Van Rental",
      description:
        "Weekdays can be cheaper than weekends, especially for low cost van hire London during busy moving periods.",
    },
    {
      icon: FiZap,
      title: "Use Weekly or Monthly Deals",
      description:
        "Weekly and monthly budget van hire London plans often give better value than daily rental for longer jobs.",
    },
  ];

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0a0e1a] via-[#0d1321] to-[#0a0e1a]" />
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-semibold mb-6 tracking-wide uppercase">
            Money Saving Tips
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-5">
            Money-Saving Tips for{" "}
            <span className="bg-linear-to-r from-[#fe9a00] to-amber-400 bg-clip-text text-transparent">
              Cheap Van Rental London
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Make your affordable van rental London booking even cheaper with a
            few simple timing and vehicle-size choices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tips.map((tip, i) => {
            const Icon = tip.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-xl border border-white/5 bg-white/2 hover:border-orange-500/30 transition-all duration-300"
              >
                <Icon className="text-[#fe9a00] mb-4" size={32} />
                <h3 className="text-xl font-bold text-white mb-2">
                  {tip.title}
                </h3>
                <p className="text-slate-400 text-sm">{tip.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FAQSection() {
  const faqs: FAQItem[] = [
    {
      question: "How much is cheap van hire in London?",
      answer:
        "Our cheap van hire London starts from £78/day for selected vans. The final price depends on van size, hire duration, date and availability. We show clear pricing before booking so you can compare your van hire cost with confidence.",
    },
    {
      question: "Do you offer cheap van rental London with no hidden fees?",
      answer:
        "Yes. Our cheap van rental London pricing is designed to be transparent, with essential costs explained upfront. We avoid surprise charges and make the total hire cost clear before you confirm your booking.",
    },
    {
      question: "What is the cheapest van hire London option?",
      answer:
        "The cheapest van hire London option is usually a small van booked early for a weekday. Weekly and monthly hire can also reduce the daily cost if you need the van for longer.",
    },
    {
      question: "Can I get budget van hire London for one day?",
      answer:
        "Yes. You can book budget van hire London for one day, a weekend, a week or longer. One-day hire is popular for IKEA runs, student moves, furniture pickups and small deliveries.",
    },
    {
      question: "Do you offer low cost van hire London for students?",
      answer:
        "Yes. Our low cost van hire London options are suitable for students moving rooms, collecting furniture or transporting belongings between accommodation. A small van is often the most affordable choice.",
    },
    {
      question: "Can I find cheap van hire near me through Success Van Hire?",
      answer:
        "If you are in London or Greater London, Success Van Hire can help with cheap van hire near me style bookings, depending on availability and your preferred pickup time.",
    },
    {
      question: "Do you offer cheap van hire near me no deposit?",
      answer:
        "Deposit requirements can depend on the booking, van type and driver details. Contact us before booking and we will explain the cheapest available option, including any deposit or insurance requirements.",
    },
    {
      question: "Is affordable van rental London still reliable?",
      answer:
        "Yes. Affordable van rental London should still be safe and dependable. Our vans are maintained, insured and checked regularly, so lower pricing does not mean poor quality.",
    },
    {
      question: "Can I hire a cheap Luton van in London?",
      answer:
        "Yes, Luton vans may be available for larger moves. For dedicated pricing and dimensions, visit our Luton van hire London page or contact us for the best available rate.",
    },
    {
      question: "Do you price match cheaper van hire quotes?",
      answer:
        "If you find a genuine cheaper quote for the same van type, date and hire duration, send it to us and we will do our best to match or beat it.",
    },
  ];

  return (
    <FAQComponent
      title="Frequently Asked Questions about Cheap Van Hire London"
      subtitle="Common questions about cheap van hire London"
      faqs={faqs}
      showSearch={false}
      defaultOpen={0}
      accentColor="#fe9a00"
      backgroundColor="#0a0e1a"
    />
  );
}

export function FinalCTASection() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0a0e1a] to-[#0f1729]" />
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6">
          Ready to Book{" "}
          <span className="bg-linear-to-r from-[#fe9a00] to-amber-400 bg-clip-text text-transparent">
            Cheap Van Hire in London?
          </span>
        </h2>
        <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
          Get reliable cheap van hire in London with clear prices, flexible hire
          periods and no hidden fees. Whether you need a small van for a quick
          pickup, budget van hire London for a student move or affordable van
          rental London for business deliveries, Success Van Hire helps you keep
          costs under control.
        </p>
        <Link
          href="/reservation"
          className="inline-flex items-center gap-3 px-10 py-4 bg-linear-to-r from-[#fe9a00] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5"
        >
          Book Cheap Van Hire Online
          <FiArrowRight size={20} />
        </Link>
      </div>
    </section>
  );
}
