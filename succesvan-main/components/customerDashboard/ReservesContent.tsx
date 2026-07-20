"use client";

import { useState, useEffect } from "react";
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

export default function ReservesContent() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/customer/reservations", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error || "Request failed");
        setReservations(json.data || []);
      })
      .catch((error) =>
        setError(
          error instanceof Error ? error.message : "Could not load reservations",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
        Loading reservations...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
        <p className="font-semibold text-red-600">{error}</p>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <FiClipboard className="text-slate-300 text-5xl mx-auto mb-4" />
        <h3 className="text-xl font-black text-slate-950 mb-2">
          No reservations yet
        </h3>
        <p className="text-slate-500 mb-6">
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
    <div className="space-y-4 rounded-[1.75rem] bg-slate-50 p-3 sm:p-5">
      {reservations.map((reservation) => {
        const journey = buildReservationJourney(reservation);
        const trackHref = `/customerDashboard/reservations/${journey.reservationId}`;
        const actionHref = journey.nextAction.href?.startsWith("#")
          ? `${trackHref}${journey.nextAction.href}`
          : journey.nextAction.href || trackHref;
        const actionIsStrong =
          journey.nextAction.type !== "none" &&
          journey.nextAction.type !== "contact_support";

        return (
          <div
            key={journey.reservationId}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
                <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-slate-50 sm:h-28 sm:w-44 sm:shrink-0">
                  {journey.vehicleImage ? (
                    <Image
                      src={journey.vehicleImage}
                      alt={journey.vehicleName}
                      fill
                      className="object-contain p-2"
                      sizes="(max-width: 640px) 100vw, 176px"
                    />
                  ) : (
                    <FiTruck className="text-5xl text-slate-300" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <span
                    className={`mb-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses(journey.mainStatus)}`}
                  >
                    {journey.publicStatusLabel}
                  </span>
                  <h3 className="truncate text-lg font-black text-slate-950">
                    {journey.vehicleName}
                  </h3>
                  <p className="mb-3 text-sm font-bold text-slate-500">
                    Booking #{journey.bookingReference}
                  </p>
                  <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <p className="flex items-center gap-2">
                      <FiCalendar className="shrink-0 text-slate-400" />
                      <span className="font-semibold text-slate-950">
                        {journey.pickupDateTime}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <FiCalendar className="shrink-0 text-slate-400" />
                      <span className="font-semibold text-slate-950">
                        {journey.returnDateTime}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <FiClock className="shrink-0 text-slate-400" />
                      <span className="font-semibold text-slate-950">
                        {journey.durationLabel}
                      </span>
                    </p>
                    {reservation.office?.name && (
                      <p className="flex items-center gap-2">
                        <FiMapPin className="shrink-0 text-slate-400" />
                        <span className="font-semibold text-slate-950">
                          {reservation.office.name}
                        </span>
                      </p>
                    )}
                  </div>
                  <Link
                    href={trackHref}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#fe9a00] hover:text-[#e68a00]"
                  >
                    Track booking
                    <FiArrowRight />
                  </Link>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-slate-50 p-4 lg:border-l lg:border-t-0 lg:p-5">
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">
                  Next Action
                </p>
                <h4 className="font-black text-slate-950">
                  {journey.nextAction.title}
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  {journey.nextAction.description}
                </p>
                {journey.nextAction.buttonLabel && (
                  <Link
                    href={actionHref}
                    className={`mt-4 flex w-full items-center justify-center rounded-lg px-4 py-3 text-center text-sm font-bold transition-colors ${
                      actionIsStrong
                        ? "bg-[#fe9a00] text-white hover:bg-[#e68a00]"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {journey.nextAction.buttonLabel}
                  </Link>
                )}
                {actionIsStrong ? (
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400">
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
  );
}
