"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FiFileText,
  FiDownload,
  FiEdit3,
  FiRefreshCw,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";
import { showToast } from "@/lib/toast";
import {
  formatDateLabelInLondon,
  formatTimeInLondon,
} from "@/lib/englandTime";
import type { SafeContractSummary } from "@/lib/docusign/types";
import {
  canGenerateSigningUrl,
  customerContractStatusLabel,
} from "@/lib/docusign/status";

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function apiError(payload: unknown) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === "string") return error;
  }
  return "Request failed";
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const statusBadgeStyles: Record<string, string> = {
  completed:
    "border-emerald-400/20 bg-emerald-500/10 text-emerald-300 shadow-sm shadow-emerald-950/10",
  declined:
    "border-red-400/20 bg-red-500/10 text-red-300 shadow-sm shadow-red-950/10",
  voided:
    "border-red-400/20 bg-red-500/10 text-red-300 shadow-sm shadow-red-950/10",
  expired:
    "border-red-400/20 bg-red-500/10 text-red-300 shadow-sm shadow-red-950/10",
  error:
    "border-red-400/20 bg-red-500/10 text-red-300 shadow-sm shadow-red-950/10",
};

export default function ContractsContent() {
  const [contracts, setContracts] = useState<SafeContractSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contracts", { headers: authHeaders() });
      const payload = await res.json();
      if (!payload.success) throw new Error(apiError(payload));
      setContracts(payload.data || []);
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Could not load agreements",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleSign = async (contract: SafeContractSummary) => {
    setBusyId(contract._id);
    try {
      const res = await fetch(`/api/contracts/${contract._id}/signing-url`, {
        method: "POST",
        headers: authHeaders(),
      });
      const payload = await res.json();
      if (!payload.success) throw new Error(apiError(payload));
      window.location.href = payload.data.url;
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Could not start signing",
      );
      setBusyId(null);
    }
  };

  const handleRefresh = async (contract: SafeContractSummary) => {
    setBusyId(contract._id);
    try {
      const res = await fetch(
        `/api/contracts/${contract._id}/status?refresh=true`,
        { headers: authHeaders() },
      );
      const payload = await res.json();
      if (!payload.success) throw new Error(apiError(payload));
      setContracts((prev) =>
        prev.map((c) => (c._id === contract._id ? payload.data : c)),
      );
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Could not refresh status",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDownload = async (
    contract: SafeContractSummary,
    kind: "source" | "signed" | "certificate",
  ) => {
    try {
      const res = await fetch(
        `/api/contracts/${contract._id}/document?type=${kind}`,
        { headers: authHeaders() },
      );
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(apiError(payload));
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        kind === "certificate"
          ? `${contract.contractNumber}-certificate.pdf`
          : kind === "source"
            ? `${contract.contractNumber}-agreement.pdf`
            : `${contract.contractNumber}-signed-agreement.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Download failed",
      );
    }
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0b1224]/95 to-[#07101f]/90 p-4 shadow-xl shadow-black/15 sm:p-6">
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#fe9a00]/20 bg-[#fe9a00]/10 text-[#fe9a00]">
            <FiRefreshCw className="animate-spin text-lg" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-white sm:text-base">Loading agreements...</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Fetching your latest rental agreement status.</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <div className="h-28 animate-pulse rounded-2xl border border-white/[0.04] bg-white/[0.035]" />
          <div className="h-28 animate-pulse rounded-2xl border border-white/[0.04] bg-white/[0.035]" />
        </div>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0b1224]/95 to-[#07101f]/90 px-4 py-10 text-center shadow-xl shadow-black/15 sm:px-8 sm:py-14">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#fe9a00]/[0.06] to-transparent" />
        <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#fe9a00]/20 bg-[#fe9a00]/10 text-[#fe9a00] shadow-lg shadow-black/10 sm:h-16 sm:w-16">
          <FiFileText className="text-2xl sm:text-3xl" />
        </div>
        <h3 className="relative mt-5 text-lg font-black tracking-tight text-white sm:text-xl">No Agreements Yet</h3>
        <p className="relative mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
          When a rental agreement is prepared for one of your bookings, it will
          appear here for you to review and sign.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {contracts.map((contract) => {
        const busy = busyId === contract._id;
        const signable = canGenerateSigningUrl(contract.status);
        const completed = contract.status === "completed";
        return (
          <article
            key={contract._id}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0b1224]/95 to-[#07101f]/90 p-4 shadow-xl shadow-black/15 transition duration-200 hover:border-white/[0.13] hover:shadow-2xl hover:shadow-black/20 sm:p-5 lg:p-6"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition ${
                  completed
                    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300 shadow-emerald-950/10"
                    : "border-[#fe9a00]/20 bg-[#fe9a00]/10 text-[#fe9a00] shadow-orange-950/10"
                }`}
              >
                {completed ? <FiCheckCircle className="text-xl" /> : <FiFileText className="text-xl" />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                      {contract.contractType === "reservation_extension"
                        ? "Rental extension"
                        : "Rental agreement"}
                    </p>
                    <h3 className="mt-1 break-words text-lg font-black tracking-tight text-white sm:text-xl">
                      {contract.contractNumber}
                    </h3>
                    <p className="mt-1.5 break-words text-sm font-medium leading-5 text-slate-300">
                      {contract.vehicleLabel || "Rental agreement"}
                      {contract.bookingReference ? ` • Booking ...${contract.bookingReference}` : ""}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit shrink-0 items-center rounded-full border px-3 py-1.5 text-[11px] font-black ${
                      statusBadgeStyles[contract.status] ||
                      "border-amber-400/20 bg-amber-500/10 text-amber-300 shadow-sm shadow-amber-950/10"
                    }`}
                  >
                    {customerContractStatusLabel(contract.status)}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2.5 text-xs font-medium text-slate-400 sm:w-fit">
                  <FiClock className="shrink-0 text-[#fe9a00]" />
                  <span className="min-w-0 break-words">
                    {contract.docusign?.completedAt
                      ? `Signed ${formatDate(contract.docusign.completedAt)}`
                      : contract.docusign?.sentAt
                        ? `Sent ${formatDate(contract.docusign.sentAt)}`
                        : `Created ${formatDate(contract.createdAt)}`}
                  </span>
                </div>

                {contract.contractType === "reservation_extension" &&
                  contract.extension && (
                    <div className="mt-3 grid gap-2 rounded-xl border border-[#fe9a00]/20 bg-[#fe9a00]/[0.05] p-3 text-xs sm:grid-cols-3">
                      <span className="text-slate-400">
                        New return<br />
                        <strong className="text-white">
                          {contract.extension.newReturnDateTime
                            ? `${formatDateLabelInLondon(contract.extension.newReturnDateTime)} ${formatTimeInLondon(contract.extension.newReturnDateTime)}`
                            : "-"}
                        </strong>
                      </span>
                      <span className="text-slate-400">
                        Duration<br />
                        <strong className="text-white">
                          {contract.extension.durationLabel || "-"}
                        </strong>
                      </span>
                      <span className="text-slate-400">
                        Extension price<br />
                        <strong className="text-white">
                          £{Number(contract.extension.agreedPrice || 0).toFixed(2)}
                        </strong>
                        <small className="mt-0.5 block text-[10px] font-semibold text-[#fe9a00]">
                          Pay at the office
                        </small>
                      </span>
                    </div>
                  )}

                <div className="mt-5 grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap">
                  {signable && (
                    <button
                      onClick={() => handleSign(contract)}
                      disabled={busy}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#fe9a00] to-[#ff8500] px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-[#fe9a00]/10 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#fe9a00]/15 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 sm:w-auto"
                    >
                      <FiEdit3 />
                      {busy ? "Opening DocuSign..." : "Review & Sign"}
                    </button>
                  )}

                  {contract.files.source && (
                    <button
                      onClick={() => handleDownload(contract, "source")}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.05] px-4 py-2.5 text-sm font-bold text-white transition duration-200 hover:border-white/20 hover:bg-white/[0.10] sm:w-auto"
                    >
                      <FiDownload />
                      Download agreement
                    </button>
                  )}

                  {completed && contract.files.signed && (
                    <button
                      onClick={() => handleDownload(contract, "signed")}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-300 transition duration-200 hover:border-emerald-400/35 hover:bg-emerald-500/20 sm:w-auto"
                    >
                      <FiDownload />
                      Signed agreement
                    </button>
                  )}

                  {completed && contract.files.certificate && (
                    <button
                      onClick={() => handleDownload(contract, "certificate")}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.05] px-4 py-2.5 text-sm font-bold text-white transition duration-200 hover:border-white/20 hover:bg-white/[0.10] sm:w-auto"
                    >
                      <FiDownload />
                      Certificate
                    </button>
                  )}

                  {contract.docusign?.envelopeId && !completed && (
                    <button
                      onClick={() => handleRefresh(contract)}
                      disabled={busy}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.05] px-4 py-2.5 text-sm font-bold text-white transition duration-200 hover:border-white/20 hover:bg-white/[0.10] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      <FiRefreshCw className={busy ? "animate-spin" : ""} />
                      Check status
                    </button>
                  )}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
