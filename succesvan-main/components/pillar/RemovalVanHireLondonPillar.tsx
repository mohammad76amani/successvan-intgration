"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  FiCheck,
  FiPhone,
  FiArrowRight,
  FiTruck,
  FiHome,
  FiPackage,
  FiShield,
  FiClock,
  FiUsers,
  FiMapPin,
} from "react-icons/fi";
import FAQComponent from "@/components/static/fAQSection";
import { ReadMore } from "../ui/ReadMore";

export function RemovalVanHireLondonHero() {
  return (
    <section className="relative min-h-screen flex items-center pt-30 md:pt-36  pb-16 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-[#0a0e1a] via-[#0f1729] to-[#0a0e1a]" />
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-200 h-200 bg-linear-to-bl from-orange-500/8 via-amber-500/4 to-transparent rounded-full md:blur-3xl" />
        <div className="absolute bottom-0 left-0 w-150 h-150 bg-linear-to-tr from-blue-500/5 via-cyan-500/3 to-transparent rounded-full md:blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 h-100 bg-orange-500/3 rounded-full blur-[120px]" />
      </div>

      <div
        className="absolute inset-0 opacity-2"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-2 lg:order-1">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-[1.05] tracking-tight">
              Removal Van Hire London{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-linear-to-r from-[#fe9a00] via-amber-400 to-[#fe9a00] bg-clip-text text-transparent">
                  Self-Drive Moving Vans from £132/Day
                </span>
                <span className="absolute -bottom-2 left-0 w-full h-3 bg-linear-to-r from-orange-500/20 to-amber-500/20 rounded-full blur-sm" />
              </span>
            </h1>

            <p className="text-sm md:text-base text-slate-300/90 mb-8 leading-relaxed max-w-xl">
              Planning a house move, flat move or furniture collection? Success
              Van Hire offers removal van hire London from £132/day, with{" "}
              <Link
                href="/self-drive-van-hire-london"
                target="_blank"
                className="text-[#fe9a00] hover:text-amber-400"
              >
                self-drive moving vans
              </Link>{" "}
              self-drive moving vans for local moves, storage runs, student
              relocations and business transport. Choose from small, medium,
              large and Luton vans depending on how much you need to move. Our
              moving{" "}
              <Link
                href="/van-hire-london"
                target="_blank"
                className="text-[#fe9a00] hover:text-amber-400"
              >
                van hire London
              </Link>{" "}
              service is designed for flexible, affordable and practical moves
              across Greater London. Whether you need van hire for moving London
              today, over the weekend or for a longer project, you can book
              online and get help choosing the right van size.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href="/reservation"
                className="group px-8 py-4 bg-linear-to-r from-[#fe9a00] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5"
              >
                Book Removal Van Hire
                <FiArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <a
                href="tel:+442030111198"
                className="group px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all duration-300 border border-white/10 hover:border-white/20 flex items-center justify-center gap-3 md:backdrop-blur-sm"
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
                <Image
                  src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/crew+cab+van+removal+van+hire.webp"
                  alt="Removal van hire London for house moves and furniture transport"
                  fill
                  priority
                  fetchPriority="high"
                  quality={65}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
                  placeholder="blur"
                  blurDataURL="data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoKAAoAAUAmJQBOgB6AA/vuUAAA"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#0a0e1a]/90 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto">
                  <div className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-black/10 md:backdrop-blur-sm border border-white/10 rounded-xl">
                    <FiTruck className="text-[#fe9a00]" size={18} />
                    <p className="text-xs md:text-base text-slate-300/90 leading-relaxed max-w-xl">
                      Perfect for House Moves • Flat Relocations • Office Moves
                    </p>
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

export function WhyChooseRemovalSection() {
  const benefits = [
    {
      icon: FiTruck,
      title: "Spacious Removal Vans",
      description:
        "Large capacity Luton vans and LWB vans with tail lifts for easy loading and unloading. Ideal for 1-bed flats up to 4-bedroom houses.",
      iconColor: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: FiShield,
      title: "Fully Insured Moves",
      description:
        "Comprehensive insurance included with every removal van hire London booking. Drive with complete peace of mind.",
      iconColor: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      icon: FiClock,
      title: "Flexible Moving Times",
      description:
        "Hire by the day, weekend, week, or longer. Perfect for both quick moves and long distance moving van rental.",
      iconColor: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: FiUsers,
      title: "Free Additional Driver",
      description:
        "Add a second driver at no extra cost – ideal when sharing the driving on bigger house moves.",
      iconColor: "text-orange-400",
      bgColor: "bg-orange-500/10",
    },
  ];
  const ReadMoreData = {
    linkUrl: "/blog/complete-moving-house-checklist-london-2026",
    title: "Complete Moving House Checklist London 2026",
    description:
      "Moving house in the bustling city of London can feel like orchestrating a symphony—you've got to get every note just right",
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
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            Why Choose Removal Van Hire in London?
          </h2>
          <p className="text-slate-300/90 text-base md:text-lg leading-relaxed">
            Hiring a removal van gives you more control over your move than
            traditional movers. With self-drive removal van hire London, you
            choose the vehicle, pickup time, route and hire duration. It is
            ideal for house moves, flat moves, furniture transport, office
            relocations and storage trips.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, i) => (
            <div
              key={i}
              className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-[#fe9a00]/30 transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className={`w-14 h-14 rounded-xl ${benefit.bgColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
              >
                <benefit.icon className={benefit.iconColor} size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {benefit.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
        <ReadMore data={ReadMoreData} layout="compact" />
      </div>
    </section>
  );
}

export function VanSizesForMovingSection() {
  const [selectedSize, setSelectedSize] = useState(0);

  const vanSizes = [
    {
      name: "Medium Van for Flat Moves",
      size: "Studio - 1 Bed Flat",
      price: "from £96",
      capacity: "Approx. 10-12 cubic metres",
      ideal:
        "Studio flats, small flat moves, student moves, boxes, small furniture and light deliveries",
      features: [
        "Great for small London moves",
        "Easy to drive and park",
        "Useful for narrow city streets",
        "Ideal for boxes, bags and smaller furniture",
      ],
      image:
        "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/removal+van+hire+medium+wheel+base.jpg",
    },
    {
      name: "Large Van",
      size: "1-2 Bedroom Flat",
      price: "from £102",
      capacity: "Approx. 14-16 cubic metres",
      ideal:
        "Flat moves, small house moves, furniture transport, business deliveries and office equipment",
      features: [
        "Extra load space for furniture",
        "Good balance of size and drivability",
        "Popular for London flat moves",
        "Suitable for longer distance moving jobs",
      ],
      image:
        "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/removan+van+hire+large+van.jpg",
    },
    {
      name: "Luton Van",
      size: "2-4 Bedroom House",
      price: "from £132",
      capacity: "Approx. 18-20 cubic metres",
      ideal:
        "House moves, larger removals, bulky furniture, appliances and full-room relocations",
      features: [
        "Largest moving van option",
        "Tail lift available for heavy items",
        "Ideal for house moves and bulky loads",
        "Over-cab storage for extra boxes",
      ],
      image:
        "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/removal+van+hire+luton.jpg",
    },
  ];

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0d1321] via-[#0a0e1a] to-[#0d1321]" />
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            Choose the Right Van Size for Moving
          </h2>
          <p className="text-slate-300/90 text-base md:text-lg leading-relaxed">
            The best removal van depends on your property size, furniture volume
            and moving distance. Our moving van rental London options include
            small vans for light moves, medium vans for 1-bedroom flats, large
            vans for furniture transport and Luton vans for bigger house moves.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {vanSizes.map((van, i) => (
            <button
              key={i}
              onClick={() => setSelectedSize(i)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                selectedSize === i
                  ? "bg-[#fe9a00] text-white shadow-lg shadow-orange-500/30"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
              }`}
            >
              {van.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-linear-to-r from-orange-500/10 to-amber-500/10 rounded-3xl blur-2xl" />
            <div className="relative h-80 rounded-2xl overflow-hidden border border-white/10">
              <Image
                src={vanSizes[selectedSize].image}
                alt={vanSizes[selectedSize].name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full mb-4">
              <FiHome className="text-[#fe9a00]" size={16} />
              <span className="text-sm text-slate-300 font-medium">
                {vanSizes[selectedSize].size}
              </span>
            </div>

            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {vanSizes[selectedSize].name}
            </h3>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-extrabold text-[#fe9a00]">
                {vanSizes[selectedSize].price}
              </span>
              <span className="text-slate-400">/day</span>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <FiPackage className="text-[#fe9a00] mt-1 shrink-0" />
                <div>
                  <p className="text-white font-semibold">Capacity</p>
                  <p className="text-slate-400 text-sm">
                    {vanSizes[selectedSize].capacity}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiMapPin className="text-[#fe9a00] mt-1 shrink-0" />
                <div>
                  <p className="text-white font-semibold">Ideal For</p>
                  <p className="text-slate-400 text-sm">
                    {vanSizes[selectedSize].ideal}
                  </p>
                </div>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {vanSizes[selectedSize].features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <FiCheck className="text-green-400 mt-1 shrink-0" />
                  <span className="text-slate-300 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/reservation"
              className="inline-flex items-center gap-3 px-8 py-4 bg-linear-to-r from-[#fe9a00] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20"
            >
              Book This Van
              <FiArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MovingTipsSection() {
  const tips = [
    {
      title: "Book Early for Weekends",
      description:
        "Weekend moving van hire London is popular, so booking early gives you more choice and better availability.",
    },
    {
      title: "Choose the Right Van Size",
      description:
        "A van that is too small can mean extra trips, while a van that is too large may cost more than needed.",
    },
    {
      title: "Prepare Your Loading Area",
      description:
        "Check parking, building access, lift access and loading restrictions before your moving van arrives.",
    },
    {
      title: "Use a Luton for Bigger Moves",
      description:
        "For larger house moves, bulky furniture or heavy loads, Luton van hire for moving can save time and reduce trips.",
    },
  ];

  const ReadMoreData2 = {
    linkUrl: "/blog/best-removal-van-hire-london-for-flats-2026",
    title: "Best Removal Van Hire London for Flats 2026",
    description:
      "Picture this: you're perched in your cozy London flat, surrounded by boxes, contemplating the monumental task of moving.",
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
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            Moving Tips for Removal Van Hire London
          </h2>
          <p className="text-slate-300/90 text-base md:text-lg leading-relaxed">
            A little planning can make your removal van hire London booking
            cheaper, faster and less stressful. Choose the right van size, book
            early, avoid unnecessary trips and check parking or loading access
            before moving day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6 gap-6">
          {tips.map((tip, i) => (
            <div
              key={i}
              className="p-6 bg-white/5 border border-white/10 rounded-xl hover:border-[#fe9a00]/30 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-[#fe9a00]/10 flex items-center justify-center mb-4">
                <span className="text-[#fe9a00] font-bold text-lg">
                  {i + 1}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{tip.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {tip.description}
              </p>
            </div>
          ))}
        </div>

        <ReadMore data={ReadMoreData2} layout="compact" />
      </div>
    </section>
  );
}

export function RemovalFAQSection() {
  const faqs = [
    {
      question: "How much does removal van hire London cost?",
      answer:
        "Removal van hire London starts from £132/day for selected vans. The final price depends on van size, hire duration, date and availability. Larger vans and Luton vans may cost more due to their capacity.",
    },
    {
      question: "What size van do I need for moving house?",
      answer:
        "For a small flat or student move, a small or medium van may be enough. For larger furniture, multiple rooms or a full house move, a large van or Luton van is usually more suitable.",
    },
    {
      question: "Can I book self-drive removal van hire in London?",
      answer:
        "Yes. Success Van Hire offers self-drive removal van hire London, so you can collect the van, load it yourself, drive it and return it based on your selected hire period.",
    },
    {
      question: "Is a Luton van good for moving house?",
      answer:
        "Yes. Luton van hire for moving is ideal for larger house moves, bulky furniture, appliances and heavy loads. The box-shaped loading area gives more usable space than many standard vans.",
    },
    {
      question: "Can I hire a van for a flat move in London?",
      answer:
        "Yes. Flat move van hire London is available for studio flats, 1-bedroom flats, student accommodation and small apartment moves.",
    },
    {
      question: "Can I use a removal van for furniture transport?",
      answer:
        "Yes. Furniture removal van hire is suitable for sofas, wardrobes, beds, tables, appliances and large household items.",
    },
    {
      question: "Do you offer weekend moving van hire London?",
      answer:
        "Yes, weekend moving van hire London may be available depending on fleet availability. We recommend booking early because weekends are popular for house moves.",
    },
    {
      question: "Can I hire a van for an office move?",
      answer:
        "Yes. Office move van hire London is suitable for desks, chairs, filing cabinets, IT equipment, boxes and business relocation jobs.",
    },
  ];

  return (
    <FAQComponent
      title=" Frequently Asked Questions About Removal Van Rental"
      subtitle="Find answers to common questions about our van hire services in London"
      faqs={faqs}
      showSearch={false}
      defaultOpen={0}
      accentColor="#fe9a00"
      backgroundColor="#0a0e1a"
    />
  );
}

export function RemovalFinalCTA() {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0a0e1a] via-[#0d1321] to-[#0a0e1a]" />
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="p-8 md:p-12 bg-linear-to-br from-[#fe9a00]/10 via-amber-500/5 to-orange-500/10 border border-[#fe9a00]/20 rounded-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Book Your Removal Van Hire London?
          </h2>
          <p className="text-slate-300 leading-relaxed mb-8 max-w-2xl mx-auto">
            Make your house move easier with reliable removal van from Success
            Van Hire. Spacious, well-maintained vans, transparent pricing, full
            insurance, and 24/7 support.
            <Link href="/" className="text-[#fe9a00] hover:text-amber-400">
              successvanhire
            </Link>{" "}
            today make your move stress-free. Professional removal van rental in
            London from <strong>£132/day</strong> with unlimited mileage and
            24/7 support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/reservation"
              className="group px-8 py-4 bg-linear-to-r from-[#fe9a00] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20"
            >
              Book Removal Van Now
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
              Call for Advice
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
