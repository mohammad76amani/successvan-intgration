"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiBell,
  FiCalendar,
  FiClock,
  FiClipboard,
  FiChevronDown,
  FiExternalLink,
  FiHome,
  FiMapPin,
  FiMessageSquare,
  FiUpload,
  FiTruck,
  FiUser,
  FiX,
} from "react-icons/fi";
import { showToast } from "@/lib/toast";
import type { Category, Reservation, Vehicle } from "@/types/type";
import type { SafeContractSummary } from "@/lib/docusign/types";
import { buildReservationJourney } from "@/lib/reservation-journey";
import {
  statusBadgeClasses,
  type ReservationStatus,
} from "@/lib/reservation-status";
import JourneyTracker from "./JourneyTracker";
import NextActionCard from "./NextActionCard";
import RefundCountdown from "./RefundCountdown";
import JourneyAccordions, {
  authHeaders,
  type JourneySectionId,
} from "./JourneyAccordions";
import CustomerReservationEditModal from "../CustomerReservationEditModal";

const SECTION_IDS: JourneySectionId[] = [
  "summary",
  "documents",
  "deposit",
  "contract",
  "collection",
  "handover",
  "inspection",
  "refund",
  "timeline",
];

// The accordion to open by default for each status (action first, summary
// otherwise).
const DEFAULT_SECTION: Partial<Record<ReservationStatus, JourneySectionId>> = {
  confirmed: "deposit",
  deposit_pending: "deposit",
  contract_pending: "contract",
  ready_for_collection: "collection",
  handover_in_progress: "collection",
  delivered: "collection",
  vehicle_returned: "inspection",
  return_inspection: "inspection",
  deposit_review: "refund",
  refund_processing: "refund",
  refund_completed: "refund",
};

const panelNavItems = [
  {
    href: "/customerDashboard#reserves",
    label: "My Reservations",
    icon: <FiClipboard />,
  },
  { href: "/customerDashboard#profile", label: "Profile", icon: <FiUser /> },
  {
    href: "/customerDashboard#support",
    label: "Support",
    icon: <FiMessageSquare />,
  },
];

const mobileNavItems = [
  { href: "/", label: "Home", icon: <FiHome /> },
  {
    href: "/customerDashboard#reserves",
    label: "Booking",
    icon: <FiClipboard />,
  },
  {
    href: "/customerDashboard#support",
    label: "Support",
    icon: <FiMessageSquare />,
  },
  { href: "/customerDashboard#profile", label: "Profile", icon: <FiUser /> },
];

const normalizeSectionId = (id: string): JourneySectionId => {
  if (id === "return") return "collection";
  return (SECTION_IDS as string[]).includes(id)
    ? (id as JourneySectionId)
    : "summary";
};

const getLicenceStateFromStorage = () => {
  if (typeof window === "undefined") return { front: false, back: false };
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return {
      front: Boolean(user?.licenceAttached?.front),
      back: Boolean(user?.licenceAttached?.back),
    };
  } catch {
    return { front: false, back: false };
  }
};

function DateMeta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-[#fe9a00]">{icon}</span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="text-sm font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

const textOrDash = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

const money = (value: unknown) => {
  const amount = Number(value);
  return `£${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"}`;
};

function ReservationMeta({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0 border-b border-white/[0.07] py-2.5 last:border-b-0 sm:border-b-0 sm:py-1">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-0.5 break-words text-[13px] font-semibold leading-5 text-slate-100">
        {value || "-"}
      </div>
    </div>
  );
}

function getRentalDays(reservation: Reservation) {
  const start = new Date(reservation.startDate).getTime();
  const end = new Date(reservation.endDate).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
    return 1;
  return Math.max(1, Math.ceil((end - start) / 86_400_000));
}

type ReservationAddOnItem = NonNullable<Reservation["addOns"]>[number];

function getAddOnAmount(item: ReservationAddOnItem, rentalDays: number) {
  const quantity = Math.max(1, Number(item?.quantity) || 1);
  const addOn = typeof item?.addOn === "object" ? item.addOn : undefined;
  if (!addOn) return null;

  if (addOn.pricingType === "flat") {
    const amount =
      typeof addOn.flatPrice === "number"
        ? addOn.flatPrice
        : Number(addOn.flatPrice?.amount);
    if (!Number.isFinite(amount)) return null;
    const days =
      typeof addOn.flatPrice === "object" && addOn.flatPrice?.isPerDay
        ? rentalDays
        : 1;
    return amount * quantity * days;
  }

  const tiers = addOn.tieredPrice?.tiers || addOn.tiers || [];
  const selectedIndex = Number(item.selectedTierIndex);
  const tier = Number.isInteger(selectedIndex)
    ? tiers[selectedIndex]
    : tiers.find(
        (candidate) =>
          rentalDays >= Number(candidate.minDays) &&
          rentalDays <= Number(candidate.maxDays),
      ) || tiers[tiers.length - 1];
  const days = addOn.tieredPrice?.isPerDay ? rentalDays : 1;
  return tier && Number.isFinite(Number(tier.price))
    ? Number(tier.price) * quantity * days
    : null;
}

export default function ReservationJourneyPage({
  reservationId,
  embedded = false,
  initialSection,
  onClose,
}: {
  reservationId: string;
  embedded?: boolean;
  initialSection?: string;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [contract, setContract] = useState<SafeContractSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [openSection, setOpenSection] = useState<JourneySectionId | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [signBusy, setSignBusy] = useState(false);
  const [licence, setLicence] = useState(getLicenceStateFromStorage);

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const userRaw = localStorage.getItem("user");
        const userId = userRaw ? JSON.parse(userRaw)?._id : null;
        if (!userId) {
          router.replace("/login");
          return;
        }

        const res = await fetch(
          `/api/customer/reservations/${reservationId}/journey`,
          { headers: authHeaders(), signal },
        );
        const json = await res.json();
        if (signal?.aborted) return;
        const data: Reservation | undefined = json.data?.reservation;
        if (!json.success || !data) {
          setNotFound(true);
          return;
        }
        setReservation(data);
        setContract(json.data.contract || null);
      } catch (error) {
        if (signal?.aborted || (error as Error).name === "AbortError") return;
        console.log("Failed to load reservation:", error);
        setNotFound(true);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [reservationId, router],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const journey = reservation
    ? buildReservationJourney(reservation, contract)
    : null;
  const licenceComplete = licence.front && licence.back;
  const trackerSteps =
    journey && !licenceComplete
      ? [
          journey.steps[0],
          {
            key: "licence",
            label: "Licence",
            state: "blocked" as const,
            description: "Upload both sides of your driving licence.",
          },
          ...journey.steps.slice(1),
        ]
      : (journey?.steps ?? []);

  // Open the most relevant accordion once data is loaded.
  useEffect(() => {
    if (!journey) return;
    setOpenSection((prev) => {
      if (prev) return prev;
      if (initialSection) return normalizeSectionId(initialSection);
      const fromHash = embedded ? "" : window.location.hash.slice(1);
      if (fromHash) return normalizeSectionId(fromHash);
      const defaultSection = DEFAULT_SECTION[journey.mainStatus] ?? "summary";
      return reservation?.deposit?.option === "office" &&
        defaultSection === "deposit"
        ? "summary"
        : defaultSection;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    journey?.mainStatus,
    initialSection,
    embedded,
    reservation?.deposit?.option,
  ]);

  useEffect(() => {
    if (
      reservation?.deposit?.option === "office" &&
      openSection === "deposit"
    ) {
      setOpenSection("summary");
    }
  }, [reservation?.deposit?.option, openSection]);

  const openAndScroll = (sectionId: string) => {
    const id = normalizeSectionId(sectionId);
    setOpenSection(id);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleToggle = (id: JourneySectionId) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const handleLicenceUpdated = () => {
    setLicence(getLicenceStateFromStorage());
    fetchData();
  };

  const handleSignContract = async () => {
    if (!contract) return;
    setSignBusy(true);
    try {
      const res = await fetch(`/api/contracts/${contract._id}/signing-url`, {
        method: "POST",
        headers: authHeaders(),
      });
      const payload = await res.json();
      if (!payload.success) throw new Error(payload.error || "Request failed");
      window.location.href = payload.data.url;
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Could not start signing",
      );
      setSignBusy(false);
    }
  };

  const handleDownloadContract = async (
    kind: "source" | "signed" | "certificate",
  ) => {
    if (!contract) return;
    try {
      const res = await fetch(
        `/api/contracts/${contract._id}/document?type=${kind}`,
        { headers: authHeaders() },
      );
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${contract.contractNumber}-${kind}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Could not download document",
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172b] flex items-center justify-center">
        <p className="text-gray-400">Loading booking...</p>
      </div>
    );
  }

  if (notFound || !reservation || !journey) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-4 p-4 ${
          embedded ? "min-h-[360px]" : "min-h-screen bg-[#0f172b]"
        }`}
      >
        <p className="text-white font-bold text-lg">Booking not found</p>
        {embedded ? (
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        ) : (
          <Link
            href="/customerDashboard#reserves"
            className="px-5 py-2.5 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg font-semibold transition-colors"
          >
            Back to My Reservations
          </Link>
        )}
      </div>
    );
  }

  const customerName = [reservation.user?.name, reservation.user?.lastName]
    .filter(Boolean)
    .join(" ");
  const vehicle = reservation.vehicle as
    (Partial<Pick<Vehicle, "title">> & { name?: string }) | undefined;
  const category = reservation.category as
    Partial<Pick<Category, "name">> | undefined;
  const vehicleLabel = vehicle?.title || vehicle?.name || journey.vehicleName;
  const rentalDays = getRentalDays(reservation);
  const addOnBreakdown = (reservation.addOns || []).map((item) => ({
    label:
      typeof item.addOn === "object" ? item.addOn?.name || "Add-on" : "Add-on",
    quantity: Math.max(1, Number(item.quantity) || 1),
    amount: getAddOnAmount(item, rentalDays),
  }));
  const addOnsTotal = addOnBreakdown.reduce(
    (sum, item) => sum + (item.amount ?? 0),
    0,
  );
  const pickupExtension = Number(reservation.pickupExtensionPrice) || 0;
  const returnExtension = Number(reservation.returnExtensionPrice) || 0;
  const finalTotal = Number(reservation.totalPrice) || 0;
  const depositDiscountPercent =
    reservation.deposit?.option === "full"
      ? Number(reservation.deposit.discountPercent) || 0
      : 0;
  const depositDiscountAmount =
    reservation.deposit?.option === "full"
      ? Number(reservation.deposit.discountAmount) || 0
      : 0;
  const rentalBalance = Math.max(
    0,
    finalTotal +
      depositDiscountAmount -
      addOnsTotal -
      pickupExtension -
      returnExtension,
  );

  const journeyContent = (
    <div
      className={
        embedded ? "p-4 sm:p-5" : "mx-auto max-w-6xl p-3 pb-24 sm:p-6 lg:pb-6"
      }
    >
      <div className="space-y-5">
        {/* ── Main reservation card ─────────────────────────── */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl shadow-black/10 backdrop-blur-xl">
          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[180px_minmax(0,1fr)_minmax(240px,310px)] lg:items-start">
            <div className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/20 lg:aspect-[4/3]">
              {journey.vehicleImage ? (
                <Image
                  src={journey.vehicleImage}
                  alt={journey.vehicleName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 180px"
                />
              ) : (
                <FiTruck className="text-gray-500 text-4xl" />
              )}
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClasses(journey.mainStatus)}`}
                >
                  {journey.publicStatusLabel}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white">
                {journey.vehicleName}
              </h2>
              <p className="text-sm font-bold text-gray-400">
                {journey.bookingReference}
              </p>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <DateMeta
                  icon={<FiCalendar />}
                  label="Pickup"
                  value={journey.pickupDateTime}
                />
                <DateMeta
                  icon={<FiCalendar />}
                  label="Return"
                  value={journey.returnDateTime}
                />
                <DateMeta
                  icon={<FiClock />}
                  label="Duration"
                  value={journey.durationLabel}
                />
              </div>
              {journey.collection?.location && (
                <p className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-400">
                  <FiMapPin className="shrink-0 text-[#fe9a00]" />
                  <span className="break-words">
                    {journey.collection.location}
                  </span>
                </p>
              )}
            </div>

            <div className="min-w-0 self-start">
              <NextActionCard
                action={journey.nextAction}
                onSectionLink={openAndScroll}
              />
            </div>
          </div>

          {journey.mainStatus === "refund_processing" &&
            journey.refund?.expectedBy && (
              <RefundCountdown expectedBy={journey.refund.expectedBy} />
            )}

          <div className="border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => handleToggle("summary")}
              aria-expanded={openSection === "summary"}
              aria-controls="reservation-price-details"
              className="group flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-white/[0.035] sm:px-5"
            >
              <span className="min-w-0">
                <span className="block text-xs font-black uppercase tracking-wide text-slate-300 transition-colors group-hover:text-white">
                  Reservation &amp; price details
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Booking information and full price breakdown
                </span>
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-colors group-hover:border-[#fe9a00]/30 group-hover:text-[#fe9a00]">
                <FiChevronDown
                  className={`transition-transform duration-300 ease-out motion-reduce:transition-none ${openSection === "summary" ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </span>
            </button>

            <div
              id="summary"
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
                openSection === "summary"
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div id="reservation-price-details" className="overflow-hidden">
                <div className="grid border-t border-white/[0.08] lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                  <div className="grid px-4 py-3 sm:grid-cols-2 sm:gap-x-5 lg:grid-cols-3 lg:border-r lg:border-white/[0.08] lg:px-5">
                    <ReservationMeta
                      label="Customer"
                      value={textOrDash(customerName)}
                    />
                    <ReservationMeta
                      label="Phone"
                      value={textOrDash(
                        reservation.user?.phoneData?.phoneNumber,
                      )}
                    />
                    <ReservationMeta
                      label="Email"
                      value={textOrDash(
                        reservation.user?.emaildata?.emailAddress,
                      )}
                    />
                    <ReservationMeta
                      label="Office"
                      value={textOrDash(reservation.office?.name)}
                    />
                    <ReservationMeta
                      label="Category"
                      value={textOrDash(category?.name)}
                    />
                    <ReservationMeta
                      label="Vehicle"
                      value={textOrDash(vehicleLabel)}
                    />
                    <ReservationMeta
                      label="Gear"
                      value={textOrDash(reservation.selectedGear)}
                    />
                    <ReservationMeta
                      label="Driver age"
                      value={
                        reservation.driverAge
                          ? `${reservation.driverAge} years`
                          : "-"
                      }
                    />
                    <ReservationMeta
                      label="Booking type"
                      value={textOrDash(reservation.reservationType)}
                    />
                    {reservation.messege && (
                      <div className="sm:col-span-2 lg:col-span-3">
                        <ReservationMeta
                          label="Customer notes"
                          value={reservation.messege}
                        />
                      </div>
                    )}
                  </div>

                  <div className="border-t border-white/[0.08] px-4 py-4 lg:border-t-0 lg:px-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Price calculation
                      </p>
                      {reservation.discountCode && (
                        <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300">
                          Code: {reservation.discountCode}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1.5 text-xs">
                      <div className="flex justify-between gap-4 text-slate-300">
                        <span>Rental balance</span>
                        <span className="font-semibold text-white">
                          {money(rentalBalance)}
                        </span>
                      </div>
                      {addOnBreakdown.map((item, index) => (
                        <div
                          key={`${item.label}-${index}`}
                          className="flex justify-between gap-4 text-slate-400"
                        >
                          <span className="min-w-0 break-words">
                            {item.label} × {item.quantity}
                          </span>
                          <span className="shrink-0">
                            {item.amount === null
                              ? "Price unavailable"
                              : money(item.amount)}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between gap-4 text-slate-300">
                        <span>Add-ons total</span>
                        <span>{money(addOnsTotal)}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-slate-400">
                        <span>Pickup extension</span>
                        <span>{money(pickupExtension)}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-slate-400">
                        <span>Return extension</span>
                        <span>{money(returnExtension)}</span>
                      </div>
                      {depositDiscountPercent > 0 && (
                        <div className="flex justify-between gap-4 text-emerald-300">
                          <span>
                            Full-payment discount ({depositDiscountPercent}%)
                          </span>
                          <span>-{money(depositDiscountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between gap-4 border-t border-white/[0.08] pt-2 text-sm font-black text-white">
                        <span>Final total</span>
                        <span className="text-[#fe9a00]">
                          {reservation.perInvoice && !reservation.totalPrice
                            ? "Per Invoice"
                            : money(finalTotal)}
                        </span>
                      </div>
                    </div>
                    {journey.mainStatus === "pending" && (
                      <button
                        type="button"
                        onClick={() => setIsEditOpen(true)}
                        className="mt-3 inline-flex items-center gap-2 text-xs font-black text-[#fe9a00] transition-colors hover:text-[#e68a00]"
                      >
                        Edit booking
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {!licenceComplete && (
          <div className="rounded-2xl border border-[#fe9a00]/40 bg-[#fe9a00]/10 p-5 shadow-2xl shadow-black/10 backdrop-blur-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-white">
                  Driving licence required
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  Upload the front and back of your driving licence to keep this
                  booking moving.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openAndScroll("documents")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#fe9a00] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#e68a00]"
              >
                <FiUpload />
                Upload Licence
              </button>
            </div>
          </div>
        )}

        <JourneyTracker steps={trackerSteps} />
        <JourneyAccordions
          reservation={reservation}
          journey={journey}
          contract={contract}
          openSection={openSection}
          onSignContract={handleSignContract}
          onDownloadContract={handleDownloadContract}
          onDepositUpdated={fetchData}
          onLicenceUpdated={handleLicenceUpdated}
          signBusy={signBusy}
        />
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="max-h-[90vh] overflow-y-auto bg-[#0f172b]">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#111b33]/95 px-4 py-4 backdrop-blur-xl sm:px-5">
          <div className="min-w-0">
            <h1 className="truncate text-base font-black text-white md:text-xl">
              Track booking
            </h1>
            <p className="text-xs font-bold text-[#fe9a00]">
              {journey.bookingReference}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Close booking tracker"
          >
            <FiX />
          </button>
        </div>
        {journeyContent}
        <CustomerReservationEditModal
          reservation={reservation}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onUpdate={() => {
            setIsEditOpen(false);
            fetchData();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172b]">
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-white/10 bg-[#111b33] lg:flex">
        <div className="border-b border-white/10 p-6">
          <h1 className="text-2xl font-black text-white">
            Success<span className="text-[#fe9a00]">Van</span>
          </h1>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {panelNavItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition-colors ${
                item.label === "My Reservations"
                  ? "bg-[#fe9a00] text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 border-t border-white/10 p-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-lg bg-[#fe9a00] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#e68a00]"
          >
            <FiExternalLink />
            Back to Site
          </Link>
        </div>
      </aside>

      <main className="lg:ml-64">
        {/* Header */}
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#111b33] px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/customerDashboard#reserves"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <FiArrowLeft />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black text-white md:text-xl">
                My Reservation
              </h1>
              <p className="hidden text-xs font-bold text-[#fe9a00] sm:block">
                {journey.bookingReference}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden items-center gap-2 rounded-lg bg-[#fe9a00] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#e68a00] sm:flex"
            >
              <FiExternalLink />
              Back to Site
            </Link>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white lg:hidden"
              aria-label="Notifications"
            >
              <FiBell />
            </button>
          </div>
        </div>

        {journeyContent}

        <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-white/10 bg-[#111b33]/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-2xl backdrop-blur-xl lg:hidden">
          {mobileNavItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold ${
                item.label === "Booking" ? "text-[#fe9a00]" : "text-gray-400"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </main>

      <CustomerReservationEditModal
        reservation={reservation}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onUpdate={() => {
          setIsEditOpen(false);
          fetchData();
        }}
      />
    </div>
  );
}
