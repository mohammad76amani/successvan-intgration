"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiMapPin,
  FiClock,
  FiUpload,
  FiCheckCircle,
  FiAlertCircle,
  FiDownload,
  FiUploadCloud,
  FiLoader,
  FiLock,
  FiExternalLink,
  FiX,
} from "react-icons/fi";
import type { Reservation } from "@/types/type";
import type { ReservationJourneyViewModel } from "@/types/reservation-journey";
import type { SafeContractSummary } from "@/lib/docusign/types";
import { statusLabel } from "@/lib/reservation-status";
import { showToast } from "@/lib/toast";
import { formatDateTimeInLondon } from "@/lib/englandTime";
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

type InspectionComparisonRow = {
  label: string;
  before?: React.ReactNode;
  after?: React.ReactNode;
  note?: React.ReactNode;
};

const hasDisplayValue = (value: unknown) =>
  value !== undefined &&
  value !== null &&
  value !== "" &&
  !(Array.isArray(value) && value.length === 0);

const listValue = (
  items?: string[],
  emptyLabel = "None recorded",
): React.ReactNode =>
  items && items.length > 0 ? (
    <span className="leading-5">{items.join(", ")}</span>
  ) : (
    <span className="text-slate-500">{emptyLabel}</span>
  );

const plainValue = (
  value: unknown,
  emptyLabel = "Not recorded",
): React.ReactNode =>
  hasDisplayValue(value) ? (
    String(value)
  ) : (
    <span className="text-slate-500">{emptyLabel}</span>
  );

const countValue = (count?: number, singular = "photo") => {
  const safeCount = Number(count || 0);
  return safeCount > 0
    ? `${safeCount} ${singular}${safeCount === 1 ? "" : "s"}`
    : "No photos";
};

const normalizeInspectionFieldLabel = (value?: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const isPreviewableImage = (url: string) =>
  url.startsWith("data:image/") ||
  /\.(png|jpe?g|webp|gif|avif)(?:[?#].*)?$/i.test(url);

type InspectionFileGroup = {
  key: string;
  label: string;
  before: string[];
  after: string[];
};

const statusPill = (
  active: boolean | undefined,
  activeLabel: string,
  inactiveLabel: string,
) => (
  <span
    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${
      active
        ? "border-red-400/30 bg-red-500/10 text-red-200"
        : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
    }`}
  >
    {active ? activeLabel : inactiveLabel}
  </span>
);

function InspectionComparisonTable({
  handover,
  inspection,
  pickupDateTime,
  returnDateTime,
}: {
  handover?: Reservation["handover"];
  inspection?: Reservation["inspection"];
  pickupDateTime?: string;
  returnDateTime?: string;
}) {
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const mileageDifference =
    typeof handover?.startMileage === "number" &&
    typeof inspection?.returnMileage === "number"
      ? inspection.returnMileage - handover.startMileage
      : null;

  const rows: InspectionComparisonRow[] = [
    {
      label: "Mileage",
      before: plainValue(handover?.startMileage),
      after: plainValue(inspection?.returnMileage),
      note:
        mileageDifference !== null ? (
          <span className="rounded-full border border-[#fe9a00]/30 bg-[#fe9a00]/10 px-2.5 py-1 text-xs font-black text-[#fe9a00]">
            {mileageDifference >= 0 ? "+" : ""}
            {mileageDifference} miles
          </span>
        ) : undefined,
    },
    {
      label: "Fuel level",
      before: plainValue(handover?.startFuelLevel),
      after: plainValue(inspection?.returnFuelLevel),
    },
    {
      label: "Vehicle condition",
      before: plainValue(handover?.conditionNotes, "No notes"),
      after: plainValue(inspection?.notes, "No notes"),
    },
    {
      label: "Damages",
      before: listValue(handover?.existingDamages, "No existing damage"),
      after: listValue(inspection?.newDamages, "No new damage"),
    },
    {
      label: "Equipment",
      before: listValue(handover?.equipment, "No equipment recorded"),
      after: listValue(inspection?.missingEquipment, "Nothing missing"),
    },
    {
      label: "Photos",
      before: countValue(handover?.photos?.length),
      after: countValue(inspection?.photos?.length),
    },
    {
      label: "Before/after timestamps",
      before: plainValue(pickupDateTime),
      after: plainValue(returnDateTime),
    },
    {
      label: "Cleanliness",
      before: <span className="text-slate-500">Checked at handover</span>,
      after: inspection
        ? statusPill(inspection.cleaningIssue, "Issue found", "No issue")
        : plainValue(undefined),
    },
  ];

  const beforeFileFields = (handover?.customFields || []).filter(
    (field) => field.fieldType === "file" && (field.files?.length || 0) > 0,
  );
  const afterFileFields = (inspection?.customFields || []).filter(
    (field) => field.fieldType === "file" && (field.files?.length || 0) > 0,
  );
  const matchedAfterFields = new Set<number>();
  const customFileGroups: InspectionFileGroup[] = beforeFileFields.map(
    (beforeField, beforeIndex) => {
      const afterIndex = afterFileFields.findIndex((afterField, index) => {
        if (matchedAfterFields.has(index)) return false;
        if (
          beforeField.templateFieldId &&
          afterField.templateFieldId &&
          String(beforeField.templateFieldId) ===
            String(afterField.templateFieldId)
        ) {
          return true;
        }
        return (
          normalizeInspectionFieldLabel(beforeField.label) ===
          normalizeInspectionFieldLabel(afterField.label)
        );
      });
      const afterField =
        afterIndex >= 0 ? afterFileFields[afterIndex] : undefined;
      if (afterIndex >= 0) matchedAfterFields.add(afterIndex);
      return {
        key: `custom-before-${beforeField.templateFieldId || beforeIndex}`,
        label: beforeField.label || afterField?.label || "Inspection images",
        before: beforeField.files || [],
        after: afterField?.files || [],
      };
    },
  );
  afterFileFields.forEach((afterField, afterIndex) => {
    if (matchedAfterFields.has(afterIndex)) return;
    customFileGroups.push({
      key: `custom-after-${afterField.templateFieldId || afterIndex}`,
      label: afterField.label || "Inspection images",
      before: [],
      after: afterField.files || [],
    });
  });

  const inspectionFileGroups: InspectionFileGroup[] = [
    ...((handover?.photos?.length || inspection?.photos?.length)
      ? [
          {
            key: "vehicle-photos",
            label: "Vehicle photos",
            before: handover?.photos || [],
            after: inspection?.photos || [],
          },
        ]
      : []),
    ...customFileGroups,
  ];

  const renderThumbnails = (
    urls: string[],
    title: string,
    emptyLabel: string,
  ) =>
    urls.length > 0 ? (
      <div className="mt-2 flex flex-wrap gap-2">
        {urls.map((url, index) =>
          isPreviewableImage(url) ? (
            <button
              key={`${title}-${url}-${index}`}
              type="button"
              onClick={() =>
                setPreviewImage({
                  url,
                  title: `${title} ${index + 1}`,
                })
              }
              className="group relative h-16 w-20 overflow-hidden rounded-lg border border-white/10 bg-black/25 shadow-sm transition hover:border-[#fe9a00]/60 focus:outline-none focus:ring-2 focus:ring-[#fe9a00]/50"
              aria-label={`Open ${title} ${index + 1}`}
            >
              <Image
                src={url}
                alt={`${title} ${index + 1}`}
                fill
                sizes="80px"
                className="object-cover transition duration-200 group-hover:scale-105"
                unoptimized
              />
            </button>
          ) : (
            <a
              key={`${title}-${url}-${index}`}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex h-16 w-20 items-center justify-center rounded-lg border border-white/10 bg-black/25 px-2 text-center text-[10px] font-bold text-[#fe9a00] transition hover:border-[#fe9a00]/60"
            >
              View file
            </a>
          ),
        )}
      </div>
    ) : (
      <p className="mt-2 text-xs font-medium text-slate-600">{emptyLabel}</p>
    );

  if (!handover && !inspection) {
    return (
      <Placeholder text="The handover and return inspection comparison will appear here once the vehicle checks are completed." />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <div className="border-b border-white/10 bg-gradient-to-r from-white/[0.07] via-white/[0.03] to-[#fe9a00]/[0.08] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#fe9a00]">
              Before / after inspection
            </p>
            <h3 className="mt-1 text-base font-black tracking-tight text-white sm:text-lg">
              Vehicle condition comparison
            </h3>
          </div>
          <span className="w-fit rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold text-slate-300">
            Customer-visible report
          </span>
        </div>
      </div>

      <div className="hidden grid-cols-[1.1fr_1.4fr_1.4fr_0.9fr] gap-3 border-b border-white/10 bg-black/20 px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 lg:grid">
        <span>Check</span>
        <span>Before handover</span>
        <span>After return</span>
        <span className="text-right">Change</span>
      </div>

      <div className="divide-y divide-white/10">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[1.1fr_1.4fr_1.4fr_0.9fr] lg:items-center"
          >
            <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-400 lg:text-sm lg:normal-case lg:tracking-normal lg:text-white">
              {row.label}
            </div>
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 lg:hidden">
                Before
              </p>
              <div className="rounded-xl border border-white/[0.06] bg-black/15 px-3 py-2 font-semibold text-slate-100 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
                {row.before ?? <span className="text-slate-500">-</span>}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 lg:hidden">
                After
              </p>
              <div className="rounded-xl border border-white/[0.06] bg-black/15 px-3 py-2 font-semibold text-slate-100 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
                {row.after ?? <span className="text-slate-500">-</span>}
              </div>
            </div>
            <div className="flex justify-start lg:justify-end">
              {row.note ?? <span className="text-slate-600">-</span>}
            </div>
          </div>
        ))}
      </div>

      {inspectionFileGroups.length > 0 && (
        <div className="border-t border-white/10 bg-black/10 p-4 sm:p-5">
          <div className="mb-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#fe9a00]">
              Inspection evidence
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-300">
              Tap a thumbnail to view the full image.
            </p>
          </div>
          <div className="space-y-3">
            {inspectionFileGroups.map((group) => (
              <div
                key={group.key}
                className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"
              >
                <p className="text-xs font-black text-white">{group.label}</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                      Before handover
                    </p>
                    {renderThumbnails(
                      group.before,
                      `${group.label} before`,
                      "No before images",
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#fe9a00]">
                      After return
                    </p>
                    {renderThumbnails(
                      group.after,
                      `${group.label} after`,
                      "No after images",
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-5"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label={previewImage.title}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b1224] shadow-2xl shadow-black/50"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <p className="min-w-0 truncate text-sm font-bold text-white sm:text-base">
                {previewImage.title}
              </p>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Close image preview"
              >
                <FiX />
              </button>
            </div>
            <div className="relative h-[72dvh] max-h-[760px] w-full bg-black/30">
              <Image
                src={previewImage.url}
                alt={previewImage.title}
                fill
                sizes="100vw"
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
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
    previewUrl: string;
    details: LicenceDetailsReview;
    licence: { front: string; back: string };
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
  const [acceptedContractId, setAcceptedContractId] = useState<string | null>(
    null,
  );
  const licenceUploadLock = useRef(false);
  const isAnyLicenceBusy =
    uploadingLicence.front || uploadingLicence.back || licenceReviewSaving;

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

  const extractLicenceDetails = async (nextLicence: {
    front: string;
    back: string;
  }) => {
    const res = await fetch("/api/extract-license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        frontImage: nextLicence.front,
        backImage: nextLicence.back,
      }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      throw new Error(
        payload?.error || "Could not scan both licence images",
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
    if (licenceUploadLock.current) return;
    licenceUploadLock.current = true;
    setUploadingLicence((prev) => ({ ...prev, [side]: true }));
    try {
      const url = await uploadImage(file);
      const nextLicence = { ...licence, [side]: url };
      const updatedLicence = await updateUserLicence(nextLicence);
      const savedLicence = updatedLicence || nextLicence;
      setLicence(savedLicence);
      onLicenceUpdated();

      if (savedLicence.front && savedLicence.back) {
        const completeLicence = {
          front: savedLicence.front,
          back: savedLicence.back,
        };
        const licenceDetails = await extractLicenceDetails(completeLicence);
        setPendingLicenceReview({
          previewUrl: completeLicence.front,
          details: {
            ...licenceDetails,
            isFrontSide: true,
            sourceSide: "front",
          },
          licence: completeLicence,
        });
        showToast.success("Both sides uploaded. Please confirm the scan.");
        return;
      }

      showToast.success(
        `Licence ${side} uploaded. Upload the other side to scan the details.`,
      );
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      licenceUploadLock.current = false;
      setUploadingLicence((prev) => ({ ...prev, [side]: false }));
    }
  };

  const closeLicenceReview = () => {
    setPendingLicenceReview(null);
  };

  const confirmLicenceDetails = async (
    licenceDetails: LicenceDetailsReview,
  ) => {
    if (!pendingLicenceReview || licenceUploadLock.current) return;
    licenceUploadLock.current = true;
    setLicenceReviewSaving(true);
    try {
      const nextLicence = pendingLicenceReview.licence;
      const updatedLicence = await updateUserLicence(nextLicence, {
        ...licenceDetails,
        isFrontSide: true,
        sourceSide: "front",
      });
      setLicence(updatedLicence || nextLicence);
      onLicenceUpdated();
      showToast.success("Licence images and details saved");
      closeLicenceReview();
    } catch (error) {
      showToast.error(
        error instanceof Error
          ? error.message
          : "Could not save licence details",
      );
    } finally {
      licenceUploadLock.current = false;
      setLicenceReviewSaving(false);
    }
  };

  const handover = reservation.handover;
  const inspection = reservation.inspection;
  const displayedContractId = contract?._id ? String(contract._id) : null;
  const hasAcceptedCurrentContract = Boolean(
    displayedContractId && acceptedContractId === displayedContractId,
  );
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
    if (status === "ready_for_collection") {
      return [
        { label: "Pickup", value: journey.pickupDateTime },
        { label: "Location", value: journey.collection?.location || "-" },
        {
          label: "Collection code",
          value: journey.collection?.collectionCode || "Not issued",
        },
        { label: "Next", value: "Bring your licence and booking reference" },
      ];
    }
    if (status === "handover_in_progress") {
      return [
        { label: "Reference", value: journey.bookingReference },
        { label: "Stage", value: "Vehicle handover" },
        { label: "Status", value: "Checklist in progress" },
        { label: "Next", value: "Staff will complete the collection checks" },
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
        { label: "Reference", value: journey.bookingReference },
        { label: "Stage", value: "Return inspection" },
        {
          label: "Status",
          value:
            status === "vehicle_returned"
              ? "Vehicle received"
              : "Inspection in progress",
        },
        { label: "Next", value: "Open this step for inspection details" },
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
          label: refund?.expectedBy ? "Expected" : "Authorization number",
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
            refund?.status === "completed"
              ? money(journey.refund?.refundAmount)
              : "Not applicable",
          tone:
            refund?.status === "completed"
              ? ("refund" as const)
              : undefined,
        },
        ...(refund?.status === "completed"
          ? [
              {
                label: "Authorization number",
                value: refund.reference || "Pending",
              },
              { label: "Bank arrival", value: "Within 3 days" },
            ]
          : []),
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
          <div className={`relative h-36 overflow-hidden rounded-lg border border-white/10 bg-black/20 ${isAnyLicenceBusy ? "opacity-70" : ""}`}>
            <Image
              src={imageUrl}
              alt={`${title} licence`}
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-cover"
            />
            {busy && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white">
                <FiLoader className="animate-spin text-2xl text-[#fe9a00]" />
                <span className="text-xs font-bold">Uploading and checking…</span>
              </div>
            )}
            <label className={`absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-[#fe9a00] px-3 py-2 text-xs font-bold text-white transition-colors ${isAnyLicenceBusy ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-[#e68a00]"}`}>
              <FiUpload />
              {busy ? "Uploading" : "Change"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isAnyLicenceBusy}
                onChange={(event) =>
                  event.target.files?.[0] &&
                  handleLicenceUpload(event.target.files[0], side)
                }
              />
            </label>
          </div>
        ) : (
          <label className={`flex h-36 w-full flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/20 text-center transition-colors ${isAnyLicenceBusy ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-[#fe9a00]/70 hover:bg-[#fe9a00]/5"}`}>
            {busy ? (
              <FiLoader className="mb-2 animate-spin text-2xl text-[#fe9a00]" />
            ) : (
              <FiUploadCloud className="mb-2 text-2xl text-[#fe9a00]" />
            )}
            <span className="text-sm font-semibold text-white">
              {busy ? "Uploading" : `Upload ${title}`}
            </span>
            <span className="mt-1 text-xs text-gray-500">Image, max 15MB</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isAnyLicenceBusy}
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
            {(contract?.files.signed || contract?.files.source) && (
              <button
                type="button"
                onClick={() =>
                  onDownloadContract(
                    contract?.files.signed ? "signed" : "source",
                  )
                }
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-white/20"
              >
                <FiDownload />
                {contract?.files.signed
                  ? "Download signed contract"
                  : "Download contract"}
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
            <Row
              label="Agreement"
              value={
                contract.contractType === "reservation_extension"
                  ? "Rental extension"
                  : "Rental agreement"
              }
            />
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
            {contract.contractType === "reservation_extension" &&
              contract.extension && (
                <div className="my-3 grid grid-cols-1 gap-2 rounded-xl border border-[#fe9a00]/20 bg-[#fe9a00]/[0.05] p-3 sm:grid-cols-2">
                  <Row
                    label="Previous return"
                    value={
                      contract.extension.previousReturnDateTime
                        ? formatDateTimeInLondon(
                            contract.extension.previousReturnDateTime,
                          )
                        : "-"
                    }
                  />
                  <Row
                    label="New return"
                    value={
                      contract.extension.newReturnDateTime
                        ? formatDateTimeInLondon(
                            contract.extension.newReturnDateTime,
                          )
                        : "-"
                    }
                  />
                  <Row
                    label="Extension"
                    value={contract.extension.durationLabel}
                  />
                  <Row
                    label="Extension price"
                    value={`£${Number(contract.extension.agreedPrice || 0).toFixed(2)}`}
                  />
                  <Row
                    label="Payment"
                    value="Pay at the office"
                  />
                </div>
              )}
            <div className="mt-3 flex flex-wrap gap-2">
              {contract.files?.source && (
                <button
                  type="button"
                  onClick={() => onDownloadContract("source")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  <FiDownload /> Download contract
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
            {journey.contract?.status === "awaiting_customer_signature" && (
              <div
                className={`mt-4 overflow-hidden rounded-xl border transition-colors duration-300 ${
                  hasAcceptedCurrentContract
                    ? "border-[#fe9a00]/45 bg-[#fe9a00]/[0.07]"
                    : "border-white/10 bg-[#07101f]/70"
                }`}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                        hasAcceptedCurrentContract
                          ? "border-[#fe9a00]/40 bg-[#fe9a00]/15 text-[#fe9a00]"
                          : "border-white/10 bg-white/[0.05] text-slate-400"
                      }`}
                    >
                      <FiLock aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-white">
                        Confirm before signing
                      </h4>
                      <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-[13px]">
                        Review the {contract.contractType === "reservation_extension" ? "extension agreement" : "agreement"}, then confirm your acceptance to
                        continue securely in DocuSign.
                      </p>
                    </div>
                  </div>

                  <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-white/[0.08] bg-black/20 p-3 transition hover:border-white/15">
                    <input
                      type="checkbox"
                      checked={hasAcceptedCurrentContract}
                      onChange={(event) =>
                        setAcceptedContractId(
                          event.target.checked ? displayedContractId : null,
                        )
                      }
                      className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#fe9a00]"
                    />
                    <span className="text-[13px] font-semibold leading-5 text-slate-200">
                      I have read the {contract.contractType === "reservation_extension" ? "rental extension agreement" : "rental agreement"} and agree to the{" "}
                      <Link
                        href="/terms-and-conditions"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex items-center gap-1 font-black text-[#fe9a00] underline decoration-[#fe9a00]/40 underline-offset-2 transition hover:text-[#ffb13b]"
                      >
                        Terms and Conditions
                        <FiExternalLink className="text-xs" aria-hidden="true" />
                      </Link>
                      .
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={onSignContract}
                    disabled={!hasAcceptedCurrentContract || signBusy}
                    className={`mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#fe9a00]/50 focus:ring-offset-2 focus:ring-offset-[#07101f] ${
                      hasAcceptedCurrentContract && !signBusy
                        ? "cursor-pointer bg-[#fe9a00] text-white shadow-lg shadow-[#fe9a00]/15 hover:-translate-y-0.5 hover:bg-[#e68a00]"
                        : "cursor-not-allowed border border-white/[0.06] bg-white/[0.05] text-slate-500"
                    }`}
                  >
                    {signBusy ? (
                      <FiLoader className="animate-spin" aria-hidden="true" />
                    ) : (
                      <FiLock aria-hidden="true" />
                    )}
                    {signBusy ? "Opening DocuSign..." : "Review & Sign"}
                  </button>
                  <p className="mt-2 text-center text-[11px] font-medium text-slate-500">
                    You will continue to DocuSign to review and sign securely.
                  </p>
                </div>
              </div>
            )}
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
        <InspectionComparisonTable
          handover={handover}
          inspection={inspection}
          pickupDateTime={journey.pickupDateTime}
          returnDateTime={journey.returnDateTime}
        />
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
                    Authorization number
                  </p>
                  <p className="mt-1 break-all font-semibold text-white">
                    {journey.refund.reference}
                  </p>
                </div>
              )}
            </div>
            {refund.status === "completed" ? (
              <div className="border-t border-emerald-400/20 bg-emerald-500/[0.07] px-4 py-3">
                <p className="text-sm font-bold text-emerald-300">
                  Your refund has been sent.
                </p>
                <p className="mt-1 text-xs leading-5 text-emerald-100/75">
                  It should reach your bank account within 3 days. Keep the
                  authorization number above in case you need to contact your
                  bank.
                </p>
              </div>
            ) : (
              <p className="border-t border-white/10 px-4 py-3 text-xs leading-5 text-slate-500">
                Once sent, your refund should reach your bank account within 3
                days.
              </p>
            )}
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
