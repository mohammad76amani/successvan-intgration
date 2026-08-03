"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  FiUsers,
  FiCheckCircle,
  FiPlay,
  FiPause,
  FiShield,
  FiClock,
  FiTag,
  FiSettings,
  FiInfo,
  FiTrendingDown,
  FiX,
  FiFileText,
  FiTarget,
  FiBox,
  FiPackage,
  FiMaximize2,
  FiTruck,
  FiChevronDown,
  FiArrowRight,
  FiHelpCircle,
} from "react-icons/fi";
import { GiCarDoor } from "react-icons/gi";
import { BsFuelPump } from "react-icons/bs";
import { useAuth } from "@/context/AuthContext";
import {
  ReservationPanelPortal,
  type Category as BookingCategory,
} from "@/components/global/vanListingBackup";
import { categoryNameToSlug } from "@/lib/category-slug";
import type { CategoryDetail } from "@/lib/category-detail";
import { getVanSeoContent, type VanSeoBlock } from "@/lib/vanSeo";
import { getVanDetailFaqs } from "@/lib/vanFaq";
import FAQComponent from "@/components/static/fAQSection";

interface VanDetailPageProps {
  category: CategoryDetail;
}

const gearLabel = (gear: string) =>
  gear.charAt(0).toUpperCase() + gear.slice(1);

/* ------------------------------------------------------------------ */
/*  Spec grouping — turns flat keys like                               */
/*  "Loading space Length on the ground [in]" into grouped cards       */
/* ------------------------------------------------------------------ */

const SPEC_TABLES = [
  {
    id: "dimensions",
    title: "Dimensions",
    description: "Overall exterior measurements and vehicle size.",
    icon: <FiMaximize2 />,
    match: [
      "external",
      "overall",
      "vehicle measurement",
      "vehicle measurements",
      "length",
      "width with mirrors",
      "width without mirrors",
      "height",
      "wheelbase",
    ],
  },
  {
    id: "load-access",
    title: "Load & Access",
    description: "Cargo, luggage, internal space and door entry details.",
    icon: <FiPackage />,
    match: [
      "cargo",
      "load",
      "loading space",
      "luggage",
      "internal",
      "side door",
      "rear door",
      "wheelarches",
      "between wheel arches",
      "between wheelarches",
      "entry",
    ],
  },
  {
    id: "capacity",
    title: "Capacity & Requirements",
    description: "Payload, operating weight, turning circle and licence notes.",
    icon: <FiTruck />,
    match: [
      "capacity",
      "payload",
      "weight",
      "gross",
      "turning",
      "licence",
      "license",
      "operating",
    ],
  },
] as const;

interface SpecRow {
  label: string;
  value: string;
  unit?: string;
}

interface SpecTable {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  rows: SpecRow[];
}

const cleanSpecLabel = (label: string) =>
  label
    .replace(/\s+/g, " ")
    .replace(/\s*:\s*$/, "")
    .trim();

function parseSpec(
  key: string,
  value: string,
): { tableId: string; row: SpecRow } {
  const normalizedKey = cleanSpecLabel(key);
  const lowerKey = normalizedKey.toLowerCase();
  const table =
    SPEC_TABLES.find((table) =>
      table.match.some((term) => lowerKey.includes(term)),
    ) || SPEC_TABLES[0];

  let label = normalizedKey
    .replace(/^vehicle measurements?\s+/i, "")
    .replace(/^loading space\s+/i, "")
    .replace(/^cargo space\s+/i, "Cargo ")
    .replace(/^capacity\s+/i, "");

  // Pull "[in]" / "[lb]" style units out of the label
  const unitMatch = label.match(/\[([^\]]+)\]\s*$/);
  const unit = unitMatch ? unitMatch[1] : undefined;
  if (unitMatch) label = label.replace(/\[([^\]]+)\]\s*$/, "").trim();

  return {
    tableId: table.id,
    row: { label: cleanSpecLabel(label), value: value.trim(), unit },
  };
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export default function VanDetailPage({ category }: VanDetailPageProps) {
  const { setUser } = useAuth();
  const [showBooking, setShowBooking] = useState(false);

  const typeName =
    typeof category.type === "object" ? category.type?.name : undefined;
  const categorySlug = categoryNameToSlug(category.name);

  /* ---------- Derived pricing data ---------- */

  const tiers = useMemo(
    () =>
      [...(category.pricingTiers || [])].sort((a, b) => a.minDays - b.minDays),
    [category.pricingTiers],
  );

  const fromPrice = useMemo(() => {
    if (tiers.length === 0) return category.showPrice;
    return Math.min(category.showPrice, ...tiers.map((t) => t.pricePerDay));
  }, [tiers, category.showPrice]);

  const bestTierPrice = useMemo(
    () => (tiers.length ? Math.min(...tiers.map((t) => t.pricePerDay)) : null),
    [tiers],
  );

  const maxSavingsPct = useMemo(() => {
    if (!tiers.length || category.showPrice <= 0) return 0;
    const cheapest = Math.min(...tiers.map((t) => t.pricePerDay));
    return Math.max(0, Math.round((1 - cheapest / category.showPrice) * 100));
  }, [tiers, category.showPrice]);

  const savingsFor = (pricePerDay: number) =>
    category.showPrice > 0
      ? Math.max(0, Math.round((1 - pricePerDay / category.showPrice) * 100))
      : 0;

  /* ---------- Grouped specifications ---------- */

  const specGroups = useMemo(() => {
    const rowsByTable = new Map<string, SpecRow[]>(
      SPEC_TABLES.map((table) => [table.id, []]),
    );

    (category.properties || []).forEach((p) => {
      if (!p.key?.trim() || !p.value?.trim()) return;
      const { tableId, row } = parseSpec(p.key, p.value);
      rowsByTable.get(tableId)?.push(row);
    });

    return SPEC_TABLES.map((table) => ({
      id: table.id,
      title: table.title,
      description: table.description,
      icon: table.icon,
      rows: rowsByTable.get(table.id) || [],
    })).filter((table) => table.rows.length > 0) satisfies SpecTable[];
  }, [category.properties]);

  const specOverview = useMemo(
    () => [
      {
        label: "Seats",
        value: String(category.seats),
        icon: <FiUsers />,
      },
      {
        label: "Doors",
        value: String(category.doors),
        icon: <GiCarDoor />,
      },
      {
        label: "Fuel",
        value: category.fuel,
        icon: <BsFuelPump />,
      },
      {
        label: "Gearbox",
        value: category.gear.availableTypes.map(gearLabel).join(" / "),
        icon: <FiSettings />,
      },
      {
        label: "Licence",
        value: category.requiredLicense,
        icon: <FiShield />,
      },
    ],
    [
      category.doors,
      category.fuel,
      category.gear.availableTypes,
      category.requiredLicense,
      category.seats,
    ],
  );

  const bookingVan = category as unknown as BookingCategory;
  const openBooking = () => setShowBooking(true);

  const seoBlocks = useMemo(() => getVanSeoContent(category), [category]);

  const faqs = useMemo(() => getVanDetailFaqs(category), [category]);

  const sections = [
    (seoBlocks || category.description) && {
      id: "overview",
      label: "Overview",
      icon: <FiFileText />,
    },
    category.purpose && {
      id: "ideal-for",
      label: "Ideal For",
      icon: <FiTarget />,
    },
    specGroups.length && {
      id: "specs",
      label: "Specifications",
      icon: <FiBox />,
    },
    tiers.length && { id: "pricing", label: "Pricing", icon: <FiTag /> },
    category.rules?.length && {
      id: "requirements",
      label: "Requirements",
      icon: <FiShield />,
    },
    faqs?.length && { id: "faq", label: "FAQ", icon: <FiHelpCircle /> },
  ].filter(Boolean) as { id: string; label: string; icon: React.ReactNode }[];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0f172b]">
      {/* Local keyframes for the CTA shine — disabled for reduced motion */}
      <style>{`
        @keyframes vdp-shine {
          0% { transform: translateX(-150%) skewX(-20deg); }
          60%, 100% { transform: translateX(250%) skewX(-20deg); }
        }
        .vdp-shine::after {
          content: "";
          position: absolute;
          top: 0; bottom: 0; left: 0; width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
          animation: vdp-shine 3.2s ease-in-out infinite;
          pointer-events: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .vdp-shine::after { animation: none; display: none; }
        }
      `}</style>

      {/* ============================ Hero ============================ */}
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6 sm:pb-14 sm:pt-32 lg:px-8 lg:pb-16 lg:pt-36">
        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-5 lg:gap-10 xl:gap-12">
          {/* ---------- Gallery / video ---------- */}
          <div className="lg:col-span-3">
            <MediaGallery
              image={category.image}
              video={category.video}
              name={category.name}
              typeName={typeName}
              savingsPct={maxSavingsPct}
            />

            {/* Key spec stat cards */}
            <div className="mt-5 grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-5">
              <StatCard
                icon={<FiUsers />}
                label="Seats"
                value={String(category.seats)}
              />
              <StatCard
                icon={<GiCarDoor />}
                label="Doors"
                value={String(category.doors)}
              />
              <StatCard
                icon={<BsFuelPump />}
                label="Fuel"
                value={category.fuel}
              />
              <StatCard
                icon={<FiSettings />}
                label="Gearbox"
                value={category.gear.availableTypes.map(gearLabel).join(" / ")}
              />
              <StatCard
                icon={<FiShield />}
                label="Licence"
                value={category.requiredLicense}
                className="col-span-2 sm:col-span-1"
              />
            </div>
          </div>

          {/* ---------- Buy box ---------- */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-sm sm:p-6 lg:sticky lg:top-28 lg:p-7">
              <h1 className="text-3xl font-black leading-tight text-white md:text-4xl">
                {category.name}
              </h1>
              {category.expert && (
                <p className="text-gray-400 mt-2 leading-relaxed">
                  {category.expert}
                </p>
              )}

              {/* Price block */}
              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  From
                </p>
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-4xl md:text-5xl font-black text-[#37cf6f]">
                    £{fromPrice}
                  </span>
                  <span className="text-gray-400">/ day</span>
                  {fromPrice < category.showPrice && (
                    <span className="text-gray-500 line-through text-lg">
                      £{category.showPrice}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {maxSavingsPct > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#37cf6f]/15 text-[#37cf6f] text-xs font-bold">
                      <FiTrendingDown className="w-3.5 h-3.5" />
                      Up to {maxSavingsPct}% off longer hires
                    </span>
                  )}
                  {typeof category.selloffer === "number" &&
                    category.selloffer > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#fe9a00]/15 text-[#fe9a00] text-xs font-bold">
                        <FiTag className="w-3.5 h-3.5" />
                        Special offer applied at checkout
                      </span>
                    )}
                </div>

                {tiers.length > 0 && (
                  <a
                    href="#pricing"
                    className="mt-4 inline-flex items-center gap-1 rounded text-xs text-gray-400 transition-colors hover:text-[#fe9a00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe9a00]"
                  >
                    <FiInfo className="w-3.5 h-3.5" />
                    Price varies by rental length — see full pricing
                  </a>
                )}
              </div>

              {/* CTA */}
              <BookButton
                id={`gtm-van-detail-book-${categorySlug}`}
                onClick={openBooking}
                className="mt-6 w-full py-4 text-base sm:text-lg"
              >
                Book Now — from £{fromPrice}/day
              </BookButton>

              {/* Reassurance — real facts pulled from the data */}
              <ul className="mt-5 space-y-3">
                <Reassurance icon={<FiClock />}>
                  Free cancellation up to 48 hours before pickup
                </Reassurance>
                <Reassurance icon={<FiShield />}>
                  {category.requiredLicense} licence is all you need
                </Reassurance>
                {category.extrahoursRate > 0 && (
                  <Reassurance icon={<FiTag />}>
                    Running late? Extra hours from £{category.extrahoursRate}
                  </Reassurance>
                )}
                {category.gear.automaticExtraCost > 0 && (
                  <Reassurance icon={<FiSettings />}>
                    Automatic gearbox available for +£
                    {category.gear.automaticExtraCost}/day
                  </Reassurance>
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ Section nav ============================ */}
      {sections.length > 1 && (
        <div className="sticky top-16 z-30 border-y border-white/10 bg-[#0f172b]/92 shadow-lg shadow-black/10 backdrop-blur-md md:top-20">
          <nav
            aria-label="Page sections"
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <div className="flex gap-1.5 overflow-x-auto py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-gray-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe9a00]"
                >
                  <span className="text-[#fe9a00]" aria-hidden>
                    {s.icon}
                  </span>
                  {s.label}
                </a>
              ))}
            </div>
          </nav>
        </div>
      )}

      {/* ============================ Overview ============================ */}
      {(seoBlocks || category.description) && (
        <section
          id="overview"
          className="mx-auto max-w-7xl scroll-mt-32 px-4 py-10 sm:px-6 md:py-12 lg:px-8 lg:py-14"
        >
          <SectionHeading icon={<FiFileText />}>Overview</SectionHeading>
          <div className="max-w-4xl">
            {seoBlocks ? (
              <VanSeoContent blocks={seoBlocks} />
            ) : (
              <ExpandableText text={category.description!} />
            )}
          </div>
        </section>
      )}

      {/* ============================ Ideal For ============================ */}
      {category.purpose && (
        <section
          id="ideal-for"
          className="mx-auto max-w-7xl scroll-mt-32 px-4 py-10 sm:px-6 md:py-12 lg:px-8 lg:py-14"
        >
          <SectionHeading icon={<FiTarget />}>Ideal For</SectionHeading>
          <div className="max-w-4xl">
            <ExpandableText text={category.purpose} collapsedHeight={160} />
          </div>
        </section>
      )}

      {/* ============================ Specifications ============================ */}
      {specGroups.length > 0 && (
        <section
          id="specs"
          className="mx-auto max-w-7xl scroll-mt-32 px-4 py-10 sm:px-6 md:py-12 lg:px-8 lg:py-14"
        >
          <SectionHeading
            icon={<FiBox />}
            subtitle={`Full technical details for the ${category.name}`}
          >
            Specifications
          </SectionHeading>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.035] p-3 sm:grid-cols-3 lg:grid-cols-5">
              {specOverview.map((item) => (
                <div
                  key={item.label}
                  className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white/[0.06] bg-[#0f172b]/70 px-3 py-3.5"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fe9a00]/12 text-[#fe9a00]"
                    aria-hidden
                  >
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      {item.label}
                    </p>
                    <p className="truncate text-sm font-bold capitalize text-white">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3 xl:gap-5">
              {specGroups.map((table) => (
                <div
                  key={table.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-lg shadow-black/5"
                >
                  <div className="border-b border-white/10 bg-white/[0.04] px-4 py-[18px]">
                    <div className="flex items-start gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fe9a00]/12 text-[#fe9a00] ring-1 ring-[#fe9a00]/20"
                        aria-hidden
                      >
                        {table.icon}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black uppercase tracking-wide text-white">
                          {table.title}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">
                          {table.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[320px] text-left">
                      <thead>
                        <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-gray-500">
                          <th scope="col" className="px-4 py-3 font-bold">
                            Detail
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-right font-bold"
                          >
                            Measurement
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.055]">
                        {table.rows.map((row, i) => (
                          <tr
                            key={`${table.id}-${row.label}-${i}`}
                            className="transition-colors hover:bg-white/[0.025]"
                          >
                            <th
                              scope="row"
                              className="w-[48%] px-4 py-3.5 text-xs font-medium leading-snug text-gray-400"
                            >
                              {row.label}
                            </th>
                            <td className="px-4 py-3.5 text-right text-xs font-bold leading-snug text-white sm:text-sm">
                              <span className="break-words">{row.value}</span>
                              {row.unit && (
                                <span className="ml-1 text-xs font-normal text-gray-500">
                                  {row.unit}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================ Pricing ============================ */}
      {tiers.length > 0 && (
        <section
          id="pricing"
          className="mx-auto max-w-7xl scroll-mt-32 px-4 py-10 sm:px-6 md:py-12 lg:px-8 lg:py-14"
        >
          <SectionHeading
            icon={<FiTag />}
            subtitle="The longer you hire, the less you pay per day"
          >
            Pricing
          </SectionHeading>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left min-w-[480px]">
              <thead>
                <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                  <th scope="col" className="px-4 md:px-5 py-3.5 font-semibold">
                    Rental Length
                  </th>
                  <th scope="col" className="px-4 md:px-5 py-3.5 font-semibold">
                    Price / Day
                  </th>
                  <th
                    scope="col"
                    className="px-4 md:px-5 py-3.5 font-semibold text-right"
                  >
                    You Save
                  </th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier, index) => {
                  const saving = savingsFor(tier.pricePerDay);
                  const isBest =
                    bestTierPrice !== null &&
                    tier.pricePerDay === bestTierPrice &&
                    saving > 0;
                  return (
                    <tr
                      key={index}
                      className={`border-t border-white/10 ${
                        isBest ? "bg-[#37cf6f]/5" : ""
                      }`}
                    >
                      <td className="px-4 md:px-5 py-3.5 text-white">
                        <span className="flex items-center gap-2 flex-wrap">
                          {tier.minDays === tier.maxDays
                            ? `${tier.minDays} day${tier.minDays > 1 ? "s" : ""}`
                            : `${tier.minDays} – ${tier.maxDays} days`}
                          {isBest && (
                            <span className="px-2 py-0.5 rounded-full bg-[#37cf6f] text-[#0f172b] text-[10px] font-black uppercase tracking-wide">
                              Best value
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 md:px-5 py-3.5 text-[#37cf6f] font-bold whitespace-nowrap">
                        £{tier.pricePerDay}
                      </td>
                      <td className="px-4 md:px-5 py-3.5 text-right whitespace-nowrap">
                        {saving > 0 ? (
                          <span className="text-[#37cf6f] font-semibold text-sm">
                            −{saving}%
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Additional charges */}
          {(category.extrahoursRate > 0 ||
            category.gear.automaticExtraCost > 0) && (
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {category.extrahoursRate > 0 && (
                <div className="flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5">
                  <span className="flex items-center gap-2.5 text-gray-300">
                    <FiClock className="w-4 h-4 text-[#fe9a00] shrink-0" />
                    Extra hour
                  </span>
                  <span className="text-white font-bold whitespace-nowrap">
                    £{category.extrahoursRate}
                  </span>
                </div>
              )}
              {category.gear.automaticExtraCost > 0 && (
                <div className="flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5">
                  <span className="flex items-center gap-2.5 text-gray-300">
                    <FiSettings className="w-4 h-4 text-[#fe9a00] shrink-0" />
                    Automatic gearbox upgrade
                  </span>
                  <span className="text-white font-bold whitespace-nowrap">
                    +£{category.gear.automaticExtraCost}/day
                  </span>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ============================ Rules & Requirements ============================ */}
      {category.rules && category.rules.length > 0 && (
        <section
          id="requirements"
          className="mx-auto max-w-7xl scroll-mt-32 px-4 py-10 sm:px-6 md:py-12 lg:px-8 lg:py-14"
        >
          <SectionHeading
            icon={<FiShield />}
            subtitle="What you need to hire this van"
          >
            Rules &amp; Requirements
          </SectionHeading>
          <ul className="grid md:grid-cols-2 gap-3">
            {category.rules.map((rule, index) => (
              <li
                key={index}
                className="flex gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5"
              >
                <FiCheckCircle className="w-5 h-5 text-[#fe9a00] shrink-0 mt-0.5" />
                <span className="text-gray-300 leading-relaxed">
                  {rule.key && (
                    <span className="text-white font-semibold">
                      {rule.key}{" "}
                    </span>
                  )}
                  {rule.value}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ============================ FAQ ============================ */}
      {faqs && faqs.length > 0 && (
        <div id="faq" className="scroll-mt-32">
          <FAQComponent
            title="Frequently Asked Questions"
            subtitle={`Everything you need to know about hiring the ${category.name}`}
            faqs={faqs}
          />
        </div>
      )}

      {/* ============================ Bottom CTA band ============================ */}
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 md:pb-24 md:pt-10 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-[#fe9a00]/25 bg-gradient-to-br from-[#fe9a00]/15 to-transparent p-6 text-center sm:p-8 md:p-10">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
            Ready to hire the {category.name}?
          </h2>
          <p className="text-gray-400 mb-6">
            From{" "}
            <span className="text-[#37cf6f] font-bold">£{fromPrice}/day</span> —
            free cancellation up to 48 hours before pickup.
          </p>
          <BookButton onClick={openBooking} className="px-10 py-4 text-lg">
            Book Now <FiArrowRight className="w-5 h-5" />
          </BookButton>
        </div>
      </section>

      {/* ============================ Mobile sticky CTA ============================ */}
      <div className="lg:hidden fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-3 right-24 z-40 bg-[#0f172b]/60 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-4 shadow-2xl">
        <div className="min-w-0">
          <p className="text-[11px] text-gray-400 truncate">
            {category.name} · from
          </p>
          <p className="text-xl font-black text-[#37cf6f] leading-tight">
            £{fromPrice}
            <span className="text-xs text-gray-400 font-normal">/day</span>
          </p>
        </div>
        <BookButton onClick={openBooking} className="flex-1 py-2">
          Book
        </BookButton>
      </div>
      <div className="lg:hidden h-24" aria-hidden />

      {showBooking && (
        <ReservationPanelPortal
          van={bookingVan}
          onClose={() => setShowBooking(false)}
          setUser={setUser}
        />
      )}
    </main>
  );
}

/* ================================================================== */
/*  Media gallery with a custom minimal video player                  */
/* ================================================================== */

function MediaGallery({
  image,
  video,
  name,
  typeName,
  savingsPct,
}: {
  image: string;
  video?: string;
  name: string;
  typeName?: string;
  savingsPct: number;
}) {
  const [mode, setMode] = useState<"image" | "video">("image");

  return (
    <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:aspect-16/10">
      {mode === "video" && video ? (
        <MiniPlayer src={video} onClose={() => setMode("image")} />
      ) : (
        <>
          <Image
            src={image}
            alt={`${name}${typeName ? ` — ${typeName}` : ""}`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover"
          />

          {typeName && (
            <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-[#0f172b]/80 backdrop-blur-sm border border-white/20 text-white text-xs font-bold uppercase tracking-wide">
              {typeName}
            </span>
          )}

          {savingsPct > 0 && (
            <span className="absolute top-4 right-4 px-1 md:px-2 py-1 rounded-full bg-[#37cf6f] text-[#0f172b] text-[10px] font-black uppercase tracking-wide flex items-center gap-1">
              <FiTrendingDown className="w-3.5 h-3.5" />
              Save up to {savingsPct}%
            </span>
          )}

          {video && (
            <button
              type="button"
              onClick={() => setMode("video")}
              id="gtm-van-detail-play-video"
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#fe9a00]"
              aria-label={`Play ${name} video tour`}
            >
              <span className="flex flex-col items-center gap-2">
                <span className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#fe9a00] flex items-center justify-center shadow-lg shadow-black/40 group-hover:scale-110 transition-transform">
                  <FiPlay className="w-6 h-6 md:w-7 md:h-7 text-white ml-1" />
                </span>
              </span>
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Minimal custom player: tap to play/pause, slim seek bar,
              mute + close. No native chrome. ---------- */

const fmt = (s: number) => {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

function MiniPlayer({ src, onClose }: { src: string; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0..1
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      setCurrent(v.currentTime);
      setProgress(v.duration ? v.currentTime / v.duration : 0);
    };
    const onMeta = () => setDuration(v.duration || 0);
    const onEnded = () => setPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("ended", onEnded);
    };
  }, []);

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const next = (Number(e.target.value) / 1000) * v.duration;
    v.currentTime = next;
    setProgress(next / v.duration);
    setCurrent(next);
  };

  return (
    <div className="absolute inset-0 bg-black">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover cursor-pointer"
        autoPlay
        playsInline
        onClick={togglePlay}
      />

      {/* Center play indicator when paused */}
      {!playing && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play video"
          className="absolute inset-0 flex items-center justify-center bg-black/30 focus-visible:outline-none"
        >
          <span className="w-16 h-16 rounded-full bg-[#fe9a00] flex items-center justify-center shadow-lg">
            <FiPlay className="w-6 h-6 text-white ml-1" />
          </span>
        </button>
      )}

      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close video"
        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe9a00]"
      >
        <FiX className="w-4 h-4" />
      </button>

      {/* Bottom control bar */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pt-8 pb-3">
        {/* Seek bar */}
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(progress * 1000)}
          onChange={seek}
          aria-label="Seek"
          className="w-full h-1 appearance-none cursor-pointer rounded-full bg-white/25
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#fe9a00]
            [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#fe9a00]"
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="text-white hover:text-[#fe9a00] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe9a00] rounded"
          >
            {playing ? (
              <FiPause className="w-5 h-5" />
            ) : (
              <FiPlay className="w-5 h-5" />
            )}
          </button>

          <span className="ml-auto text-xs text-gray-300 tabular-nums">
            {fmt(current)} / {fmt(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Expandable long text — gradient fade + Read more                  */
/* ================================================================== */

function ExpandableText({
  text,
  collapsedHeight = 208, // px ≈ 8 lines
}: {
  text: string;
  collapsedHeight?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollHeight > collapsedHeight + 24);
    check();
    // Re-check on resize (line wrapping changes)
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [collapsedHeight, text]);

  const clamped = overflows && !expanded;

  return (
    <div>
      <div
        className="relative overflow-hidden"
        style={{ maxHeight: clamped ? collapsedHeight : undefined }}
      >
        <div
          ref={innerRef}
          className="text-gray-300 leading-relaxed whitespace-pre-line"
        >
          {text}
        </div>

        {/* Gradient fade over the last lines */}
        {clamped && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0f172b] to-transparent"
            aria-hidden
          />
        )}
      </div>

      {overflows && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/15 bg-white/5 text-sm font-semibold text-white hover:border-[#fe9a00]/60 hover:text-[#fe9a00] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe9a00]"
        >
          {expanded ? "Show less" : "Read more"}
          <FiChevronDown
            className={`w-4 h-4 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
      )}
    </div>
  );
}

/* ================================================================== */
/*  SEO overview content — renders the hand-authored blocks from       */
/*  lib/vanSeo.ts with an icon per heading and per spec-list item      */
/*  (matched by its label/id) instead of raw HTML.                     */
/* ================================================================== */

function seoHeadingIcon(text: string): React.ReactNode {
  const t = text.toLowerCase();
  if (t.includes("price")) return <FiTag />;
  if (
    t.includes("ideal") ||
    t.includes("best uses") ||
    t.includes("best for") ||
    t.includes("what can you use") ||
    t.includes("what is")
  )
    return <FiTarget />;
  if (t.includes("why")) return <FiCheckCircle />;
  if (t.includes("who is")) return <FiUsers />;
  return <FiInfo />;
}

function seoListIcon(label?: string): React.ReactNode {
  const l = (label || "").toLowerCase();
  if (l.includes("seat")) return <FiUsers />;
  if (l.includes("load volume")) return <FiPackage />;
  if (l.includes("payload")) return <FiTruck />;
  if (l.includes("fuel")) return <BsFuelPump />;
  if (l.includes("licence") || l.includes("license")) return <FiShield />;
  if (l.includes("special feature")) return <FiSettings />;
  if (l.includes("vehicle type")) return <FiBox />;
  if (l.includes("best for")) return <FiTarget />;
  if (l.includes("load bed")) return <FiMaximize2 />;
  return <FiCheckCircle />;
}

function VanSeoContent({ blocks }: { blocks: VanSeoBlock[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        if (block.type === "h2") {
          return (
            <h3
              key={index}
              className="text-lg font-bold leading-snug text-white md:text-xl"
            >
              {block.text}
            </h3>
          );
        }

        if (block.type === "p") {
          return (
            <p key={index} className="max-w-3xl leading-relaxed text-gray-300">
              {block.text}
            </p>
          );
        }

        if (block.type === "h3") {
          return (
            <div key={index} className="flex items-center gap-2.5 pt-3">
              <span
                className="w-8 h-8 rounded-lg bg-[#fe9a00]/15 border border-[#fe9a00]/25 flex items-center justify-center text-[#fe9a00] text-sm shrink-0"
                aria-hidden
              >
                {seoHeadingIcon(block.text || "")}
              </span>
              <h4 className="text-base font-bold text-white md:text-lg">
                {block.text}
              </h4>
            </div>
          );
        }

        if (block.type === "list") {
          return (
            <div key={index} className="grid gap-3 sm:grid-cols-2">
              {(block.items || []).map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                >
                  <span className="text-[#fe9a00] mt-0.5 shrink-0" aria-hidden>
                    {seoListIcon(item.label)}
                  </span>
                  <span className="text-gray-300 text-sm leading-relaxed">
                    {item.label && (
                      <span className="text-white font-semibold">
                        {item.label}:{" "}
                      </span>
                    )}
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

/* ================================================================== */
/*  Small building blocks                                              */
/* ================================================================== */

function BookButton({
  children,
  onClick,
  id,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  id?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      className={`vdp-shine relative overflow-hidden inline-flex items-center justify-center gap-2
        bg-[#fe9a00] hover:bg-orange-600 text-white font-bold rounded-xl
        transition-all duration-300 hover:scale-[1.02] active:scale-95
        shadow-lg shadow-[#fe9a00]/20
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        focus-visible:ring-offset-[#0f172b] focus-visible:ring-[#fe9a00] ${className}`}
    >
      {children}
    </button>
  );
}

function StatCard({
  icon,
  label,
  value,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-[94px] flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.045] px-2 py-3 text-center ${className}`}
    >
      <span className="text-lg text-[#fe9a00]" aria-hidden>
        {icon}
      </span>
      <span className="line-clamp-2 text-xs font-bold capitalize leading-tight text-white">
        {value}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </span>
    </div>
  );
}

function Reassurance({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-400">
      <span className="mt-0.5 shrink-0 text-[#37cf6f]" aria-hidden>
        {icon}
      </span>
      {children}
    </li>
  );
}

function SectionHeading({
  children,
  subtitle,
  icon,
}: {
  children: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-7 md:mb-8">
      <div className="flex items-center gap-3">
        {icon && (
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#fe9a00]/25 bg-[#fe9a00]/15 text-lg text-[#fe9a00]"
            aria-hidden
          >
            {icon}
          </span>
        )}
        <h2 className="text-2xl font-black leading-tight text-white md:text-3xl">
          {children}
        </h2>
        <span
          className="hidden h-px flex-1 bg-gradient-to-r from-white/15 to-transparent sm:block"
          aria-hidden
        />
      </div>
      {subtitle && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 sm:ml-[52px]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
