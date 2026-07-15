"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FiFileText,
  FiPlus,
  FiRefreshCw,
  FiSend,
  FiSearch,
  FiX,
  FiDownload,
  FiSlash,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiRepeat,
} from "react-icons/fi";
import { showToast } from "@/lib/toast";
import type { SafeContractSummary, ContractStatus } from "@/lib/docusign/types";
import { CONTRACT_STATUSES } from "@/lib/docusign/types";
import { canVoidContract, isTerminalStatus } from "@/lib/docusign/status";

type Pagination = { page: number; limit: number; total: number; pages: number };

type ReservationOption = {
  _id: string;
  reservationCode?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  totalPrice?: number;
  user?: { name?: string; lastName?: string; emaildata?: { emailAddress?: string } };
  category?: { name?: string };
};

const statusStyles: Record<ContractStatus, string> = {
  draft: "bg-slate-500/20 text-slate-300",
  generating: "bg-slate-500/20 text-slate-300",
  ready: "bg-blue-500/20 text-blue-400",
  sent: "bg-yellow-500/20 text-yellow-400",
  delivered: "bg-yellow-500/20 text-yellow-400",
  viewed: "bg-amber-500/20 text-amber-400",
  signing: "bg-orange-500/20 text-orange-400",
  completed: "bg-green-500/20 text-green-400",
  declined: "bg-red-500/20 text-red-400",
  voided: "bg-red-500/20 text-red-400",
  expired: "bg-red-500/20 text-red-400",
  error: "bg-red-500/20 text-red-400",
};

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

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: ContractStatus }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusStyles[status] || statusStyles.draft}`}
    >
      {status}
    </span>
  );
}

export default function ContractsManagement() {
  const [contracts, setContracts] = useState<SafeContractSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [detailContract, setDetailContract] =
    useState<SafeContractSummary | null>(null);
  const [voidContractTarget, setVoidContractTarget] =
    useState<SafeContractSummary | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (statusFilter) params.set("status", statusFilter);
      if (customerSearch.trim()) params.set("customer", customerSearch.trim());
      const res = await fetch(`/api/admin/contracts?${params.toString()}`, {
        headers: authHeaders(),
      });
      const payload = await res.json();
      if (!payload.success) throw new Error(apiError(payload));
      // successResponse flattens paginated results to { data: [...], pagination }
      setContracts(Array.isArray(payload.data) ? payload.data : []);
      setPagination(payload.pagination || null);
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Could not load contracts",
      );
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, customerSearch]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const replaceContract = (updated: SafeContractSummary) => {
    setContracts((prev) =>
      prev.map((c) => (c._id === updated._id ? updated : c)),
    );
    setDetailContract((prev) => (prev?._id === updated._id ? updated : prev));
  };

  const runAction = async (
    contract: SafeContractSummary,
    path: string,
    body?: Record<string, unknown>,
    successMessage?: string,
  ) => {
    setBusyId(contract._id);
    try {
      const res = await fetch(`/api/admin/contracts/${contract._id}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const payload = await res.json();
      if (!payload.success) throw new Error(apiError(payload));
      replaceContract(payload.data);
      if (successMessage) showToast.success(successMessage);
      return true;
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Action failed");
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const downloadDocument = (
    contract: SafeContractSummary,
    kind: "source" | "signed" | "certificate",
  ) => {
    const token = localStorage.getItem("token") || "";
    window.open(
      `/api/admin/contracts/${contract._id}/document?type=${kind}&token=${encodeURIComponent(token)}`,
      "_blank",
    );
  };

  const handleVoid = async () => {
    if (!voidContractTarget || voidReason.trim().length < 3) {
      showToast.error("Please enter a void reason (at least 3 characters).");
      return;
    }
    const ok = await runAction(
      voidContractTarget,
      "void",
      { reason: voidReason.trim() },
      "Contract voided.",
    );
    if (ok) {
      setVoidContractTarget(null);
      setVoidReason("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#fe9a00]/20 text-[#fe9a00] flex items-center justify-center">
            <FiFileText className="text-2xl" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Rental Agreements</h2>
            <p className="text-gray-400 text-sm">
              Create contracts, send them for signature via DocuSign, and track
              their progress.
            </p>
          </div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg font-bold transition-colors"
        >
          <FiPlus />
          New Contract
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-55">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={customerSearch}
            onChange={(e) => {
              setPage(1);
              setCustomerSearch(e.target.value);
            }}
            placeholder="Search customer name, email or phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fe9a00]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fe9a00] [&>option]:bg-[#1a2847]"
        >
          <option value="">All statuses</option>
          {CONTRACT_STATUSES.map((status) => (
            <option key={status} value={status} className="capitalize">
              {status}
            </option>
          ))}
        </select>
        <button
          onClick={fetchContracts}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-gray-400">
                <th className="px-4 py-3 font-semibold">Contract</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Vehicle</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Sent</th>
                <th className="px-4 py-3 font-semibold">Completed</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && contracts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    Loading contracts...
                  </td>
                </tr>
              )}
              {!loading && contracts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    No contracts found. Create one from a booking to get
                    started.
                  </td>
                </tr>
              )}
              {contracts.map((contract) => {
                const busy = busyId === contract._id;
                const canSend =
                  !contract.docusign?.envelopeId &&
                  !isTerminalStatus(contract.status) &&
                  contract.status !== "generating";
                const canResend = Boolean(
                  contract.docusign?.envelopeId &&
                    !isTerminalStatus(contract.status),
                );
                return (
                  <tr
                    key={contract._id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-white font-bold">{contract.contractNumber}</p>
                      <p className="text-gray-500 text-xs">
                        Booking ...{contract.bookingReference}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white">{contract.customerName}</p>
                      <p className="text-gray-500 text-xs">{contract.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {contract.vehicleLabel || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={contract.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {formatDateTime(contract.docusign?.sentAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {formatDateTime(contract.docusign?.completedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          title="View details"
                          onClick={() => setDetailContract(contract)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 transition-colors"
                        >
                          <FiEye />
                        </button>
                        {canSend && (
                          <button
                            title="Send for signature via DocuSign"
                            disabled={busy}
                            onClick={() =>
                              runAction(
                                contract,
                                "send",
                                undefined,
                                "Contract sent — DocuSign has emailed the customer.",
                              )
                            }
                            className="p-2 rounded-lg bg-[#fe9a00]/20 hover:bg-[#fe9a00]/30 text-[#fe9a00] transition-colors disabled:opacity-50"
                          >
                            <FiSend />
                          </button>
                        )}
                        {canResend && (
                          <button
                            title="Resend DocuSign email"
                            disabled={busy}
                            onClick={() =>
                              runAction(
                                contract,
                                "resend",
                                undefined,
                                "DocuSign email resent to the customer.",
                              )
                            }
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 transition-colors disabled:opacity-50"
                          >
                            <FiRepeat />
                          </button>
                        )}
                        {contract.docusign?.envelopeId &&
                          !isTerminalStatus(contract.status) && (
                            <button
                              title="Refresh status from DocuSign"
                              disabled={busy}
                              onClick={() =>
                                runAction(
                                  contract,
                                  "refresh-status",
                                  undefined,
                                  "Status refreshed.",
                                )
                              }
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 transition-colors disabled:opacity-50"
                            >
                              <FiRefreshCw className={busy ? "animate-spin" : ""} />
                            </button>
                          )}
                        {canVoidContract(contract.status) && (
                          <button
                            title="Void contract"
                            disabled={busy}
                            onClick={() => {
                              setVoidReason("");
                              setVoidContractTarget(contract);
                            }}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
                          >
                            <FiSlash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <p className="text-gray-400 text-sm">
              {pagination.total} contract{pagination.total === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white disabled:opacity-40 transition-colors"
              >
                <FiChevronLeft />
              </button>
              <span className="text-white text-sm font-semibold">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white disabled:opacity-40 transition-colors"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {createOpen && (
        <CreateContractModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            setPage(1);
            fetchContracts();
          }}
        />
      )}

      {detailContract && (
        <ContractDetailModal
          contract={detailContract}
          busy={busyId === detailContract._id}
          onClose={() => setDetailContract(null)}
          onDownload={downloadDocument}
          onRetryDocuments={() =>
            runAction(
              detailContract,
              "retry-documents",
              undefined,
              "Signed documents downloaded from DocuSign.",
            )
          }
        />
      )}

      {voidContractTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2847] rounded-2xl border border-white/10 max-w-md w-full p-6">
            <h3 className="text-xl font-black text-white mb-2">
              Void contract {voidContractTarget.contractNumber}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              This cancels the DocuSign envelope. The customer will no longer be
              able to sign it.
            </p>
            <textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Reason for voiding (required)"
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fe9a00] mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setVoidContractTarget(null)}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVoid}
                disabled={busyId === voidContractTarget._id}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                Void Contract
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateContractModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ReservationOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<ReservationOption | null>(null);
  const [bookingIdInput, setBookingIdInput] = useState("");
  const [sendNow, setSendNow] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/reservations?reservationCode=${encodeURIComponent(term)}&limit=8`,
          { headers: authHeaders() },
        );
        const payload = await res.json();
        const data = payload.data?.data || payload.data || [];
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const bookingId = selected?._id || bookingIdInput.trim();

  const handleCreate = async () => {
    if (!bookingId) {
      showToast.error("Select a booking or paste a booking ID.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ bookingId, sendNow }),
      });
      const payload = await res.json();
      if (!payload.success) throw new Error(apiError(payload));
      showToast.success(
        sendNow
          ? "Contract created — DocuSign has emailed the customer to sign."
          : "Contract created and ready to send.",
      );
      onCreated();
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Could not create contract",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a2847] rounded-2xl border border-white/10 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black text-white">New Rental Agreement</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
          >
            <FiX />
          </button>
        </div>

        <label className="text-white text-sm font-semibold mb-2 block">
          Find booking by reservation code
        </label>
        <div className="relative mb-3">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelected(null);
            }}
            placeholder="e.g. SVH-1234"
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fe9a00]"
          />
        </div>

        {searching && <p className="text-gray-400 text-sm mb-3">Searching...</p>}
        {results.length > 0 && (
          <div className="space-y-2 mb-4 max-h-56 overflow-y-auto">
            {results.map((reservation) => {
              const name = `${reservation.user?.name || ""} ${reservation.user?.lastName || ""}`.trim();
              const isSelected = selected?._id === reservation._id;
              return (
                <button
                  key={reservation._id}
                  onClick={() => setSelected(isSelected ? null : reservation)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                    isSelected
                      ? "border-[#fe9a00] bg-[#fe9a00]/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-sm">
                      {reservation.reservationCode || reservation._id.slice(-8)}
                    </span>
                    <span className="text-gray-400 text-xs capitalize">
                      {reservation.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    {name || "Unknown customer"}
                    {reservation.category?.name
                      ? ` • ${reservation.category.name}`
                      : ""}
                    {reservation.startDate
                      ? ` • ${new Date(reservation.startDate).toLocaleDateString("en-GB")}`
                      : ""}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        <label className="text-white text-sm font-semibold mb-2 block">
          Or paste a booking ID
        </label>
        <input
          value={bookingIdInput}
          onChange={(e) => {
            setBookingIdInput(e.target.value);
            setSelected(null);
          }}
          placeholder="Booking / reservation ID"
          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#fe9a00] mb-4"
        />

        <label className="flex items-center gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={sendNow}
            onChange={(e) => setSendNow(e.target.checked)}
            className="w-4 h-4 accent-[#fe9a00]"
          />
          <span className="text-white text-sm">
            Send immediately — DocuSign emails the customer a signature request
          </span>
        </label>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !bookingId}
            className="flex-1 px-4 py-3 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg font-bold transition-colors disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Contract"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContractDetailModal({
  contract,
  busy,
  onClose,
  onDownload,
  onRetryDocuments,
}: {
  contract: SafeContractSummary;
  busy: boolean;
  onClose: () => void;
  onDownload: (
    contract: SafeContractSummary,
    kind: "source" | "signed" | "certificate",
  ) => void;
  onRetryDocuments: () => void;
}) {
  const docusign = contract.docusign;
  const missingCompletedFiles =
    contract.status === "completed" &&
    (!contract.files.signed || !contract.files.certificate);

  const rows: Array<[string, string]> = [
    ["Contract number", contract.contractNumber],
    ["Customer", `${contract.customerName} (${contract.customerEmail})`],
    ["Phone", contract.customerPhone || "-"],
    ["Vehicle", contract.vehicleLabel || "-"],
    ["Booking ID", contract.bookingId],
    ["Envelope ID", docusign?.envelopeId || "Not sent yet"],
    ["Envelope status", docusign?.envelopeStatus || "-"],
    ["Sent", formatDateTime(docusign?.sentAt)],
    ["Delivered", formatDateTime(docusign?.deliveredAt)],
    ["Viewed", formatDateTime(docusign?.viewedAt)],
    ["Completed", formatDateTime(docusign?.completedAt)],
    ["Created", formatDateTime(contract.createdAt)],
  ];
  if (docusign?.declineReason)
    rows.push(["Decline reason", docusign.declineReason]);
  if (docusign?.voidReason) rows.push(["Void reason", docusign.voidReason]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a2847] rounded-2xl border border-white/10 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-white">
              {contract.contractNumber}
            </h3>
            <StatusBadge status={contract.status} />
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
          >
            <FiX />
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 space-y-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 text-sm">
              <span className="text-gray-400 shrink-0">{label}</span>
              <span className="text-white text-right break-all">{value}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-white text-sm font-semibold">Documents</p>
          <div className="flex flex-wrap gap-2">
            {contract.files.source && (
              <button
                onClick={() => onDownload(contract, "source")}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/15 border border-white/10 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                <FiDownload /> Agreement (unsigned)
              </button>
            )}
            {contract.files.signed && (
              <button
                onClick={() => onDownload(contract, "signed")}
                className="inline-flex items-center gap-2 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-sm font-semibold transition-colors"
              >
                <FiDownload /> Signed agreement
              </button>
            )}
            {contract.files.certificate && (
              <button
                onClick={() => onDownload(contract, "certificate")}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/15 border border-white/10 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                <FiDownload /> Completion certificate
              </button>
            )}
            {!contract.files.source &&
              !contract.files.signed &&
              !contract.files.certificate && (
                <p className="text-gray-400 text-sm">No documents yet.</p>
              )}
          </div>
          {missingCompletedFiles && (
            <button
              onClick={onRetryDocuments}
              disabled={busy}
              className="inline-flex items-center gap-2 px-3 py-2 bg-[#fe9a00]/20 hover:bg-[#fe9a00]/30 text-[#fe9a00] rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
            >
              <FiRefreshCw className={busy ? "animate-spin" : ""} />
              Fetch signed documents from DocuSign
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
