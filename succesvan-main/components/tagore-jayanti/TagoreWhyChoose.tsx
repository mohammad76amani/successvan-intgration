import { FiMapPin, FiStar, FiPhone, FiUsers, FiTag } from "react-icons/fi";

export default function TagoreWhyChoose() {
  const benefits = [
    {
      icon: <FiMapPin className="text-3xl" />,
      title: "London-Based Service",
      desc: "We support local group travel across London and surrounding areas."
    },
    {
      icon: <FiStar className="text-3xl" />,
      title: "Ideal for Cultural Events",
      desc: "Our minibus hire is suitable for Indian, Bengali and wider community celebrations."
    },
    {
      icon: <FiPhone className="text-3xl" />,
      title: "Simple Booking",
      desc: "Call us, share your travel details and we will help you arrange the journey."
    },
    {
      icon: <FiUsers className="text-3xl" />,
      title: "Group-Friendly Travel",
      desc: "Keep passengers and event items together in one organised vehicle."
    },
    {
      icon: <FiTag className="text-3xl" />,
      title: "Special Celebration Discount",
      desc: "Enjoy 10% off minibus hire for Tagore Jayanti Celebration travel."
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-5xl font-black text-[#0f172b] mb-6">
            Why Choose Success Van for Tagore Jayanti Celebration Travel?
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed max-w-4xl mx-auto">
            Success Van understands that group travel is not just about getting from one place to another. For cultural events, timing, comfort, space and organisation matter. Whether you are travelling with family, performers, elders or community members, we help make the journey easier from the first call.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {benefits.map((benefit, i) => (
            <div key={i} className="bg-gray-50 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-14 h-14 bg-[#fe9a00] rounded-xl flex items-center justify-center mb-4 text-white">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-bold text-[#0f172b] mb-3">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
