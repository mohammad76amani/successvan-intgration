import Link from "next/link";
import { FiTruck } from "react-icons/fi";

type RelatedPageItem = {
  label: string;
  href: string;
};

interface ExploreMoreVanHireOptionsProps {
  title?: string;
  pages?: RelatedPageItem[];
  className?: string;
}

const defaultPages: RelatedPageItem[] = [
  { label: "Van Hire London", href: "/van-hire-london" },
  { label: "Cheap Van Hire London", href: "/cheap-van-hire-london" },
  { label: "Van Hire Near Me", href: "/van-hire-near-me" },
  { label: "Self-Drive Van Hire", href: "/self-drive-van-hire" },
  { label: "Automatic Van Rental", href: "/automatic-van-hire-london" },
  { label: "Removal Van Hire London", href: "/removal-van-hire-london" },
  { label: "Luton Van Hire London", href: "/luton-van-hire-london" },
];

export default function ExploreMoreVanHireOptions({
  title = "Explore More Van Hire Options",
  pages = defaultPages,
  className = "",
}: ExploreMoreVanHireOptionsProps) {
  return (
    <section
      aria-labelledby="related-heading"
      className={`py-16 md:py-24 border-t border-white/10 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          id="related-heading"
          className="text-2xl sm:text-3xl font-black text-white mb-8 text-center"
        >
          {title}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {pages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold text-center hover:border-[#fe9a00]/40 hover:bg-[#fe9a00]/5 transition-colors duration-200"
            >
              <FiTruck
                className="text-[#fe9a00] text-sm shrink-0"
                aria-hidden="true"
              />
              {page.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
