"use client";

import { FiMapPin, FiNavigation } from "react-icons/fi";
import { useMemo } from "react";

interface GoogleMapDirectionsProps {
  fromLocation: string;
  fromLat: number;
  fromLng: number;
  toLocation?: string;
  toLat?: number;
  toLng?: number;
  distance?: string;
  duration?: string;
  title?: string;
  subtitle?: string;
}

export default function GoogleMapDirections({
  fromLocation,
  fromLat,
  fromLng,
  toLocation = "Strata House, Waterloo Road, London NW2 7UH",
  toLat = 51.5675489,
  toLng = -0.2369702,
  distance = "1.5 miles",
  duration = "5-10 minutes drive",
  title,
  subtitle,
}: GoogleMapDirectionsProps) {
  const mapSrc = useMemo(() => {
    return `https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d9934.5!2d${fromLng}!3d${fromLat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e0!4m5!1s0x0:0x0!2s${encodeURIComponent(fromLocation)}!3m2!1d${fromLat}!2d${fromLng}!4m5!1s0x4876111d4a5ac669:0xd28c70fa99132413!2s${encodeURIComponent(toLocation)}!3m2!1d${toLat}!2d${toLng}!5e0!3m2!1sen!2suk!4v1234567890!5m2!1sen!2suk`;
  }, [fromLocation, fromLat, fromLng, toLocation, toLat, toLng]);

  return (
    <section className="relative py-20 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
            {title || (
              <>
                Find Us From <span className="text-[#fe9a00]">{fromLocation}</span>
              </>
            )}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {subtitle || `Easy directions from ${fromLocation} to our office at ${toLocation}`}
          </p>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <iframe
            src={mapSrc}
            width="100%"
            height="450"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Directions from ${fromLocation} to Success Van Hire`}
          ></iframe>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-linear-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#fe9a00]/10 flex items-center justify-center shrink-0">
                <FiMapPin className="text-[#fe9a00] text-2xl" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">Our Location</h3>
                <p className="text-gray-300 text-sm">
                  {toLocation.split(',').map((line, i) => (
                    <span key={i}>
                      {line.trim()}
                      {i < toLocation.split(',').length - 1 && <br />}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-linear-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <FiNavigation className="text-green-400 text-2xl" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">Distance</h3>
                <p className="text-gray-300 text-sm">
                  Approximately {distance} from {fromLocation}
                  <br />
                  Just {duration}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
