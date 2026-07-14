import { FiPhone } from "react-icons/fi";

export default function TagoreCTA() {
  return (
    <section id="booking" className="py-20 bg-linear-to-br from-[#fe9a00] to-[#e58900] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl lg:text-5xl font-black mb-6">
          Ready to Book Your Tagore Jayanti Travel?
        </h2>
        <p className="text-xl mb-10 opacity-90">
          Get 10% off when you book your minibus hire for Tagore Jayanti Celebration
        </p>
        
        <a 
          href="tel:+442030111198"
          className="inline-flex items-center gap-3 bg-[#0f172b] hover:bg-[#1e293b] text-white px-10 py-5 rounded-xl font-bold text-xl transition-all duration-300 hover:scale-105 shadow-2xl"
        >
          <FiPhone className="text-2xl" />
          Call Now: +44 20 3011 1198
        </a>
        
        <p className="mt-8 text-sm opacity-80">
          Success Van | Strata House, Waterloo Road, London, NW2 7UH
        </p>
      </div>
    </section>
  );
}
