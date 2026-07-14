import { FiPhone, FiAlertCircle } from "react-icons/fi";

export default function TagoreStrongSales() {
  return (
    <section className="py-20 bg-linear-to-br from-[#1e293b] to-[#0f172b] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-[#fe9a00] px-6 py-3 rounded-full mb-6">
            <FiAlertCircle className="text-2xl" />
            <span className="font-bold">Important Booking Notice</span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-black mb-6">
            Do Not Leave Your Tagore Jayanti Travel Until the Last Minute
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed max-w-4xl mx-auto mb-6">
            Cultural celebration dates can become busy, especially around weekends and evening events. If your group needs a minibus, it is better to book early so you can secure the right vehicle size, plan your pickup times and avoid last-minute stress.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed max-w-4xl mx-auto">
            A smoother journey means more time to enjoy the celebration itself. Let Success Van handle the group travel while you focus on the event, your family, your guests and the meaning of the day.
          </p>
        </div>

        <div className="bg-[#fe9a00] rounded-3xl p-10 text-center max-w-3xl mx-auto shadow-2xl">
          <h3 className="text-3xl font-black text-white mb-4">
            Tagore Jayanti Celebration Travel Offer
          </h3>
          <p className="text-2xl font-bold text-white mb-6">
            Get 10% Off Minibus Hire
          </p>
          <div className="mb-6">
            <p className="text-white text-sm mb-2">Discount Code:</p>
            <div className="inline-block bg-[#0f172b] px-6 py-3 rounded-lg">
              <code className="text-white font-bold text-xl tracking-wider">TJC2026</code>
            </div>
          </div>
          <a 
            href="tel:+442030111198"
            className="inline-flex items-center gap-3 bg-[#0f172b] hover:bg-[#1e293b] text-white px-10 py-5 rounded-xl font-bold text-xl transition-all duration-300 hover:scale-105 shadow-2xl"
          >
            <FiPhone className="text-2xl" />
            Call Success Van: +44 20 3011 1198
          </a>
        </div>
      </div>
    </section>
  );
}
