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

  const fetchReservations = useCallback(async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/customer/reservations", {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Request failed");
      setReservations(json.data || []);
      setError("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not load reservations",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReservations();

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void fetchReservations();
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [fetchReservations]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("contractSigned") !== "1") return;

    const timers = [0, 1_500, 3_500].map((delay) =>
      window.setTimeout(() => void fetchReservations(), delay),
    );
    params.delete("contractSigned");
    const query = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}#reserves`,
    );
    return () => timers.forEach(window.clearTimeout);
  }, [fetchReservations]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-gray-400 shadow-sm backdrop-blur-xl">
        Loading reservations...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
        <p className="font-semibold text-red-300">{error}</p>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center shadow-2xl shadow-black/10 backdrop-blur-xl">
        <FiClipboard className="text-gray-500 text-5xl mx-auto mb-4" />
        <h3 className="text-xl font-black text-white mb-2">
          No reservations yet
        </h3>
        <p className="text-gray-400 mb-6">
          Start by creating your first reservation
        </p>
        <Link
          href="/reservation"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg transition-colors font-semibold"
        >
          Book a Van
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
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
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl shadow-black/10 backdrop-blur-xl transition-colors hover:border-[#fe9a00]/35"
          >
            <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
                <div className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/20 sm:h-48 sm:w-48 sm:shrink-0">
                  {journey.vehicleImage ? (
                    <Image
                      src={journey.vehicleImage}
                      alt={journey.vehicleName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 192px"
                    />
                  ) : (
                    <FiTruck className="text-5xl text-gray-500" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-black text-white">
                    {journey.vehicleName}
                  </h3>
                  <p className="mb-3 text-sm font-bold text-gray-400">
                    Booking #{journey.bookingReference}
                  </p>
                  <div className="grid gap-2 text-sm text-gray-400 sm:grid-cols-2">
                    <p className="flex items-start gap-2">
                      <FiCalendar className="mt-0.5 shrink-0 text-[#fe9a00]" />
                      <span>
                        <span className="block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                          Pickup
                        </span>
                        <span className="font-semibold text-white">
                          {journey.pickupDateTime}
                        </span>
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <FiCalendar className="mt-0.5 shrink-0 text-[#fe9a00]" />
                      <span>
                        <span className="block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                          Return
                        </span>
                        <span className="font-semibold text-white">
                          {journey.returnDateTime}
                        </span>
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <FiClock className="shrink-0 text-[#fe9a00]" />
                      <span className="font-semibold text-white">
                        {journey.durationLabel}
                      </span>
                    </p>
                    {reservation.office?.name && (
                      <p className="flex items-center gap-2">
                        <FiMapPin className="shrink-0 text-[#fe9a00]" />
                        <span className="font-semibold text-white">
                          {reservation.office.name}
                        </span>
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openTracker()}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#fe9a00] hover:text-[#e68a00]"
                  >
                    Track booking
                    <FiArrowRight />
                  </button>
                </div>
              </div>

              <div className="border-t border-white/10 bg-black/10 p-4 lg:border-l lg:border-t-0 lg:p-5">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-gray-400">
                      Current status
                    </p>
                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses(journey.mainStatus)}`}
                    >
                      {journey.publicStatusLabel}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openTracker()}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-white/10"
                  >
                    Track booking
                  </button>
                </div>
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#fe9a00]">
                  Action needed
                </p>
                <h4 className="font-black text-white">
                  {journey.nextAction.title}
                </h4>
                <p className="mt-1 text-sm text-gray-300">
                  {journey.nextAction.description}
                </p>
                {journey.nextAction.buttonLabel && actionSection && (
                  <button
                    type="button"
                    onClick={() => openTracker(actionSection)}
                    className={`mt-4 flex w-full items-center justify-center rounded-lg px-4 py-3 text-center text-sm font-bold transition-colors ${
                      actionIsStrong
                        ? "bg-[#fe9a00] text-white hover:bg-[#e68a00]"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {journey.nextAction.buttonLabel}
                  </button>
                )}
                {journey.nextAction.buttonLabel && !actionSection && (
                  <Link
                    href={journey.nextAction.href || "#"}
                    className={`mt-4 flex w-full items-center justify-center rounded-lg px-4 py-3 text-center text-sm font-bold transition-colors ${
                      actionIsStrong
                        ? "bg-[#fe9a00] text-white hover:bg-[#e68a00]"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {journey.nextAction.buttonLabel}
                  </Link>
                )}
                {isDepositAction ? (
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-400">
                    <FiShield />
                    Secure payment
                  </p>
                ) : (
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-green-600">
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
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setTrackingModal(null);
          }}
        >
          <div className="relative w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-[#0f172b] shadow-2xl shadow-black/40">
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
