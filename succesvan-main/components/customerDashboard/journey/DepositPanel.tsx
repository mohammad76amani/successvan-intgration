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
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-950 font-semibold text-right">{value ?? "-"}</span>
    </div>
  );
}

export default function DepositPanel({
  reservation,
  onUpdated,
}: {
  reservation: Reservation;
  onUpdated: () => void;
}) {
  const deposit = reservation.deposit;
  const config = (reservation.category as Reservation["category"])?.deposit as
    | {
        amount?: number;
        fullPayDiscountPercent?: number;
        securePayPrice?: number;
        officePayPrice?: number;
      }
    | undefined;

  const [selected, setSelected] = useState<DepositOption | null>(
    deposit?.option ?? null,
  );
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const settled =
    deposit?.status === "paid" ||
    deposit?.status === "held" ||
    deposit?.status === "refunded" ||
    deposit?.status === "partially_refunded" ||
    deposit?.status === "refund_processing";
  const awaitingVerification =
    deposit?.status === "pending" && Boolean(deposit?.receiptUrl);

  const optionAmount = (option: DepositOption) =>
    option === "full"
      ? (config?.amount ?? 0)
      : option === "secure"
        ? (config?.securePayPrice ?? 0)
        : (config?.officePayPrice ?? 0);

  const copyCardNumber = () => {
    navigator.clipboard.writeText(
      DEPOSIT_PAYMENT_DETAILS.cardNumber.replace(/\s/g, ""),
    );
    showToast.success("Card number copied!");
  };

  const handleSubmit = async () => {
    if (!selected) {
      showToast.error("Please choose a deposit option");
      return;
    }
    if (selected !== "office" && !file) {
      showToast.error("Please upload your payment receipt");
      return;
    }
    setSubmitting(true);
    try {
      let receiptUrl: string | undefined;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.error) throw new Error(uploadData.error);
        receiptUrl = uploadData.url as string;
      }

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

  // ── Already settled / awaiting verification: summary view ────
  if (settled || awaitingVerification) {
    return (
      <div>
        {awaitingVerification && (
          <div className="flex items-center gap-2 bg-[#fe9a00]/10 border border-[#fe9a00]/30 rounded-lg p-3 mb-3 text-sm text-[#fe9a00]">
            <FiClock className="shrink-0" />
            We received your receipt and are verifying the payment.
          </div>
        )}
        {settled && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-3 text-sm text-green-400">
            <FiCheckCircle className="shrink-0" />
            Deposit {deposit?.status === "paid" ? "received" : deposit?.status?.replace(/_/g, " ")}.
          </div>
        )}
        <Row label="Option" value={deposit?.option ? DEPOSIT_OPTION_LABELS[deposit.option] : "-"} />
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
        {deposit?.receiptUrl && (
          <a
            href={deposit.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-sm font-semibold transition-colors"
          >
            <FiDownload /> View receipt
          </a>
        )}
      </div>
    );
  }

  // ── No deposit configured for this category ──────────────────
  if (!config || !config.amount) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
        <FiClock className="shrink-0" />
        No deposit has been requested for this booking yet. We&apos;ll let you
        know when it&apos;s due.
      </div>
    );
  }

  // ── Choose option + pay + upload receipt ─────────────────────
  const options: Array<{
    key: DepositOption;
    title: string;
    price: number;
    note: string;
    badge?: string;
  }> = [
    {
      key: "full",
      title: DEPOSIT_OPTION_LABELS.full,
      price: config.amount,
      note: "Fully refundable after the van is returned.",
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
                : "border-slate-200 bg-slate-50 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-950 font-semibold text-sm">
                {option.title}
              </span>
              <span className="text-[#fe9a00] font-black">
                £{option.price}
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-1">{option.note}</p>
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
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-slate-500 text-xs mb-2">
              Transfer{" "}
              <span className="text-[#fe9a00] font-black">
                £{optionAmount(selected)}
              </span>{" "}
              to this card, then upload your payment receipt:
            </p>
            <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg p-3">
              <div>
                <p className="text-slate-950 font-black tracking-wider">
                  {DEPOSIT_PAYMENT_DETAILS.cardNumber}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {DEPOSIT_PAYMENT_DETAILS.accountName}
                </p>
              </div>
              <button
                type="button"
                onClick={copyCardNumber}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-900 transition-colors cursor-pointer"
                title="Copy card number"
              >
                <FiCopy />
              </button>
            </div>
          </div>

          <label className="block">
            <span className="text-slate-950 text-sm font-semibold mb-2 flex items-center gap-2">
              <FiUpload className="text-[#fe9a00]" /> Payment receipt
            </span>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-slate-500 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-[#fe9a00]/20 file:text-[#fe9a00] file:font-semibold file:cursor-pointer cursor-pointer"
            />
            {file && (
              <p className="text-slate-500 text-xs mt-1">{file.name}</p>
            )}
          </label>
        </>
      )}

      {selected && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full px-4 py-2.5 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer"
        >
          {submitting
            ? "Submitting..."
            : selected === "office"
              ? "Confirm — I'll pay at the office"
              : "Submit receipt"}
        </button>
      )}
    </div>
  );
}
