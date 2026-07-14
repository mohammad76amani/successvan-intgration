import {
  FiBox,
  FiHome,
  FiShoppingCart,
  FiTruck,
  FiArrowRight,
  FiZap,
  FiDollarSign,
  FiClock,
  FiMapPin,
  FiShield,
} from "react-icons/fi";

export const useCases = [
  { icon: <FiBox className="text-lg md:text-2xl" />, text: "Removals & Moving Home" },
  {
    icon: <FiHome className="text-lg md:text-2xl" />,
    text: "Large Furniture Transport",
  },
  { icon: <FiShoppingCart className="text-lg md:text-2xl" />, text: "IKEA Purchases" },
  { icon: <FiTruck className="text-lg md:text-2xl" />, text: "Business Deliveries" },
  {
    icon: <FiArrowRight className="text-lg md:text-2xl" />,
    text: "Local & Long Distance",
  },
  { icon: <FiZap className="text-lg md:text-2xl" />, text: "Last Minute Hire" },
];

export const features = [
  {
    icon: <FiDollarSign className="text-3xl" />,
    title: "Highly Competitive Rates",
    description:
      "Best value for money with transparent pricing and no hidden charges.",
    linear: "from-[#fe9a00]/50 to-orange-500/10",
    iconColor: "text-[#fe9a00]",
  },
  {
    icon: <FiClock className="text-3xl" />,
    title: "Flexible Rental Terms",
    description:
      "Short-term or long-term van hire available to suit your needs.",
    linear: "from-[#fe9a00]/50 to-orange-500/10",
    iconColor: "text-[#fe9a00]",
  },
  {
    icon: <FiMapPin className="text-3xl" />,
    title: "Perfect Location",
    description:
      "Just off A406 Staples Corner, near Brent Cross Shopping Centre.",
    linear: "from-[#fe9a00]/50 to-orange-500/10",
    iconColor: "text-[#fe9a00]",
  },
  {
    icon: <FiShield className="text-3xl" />,
    title: "Fully Insured",
    description: "Comprehensive insurance coverage for complete peace of mind.",
    linear: "from-[#fe9a00]/50 to-orange-500/10",
    iconColor: "text-[#fe9a00]",
  },
];
