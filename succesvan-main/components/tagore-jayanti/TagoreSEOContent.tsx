import { FiArrowRight } from "react-icons/fi";

export default function TagoreSEOContent() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-5xl font-black text-[#0f172b] mb-6">
            Tagore Jayanti Celebration Transport in London
          </h2>
        </div>

        <div className="bg-white rounded-3xl p-10 shadow-lg">
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            If you are searching for Tagore Jayanti Celebration minibus hire in London, Success Van is here to help. Our group travel service is designed for families, community groups, performers, students and guests attending Tagore Jayanti events across the city.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Tagore Jayanti is a special time for poetry, music, performance, remembrance and cultural pride. Many London events bring together people from different boroughs, which makes transport planning an important part of the day. Instead of asking everyone to travel separately, booking a minibus gives your group a clearer, easier and more comfortable journey.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed mb-8">
            Whether your destination is a community hall, cultural centre, school, temple, private venue or public event space, Success Van can help you plan your group travel for Tagore Jayanti Celebration in London.
          </p>

          <div className="text-center">
            <div className="mb-6">
              <p className="text-gray-600 text-sm mb-2">Use Discount Code:</p>
              <div className="inline-block bg-gray-100 px-6 py-3 rounded-lg border-2 border-[#fe9a00]">
                <code className="text-[#fe9a00] font-bold text-lg tracking-wider">TJC2026</code>
              </div>
            </div>
            <a 
              href="tel:+442030111198"
              className="inline-flex items-center gap-3 bg-[#fe9a00] hover:bg-[#e58900] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-xl"
            >
              Book early and claim your 10% discount today
              <FiArrowRight className="text-xl" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
