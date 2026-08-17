"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiClock,
  FiDownload,
  FiFileText,
  FiLoader,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";
import { clientAuthHeaders } from "@/lib/client-auth";
import {
  formatDateForStorage,
  formatDateInputInLondon,
  formatDateTimeLabelInLondon,
} from "@/lib/englandTime";
import { showToast } from "@/lib/toast";
import type { SafeContractSummary } from "@/lib/docusign/types";
import {
  extensionPanelState,
  isPendingExtensionStatus,
} from "@/lib/contracts/extension-status";
import type { Reservation } from "@/types/type";

type ReservationExtensionPanelProps = {
  reservation: Reservation;
  onCreated?: () => void;
};

type PriceLine = {
  label: string;
  amount: number;
};

type ExtensionPreview = {
  currentReturnDateTime: string;
  newReturnDateTime: string;
  originalContractNumber?: string;
  pricing: {
    durationLabel: string;
    totalPrice: number;
    breakdown: PriceLine[];
  };
};

const inputClass =
  "mt-1.5 min-h-11 w-full rounded-lg border border-white/10 bg-[#07101f]/80 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:border-[#fe9a00]/70 focus:ring-2 focus:ring-[#fe9a00]/15 disabled:cursor-not-allowed disabled:opacity-50";

const money = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(Number(value) || 0);

const dateInputValue = (value: Date | string) => {
  return formatDateInputInLondon(value);
};

const dateFromInputValue = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const displayDateTime = (value: Date | string, fallbackTime?: string) => {
  const londonLabel = formatDateTimeLabelInLondon(value);
  if (!londonLabel) return "Not set";
  return fallbackTime
    ? `${londonLabel.replace(/ at \d{2}:\d{2}$/, "")} at ${fallbackTime}`
    : londonLabel;
};

const safeFilePart = (value: string) =>
  value.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") ||
  "extension-agreement";

const displayStoredDateTime = (dateValue?: string, timeValue?: string) => {
  if (!dateValue) return null;
  const [year, month, day] = dateValue.split("-").map(Number);
  if (!year || !month || !day) return null;
  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
  return `${dateLabel} at ${timeValue || "09:00"}`;
};

const apiError = (payload: unknown, fallback: string) => {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }
  return fallback;
};

export default function ReservationExtensionPanel({
  reservation,
  onCreated,
}: ReservationExtensionPanelProps) {
  const [open, setOpen] = useState(false);
  const [newReturnDate, setNewReturnDate] = useState("");
  const [newReturnTime, setNewReturnTime] = useState(
    reservation.returnTime || "09:00",
  );
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [customPrice, setCustomPrice] = useState("");
  const [customPriceReason, setCustomPriceReason] = useState("");
  const [preview, setPreview] = useState<ExtensionPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [latestExtension, setLatestExtension] =
    useState<SafeContractSummary | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [existingCheckError, setExistingCheckError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLElement>(null);

  const reservationId = reservation._id || "";
  const currentReturnLabel = useMemo(
    () =>
      displayStoredDateTime(
        reservation.endDateDisplay,
        reservation.returnTime,
      ) || displayDateTime(reservation.endDate, reservation.returnTime),
    [
      reservation.endDate,
      reservation.endDateDisplay,
      reservation.returnTime,
    ],
  );
  const minimumReturnDate = useMemo(
    () => reservation.endDateDisplay || dateInputValue(reservation.endDate),
    [reservation.endDate, reservation.endDateDisplay],
  );
  const selectedReturnDate = useMemo(
    () => dateFromInputValue(newReturnDate),
    [newReturnDate],
  );
  const minimumReturnDateValue = useMemo(
    () => dateFromInputValue(minimumReturnDate) || new Date(),
    [minimumReturnDate],
  );
  const agreedPrice = useCustomPrice
    ? Number(customPrice)
    : preview?.pricing.totalPrice;

  useEffect(() => {
    if (!reservationId) {
      setCheckingExisting(false);
      return;
    }
    const controller = new AbortController();
    const checkExisting = async () => {
      setExistingCheckError(false);
      try {
        const response = await fetch(
          `/api/admin/contracts?bookingId=${encodeURIComponent(reservationId)}&limit=100`,
          {
            headers: clientAuthHeaders(),
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(apiError(payload, "Could not check extension status"));
        }
        const contracts = Array.isArray(payload.data?.data)
          ? payload.data.data
          : [];
        setLatestExtension(
          contracts.find(
            (contract: SafeContractSummary) =>
              contract.contractType === "reservation_extension",
          ) || null,
        );
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.warn("Could not check existing rental extensions", error);
          setExistingCheckError(true);
        }
      } finally {
        if (!controller.signal.aborted) setCheckingExisting(false);
      }
    };
    void checkExisting();
    return () => controller.abort();
  }, [reservationId]);

  const extensionPending = Boolean(
    latestExtension && isPendingExtensionStatus(latestExtension.status),
  );
  const extensionCompleted = latestExtension?.status === "completed";
  const panelState = extensionPanelState({
    exists: Boolean(latestExtension),
    sourceAvailable: latestExtension?.files.source,
  });

  const extensionStatusLabel = latestExtension
    ? latestExtension.status === "completed"
      ? "Extension signed"
      : extensionPending
        ? "Awaiting customer signature"
        : `Extension ${latestExtension.status.replaceAll("_", " ")}`
    : null;

  const downloadExtension = async () => {
    if (!latestExtension || downloading) return;
    setDownloading(true);
    setDownloadError("");
    try {
      const response = await fetch(
        `/api/admin/contracts/${latestExtension._id}/document?type=source`,
        { headers: clientAuthHeaders(), cache: "no-store" },
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(apiError(payload, "Could not download agreement"));
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeFilePart(latestExtension.contractNumber)}-extension-agreement.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not download agreement";
      setDownloadError(message);
      showToast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  const resetForm = () => {
    setNewReturnDate("");
    setNewReturnTime(reservation.returnTime || "09:00");
    setUseCustomPrice(false);
    setCustomPrice("");
    setCustomPriceReason("");
    setPreview(null);
    setPreviewError("");
    setValidationError("");
  };

  const closeModal = useCallback(() => {
    if (submitting) return;
    setOpen(false);
    window.setTimeout(() => triggerButtonRef.current?.focus(), 0);
  }, [submitting]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
      if (event.key === "Tab" && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]',
          ),
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [closeModal, open]);

  useEffect(() => {
    if (!open || !reservationId || !newReturnDate || !newReturnTime) {
      setPreview(null);
      setPreviewError("");
      setPreviewing(false);
      return;
    }

    if (
      newReturnDate === minimumReturnDate &&
      newReturnTime <= (reservation.returnTime || "00:00")
    ) {
      setPreview(null);
      setPreviewing(false);
      setPreviewError("Choose a time after the current return time.");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setPreviewing(true);
      setPreviewError("");
      try {
        const query = new URLSearchParams({
          newReturnDate,
          newReturnTime,
        });
        const response = await fetch(
          `/api/admin/reservations/${reservationId}/extensions?${query.toString()}`,
          {
            headers: clientAuthHeaders(),
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const payload = await response.json();
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(apiError(payload, "Could not calculate extension"));
        }
        setPreview(payload.data as ExtensionPreview);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setPreview(null);
        setPreviewError(
          error instanceof Error
            ? error.message
            : "Could not calculate extension",
        );
      } finally {
        if (!controller.signal.aborted) setPreviewing(false);
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    minimumReturnDate,
    newReturnDate,
    newReturnTime,
    open,
    reservation.returnTime,
    reservationId,
  ]);

  const submitExtension = async () => {
    if (submitting) return;
    setValidationError("");
    if (!reservationId) {
      setValidationError("Reservation ID is missing");
      return;
    }
    if (!newReturnDate || !newReturnTime || !preview) {
      setValidationError(
        previewError || "Choose a valid new return date and time",
      );
      return;
    }
    if (useCustomPrice) {
      const value = Number(customPrice);
      if (!Number.isFinite(value) || value < 0) {
        setValidationError("Enter a valid custom price");
        return;
      }
      if (customPriceReason.trim().length < 3) {
        setValidationError(
          "Enter a reason for overriding the calculated price",
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const body = {
        newReturnDate,
        newReturnTime,
        ...(useCustomPrice
          ? {
              customPrice: Number(Number(customPrice).toFixed(2)),
              customPriceReason: customPriceReason.trim(),
            }
          : {}),
      };
      const response = await fetch(
        `/api/admin/reservations/${reservationId}/extensions`,
        {
          method: "POST",
          headers: clientAuthHeaders(true),
          body: JSON.stringify(body),
        },
      );
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(
          apiError(payload, "Could not create the extension agreement"),
        );
      }
      showToast.success("Extension agreement created and sent for signing");
      setLatestExtension(payload.data as SafeContractSummary);
      setOpen(false);
      resetForm();
      onCreated?.();
    } catch (error) {
      showToast.error(
        error instanceof Error
          ? error.message
          : "Could not create the extension agreement",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="rounded-2xl border border-white/[0.09] bg-[#0b1426]/80 p-4 shadow-lg shadow-black/10 backdrop-blur-xl sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                extensionCompleted
                  ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
                  : "border-[#fe9a00]/25 bg-[#fe9a00]/10 text-[#fe9a00]"
              }`}
            >
              {extensionCompleted ? (
                <FiCheck aria-hidden="true" className="h-4 w-4" />
              ) : (
                <FiRefreshCw
                  aria-hidden="true"
                  className={`h-4 w-4 ${checkingExisting ? "animate-spin" : ""}`}
                />
              )}
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-black tracking-tight text-white">
                {extensionPending
                  ? "Extension agreement pending"
                  : extensionCompleted
                    ? "Extension agreement signed"
                    : latestExtension
                      ? "Extension agreement"
                      : "Extend rental"}
              </h3>
              {latestExtension ? (
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-slate-400">
                  <strong className="font-bold text-slate-200">
                    {latestExtension.contractNumber || "Extension agreement"}
                  </strong>
                  <span aria-hidden="true" className="text-slate-600">•</span>
                  <span>
                    New return {latestExtension.extension?.newReturnDateTime
                      ? displayDateTime(latestExtension.extension.newReturnDateTime)
                      : "pending"}
                  </span>
                  {extensionStatusLabel && (
                    <span className="rounded-full border border-[#fe9a00]/25 bg-[#fe9a00]/10 px-2 py-0.5 font-bold text-[#ffb340]">
                      {extensionStatusLabel}
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs leading-5 text-slate-400">
                  <span>Current return</span>
                  <strong className="font-semibold text-slate-200">
                    {currentReturnLabel}
                  </strong>
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {panelState === "download" && (
              <button
                type="button"
                onClick={downloadExtension}
                disabled={downloading}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#fe9a00]/30 bg-[#fe9a00]/10 px-4 py-2.5 text-sm font-black text-[#ffb340] transition hover:border-[#fe9a00]/50 hover:bg-[#fe9a00]/15 focus:outline-none focus:ring-2 focus:ring-[#fe9a00]/35 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {downloading ? (
                  <FiLoader aria-hidden="true" className="animate-spin" />
                ) : (
                  <FiDownload aria-hidden="true" />
                )}
                {downloading ? "Downloading…" : "Download extension agreement"}
              </button>
            )}
            {panelState === "agreement_preparing" && (
              <span className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-slate-400">
                <FiLoader aria-hidden="true" className="animate-spin" />
                Agreement preparing
              </span>
            )}
            {panelState === "create" && !existingCheckError && (
              <button
                ref={triggerButtonRef}
                type="button"
                onClick={() => setOpen(true)}
                disabled={!reservationId || checkingExisting}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#fe9a00] px-4 py-2.5 text-sm font-black text-[#111827] transition hover:bg-[#ffad2f] focus:outline-none focus:ring-2 focus:ring-[#fe9a00]/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {checkingExisting ? "Checking…" : "Create extension"}
                <FiArrowRight aria-hidden="true" />
              </button>
            )}
            {existingCheckError && (
              <span className="inline-flex min-h-11 items-center rounded-lg border border-red-400/20 bg-red-500/10 px-4 text-sm font-bold text-red-200">
                Agreement status unavailable
              </span>
            )}
          </div>
        </div>
        {downloadError && (
          <p className="mt-3 text-xs font-semibold text-red-300" role="alert">
            {downloadError}
          </p>
        )}
      </section>

      {open && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-[#020617]/85 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="extension-modal-title"
            className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden border border-white/10 bg-[#0a1325]/95 shadow-2xl shadow-black/50 backdrop-blur-xl sm:max-h-[90vh] sm:rounded-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-4 py-4 sm:px-6">
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#fe9a00]">
                  Reservation {reservation.reservationCode || ""}
                </p>
                <h2
                  id="extension-modal-title"
                  className="text-xl font-black tracking-tight text-white sm:text-2xl"
                >
                  Create rental extension
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Calculate the extra hire and send the extension agreement
                  through DocuSign.
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close extension modal"
                onClick={closeModal}
                disabled={submitting}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#fe9a00]/40 disabled:opacity-50"
              >
                <FiX aria-hidden="true" className="h-5 w-5" />
              </button>
            </header>

            <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)] lg:overflow-hidden">
              <div className="space-y-6 p-4 sm:p-6 lg:overflow-y-auto">
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <FiCalendar aria-hidden="true" className="text-[#fe9a00]" />
                    <h3 className="text-sm font-black text-white">
                      New return
                    </h3>
                  </div>
                  <div className="mb-3 flex items-center gap-3 border-l-2 border-[#fe9a00] bg-[#fe9a00]/[0.06] px-3 py-2.5 text-xs text-slate-300">
                    <FiClock aria-hidden="true" className="shrink-0 text-[#fe9a00]" />
                    <span>
                      Current return: <strong>{currentReturnLabel}</strong>
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-slate-300">
                      New return date
                      <DatePicker
                        className={inputClass}
                        selected={selectedReturnDate}
                        onChange={(date: Date | null) =>
                          setNewReturnDate(date ? formatDateForStorage(date) : "")
                        }
                        minDate={minimumReturnDateValue}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Select new return date"
                        wrapperClassName="svh-date-filter mt-1.5 w-full"
                        calendarClassName="svh-datepicker-calendar"
                        popperClassName="svh-traffic-violation-datepicker-popper"
                        portalId="svh-datepicker-portal"
                        showPopperArrow={false}
                        disabled={submitting}
                        required
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-300">
                      New return time
                      <input
                        className={inputClass}
                        type="time"
                        value={newReturnTime}
                        onChange={(event) =>
                          setNewReturnTime(event.target.value)
                        }
                        disabled={submitting}
                        required
                      />
                    </label>
                  </div>
                </section>

                <section className="border-t border-white/[0.08] pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-black text-white">
                        Custom price
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Keep the calculated amount or enter an agreed price.
                      </p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-300">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={useCustomPrice}
                        onChange={(event) =>
                          setUseCustomPrice(event.target.checked)
                        }
                        disabled={submitting}
                      />
                      <span className="relative h-6 w-11 rounded-full border border-white/15 bg-white/10 transition peer-checked:border-[#fe9a00]/60 peer-checked:bg-[#fe9a00]/20 peer-focus-visible:ring-2 peer-focus-visible:ring-[#fe9a00]/40 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-slate-300 after:transition-transform peer-checked:after:translate-x-5 peer-checked:after:bg-[#fe9a00]" />
                      Override
                    </label>
                  </div>
                  {useCustomPrice && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-semibold text-slate-300">
                        Custom price (£)
                        <input
                          className={inputClass}
                          type="number"
                          min="0"
                          step="0.01"
                          value={customPrice}
                          onChange={(event) =>
                            setCustomPrice(event.target.value)
                          }
                          placeholder="0.00"
                          disabled={submitting}
                          required
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-300">
                        Override reason
                        <input
                          className={inputClass}
                          value={customPriceReason}
                          onChange={(event) =>
                            setCustomPriceReason(event.target.value)
                          }
                          placeholder="Why was the price changed?"
                          disabled={submitting}
                          required
                        />
                      </label>
                    </div>
                  )}
                </section>

              </div>

              <aside className="border-t border-white/[0.08] bg-[#07101f]/70 p-4 sm:p-6 lg:overflow-y-auto lg:border-l lg:border-t-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Extension calculation
                </p>
                {previewing ? (
                  <div className="flex min-h-48 flex-col items-center justify-center text-center">
                    <FiLoader
                      aria-hidden="true"
                      className="mb-3 h-6 w-6 animate-spin text-[#fe9a00]"
                    />
                    <p className="text-sm font-bold text-slate-200">
                      Calculating price
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Checking rates and availability…
                    </p>
                  </div>
                ) : previewError ? (
                  <div className="mt-4 border border-red-400/20 bg-red-400/[0.06] p-3 text-xs leading-5 text-red-200">
                    {previewError}
                  </div>
                ) : preview ? (
                  <div className="mt-4">
                    <div className="mb-5 border-l-2 border-emerald-400 bg-emerald-400/[0.05] px-3 py-2.5">
                      <p className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                        <FiCheck aria-hidden="true" /> Vehicle available
                      </p>
                      <p className="mt-1 text-sm font-black text-white">
                        {preview.pricing.durationLabel}
                      </p>
                    </div>
                    <div className="space-y-3">
                      {preview.pricing.breakdown.map((line, index) => (
                        <div
                          key={`${line.label}-${index}`}
                          className="flex items-start justify-between gap-4 text-xs"
                        >
                          <span className="leading-5 text-slate-400">
                            {line.label}
                          </span>
                          <strong className="shrink-0 text-slate-200">
                            {money(line.amount)}
                          </strong>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 border-t border-white/10 pt-4">
                      {useCustomPrice && (
                        <div className="mb-2 flex items-center justify-between gap-4 text-xs text-slate-500">
                          <span>Calculated</span>
                          <span className="line-through">
                            {money(preview.pricing.totalPrice)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-end justify-between gap-4">
                        <span className="text-sm font-black text-white">
                          {useCustomPrice ? "Agreed price" : "Total"}
                        </span>
                        <strong className="text-2xl font-black tracking-tight text-[#fe9a00]">
                          {money(
                            Number.isFinite(Number(agreedPrice))
                              ? Number(agreedPrice)
                              : 0,
                          )}
                        </strong>
                      </div>
                      <div className="mt-4 border-l-2 border-[#fe9a00] bg-[#fe9a00]/[0.07] px-3 py-2.5">
                        <p className="text-xs font-bold leading-5 text-amber-100">
                          This extension price must be paid at the office.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-48 flex-col items-center justify-center text-center">
                    <FiCalendar
                      aria-hidden="true"
                      className="mb-3 h-6 w-6 text-slate-600"
                    />
                    <p className="text-sm font-bold text-slate-300">
                      Select a new return
                    </p>
                    <p className="mt-1 max-w-52 text-xs leading-5 text-slate-500">
                      The calculated duration and price breakdown will appear
                      here.
                    </p>
                  </div>
                )}
              </aside>
            </div>

            <footer className="flex flex-col-reverse gap-2 border-t border-white/[0.08] bg-[#091222] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div aria-live="polite">
                {validationError ? (
                  <p className="text-xs font-semibold text-red-300">
                    {validationError}
                  </p>
                ) : (
                  <p className="text-[11px] leading-5 text-slate-500">
                    The reservation updates only after the customer signs.
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="min-h-11 flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white disabled:opacity-50 sm:flex-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitExtension}
                  disabled={submitting || previewing || !preview}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#fe9a00] px-5 py-2 text-sm font-black text-[#111827] transition hover:bg-[#ffad2f] focus:outline-none focus:ring-2 focus:ring-[#fe9a00]/40 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                >
                  {submitting ? (
                    <>
                      <FiLoader aria-hidden="true" className="animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <FiFileText aria-hidden="true" />
                      Create &amp; send
                    </>
                  )}
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
