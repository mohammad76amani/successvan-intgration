"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiClipboard,
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiShield,
  FiTruck,
} from "react-icons/fi";
import { Reservation } from "@/types/type";
import { buildReservationJourney } from "@/lib/reservation-journey";
import { statusBadgeClasses } from "@/lib/reservation-status";
import ReservationJourneyPage from "./journey/ReservationJourneyPage";

type TrackingModalState = {
  reservationId: string;
  initialSection?: string;
};

export default function ReservesContent() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trackingModal, setTrackingModal] = useState<TrackingModalState | null>(
    null,
  );

  useEffect(() => {
    if (!trackingModal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [trackingModal]);

  const fetchReservations = useCallback(async (signal?: AbortSignal) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/customer/reservations", {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal,
      });
      const json = await res.json();
      if (signal?.aborted) return;
      if (!json.success) throw new Error(json.error || "Request failed");
      setReservations(json.data || []);
      setError("");
    } catch (error) {
      if (signal?.aborted || (error as Error).name === "AbortError") return;
      setError(
        error instanceof Error ? error.message : "Could not load reservations",
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchReservations(controller.signal);

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void fetchReservations(controller.signal);
      }
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      controller.abort();
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [fetchReservations]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("contractSigned") !== "1") return;

    const controller = new AbortController();
    const timers = [0, 1_500, 3_500].map((delay) =>
      window.setTimeout(
        () => void fetchReservations(controller.signal),
        delay,
      ),
    );
    params.delete("contractSigned");
    const query = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}#reserves`,
    );
    return () => {
      controller.abort();
      timers.forEach(window.clearTimeout);
    };
  }, [fetchReservations]);

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0b1224]/95 to-[#07101f]/90 p-6 text-center text-slate-400 shadow-2xl shadow-black/15 backdrop-blur-xl sm:p-8">
        Loading reservations...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-400/20 bg-gradient-to-b from-red-500/[0.09] to-red-500/[0.03] p-5 text-center shadow-xl shadow-black/10 sm:p-7">
        <p className="text-sm font-bold leading-6 text-red-300 sm:text-base">{error}</p>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0b1224]/95 to-[#07101f]/90 px-4 py-10 text-center shadow-2xl shadow-black/15 backdrop-blur-xl sm:px-8 sm:py-14">
        <FiClipboard className="mx-auto mb-5 text-5xl text-[#fe9a00]/70 sm:text-6xl" />
        <h3 className="mb-2 text-xl font-black tracking-tight text-white sm:text-2xl">
          No reservations yet
        </h3>
        <p className="mx-auto mb-7 max-w-md text-sm leading-6 text-slate-400 sm:text-base">
          Start by creating your first reservation
        </p>
        <Link
          href="/reservation"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#fe9a00] to-[#ff8500] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#fe9a00]/10 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#fe9a00]/15 sm:w-auto"
        >
          Book a Van
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-5">
      {reservations.map((reservation) => {
        const journey = buildReservationJourney(reservation);
        const actionSection = journey.nextAction.href?.startsWith("#")
          ? journey.nextAction.href.slice(1)
          : undefined;
        const actionIsStrong =
          journey.nextAction.type !== "none" &&
          journey.nextAction.type !== "contact_support";
        const isDepositAction = journey.nextAction.type === "pay_deposit";
        const openTracker = (initialSection?: string) =>
          setTrackingModal({
            reservationId: journey.reservationId,
            initialSection,
          });

        return (
          <div
            key={journey.reservationId}
            className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0b1224]/95 to-[#07101f]/90 shadow-2xl shadow-black/15 backdrop-blur-xl transition duration-200 hover:border-[#fe9a00]/30 hover:shadow-black/25"
          >
            <div className="grid xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="flex flex-col gap-4 p-3.5 sm:gap-5 sm:p-5 md:flex-row lg:p-6">
                <div className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-black/20 shadow-lg shadow-black/15 md:aspect-auto md:h-52 md:w-52 md:shrink-0 lg:h-56 lg:w-56">
                  {journey.vehicleImage ? (
                    <Image
                      src={journey.vehicleImage}
                      alt={journey.vehicleName}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-[1.02]"
                      sizes="(max-width: 640px) 100vw, 192px"
                    />
                  ) : (
                    <FiTruck className="text-5xl text-slate-600" />
                  )}
                </div>

                <div className="min-w-0 flex-1 md:py-1">
                  <h3 className="break-words text-lg font-black tracking-tight text-white sm:text-xl lg:text-2xl">
                    {journey.vehicleName}
                  </h3>
                  <p className="mb-4 mt-1 text-xs font-bold uppercase tracking-[0.10em] text-slate-500 sm:text-sm sm:normal-case sm:tracking-normal">
                    Booking #{journey.bookingReference}
                  </p>
                  <div className="grid gap-2.5 text-sm text-slate-400 sm:grid-cols-2 lg:gap-3">
                    <p className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.025] p-2.5 sm:p-3">
                      <FiCalendar className="mt-0.5 shrink-0 text-[#fe9a00]" />
                      <span>
                        <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                          Pickup
                        </span>
                        <span className="break-words font-semibold leading-5 text-white">
                          {journey.pickupDateTime}
                        </span>
                      </span>
                    </p>
                    <p className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.025] p-2.5 sm:p-3">
                      <FiCalendar className="mt-0.5 shrink-0 text-[#fe9a00]" />
                      <span>
                        <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                          Return
                        </span>
                        <span className="break-words font-semibold leading-5 text-white">
                          {journey.returnDateTime}
                        </span>
                      </span>
                    </p>
                    <p className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.025] p-2.5 sm:p-3">
                      <FiClock className="shrink-0 text-[#fe9a00]" />
                      <span className="break-words font-semibold leading-5 text-white">
                        {journey.durationLabel}
                      </span>
                    </p>
                    {reservation.office?.name && (
                      <p className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.025] p-2.5 sm:p-3">
                        <FiMapPin className="shrink-0 text-[#fe9a00]" />
                        <span className="break-words font-semibold leading-5 text-white">
                          {reservation.office.name}
                        </span>
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openTracker()}
                    className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#fe9a00]/20 bg-[#fe9a00]/[0.07] px-4 py-2 text-sm font-black text-[#fe9a00] transition hover:border-[#fe9a00]/35 hover:bg-[#fe9a00]/10 sm:w-auto"
                  >
                    Track booking
                    <FiArrowRight />
                  </button>
                </div>
              </div>

              <div className="border-t border-white/[0.08] bg-[#07101f]/55 p-4 sm:p-5 xl:border-l xl:border-t-0 xl:p-6">
                <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                      Current status
                    </p>
                    <span
                      className={`mt-2 inline-flex rounded-full border border-white/[0.06] px-3 py-1.5 text-[11px] font-black shadow-sm ${statusBadgeClasses(journey.mainStatus)}`}
                    >
                      {journey.publicStatusLabel}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openTracker()}
                    className="min-h-10 w-full rounded-xl border border-white/[0.10] bg-white/[0.05] px-3.5 py-2 text-xs font-bold text-white transition hover:border-white/20 hover:bg-white/[0.10] sm:w-auto"
                  >
                    Track booking
                  </button>
                </div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#fe9a00]">
                  Action needed
                </p>
                <h4 className="text-base font-black leading-6 text-white sm:text-lg">
                  {journey.nextAction.title}
                </h4>
                <p className="mt-1.5 text-sm leading-6 text-slate-300">
                  {journey.nextAction.description}
                </p>
                {journey.nextAction.buttonLabel && actionSection && (
                  <button
                    type="button"
                    onClick={() => openTracker(actionSection)}
                    className={`mt-5 flex min-h-12 w-full items-center justify-center rounded-xl px-4 py-3 text-center text-sm font-black shadow-sm transition duration-200 ${
                      actionIsStrong
                        ? "bg-gradient-to-r from-[#fe9a00] to-[#ff8500] text-white shadow-[#fe9a00]/10 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#fe9a00]/15"
                        : "border border-white/[0.10] bg-white/[0.06] text-white hover:border-white/20 hover:bg-white/[0.12]"
                    }`}
                  >
                    {journey.nextAction.buttonLabel}
                  </button>
                )}
                {journey.nextAction.buttonLabel && !actionSection && (
                  <Link
                    href={journey.nextAction.href || "#"}
                    className={`mt-5 flex min-h-12 w-full items-center justify-center rounded-xl px-4 py-3 text-center text-sm font-black shadow-sm transition duration-200 ${
                      actionIsStrong
                        ? "bg-gradient-to-r from-[#fe9a00] to-[#ff8500] text-white shadow-[#fe9a00]/10 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#fe9a00]/15"
                        : "border border-white/[0.10] bg-white/[0.06] text-white hover:border-white/20 hover:bg-white/[0.12]"
                    }`}
                  >
                    {journey.nextAction.buttonLabel}
                  </Link>
                )}
                {isDepositAction ? (
                  <p className="mt-3.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
                    <FiShield />
                    Secure payment
                  </p>
                ) : (
                  <p className="mt-3.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-400/80">
                    <FiCheckCircle />
                    We will keep you updated
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
      </div>

      {trackingModal && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-4 lg:p-6"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setTrackingModal(null);
          }}
        >
          <div className="relative max-h-[96dvh] w-full max-w-6xl overflow-hidden rounded-t-3xl border border-white/[0.10] bg-[#0f172b] shadow-2xl shadow-black/50 sm:max-h-[92dvh] sm:rounded-3xl">
            <ReservationJourneyPage
              reservationId={trackingModal.reservationId}
              initialSection={trackingModal.initialSection}
              embedded
              onClose={() => setTrackingModal(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}
