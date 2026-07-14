import { FiMapPin, FiPhone } from "react-icons/fi";

export default function TagoreLocalTravel() {
  const areas = [
    "Wembley", "Harrow", "Brent", "Ealing", "Southall", "Ilford", 
    "Croydon", "Hounslow", "Stratford", "Finchley", "Hendon", "Camden", 
    "Hammersmith", "Watford"
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-5xl font-black text-[#0f172b] mb-6">
            Tagore Jayanti Minibus Hire Across London
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed max-w-4xl mx-auto">
            Success Van supports group travel across London for cultural celebrations, family events and community programmes. Whether your group is travelling from North London, West London, East London, South London or Central London, we help make your journey more organised.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Location Info */}
          <div className="bg-linear-to-br from-[#0f172b] to-[#1e293b] rounded-3xl p-10 text-white">
            <div className="flex items-start gap-4 mb-6">
              <FiMapPin className="text-[#fe9a00] text-4xl shrink-0" />
              <div>
                <h3 className="text-2xl font-black mb-4">Our Location</h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Success Van<br />
                  Strata House, Waterloo Road,<br />
                  London, NW2 7UH
                </p>
              </div>
            </div>
          </div>

          {/* Service Areas */}
          <div>
            <h3 className="text-2xl font-black text-[#0f172b] mb-6">We Serve Areas Including:</h3>
            <div className="flex flex-wrap gap-3">
              {areas.map((area, i) => (
                <span 
                  key={i} 
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-[#fe9a00] hover:text-white transition-all duration-300"
                >
                  {area}
                </span>
              ))}
              <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium">
                and surrounding London areas
              </span>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <a 
            href="tel:+442030111198"
            className="inline-flex items-center gap-3 bg-[#fe9a00] hover:bg-[#e58900] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-2xl"
          >
            <FiPhone className="text-xl" />
            Speak to Success Van today and plan your Tagore Jayanti group journey
          </a>
        </div>
      </div>
    </section>
  );
}
