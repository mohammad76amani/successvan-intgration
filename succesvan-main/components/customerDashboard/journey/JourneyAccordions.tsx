"use client";

import { useState } from "react";
import Image from "next/image";
import {
  FiMapPin,
  FiClock,
  FiUpload,
  FiCheckCircle,
  FiAlertCircle,
  FiDownload,
  FiUploadCloud,
} from "react-icons/fi";
import type { Reservation } from "@/types/type";
import type { ReservationJourneyViewModel } from "@/types/reservation-journey";
import type { SafeContractSummary } from "@/lib/docusign/types";
import { statusLabel } from "@/lib/reservation-status";
import { showToast } from "@/lib/toast";
import DepositPanel from "./DepositPanel";
import LicenceDetailsReviewModal, {
  type LicenceDetailsReview,
} from "../LicenceDetailsReviewModal";

export type JourneySectionId =
  | "summary"
  | "documents"
  | "deposit"
  | "contract"
  | "collection"
  | "handover"
  | "inspection"
  | "refund"
  | "timeline";

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

const compactDate = (value?: Date | string) =>
  value
    ? new Date(value).toLocaleString("en-GB", { timeZone: "Europe/London" })
    : "-";

const money = (value?: number) => `£${Number(value || 0).toFixed(2)}`;

type RefundDeduction = {
  key: string;
  label: string;
  amount: number;
  reason?: string;
  category: "standard" | "other" | "additional";
};

type CurrentFact = {
  key?: string;
  label: string;
  value: React.ReactNode;
  tone?: "deduction" | "refund";
};

function refundDeductionItems(
  refund?: Reservation["refund"],
): RefundDeduction[] {
  if (!refund) return [];

  const standardCharges = [
    ["fuel", "Fuel charge", refund.charges?.fuel],
    ["late", "Late return charge", refund.charges?.late],
    ["damage", "Damage charge", refund.charges?.damage],
    ["cleaning", "Cleaning charge", refund.charges?.cleaning],
    [
      "missing-equipment",
      "Missing equipment",
      refund.charges?.missingEquipment,
    ],
  ] as const;

  const items: RefundDeduction[] = standardCharges
    .filter(([, , amount]) => Number(amount || 0) > 0)
    .map(([key, label, amount]) => ({
      key,
      label,
      amount: Number(amount),
      category: "standard" as const,
    }));

  if (Number(refund.charges?.other || 0) > 0) {
    items.push({
      key: "other",
      label: "Other charge",
      amount: Number(refund.charges?.other),
      reason: refund.otherChargeReason?.trim() || undefined,
      category: "other",
    });
  }

  refund.additionalCharges?.forEach((charge, index) => {
    if (Number(charge.amount || 0) <= 0) return;
    items.push({
      key: `additional-${index}-${charge.reason}`,
      label: charge.reason?.trim() || "Additional charge",
      amount: Number(charge.amount),
      category: "additional",
    });
  });

  return items;
}

function profileFieldsFromLicence(details: LicenceDetailsReview) {
  return {
    ...(details.address?.trim() ? { address: details.address.trim() } : {}),
    ...(details.postcode?.trim()
      ? { postalCode: details.postcode.trim() }
      : {}),
  };
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-400 bg-black/20 rounded-lg p-3">
      <FiClock className="shrink-0" />
      {text}
    </div>
  );
}

function Section({
  id,
  open,
  children,
}: {
  id: JourneySectionId;
  open: boolean;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div id={id} className="pt-4">
      {children}
    </div>
  );
}

export default function JourneyAccordions({
  reservation,
  journey,
  contract,
  openSection,
  onSignContract,
  onDownloadContract,
  onDepositUpdated,
  onLicenceUpdated,
  signBusy,
}: {
  reservation: Reservation;
  journey: ReservationJourneyViewModel;
  contract: SafeContractSummary | null;
  openSection: JourneySectionId | null;
  onSignContract: () => void;
  onDownloadContract: (kind: "source" | "signed" | "certificate") => void;
  onDepositUpdated: () => void;
  onLicenceUpdated: () => void;
  signBusy: boolean;
}) {
  type LicenceSide = "front" | "back";
  type LicenceState = { front?: string; back?: string };
  type PendingLicenceReview = {
    file: File;
    previewUrl: string;
    details: LicenceDetailsReview;
  };

  const getStoredLicence = (): LicenceState => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return {};
    try {
      const userData = JSON.parse(storedUser);
      return {
        front: userData?.licenceAttached?.front,
        back: userData?.licenceAttached?.back,
      };
    } catch {
      return {};
    }
  };

  const [licence, setLicence] = useState<LicenceState>(getStoredLicence);
  const [uploadingLicence, setUploadingLicence] = useState({
    front: false,
    back: false,
  });
  const [pendingLicenceReview, setPendingLicenceReview] =
    useState<PendingLicenceReview | null>(null);
  const [licenceReviewSaving, setLicenceReviewSaving] = useState(false);

  const uploadImage = async (file: File) => {
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize)
      throw new Error("File size must be less than 15MB");
    if (!file.type.startsWith("image/")) {
      throw new Error("Please upload an image file");
    }

    const formData = new FormData();
    formData.append("file", file);
    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const uploadData = await uploadRes.json();
    if (uploadData.error) throw new Error(uploadData.error);
    return uploadData.url as string;
  };

  const extractLicenceDetails = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch("/api/extract-license", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      throw new Error(
        payload?.error || "Could not scan the front licence image",
      );
    }
    return (await res.json()) as LicenceDetailsReview;
  };

  const updateUserLicence = async (
    nextLicence: LicenceState,
    licenceDetails?: LicenceDetailsReview,
  ) => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!storedUser?._id) throw new Error("User not loaded");

    const res = await fetch(`/api/users/${storedUser._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({
        ...(licenceDetails ? profileFieldsFromLicence(licenceDetails) : {}),
        licenceAttached: nextLicence,
        ...(licenceDetails ? { licenceDetails } : {}),
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Upload failed");
    localStorage.setItem("user", JSON.stringify(data.data));
    return data.data?.licenceAttached as LicenceState;
  };

  const handleLicenceUpload = async (file: File, side: LicenceSide) => {
    setUploadingLicence((prev) => ({ ...prev, [side]: true }));
    try {
      if (side === "front") {
        const licenceDetails = await extractLicenceDetails(file);
        setPendingLicenceReview({
          file,
          previewUrl: URL.createObjectURL(file),
          details: {
            ...licenceDetails,
            isFrontSide: true,
            sourceSide: "front",
          },
        });
        showToast.success("Licence scanned. Please confirm the details.");
        return;
      }

      const url = await uploadImage(file);
      const nextLicence = { ...licence, [side]: url };
      const updatedLicence = await updateUserLicence(nextLicence);
      setLicence(updatedLicence || nextLicence);
      onLicenceUpdated();
      showToast.success(`Licence ${side} uploaded`);
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingLicence((prev) => ({ ...prev, [side]: false }));
    }
  };

  const closeLicenceReview = () => {
    if (pendingLicenceReview?.previewUrl) {
      URL.revokeObjectURL(pendingLicenceReview.previewUrl);
    }
    setPendingLicenceReview(null);
  };

  const confirmLicenceDetails = async (
    licenceDetails: LicenceDetailsReview,
  ) => {
    if (!pendingLicenceReview) return;
    setLicenceReviewSaving(true);
    setUploadingLicence((prev) => ({ ...prev, front: true }));
    try {
      const url = await uploadImage(pendingLicenceReview.file);
      const nextLicence = { ...licence, front: url };
      const updatedLicence = await updateUserLicence(nextLicence, {
        ...licenceDetails,
        isFrontSide: true,
        sourceSide: "front",
      });
      setLicence(updatedLicence || nextLicence);
      onLicenceUpdated();
      showToast.success("Licence front and details saved");
      closeLicenceReview();
    } catch (error) {
      showToast.error(
        error instanceof Error
          ? error.message
          : "Could not save licence details",
      );
    } finally {
      setLicenceReviewSaving(false);
      setUploadingLicence((prev) => ({ ...prev, front: false }));
    }
  };

  const handover = reservation.handover;
  const inspection = reservation.inspection;
  const refund = reservation.refund;
  const refundDeductions = refundDeductionItems(refund);
  const compactRefundDeductions = refundDeductions.slice(0, 3);
  const hiddenRefundDeductionCount = Math.max(
    refundDeductions.length - compactRefundDeductions.length,
    0,
  );
  const hasStandardRefundDeductions = refundDeductions.some(
    (deduction) => deduction.category === "standard",
  );
  const licenceComplete = licence.front && licence.back;
  const activeStep =
    journey.steps.find((step) =>
      ["current", "blocked", "failed"].includes(step.state),
    ) ||
    [...journey.steps].reverse().find((step) => step.state === "completed") ||
    journey.steps[0];
  const depositStepActive =
    reservation.deposit?.option !== "office" &&
    journey.steps.some(
      (step) =>
        step.key === "deposit" &&
        ["current", "blocked", "failed"].includes(step.state),
    );
  const submittedAt =
    reservation.statusHistory?.find((entry) => entry.status === "pending")
      ?.changedAt ||
    (reservation as Reservation & { createdAt?: string }).createdAt;
  const currentFacts: CurrentFact[] = (() => {
    const status = journey.mainStatus;
    const vehicleName =
      reservation.vehicle?.title ||
      reservation.vehicle?.name ||
      "Awaiting assignment";

    if (status === "pending") {
      return [
        { label: "Reference", value: journey.bookingReference },
        { label: "Submitted", value: compactDate(submittedAt) },
        { label: "Review", value: "Availability check in progress" },
      ];
    }
    if (["confirmed", "deposit_pending"].includes(status)) {
      if (reservation.deposit?.option === "office") {
        return [
          { label: "Payment", value: "Pay at office" },
          { label: "Vehicle", value: vehicleName },
          { label: "Next", value: "Vehicle assignment" },
        ];
      }
      return [
        { label: "Deposit", value: money(journey.deposit?.amount) },
        {
          label: "Option",
          value:
            reservation.deposit?.option?.replace(/_/g, " ") ||
            "Choose an option",
        },
        {
          label: "Status",
          value: journey.deposit?.status.replace(/_/g, " ") || "Not paid",
        },
        {
          label: "Due",
          value: journey.deposit?.dueAt || "Pay to secure booking",
        },
      ];
    }
    if (status === "deposit_paid") {
      return [
        { label: "Deposit", value: money(reservation.deposit?.amount) },
        {
          label: "Payment status",
          value: reservation.deposit?.status?.replace(/_/g, " ") || "Paid",
        },
        { label: "Paid", value: compactDate(reservation.deposit?.paidAt) },
        { label: "Vehicle", value: vehicleName },
      ];
    }
    if (["contract_pending", "contract_signed"].includes(status)) {
      return [
        { label: "Contract", value: contract?.contractNumber || "Generating" },
        {
          label: "Status",
          value: journey.contract?.status.replace(/_/g, " ") || "Not created",
        },
        { label: "Generated", value: compactDate(contract?.createdAt) },
        ...(journey.contract?.signedAt
          ? [{ label: "Signed", value: journey.contract.signedAt }]
          : []),
      ];
    }
    if (["ready_for_collection", "handover_in_progress"].includes(status)) {
      return [
        { label: "Pickup", value: journey.pickupDateTime },
        { label: "Location", value: journey.collection?.location || "-" },
        {
          label: "Collection code",
          value: journey.collection?.collectionCode || "Not issued",
        },
        {
          label: "Handover",
          value: handover?.completedAt ? "Completed" : "Pending",
        },
      ];
    }
    if (status === "delivered") {
      return [
        { label: "Rental", value: "Active" },
        { label: "Return", value: journey.returnDateTime },
        {
          label: "Return location",
          value: journey.collection?.location || "-",
        },
      ];
    }
    if (["vehicle_returned", "return_inspection"].includes(status)) {
      return [
        { label: "Vehicle", value: "Returned" },
        { label: "Received", value: compactDate(inspection?.receivedAt) },
        {
          label: "Inspection",
          value: inspection?.completedAt ? "Completed" : "In progress",
        },
        ...(inspection?.returnMileage !== undefined
          ? [
              {
                label: "Return mileage",
                value: String(inspection.returnMileage),
              },
            ]
          : []),
      ];
    }
    if (
      ["deposit_review", "refund_processing", "refund_completed"].includes(
        status,
      )
    ) {
      return [
        {
          label: "Deposit paid",
          value: money(journey.refund?.depositPaid),
        },
        ...compactRefundDeductions.map((deduction) => ({
          key: deduction.key,
          label: deduction.label,
          value: `-${money(deduction.amount)}`,
          tone: "deduction" as const,
        })),
        ...(hiddenRefundDeductionCount > 0
          ? [
              {
                key: "more-deductions",
                label: "More deductions",
                value: `${hiddenRefundDeductionCount} more — see full breakdown`,
              },
            ]
          : []),
        {
          label: "Total deductions",
          value: `-${money(journey.refund?.deductionsTotal)}`,
          tone: "deduction" as const,
        },
        {
          label: "Refund",
          value: money(journey.refund?.refundAmount),
          tone: "refund" as const,
        },
        {
          label: "Status",
          value: refund?.status?.replace(/_/g, " ") || "Under review",
        },
        {
          label: refund?.expectedBy ? "Expected" : "Reference",
          value: refund?.expectedBy
            ? compactDate(refund.expectedBy)
            : refund?.reference || "Pending",
        },
      ];
    }
    if (status === "completed") {
      return [
        { label: "Booking", value: "Complete" },
        { label: "Reference", value: journey.bookingReference },
        {
          label: "Refund",
          value:
            refund?.status === "completed" ? "Completed" : "Not applicable",
        },
      ];
    }
    return [
      { label: "Status", value: journey.publicStatusLabel },
      { label: "Reference", value: journey.bookingReference },
      ...(reservation.cancelReason
        ? [{ label: "Reason", value: reservation.cancelReason }]
        : []),
    ];
  })();

  const LicenceUploadCard = ({
    side,
    title,
  }: {
    side: LicenceSide;
    title: string;
  }) => {
    const imageUrl = licence[side];
    const busy = uploadingLicence[side];

    return (
      <div className="rounded-xl border border-white/10 bg-black/15 p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white">{title}</h4>
            <p className="text-xs text-gray-500">
              {imageUrl ? "Uploaded" : "Required for booking checks"}
            </p>
          </div>
          {imageUrl && (
            <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold text-green-400">
              Ready
            </span>
          )}
        </div>
        {imageUrl ? (
          <div className="relative h-36 overflow-hidden rounded-lg border border-white/10 bg-black/20">
            <Image
              src={imageUrl}
              alt={`${title} licence`}
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-cover"
            />
            <label className="absolute bottom-3 right-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#fe9a00] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#e68a00]">
              <FiUpload />
              {busy ? "Uploading" : "Change"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={busy}
                onChange={(event) =>
                  event.target.files?.[0] &&
                  handleLicenceUpload(event.target.files[0], side)
                }
              />
            </label>
          </div>
        ) : (
          <label className="flex h-36 w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/20 text-center transition-colors hover:border-[#fe9a00]/70 hover:bg-[#fe9a00]/5">
            <FiUploadCloud className="mb-2 text-2xl text-[#fe9a00]" />
            <span className="text-sm font-semibold text-white">
              {busy ? "Uploading" : `Upload ${title}`}
            </span>
            <span className="mt-1 text-xs text-gray-500">Image, max 15MB</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={busy}
              onChange={(event) =>
                event.target.files?.[0] &&
                handleLicenceUpload(event.target.files[0], side)
              }
            />
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/10 backdrop-blur-xl">
      <div className="border-b border-white/10 pb-4">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
          Current step
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-black text-white">
              {activeStep?.label || journey.publicStatusLabel}
            </h3>
            <div className="mt-3 grid gap-x-5 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
              {currentFacts.map((fact, index) => (
                <div
                  key={fact.key || `${fact.label}-${index}`}
                  className="min-w-0"
                >
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                    {fact.label}
                  </p>
                  <p
                    className={`mt-0.5 break-words text-xs font-semibold capitalize ${
                      fact.tone === "deduction"
                        ? "text-red-300"
                        : fact.tone === "refund"
                          ? "text-emerald-400"
                          : "text-slate-200"
                    }`}
                  >
                    {fact.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {contract?.files.source && (
              <button
                type="button"
                onClick={() => onDownloadContract("source")}
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-white/20"
              >
                <FiDownload />
                Download contract
              </button>
            )}
            <span className="inline-flex w-fit rounded-full bg-[#fe9a00]/15 px-3 py-1 text-xs font-bold text-[#fe9a00]">
              {journey.publicStatusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ── Documents ───────────────────────────────────────── */}
      <Section id="documents" open={openSection === "documents"}>
        <div className="space-y-2">
          <div className="rounded-xl border border-white/10 bg-black/15 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Driving licence
                </h4>
                <p className="text-xs text-gray-500">
                  Upload both sides here. You do not need to leave this booking.
                </p>
              </div>
              {licenceComplete ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold text-green-400">
                  <FiCheckCircle /> Complete
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#fe9a00]/15 px-2.5 py-1 text-xs font-semibold text-[#fe9a00]">
                  <FiAlertCircle /> Required
                </span>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <LicenceUploadCard side="front" title="Front side" />
              <LicenceUploadCard side="back" title="Back side" />
            </div>
          </div>
          {["Proof of address", "ID card / passport", "Payment card proof"].map(
            (doc) => (
              <div
                key={doc}
                className="flex items-center justify-between rounded-lg bg-black/15 p-3"
              >
                <span className="text-sm text-white font-semibold">{doc}</span>
                <span className="text-gray-500 text-sm">
                  Bring to collection if requested
                </span>
              </div>
            ),
          )}
        </div>
      </Section>

      {/* ── Payment & deposit ──────────────────────────────── */}
      {depositStepActive && (
        <Section id="deposit" open={openSection === "deposit"}>
          <DepositPanel
            reservation={reservation}
            onUpdated={onDepositUpdated}
          />
        </Section>
      )}

      {/* ── Contract ────────────────────────────────────────── */}
      <Section id="contract" open={openSection === "contract"}>
        {contract ? (
          <>
            <Row label="Contract number" value={contract.contractNumber} />
            <Row
              label="Status"
              value={
                journey.contract
                  ? journey.contract.status.replace(/_/g, " ")
                  : contract.status
              }
            />
            {contract.createdAt && (
              <Row
                label="Generated"
                value={new Date(contract.createdAt).toLocaleDateString("en-GB")}
              />
            )}
            {journey.contract?.signedAt && (
              <Row label="Signed" value={journey.contract.signedAt} />
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {contract.files?.source && (
                <button
                  type="button"
                  onClick={() => onDownloadContract("source")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  <FiDownload /> Download contract
                </button>
              )}
              {journey.contract?.status === "awaiting_customer_signature" && (
                <button
                  type="button"
                  onClick={onSignContract}
                  disabled={signBusy}
                  className="px-4 py-2 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {signBusy ? "Opening..." : "Review & Sign"}
                </button>
              )}
              {contract.files?.signed && (
                <button
                  type="button"
                  onClick={() => onDownloadContract("signed")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  <FiDownload /> Download signed contract
                </button>
              )}
            </div>
          </>
        ) : (
          <Placeholder text="Your rental agreement hasn't been created yet. It will appear here when it's ready to sign." />
        )}
      </Section>

      {/* ── Collection & return ────────────────────────────── */}
      <Section id="collection" open={openSection === "collection"}>
        <Row label="Pickup location" value={journey.collection?.location} />
        <Row label="Pickup time" value={journey.pickupDateTime} />
        <Row label="Return time" value={journey.returnDateTime} />
        {journey.collection?.collectionCode && (
          <Row
            label="Collection code"
            value={
              <span className="text-[#fe9a00] font-black tracking-widest">
                {journey.collection.collectionCode}
              </span>
            }
          />
        )}
        <p className="text-gray-400 text-sm mt-2">
          Bring your driving licence and booking reference. Please return the
          van with the same fuel level and on time to avoid extra charges.
        </p>
        {reservation.office?.address && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(reservation.office.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <FiMapPin /> Get Directions
          </a>
        )}
      </Section>

      {/* ── Handover form ──────────────────────────────────── */}
      <Section id="handover" open={openSection === "handover"}>
        {handover?.completedAt ? (
          <>
            <Row label="Starting mileage" value={handover.startMileage} />
            <Row label="Starting fuel level" value={handover.startFuelLevel} />
            {handover.conditionNotes && (
              <Row label="Condition notes" value={handover.conditionNotes} />
            )}
            {(handover.existingDamages?.length ?? 0) > 0 && (
              <Row
                label="Existing damages"
                value={handover.existingDamages!.join(", ")}
              />
            )}
            {handover.keyCount !== undefined && (
              <Row label="Keys supplied" value={handover.keyCount} />
            )}
            {(handover.equipment?.length ?? 0) > 0 && (
              <Row label="Equipment" value={handover.equipment!.join(", ")} />
            )}
            <Row
              label="Completed"
              value={new Date(handover.completedAt).toLocaleString("en-GB", {
                timeZone: "Europe/London",
              })}
            />
          </>
        ) : (
          <Placeholder text="The handover checklist is completed with our staff when you collect the van. It will appear here afterwards." />
        )}
      </Section>

      {/* ── Return inspection ──────────────────────────────── */}
      <Section id="inspection" open={openSection === "inspection"}>
        {inspection?.completedAt ? (
          <>
            <Row label="Return mileage" value={inspection.returnMileage} />
            <Row label="Return fuel level" value={inspection.returnFuelLevel} />
            {(inspection.newDamages?.length ?? 0) > 0 && (
              <Row
                label="New damages"
                value={inspection.newDamages!.join(", ")}
              />
            )}
            <Row
              label="Late return"
              value={inspection.lateReturn ? "Yes" : "No"}
            />
            {(inspection.lateMinutes ?? 0) > 0 && (
              <Row
                label="Late by"
                value={`${inspection.lateMinutes} minutes`}
              />
            )}
            <Row
              label="Cleaning issue"
              value={inspection.cleaningIssue ? "Yes" : "No"}
            />
            {(inspection.missingEquipment?.length ?? 0) > 0 && (
              <Row
                label="Missing equipment"
                value={inspection.missingEquipment!.join(", ")}
              />
            )}
            {inspection.notes && <Row label="Notes" value={inspection.notes} />}
            <Row
              label="Completed"
              value={new Date(inspection.completedAt).toLocaleString("en-GB", {
                timeZone: "Europe/London",
              })}
            />
          </>
        ) : (
          <Placeholder text="We inspect the van after you return it. The inspection result will appear here." />
        )}
      </Section>

      {/* ── Refund summary ─────────────────────────────────── */}
      <Section id="refund" open={openSection === "refund"}>
        {refund && journey.refund ? (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/15">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Refund calculation
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  Your deposit, less the deductions listed below.
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Deposit paid
                </p>
                <p className="text-base font-black tabular-nums text-white">
                  {money(journey.refund.depositPaid)}
                </p>
              </div>
            </div>

            <div className="px-4 py-2">
              {refundDeductions.length > 0 ? (
                <div className="divide-y divide-white/[0.07]">
                  {refundDeductions.map((deduction) => (
                    <div
                      key={deduction.key}
                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 py-3"
                    >
                      <p className="min-w-0 break-words text-sm font-semibold text-slate-200">
                        {deduction.label}
                      </p>
                      <p className="text-sm font-bold tabular-nums text-red-300">
                        -{money(deduction.amount)}
                      </p>
                      {deduction.reason && (
                        <p className="col-span-2 break-words text-xs leading-5 text-slate-500 sm:col-span-1">
                          {deduction.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="text-slate-400">No deductions</span>
                  <span className="font-bold tabular-nums text-emerald-400">
                    {money(0)}
                  </span>
                </div>
              )}
              {hasStandardRefundDeductions && refund.chargeReason?.trim() && (
                <div className="mb-2 rounded-lg border border-[#fe9a00]/15 bg-[#fe9a00]/[0.05] px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#fe9a00]">
                    Reason for all standard deductions
                  </p>
                  <p className="mt-1 break-words text-xs leading-5 text-slate-300">
                    {refund.chargeReason}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-[#fe9a00]/25 bg-[#fe9a00]/[0.04] px-4 py-4">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-semibold text-slate-300">
                  Total deductions
                </span>
                <span className="font-black tabular-nums text-red-300">
                  -{money(journey.refund.deductionsTotal)}
                </span>
              </div>
              <div className="mt-2 flex items-end justify-between gap-4">
                <span className="font-black text-white">Refund amount</span>
                <span className="text-xl font-black tabular-nums text-emerald-400">
                  {money(journey.refund.refundAmount)}
                </span>
              </div>
            </div>

            <div className="grid gap-3 border-t border-white/10 px-4 py-4 text-xs sm:grid-cols-3">
              <div className="min-w-0">
                <p className="font-bold uppercase tracking-wide text-slate-500">
                  Status
                </p>
                <p className="mt-1 break-words font-semibold capitalize text-[#fe9a00]">
                  {journey.refund.status.replace(/_/g, " ")}
                </p>
              </div>
              {refund.expectedBy && (
                <div className="min-w-0">
                  <p className="font-bold uppercase tracking-wide text-slate-500">
                    Expected by
                  </p>
                  <p className="mt-1 font-semibold text-white">
                    {new Date(refund.expectedBy).toLocaleDateString("en-GB")}
                  </p>
                </div>
              )}
              {journey.refund.reference && (
                <div className="min-w-0">
                  <p className="font-bold uppercase tracking-wide text-slate-500">
                    Reference
                  </p>
                  <p className="mt-1 break-all font-semibold text-white">
                    {journey.refund.reference}
                  </p>
                </div>
              )}
            </div>
            <p className="border-t border-white/10 px-4 py-3 text-xs leading-5 text-slate-500">
              Refunds usually reach your account within 5–10 working days.
            </p>
          </div>
        ) : (
          <Placeholder text="Your deposit refund will be reviewed after the return inspection. Details will appear here." />
        )}
      </Section>

      {/* ── Activity timeline ──────────────────────────────── */}
      <Section id="timeline" open={openSection === "timeline"}>
        {(reservation.statusHistory?.length ?? 0) > 0 ? (
          <div className="space-y-3">
            {[...reservation.statusHistory!].reverse().map((entry, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#fe9a00] mt-1.5" />
                  {idx < reservation.statusHistory!.length - 1 && (
                    <div className="w-0.5 flex-1 bg-white/10" />
                  )}
                </div>
                <div className="pb-2">
                  <p className="text-white text-sm font-semibold">
                    {statusLabel(entry.status)}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {new Date(entry.changedAt).toLocaleString("en-GB", {
                      timeZone: "Europe/London",
                    })}
                  </p>
                  {entry.note && (
                    <p className="text-gray-500 text-xs mt-0.5">{entry.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Placeholder text="Booking activity will appear here as your reservation progresses." />
        )}
      </Section>

      <LicenceDetailsReviewModal
        open={Boolean(pendingLicenceReview)}
        imagePreview={pendingLicenceReview?.previewUrl}
        details={pendingLicenceReview?.details ?? null}
        saving={licenceReviewSaving}
        onCancel={closeLicenceReview}
        onConfirm={confirmLicenceDetails}
      />
    </div>
  );
}

export { authHeaders };
