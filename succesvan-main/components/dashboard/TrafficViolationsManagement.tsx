"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiSearch,
  FiTruck,
  FiX,
  FiRefreshCw,
} from "react-icons/fi";
import { clientAuthHeaders } from "@/lib/client-auth";
import { showToast } from "@/lib/toast";
import type { Reservation } from "@/types/type";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#fe9a00] focus:ring-2 focus:ring-[#fe9a00]/10";

const money = (value?: number) => `£${Number(value || 0).toFixed(2)}`;
const dateTime = (value: Date | string, time?: string) => {
  const date = new Date(value).toLocaleDateString("en-GB", {
    timeZone: "Europe/London",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return time ? `${date}, ${time}` : date;
};

const userName = (reservation: Reservation) =>
  [reservation.user?.name, reservation.user?.lastName]
    .filter(Boolean)
    .join(" ") || "Customer";

const registration = (reservation: Reservation) =>
  reservation.vehicleSnapshot?.number || reservation.vehicle?.number || "-";

const dateInputValue = (date: Date | null) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function TrafficViolationsManagement() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [results, setResults] = useState<Reservation[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [amount, setAmount] = useState("");
  const [deductionDate, setDeductionDate] = useState<Date | null>(null);
  const [ticketReference, setTicketReference] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const filterDateValue = dateInputValue(filterDate);
  const deductionDateValue = dateInputValue(deductionDate);

  const loadReservations = useCallback(
    async (
      filters: { vehicleNumber?: string; violationDate?: string } = {},
      signal?: AbortSignal,
    ) => {
      setSearching(true);
      setSearched(false);
      setSelected(null);
      try {
        const params = new URLSearchParams();
        if (filters.vehicleNumber?.trim()) {
          params.set("vehicleNumber", filters.vehicleNumber.trim());
        }
        if (filters.violationDate) {
          params.set("violationDate", filters.violationDate);
        }
        const response = await fetch(
          `/api/admin/traffic-violations?${params}`,
          {
            headers: clientAuthHeaders(),
            cache: "no-store",
            signal,
          },
        );
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "Search failed");
        }
        setResults(Array.isArray(payload.data) ? payload.data : []);
        setSearched(true);
      } catch (error) {
        if (signal?.aborted || (error as Error).name === "AbortError") return;
        showToast.error(
          error instanceof Error
            ? error.message
            : "Could not search reservations",
        );
      } finally {
        if (!signal?.aborted) setSearching(false);
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadReservations({}, controller.signal);
    return () => controller.abort();
  }, [loadReservations]);

  const search = (event: FormEvent) => {
    event.preventDefault();
    void loadReservations({
      vehicleNumber,
      violationDate: filterDateValue,
    });
  };

  const clearFilters = () => {
    setVehicleNumber("");
    setFilterDate(null);
    void loadReservations();
  };

  const openDeduction = (reservation: Reservation) => {
    setSelected(reservation);
    setAmount("");
    setDeductionDate(filterDate);
    setTicketReference("");
    setReason("");
  };

  const addDeduction = async (event: FormEvent) => {
    event.preventDefault();
    if (!deductionDateValue) {
      showToast.error("Select the violation date before adding the charge");
      return;
    }
    if (
      !selected?._id ||
      Number(amount) <= 0 ||
      ticketReference.trim().length < 3 ||
      !reason.trim()
    ) {
      showToast.error(
        "Enter the amount, ticket/PCN reference and deduction reason",
      );
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `/api/admin/reservations/${selected._id}/refund`,
        {
          method: "POST",
          headers: clientAuthHeaders(true),
          body: JSON.stringify({
            action: "add_deduction",
            amount: Number(amount),
            ticketReference: ticketReference.trim(),
            reason: reason.trim(),
            vehicleNumber: registration(selected),
            violationDate: deductionDateValue,
          }),
        },
      );
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Could not add deduction");
      }
      const updated = payload.data as Reservation;
      setResults((current) =>
        current.map((item) =>
          item._id === updated._id
            ? {
                ...item,
                status: updated.status,
                refund: updated.refund,
                statusHistory: updated.statusHistory,
              }
            : item,
        ),
      );
      setSelected(null);
      showToast.success("Traffic violation deduction added");
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Could not add deduction",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fe9a00]/15 text-xl text-[#fe9a00]">
            <FiAlertCircle />
          </span>
          <div>
            <h2 className="text-lg font-black text-white">
              Traffic violation lookup
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
              All bookings in Deposit Review and Refund Processing are listed
              below. Use the vehicle registration and bill date to narrow the
              list before adding a traffic violation deduction.
            </p>
          </div>
        </div>

        <form
          onSubmit={search}
          className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end"
        >
          <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Vehicle registration
            <input
              value={vehicleNumber}
              onChange={(event) =>
                setVehicleNumber(event.target.value.toUpperCase())
              }
              className={inputClass}
              placeholder="e.g. AB12 CDE"
              autoComplete="off"
            />
          </label>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Violation date
            <DatePicker
              selected={filterDate}
              onChange={(date: Date | null) => setFilterDate(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="Select bill date"
              isClearable
              className={inputClass}
              wrapperClassName="svh-date-filter w-full"
              calendarClassName="svh-datepicker-calendar"
              popperClassName="svh-traffic-violation-datepicker-popper"
              portalId="svh-datepicker-portal"
              showPopperArrow={false}
            />
          </label>
          <button
            type="submit"
            disabled={searching}
            className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg bg-[#fe9a00] px-5 text-sm font-black text-white transition hover:bg-[#e68a00] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {searching ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <FiSearch />
            )}
            {searching ? "Filtering" : "Apply filters"}
          </button>
          <button
            type="button"
            onClick={clearFilters}
            disabled={searching || (!vehicleNumber && !filterDate)}
            className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiRefreshCw />
            Clear
          </button>
        </form>
      </section>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">
            Refund-stage reservations
          </p>
          <p className="text-xs text-slate-500">
            {searching
              ? "Loading reservations…"
              : `${results.length} reservation${results.length === 1 ? "" : "s"} shown`}
          </p>
        </div>
      </div>

      {searched && results.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.025] px-5 py-12 text-center">
          <FiSearch className="mx-auto text-3xl text-slate-600" />
          <p className="mt-3 font-bold text-white">No matching reservation</p>
          <p className="mt-1 text-sm text-slate-500">
            No Deposit Review or Refund Processing reservations match the
            selected filters.
          </p>
        </div>
      )}

      {results.map((reservation) => {
        const deposit = Number(
          reservation.refund?.depositPaid ?? reservation.deposit?.amount ?? 0,
        );
        const deductions = Number(reservation.refund?.deductionsTotal || 0);
        const refund = Math.max(0, deposit - deductions);
        const additionalDeductions =
          reservation.refund?.additionalCharges || [];
        const isSelected = selected?._id === reservation._id;
        return (
          <article
            key={reservation._id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/10 backdrop-blur-xl"
          >
            <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-indigo-500/15 px-2.5 py-1 text-xs font-bold text-indigo-300">
                    {reservation.status === "deposit_review"
                      ? "Deposit Review"
                      : "Refund Processing"}
                  </span>
                  <span className="text-xs font-bold text-[#fe9a00]">
                    {reservation.reservationCode || "Reservation"}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Vehicle
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-bold text-white">
                      <FiTruck className="text-[#fe9a00]" />{" "}
                      {registration(reservation)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Customer
                    </p>
                    <p className="mt-1 truncate text-sm font-bold text-white">
                      {userName(reservation)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Collection
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-200">
                      {dateTime(reservation.startDate, reservation.pickupTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Return
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-200">
                      {dateTime(reservation.endDate, reservation.returnTime)}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openDeduction(reservation)}
                className="rounded-lg bg-[#fe9a00] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#e68a00]"
              >
                Add violation deduction
              </button>
            </div>

            <div className="grid grid-cols-3 border-t border-white/[0.07] bg-black/10 px-4 py-3 text-sm sm:px-5">
              <div>
                <p className="text-xs text-slate-500">Deposit</p>
                <p className="font-black text-white">{money(deposit)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Deductions</p>
                <p className="font-black text-red-300">-{money(deductions)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Refund balance</p>
                <p className="font-black text-emerald-400">{money(refund)}</p>
              </div>
            </div>

            <div className="border-t border-white/[0.07] px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Added deductions
                </p>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-bold text-slate-400">
                  {additionalDeductions.length}
                </span>
              </div>
              {additionalDeductions.length === 0 ? (
                <p className="mt-2 text-xs text-slate-600">
                  No additional deductions have been added to this reservation.
                </p>
              ) : (
                <div className="mt-2 divide-y divide-white/[0.06] rounded-lg border border-white/[0.07] bg-black/10 px-3">
                  {additionalDeductions.map((deduction, index) => (
                    <div
                      key={`${deduction.reason}-${index}`}
                      className="grid gap-1 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4"
                    >
                      <div className="min-w-0">
                        <p className="break-words text-xs font-semibold leading-5 text-slate-200">
                          {deduction.reason}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-black tabular-nums text-red-300">
                        -{money(deduction.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isSelected && (
              <form
                onSubmit={addDeduction}
                className="border-t border-[#fe9a00]/20 bg-[#fe9a00]/[0.035] p-4 sm:p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-white">
                      Add traffic violation charge
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                      <FiCalendar className="text-[#fe9a00]" />
                      {deductionDateValue ||
                        "Select the bill date below"} ·{" "}
                      {registration(reservation)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    aria-label="Close deduction form"
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  >
                    <FiX />
                  </button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[150px_170px_190px_minmax(0,1fr)_auto] xl:items-end">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Violation date
                    <DatePicker
                      selected={deductionDate}
                      onChange={(date: Date | null) => setDeductionDate(date)}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Select bill date"
                      className={inputClass}
                      wrapperClassName="svh-date-filter w-full"
                      calendarClassName="svh-datepicker-calendar"
                      popperClassName="svh-traffic-violation-datepicker-popper"
                      portalId="svh-datepicker-portal"
                      showPopperArrow={false}
                    />
                  </label>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Amount (£)
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      className={inputClass}
                      placeholder="0.00"
                    />
                  </label>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Ticket / PCN reference
                    <input
                      maxLength={80}
                      value={ticketReference}
                      onChange={(event) =>
                        setTicketReference(event.target.value.toUpperCase())
                      }
                      className={inputClass}
                      placeholder="e.g. PCN 12345"
                    />
                  </label>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Reason / details
                    <input
                      maxLength={140}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      className={inputClass}
                      placeholder="e.g. Parking in a restricted area"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <FiCheckCircle />
                    )}
                    {saving ? "Saving" : "Add charge"}
                  </button>
                </div>
              </form>
            )}
          </article>
        );
      })}
    </div>
  );
}
