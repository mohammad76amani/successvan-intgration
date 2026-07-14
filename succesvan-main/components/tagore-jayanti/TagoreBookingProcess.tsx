import { FiMessageCircle, FiTag, FiCheckCircle, FiHeart, FiPhone } from "react-icons/fi";

export default function TagoreBookingProcess() {
  const steps = [
    {
      icon: <FiMessageCircle className="text-4xl" />,
      title: "Tell Us About Your Celebration",
      desc: "Let us know your event date, pickup location, destination, passenger number and return journey details."
    },
    {
      icon: <FiTag className="text-4xl" />,
      title: "Claim Your 10% Discount",
      desc: "Use discount code 'TJC2026' when you contact us to request your 10% minibus hire discount."
    },
    {
      icon: <FiCheckCircle className="text-4xl" />,
      title: "Confirm Your Group Travel",
      desc: "We help you arrange a practical vehicle option for your group so everyone can travel together with less stress."
    },
    {
      icon: <FiHeart className="text-4xl" />,
      title: "Enjoy the Celebration",
      desc: "Arrive together, on time and ready to enjoy the poetry, music, culture and community spirit of Tagore Jayanti."
    }
  ];

  return (
    <section className="py-20 bg-linear-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-black text-[#0f172b] mb-6">
            How to Book Your Tagore Jayanti Minibus Hire
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 h-full">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#fe9a00] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                  {i + 1}
                </div>
                <div className="w-16 h-16 bg-[#fe9a00]/10 rounded-xl flex items-center justify-center mb-4 text-[#fe9a00] mt-4">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-[#0f172b] mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a 
            href="tel:+442030111198"
            className="inline-flex items-center gap-3 bg-[#fe9a00] hover:bg-[#e58900] text-white px-10 py-5 rounded-xl font-bold text-xl transition-all duration-300 hover:scale-105 shadow-2xl"
          >
            <FiPhone className="text-2xl" />
            Call +44 20 3011 1198 to book your minibus today
          </a>
        </div>
      </div>
    </section>
  );
}
