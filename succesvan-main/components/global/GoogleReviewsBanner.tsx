import { FiExternalLink, FiMapPin, FiStar } from "react-icons/fi";

interface GoogleReviewsBannerProps {
  title?: string;
  highlight?: string;
  description: string;
  reviewUrl?: string;
  ratingValue?: string;
  badgeText?: string;
  className?: string;
}

const defaultReviewUrl =
  "https://www.google.co.uk/maps/place/Success+Van+Hire/@51.5697225,-0.2386674,17.48z/data=!4m16!1m9!3m8!1s0x48761b70e7890549:0x932c1c31b90d97!2sSuccess+Van+Hire!8m2!3d51.5675488!4d-0.2369702!9m1!1b1!16s%2Fg%2F11m7j0n771!3m5!1s0x48761b70e7890549:0x932c1c31b90d97!8m2!3d51.5675488!4d-0.2369702!16s%2Fg%2F11m7j0n771?entry=ttu";

export default function GoogleReviewsBanner({
  title = "Trusted Across",
  highlight = "NW London",
  description,
  reviewUrl = defaultReviewUrl,
  ratingValue = "4.8",
  badgeText = "HIGHLY RATED",
  className = "",
}: GoogleReviewsBannerProps) {
  return (
    <section
      aria-labelledby="rating-heading"
      className={`py-16 md:py-24 border-t border-white/10 ${className}`}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 sm:p-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs font-bold mb-4">
            <FiStar className="text-sm" aria-hidden="true" />
            {badgeText}
          </div>

          <h2
            id="rating-heading"
            className="text-2xl sm:text-3xl font-black text-white mb-2"
          >
            {title} <span className="text-[#fe9a00]">{highlight}</span>
          </h2>

          <p className="text-gray-400 text-sm sm:text-base mb-6">
            {description}
          </p>

          <div className="flex items-center justify-center gap-1.5 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <FiStar
                key={i}
                className="text-yellow-400 text-2xl sm:text-3xl fill-yellow-400"
                aria-hidden="true"
              />
            ))}
          </div>

          <p className="text-4xl font-black text-white mb-1">{ratingValue}</p>
          <p className="text-gray-400 text-sm mb-6">Google Rating</p>

          <a
            href={reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 hover:border-[#fe9a00]/30 transition-colors duration-200"
          >
            <FiMapPin aria-hidden="true" />
            View Our Reviews
            <FiExternalLink className="text-xs" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
