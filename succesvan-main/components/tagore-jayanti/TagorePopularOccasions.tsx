import { FiMusic, FiUsers, FiHome, FiMapPin, FiStar, FiClock } from "react-icons/fi";

export default function TagorePopularOccasions() {
  const occasions = [
    {
      icon: <FiMusic className="text-3xl" />,
      title: "Evening Cultural Programmes",
      desc: "Perfect for music, poetry, dance and stage performances."
    },
    {
      icon: <FiUsers className="text-3xl" />,
      title: "Family Gatherings",
      desc: "Simple group travel for relatives attending the same celebration."
    },
    {
      icon: <FiHome className="text-3xl" />,
      title: "Community Centre Events",
      desc: "Ideal for groups visiting Bengali, Indian or multicultural community venues."
    },
    {
      icon: <FiMapPin className="text-3xl" />,
      title: "Temple Visits",
      desc: "Useful for families and community members attending prayer or remembrance events."
    },
    {
      icon: <FiStar className="text-3xl" />,
      title: "School and University Performances",
      desc: "Great for students, teachers and performers travelling with costumes or materials."
    },
    {
      icon: <FiClock className="text-3xl" />,
      title: "Group Return Journeys",
      desc: "Arrange both arrival and return travel so nobody is left organising transport late at night."
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-5xl font-black text-[#0f172b] mb-6">
            Best Times to Book Minibus Hire for Tagore Jayanti Celebration
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed max-w-4xl mx-auto">
            Tagore Jayanti events can take place across several days, especially around weekends, evening programmes and community gatherings. Booking early gives your group more time to plan pickup points, passenger numbers, luggage space and return travel.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {occasions.map((occasion, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-14 h-14 bg-[#fe9a00] rounded-xl flex items-center justify-center mb-4 text-white">
                {occasion.icon}
              </div>
              <h3 className="text-xl font-bold text-[#0f172b] mb-3">{occasion.title}</h3>
              <p className="text-gray-600">{occasion.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
