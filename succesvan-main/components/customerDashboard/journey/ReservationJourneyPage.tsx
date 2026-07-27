"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiBell,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiClipboard,
  FiExternalLink,
  FiHelpCircle,
  FiHome,
  FiLock,
  FiMapPin,
  FiMessageSquare,
  FiUpload,
  FiTruck,
  FiUser,
  FiX,
} from "react-icons/fi";
import { showToast } from "@/lib/toast";
import type { Reservation } from "@/types/type";
import type { SafeContractSummary } from "@/lib/docusign/types";
import { buildReservationJourney } from "@/lib/reservation-journey";
import { statusBadgeClasses, type ReservationStatus } from "@/lib/reservation-status";
import JourneyTracker from "./JourneyTracker";
import NextActionCard from "./NextActionCard";
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
  { href: "/customerDashboard#reserves", label: "My Reservations", icon: <FiClipboard /> },
  { href: "/customerDashboard#profile", label: "Profile", icon: <FiUser /> },
  { href: "/customerDashboard#support", label: "Support", icon: <FiMessageSquare /> },
];

const mobileNavItems = [
  { href: "/", label: "Home", icon: <FiHome /> },
  { href: "/customerDashboard#reserves", label: "Booking", icon: <FiClipboard /> },
  { href: "/customerDashboard#support", label: "Support", icon: <FiMessageSquare /> },
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

function DepositHighlight({
  journey,
}: {
  journey: NonNullable<ReturnType<typeof buildReservationJourney>>;
}) {
  const depositAmount = journey.deposit?.amount;

  if (depositAmount === undefined) return null;

  return (
    <div className="grid gap-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl shadow-black/10 backdrop-blur-xl lg:grid-cols-[1fr_1.4fr_1fr]">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-white">
              Deposit amount
            </p>
            <p className="mt-4 text-2xl font-black text-white">
              £{depositAmount}
            </p>
          </div>
          <span className="rounded-full bg-[#fe9a00]/10 px-2.5 py-1 text-xs font-bold text-[#fe9a00]">
            {journey.deposit?.status === "paid" ? "Paid" : "Due"}
          </span>
        </div>
        {journey.deposit?.dueAt && (
          <p className="mt-2 text-sm text-gray-400">
            Due by <span className="font-semibold">{journey.deposit.dueAt}</span>
          </p>
        )}
        <p className="mt-4 flex items-center gap-2 text-sm font-black text-[#fe9a00]">
          <FiClock />
          Secure your booking today
        </p>
      </div>

      <div className="border-y border-white/10 p-5 lg:border-x lg:border-y-0">
        <p className="text-sm font-black text-white">Why deposit?</p>
        <p className="mt-3 text-sm leading-relaxed text-gray-300">
          The deposit secures your booking and is refunded after the van is
          returned and inspected.
        </p>
        <button
          type="button"
          onClick={() => document.getElementById("deposit")?.scrollIntoView({ behavior: "smooth" })}
          className="mt-4 text-sm font-black text-[#fe9a00] hover:text-[#e68a00]"
        >
          View deposit policy
        </button>
      </div>

      <div className="p-5">
        <p className="text-sm font-black text-white">We accept</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["VISA", "MC", "Apple Pay", "G Pay"].map((method) => (
            <span
              key={method}
              className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-gray-200"
            >
              {method}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function HelpStrip() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/10 backdrop-blur-xl">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-black text-white">Need help?</p>
          <p className="text-sm text-gray-400">
            Our support team is here to help with your booking.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[560px]">
          {[
            { icon: <FiLock />, title: "Secure payments", text: "Your payment is safe with us" },
            { icon: <FiCheckCircle />, title: "No hidden fees", text: "What you see is what you pay" },
            { icon: <FiHelpCircle />, title: "24/7 support", text: "We’re here anytime" },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-2">
              <span className="mt-1 text-lg text-green-500">{item.icon}</span>
              <div>
                <p className="text-xs font-black text-white">
                  {item.title}
                </p>
                <p className="text-[11px] text-gray-500">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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

  const fetchData = useCallback(async () => {
    try {
      const userRaw = localStorage.getItem("user");
      const userId = userRaw ? JSON.parse(userRaw)?._id : null;
      if (!userId) {
        router.replace("/login");
        return;
      }

      const res = await fetch(
        `/api/customer/reservations/${reservationId}/journey`,
        { headers: authHeaders() },
      );
      const json = await res.json();
      const data: Reservation | undefined = json.data?.reservation;
      if (!json.success || !data) {
        setNotFound(true);
        return;
      }
      setReservation(data);
      setContract(json.data.contract || null);
    } catch (error) {
      console.log("Failed to load reservation:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [reservationId, router]);

  useEffect(() => {
    fetchData();
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
      return DEFAULT_SECTION[journey.mainStatus] ?? "summary";
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey?.mainStatus, initialSection, embedded]);

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

  const handleDownloadContract = async (kind: "signed" | "certificate") => {
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

  const journeyContent = (
    <div
      className={
        embedded
          ? "p-4 sm:p-5"
          : "mx-auto max-w-6xl p-3 pb-24 sm:p-6 lg:pb-6"
      }
    >
      <div className="space-y-5">
        {/* ── Main reservation card ─────────────────────────── */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/10 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="relative flex aspect-[16/9] w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/20 sm:h-60 sm:w-48">
                {journey.vehicleImage ? (
                  <Image
                    src={journey.vehicleImage}
                    alt={journey.vehicleName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 208px"
                  />
                ) : (
                  <FiTruck className="text-gray-500 text-4xl" />
                )}
              </div>
              <div className="flex-1 min-w-0">
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
                <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
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
                    <FiMapPin className="text-[#fe9a00]" />
                    {journey.collection.location}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => openAndScroll("summary")}
                  className="mt-4 text-sm font-black text-[#fe9a00] hover:text-[#e68a00]"
                >
                  View details
                </button>
              </div>
            </div>
          </div>

          <NextActionCard
            action={journey.nextAction}
            onSectionLink={openAndScroll}
          />
        </div>

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
        <DepositHighlight journey={journey} />
        <HelpStrip />
        <JourneyAccordions
          reservation={reservation}
          journey={journey}
          contract={contract}
          openSection={openSection}
          onToggle={handleToggle}
          onEditBooking={() => setIsEditOpen(true)}
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
                item.label === "Booking"
                  ? "text-[#fe9a00]"
                  : "text-gray-400"
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
