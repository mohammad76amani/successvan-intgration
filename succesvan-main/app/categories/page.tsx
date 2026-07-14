import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  FiArrowRight,
  FiCheckCircle,
  FiUsers,
} from "react-icons/fi";
import { BsFuelPump } from "react-icons/bs";
import { GiCarDoor } from "react-icons/gi";
import { categoryNameToSlug, fetchAllCategories } from "@/lib/category-utils";

export const metadata: Metadata = {
  title: "Our Vans | Van Hire London | Success Van Hire",
  description:
    "Browse the Success Van Hire fleet, compare van sizes and prices, and choose the right vehicle for your journey.",
  alternates: {
    canonical: "/categories",
  },
};

export const revalidate = 60;

const capitalise = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export default async function CategoriesPage() {
  const categories = await fetchAllCategories();

  return (
    <main className="min-h-screen bg-[#0f172b] text-white">
      <section className="relative overflow-hidden pt-40 pb-14 md:pt-36 md:pb-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#fe9a00]/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
         

          <div className="max-w-3xl">
           
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Choose Your <span className="text-[#fe9a00]">Perfect Van</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300 sm:text-lg">
              Explore our available vans, compare their key features and open
              any vehicle to see full details and prices.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {categories.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const typeName =
                  typeof category.type === "object"
                    ? category.type?.name
                    : undefined;

                return (
                  <Link
                    key={category._id}
                    href={`/categories/${encodeURIComponent(
                      categoryNameToSlug(category.name),
                    )}`}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition duration-300 hover:-translate-y-1 hover:border-[#fe9a00]/50 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-[#fe9a00]/10"
                    aria-label={`View details for ${category.name}`}
                  >
                    <div className="relative aspect-16/10 overflow-hidden bg-white/5">
                      <Image
                        src={category.image || "/assets/images/van.png"}
                        alt={category.name}
                        fill
                         className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-[#0f172b]/80 via-transparent to-transparent" />

                      {typeName && (
                        <span className="absolute left-4 top-4 rounded-full border border-white/10 bg-[#0f172b]/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#fe9a00] backdrop-blur-md">
                          {typeName}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <h2 className="text-2xl font-black transition-colors group-hover:text-[#fe9a00]">
                        {category.name}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-400">
                        {category.expert ||
                          category.purpose ||
                          category.description ||
                          `Discover the ${category.name} and view full hire details.`}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2 text-xs text-gray-300">
                        <span className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5">
                          <FiUsers className="text-[#fe9a00]" />
                          {category.seats} seats
                        </span>
                        <span className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5">
                          <GiCarDoor className="text-[#fe9a00]" />
                          {category.doors} doors
                        </span>
                        <span className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5">
                          <BsFuelPump className="text-[#fe9a00]" />
                          {capitalise(category.fuel)}
                        </span>
                        {category.gear?.availableTypes?.length > 0 && (
                          <span className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5">
                            <FiCheckCircle className="text-[#fe9a00]" />
                            {category.gear.availableTypes
                              .map(capitalise)
                              .join(" / ")}
                          </span>
                        )}
                      </div>

                      <div className="mt-auto flex items-end justify-between border-t border-white/10 pt-5">
                        <div>
                          <span className="block text-xs text-gray-500">
                            From
                          </span>
                          <span className="text-2xl font-black text-[#37cf6f]">
                            £{category.showPrice}
                          </span>
                          <span className="ml-1 text-sm text-gray-400">
                            / day
                          </span>
                        </div>

                        <span className="flex items-center gap-2 font-bold text-[#fe9a00]">
                          View van
                          <FiArrowRight className="transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-20 text-center">
              <h2 className="text-2xl font-black">No vans available</h2>
              <p className="mt-3 text-gray-400">
                Our fleet is being updated. Please check back soon.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
