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
  completed: "bg-green-500/20 text-green-400",
  declined: "bg-red-500/20 text-red-400",
  voided: "bg-red-500/20 text-red-400",
  expired: "bg-red-500/20 text-red-400",
  error: "bg-red-500/20 text-red-400",
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
    kind: "signed" | "certificate",
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
    return <div className="text-gray-400">Loading agreements...</div>;
  }

  if (contracts.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <FiFileText className="text-gray-500 text-5xl mx-auto mb-4" />
        <h3 className="text-xl font-black text-white mb-2">No Agreements Yet</h3>
        <p className="text-gray-400">
          When a rental agreement is prepared for one of your bookings, it will
          appear here for you to review and sign.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {contracts.map((contract) => {
        const busy = busyId === contract._id;
        const signable = canGenerateSigningUrl(contract.status);
        const completed = contract.status === "completed";
        return (
          <div
            key={contract._id}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-[#fe9a00]/30 transition-colors"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    completed
                      ? "bg-green-500/20 text-green-400"
                      : "bg-[#fe9a00]/20 text-[#fe9a00]"
                  }`}
                >
                  {completed ? (
                    <FiCheckCircle className="text-xl" />
                  ) : (
                    <FiFileText className="text-xl" />
                  )}
                </div>
                <div>
                  <p className="text-white font-black">
                    {contract.contractNumber}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {contract.vehicleLabel || "Rental agreement"}
                    {contract.bookingReference
                      ? ` • Booking ...${contract.bookingReference}`
                      : ""}
                  </p>
                  <p className="text-gray-500 text-xs mt-1 flex items-center gap-1.5">
                    <FiClock className="shrink-0" />
                    {contract.docusign?.completedAt
                      ? `Signed ${formatDate(contract.docusign.completedAt)}`
                      : contract.docusign?.sentAt
                        ? `Sent ${formatDate(contract.docusign.sentAt)}`
                        : `Created ${formatDate(contract.createdAt)}`}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  statusBadgeStyles[contract.status] ||
                  "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {customerContractStatusLabel(contract.status)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {signable && (
                <button
                  onClick={() => handleSign(contract)}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
                >
                  <FiEdit3 />
                  {busy ? "Opening DocuSign..." : "Review & Sign"}
                </button>
              )}
              {completed && contract.files.signed && (
                <button
                  onClick={() => handleDownload(contract, "signed")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg font-semibold text-sm transition-colors"
                >
                  <FiDownload />
                  Signed agreement
                </button>
              )}
              {completed && contract.files.certificate && (
                <button
                  onClick={() => handleDownload(contract, "certificate")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/15 border border-white/10 text-white rounded-lg font-semibold text-sm transition-colors"
                >
                  <FiDownload />
                  Certificate
                </button>
              )}
              {contract.docusign?.envelopeId && !completed && (
                <button
                  onClick={() => handleRefresh(contract)}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/15 border border-white/10 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  <FiRefreshCw className={busy ? "animate-spin" : ""} />
                  Check status
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
