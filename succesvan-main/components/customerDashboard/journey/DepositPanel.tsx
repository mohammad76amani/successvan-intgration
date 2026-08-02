"use client";

import { useState } from "react";
import {
  FiCopy,
  FiDownload,
  FiUpload,
  FiCheckCircle,
  FiClock,
  FiPercent,
} from "react-icons/fi";
import { showToast } from "@/lib/toast";
import type { Reservation } from "@/types/type";
import { DEPOSIT_PAYMENT_DETAILS } from "@/lib/payment-info";
import {
  DEPOSIT_OPTION_LABELS,
  type DepositOption,
} from "@/lib/reservation-status";

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-sm py-1">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-semibold text-right">
        {value ?? "-"}
      </span>
    </div>
  );
}

const isImageReceipt = (url: string) =>
  /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(url) ||
  url.startsWith("blob:") ||
  url.startsWith("data:image/");

const formatGBP = (amount?: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

export default function DepositPanel({
  reservation,
  onUpdated,
}: {
  reservation: Reservation;
  onUpdated: () => void;
}) {
  const deposit = reservation.deposit;
  const priceAdjustment = deposit?.priceAdjustment;
  const config =
    ((reservation.category as Reservation["category"])?.deposit as
      | {
          fullPayDiscountPercent?: number;
          securePayPrice?: number;
          officePayPrice?: number;
        }
      | undefined) ?? {};

  const [selected, setSelected] = useState<DepositOption | null>(
    deposit?.option ?? null,
  );
  const [file, setFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(
    deposit?.receiptUrl,
  );
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(
    null,
  );
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const settled =
    deposit?.status === "paid" ||
    deposit?.status === "held" ||
    deposit?.status === "refunded" ||
    deposit?.status === "partially_refunded" ||
    deposit?.status === "refund_processing";
  const awaitingVerification =
    deposit?.status === "pending" && Boolean(deposit?.receiptUrl);
  const payAtOfficeSelected = deposit?.option === "office";
  const hasCardNumber = Boolean(DEPOSIT_PAYMENT_DETAILS.cardNumber);
  const hasBankAccount = Boolean(
    DEPOSIT_PAYMENT_DETAILS.sortCode && DEPOSIT_PAYMENT_DETAILS.accountNumber,
  );
  const transferDetailsAvailable = hasCardNumber || hasBankAccount;

  const fullOriginalAmount =
    deposit?.option === "full" && deposit.originalAmount !== undefined
      ? deposit.originalAmount
      : (reservation.totalPrice ?? 0);
  const fullDiscountPercent = Math.min(
    100,
    Math.max(0, Number(config.fullPayDiscountPercent) || 0),
  );
  const fullDiscountAmount =
    Math.round(fullOriginalAmount * (fullDiscountPercent / 100) * 100) / 100;
  const fullPaymentAmount =
    Math.round((fullOriginalAmount - fullDiscountAmount) * 100) / 100;

  const optionAmount = (option: DepositOption) =>
    option === "full"
      ? fullPaymentAmount
      : option === "secure"
        ? (config?.securePayPrice ?? 0)
        : (config?.officePayPrice ?? 0);

  const copyPaymentValue = (value: string, label: string) => {
    navigator.clipboard.writeText(value.replace(/\s/g, ""));
    showToast.success(`${label} copied`);
  };

  const handleReceiptSelect = async (selectedFile: File | null) => {
    if (!transferDetailsAvailable) {
      setFile(null);
      setReceiptUrl(undefined);
      showToast.error(
        "Payment details are not configured. Please contact support or pay at the office.",
      );
      return;
    }
    setFile(selectedFile);
    setReceiptUrl(undefined);
    if (!selectedFile) return;

    setUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (uploadData.error) throw new Error(uploadData.error);
      setReceiptUrl(uploadData.url as string);
      showToast.success("Receipt uploaded");
    } catch (error) {
      setFile(null);
      showToast.error(
        error instanceof Error ? error.message : "Receipt upload failed",
      );
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async () => {
    if (!selected) {
      showToast.error("Please choose a deposit option");
      return;
    }
    if (selected !== "office" && !transferDetailsAvailable) {
      showToast.error(
        "Payment details are not configured. Please contact support or pay at the office.",
      );
      return;
    }
    if (selected !== "office" && !receiptUrl) {
      showToast.error("Please upload your payment receipt");
      return;
    }
    if (uploadingReceipt) {
      showToast.error("Please wait for the receipt upload to finish");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reservations/${reservation._id}/deposit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ option: selected, receiptUrl }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Request failed");

      showToast.success(
        selected === "office"
          ? "Noted — you'll pay the deposit at the office."
          : "Receipt uploaded! We'll verify your payment shortly.",
      );
      onUpdated();
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Could not submit deposit",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderReceiptPreview = (url: string, label = "Payment receipt") => {
    if (!isImageReceipt(url)) {
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
        >
          <FiDownload /> View receipt file
        </a>
      );
    }

    return (
      <button
        type="button"
        onClick={() => setPreviewReceiptUrl(url)}
        className="mt-3 flex w-fit items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-2 text-left transition hover:border-[#fe9a00]/40 hover:bg-white/5"
      >
        <img
          src={url}
          alt={label}
          className="h-16 w-20 rounded-lg object-cover"
        />
        <span>
          <span className="block text-xs font-black uppercase tracking-wide text-[#fe9a00]">
            Uploaded receipt
          </span>
          <span className="mt-1 block text-sm font-semibold text-white">
            Click to view
          </span>
        </span>
      </button>
    );
  };

  const receiptPreviewModal = previewReceiptUrl ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0b1224] p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="font-semibold text-white">Payment receipt</p>
          <button
            type="button"
            onClick={() => setPreviewReceiptUrl(null)}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/20"
          >
            Close
          </button>
        </div>
        <img
          src={previewReceiptUrl}
          alt="Payment receipt"
          className="max-h-[75vh] w-full rounded-xl object-contain"
        />
      </div>
    </div>
  ) : null;

  // ── Already settled / awaiting verification: summary view ────
  if (settled || awaitingVerification || payAtOfficeSelected) {
    return (
      <>
        <div>
          {payAtOfficeSelected && !settled && !awaitingVerification && (
            <div className="flex items-center gap-2 bg-[#fe9a00]/10 border border-[#fe9a00]/30 rounded-lg p-3 mb-3 text-sm text-[#fe9a00]">
              <FiClock className="shrink-0" />
              Pay-at-office selected. You’ll pay at collection before signing
              and handover.
            </div>
          )}
          {awaitingVerification && (
            <div className="flex items-center gap-2 bg-[#fe9a00]/10 border border-[#fe9a00]/30 rounded-lg p-3 mb-3 text-sm text-[#fe9a00]">
              <FiClock className="shrink-0" />
              We received your receipt and are verifying the payment.
            </div>
          )}
          {settled && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-3 text-sm text-green-400">
              <FiCheckCircle className="shrink-0" />
              Deposit{" "}
              {deposit?.status === "paid"
                ? "received"
                : deposit?.status?.replace(/_/g, " ")}
              .
            </div>
          )}
          <Row
            label="Option"
            value={
              deposit?.option ? DEPOSIT_OPTION_LABELS[deposit.option] : "-"
            }
          />
          <Row label="Amount" value={`£${deposit?.amount ?? 0}`} />
          {(deposit?.discountPercent ?? 0) > 0 && (
            <Row
              label="Rental discount"
              value={
                <span className="text-green-400">
                  {deposit!.discountPercent}% off
                </span>
              }
            />
          )}
          {deposit?.paidAt && (
            <Row
              label="Paid on"
              value={new Date(deposit.paidAt).toLocaleString("en-GB", {
                timeZone: "Europe/London",
              })}
            />
          )}
          {deposit?.transactionRef && (
            <Row label="Transaction reference" value={deposit.transactionRef} />
          )}
          {priceAdjustment?.status && (
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
              <div className="border-b border-white/10 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">
                  Updated booking price
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-300">
                  Your booking was updated after payment. Here is the saved
                  balance calculation.
                </p>
              </div>

              <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="min-w-0 px-4 py-3">
                  <p className="text-xs font-medium text-gray-400">
                    Amount already paid
                  </p>
                  <p className="mt-1 break-words text-lg font-black text-white">
                    {formatGBP(priceAdjustment.paidAmount)}
                  </p>
                </div>
                <div className="min-w-0 px-4 py-3">
                  <p className="text-xs font-medium text-gray-400">
                    Revised booking total
                  </p>
                  <p className="mt-1 break-words text-lg font-black text-white">
                    {formatGBP(priceAdjustment.revisedTotal)}
                  </p>
                </div>
              </div>

              <div
                className={`border-t px-4 py-3 ${
                  priceAdjustment.status === "payment_due"
                    ? "border-[#fe9a00]/25 bg-[#fe9a00]/10"
                    : priceAdjustment.status === "credit_due"
                      ? "border-emerald-400/25 bg-emerald-400/10"
                      : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <p
                    className={`text-sm font-bold ${
                      priceAdjustment.status === "payment_due"
                        ? "text-[#fe9a00]"
                        : priceAdjustment.status === "credit_due"
                          ? "text-emerald-300"
                          : "text-white"
                    }`}
                  >
                    {priceAdjustment.status === "payment_due"
                      ? "Additional payment due"
                      : priceAdjustment.status === "credit_due"
                        ? "Customer credit"
                        : "No payment adjustment required"}
                  </p>
                  {priceAdjustment.status !== "balanced" && (
                    <p
                      className={`shrink-0 text-xl font-black ${
                        priceAdjustment.status === "payment_due"
                          ? "text-[#fe9a00]"
                          : "text-emerald-300"
                      }`}
                    >
                      {formatGBP(
                        priceAdjustment.status === "payment_due"
                          ? priceAdjustment.balanceDue
                          : priceAdjustment.creditAmount,
                      )}
                    </p>
                  )}
                </div>
                <p className="mt-1 text-xs leading-5 text-gray-300">
                  {priceAdjustment.status === "payment_due"
                    ? "SuccessVanHire will contact you with the next payment instructions."
                    : priceAdjustment.status === "credit_due"
                      ? "SuccessVanHire will handle this credit and contact you with the next steps."
                      : "Your payment matches the revised booking total, so nothing else is required."}
                </p>
              </div>
            </div>
          )}
          {deposit?.receiptUrl && renderReceiptPreview(deposit.receiptUrl)}
        </div>
        {receiptPreviewModal}
      </>
    );
  }

  // ── Choose option + pay + upload receipt ─────────────────────
  const options: Array<{
    key: DepositOption;
    title: string;
    price: number;
    note: string;
    badge?: string;
    originalPrice?: number;
  }> = [
    {
      key: "full",
      title: DEPOSIT_OPTION_LABELS.full,
      price: fullPaymentAmount,
      originalPrice: fullDiscountPercent > 0 ? fullOriginalAmount : undefined,
      note:
        fullDiscountPercent > 0
          ? `Pay in full now and save £${fullDiscountAmount.toFixed(2)}. You pay £${fullPaymentAmount.toFixed(2)} instead of £${fullOriginalAmount.toFixed(2)}.`
          : "Pay the full booking total now by bank transfer.",
      badge:
        (config.fullPayDiscountPercent ?? 0) > 0
          ? `${config.fullPayDiscountPercent}% off your rental`
          : undefined,
    },
    {
      key: "secure",
      title: DEPOSIT_OPTION_LABELS.secure,
      price: config.securePayPrice ?? 0,
      note: "Smaller one-off fee instead of the full deposit. Non-refundable.",
    },
    {
      key: "office",
      title: DEPOSIT_OPTION_LABELS.office,
      price: config.officePayPrice ?? 0,
      note: "Pay the deposit when you collect the van at the office.",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Options */}
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setSelected(option.key)}
            className={`w-full text-left rounded-xl border p-3 transition-colors cursor-pointer ${
              selected === option.key
                ? "border-[#fe9a00] bg-[#fe9a00]/10"
                : "border-white/10 bg-black/20 hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-white font-semibold text-sm">
                {option.title}
              </span>
              <span className="text-right">
                {option.originalPrice !== undefined && (
                  <span className="mr-2 text-xs font-semibold text-gray-500 line-through">
                    £{option.originalPrice.toFixed(2)}
                  </span>
                )}
                <span className="font-black text-[#fe9a00]">
                  £{option.price.toFixed(2)}
                </span>
              </span>
            </div>
            <p className="text-gray-400 text-xs mt-1">{option.note}</p>
            {option.badge && (
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
                <FiPercent className="text-[10px]" /> {option.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bank details + receipt upload for transfer options */}
      {selected && selected !== "office" && (
        <>
          {transferDetailsAvailable ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              {DEPOSIT_PAYMENT_DETAILS.isTestCard && (
                <div className="mb-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-200">
                  Test payment details only — no real payment will be processed.
                </div>
              )}
              <p className="mb-2 text-xs text-gray-400">
                Make a direct transfer of{" "}
                <span className="font-black text-[#fe9a00]">
                  £{optionAmount(selected)}
                </span>{" "}
                using the details below, then upload your receipt.
              </p>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">
                  Account holder
                </p>
                <p className="mt-0.5 text-sm font-semibold text-white">
                  {DEPOSIT_PAYMENT_DETAILS.accountName}
                </p>
              </div>
              {hasCardNumber && (
                <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 p-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">
                      Card number
                    </p>
                    <p className="font-black tracking-wider text-white">
                      {DEPOSIT_PAYMENT_DETAILS.cardNumber}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyPaymentValue(
                        DEPOSIT_PAYMENT_DETAILS.cardNumber,
                        "Card number",
                      )
                    }
                    className="cursor-pointer rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                    title="Copy card number"
                  >
                    <FiCopy />
                  </button>
                </div>
              )}
              {hasBankAccount && (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 p-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">
                        Sort code
                      </p>
                      <p className="mt-0.5 font-semibold text-white">
                        {DEPOSIT_PAYMENT_DETAILS.sortCode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyPaymentValue(
                          DEPOSIT_PAYMENT_DETAILS.sortCode,
                          "Sort code",
                        )
                      }
                      className="rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                      title="Copy sort code"
                    >
                      <FiCopy />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 p-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">
                        Account number
                      </p>
                      <p className="mt-0.5 font-semibold text-white">
                        {DEPOSIT_PAYMENT_DETAILS.accountNumber}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyPaymentValue(
                          DEPOSIT_PAYMENT_DETAILS.accountNumber,
                          "Account number",
                        )
                      }
                      className="rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                      title="Copy account number"
                    >
                      <FiCopy />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-[#fe9a00]/35 bg-[#fe9a00]/10 p-4">
              <p className="text-sm font-bold text-[#fe9a00]">
                Direct-transfer payment is unavailable
              </p>
              <p className="mt-1 text-xs leading-5 text-gray-300">
                Payment details are not configured. Please contact support or
                choose Pay at Office.
              </p>
            </div>
          )}

          <label className="block">
            <span className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
              <FiUpload className="text-[#fe9a00]" /> Payment receipt
            </span>
            <input
              type="file"
              accept="image/*,.pdf"
              disabled={
                !transferDetailsAvailable || uploadingReceipt || submitting
              }
              onChange={(e) => handleReceiptSelect(e.target.files?.[0] ?? null)}
              className="w-full cursor-pointer text-sm text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#fe9a00]/20 file:px-4 file:py-2 file:font-semibold file:text-[#fe9a00]"
            />
            {uploadingReceipt && (
              <p className="mt-1 text-xs font-semibold text-[#fe9a00]">
                Uploading receipt...
              </p>
            )}
            {file && (
              <p className="text-gray-400 text-xs mt-1">
                {file.name}
                {receiptUrl ? (
                  <span className="ml-2 font-semibold text-emerald-300">
                    Uploaded
                  </span>
                ) : null}
              </p>
            )}
            {receiptUrl && renderReceiptPreview(receiptUrl)}
          </label>
        </>
      )}

      {selected && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            submitting ||
            uploadingReceipt ||
            (selected !== "office" && !transferDetailsAvailable)
          }
          className="w-full px-4 py-2.5 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer"
        >
          {submitting
            ? "Submitting..."
            : selected !== "office" && !transferDetailsAvailable
              ? "Direct transfer unavailable"
              : selected === "office"
                ? "Confirm — I'll pay at the office"
                : "Submit receipt"}
        </button>
      )}
      {receiptPreviewModal}
    </div>
  );
}
