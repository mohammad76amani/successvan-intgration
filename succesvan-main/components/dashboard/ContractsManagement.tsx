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
  FiUser,
  FiTruck,
  FiHash,
  FiMail,
  FiPhone,
  FiCheck,
  FiClock,
  FiAlertTriangle,
} from "react-icons/fi";
import { showToast } from "@/lib/toast";
import { formatDateTimeInLondon } from "@/lib/englandTime";
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
  handoverDepositAmount?: number;
  user?: { name?: string; lastName?: string; emaildata?: { emailAddress?: string } };
  category?: {
    name?: string;
    deposit?: { handoverDepositPrice?: number };
  };
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
            placeholder="Search contract number, Order ID, customer, email or phone..."
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
                <th className="px-4 py-3 font-semibold">Contract Number</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Order ID</th>
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
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                    Loading contracts...
                  </td>
                </tr>
              )}
              {!loading && contracts.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
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
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-300">
                      {contract.contractType === "reservation_extension"
                        ? "Extension"
                        : "Rental"}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {contract.bookingReference || "-"}
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
  const [insuranceProvider, setInsuranceProvider] = useState<
    "" | "diba" | "customer"
  >("");
  const [insuranceOtherExcess, setInsuranceOtherExcess] = useState("");
  const [handoverDepositAmount, setHandoverDepositAmount] = useState("");
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

  useEffect(() => {
    if (!selected) {
      setHandoverDepositAmount("");
      return;
    }
    setHandoverDepositAmount(
      String(
        selected.handoverDepositAmount ??
          selected.category?.deposit?.handoverDepositPrice ??
          0,
      ),
    );
  }, [selected]);

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
        body: JSON.stringify({
          bookingId,
          sendNow,
          insuranceProvider,
          insuranceOtherExcess: insuranceOtherExcess.trim(),
          ...(handoverDepositAmount !== "" && {
            handoverDepositAmount: Number(handoverDepositAmount),
          }),
        }),
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

        <label className="text-white text-sm font-semibold mb-2 block">
          Who arranges the insurance?
        </label>
        <select
          value={insuranceProvider}
          onChange={(event) =>
            setInsuranceProvider(
              event.target.value as "" | "diba" | "customer",
            )
          }
          className="mb-4 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#fe9a00] focus:outline-none [&>option]:bg-[#1a2847]"
        >
          <option value="">Select insurance provider</option>
          <option value="diba">Diba Cooperation Ltd</option>
          <option value="customer">Customer&apos;s own insurance</option>
        </select>
        {insuranceProvider === "diba" && (
          <label className="mb-4 block">
            <span className="mb-2 block text-sm font-semibold text-white">
              Other Excess <span className="font-normal text-gray-400">(optional)</span>
            </span>
            <input
              value={insuranceOtherExcess}
              onChange={(event) => setInsuranceOtherExcess(event.target.value)}
              placeholder="e.g. £1,250 or N/A"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#fe9a00]"
            />
          </label>
        )}
        {insuranceProvider === "customer" && (
          <p className="-mt-2 mb-4 text-xs text-gray-400">
            The contract will use the customer&apos;s name from their driving
            licence.
          </p>
        )}

        <label className="mb-4 block">
          <span className="mb-2 block text-sm font-semibold text-white">
            Refundable handover deposit (£)
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={handoverDepositAmount}
            onChange={(event) => setHandoverDepositAmount(event.target.value)}
            placeholder="Uses category default when empty"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#fe9a00]"
          />
          <span className="mt-1.5 block text-xs text-gray-400">
            Optional booking override. Leave empty to use the category default.
          </span>
        </label>

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
            disabled={
              creating ||
              !bookingId ||
              !insuranceProvider
            }
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

  const timeline = [
    { label: "Created", value: contract.createdAt },
    { label: "Sent", value: docusign?.sentAt },
    { label: "Delivered", value: docusign?.deliveredAt },
    { label: "Viewed", value: docusign?.viewedAt },
    { label: "Completed", value: docusign?.completedAt },
  ];

  const documents = [
    {
      key: "source" as const,
      title:
        contract.contractType === "reservation_extension"
          ? "Extension agreement"
          : "Rental agreement",
      description:
        contract.contractType === "reservation_extension"
          ? "Unsigned extension confirmation"
          : "Unsigned source document",
      available: contract.files.source,
      completed: false,
    },
    {
      key: "signed" as const,
      title: "Signed agreement",
      description: "Customer-signed contract",
      available: contract.files.signed,
      completed: true,
    },
    {
      key: "certificate" as const,
      title: "Completion certificate",
      description: "DocuSign audit record",
      available: contract.files.certificate,
      completed: contract.files.certificate,
    },
  ];

  const warningReason = docusign?.declineReason || docusign?.voidReason;
  const warningLabel = docusign?.declineReason ? "Decline reason" : "Void reason";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#050914]/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="contract-detail-title"
        className="flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-white/10 bg-[#111b32] shadow-2xl shadow-black/50 sm:max-w-3xl sm:rounded-2xl"
      >
        <header className="relative shrink-0 overflow-hidden border-b border-white/10 bg-[#17243f] px-5 py-4 sm:px-6">
          <div className="absolute inset-y-0 left-0 w-1 bg-[#fe9a00]" />
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#fe9a00]/25 bg-[#fe9a00]/10 text-xl text-[#fe9a00]">
                <FiFileText />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Contract details
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h3
                    id="contract-detail-title"
                    className="break-all text-xl font-black tracking-tight text-white sm:text-2xl"
                  >
                    {contract.contractNumber}
                  </h3>
                  <StatusBadge status={contract.status} />
                </div>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close contract details"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#fe9a00]"
            >
              <FiX />
            </button>
          </div>
        </header>

        <div className="overflow-y-auto px-4 py-5 sm:px-6">
          {contract.contractType === "reservation_extension" &&
            contract.extension && (
              <section className="mb-4 rounded-xl border border-[#fe9a00]/25 bg-[#fe9a00]/[0.06] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#fe9a00]">
                      Rental extension
                    </p>
                    <h4 className="mt-1 text-base font-black text-white">
                      Updated return agreement
                    </h4>
                  </div>
                  <span className="text-lg font-black text-white">
                    £{Number(contract.extension.agreedPrice || 0).toFixed(2)}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 border-t border-white/10 pt-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-500">Previous return</p>
                    <p className="mt-1 font-semibold text-slate-100">
                      {contract.extension.previousReturnDateTime
                        ? formatDateTimeInLondon(
                            contract.extension.previousReturnDateTime,
                          )
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">New return</p>
                    <p className="mt-1 font-semibold text-slate-100">
                      {contract.extension.newReturnDateTime
                        ? formatDateTimeInLondon(
                            contract.extension.newReturnDateTime,
                          )
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Duration</p>
                    <p className="mt-1 font-semibold text-slate-100">
                      {contract.extension.durationLabel || "-"}
                    </p>
                  </div>
                </div>
                {contract.extension.customPriceApplied && (
                  <p className="mt-3 border-t border-white/10 pt-3 text-xs text-slate-400">
                    Custom price: {contract.extension.customPriceReason || "No reason recorded"}
                  </p>
                )}
              </section>
            )}
          <div className="grid gap-2.5 sm:grid-cols-3">
            {[
              {
                label: "Order ID",
                value: contract.bookingReference || "Not available",
                icon: FiHash,
              },
              { label: "Customer", value: contract.customerName, icon: FiUser },
              {
                label: "Vehicle",
                value: contract.vehicleLabel || "Not assigned",
                icon: FiTruck,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="min-w-0 rounded-xl border border-white/10 bg-white/[0.045] p-3.5"
              >
                <div className="mb-2 flex items-center gap-2 text-[#fe9a00]">
                  <Icon className="shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    {label}
                  </span>
                </div>
                <p className="break-words text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          <section className="mt-4 rounded-xl border border-white/10 bg-[#0d1629]/70 p-4">
            <h4 className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-slate-300">
              Contact & identifiers
            </h4>
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: "Email", value: contract.customerEmail, icon: FiMail },
                {
                  label: "Phone",
                  value: contract.customerPhone || "Not provided",
                  icon: FiPhone,
                },
                { label: "Booking ID", value: contract.bookingId, icon: FiHash },
                {
                  label: "Envelope ID",
                  value: docusign?.envelopeId || "Not sent yet",
                  icon: FiFileText,
                },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex min-w-0 items-start gap-2.5">
                  <Icon className="mt-0.5 shrink-0 text-slate-500" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-0.5 break-all text-sm font-medium text-slate-100">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/10 pt-3 text-sm">
              <span className="text-slate-400">DocuSign envelope status</span>
              <span className="font-bold capitalize text-white">
                {docusign?.envelopeStatus || "Not available"}
              </span>
            </div>
          </section>

          <section className="mt-4">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-white">DocuSign progress</h4>
                <p className="mt-0.5 text-xs text-slate-500">
                  Contract lifecycle and recorded timestamps
                </p>
              </div>
            </div>
            <div className="grid overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] sm:grid-cols-5">
              {timeline.map((step, index) => {
                const complete = Boolean(step.value);
                return (
                  <div
                    key={step.label}
                    className="relative flex items-center gap-3 border-b border-white/10 px-3 py-3 last:border-b-0 sm:block sm:border-b-0 sm:border-r sm:last:border-r-0"
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs ${
                        complete
                          ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-400"
                          : "border-white/10 bg-white/5 text-slate-600"
                      }`}
                    >
                      {complete ? <FiCheck /> : <FiClock />}
                    </div>
                    <div className="min-w-0 sm:mt-2">
                      <p className={`text-xs font-bold ${complete ? "text-slate-100" : "text-slate-500"}`}>
                        {step.label}
                      </p>
                      <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                        {complete ? formatDateTime(step.value) : index === 0 ? "Unavailable" : "Pending"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {warningReason && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-400/25 bg-red-500/10 p-4">
              <FiAlertTriangle className="mt-0.5 shrink-0 text-red-400" />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-red-300">
                  {warningLabel}
                </p>
                <p className="mt-1 break-words text-sm text-red-100">{warningReason}</p>
              </div>
            </div>
          )}

          <section className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-black text-white">Documents</h4>
              <span className="text-xs text-slate-500">
                {documents.filter((document) => document.available).length} of 3 available
              </span>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {documents.map((document) => (
                <button
                  key={document.key}
                  type="button"
                  disabled={!document.available}
                  onClick={() => onDownload(contract, document.key)}
                  className={`group flex min-h-24 items-center gap-3 rounded-xl border p-3.5 text-left transition focus:outline-none focus:ring-2 focus:ring-[#fe9a00] disabled:cursor-not-allowed disabled:opacity-45 ${
                    document.completed && document.available
                      ? "border-emerald-400/25 bg-emerald-400/[0.07] hover:bg-emerald-400/[0.12]"
                      : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      document.completed && document.available
                        ? "bg-emerald-400/15 text-emerald-400"
                        : "bg-white/[0.07] text-slate-300"
                    }`}
                  >
                    {document.available ? <FiDownload /> : <FiClock />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{document.title}</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                      {document.available ? document.description : "Not available yet"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {missingCompletedFiles && (
              <button
                type="button"
                onClick={onRetryDocuments}
                disabled={busy}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#fe9a00]/25 bg-[#fe9a00]/10 px-4 py-3 text-sm font-bold text-[#fe9a00] transition hover:bg-[#fe9a00]/15 focus:outline-none focus:ring-2 focus:ring-[#fe9a00] disabled:opacity-50"
              >
                <FiRefreshCw className={busy ? "animate-spin" : ""} />
                {busy ? "Fetching documents…" : "Fetch signed documents from DocuSign"}
              </button>
            )}
          </section>
        </div>

        <footer className="shrink-0 border-t border-white/10 bg-[#111b32]/95 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-white/[0.07] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-[#fe9a00]"
          >
            Close details
          </button>
        </footer>
      </section>
    </div>
  );
}
