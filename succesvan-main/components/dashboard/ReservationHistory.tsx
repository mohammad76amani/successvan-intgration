"use client";

import useSWR from "swr";
import { FiArchive, FiClock, FiTruck } from "react-icons/fi";
import DynamicTableView from "./DynamicTableView";
import { clientAuthHeaders } from "@/lib/client-auth";
import {
  statusBadgeClasses,
  statusLabel,
} from "@/lib/reservation-status";
import { formatDateTimeInLondon } from "@/lib/englandTime";
import type { Reservation } from "@/types/type";

type HistoryVehicle = {
  _id: string;
  title?: string;
  number?: string | number;
  keyNumber?: string;
};

type HistoryReservation = Reservation & {
  _id: string;
  user?: { name?: string; lastName?: string };
  vehicle?: HistoryVehicle;
};

const fetcher = async (url: string) => {
  const response = await fetch(url, { headers: clientAuthHeaders() });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "Could not load vehicles");
  }
  return payload;
};

const bookingDateTime = (
  reservation: HistoryReservation,
  kind: "pickup" | "return",
) => {
  const dateDisplay =
    kind === "pickup"
      ? reservation.startDateDisplay
      : reservation.endDateDisplay;
  const time =
    kind === "pickup" ? reservation.pickupTime : reservation.returnTime;
  if (dateDisplay) {
    const [year, month, day] = dateDisplay.split("-");
    return `${day}/${month}/${year}${time ? `, ${time}` : ""}`;
  }
  const value = kind === "pickup" ? reservation.startDate : reservation.endDate;
  return value ? formatDateTimeInLondon(value) : "-";
};

const vehicleDetails = (reservation: HistoryReservation) => {
  const vehicle = reservation.vehicle || reservation.vehicleSnapshot;
  return {
    title: vehicle?.title || "Vehicle not recorded",
    number: vehicle?.number ? String(vehicle.number) : "-",
    keyNumber: vehicle?.keyNumber || "-",
  };
};

export default function ReservationHistory() {
  const { data, isLoading } = useSWR<{ data?: HistoryVehicle[] }>(
    "/api/vehicles?limit=1000",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );
  const vehicles = Array.isArray(data?.data) ? data.data : [];

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-r from-[#fe9a00]/[0.07] via-[#111827] to-[#111827] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#fe9a00]/20 bg-[#fe9a00]/10 text-[#fe9a00]">
              <FiArchive />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">
                Reservation History
              </h2>
              <p className="mt-1 text-sm text-white/40">
                Find completed or closed bookings by vehicle and reservation dates.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/35">
            <FiClock className="text-[#fe9a00]" />
            Read-only booking records
          </div>
        </div>
      </div>

      <DynamicTableView<HistoryReservation>
        apiEndpoint="/api/reservations"
        title="Reservation History"
        defaultFilters={{ history: "true" }}
        hideDelete
        itemsPerPage={20}
        filters={[
          { key: "reservationCode", label: "Order ID", type: "text" },
          {
            key: "vehicle",
            label: "Vehicle",
            type: "select",
            options: vehicles.map((vehicle) => ({
              _id: vehicle._id,
              name: `${vehicle.title || "Vehicle"} · ${vehicle.number || "No registration"}${vehicle.keyNumber ? ` · Key ${vehicle.keyNumber}` : ""}`,
            })),
          },
          { key: "startDate", label: "Pickup date", type: "date" },
          { key: "endDate", label: "Return date", type: "date" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { _id: "completed", name: "Completed" },
              { _id: "canceled", name: "Canceled" },
              { _id: "expired", name: "Expired" },
            ],
          },
        ]}
        columns={[
          {
            key: "reservationCode",
            label: "Order ID",
            render: (value) => (
              <span className="font-bold text-[#fe9a00]">
                {String(value || "-")}
              </span>
            ),
          },
          {
            key: "user",
            label: "Customer",
            render: (_value, reservation) => (
              <span className="font-medium text-white">
                {[reservation?.user?.name, reservation?.user?.lastName]
                  .filter(Boolean)
                  .join(" ") || "Customer not recorded"}
              </span>
            ),
          },
          {
            key: "vehicle",
            label: "Vehicle",
            render: (_value, reservation) => {
              if (!reservation) return "-";
              const details = vehicleDetails(reservation);
              return (
                <div className="min-w-44">
                  <span className="flex items-center gap-1.5 font-semibold text-white">
                    <FiTruck className="shrink-0 text-[#fe9a00]" />
                    {details.title}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-white/35">
                    {details.number} · Key {details.keyNumber}
                  </span>
                </div>
              );
            },
          },
          {
            key: "startDate",
            label: "Pickup",
            render: (_value, reservation) =>
              reservation ? bookingDateTime(reservation, "pickup") : "-",
          },
          {
            key: "endDate",
            label: "Return",
            render: (_value, reservation) =>
              reservation ? bookingDateTime(reservation, "return") : "-",
          },
          {
            key: "totalPrice",
            label: "Total",
            render: (value) => (
              <span className="font-bold text-white">
                £{Number(value || 0).toFixed(2)}
              </span>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (value) => (
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${statusBadgeClasses(String(value || ""))}`}
              >
                {statusLabel(String(value || ""), true)}
              </span>
            ),
          },
          {
            key: "createdAt",
            label: "Created",
            render: (value) =>
              value ? formatDateTimeInLondon(String(value)) : "-",
          },
        ]}
      />

      {isLoading && (
        <p className="text-xs text-white/30">Loading vehicle filters…</p>
      )}
    </section>
  );
}
