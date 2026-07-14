import Link from "next/link";
import Image from "next/image";
import {
  FiCheck,
  FiPhone,
  FiArrowRight,
  FiTruck,
  FiBox,
  FiMaximize,
  FiShield,
  FiZap,
  FiAward,
  FiTool,
  FiHome,
} from "react-icons/fi";
import FAQComponent from "@/components/static/fAQSection";
import { ReadMore } from "../ui/ReadMore";

export function LutonVanHireLondonHero() {
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
              Luton Van Hire London{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-linear-to-r from-[#fe9a00] via-amber-400 to-[#fe9a00] bg-clip-text text-transparent">
                  20m³ Van Rental with Tail Lift
                </span>
                <span className="absolute -bottom-2 left-0 w-full h-3 bg-linear-to-r from-orange-500/20 to-amber-500/20 rounded-full blur-sm" />
              </span>
            </h1>

            <p className="text-sm md:text-base text-slate-300/90 mb-10 leading-relaxed max-w-xl">
              Looking for Luton van hire in London for a house move, furniture
              transport or commercial delivery? Success Van Hire offers large
              20m³ Luton van rental London options from £132/day, with tail lift
              support for heavy and bulky items. It is the ideal choice when a
              standard large van is not enough. Our Luton van hire with tail
              lift London service is suitable for 3-bedroom and 4-bedroom house
              moves, office relocations, storage trips, appliances, sofas,
              wardrobes and business logistics. Check availability, compare
              Luton{" "}
              <Link
                href="/van-hire-london"
                className="text-[#fe9a00] hover:text-amber-400 underline"
              >
                van hire london
              </Link>{" "}
              prices and book online in minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href="/reservation"
                className="group px-8 py-4 bg-linear-to-r from-[#fe9a00] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5"
              >
                book Luton van online{" "}
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
                  src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/luton+van+.jpg"
                  alt="Luton van hire London with 20m³ capacity and tail lift"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#0a0e1a]/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto">
                  <div className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-black/10 md:backdrop-blur-sm border border-white/10 rounded-xl">
                    <FiMaximize className="text-[#fe9a00]" size={18} />
                    <span className="text-white text-[10px] md:text-sm font-semibold">
                      Largest Capacity Available
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

export function WhyChooseLutonSection() {
  const benefits = [
    {
      icon: FiMaximize,
      title: "Maximum Capacity",
      description:
        "20m³ cargo volume plus over-cab storage — ideal for complete house moves in one trip.",
      iconColor: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: FiTool,
      title: "Tail Lift Available",
      description:
        "500kg lifting capacity makes loading sofas, wardrobes, appliances, and pallets effortless and safer.",
      iconColor: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      icon: FiShield,
      title: "Fully Insured",
      description:
        "Comprehensive insurance included with every Luton van rental London booking.",
      iconColor: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: FiZap,
      title: "Easy to Drive",
      description:
        "All our 3.5 tonne Luton vans can be driven on a standard UK car licence — no special training required.",
      iconColor: "text-orange-400",
      bgColor: "bg-orange-500/10",
    },
  ];
  const ReadMoreData = {
    linkUrl: "/blog/luton-van-hire-london-prices-a-2026-guide",
    title: "Luton Van Hire London Prices: A 2026 Guide",
    description:
      "Ever tried playing Tetris with your belongings in the back of a car? It's like a puzzle, but one that usually ends with frustration.",
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
            Why Choose Luton Van Hire in London?
          </h2>
          <p className="text-slate-300/90 text-base md:text-lg leading-relaxed">
            A Luton van gives you more loading space than a standard panel van,
            making it one of the best choices for{" "}
            <Link
              href="/removal-van-hire-london"
              className="text-[#fe9a00] hover:text-amber-400 underline"
            >
              moving house
            </Link>{" "}
            , transporting bulky furniture or handling commercial deliveries.
            With a box-shaped load area and tail lift support, Luton van rental
            London can save time, reduce lifting strain and help avoid multiple
            trips.
          </p>
        </div>
        <video
          src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/luton+van+video.mp4"
          autoPlay
          muted
          loop
          className="rounded-lg mx-auto my-5"
        ></video>
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

export function LutonSpecificationsSection() {
  const specs = [
    {
      label: "Cargo Volume",
      value: "20m³",
      description: "Plus over-cab storage space",
    },
    {
      label: "Load Length",
      value: "4.2m",
      description: "Perfect for long furniture",
    },
    {
      label: "Load Height",
      value: "2.2m",
      description: "Stand-up height inside",
    },
    {
      label: "Payload",
      value: "1,000kg",
      description: "Maximum load capacity",
    },
    {
      label: "Tail Lift",
      value: "Available",
      description: "500kg lifting capacity",
    },
    {
      label: "Fuel Type",
      value: "Diesel",
      description: "ULEZ compliant engines",
    },
  ];

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0d1321] via-[#0a0e1a] to-[#0d1321]" />
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            Luton Van Dimensions, Capacity & Payload{" "}
          </h2>
          <p className="text-slate-300/90 text-base md:text-lg leading-relaxed">
            Our Luton van hire London service is designed for larger loads,
            bulky items and full moving jobs. With around 20m³ of loading space,
            a box-style cargo area and tail lift availability, a Luton van is
            ideal when you need more capacity than a standard large van.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specs.map((spec, i) => (
            <div
              key={i}
              className="p-6 bg-white/5 border border-white/10 rounded-xl hover:border-[#fe9a00]/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-slate-400 text-sm font-medium">
                  {spec.label}
                </h3>
                <FiBox className="text-[#fe9a00]" size={20} />
              </div>
              <div className="text-3xl font-extrabold text-white mb-2">
                {spec.value}
              </div>
              <p className="text-slate-400 text-sm">{spec.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <FiAward className="text-blue-400 mt-1 shrink-0" size={20} />
            <div>
              <h4 className="text-white font-semibold mb-2">
                All Luton Van Hire London Includes:
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                Comprehensive insurance, unlimited mileage, 24/7 breakdown
                assistance, free additional driver, full tank of fuel, and no
                hidden fees. Our Luton van rental London service provides
                everything you need for a successful move or delivery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TailLiftBenefitsSection() {
  const benefits = [
    {
      title: "Heavy Furniture Loading",
      description:
        "Load sofas, wardrobes, and beds without lifting. Our tail lift Luton van hire London makes heavy furniture moves effortless and safer.",
    },
    {
      title: "Appliance Transport",
      description:
        "Fridges, washing machines, and ovens load easily with tail lift. Perfect for kitchen moves with Luton van rental London.",
    },
    {
      title: "Commercial Deliveries",
      description:
        "Pallet loading and unloading made simple. Ideal for businesses needing Luton van hire London for regular deliveries.",
    },
    {
      title: "Reduce Injury Risk",
      description:
        "No manual lifting of heavy items reduces back strain and injury risk. Safer moving with tail lift Luton van hire London.",
    },
    {
      title: "Save Time",
      description:
        "Load and unload faster with mechanical assistance. Complete your move quicker with tail lift Luton van rental London.",
    },
    {
      title: "Professional Results",
      description:
        "Move items safely without damage. Professional-grade equipment with our Luton van hire London service.",
    },
  ];

  const ReadMoreData2 = {
    linkUrl: "/blog/luton-van-hire-with-tail-lift-london-2026",
    title: "Luton Van Hire with Tail Lift London 2026 ",
    description:
      "Planning a move in the whirlwind energy of London? It's no small feat. Boxes, furniture,...",
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
            Luton Van Hire with Tail Lift London
          </h2>
          <p className="text-slate-300/90 text-base md:text-lg leading-relaxed">
            Luton van hire with tail lift London is especially useful when
            moving heavy furniture, appliances, business stock or equipment. The
            tail lift helps load bulky items safely and reduces manual lifting,
            making it a practical choice for house moves, office relocations and
            commercial transport.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, i) => (
            <div
              key={i}
              className="p-6 bg-white/5 border border-white/10 rounded-xl hover:border-[#fe9a00]/30 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-[#fe9a00]/10 flex items-center justify-center mb-4">
                <FiCheck className="text-[#fe9a00]" size={20} />
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
        <ReadMore data={ReadMoreData2} layout="compact" />
      </div>
    </section>
  );
}

export function LutonUseCasesSection() {
  const useCases = [
    {
      icon: FiHome,
      title: "Full House Moves",
      description:
        "Luton van hire London is ideal for 3-bedroom and 4-bedroom house moves, especially when you need space for beds, wardrobes, sofas, boxes and appliances.",
      ideal: "3-4 bedroom properties",
    },
    {
      icon: FiTruck,
      title: "Commercial Deliveries",
      description:
        "Commercial Luton van hire is suitable for moving desks, chairs, filing cabinets, IT equipment and office supplies across London.",
      ideal: "Businesses & traders",
    },
    {
      icon: FiBox,
      title: "Office Relocations",
      description:
        "Move entire offices with desks, chairs, and equipment. Luton van hire London handles commercial moves efficiently.",
      ideal: "Small to medium offices",
    },
  ];

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0d1321] via-[#0a0e1a] to-[#0d1321]" />
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            Best Uses for Luton Van Rental London
          </h2>
          <p className="text-slate-300/90 text-base md:text-lg leading-relaxed">
            Our Luton van hire London service is ideal for various moving and
            delivery needs. From full house relocations to commercial
            deliveries, Luton van rental London provides the capacity and
            reliability you need.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {useCases.map((useCase, i) => (
            <div
              key={i}
              className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-[#fe9a00]/30 transition-all hover:-translate-y-1"
            >
              <div className="w-16 h-16 rounded-xl bg-[#fe9a00]/10 flex items-center justify-center mb-6">
                <useCase.icon className="text-[#fe9a00]" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {useCase.title}
              </h3>
              <p className="text-slate-300 mb-4 leading-relaxed">
                {useCase.description}
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
                <span className="text-[#fe9a00] text-sm font-medium">
                  {useCase.ideal}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LutonFAQSection() {
  const faqs = [
    {
      question: "How much does Luton van hire London cost?",
      answer:
        "Luton van hire London starts from £132/day depending on availability, hire duration, date and booking details. Success Van Hire provides clear pricing before confirmation so you can compare the total Luton van hire cost.",
    },
    {
      question: "Do you offer Luton van hire with tail lift in London?",
      answer:
        "Yes, Luton van hire with tail lift London may be available depending on your selected date and vehicle availability. A tail lift is useful for heavy furniture, appliances, business stock and bulky items.",
    },
    {
      question: "What can fit in a Luton van?",
      answer:
        "A Luton van is suitable for larger house moves, furniture, appliances, boxes, office equipment and commercial deliveries. It is often used for 3-bedroom and 4-bedroom house moves depending on how much you need to transport.",
    },
    {
      question: "Is a Luton van bigger than a large van?",
      answer:
        "Yes. A Luton van usually offers more usable loading space than a standard large van because of its box-shaped cargo area. It is a better choice for bulky furniture, house moves and larger loads.",
    },
    {
      question: "Can I hire a Luton van for moving house?",
      answer:
        "Yes, Luton van hire is one of the best choices for moving house in London. It is suitable for flat moves, house moves, storage trips and furniture transport.",
    },
    {
      question: "Can I book a Luton van online?",
      answer:
        "Yes. You can book Luton van hire London online through Success Van Hire. Choose your dates, hire duration and vehicle type, then submit your reservation request.",
    },
    {
      question: "Do I need experience to drive a Luton van?",
      answer:
        "A Luton van is larger than a normal car or small van, so drivers should be comfortable with wider turns, height restrictions and careful parking. Requirements may depend on licence, age and booking details.",
    },
    {
      question: "Is Luton van rental good for business deliveries?",
      answer:
        "Yes. Commercial Luton van hire is useful for retail stock, event equipment, office relocation, large deliveries and business logistics across London.",
    },
  ];

  return (
    <FAQComponent
      title=" Luton Van Hire London – Frequently Asked Questions"
      subtitle="Find answers to common questions about our van hire services in London"
      faqs={faqs}
      showSearch={false}
      defaultOpen={0}
      accentColor="#fe9a00"
      backgroundColor="#0a0e1a"
    />
  );
}

export function LutonFinalCTA() {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#0d1321] via-[#0a0e1a] to-[#0d1321]" />
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="p-8 md:p-12 bg-linear-to-br from-[#fe9a00]/10 via-amber-500/5 to-orange-500/10 border border-[#fe9a00]/20 rounded-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Book Your Luton Van Hire London Today
          </h2>
          <p className="text-slate-300 leading-relaxed mb-8 max-w-2xl mx-auto">
            Get the largest capacity Luton van hire London with tail lift,
            unlimited mileage, and full insurance from £132/day. Perfect for
            full house moves and commercial deliveries. Whether you need removal
            van hire london or professional van hire london , our Luton van
            rental London service delivers maximum capacity and reliability.
            Book now and experience hassle-free moving with 20m³ cargo space.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/reservation"
              className="group px-8 py-4 bg-linear-to-r from-[#fe9a00] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20"
            >
              Book Luton Van Now
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
              Call for Booking
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
