"use client";

import {
  FiCreditCard,
  FiFileText,
  FiMapPin,
  FiRefreshCw,
  FiArrowRight,
} from "react-icons/fi";
import type { ReservationJourneyViewModel } from "@/types/reservation-journey";

const depositStatusLabels: Record<string, string> = {
  not_paid: "Not paid",
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  held: "Held",
  refund_processing: "Refund processing",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
};

const contractStatusLabels: Record<string, string> = {
  not_created: "Not created",
  generating: "Being prepared",
  awaiting_customer_signature: "Awaiting signature",
  signed: "Signed",
  expired: "Expired",
};

const refundStatusLabels: Record<string, string> = {
  not_started: "Not started",
  under_review: "Under review",
  approved: "Approved",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

function CompactCard({
  icon,
  title,
  lines,
  buttonLabel,
  onClick,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  lines: Array<{ label: string; value: string; tone?: "ok" | "warn" | "bad" }>;
  buttonLabel: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 border flex flex-col ${
        highlight
          ? "bg-[#fe9a00]/10 border-[#fe9a00]/40"
          : "bg-white/5 border-white/10"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[#fe9a00]">{icon}</span>
        <h4 className="text-white font-bold text-sm">{title}</h4>
      </div>
      <div className="space-y-1.5 text-xs flex-1">
        {lines.map((line) => (
          <div key={line.label} className="flex justify-between gap-2">
            <span className="text-gray-400">{line.label}</span>
            <span
              className={`font-semibold text-right ${
                line.tone === "ok"
                  ? "text-green-400"
                  : line.tone === "warn"
                    ? "text-[#fe9a00]"
                    : line.tone === "bad"
                      ? "text-red-400"
                      : "text-white"
              }`}
            >
              {line.value}
            </span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onClick}
        className="mt-3 inline-flex items-center justify-center gap-1 w-full px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
      >
        {buttonLabel}
        <FiArrowRight />
      </button>
    </div>
  );
}

export default function JourneyDetailCards({
  journey,
  onSectionLink,
}: {
  journey: ReservationJourneyViewModel;
  onSectionLink: (sectionId: string) => void;
}) {
  const deposit = journey.deposit;
  const contract = journey.contract;
  const refund = journey.refund;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <CompactCard
        icon={<FiCreditCard />}
        title="Deposit"
        highlight={journey.mainStatus === "deposit_pending"}
        lines={
          deposit
            ? [
                {
                  label: "Status",
                  value: depositStatusLabels[deposit.status] || deposit.status,
                  tone:
                    deposit.status === "paid" || deposit.status === "refunded"
                      ? "ok"
                      : deposit.status === "failed"
                        ? "bad"
                        : "warn",
                },
                { label: "Amount", value: `£${deposit.amount}` },
                ...(deposit.paidAt
                  ? [{ label: "Paid", value: deposit.paidAt }]
                  : deposit.dueAt
                    ? [{ label: "Due", value: deposit.dueAt }]
                    : []),
              ]
            : [{ label: "Status", value: "Not requested yet" }]
        }
        buttonLabel={
          deposit?.status === "paid" || deposit?.receiptUrl
            ? "View Receipt"
            : "Pay / Details"
        }
        onClick={() => onSectionLink("deposit")}
      />

      <CompactCard
        icon={<FiFileText />}
        title="Contract"
        highlight={contract?.status === "awaiting_customer_signature"}
        lines={[
          {
            label: "Status",
            value: contract
              ? contractStatusLabels[contract.status]
              : "Not created",
            tone:
              contract?.status === "signed"
                ? "ok"
                : contract?.status === "awaiting_customer_signature"
                  ? "warn"
                  : contract?.status === "expired"
                    ? "bad"
                    : undefined,
          },
          ...(contract?.contractNumber
            ? [{ label: "Number", value: contract.contractNumber }]
            : []),
          ...(contract?.signedAt
            ? [{ label: "Signed", value: contract.signedAt }]
            : []),
        ]}
        buttonLabel={
          contract?.status === "awaiting_customer_signature"
            ? "Sign"
            : "View Contract"
        }
        onClick={() => onSectionLink("contract")}
      />

      <CompactCard
        icon={<FiMapPin />}
        title="Collection"
        highlight={journey.mainStatus === "ready_for_collection"}
        lines={[
          { label: "Location", value: journey.collection?.location || "-" },
          { label: "Pickup", value: journey.pickupDateTime },
          ...(journey.collection?.collectionCode
            ? [
                {
                  label: "Code",
                  value: journey.collection.collectionCode,
                  tone: "ok" as const,
                },
              ]
            : []),
        ]}
        buttonLabel="Collection Details"
        onClick={() => onSectionLink("collection")}
      />

      <CompactCard
        icon={<FiRefreshCw />}
        title="Refund"
        highlight={
          journey.mainStatus === "refund_processing" ||
          journey.mainStatus === "deposit_review"
        }
        lines={
          refund
            ? [
                {
                  label: "Status",
                  value: refundStatusLabels[refund.status] || refund.status,
                  tone:
                    refund.status === "completed"
                      ? "ok"
                      : refund.status === "failed"
                        ? "bad"
                        : "warn",
                },
                { label: "Deposit", value: `£${refund.depositPaid}` },
                ...(refund.deductionsTotal > 0
                  ? [
                      {
                        label: "Deductions",
                        value: `-£${refund.deductionsTotal}`,
                        tone: "bad" as const,
                      },
                    ]
                  : []),
                { label: "Refund", value: `£${refund.refundAmount}` },
              ]
            : [{ label: "Status", value: "Not started" }]
        }
        buttonLabel="Refund Details"
        onClick={() => onSectionLink("refund")}
      />
    </div>
  );
}
