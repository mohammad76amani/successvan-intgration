"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  FiX,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiClock,
  FiArrowRight,
  FiEye,
  FiGlobe,
  FiPlus,
  FiPrinter,
  FiDownload,
  FiAlertTriangle,
  FiRefreshCw,
  FiSmartphone,
} from "react-icons/fi";
import { showToast } from "@/lib/toast";
import DynamicTableView from "./DynamicTableView";
import ReservationDetailsModal from "./ReservationDetailsModal";
import { Reservation } from "@/types/type";
import CustomSelect from "@/components/ui/CustomSelect";
import { DateRange, Range } from "react-date-range";
import { usePriceCalculation } from "@/hooks/usePriceCalculation";
import TimeSelect from "@/components/ui/TimeSelect";
import { generateTimeSlots } from "@/utils/timeSlots";
import AddOnsModal from "@/components/global/AddOnsModal";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "./datepicker.css";
import AdminCreateReservationModal from "./AdminCreateReservationModal";
import ReservationOperationsPanel from "./ReservationOperationsPanel";
import {
  calculateOfficeExtensionPrices,
  findSpecialDayForDate,
  getSpecialDayPickupWindow,
  getSpecialDayReturnWindow,
  getWorkingDayTimeSlots,
  getWorkingDayWindow,
  isSameCalendarDate,
} from "@/lib/specialDaySchedule";
import { printReservationReceipt } from "@/lib/printReservation";
import { clientAuthHeaders } from "@/lib/client-auth";
import type { SafeContractSummary } from "@/lib/docusign/types";
import {
  ADMIN_STATUS_OPTIONS,
  DEPOSIT_OPTION_LABELS,
  statusBadgeClasses,
  statusLabel,
} from "@/lib/reservation-status";
import {
  createLondonDateTime,
  formatDateForStorage,
  formatDateInputInLondon,
  parseStorageDate,
} from "@/lib/englandTime";

type MutateFn = () => Promise<void>;

const formatLondonDate = (value: string) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        timeZone: "Europe/London",
      })
    : "-";

const formatLondonTime = (value: string | Date) =>
  value
    ? new Date(value).toLocaleTimeString("en-GB", {
        timeZone: "Europe/London",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "-";

const isImageFileUrl = (url: string) =>
  /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(url);

function DepositVerificationBadge({
  reservation,
}: {
  reservation?: Reservation;
}) {
  const deposit = reservation?.deposit;

  if (!deposit?.status || deposit.status === "not_paid") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 shadow-sm ring-1 ring-inset ring-white/[0.03]">
        <FiClock className="text-xs" />
        Not paid
      </span>
    );
  }

  if (deposit.status === "pending" && deposit.receiptUrl) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#fe9a00]/30 bg-[#fe9a00]/15 px-2.5 py-1.5 text-[11px] font-bold text-[#ffb347] shadow-[0_4px_18px_rgba(254,154,0,0.10)] ring-1 ring-inset ring-[#fe9a00]/10">
        <FiClock className="text-xs" />
        Receipt uploaded
      </span>
    );
  }

  if (deposit.status === "paid") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300 shadow-sm ring-1 ring-inset ring-emerald-400/5">
        <FiCheck className="text-xs" />
        Verified
      </span>
    );
  }

  if (deposit.status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/20 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-300 shadow-sm ring-1 ring-inset ring-red-400/5">
        <FiX className="text-xs" />
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-sky-300 shadow-sm ring-1 ring-inset ring-sky-400/5 capitalize">
      {deposit.status.replace(/_/g, " ")}
    </span>
  );
}

type VehicleOption = {
  _id: string;
  name: string;
  keyNumber: string;
  category: string;
  gear: string;
  available: boolean;
  disabled?: boolean;
};

const ADMIN_FLOW_STEPS = [
  "pending",
  "confirmed",
  "deposit_pending",
  "deposit_paid",
  "contract_pending",
  "contract_signed",
  "handover_in_progress",
  "delivered",
  "vehicle_returned",
  "return_inspection",
  "deposit_review",
  "refund_processing",
  "completed",
] as const;

const statusFlowIndex = (status?: string) =>
  Math.max(
    0,
    ADMIN_FLOW_STEPS.findIndex((step) => step === status),
  );

function ReservationStepManagerModal({
  reservation,
  isOpen,
  onClose,
  onStatusChange,
  onVerifyDeposit,
  depositBusy,
  depositTransactionRef,
  setDepositTransactionRef,
  depositFailureReason,
  setDepositFailureReason,
  cancelReason,
  setCancelReason,
  vehicles,
  selectedVehicle,
  setSelectedVehicle,
  loadingVehicles,
  onAssignVehicle,
  onReservationUpdated,
  isSubmitting,
}: {
  reservation: Reservation | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (
    reservation: Reservation,
    status: Reservation["status"],
    extra?: Record<string, unknown>,
  ) => Promise<void>;
  onVerifyDeposit: (
    reservation: Reservation,
    action: "approve" | "reject",
  ) => Promise<void>;
  depositBusy: boolean;
  depositTransactionRef: string;
  setDepositTransactionRef: (value: string) => void;
  depositFailureReason: string;
  setDepositFailureReason: (value: string) => void;
  cancelReason: string;
  setCancelReason: (value: string) => void;
  vehicles: VehicleOption[];
  selectedVehicle: string;
  setSelectedVehicle: (value: string) => void;
  loadingVehicles: boolean;
  onAssignVehicle: (reservation: Reservation) => Promise<void>;
  onReservationUpdated: (reservation: Reservation) => void;
  isSubmitting: boolean;
}) {
  const [isReservationDetailsOpen, setIsReservationDetailsOpen] =
    useState(false);
  const [actionContract, setActionContract] =
    useState<SafeContractSummary | null>(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractDocumentBusy, setContractDocumentBusy] = useState(false);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!isOpen || !reservation?._id) {
      setActionContract(null);
      return;
    }

    const bookingId = reservation._id;
    const controller = new AbortController();
    const fetchContract = async () => {
      setContractLoading(true);
      try {
        const params = new URLSearchParams({
          bookingId,
          limit: "1",
        });
        const res = await fetch(`/api/admin/contracts?${params.toString()}`, {
          headers: clientAuthHeaders(),
          signal: controller.signal,
        });
        const payload = await res.json();
        if (!payload.success)
          throw new Error(payload.error || "Request failed");
        setActionContract(
          Array.isArray(payload.data) ? payload.data[0] || null : null,
        );
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setActionContract(null);
        }
      } finally {
        if (!controller.signal.aborted) setContractLoading(false);
      }
    };

    void fetchContract();
    return () => controller.abort();
  }, [isOpen, reservation?._id, reservation?.status]);

  if (!isOpen || !reservation) return null;

  const currentIndex = statusFlowIndex(reservation.status);
  const deposit = reservation.deposit;
  const depositOption = deposit?.option
    ? DEPOSIT_OPTION_LABELS[deposit.option]
    : "Not selected";
  const savedPriceAdjustment = deposit?.priceAdjustment;
  const savedAdjustmentStatus = savedPriceAdjustment?.status;
  const savedAdjustmentAmount =
    savedAdjustmentStatus === "payment_due"
      ? Number(savedPriceAdjustment?.balanceDue || 0)
      : savedAdjustmentStatus === "credit_due"
        ? Number(savedPriceAdjustment?.creditAmount || 0)
        : 0;
  const canAssignVehicle =
    reservation.status === "deposit_paid" ||
    deposit?.status === "paid" ||
    deposit?.option === "office";

  const nextButtons: Partial<
    Record<
      Reservation["status"],
      {
        label: string;
        next: Reservation["status"];
        note: string;
      }
    >
  > = {
    contract_signed: {
      label: "Start handover",
      next: "handover_in_progress",
      note: "Use this when the customer arrives and the contract is signed.",
    },
    handover_in_progress: {
      label: "Mark vehicle collected",
      next: "delivered",
      note: "This starts the active rental step.",
    },
    delivered: {
      label: "Mark vehicle returned",
      next: "vehicle_returned",
      note: "Use this when the van is back.",
    },
    vehicle_returned: {
      label: "Start return inspection",
      next: "return_inspection",
      note: "Inspection and charge details can be expanded later.",
    },
    return_inspection: {
      label: "Move to deposit review",
      next: "deposit_review",
      note: "Review fuel, late, cleaning and damage charges.",
    },
    deposit_review: {
      label: "Start refund processing",
      next: "refund_processing",
      note: "Use this when deductions are ready.",
    },
    refund_processing: {
      label: "Complete reservation",
      next: "completed",
      note: "Use this after the refund has been sent.",
    },
  };

  const laterStep = nextButtons[reservation.status];
  const showOperationsPanel = [
    "contract_signed",
    "ready_for_collection",
    "handover_in_progress",
    "delivered",
    "vehicle_returned",
    "return_inspection",
    "deposit_review",
    "refund_processing",
  ].includes(reservation.status);
  const downloadActionContract = (
    kind: "source" | "signed" | "certificate" = "source",
  ) => {
    if (!actionContract) return;
    const token = localStorage.getItem("token") || "";
    window.open(
      `/api/admin/contracts/${actionContract._id}/document?type=${kind}&token=${encodeURIComponent(token)}`,
      "_blank",
    );
  };
  const fetchSignedContractDocuments = async () => {
    if (!actionContract) return;
    setContractDocumentBusy(true);
    try {
      const response = await fetch(
        `/api/admin/contracts/${actionContract._id}/retry-documents`,
        {
          method: "POST",
          headers: clientAuthHeaders(true),
        },
      );
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Could not fetch signed contract");
      }
      setActionContract(payload.data as SafeContractSummary);
      showToast.success("Signed contract documents are ready");
    } catch (error) {
      showToast.error(
        error instanceof Error
          ? error.message
          : "Could not fetch signed contract",
      );
    } finally {
      setContractDocumentBusy(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-5">
        <div className="max-h-[96dvh] w-full max-w-4xl overscroll-contain overflow-y-auto rounded-t-[28px] border border-white/10 bg-linear-to-b from-[#101a31]/98 to-[#070d19]/98 shadow-[0_30px_100px_rgba(0,0,0,0.60)] ring-1 ring-inset ring-white/[0.04] sm:max-h-[92vh] sm:rounded-[28px]">
          <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-white/10 bg-[#0b1224]/85 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:gap-4 sm:p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#fe9a00]">
                Admin step manager
              </p>
              <h2 className="mt-1 break-all text-xl font-black text-white sm:text-2xl">
                {reservation.reservationCode || reservation._id}
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                {reservation.user?.name || "Customer"} ·{" "}
                {reservation.category?.name || "Reservation"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-gray-300 shadow-sm transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-95 active:bg-white/15"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          <div className="space-y-4 p-3 sm:space-y-5 sm:p-6">
            <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/[0.075] to-white/[0.025] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.16)] ring-1 ring-inset ring-white/[0.025] sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-400">Current status</p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClasses(reservation.status)}`}
                  >
                    {statusLabel(reservation.status, true)}
                  </span>
                </div>
                <button
                  onClick={() => setIsReservationDetailsOpen(true)}
                  className="min-h-11 w-full touch-manipulation rounded-xl border border-[#fe9a00]/30 bg-[#fe9a00]/15 px-4 py-2.5 text-sm font-bold text-[#fe9a00] transition hover:bg-[#fe9a00]/25 active:bg-[#fe9a00]/30 sm:w-auto"
                >
                  View reservation details
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-3 lg:grid-cols-5">
                {ADMIN_FLOW_STEPS.map((step, index) => {
                  const state =
                    index < currentIndex
                      ? "done"
                      : index === currentIndex
                        ? "current"
                        : "upcoming";
                  return (
                    <div
                      key={step}
                      className={`min-h-[76px] rounded-xl border p-3.5 shadow-sm transition-all duration-200 ${
                        state === "done"
                          ? "border-emerald-400/25 bg-emerald-500/[0.09] text-emerald-200 ring-1 ring-inset ring-emerald-400/[0.04]"
                          : state === "current"
                            ? "border-[#fe9a00]/45 bg-[#fe9a00]/[0.14] text-[#ffad33] shadow-[0_8px_24px_rgba(254,154,0,0.10)] ring-1 ring-inset ring-[#fe9a00]/10"
                            : "border-white/[0.08] bg-white/[0.02] text-slate-500 ring-1 ring-inset ring-white/[0.015]"
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wide">
                        Step {index + 1}
                      </p>
                      <p className="mt-1 text-xs font-semibold">
                        {statusLabel(step, true)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {(contractLoading || actionContract) && (
                <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#050a14]/45 p-4 shadow-inner ring-1 ring-inset ring-white/[0.025] sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">
                      Contract document
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {contractLoading
                        ? "Checking contract document..."
                        : `Contract ${actionContract?.contractNumber || ""} is available for this reservation.`}
                    </p>
                  </div>
                  {actionContract && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                      {actionContract.files.signed && (
                        <button
                          type="button"
                          onClick={() => downloadActionContract("signed")}
                          className="inline-flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2.5 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/25 active:bg-emerald-500/30 sm:w-auto"
                        >
                          <FiEye />
                          View signed contract
                        </button>
                      )}
                      {actionContract.files.source && (
                        <button
                          type="button"
                          onClick={() => downloadActionContract("source")}
                          className="inline-flex items-center justify-center gap-2 min-h-11 w-full touch-manipulation rounded-xl border border-[#fe9a00]/30 bg-[#fe9a00]/15 px-4 py-2.5 text-sm font-bold text-[#fe9a00] transition hover:bg-[#fe9a00]/25 active:bg-[#fe9a00]/30 sm:w-auto"
                        >
                          <FiDownload />
                          Unsigned contract
                        </button>
                      )}
                      {actionContract.files.certificate && (
                        <button
                          type="button"
                          onClick={() => downloadActionContract("certificate")}
                          className="inline-flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20 active:bg-white/25 sm:w-auto"
                        >
                          <FiDownload />
                          Certificate
                        </button>
                      )}
                      {actionContract.status === "completed" &&
                        !actionContract.files.signed && (
                          <button
                            type="button"
                            disabled={contractDocumentBusy}
                            onClick={fetchSignedContractDocuments}
                            className="inline-flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2.5 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/25 active:bg-emerald-500/30 sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <FiRefreshCw
                              className={
                                contractDocumentBusy ? "animate-spin" : ""
                              }
                            />
                            {contractDocumentBusy
                              ? "Fetching signed contract"
                              : "Fetch signed contract"}
                          </button>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {reservation.status === "pending" && (
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/[0.075] to-white/[0.025] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.16)] ring-1 ring-inset ring-white/[0.025] sm:p-5">
                  <h3 className="text-lg font-bold text-white">
                    Review booking
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Confirm the reservation when the details are OK. The
                    customer will then continue to the deposit step.
                  </p>
                  <button
                    disabled={isSubmitting}
                    onClick={() =>
                      onStatusChange(reservation, "deposit_pending")
                    }
                    className="mt-4 min-h-11 w-full touch-manipulation rounded-xl border border-[#ffb247]/30 bg-linear-to-r from-[#fe9a00] to-[#ff7a00] px-4 py-3 text-sm font-black text-white shadow-[0_10px_28px_rgba(254,154,0,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(254,154,0,0.25)] active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isSubmitting ? "Confirming..." : "Confirm booking"}
                  </button>
                </div>

                <div className="rounded-2xl border border-red-400/20 bg-linear-to-br from-red-500/[0.13] to-red-500/[0.055] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.16)] ring-1 ring-inset ring-red-300/[0.04] sm:p-5">
                  <h3 className="text-lg font-bold text-red-100">
                    Cancel reservation
                  </h3>
                  <textarea
                    value={cancelReason}
                    onChange={(event) => setCancelReason(event.target.value)}
                    rows={3}
                    placeholder="Reason shown in admin record"
                    className="mt-3 min-h-24 w-full resize-none rounded-xl border border-white/10 bg-[#070d19]/75 px-3.5 py-3 text-sm text-white shadow-inner outline-none placeholder:text-slate-500 transition focus:border-red-300/70 focus:ring-4 focus:ring-red-300/10"
                  />
                  <button
                    disabled={isSubmitting || !cancelReason.trim()}
                    onClick={() =>
                      onStatusChange(reservation, "canceled", {
                        cancelReason: cancelReason.trim(),
                      })
                    }
                    className="mt-3 min-h-11 w-full touch-manipulation rounded-xl border border-red-400/20 bg-red-500/15 px-4 py-3 text-sm font-bold text-red-200 shadow-sm transition-all duration-200 hover:border-red-400/30 hover:bg-red-500/25 active:scale-[0.99] disabled:opacity-50"
                  >
                    Cancel with reason
                  </button>
                </div>
              </div>
            )}

            {(reservation.status === "confirmed" ||
              reservation.status === "deposit_pending") && (
              <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/[0.075] to-white/[0.025] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.16)] ring-1 ring-inset ring-white/[0.025] sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Deposit step
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                      Customer option:{" "}
                      <span className="font-semibold text-white">
                        {depositOption}
                      </span>
                      {deposit?.amount !== undefined
                        ? ` · £${deposit.amount}`
                        : ""}
                    </p>
                  </div>
                  <DepositVerificationBadge reservation={reservation} />
                </div>

                {deposit?.receiptUrl && (
                  <div className="mt-4 rounded-xl border border-[#fe9a00]/20 bg-[#fe9a00]/10 p-3 sm:p-4">
                    <div className="flex items-start gap-3 sm:items-center">
                      {isImageFileUrl(deposit.receiptUrl) ? (
                        <button
                          type="button"
                          onClick={() =>
                            setReceiptPreviewUrl(deposit.receiptUrl!)
                          }
                          className="group relative h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-black/30"
                          aria-label="Preview uploaded receipt"
                        >
                          <img
                            src={deposit.receiptUrl}
                            alt="Uploaded deposit receipt"
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />
                          <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center text-[10px] font-bold text-white">
                            View receipt
                          </span>
                        </button>
                      ) : (
                        <a
                          href={deposit.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-20 w-24 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-black/30 px-2 text-center text-xs font-bold text-[#fe9a00]"
                        >
                          View receipt file
                        </a>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#fe9a00]">
                          Receipt awaiting review
                        </p>
                        {deposit.receiptUploadedAt && (
                          <p className="mt-1 text-xs text-gray-400">
                            Uploaded{" "}
                            {new Date(deposit.receiptUploadedAt).toLocaleString(
                              "en-GB",
                            )}
                          </p>
                        )}
                        {deposit.transactionRef && (
                          <p className="mt-1 truncate text-xs text-gray-400">
                            Ref: {deposit.transactionRef}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {deposit?.status === "pending" && deposit.receiptUrl ? (
                  <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                    <input
                      value={depositTransactionRef}
                      onChange={(event) =>
                        setDepositTransactionRef(event.target.value)
                      }
                      placeholder="Transaction reference (optional)"
                      className="min-h-11 w-full rounded-xl border border-white/10 bg-[#070d19]/75 px-3.5 py-2.5 text-sm text-white shadow-inner outline-none placeholder:text-slate-500 transition focus:border-[#fe9a00]/70 focus:ring-4 focus:ring-[#fe9a00]/10"
                    />
                    <textarea
                      value={depositFailureReason}
                      onChange={(event) =>
                        setDepositFailureReason(event.target.value)
                      }
                      rows={2}
                      placeholder="Refuse reason (required when refusing)"
                      className="w-full resize-none rounded-xl border border-white/10 bg-[#070d19]/75 px-3.5 py-2.5 text-sm text-white shadow-inner outline-none placeholder:text-slate-500 transition focus:border-[#fe9a00]/70 focus:ring-4 focus:ring-[#fe9a00]/10"
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        disabled={depositBusy}
                        onClick={() => onVerifyDeposit(reservation, "reject")}
                        className="min-h-11 touch-manipulation rounded-xl border border-red-400/20 bg-red-500/[0.11] px-4 py-3 text-sm font-bold text-red-200 shadow-sm transition-all duration-200 hover:border-red-400/30 hover:bg-red-500/20 active:scale-[0.99] disabled:opacity-50"
                      >
                        Refuse deposit
                      </button>
                      <button
                        disabled={depositBusy}
                        onClick={() => onVerifyDeposit(reservation, "approve")}
                        className="min-h-11 touch-manipulation rounded-xl border border-emerald-400/20 bg-emerald-500/15 px-4 py-3 text-sm font-bold text-emerald-200 shadow-sm transition-all duration-200 hover:border-emerald-400/30 hover:bg-emerald-500/25 active:scale-[0.99] disabled:opacity-50"
                      >
                        Accept deposit
                      </button>
                    </div>
                  </div>
                ) : !deposit?.receiptUrl ? (
                  <p className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-gray-300">
                    Waiting for the customer to choose a deposit option and
                    upload payment receipt. If they choose office pay, continue
                    from vehicle assignment when they arrive.
                  </p>
                ) : null}
              </div>
            )}

            {canAssignVehicle &&
              (reservation.status === "deposit_paid" ||
                reservation.status === "deposit_pending" ||
                reservation.status === "confirmed") && (
                <div className="rounded-2xl border border-[#fe9a00]/20 bg-linear-to-br from-[#fe9a00]/[0.13] to-[#fe9a00]/[0.045] p-4 shadow-[0_12px_36px_rgba(254,154,0,0.06)] ring-1 ring-inset ring-[#fe9a00]/[0.05] sm:p-5">
                  <h3 className="text-lg font-bold text-white">
                    Assign vehicle & create contract
                  </h3>
                  <p className="mt-1 text-sm text-gray-300">
                    Assigning the van will create the contract automatically and
                    move the customer to the signing step.
                  </p>
                  {savedPriceAdjustment && (
                    <div
                      className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${
                        savedAdjustmentStatus === "payment_due"
                          ? "border-[#fe9a00]/30 bg-[#fe9a00]/10"
                          : "border-emerald-400/25 bg-emerald-400/10"
                      }`}
                    >
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Saved payment reconciliation
                        </p>
                        <p
                          className={`mt-0.5 text-xs font-semibold ${
                            savedAdjustmentStatus === "payment_due"
                              ? "text-orange-200"
                              : "text-emerald-200"
                          }`}
                        >
                          {savedAdjustmentStatus === "payment_due"
                            ? "Additional payment due"
                            : savedAdjustmentStatus === "credit_due"
                              ? "Customer credit"
                              : "Payment balanced"}
                        </p>
                      </div>
                      <p
                        className={`font-black tabular-nums ${
                          savedAdjustmentStatus === "payment_due"
                            ? "text-[#fe9a00]"
                            : "text-emerald-300"
                        }`}
                      >
                        £{savedAdjustmentAmount.toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div className="mt-4 space-y-4">
                    <CustomSelect
                      options={vehicles}
                      value={selectedVehicle}
                      onChange={setSelectedVehicle}
                      placeholder={
                        loadingVehicles
                          ? "Loading vehicles..."
                          : "Select vehicle"
                      }
                      disabled={isSubmitting}
                    />
                    {!loadingVehicles && vehicles.length === 0 && (
                      <p className="text-xs text-yellow-300">
                        No vehicles found for this category.
                      </p>
                    )}
                    <button
                      disabled={isSubmitting || !selectedVehicle}
                      onClick={() => onAssignVehicle(reservation)}
                      className="min-h-11 w-full touch-manipulation rounded-xl border border-[#ffb247]/30 bg-linear-to-r from-[#fe9a00] to-[#ff7a00] px-4 py-3 text-sm font-black text-white shadow-[0_10px_28px_rgba(254,154,0,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(254,154,0,0.25)] active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
                    >
                      {isSubmitting
                        ? "Assigning vehicle & creating contract..."
                        : "Assign vehicle & generate contract"}
                    </button>
                  </div>
                </div>
              )}

            {reservation.status === "contract_pending" && (
              <div className="rounded-2xl border border-[#fe9a00]/20 bg-linear-to-br from-[#fe9a00]/[0.13] to-[#fe9a00]/[0.045] p-4 shadow-[0_12px_36px_rgba(254,154,0,0.06)] ring-1 ring-inset ring-[#fe9a00]/[0.05] sm:p-5">
                <h3 className="text-lg font-bold text-white">
                  Waiting for contract signature
                </h3>
                <p className="mt-1 text-sm text-gray-300">
                  The contract has been generated. The customer needs to sign it
                  in DocuSign. When DocuSign confirms completion, the status
                  will update to signed.
                </p>
                {actionContract?.files.source && (
                  <button
                    type="button"
                    onClick={() => downloadActionContract("source")}
                    className="mt-4 inline-flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20 active:bg-white/25 sm:w-auto"
                  >
                    <FiDownload />
                    Download contract
                  </button>
                )}
              </div>
            )}

            {laterStep && !showOperationsPanel && (
              <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/[0.075] to-white/[0.025] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.16)] ring-1 ring-inset ring-white/[0.025] sm:p-5">
                <h3 className="text-lg font-bold text-white">
                  Next admin step
                </h3>
                <p className="mt-1 text-sm text-gray-400">{laterStep.note}</p>
                <button
                  disabled={isSubmitting}
                  onClick={() => onStatusChange(reservation, laterStep.next)}
                  className="mt-4 min-h-11 w-full touch-manipulation rounded-xl border border-[#ffb247]/30 bg-linear-to-r from-[#fe9a00] to-[#ff7a00] px-4 py-3 text-sm font-black text-white shadow-[0_10px_28px_rgba(254,154,0,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(254,154,0,0.25)] active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
                >
                  {laterStep.label}
                </button>
              </div>
            )}

            <ReservationOperationsPanel
              reservation={reservation}
              onUpdated={onReservationUpdated}
            />
          </div>
        </div>
      </div>

      <ReservationDetailsModal
        reservation={reservation}
        isOpen={isReservationDetailsOpen}
        onClose={() => setIsReservationDetailsOpen(false)}
        layerClassName="z-[80]"
      />
      {receiptPreviewUrl && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/85 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-4xl rounded-t-2xl border border-white/10 bg-[#0b1224] p-3 shadow-2xl sm:rounded-2xl sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-bold text-white">Deposit receipt</p>
              <button
                type="button"
                onClick={() => setReceiptPreviewUrl(null)}
                className="min-h-10 touch-manipulation rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 active:bg-white/25"
              >
                Close
              </button>
            </div>
            <img
              src={receiptPreviewUrl}
              alt="Deposit receipt preview"
              className="max-h-[78dvh] w-full rounded-xl object-contain sm:max-h-[76vh]"
            />
          </div>
        </div>
      )}
    </>
  );
}

const getReservationDateForEdit = (
  reservation: Reservation,
  type: "start" | "end",
) => {
  const storedDate = parseStorageDate(
    type === "start"
      ? reservation.startDateDisplay
      : reservation.endDateDisplay,
  );

  if (storedDate) return storedDate;

  const sourceDate =
    type === "start" ? reservation.startDate : reservation.endDate;
  const londonDate = parseStorageDate(formatDateInputInLondon(sourceDate));

  return londonDate || new Date(sourceDate);
};

export default function ReservationsManagement() {
  const mutateRef = useRef<MutateFn | null>(null);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [stepManagerReservation, setStepManagerReservation] =
    useState<Reservation | null>(null);
  const [isStepManagerOpen, setIsStepManagerOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEditDatesOpen, setIsEditDatesOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [depositTransactionRef, setDepositTransactionRef] = useState("");
  const [depositFailureReason, setDepositFailureReason] = useState("");
  const [depositBusy, setDepositBusy] = useState(false);
  const [newVehicle, setNewVehicle] = useState("");
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [users, setUsers] = useState<{ _id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<
    {
      _id: string;
      name: string;
      pricingTiers?: any[];
      extrahoursRate?: number;
      selloffer?: number;
      gear?: any;
    }[]
  >([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [showDateRange, setShowDateRange] = useState(false);
  const [editDateRange, setEditDateRange] = useState<Range[]>([
    {
      startDate: new Date(),
      endDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
      key: "selection",
    },
  ]);
  const [editTimes, setEditTimes] = useState({
    startTime: "10:00",
    endTime: "10:00",
  });
  const [editCategory, setEditCategory] = useState("");
  const [pickupExtensionPrice, setPickupExtensionPrice] = useState(0);
  const [returnExtensionPrice, setReturnExtensionPrice] = useState(0);
  const [isManualExtension, setIsManualExtension] = useState(false);
  const [addOnsCost, setAddOnsCost] = useState(0);
  const [startDateReservedSlots, setStartDateReservedSlots] = useState<any[]>(
    [],
  );
  const [showCreateReservation, setShowCreateReservation] = useState(false);
  const [endDateReservedSlots, setEndDateReservedSlots] = useState<any[]>([]);
  const [showAddOnsModal, setShowAddOnsModal] = useState(false);
  const [addOns, setAddOns] = useState<any[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<
    { addOn: string; quantity: number; selectedTierIndex?: number }[]
  >([]);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedReservationForDetails, setSelectedReservationForDetails] =
    useState<Reservation | null>(null);
  const [selectedGear, setSelectedGear] = useState<"manual" | "automatic" | "">(
    "",
  );
  const [gearExtraCost, setGearExtraCost] = useState(0);
  const [isManualPrice, setIsManualPrice] = useState(false);
  const [manualPricePerDay, setManualPricePerDay] = useState("");
  const [manualPriceNote, setManualPriceNote] = useState("");
  const [isTotalPriceOverride, setIsTotalPriceOverride] = useState(false);
  const [manualTotalPrice, setManualTotalPrice] = useState("");
  // Per-invoice: reservation has no price until it is completed.
  const [editPerInvoice, setEditPerInvoice] = useState(false);
  const [isPerInvoicePriceOpen, setIsPerInvoicePriceOpen] = useState(false);
  const [perInvoicePrice, setPerInvoicePrice] = useState("");

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c._id === editCategory);
  }, [editCategory, categories]);

  const hasBothGearTypes = useMemo(() => {
    return (
      selectedCategory?.gear?.availableTypes?.length === 2 ||
      (selectedCategory?.gear?.availableTypes?.includes("manual") &&
        selectedCategory?.gear?.availableTypes?.includes("automatic"))
    );
  }, [selectedCategory]);

  const filteredVehicles = useMemo(() => {
    const inCategory = editCategory
      ? vehicles.filter((v) => v.category === editCategory)
      : vehicles;
    // Don't hard-filter out unavailable vehicles: that left the dropdown
    // silently empty whenever a category's vehicles were all in use. Instead
    // list available ones first and disable the rest so the reason is visible.
    return [...inCategory]
      .sort((a, b) => Number(b.available) - Number(a.available))
      .map((v) => ({
        ...v,
        name: v.available ? v.name : `${v.name} — in use`,
        disabled: !v.available,
      }));
  }, [vehicles, editCategory]);

  const pickupTimeSlots = useMemo(() => {
    if (!selectedReservation?.office || !editDateRange[0].startDate) return [];
    const office = offices.find(
      (o) => o._id === (selectedReservation.office as any)?._id,
    );
    if (!office) return [];

    const date = editDateRange[0].startDate;
    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][date.getDay()];

    const specialDay = findSpecialDayForDate(office.specialDays, date);
    let start = "00:00",
      end = "23:59";
    let slots: string[] = [];

    if (specialDay && specialDay.isOpen) {
      const pickupWindow = getSpecialDayPickupWindow(specialDay);
      start = pickupWindow.startTime;
      end = pickupWindow.endTime;
      slots = generateTimeSlots(start, end, 15);
    } else {
      const workingDay = office.workingTime?.find(
        (w: any) => w.day === dayName && w.isOpen,
      );
      if (workingDay) {
        slots = getWorkingDayTimeSlots(workingDay, "pickup", 15);
      } else {
        slots = generateTimeSlots(start, end, 15);
      }
    }

    // Admin can pick up at any time from 06:00 to 23:45 regardless of office
    // working hours; extension is charged manually.
    slots = generateTimeSlots("06:00", "23:45", 15);

    if (
      editDateRange[0].endDate &&
      editDateRange[0].startDate.toDateString() ===
        editDateRange[0].endDate.toDateString() &&
      editTimes.endTime
    ) {
      const [returnHour, returnMin] = editTimes.endTime.split(":").map(Number);
      const maxPickupMinutes = returnHour * 60 + returnMin - 6 * 60;
      slots =
        maxPickupMinutes < 0
          ? []
          : slots.filter((slot) => {
              const [hour, min] = slot.split(":").map(Number);
              return hour * 60 + min <= maxPickupMinutes;
            });
    }

    return slots;
  }, [selectedReservation, editDateRange, offices, editTimes.endTime]);

  const returnTimeSlots = useMemo(() => {
    if (!selectedReservation?.office || !editDateRange[0].endDate) return [];
    const office = offices.find(
      (o) => o._id === (selectedReservation.office as any)?._id,
    );
    if (!office) return [];

    const date = editDateRange[0].endDate;
    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][date.getDay()];

    const specialDay = findSpecialDayForDate(office.specialDays, date);
    let start = "00:00",
      end = "23:59";
    let slots: string[] = [];

    if (specialDay && specialDay.isOpen) {
      const returnWindow = getSpecialDayReturnWindow(specialDay);
      start = returnWindow.startTime;
      end = returnWindow.endTime;
      slots = generateTimeSlots(start, end, 15);
    } else {
      const workingDay = office.workingTime?.find(
        (w: any) => w.day === dayName && w.isOpen,
      );
      if (workingDay) {
        slots = getWorkingDayTimeSlots(workingDay, "return", 15);
      } else {
        slots = generateTimeSlots(start, end, 15);
      }
    }

    // Admin can return at any time from 06:00 to 23:45 regardless of office
    // working hours; extension is charged manually.
    slots = generateTimeSlots("06:00", "23:45", 15);

    if (
      editDateRange[0].startDate &&
      editDateRange[0].startDate.toDateString() ===
        editDateRange[0].endDate.toDateString() &&
      editTimes.startTime
    ) {
      const [pickupHour, pickupMin] = editTimes.startTime
        .split(":")
        .map(Number);
      const minReturnMinutes = pickupHour * 60 + pickupMin + 6 * 60;
      slots =
        minReturnMinutes > 1439
          ? []
          : slots.filter((slot) => {
              const [hour, min] = slot.split(":").map(Number);
              return hour * 60 + min >= minReturnMinutes;
            });
    }

    return slots;
  }, [selectedReservation, editDateRange, offices, editTimes.startTime]);

  const isDateDisabled = useMemo(() => {
    return (date: Date): boolean => {
      if (!selectedReservation?.office) return false;
      const office = offices.find(
        (o) => o._id === (selectedReservation.office as any)?._id,
      );
      if (!office) return false;
      const dayName = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ][date.getDay()];
      const specialDay = findSpecialDayForDate(office.specialDays, date);
      if (specialDay) return !specialDay.isOpen;
      const workingDay = office.workingTime?.find(
        (w: any) => w.day === dayName,
      );
      if (workingDay && !workingDay.isOpen) return true;
      return false;
    };
  }, [selectedReservation, offices]);

  const priceCalc = usePriceCalculation(
    editDateRange[0].startDate && editTimes.startTime
      ? createLondonDateTime(editDateRange[0].startDate, editTimes.startTime)
      : "",
    editDateRange[0].endDate && editTimes.endTime
      ? createLondonDateTime(editDateRange[0].endDate, editTimes.endTime)
      : "",
    selectedCategory?.pricingTiers || [],
    selectedCategory?.extrahoursRate || 0,
    pickupExtensionPrice,
    returnExtensionPrice,
    gearExtraCost,
    addOnsCost,
    selectedCategory?.selloffer || 0,
  );

  const editFinalPrice = useMemo(() => {
    if (!priceCalc) return null;

    if (isTotalPriceOverride) {
      const overridePrice = parseFloat(manualTotalPrice);
      if (!isNaN(overridePrice) && overridePrice >= 0) {
        return parseFloat(overridePrice.toFixed(2));
      }
    }

    if (isManualPrice) {
      const manualDailyPrice = parseFloat(manualPricePerDay);
      if (!isNaN(manualDailyPrice) && manualDailyPrice > 0) {
        const daysPrice = priceCalc.totalDays * manualDailyPrice;
        const extraHoursPrice =
          priceCalc.extraHours * (selectedCategory?.extrahoursRate || 0);
        const automaticGearPrice =
          selectedGear === "automatic" && hasBothGearTypes
            ? (selectedCategory?.gear?.automaticExtraCost || 0) *
              priceCalc.totalDays
            : 0;

        const total =
          daysPrice +
          extraHoursPrice +
          pickupExtensionPrice +
          returnExtensionPrice +
          automaticGearPrice +
          addOnsCost;

        return parseFloat(total.toFixed(2));
      }
    }

    return priceCalc.totalPrice;
  }, [
    priceCalc,
    isTotalPriceOverride,
    manualTotalPrice,
    isManualPrice,
    manualPricePerDay,
    selectedCategory,
    selectedGear,
    hasBothGearTypes,
    pickupExtensionPrice,
    returnExtensionPrice,
    addOnsCost,
  ]);

  const editPriceBreakdown = useMemo(() => {
    if (!priceCalc) return "";

    if (isTotalPriceOverride) {
      const overridePrice = parseFloat(manualTotalPrice);
      if (!isNaN(overridePrice) && overridePrice >= 0) {
        return `Admin total override: £${overridePrice.toFixed(2)}`;
      }
    }

    if (isManualPrice) {
      const manualDailyPrice = parseFloat(manualPricePerDay);
      if (!isNaN(manualDailyPrice) && manualDailyPrice > 0) {
        const parts = [
          `${priceCalc.totalDays} day${
            priceCalc.totalDays > 1 ? "s" : ""
          } × £${manualDailyPrice.toFixed(2)}/day`,
        ];

        if (priceCalc.extraHours > 0) {
          parts.push(
            `${priceCalc.extraHours}h × £${(
              selectedCategory?.extrahoursRate || 0
            ).toFixed(2)}/hr`,
          );
        }

        if (pickupExtensionPrice > 0) {
          parts.push(
            `pickup extension £${pickupExtensionPrice.toFixed(2)} - either out of working time or weekend time`,
          );
        }

        if (returnExtensionPrice > 0) {
          parts.push(
            `return extension £${returnExtensionPrice.toFixed(2)} - either out of working time or weekend time`,
          );
        }

        if (
          selectedGear === "automatic" &&
          hasBothGearTypes &&
          selectedCategory?.gear?.automaticExtraCost
        ) {
          const automaticExtraCost = Number(
            selectedCategory.gear.automaticExtraCost,
          );
          parts.push(
            `${priceCalc.totalDays} day${
              priceCalc.totalDays > 1 ? "s" : ""
            } × £${automaticExtraCost.toFixed(2)} gear`,
          );
        }

        if (addOnsCost > 0) {
          parts.push(`add-ons £${addOnsCost.toFixed(2)}`);
        }

        return `${parts.join(" + ")} (Manual daily price)`;
      }
    }

    return priceCalc.breakdown;
  }, [
    priceCalc,
    isTotalPriceOverride,
    manualTotalPrice,
    isManualPrice,
    manualPricePerDay,
    selectedCategory,
    selectedGear,
    hasBothGearTypes,
    pickupExtensionPrice,
    returnExtensionPrice,
    addOnsCost,
  ]);

  const requiresFreshContract = Boolean(
    selectedReservation?.vehicle &&
    ["contract_pending", "contract_signed", "ready_for_collection"].includes(
      selectedReservation.status,
    ),
  );

  const proposedBaseTotal = editPerInvoice
    ? 0
    : Number(
        editFinalPrice ??
          priceCalc?.totalPrice ??
          selectedReservation?.totalPrice ??
          0,
      );

  const fullPaymentPreview = useMemo(() => {
    const deposit = selectedReservation?.deposit;
    if (
      !requiresFreshContract ||
      deposit?.option !== "full" ||
      deposit.status !== "paid"
    ) {
      return null;
    }

    const discountPercent = Math.min(
      100,
      Math.max(0, Number(deposit.discountPercent || 0)),
    );
    const previouslyPaid = Number(deposit.amount || 0);
    const revisedBookingTotal = Number(
      (proposedBaseTotal * (1 - discountPercent / 100)).toFixed(2),
    );
    const difference = Number(
      (revisedBookingTotal - previouslyPaid).toFixed(2),
    );

    return {
      discountPercent,
      previouslyPaid,
      revisedBookingTotal,
      difference,
      state:
        difference > 0
          ? ("payment_due" as const)
          : difference < 0
            ? ("credit_due" as const)
            : ("balanced" as const),
    };
  }, [proposedBaseTotal, requiresFreshContract, selectedReservation]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesRes, usersRes, categoriesRes, officesRes, addOnsRes] =
          await Promise.all([
            fetch("/api/vehicles?status=active&limit=1000"),
            fetch("/api/users?limit=100", {
              headers: clientAuthHeaders(),
            }),
            fetch("/api/categories?status=active"),
            fetch("/api/offices"),
            fetch("/api/addons?status=active"),
          ]);
        const vehiclesData = await vehiclesRes.json();
        const usersData = await usersRes.json();
        const categoriesData = await categoriesRes.json();
        const officesData = await officesRes.json();
        const addOnsData = await addOnsRes.json();

        setVehicles(
          (vehiclesData.data || []).map((vehicle: any) => {
            const gearTypes =
              vehicle.gear?.availableTypes
                ?.map((g: any) => g.gearType)
                .join("/") || "";
            return {
              _id: vehicle._id,
              name: `${vehicle.number || "Unknown"}${
                vehicle.keyNumber ? ` (Key: ${vehicle.keyNumber})` : ""
              } - ${gearTypes || "N/A"}`,
              keyNumber: vehicle.keyNumber || "",
              category:
                typeof vehicle.category === "string"
                  ? vehicle.category
                  : vehicle.category?._id || "",
              gear: gearTypes,
              available: vehicle.available !== false,
            };
          }),
        );
        setUsers(
          (usersData.data || []).map((user: any) => ({
            _id: user._id,
            name: `${user.name} ${user.lastName || ""}`.trim(),
          })),
        );
        setCategories(
          (categoriesData.data?.data || categoriesData.data || []).map(
            (cat: any) => ({
              _id: cat._id,
              name: cat.name,
              pricingTiers: cat.pricingTiers,
              extrahoursRate: cat.extrahoursRate,
              selloffer: cat.selloffer,
              gear: cat.gear,
            }),
          ),
        );
        setOffices(officesData.data?.data || officesData.data || []);
        setAddOns(addOnsData.data?.data || addOnsData.data || []);
      } catch (error) {
        console.log("Failed to fetch data:", error);
      } finally {
        setLoadingVehicles(false);
      }
    };
    fetchData();
  }, []);

  const prepareReservationForAdminActions = (item: Reservation) => {
    setSelectedReservation(item);
    setNewVehicle(
      typeof item.vehicle === "string" ? item.vehicle : item.vehicle?._id || "",
    );
    setEditCategory((item as any).category?._id || "");
    const startDate = getReservationDateForEdit(item, "start");
    const endDate = getReservationDateForEdit(item, "end");

    setEditDateRange([
      {
        startDate,
        endDate,
        key: "selection",
      },
    ]);
    setEditTimes({
      startTime: item.pickupTime || formatLondonTime(item.startDate),
      endTime: item.returnTime || formatLondonTime(item.endDate),
    });
    setSelectedGear((item as any).selectedGear || "manual");
    setNewStatus("");
    setCancelReason(item.cancelReason || "");
    const hasManualDailyPrice =
      item.isManualPrice &&
      item.manualPricePerDay !== undefined &&
      item.manualPricePerDay !== null;
    setIsManualPrice(Boolean(hasManualDailyPrice));
    setManualPricePerDay(
      hasManualDailyPrice ? String(item.manualPricePerDay) : "",
    );
    setIsTotalPriceOverride(
      Boolean(item.isManualPrice && !hasManualDailyPrice),
    );
    setManualTotalPrice(
      item.isManualPrice && !hasManualDailyPrice
        ? String(item.totalPrice ?? "")
        : "",
    );
    setManualPriceNote(item.manualPriceNote || "");
    setIsManualExtension(false);
    setEditPerInvoice(Boolean((item as any).perInvoice));
    // Load existing add-ons
    if (item.addOns && item.addOns.length > 0) {
      setSelectedAddOns(
        item.addOns.map((addon: any) => ({
          addOn:
            typeof addon.addOn === "string" ? addon.addOn : addon.addOn?._id,
          quantity: addon.quantity,
          selectedTierIndex: addon.selectedTierIndex,
        })),
      );
    } else {
      setSelectedAddOns([]);
    }
  };

  const handleViewDetails = (item: Reservation) => {
    prepareReservationForAdminActions(item);
    setIsDetailOpen(true);
  };

  const handleOpenStepManager = (item: Reservation) => {
    prepareReservationForAdminActions(item);
    setStepManagerReservation(item);
    setDepositTransactionRef("");
    setDepositFailureReason("");
    setIsStepManagerOpen(true);
  };

  // Calculate gear extra cost
  useEffect(() => {
    if (selectedGear === "automatic" && selectedCategory) {
      setGearExtraCost(
        (selectedCategory.gear?.automaticExtraCost || 0) *
          (priceCalc?.totalDays || 1),
      );
    } else {
      setGearExtraCost(0);
    }
  }, [selectedGear, selectedCategory, priceCalc?.totalDays]);

  // Calculate add-ons cost
  useEffect(() => {
    const cost = selectedAddOns.reduce((total: number, item: any) => {
      const addon = addOns.find((a) => a._id === item.addOn);
      if (!addon) return total;
      if (addon.pricingType === "flat") {
        const amount = addon.flatPrice?.amount || 0;
        const isPerDay = addon.flatPrice?.isPerDay || false;
        return (
          total +
          (isPerDay ? amount * (priceCalc?.totalDays || 1) : amount) *
            item.quantity
        );
      } else {
        const tier = addon.tieredPrice?.tiers?.[item.selectedTierIndex ?? 0];
        if (tier) {
          const isPerDay = addon.tieredPrice?.isPerDay || false;
          return (
            total +
            (isPerDay ? tier.price * (priceCalc?.totalDays || 1) : tier.price) *
              item.quantity
          );
        }
      }
      return total;
    }, 0);
    setAddOnsCost(cost);
  }, [selectedAddOns, priceCalc, addOns]);

  // Calculate extension prices
  useEffect(() => {
    // Admin is overriding the extension prices manually; don't recompute.
    if (isManualExtension) return;

    if (!selectedReservation?.office) {
      setPickupExtensionPrice(0);
      setReturnExtensionPrice(0);
      return;
    }

    const office = offices.find(
      (o) => o._id === (selectedReservation.office as any)?._id,
    );
    if (!office) {
      setPickupExtensionPrice(0);
      setReturnExtensionPrice(0);
      return;
    }

    const extensionPrices = calculateOfficeExtensionPrices({
      office,
      pickupDate: editDateRange[0].startDate,
      pickupTime: editTimes.startTime,
      returnDate: editDateRange[0].endDate,
      returnTime: editTimes.endTime,
    });

    setPickupExtensionPrice(extensionPrices.pickupExtension);
    setReturnExtensionPrice(extensionPrices.returnExtension);
  }, [
    selectedReservation,
    editTimes.startTime,
    editTimes.endTime,
    editDateRange,
    offices,
    isManualExtension,
  ]);

  // Fetch reserved slots
  useEffect(() => {
    if (selectedReservation?.office && editDateRange[0].startDate) {
      const date = editDateRange[0].startDate;
      const startDate = formatDateForStorage(date);
      fetch(
        `/api/reservations/by-office?office=${
          (selectedReservation.office as any)._id
        }&startDate=${startDate}&type=start`,
      )
        .then((res) => res.json())
        .then((data) =>
          setStartDateReservedSlots(data.data?.reservedSlots || []),
        )
        .catch((err) => console.log(err));
    }
  }, [selectedReservation, editDateRange]);

  useEffect(() => {
    if (selectedReservation?.office && editDateRange[0].endDate) {
      const date = editDateRange[0].endDate;
      const endDate = formatDateForStorage(date);
      fetch(
        `/api/reservations/by-office?office=${
          (selectedReservation.office as any)._id
        }&endDate=${endDate}&type=end`,
      )
        .then((res) => res.json())
        .then((data) => setEndDateReservedSlots(data.data?.reservedSlots || []))
        .catch((err) => console.log(err));
    }
  }, [selectedReservation, editDateRange]);

  const handleStatusChange = async (options?: { totalPrice?: number }) => {
    if (!selectedReservation || !newStatus) return;

    // Per-invoice reservations need a final price before they can be completed.
    // Honor both the saved flag and the live edit toggle.
    const isPerInvoiceReservation =
      Boolean((selectedReservation as any).perInvoice) || editPerInvoice;
    if (
      newStatus === "completed" &&
      isPerInvoiceReservation &&
      options?.totalPrice === undefined
    ) {
      setPerInvoicePrice(
        selectedReservation.totalPrice
          ? String(selectedReservation.totalPrice)
          : "",
      );
      setIsPerInvoicePriceOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: any = { status: newStatus };

      if (options?.totalPrice !== undefined) {
        updateData.totalPrice = options.totalPrice;
      }

      if (newStatus === "canceled") {
        updateData.cancelReason = cancelReason.trim();
      }

      const res = await fetch(`/api/reservations/${selectedReservation._id}`, {
        method: "PATCH",
        headers: clientAuthHeaders(true),
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Update failed");

      showToast.success("Status updated successfully!");
      setIsStatusOpen(false);
      setNewStatus("");
      setCancelReason("");
      setIsPerInvoicePriceOpen(false);
      setPerInvoicePrice("");
      if (mutateRef.current) mutateRef.current();
      setIsDetailOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPerInvoicePrice = async () => {
    const price = parseFloat(perInvoicePrice);
    if (isNaN(price) || price < 0) {
      showToast.error("Enter a valid total price");
      return;
    }
    setIsPerInvoicePriceOpen(false);
    await handleStatusChange({ totalPrice: price });
  };

  const handleDepositVerification = async (action: "approve" | "reject") => {
    if (!selectedReservation?._id) return;
    await submitDepositVerification(selectedReservation, action);
  };

  const submitDepositVerification = async (
    reservation: Reservation,
    action: "approve" | "reject",
  ) => {
    if (!reservation?._id) return;
    if (action === "reject" && !depositFailureReason.trim()) {
      showToast.error("Add a reason for rejecting the receipt");
      return;
    }

    setDepositBusy(true);
    try {
      const res = await fetch(`/api/reservations/${reservation._id}/deposit`, {
        method: "PATCH",
        headers: clientAuthHeaders(true),
        body: JSON.stringify({
          action,
          transactionRef: depositTransactionRef,
          failureReason: depositFailureReason,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Verification failed");

      setSelectedReservation(data.data);
      setStepManagerReservation(data.data);
      setDepositTransactionRef("");
      setDepositFailureReason("");
      await mutateRef.current?.();
      showToast.success(
        action === "approve" ? "Deposit verified" : "Deposit receipt rejected",
      );
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Verification failed",
      );
    } finally {
      setDepositBusy(false);
    }
  };

  const handleStepStatusChange = async (
    reservation: Reservation,
    status: Reservation["status"],
    extra: Record<string, unknown> = {},
  ) => {
    if (!reservation?._id) return;

    if (
      status === "completed" &&
      (reservation as any).perInvoice &&
      extra.totalPrice === undefined
    ) {
      setSelectedReservation(reservation);
      setNewStatus(status);
      setPerInvoicePrice(
        reservation.totalPrice ? String(reservation.totalPrice) : "",
      );
      setIsPerInvoicePriceOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: Record<string, unknown> = { status, ...extra };
      const res = await fetch(`/api/reservations/${reservation._id}`, {
        method: "PATCH",
        headers: clientAuthHeaders(true),
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Update failed");

      setSelectedReservation(data.data);
      setStepManagerReservation(data.data);
      await mutateRef.current?.();
      showToast.success("Reservation step updated");
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStepAssignVehicle = async (reservation: Reservation) => {
    if (isSubmitting || !reservation?._id || !newVehicle) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/reservations/${reservation._id}`, {
        method: "PATCH",
        headers: clientAuthHeaders(true),
        body: JSON.stringify({
          vehicle: newVehicle,
          status: "contract_pending",
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Update failed");

      const vehicleRes = await fetch(`/api/vehicles/${newVehicle}`, {
        method: "PATCH",
        headers: clientAuthHeaders(true),
        body: JSON.stringify({
          available: false,
          reservation: reservation._id,
        }),
      });
      const vehicleData = await vehicleRes.json();
      if (!vehicleData.success)
        throw new Error(vehicleData.error || "Vehicle update failed");

      setSelectedReservation(data.data);
      setStepManagerReservation(data.data);
      await mutateRef.current?.();
      showToast.success("Vehicle assigned and contract sent for signing");
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDatesUpdate = async () => {
    if (
      !selectedReservation ||
      !editDateRange[0].startDate ||
      !editDateRange[0].endDate ||
      !editCategory
    )
      return;

    const manualDailyPrice = parseFloat(manualPricePerDay);
    const manualDailyPriceActive =
      isManualPrice && !isNaN(manualDailyPrice) && manualDailyPrice > 0;
    const totalOverridePrice = parseFloat(manualTotalPrice);
    const totalOverrideActive =
      isTotalPriceOverride &&
      !isNaN(totalOverridePrice) &&
      totalOverridePrice >= 0;

    if (isManualPrice && !manualDailyPriceActive) {
      showToast.error("Enter a valid manual price per day");
      return;
    }

    if (isTotalPriceOverride && !totalOverrideActive) {
      showToast.error("Enter a valid total price");
      return;
    }

    setIsSubmitting(true);

    try {
      const startDate = editDateRange[0].startDate;
      const endDate = editDateRange[0].endDate;

      const res = await fetch(`/api/reservations/${selectedReservation._id}`, {
        method: "PATCH",
        headers: clientAuthHeaders(true),
        body: JSON.stringify({
          startDate: createLondonDateTime(startDate, editTimes.startTime),
          endDate: createLondonDateTime(endDate, editTimes.endTime),
          startDateDisplay: formatDateForStorage(startDate),
          endDateDisplay: formatDateForStorage(endDate),
          pickupTime: editTimes.startTime,
          returnTime: editTimes.endTime,
          category: editCategory,
          totalPrice: proposedBaseTotal,
          repricedBaseTotal: proposedBaseTotal,
          ...(requiresFreshContract ? { status: "deposit_paid" } : {}),
          perInvoice: editPerInvoice,
          addOns: selectedAddOns,
          selectedGear: selectedGear,
          pickupExtensionPrice,
          returnExtensionPrice,
          isManualPrice:
            !editPerInvoice && (manualDailyPriceActive || totalOverrideActive),
          manualPricePerDay: manualDailyPriceActive ? manualDailyPrice : null,
          manualPriceNote: manualDailyPriceActive
            ? manualPriceNote || "Admin custom daily pricing"
            : totalOverrideActive
              ? manualPriceNote || "Admin total price override"
              : "",
          adminEdited: true,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Update failed");

      showToast.success("Reservation updated successfully!");
      setIsEditDatesOpen(false);
      if (mutateRef.current) mutateRef.current();
      setIsDetailOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className=" ">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-linear-to-br from-white/[0.07] via-white/[0.035] to-[#fe9a00]/[0.055] p-4 shadow-[0_16px_44px_rgba(0,0,0,0.16)] ring-1 ring-inset ring-white/[0.025] sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <h3 className="text-lg font-black tracking-tight text-white sm:text-xl">
          Quick Actions
        </h3>
        <button
          onClick={() => setShowCreateReservation(true)}
          className="flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-[#ffbd66]/30 bg-linear-to-r from-[#fe9a00] to-[#ff7200] px-5 py-3 text-sm font-black text-white shadow-[0_12px_32px_rgba(254,154,0,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(254,154,0,0.30)] active:translate-y-0 active:scale-[0.99] sm:w-auto sm:px-6"
        >
          <FiPlus className="text-lg" />
          Create Reservation
        </button>
      </div>
      <AdminCreateReservationModal
        isOpen={showCreateReservation}
        onClose={() => setShowCreateReservation(false)}
      />
      <DynamicTableView<Reservation>
        apiEndpoint="/api/reservations"
        defaultFilters={{ status_ne: "completed" }}
        editButtonClass="mt-2"
        filters={[
          { key: "reservationCode", label: "Order ID", type: "text" },
          { key: "phone", label: "Phone Number", type: "text" },
          {
            key: "category",
            label: "Category",
            type: "select",
            options: categories,
          },

          {
            key: "isManualPrice",
            label: "Manual Price",
            type: "select",
            options: [
              { _id: "true", name: "Yes" },
              { _id: "false", name: "No" },
            ],
          },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ADMIN_STATUS_OPTIONS,
          },
          {
            key: "office",
            label: "Office",
            type: "select",
            options: offices.map((office) => ({
              _id: office._id,
              name: office.name,
            })),
          },
          {
            key: "reservationType",
            label: "Type",
            type: "select",
            options: [
              { _id: "Website", name: "Website" },
              { _id: "Office", name: "Office" },
              { _id: "App", name: "App" },
            ],
          },
          {
            key: "totalPrice",
            label: "Total Price Range",
            type: "range",
            rangeType: "number",
          },
          { key: "startDate", label: "Start Date", type: "date" },
          { key: "endDate", label: "End Date", type: "date" },
          { key: "createdAt", label: "Created At", type: "date" },
        ]}
        title="Reservation"
        columns={[
          {
            key: "reservationCode",
            label: "order Id",
            render: (
              value: any,
              row: any,
              index?: number,
              pagination?: any,
            ) => {
              // Prefer the stored unique order code; fall back to a reverse
              // index for legacy reservations created before codes existed.
              if (row?.reservationCode) {
                return (
                  <span className="text-xs text-[#fe9a00]">
                    {row.reservationCode}
                  </span>
                );
              }
              const globalIndex =
                ((pagination?.page || 1) - 1) * (pagination?.limit || 10) +
                (index || 0) +
                1;
              const displayNumber = pagination?.total
                ? pagination.total - globalIndex + 1
                : (index ?? 0) + 1;
              return <span className="text-xs">#{displayNumber || 0}</span>;
            },
          },
          {
            key: "user",
            label: "Customer",
            render: (value: any) => value?.name || "-",
          },
          {
            key: "user",
            label: "Phone",
            render: (value: any) => value?.phoneData?.phoneNumber || "-",
          },
          {
            key: "category",
            label: "Category",
            render: (value: any) => value?.name || "-",
          },
          {
            key: "createdAt",
            label: "Created At",
            render: (value: string) =>
              value ? new Date(value).toLocaleDateString("en-GB") : "-",
          },
          // {
          //   key: "office",
          //   label: "Office",
          //   render: (value: any) => value?.name.slice(0, 10) || "-",
          // },
          {
            key: "totalPrice",
            label: "Price",
            render: (value: number, record: Reservation | undefined) =>
              (record as any)?.perInvoice && !value ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-400">
                  Per Invoice
                </span>
              ) : value ? (
                `£${value.toFixed(2)}`
              ) : (
                "-"
              ),
          },
          {
            key: "startDate",
            label: "Pickup",
            render: (value: string, record: Reservation | undefined) => (
              <div className="leading-tight whitespace-nowrap">
                <div className="text-xs">
                  {record?.startDateDisplay || formatLondonDate(value)}
                </div>
                <div className="text-[11px] text-gray-400">
                  {record?.pickupTime || formatLondonTime(value)}
                </div>
              </div>
            ),
          },
          {
            key: "endDate",
            label: "Return",
            render: (value: string, record: Reservation | undefined) => (
              <div className="leading-tight whitespace-nowrap">
                <div className="text-xs">
                  {record?.endDateDisplay || formatLondonDate(value)}
                </div>
                <div className="text-[11px] text-gray-400">
                  {record?.returnTime || formatLondonTime(value)}
                </div>
              </div>
            ),
          },
          {
            key: "reservationType",
            label: "Type",
            render: (value: any) => {
              if (value === "Website") {
                return (
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-400/20 bg-sky-500/10 text-sky-300 shadow-sm ring-1 ring-inset ring-sky-400/5"
                    title="Website"
                  >
                    <FiGlobe className="text-sm" />
                  </span>
                );
              }

              if (value === "Office") {
                return (
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-purple-400/20 bg-purple-500/10 text-purple-300 shadow-sm ring-1 ring-inset ring-purple-400/5"
                    title="Office"
                  >
                    <FiBriefcase className="text-sm" />
                  </span>
                );
              }

              if (value === "App") {
                return (
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-500/10 text-emerald-300 shadow-sm ring-1 ring-inset ring-emerald-400/5"
                    title="App"
                  >
                    <FiSmartphone className="text-sm" />
                  </span>
                );
              }

              return "-";
            },
          },
          {
            key: "user",
            label: "licence",
            render: (value: any) => {
              const hasFront = value?.licenceAttached?.front;
              const hasBack = value?.licenceAttached?.back;

              if (hasFront && hasBack) {
                return (
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-green-400/20 bg-green-500/10 text-green-300 shadow-sm ring-1 ring-inset ring-green-400/5"
                    title="Complete"
                  >
                    <FiCheck className="text-sm" />
                  </span>
                );
              }

              if (hasFront || hasBack) {
                return (
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-yellow-400/20 bg-yellow-500/10 text-yellow-300 shadow-sm ring-1 ring-inset ring-yellow-400/5"
                    title="Partial"
                  >
                    <FiCheck className="text-sm" />
                  </span>
                );
              }

              return (
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-400/20 bg-red-500/10 text-red-300 shadow-sm ring-1 ring-inset ring-red-400/5"
                  title="Missing"
                >
                  <FiX className="text-sm" />
                </span>
              );
            },
          },
          { key: "driverAge", label: "Driver Age" },

          {
            key: "status",
            label: "Status",
            render: (value: string) => (
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadgeClasses(value)}`}
              >
                {statusLabel(value, true)}
              </span>
            ),
          },
          {
            key: "deposit",
            label: "Deposit",
            render: (_value: Reservation["deposit"], row?: Reservation) => (
              <DepositVerificationBadge reservation={row} />
            ),
          },
          {
            key: "_id",
            label: "Flow",
            render: (_value: any, row?: Reservation) =>
              row ? (
                <button
                  onClick={() => handleOpenStepManager(row)}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#fe9a00]/25 bg-[#fe9a00]/10 px-3 py-2 text-xs font-bold text-[#ffad33] shadow-sm transition-all duration-200 hover:border-[#fe9a00]/40 hover:bg-[#fe9a00]/20 active:scale-[0.98]"
                  title="Open step manager"
                >
                  Step
                  <FiArrowRight className="text-sm" />
                </button>
              ) : (
                "-"
              ),
          },
          {
            key: "_id",
            label: "view",
            render: (value: any, row: any) => (
              <button
                onClick={() => {
                  setSelectedReservationForDetails(row);
                  setDetailsModalOpen(true);
                }}
                className="tooltip flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[#ffad33] transition-all duration-200 hover:border-[#fe9a00]/20 hover:bg-[#fe9a00]/10 active:scale-95"
                title="View Details"
                data-tooltip="View Details"
              >
                <FiEye className="text-base" />
              </button>
            ),
          },
        ]}
        onEdit={handleViewDetails}
        onMutate={(mutate) => (mutateRef.current = mutate)}
        hideViewBtn={true}
        hiddenColumns={["driverAge"] as (keyof Reservation)[]}
      />
      {/* <DynamicTableView<Reservation>
        hideDelete={true}
        apiEndpoint="/api/reservations"
        filters={[
          { key: "name", label: "User", type: "select", options: users },
          { key: "category", label: "Category", type: "select", options: categories },
          { key: "startDate", label: "Start Date", type: "date" },
          { key: "endDate", label: "End Date", type: "date" },
          { key: "totalPrice", label: "Total Price", type: "text" },
        ]}
        title="Reservation"
        columns={[
          {
            key: "user",
            label: "User",
            render: (value: any) => value?.name || "-",
          },
          {
            key: "office",
            label: "Office",
            render: (value: any) => value?.name || "-",
          },
          {
            key: "category",
            label: "Category",
            render: (value: any) => value?.name || "-",
          },
          {
            key: "startDate",
            label: "Start Date",
            render: (value: string, record: any) =>
              record.startDateDisplay && record.pickupTime
                ? `${record.startDateDisplay} ${record.pickupTime}`
                : new Date(value).toLocaleString("en-GB", {
                    timeZone: "Europe/London",
                  }) || "-",
          },
          {
            key: "endDate",
            label: "End Date",
            render: (value: string, record: any) =>
              record.endDateDisplay && record.returnTime
                ? `${record.endDateDisplay} ${record.returnTime}`
                : new Date(value).toLocaleString("en-GB", {
                    timeZone: "Europe/London",
                  }) || "-",
          },
          { key: "totalPrice", label: "Total Price" },
          {
            key: "status",
            label: "Status",
            render: (value: string) => (
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClasses(value)}`}
              >
                {statusLabel(value, true)}
              </span>
            ),
          },
          { key: "driverAge", label: "Driver Age" },
        ]}
        onEdit={handleViewDetails}
        onMutate={(mutate) => (mutateRef.current = mutate)}
        hiddenColumns={["driverAge"] as (keyof Reservation)[]}
      /> */}

      {isDetailOpen && selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-5">
          <div className="max-h-[96dvh] w-full max-w-2xl overscroll-contain overflow-y-auto rounded-t-[28px] border border-white/10 bg-linear-to-b from-[#1a294a] to-[#0b1324] shadow-[0_30px_100px_rgba(0,0,0,0.60)] ring-1 ring-inset ring-white/[0.04] sm:max-h-[90vh] sm:rounded-[28px]">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-[#152441]/88 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-6">
              <div className="min-w-0">
                <h2 className="text-xl font-black text-white sm:text-2xl">
                  Reservation Details
                </h2>
                <p className="text-[#fe9a00] text-sm font-bold">
                  Order{" "}
                  {selectedReservation.reservationCode ||
                    selectedReservation._id}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printReservationReceipt(selectedReservation)}
                  className="inline-flex min-h-10 touch-manipulation items-center justify-center gap-2 rounded-xl bg-[#fe9a00]/20 px-3 py-2 text-sm font-bold text-[#fe9a00] transition-colors hover:bg-[#fe9a00]/30 active:bg-[#fe9a00]/35"
                >
                  <FiPrinter className="text-base" />
                  Print
                </button>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-xl transition-colors hover:bg-white/10 active:bg-white/15"
                >
                  <FiX className="text-white text-xl" />
                </button>
              </div>
            </div>

            <div className="space-y-4 p-3 sm:space-y-5 sm:p-6">
              {/* User Information */}
              <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/[0.075] to-white/[0.025] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-inset ring-white/[0.025] sm:p-5">
                <h3 className="text-white font-semibold mb-3">
                  User Information
                </h3>
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 sm:gap-4">
                  <div>
                    <p className="text-gray-400">Name</p>
                    <p className="text-white font-semibold">
                      {selectedReservation.user?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Email</p>
                    <p className="text-white font-semibold">
                      {selectedReservation.user?.emaildata?.emailAddress || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Phone</p>
                    <p className="text-white font-semibold">
                      {selectedReservation.user?.phoneData?.phoneNumber || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Driver Age</p>
                    <p className="text-white font-semibold">
                      {selectedReservation.driverAge}
                    </p>
                  </div>
                </div>
              </div>

              {/* License Information */}
              {(selectedReservation.user?.licenceAttached?.front ||
                selectedReservation.user?.licenceAttached?.back) && (
                <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/[0.075] to-white/[0.025] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-inset ring-white/[0.025] sm:p-5">
                  <h3 className="text-white font-semibold mb-3">
                    Driver licences
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                    {selectedReservation.user?.licenceAttached?.front && (
                      <div>
                        <p className="text-gray-400 text-sm mb-2">Front Side</p>
                        <div className="relative">
                          <a
                            href={
                              selectedReservation.user.licenceAttached.front
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img
                              src={
                                selectedReservation.user.licenceAttached.front
                              }
                              alt="licences Front"
                              className="h-40 w-full cursor-pointer rounded-xl border border-white/10 object-cover transition-colors hover:border-[#fe9a00]/50 sm:h-32"
                            />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 hover:opacity-100">
                              <span className="text-white text-sm font-medium">
                                Click to view full size
                              </span>
                            </div>
                          </a>
                        </div>
                      </div>
                    )}
                    {selectedReservation.user?.licenceAttached?.back && (
                      <div>
                        <p className="text-gray-400 text-sm mb-2">Back Side</p>
                        <div className="relative">
                          <a
                            href={selectedReservation.user.licenceAttached.back}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img
                              src={
                                selectedReservation.user.licenceAttached.back
                              }
                              alt="licences Back"
                              className="h-40 w-full cursor-pointer rounded-xl border border-white/10 object-cover transition-colors hover:border-[#fe9a00]/50 sm:h-32"
                            />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 hover:opacity-100">
                              <span className="text-white text-sm font-medium">
                                Click to view full size
                              </span>
                            </div>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        selectedReservation.user?.licenceAttached?.front &&
                        selectedReservation.user?.licenceAttached?.back
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          selectedReservation.user?.licenceAttached?.front &&
                          selectedReservation.user?.licenceAttached?.back
                            ? "bg-green-400"
                            : "bg-yellow-400"
                        }`}
                      ></span>
                      {selectedReservation.user?.licenceAttached?.front &&
                      selectedReservation.user?.licenceAttached?.back
                        ? "Complete licences"
                        : "Partial licences"}
                    </span>
                  </div>
                </div>
              )}

              {/* Reservation Details */}
              <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/[0.075] to-white/[0.025] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-inset ring-white/[0.025] sm:p-5">
                <h3 className="text-white font-semibold mb-3">
                  Reservation Details
                </h3>
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 sm:gap-4">
                  <div>
                    <p className="text-gray-400">Office</p>
                    <p className="text-white font-semibold">
                      {selectedReservation.office?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Category</p>
                    <p className="text-white font-semibold">
                      {(selectedReservation as any).category?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Gear option</p>
                    <p className="text-white font-semibold">
                      {(selectedReservation as any).selectedGear || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Vehicle</p>
                    <p className="text-white font-semibold">
                      {(selectedReservation as any).vehicle?.title || "-"}
                      {(selectedReservation as any).vehicle?.keyNumber
                        ? ` (Key: ${(selectedReservation as any).vehicle.keyNumber})`
                        : ""}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">Start Date & Time</p>
                    <p className="text-white font-semibold">
                      {(selectedReservation as any).startDateDisplay &&
                      (selectedReservation as any).pickupTime
                        ? `${(selectedReservation as any).startDateDisplay} ${(selectedReservation as any).pickupTime}`
                        : new Date(
                            selectedReservation.startDate,
                          ).toLocaleString("en-GB", {
                            timeZone: "Europe/London",
                          })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">End Date & Time</p>
                    <p className="text-white font-semibold">
                      {(selectedReservation as any).endDateDisplay &&
                      (selectedReservation as any).returnTime
                        ? `${(selectedReservation as any).endDateDisplay} ${(selectedReservation as any).returnTime}`
                        : new Date(selectedReservation.endDate).toLocaleString(
                            "en-GB",
                            { timeZone: "Europe/London" },
                          )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total Price</p>
                    <p className="text-white font-semibold">
                      £{selectedReservation.totalPrice}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Duration</p>
                    <p className="text-white font-semibold">
                      {Math.ceil(
                        (new Date(selectedReservation.endDate).getTime() -
                          new Date(selectedReservation.startDate).getTime()) /
                          (1000 * 60 * 60),
                      )}{" "}
                      hours
                    </p>
                  </div>
                </div>
              </div>

              {/* Add-ons */}
              {selectedReservation.addOns &&
                selectedReservation.addOns.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/[0.075] to-white/[0.025] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-inset ring-white/[0.025] sm:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold">Add-ons</h3>
                      <button
                        onClick={() => setShowAddOnsModal(true)}
                        className="text-[#fe9a00] text-xs hover:underline"
                      >
                        Edit Add-ons
                      </button>
                    </div>
                    <div className="space-y-2">
                      {selectedAddOns.map((item: any, idx: number) => {
                        const addon =
                          addOns.find((a) => a._id === item.addOn) ||
                          item.addOn;
                        let price = 0;
                        let tierInfo = "";

                        if (addon?.pricingType === "flat") {
                          price =
                            typeof addon.flatPrice === "object"
                              ? addon.flatPrice?.amount || 0
                              : addon.flatPrice || 0;
                        } else if (addon?.pricingType === "tiered") {
                          const tierIndex = item.selectedTierIndex ?? 0;
                          const tier = addon.tieredPrice?.tiers?.[tierIndex];
                          if (tier) {
                            price = tier.price;
                            tierInfo = ` (${tier.minDays}-${tier.maxDays} days)`;
                          }
                        }

                        return (
                          <div
                            key={idx}
                            className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-linear-to-br from-white/[0.07] via-white/[0.035] to-[#fe9a00]/[0.055] p-4 shadow-[0_16px_44px_rgba(0,0,0,0.16)] ring-1 ring-inset ring-white/[0.025] sm:flex-row sm:items-center sm:justify-between sm:p-5 text-sm"
                          >
                            <div className="flex flex-col">
                              <span className="text-white font-semibold">
                                {addon?.name || "Unknown"}
                              </span>
                              {addon?.description && (
                                <span className="text-gray-400 text-xs">
                                  {addon.description}
                                </span>
                              )}
                              {tierInfo && (
                                <span className="text-[#fe9a00] text-xs">
                                  {tierInfo}
                                </span>
                              )}
                            </div>
                            <div className="flex items-start gap-3 sm:items-center">
                              <span className="text-gray-400">
                                Qty: {item.quantity}
                              </span>
                              <span className="text-white font-semibold">
                                £{price}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Message */}
              {selectedReservation.messege && (
                <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/[0.075] to-white/[0.025] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-inset ring-white/[0.025] sm:p-5">
                  <h3 className="text-white font-semibold mb-2">Message</h3>
                  <p className="text-gray-300 text-sm">
                    {selectedReservation.messege}
                  </p>
                </div>
              )}

              {/* Edit Dates */}
              <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/[0.075] to-white/[0.025] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-inset ring-white/[0.025] sm:p-5">
                <h3 className="text-white font-semibold mb-3">
                  Edit Reservation
                </h3>
                <button
                  onClick={() => setIsEditDatesOpen(!isEditDatesOpen)}
                  className="min-h-11 w-full touch-manipulation rounded-xl bg-[#fe9a00]/20 px-4 py-2.5 text-sm font-semibold text-[#fe9a00] transition-colors hover:bg-[#fe9a00]/30 active:bg-[#fe9a00]/35"
                >
                  Edit Category, Dates & Times
                </button>

                {isEditDatesOpen && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-white text-sm font-semibold mb-2 block">
                        Category
                      </label>
                      <CustomSelect
                        options={categories}
                        value={editCategory}
                        onChange={setEditCategory}
                        placeholder="Select Category"
                      />
                    </div>

                    <div>
                      <label className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                        <FiCalendar className="text-[#fe9a00]" /> Dates
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowDateRange(!showDateRange)}
                        className="min-h-11 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-left text-sm text-white focus:border-[#fe9a00] focus:outline-none focus:ring-2 focus:ring-[#fe9a00]/20"
                      >
                        {editDateRange[0].startDate && editDateRange[0].endDate
                          ? `${editDateRange[0].startDate.toLocaleDateString("en-GB")} - ${editDateRange[0].endDate.toLocaleDateString("en-GB")}`
                          : "Select Dates"}
                      </button>
                      {showDateRange && (
                        <div
                          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-2 backdrop-blur-md sm:p-5"
                          onClick={() => setShowDateRange(false)}
                        >
                          <div
                            className="max-h-[92dvh] max-w-[calc(100vw-1rem)] overflow-auto rounded-2xl border border-white/10 bg-linear-to-b from-slate-800 to-slate-900 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.55)] ring-1 ring-inset ring-white/[0.04] backdrop-blur-xl sm:p-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DateRange
                              ranges={editDateRange}
                              onChange={(item) => {
                                const { startDate, endDate } = item.selection;
                                setEditDateRange([
                                  {
                                    startDate: startDate || new Date(),
                                    endDate: endDate || new Date(),
                                    key: "selection",
                                  },
                                ]);
                              }}
                              minDate={new Date()}
                              rangeColors={["#fbbf24"]}
                              disabledDates={
                                selectedReservation?.office
                                  ? (Array.from({ length: 365 }, (_, i) => {
                                      const date = new Date();
                                      date.setDate(date.getDate() + i);
                                      return isDateDisabled(date) ? date : null;
                                    }).filter(Boolean) as Date[])
                                  : []
                              }
                            />
                            <button
                              type="button"
                              onClick={() => setShowDateRange(false)}
                              className="mt-3 min-h-11 w-full touch-manipulation rounded-xl border border-[#ffbd66]/40 bg-linear-to-r from-[#fe9a00] to-[#ffad33] px-4 py-2.5 text-sm font-bold text-slate-950 shadow-[0_8px_24px_rgba(254,154,0,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(254,154,0,0.24)] active:translate-y-0 active:scale-[0.99]"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                          <FiClock className="text-[#fe9a00]" /> Start Time
                        </label>
                        {editDateRange[0].startDate &&
                          (() => {
                            const office = offices.find(
                              (o) =>
                                o._id ===
                                (selectedReservation.office as any)?._id,
                            );
                            const date = editDateRange[0].startDate;
                            const dayName = [
                              "sunday",
                              "monday",
                              "tuesday",
                              "wednesday",
                              "thursday",
                              "friday",
                              "saturday",
                            ][date.getDay()];
                            const specialDay = office
                              ? findSpecialDayForDate(office.specialDays, date)
                              : undefined;
                            let specialDayInfo = undefined;
                            let extensionTimes = undefined;

                            if (specialDay?.isOpen) {
                              specialDayInfo = {
                                reason: specialDay.reason || "Special Day",
                                price: specialDay.extraPrice || 0,
                              };
                            } else {
                              const workingDay = office?.workingTime?.find(
                                (w: any) => w.day === dayName && w.isOpen,
                              );
                              const pickupWindow = workingDay
                                ? getWorkingDayWindow(workingDay, "pickup")
                                : undefined;
                              extensionTimes = workingDay?.pickupExtension
                                ? {
                                    start: pickupTimeSlots[0],
                                    end: pickupTimeSlots[
                                      pickupTimeSlots.length - 1
                                    ],
                                    normalStart:
                                      pickupWindow?.startTime || "00:00",
                                    normalEnd: pickupWindow?.endTime || "23:59",
                                    price: workingDay.pickupExtension.flatPrice,
                                  }
                                : undefined;
                            }

                            return (
                              <TimeSelect
                                value={editTimes.startTime}
                                onChange={(time) =>
                                  setEditTimes((prev) => ({
                                    ...prev,
                                    startTime: time,
                                  }))
                                }
                                slots={pickupTimeSlots}
                                reservedSlots={startDateReservedSlots}
                                selectedDate={editDateRange[0].startDate}
                                isStartTime={true}
                                specialDayInfo={specialDayInfo}
                                extensionTimes={extensionTimes}
                              />
                            );
                          })()}
                      </div>
                      <div>
                        <label className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                          <FiClock className="text-[#fe9a00]" /> End Time
                        </label>
                        {editDateRange[0].endDate &&
                          (() => {
                            const office = offices.find(
                              (o) =>
                                o._id ===
                                (selectedReservation.office as any)?._id,
                            );
                            const date = editDateRange[0].endDate;
                            const dayName = [
                              "sunday",
                              "monday",
                              "tuesday",
                              "wednesday",
                              "thursday",
                              "friday",
                              "saturday",
                            ][date.getDay()];
                            const specialDay = office
                              ? findSpecialDayForDate(office.specialDays, date)
                              : undefined;
                            const pickupSpecialDay =
                              office && editDateRange[0].startDate
                                ? findSpecialDayForDate(
                                    office.specialDays,
                                    editDateRange[0].startDate,
                                  )
                                : undefined;
                            const isSamePricedSpecialDay = Boolean(
                              editDateRange[0].startDate &&
                              pickupSpecialDay?.isOpen &&
                              specialDay?.isOpen &&
                              pickupSpecialDay.month === specialDay.month &&
                              pickupSpecialDay.day === specialDay.day &&
                              isSameCalendarDate(
                                editDateRange[0].startDate,
                                date,
                              ),
                            );
                            let specialDayInfo = undefined;
                            let extensionTimes = undefined;

                            if (specialDay?.isOpen) {
                              specialDayInfo = {
                                reason: specialDay.reason || "Special Day",
                                price: isSamePricedSpecialDay
                                  ? 0
                                  : specialDay.extraPrice || 0,
                                alreadyCharged: isSamePricedSpecialDay,
                              };
                            } else {
                              const workingDay = office?.workingTime?.find(
                                (w: any) => w.day === dayName && w.isOpen,
                              );
                              const returnWindow = workingDay
                                ? getWorkingDayWindow(workingDay, "return")
                                : undefined;
                              extensionTimes = workingDay?.returnExtension
                                ? {
                                    start: returnTimeSlots[0],
                                    end: returnTimeSlots[
                                      returnTimeSlots.length - 1
                                    ],
                                    normalStart:
                                      returnWindow?.startTime || "00:00",
                                    normalEnd: returnWindow?.endTime || "23:59",
                                    price: workingDay.returnExtension.flatPrice,
                                  }
                                : undefined;
                            }

                            return (
                              <TimeSelect
                                value={editTimes.endTime}
                                onChange={(time) =>
                                  setEditTimes((prev) => ({
                                    ...prev,
                                    endTime: time,
                                  }))
                                }
                                slots={returnTimeSlots}
                                reservedSlots={endDateReservedSlots}
                                selectedDate={editDateRange[0].endDate}
                                isStartTime={false}
                                specialDayInfo={specialDayInfo}
                                extensionTimes={extensionTimes}
                              />
                            );
                          })()}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-amber-400/20 bg-linear-to-br from-amber-500/[0.08] to-amber-500/[0.025] p-4 shadow-sm ring-1 ring-inset ring-amber-300/[0.03] sm:p-5">
                      <label className="flex items-center gap-2 text-amber-300 text-sm font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isManualExtension}
                          onChange={(e) =>
                            setIsManualExtension(e.target.checked)
                          }
                          className="accent-amber-500"
                        />
                        Manual extension price (out-of-hours)
                      </label>
                      {isManualExtension && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="block text-white/70 text-xs mb-1">
                              Pickup extension (£)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={pickupExtensionPrice}
                              onChange={(e) =>
                                setPickupExtensionPrice(
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="min-h-11 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                            />
                          </div>
                          <div>
                            <label className="block text-white/70 text-xs mb-1">
                              Return extension (£)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={returnExtensionPrice}
                              onChange={(e) =>
                                setReturnExtensionPrice(
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="min-h-11 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-white text-sm font-semibold mb-2 block">
                        Gear Type
                      </label>
                      {hasBothGearTypes ? (
                        <select
                          value={selectedGear}
                          onChange={(e) =>
                            setSelectedGear(
                              e.target.value as "manual" | "automatic",
                            )
                          }
                          className="min-h-11 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white focus:border-[#fe9a00] focus:outline-none focus:ring-2 focus:ring-[#fe9a00]/20"
                        >
                          <option value="manual">Manual</option>
                          <option value="automatic">
                            Automatic
                            {selectedCategory?.gear?.automaticExtraCost > 0 &&
                              ` (+£${selectedCategory?.gear.automaticExtraCost}/day)`}
                          </option>
                        </select>
                      ) : (
                        <div className="min-h-11 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-gray-400">
                          {selectedGear === "automatic"
                            ? "Automatic"
                            : "Manual"}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-white text-sm font-semibold mb-2 block">
                        Add-ons
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddOnsModal(true)}
                        className="min-h-11 w-full touch-manipulation rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white transition-colors hover:bg-white/20 active:bg-white/25"
                      >
                        {selectedAddOns.length > 0
                          ? `${selectedAddOns.length} add-on(s) selected`
                          : "Select Add-ons"}
                      </button>
                      {selectedAddOns.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {selectedAddOns.map((item: any, idx: number) => {
                            const addon = addOns.find(
                              (a) => a._id === item.addOn,
                            );
                            return (
                              <div
                                key={idx}
                                className="text-xs text-gray-400 flex justify-between"
                              >
                                <span>{addon?.name || "Unknown"}</span>
                                <span>x{item.quantity}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-sky-400/20 bg-linear-to-br from-sky-500/[0.11] to-sky-500/[0.035] p-4 shadow-sm ring-1 ring-inset ring-sky-300/[0.03] sm:p-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editPerInvoice}
                          onChange={(e) => setEditPerInvoice(e.target.checked)}
                          className="h-5 w-5 shrink-0 rounded border-sky-500/50 bg-sky-500/20 text-sky-500 focus:ring-sky-500 focus:ring-offset-0"
                        />
                        <span className="text-sky-200 text-sm font-semibold">
                          🧾 Per Invoice (no price now)
                        </span>
                      </label>
                      {editPerInvoice && (
                        <p className="text-sky-200/70 text-xs mt-1.5 leading-relaxed">
                          Total is saved as £0. The final price is entered when
                          you mark this reservation as completed.
                        </p>
                      )}
                    </div>

                    {!editPerInvoice && priceCalc && (
                      <div className="space-y-3 rounded-2xl border border-purple-400/20 bg-linear-to-br from-purple-500/[0.11] to-purple-500/[0.035] p-4 shadow-sm ring-1 ring-inset ring-purple-300/[0.03] sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-purple-200 text-sm font-semibold">
                              Admin Pricing
                            </p>
                            <p className="text-purple-200/60 text-xs">
                              Change daily rate or override the final total
                            </p>
                          </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isManualPrice}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setIsManualPrice(checked);
                              if (checked) {
                                setIsTotalPriceOverride(false);
                                setManualTotalPrice("");
                              } else {
                                setManualPricePerDay("");
                                if (!isTotalPriceOverride)
                                  setManualPriceNote("");
                              }
                            }}
                            className="h-5 w-5 shrink-0 rounded border-purple-500/50 bg-purple-500/20 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                          />
                          <span className="text-white text-sm font-semibold">
                            Manual daily price
                          </span>
                        </label>

                        {isManualPrice && (
                          <div className="space-y-2">
                            <label className="text-purple-200 text-xs font-semibold block">
                              Price Per Day (£)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={manualPricePerDay}
                              onChange={(e) =>
                                setManualPricePerDay(e.target.value)
                              }
                              placeholder={`Default: £${priceCalc.pricePerDay.toFixed(2)}`}
                              className="min-h-11 w-full rounded-xl border border-purple-500/30 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-purple-200/40 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                            />
                          </div>
                        )}

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isTotalPriceOverride}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setIsTotalPriceOverride(checked);
                              if (checked) {
                                setIsManualPrice(false);
                                setManualPricePerDay("");
                                setManualTotalPrice(
                                  String(
                                    editFinalPrice ??
                                      priceCalc.totalPrice ??
                                      selectedReservation.totalPrice ??
                                      "",
                                  ),
                                );
                              } else {
                                setManualTotalPrice("");
                                if (!isManualPrice) setManualPriceNote("");
                              }
                            }}
                            className="h-5 w-5 shrink-0 rounded border-purple-500/50 bg-purple-500/20 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                          />
                          <span className="text-white text-sm font-semibold">
                            Override total price
                          </span>
                        </label>

                        {isTotalPriceOverride && (
                          <div className="space-y-2">
                            <label className="text-purple-200 text-xs font-semibold block">
                              Total Price (£)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={manualTotalPrice}
                              onChange={(e) =>
                                setManualTotalPrice(e.target.value)
                              }
                              placeholder={`Calculated: £${priceCalc.totalPrice.toFixed(2)}`}
                              className="min-h-11 w-full rounded-xl border border-purple-500/30 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-purple-200/40 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                            />
                          </div>
                        )}

                        {(isManualPrice || isTotalPriceOverride) && (
                          <div className="space-y-2">
                            <label className="text-purple-200 text-xs font-semibold block">
                              Note
                            </label>
                            <input
                              type="text"
                              value={manualPriceNote}
                              onChange={(e) =>
                                setManualPriceNote(e.target.value)
                              }
                              placeholder="Optional admin note"
                              className="min-h-11 w-full rounded-xl border border-purple-500/30 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-purple-200/40 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {editPerInvoice ? (
                      <div className="rounded-2xl border border-sky-400/20 bg-linear-to-br from-sky-500/[0.11] to-sky-500/[0.035] p-4 shadow-sm ring-1 ring-inset ring-sky-300/[0.03] sm:p-5">
                        <p className="text-white text-sm font-semibold mb-1">
                          New Total Price
                        </p>
                        <p className="text-sky-300 text-2xl font-black">£0</p>
                        <p className="text-sky-200/70 text-xs mt-1">
                          Per Invoice — price entered on completion
                        </p>
                      </div>
                    ) : (
                      priceCalc && (
                        <div className="rounded-2xl border border-[#fe9a00]/20 bg-linear-to-br from-[#fe9a00]/[0.12] to-[#fe9a00]/[0.035] p-4 shadow-[0_10px_28px_rgba(254,154,0,0.06)] ring-1 ring-inset ring-[#fe9a00]/[0.04] sm:p-5">
                          <p className="text-white text-sm font-semibold mb-1">
                            New Total Price
                          </p>
                          <p className="text-[#fe9a00] text-2xl font-black">
                            £{editFinalPrice ?? priceCalc.totalPrice}
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            {editPriceBreakdown}
                          </p>
                          {(isManualPrice || isTotalPriceOverride) && (
                            <p className="text-purple-300 text-xs font-semibold mt-2">
                              {isTotalPriceOverride
                                ? "Total override active"
                                : "Manual daily price active"}
                            </p>
                          )}
                        </div>
                      )
                    )}

                    {requiresFreshContract && (
                      <div className="overflow-hidden rounded-xl border border-[#fe9a00]/35 bg-[#fe9a00]/[0.07]">
                        <div className="flex flex-col gap-3 sm:flex-row p-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#fe9a00]/35 bg-[#fe9a00]/15 text-[#fe9a00]">
                            <FiAlertTriangle className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white">
                              A fresh agreement will be required
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-300">
                              Saving returns this booking to Assign Vehicle. The
                              previous vehicle will be unlinked and made
                              available again. Select a vehicle before
                              generating and sending the fresh contract.
                            </p>
                          </div>
                        </div>

                        {fullPaymentPreview && (
                          <div className="border-t border-white/10 bg-[#07101f]/35 p-4">
                            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                  Full payment adjustment
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                  Includes the saved{" "}
                                  {fullPaymentPreview.discountPercent}%
                                  full-payment discount.
                                </p>
                              </div>
                              <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                                Preview
                              </span>
                            </div>
                            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 sm:gap-4">
                              <div>
                                <p className="text-xs text-slate-400">
                                  Previously paid
                                </p>
                                <p className="mt-0.5 font-bold tabular-nums text-white">
                                  £
                                  {fullPaymentPreview.previouslyPaid.toFixed(2)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-slate-400">
                                  Revised booking total
                                </p>
                                <p className="mt-0.5 font-bold tabular-nums text-white">
                                  £
                                  {fullPaymentPreview.revisedBookingTotal.toFixed(
                                    2,
                                  )}
                                </p>
                              </div>
                            </div>
                            <div
                              className={`mt-3 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 ${
                                fullPaymentPreview.state === "payment_due"
                                  ? "border-[#fe9a00]/30 bg-[#fe9a00]/10"
                                  : "border-emerald-400/25 bg-emerald-400/10"
                              }`}
                            >
                              <span
                                className={
                                  fullPaymentPreview.state === "payment_due"
                                    ? "text-xs font-semibold text-orange-200"
                                    : "text-xs font-semibold text-emerald-200"
                                }
                              >
                                {fullPaymentPreview.state === "payment_due"
                                  ? "Additional payment due"
                                  : fullPaymentPreview.state === "credit_due"
                                    ? "Customer credit"
                                    : "Payment balanced"}
                              </span>
                              <span
                                className={
                                  fullPaymentPreview.state === "payment_due"
                                    ? "font-black tabular-nums text-[#fe9a00]"
                                    : "font-black tabular-nums text-emerald-300"
                                }
                              >
                                £
                                {Math.abs(
                                  fullPaymentPreview.difference,
                                ).toFixed(2)}
                              </span>
                            </div>
                            <p className="mt-2 text-[11px] leading-4 text-slate-500">
                              Preview only. The backend performs the
                              authoritative payment calculation when this update
                              is saved.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={handleDatesUpdate}
                      disabled={isSubmitting || !editCategory}
                      className="min-h-11 w-full touch-manipulation rounded-xl border border-[#ffb247]/30 bg-linear-to-r from-[#fe9a00] to-[#ff7a00] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(254,154,0,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(254,154,0,0.22)] active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
                    >
                      {isSubmitting
                        ? "Updating..."
                        : requiresFreshContract
                          ? "Save & prepare new contract"
                          : "Update Reservation"}
                    </button>
                  </div>
                )}
              </div>

              {/* Add-ons Modal */}
              {showAddOnsModal && (
                <AddOnsModal
                  addOns={addOns}
                  selectedAddOns={selectedAddOns}
                  onSave={setSelectedAddOns}
                  onClose={() => setShowAddOnsModal(false)}
                  rentalDays={priceCalc?.totalDays || 1}
                  selectedCategoryId={editCategory}
                />
              )}

              {/* Vehicle Assignment */}
              <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/[0.075] to-white/[0.025] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-inset ring-white/[0.025] sm:p-5">
                <h3 className="text-white font-semibold mb-3">
                  Assign Vehicle
                </h3>
                <button
                  onClick={() => setIsEditOpen(!isEditOpen)}
                  className="min-h-11 w-full touch-manipulation rounded-xl bg-[#fe9a00]/20 px-4 py-2.5 text-sm font-semibold text-[#fe9a00] transition-colors hover:bg-[#fe9a00]/30 active:bg-[#fe9a00]/35"
                >
                  Edit Vehicle
                </button>

                {isEditOpen && (
                  <div className="mt-3 space-y-2">
                    <CustomSelect
                      options={filteredVehicles}
                      value={newVehicle}
                      onChange={setNewVehicle}
                      placeholder={
                        loadingVehicles
                          ? "Loading vehicles..."
                          : "Select Vehicle"
                      }
                    />
                    {!loadingVehicles && filteredVehicles.length === 0 && (
                      <p className="text-xs text-yellow-400">
                        No vehicles found for this category. Pick a different
                        category in &quot;Edit Reservation&quot; above, or add a
                        vehicle to this category.
                      </p>
                    )}
                    <button
                      onClick={async () => {
                        if (!newVehicle) return;
                        setIsSubmitting(true);
                        try {
                          // Update vehicle and status together
                          const res = await fetch(
                            `/api/reservations/${selectedReservation._id}`,
                            {
                              method: "PATCH",
                              headers: clientAuthHeaders(true),
                              body: JSON.stringify({
                                vehicle: newVehicle,
                                status: "delivered",
                              }),
                            },
                          );
                          const data = await res.json();
                          if (!data.success)
                            throw new Error(data.error || "Update failed");

                          // Set the assigned vehicle to unavailable
                          const vehicleRes = await fetch(
                            `/api/vehicles/${newVehicle}`,
                            {
                              method: "PATCH",
                              headers: clientAuthHeaders(true),
                              body: JSON.stringify({
                                available: false,
                                reservation: selectedReservation._id,
                              }),
                            },
                          );
                          const vehicleData = await vehicleRes.json();
                          if (!vehicleData.success)
                            throw new Error(
                              vehicleData.error || "Vehicle update failed",
                            );

                          showToast.success("Vehicle assigned and collected!");
                          setIsEditOpen(false);
                          if (mutateRef.current) mutateRef.current();
                          setIsDetailOpen(false);
                        } catch (error) {
                          const message =
                            error instanceof Error
                              ? error.message
                              : "Unknown error";
                          showToast.error(message || "Update failed");
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      disabled={isSubmitting || !newVehicle}
                      className="min-h-11 w-full touch-manipulation rounded-xl border border-[#ffb247]/30 bg-linear-to-r from-[#fe9a00] to-[#ff7a00] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(254,154,0,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(254,154,0,0.22)] active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
                    >
                      {isSubmitting ? "Updating..." : "Assign & Collected"}
                    </button>
                  </div>
                )}
              </div>

              <ReservationOperationsPanel
                reservation={selectedReservation}
                onUpdated={(updated) => {
                  setSelectedReservation(updated);
                  void mutateRef.current?.();
                }}
              />

              {selectedReservation.deposit && (
                <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/[0.075] to-white/[0.025] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-inset ring-white/[0.025] sm:p-5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-white font-semibold">Deposit</h3>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-gray-200 capitalize">
                      {selectedReservation.deposit.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-gray-400 text-xs">Option</p>
                      <p className="text-white font-semibold">
                        {selectedReservation.deposit.option
                          ? DEPOSIT_OPTION_LABELS[
                              selectedReservation.deposit.option
                            ]
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Amount</p>
                      <p className="text-white font-semibold">
                        £{selectedReservation.deposit.amount ?? 0}
                      </p>
                    </div>
                  </div>
                  {selectedReservation.deposit.receiptUrl && (
                    <a
                      href={selectedReservation.deposit.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex text-sm font-semibold text-[#fe9a00] hover:underline"
                    >
                      View uploaded receipt
                    </a>
                  )}
                  {selectedReservation.deposit.failureReason && (
                    <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-200">
                      {selectedReservation.deposit.failureReason}
                    </p>
                  )}
                  {selectedReservation.deposit.status === "pending" && (
                    <div className="space-y-2 border-t border-white/10 pt-3">
                      <input
                        value={depositTransactionRef}
                        onChange={(event) =>
                          setDepositTransactionRef(event.target.value)
                        }
                        placeholder="Transaction reference (optional)"
                        className="min-h-11 w-full rounded-xl border border-white/10 bg-[#070d19]/75 px-3.5 py-2.5 text-sm text-white shadow-inner outline-none placeholder:text-slate-500 transition focus:border-[#fe9a00]/70 focus:ring-4 focus:ring-[#fe9a00]/10"
                      />
                      <textarea
                        value={depositFailureReason}
                        onChange={(event) =>
                          setDepositFailureReason(event.target.value)
                        }
                        placeholder="Rejection reason (required only when rejecting)"
                        rows={2}
                        className="w-full resize-none rounded-xl border border-white/10 bg-[#070d19]/75 px-3.5 py-2.5 text-sm text-white shadow-inner outline-none placeholder:text-slate-500 transition focus:border-[#fe9a00]/70 focus:ring-4 focus:ring-[#fe9a00]/10"
                      />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          disabled={depositBusy}
                          onClick={() => handleDepositVerification("reject")}
                          className="min-h-11 touch-manipulation rounded-xl bg-red-500/15 px-3 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/25 active:bg-red-500/30 disabled:opacity-50"
                        >
                          Reject receipt
                        </button>
                        <button
                          type="button"
                          disabled={depositBusy}
                          onClick={() => handleDepositVerification("approve")}
                          className="min-h-11 touch-manipulation rounded-xl bg-emerald-500/20 px-3 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/30 active:bg-emerald-500/35 disabled:opacity-50"
                        >
                          Verify payment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status Management */}
              <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/[0.075] to-white/[0.025] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-inset ring-white/[0.025] sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">Current Status</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClasses(selectedReservation.status)}`}
                  >
                    {statusLabel(selectedReservation.status, true)}
                  </span>
                </div>
                {selectedReservation.status === "canceled" &&
                  selectedReservation.cancelReason && (
                    <div className="mb-3 rounded-lg border border-red-400/20 bg-red-500/10 p-3">
                      <p className="text-xs font-semibold text-red-200">
                        Cancel reason
                      </p>
                      <p className="mt-1 text-sm text-red-100 whitespace-pre-wrap">
                        {selectedReservation.cancelReason}
                      </p>
                    </div>
                  )}
                <button
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  className="min-h-11 w-full touch-manipulation rounded-xl bg-[#fe9a00]/20 px-4 py-2.5 text-sm font-semibold text-[#fe9a00] transition-colors hover:bg-[#fe9a00]/30 active:bg-[#fe9a00]/35"
                >
                  Change Status
                </button>

                {isStatusOpen && (
                  <div className="mt-3 space-y-2">
                    <CustomSelect
                      options={ADMIN_STATUS_OPTIONS}
                      value={newStatus}
                      onChange={setNewStatus}
                      placeholder="Select new status"
                    />
                    {newStatus === "canceled" && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                          Cancel reason
                        </label>
                        <textarea
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          rows={3}
                          placeholder="Add the reason for canceling this reservation"
                          className="w-full resize-none rounded-xl border border-white/10 bg-[#070d19]/75 px-3.5 py-2.5 text-sm text-white shadow-inner outline-none placeholder:text-slate-500 transition focus:border-[#fe9a00]/70 focus:ring-4 focus:ring-[#fe9a00]/10"
                        />
                      </div>
                    )}
                    <button
                      onClick={() => handleStatusChange()}
                      disabled={isSubmitting || !newStatus}
                      className="min-h-11 w-full touch-manipulation rounded-xl border border-[#ffb247]/30 bg-linear-to-r from-[#fe9a00] to-[#ff7a00] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(254,154,0,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(254,154,0,0.22)] active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
                    >
                      {isSubmitting ? "Updating..." : "Update Status"}
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:pt-4">
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="min-h-11 flex-1 touch-manipulation rounded-xl bg-white/10 px-4 py-3 font-semibold text-white transition-colors hover:bg-white/20 active:bg-white/25"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ReservationStepManagerModal
        reservation={stepManagerReservation}
        isOpen={isStepManagerOpen}
        onClose={() => {
          setIsStepManagerOpen(false);
          setStepManagerReservation(null);
        }}
        onStatusChange={handleStepStatusChange}
        onVerifyDeposit={submitDepositVerification}
        depositBusy={depositBusy}
        depositTransactionRef={depositTransactionRef}
        setDepositTransactionRef={setDepositTransactionRef}
        depositFailureReason={depositFailureReason}
        setDepositFailureReason={setDepositFailureReason}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        vehicles={filteredVehicles}
        selectedVehicle={newVehicle}
        setSelectedVehicle={setNewVehicle}
        loadingVehicles={loadingVehicles}
        onAssignVehicle={handleStepAssignVehicle}
        onReservationUpdated={(updated) => {
          setSelectedReservation(updated);
          setStepManagerReservation(updated);
          void mutateRef.current?.();
        }}
        isSubmitting={isSubmitting}
      />

      {/* Per-Invoice final price modal (shown when completing a per-invoice reserve) */}
      {isPerInvoicePriceOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-5">
          <div className="w-full max-w-md rounded-t-[28px] border border-white/10 bg-linear-to-b from-[#1a294a] to-[#0b1324] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.58)] ring-1 ring-inset ring-white/[0.04] sm:rounded-[28px] sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                Enter final total price
              </h3>
              <button
                onClick={() => {
                  setIsPerInvoicePriceOpen(false);
                  setPerInvoicePrice("");
                }}
                className="flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-xl transition-colors hover:bg-white/10 active:bg-white/15"
              >
                <FiX className="text-white text-xl" />
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              This is a per-invoice reservation. Enter the final total before
              marking it as completed.
            </p>
            <label className="text-white text-sm font-semibold mb-2 block">
              Total Price (£)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              autoFocus
              value={perInvoicePrice}
              onChange={(e) => setPerInvoicePrice(e.target.value)}
              placeholder="0.00"
              className="mb-4 min-h-11 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white focus:border-[#fe9a00] focus:outline-none focus:ring-2 focus:ring-[#fe9a00]/20"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => {
                  setIsPerInvoicePriceOpen(false);
                  setPerInvoicePrice("");
                }}
                className="min-h-11 flex-1 touch-manipulation rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20 active:bg-white/25"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPerInvoicePrice}
                disabled={isSubmitting || !perInvoicePrice}
                className="min-h-11 flex-1 touch-manipulation rounded-xl bg-[#fe9a00] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#e68a00] active:bg-[#d77f00] disabled:opacity-50"
              >
                {isSubmitting ? "Completing..." : "Save & Complete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Details Modal */}
      <ReservationDetailsModal
        reservation={selectedReservationForDetails}
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedReservationForDetails(null);
        }}
      />
    </div>
  );
}
