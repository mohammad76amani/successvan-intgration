"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiClock,
  FiCreditCard,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiTruck,
  FiX,
} from "react-icons/fi";
import { clientAuthHeaders } from "@/lib/client-auth";
import { showToast } from "@/lib/toast";

type RefundCharges = {
  fuel?: number;
  late?: number;
  damage?: number;
  cleaning?: number;
  missingEquipment?: number;
  other?: number;
};

type AdditionalCharge = {
  amount: number;
  reason: string;
};

type RefundQueueItem = {
  _id: string;
  reservationCode?: string;
  user?: {
    name?: string;
    lastName?: string;
    emaildata?: { emailAddress?: string };
    phoneData?: { phoneNumber?: string };
  };
  vehicle?: {
    title?: string;
    make?: string;
    number?: string;
  };
  vehicleSnapshot?: {
    title?: string;
    make?: string;
    number?: string;
  };
  refund?: {
    depositPaid?: number;
    charges?: RefundCharges;
    additionalCharges?: AdditionalCharge[];
    chargeReason?: string;
    deductionsTotal?: number;
    refundAmount?: number;
    status?: "approved" | "processing";
    expectedBy?: string;
  };
};

type RefundQueueResponse = {
  success: boolean;
  error?: string;
  data?: {
    reservations?: RefundQueueItem[];
  };
};

type Urgency = {
  label: string;
  edge: string;
  badge: string;
  icon: string;
};

const money = (value?: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

const dateLabel = (value?: string) => {
  if (!value) return "No deadline set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No deadline set";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const londonDayNumber = (value: Date) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: "year" | "month" | "day") =>
    Number(parts.find((item) => item.type === type)?.value || 0);
  return Date.UTC(part("year"), part("month") - 1, part("day")) / 86_400_000;
};

const urgencyFor = (expectedBy?: string): Urgency => {
  if (!expectedBy || Number.isNaN(new Date(expectedBy).getTime())) {
    return {
      label: "No deadline",
      edge: "border-l-sky-500",
      badge: "border-sky-400/25 bg-sky-400/10 text-sky-300",
      icon: "text-sky-300",
    };
  }

  const days = londonDayNumber(new Date(expectedBy)) - londonDayNumber(new Date());
  if (days < 0) {
    return {
      label: `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`,
      edge: "border-l-red-500",
      badge: "border-red-400/25 bg-red-500/10 text-red-300",
      icon: "text-red-300",
    };
  }
  if (days === 0) {
    return {
      label: "Due today",
      edge: "border-l-orange-500",
      badge: "border-orange-400/25 bg-orange-500/10 text-orange-300",
      icon: "text-orange-300",
    };
  }
  if (days <= 3) {
    return {
      label: `${days} day${days === 1 ? "" : "s"} remaining`,
      edge: "border-l-yellow-400",
      badge: "border-yellow-300/25 bg-yellow-400/10 text-yellow-200",
      icon: "text-yellow-200",
    };
  }
  return {
    label: `${days} days remaining`,
    edge: "border-l-sky-500",
    badge: "border-sky-400/25 bg-sky-400/10 text-sky-300",
    icon: "text-sky-300",
  };
};

const customerName = (item: RefundQueueItem) =>
  [item.user?.name, item.user?.lastName].filter(Boolean).join(" ") || "Customer";

const vehicleName = (item: RefundQueueItem) =>
  item.vehicleSnapshot?.title ||
  item.vehicle?.title ||
  item.vehicleSnapshot?.make ||
  item.vehicle?.make ||
  "Vehicle";

const registration = (item: RefundQueueItem) =>
  item.vehicleSnapshot?.number || item.vehicle?.number || "Not recorded";

const fixedDeductionRows: Array<{ key: keyof RefundCharges; label: string }> = [
  { key: "fuel", label: "Fuel" },
  { key: "late", label: "Late return" },
  { key: "damage", label: "Damage" },
  { key: "cleaning", label: "Cleaning" },
  { key: "missingEquipment", label: "Missing equipment" },
  { key: "other", label: "Other" },
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#07101f]/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#fe9a00]/70 focus:ring-2 focus:ring-[#fe9a00]/15";

export default function DepositRefundsManagement() {
  const [items, setItems] = useState<RefundQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [selected, setSelected] = useState<RefundQueueItem | null>(null);
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  const loadRefunds = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/refunds/due?all=true", {
        headers: clientAuthHeaders(),
        cache: "no-store",
        signal,
      });
      const payload = (await response.json()) as RefundQueueResponse;
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Could not load deposit refunds");
      }
      setItems(Array.isArray(payload.data?.reservations) ? payload.data.reservations : []);
    } catch (caught) {
      if (signal?.aborted || (caught as Error).name === "AbortError") return;
      setError(caught instanceof Error ? caught.message : "Could not load deposit refunds");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadRefunds(controller.signal);
    return () => controller.abort();
  }, [loadRefunds]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      [
        item.reservationCode,
        customerName(item),
        item.user?.phoneData?.phoneNumber,
        item.user?.emaildata?.emailAddress,
        registration(item),
        vehicleName(item),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [items, search]);

  const totals = useMemo(
    () =>
      items.reduce(
        (summary, item) => ({
          deposits: summary.deposits + Number(item.refund?.depositPaid || 0),
          deductions:
            summary.deductions + Number(item.refund?.deductionsTotal || 0),
          refunds: summary.refunds + Number(item.refund?.refundAmount || 0),
        }),
        { deposits: 0, deductions: 0, refunds: 0 },
      ),
    [items],
  );

  const toggleExpanded = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCompletion = (item: RefundQueueItem) => {
    setSelected(item);
    setReference("");
  };

  const closeCompletion = () => {
    if (saving) return;
    setSelected(null);
    setReference("");
  };

  const completeRefund = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected?._id || reference.trim().length < 2) {
      showToast.error("Enter the bank authorization or refund reference number");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/reservations/${selected._id}/refund`, {
        method: "POST",
        headers: clientAuthHeaders(true),
        body: JSON.stringify({
          action: "complete",
          charges: selected.refund?.charges || {},
          additionalCharges: selected.refund?.additionalCharges || [],
          chargeReason: selected.refund?.chargeReason || "",
          reference: reference.trim(),
        }),
      });
      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Could not complete the refund");
      }
      setItems((current) => current.filter((item) => item._id !== selected._id));
      setSelected(null);
      setReference("");
      showToast.success("Deposit refund marked as completed");
    } catch (caught) {
      showToast.error(caught instanceof Error ? caught.message : "Could not complete the refund");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/10 backdrop-blur-xl">
        <div className="flex flex-col gap-4 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#fe9a00]/20 bg-[#fe9a00]/10 text-xl text-[#fe9a00]">
              <FiCreditCard />
            </span>
            <div>
              <h2 className="text-lg font-black text-white sm:text-xl">Deposit refunds</h2>
              <p className="mt-1 text-sm leading-5 text-slate-400">
                Pay approved refunds in deadline order and record the bank authorization.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadRefunds()}
            disabled={loading}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-bold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#fe9a00]/30 disabled:cursor-wait disabled:opacity-60"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            Refresh queue
          </button>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-white/10 sm:grid-cols-4 sm:divide-y-0">
          {[
            { label: "Refunds waiting", value: String(items.length) },
            { label: "Deposits held", value: money(totals.deposits) },
            { label: "Deductions", value: money(totals.deductions) },
            { label: "Payable now", value: money(totals.refunds), accent: true },
          ].map((stat) => (
            <div key={stat.label} className="min-w-0 px-4 py-4 sm:px-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                {stat.label}
              </p>
              <p className={`mt-1 truncate text-lg font-black sm:text-xl ${stat.accent ? "text-[#fe9a00]" : "text-white"}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="relative">
        <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={`${inputClass} pl-11 pr-10`}
          placeholder="Search order ID, customer, phone, email or registration"
          aria-label="Search deposit refunds"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
            aria-label="Clear search"
          >
            <FiX />
          </button>
        )}
      </div>

      {loading ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center">
          <FiRefreshCw className="mx-auto animate-spin text-2xl text-[#fe9a00]" />
          <p className="mt-3 text-sm font-semibold text-slate-300">Loading the refund queue…</p>
          <p className="mt-1 text-xs text-slate-500">Checking approved deposits and deadlines.</p>
        </section>
      ) : error ? (
        <section className="rounded-2xl border border-red-400/20 bg-red-500/[0.06] p-6 text-center">
          <FiAlertCircle className="mx-auto text-2xl text-red-300" />
          <p className="mt-3 font-bold text-white">Refund queue unavailable</p>
          <p className="mt-1 text-sm text-red-200/70">{error}</p>
          <button
            type="button"
            onClick={() => void loadRefunds()}
            className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/15"
          >
            Try again
          </button>
        </section>
      ) : filtered.length === 0 ? (
        <section className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.045] p-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/10 text-2xl text-emerald-300">
            <FiCheck />
          </span>
          <p className="mt-3 font-black text-white">
            {items.length === 0 ? "All refunds are up to date" : "No matching refunds"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {items.length === 0
              ? "There are no approved deposit refunds waiting for payment."
              : "Try another order ID, customer name or vehicle registration."}
          </p>
        </section>
      ) : (
        <section className="space-y-3" aria-label="Deposit refund queue">
          <div className="hidden grid-cols-[minmax(150px,1.15fr)_minmax(170px,1.35fr)_minmax(150px,1fr)_130px_140px_130px] gap-4 px-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 xl:grid">
            <span>Order & deadline</span>
            <span>Customer</span>
            <span>Vehicle</span>
            <span className="text-right">Deposit / deductions</span>
            <span className="text-right">Refund payable</span>
            <span className="text-right">Action</span>
          </div>

          {filtered.map((item) => {
            const urgency = urgencyFor(item.refund?.expectedBy);
            const isExpanded = expanded.has(item._id);
            const fixedRows = fixedDeductionRows
              .map((row) => ({ label: row.label, amount: Number(item.refund?.charges?.[row.key] || 0) }))
              .filter((row) => row.amount > 0);
            const additionalRows = (item.refund?.additionalCharges || []).filter(
              (row) => Number(row.amount) > 0,
            );
            const hasDeductions = fixedRows.length > 0 || additionalRows.length > 0;

            return (
              <article
                key={item._id}
                className={`overflow-hidden rounded-2xl border border-white/10 border-l-4 ${urgency.edge} bg-[#111a2d]/85 shadow-lg shadow-black/10 transition hover:border-y-white/15 hover:border-r-white/15`}
              >
                <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(150px,1.15fr)_minmax(170px,1.35fr)_minmax(150px,1fr)_130px_140px_130px] xl:items-center">
                  <div>
                    <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-bold ${urgency.badge}`}>
                      <FiClock className={urgency.icon} />
                      {urgency.label}
                    </div>
                    <p className="mt-2 text-base font-black text-white">{item.reservationCode || "No order ID"}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                      <FiCalendar /> {dateLabel(item.refund?.expectedBy)}
                    </p>
                  </div>

                  <div className="min-w-0 border-t border-white/[0.07] pt-3 xl:border-0 xl:pt-0">
                    <p className="truncate text-sm font-bold text-white">{customerName(item)}</p>
                    <p className="mt-1 flex items-center gap-2 truncate text-xs text-slate-400">
                      <FiPhone className="shrink-0" /> {item.user?.phoneData?.phoneNumber || "No phone"}
                    </p>
                    <p className="mt-1 flex items-center gap-2 truncate text-xs text-slate-400">
                      <FiMail className="shrink-0" /> {item.user?.emaildata?.emailAddress || "No email"}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-bold text-slate-200">
                      <FiTruck className="shrink-0 text-slate-500" /> {vehicleName(item)}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                      {registration(item)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-xl bg-black/15 p-3 xl:block xl:bg-transparent xl:p-0 xl:text-right">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 xl:hidden">Deposit</p>
                      <p className="text-sm font-bold text-slate-200">{money(item.refund?.depositPaid)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 xl:hidden">Deductions</p>
                      <p className="text-sm font-bold text-red-300">−{money(item.refund?.deductionsTotal)}</p>
                    </div>
                  </div>

                  <div className="flex items-end justify-between border-t border-white/[0.07] pt-3 xl:block xl:border-0 xl:pt-0 xl:text-right">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 xl:hidden">Refund payable</p>
                      <p className="text-xl font-black text-white">{money(item.refund?.refundAmount)}</p>
                    </div>
                    <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {item.refund?.status || "approved"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openCompletion(item)}
                    className="min-h-11 rounded-xl bg-[#fe9a00] px-4 text-sm font-black text-[#111827] shadow-lg shadow-[#fe9a00]/10 transition hover:bg-[#ffad28] focus:outline-none focus:ring-2 focus:ring-[#fe9a00]/40 focus:ring-offset-2 focus:ring-offset-[#111827]"
                  >
                    Mark refunded
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => toggleExpanded(item._id)}
                  className="flex w-full items-center justify-between border-t border-white/[0.07] px-4 py-3 text-left text-xs font-bold text-slate-300 transition hover:bg-white/[0.025] sm:px-5"
                  aria-expanded={isExpanded}
                >
                  <span>
                    Deduction breakdown
                    <span className="ml-2 font-normal text-slate-500">
                      {hasDeductions ? `${fixedRows.length + additionalRows.length} item${fixedRows.length + additionalRows.length === 1 ? "" : "s"}` : "No deductions"}
                    </span>
                  </span>
                  <FiChevronDown className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <div className="border-t border-white/[0.07] bg-black/10 px-4 py-4 sm:px-5">
                      {hasDeductions ? (
                        <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                          {fixedRows.map((row) => (
                            <div key={row.label} className="flex items-center justify-between gap-4 text-sm">
                              <span className="text-slate-400">{row.label}</span>
                              <span className="font-bold text-red-300">−{money(row.amount)}</span>
                            </div>
                          ))}
                          {additionalRows.map((row, index) => (
                            <div key={`${row.reason}-${index}`} className="flex items-start justify-between gap-4 text-sm">
                              <span className="min-w-0 break-words text-slate-400">{row.reason || "Additional deduction"}</span>
                              <span className="shrink-0 font-bold text-red-300">−{money(row.amount)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">The full deposit is payable; no deductions were recorded.</p>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-[#020617]/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCompletion();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="complete-refund-title"
            className="w-full rounded-t-2xl border border-white/10 bg-[#111827] shadow-2xl shadow-black/50 sm:max-w-lg sm:rounded-2xl"
          >
            <div className="flex items-start justify-between border-b border-white/10 p-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#fe9a00]">Final confirmation</p>
                <h3 id="complete-refund-title" className="mt-1 text-xl font-black text-white">Mark deposit refunded</h3>
                <p className="mt-1 text-sm text-slate-400">Order {selected.reservationCode || "—"}</p>
              </div>
              <button
                type="button"
                onClick={closeCompletion}
                disabled={saving}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-slate-400 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={completeRefund} className="space-y-5 p-5">
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/[0.08] bg-black/15 p-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer</p>
                  <p className="mt-1 truncate text-sm font-bold text-white">{customerName(selected)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Send to bank</p>
                  <p className="mt-1 text-lg font-black text-[#fe9a00]">{money(selected.refund?.refundAmount)}</p>
                </div>
              </div>

              <label className="block text-xs font-bold uppercase tracking-wide text-slate-400">
                Bank authorization / refund reference
                <input
                  autoFocus
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  className={`${inputClass} mt-2`}
                  placeholder="e.g. RF-28491057"
                  maxLength={120}
                  disabled={saving}
                  required
                />
              </label>

              <div className="flex items-start gap-2 rounded-xl border border-sky-400/15 bg-sky-400/[0.05] p-3 text-xs leading-5 text-sky-100/70">
                <FiAlertCircle className="mt-0.5 shrink-0 text-sky-300" />
                This completes the reservation and records the reference for the customer. Confirm the bank payment first.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={closeCompletion}
                  disabled={saving}
                  className="min-h-11 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || reference.trim().length < 2}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#fe9a00] px-4 text-sm font-black text-[#111827] transition hover:bg-[#ffad28] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? <FiRefreshCw className="animate-spin" /> : <FiCheck />}
                  {saving ? "Saving…" : "Confirm refund"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
