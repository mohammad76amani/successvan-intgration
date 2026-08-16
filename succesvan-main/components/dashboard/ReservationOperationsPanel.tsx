"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { showToast } from "@/lib/toast";
import { clientAuthHeaders } from "@/lib/client-auth";
import type { Reservation } from "@/types/type";
import SearchableStaffSelect from "@/components/ui/SearchableStaffSelect";

type CategoryHandoverField = {
  _id?: string;
  label: string;
  fieldType: "input" | "file";
  inputType?: "text" | "number" | "date" | "textarea";
  requiredBefore?: boolean;
  requiredAfter?: boolean;
  helpText?: string;
};

type AdditionalChargeForm = {
  id: string;
  amount: string;
  reason: string;
};

const HANDOVER_STATUSES = [
  "contract_signed",
  "ready_for_collection",
  "handover_in_progress",
];
const INSPECTION_STATUSES = [
  "delivered",
  "vehicle_returned",
  "return_inspection",
];
const REFUND_STATUSES = ["deposit_review", "refund_processing"];
const OPERATION_STATUSES = [
  ...HANDOVER_STATUSES,
  ...INSPECTION_STATUSES,
  ...REFUND_STATUSES,
];

const additionalChargeRows = (reservation: Reservation) => {
  const saved = reservation.refund?.additionalCharges || [];
  if (saved.length > 0) {
    return saved.map((charge, index) => ({
      id: `saved-${index}`,
      amount: String(charge.amount),
      reason: charge.reason,
    }));
  }

  const legacyAmount = Number(reservation.refund?.charges?.other) || 0;
  return legacyAmount > 0
    ? [
        {
          id: "legacy-other",
          amount: String(legacyAmount),
          reason: reservation.refund?.otherChargeReason || "Other deduction",
        },
      ]
    : [];
};

const fieldClass =
  "w-full min-h-11 rounded-xl border border-white/[0.10] bg-[#07101f]/70 px-3.5 py-2.5 text-sm text-white shadow-inner shadow-black/10 outline-none transition duration-200 placeholder:text-slate-500 hover:border-white/20 hover:bg-[#091426]/80 focus:border-[#fe9a00]/70 focus:bg-[#091426] focus:ring-2 focus:ring-[#fe9a00]/15";

const dateInputValue = (date: Date | null) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const lines = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const listText = (value?: string[]) =>
  value && value.length > 0 ? value.join(", ") : "-";

const normalizeFieldLabel = (label?: string) =>
  String(label || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const isImageUrl = (url: string) =>
  /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(url) ||
  url.startsWith("blob:") ||
  url.startsWith("data:image/");

async function uploadImages(files: FileList | null) {
  if (!files?.length) return [];
  const urls: string[] = [];
  for (const file of Array.from(files)) {
    const allowed = file.type.startsWith("image/");
    if (!allowed || file.size > 15 * 1024 * 1024) {
      throw new Error("Files must be images smaller than 15MB");
    }
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok || payload.error) {
      throw new Error(payload.error || "Photo upload failed");
    }
    urls.push(payload.url);
  }
  return urls;
}

export default function ReservationOperationsPanel({
  reservation,
  onUpdated,
}: {
  reservation: Reservation;
  onUpdated: (reservation: Reservation) => void;
}) {
  const [loadedReservation, setLoadedReservation] =
    useState<Reservation | null>(null);
  const [loadingReservation, setLoadingReservation] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [beforeImagesModalOpen, setBeforeImagesModalOpen] = useState(false);
  const needsOperationsData = OPERATION_STATUSES.includes(reservation.status);
  const activeReservation = loadedReservation || reservation;
  const category = activeReservation.category as
    | {
        _id?: string;
        name?: string;
        deposit?: { handoverDepositPrice?: number };
        handoverFormFields?: CategoryHandoverField[];
      }
    | undefined;
  const handoverFieldTemplates = category?.handoverFormFields || [];
  const beforeFields = handoverFieldTemplates.filter(
    (field) => field.requiredBefore,
  );
  const returnFields = handoverFieldTemplates.filter(
    (field) => field.requiredAfter,
  );
  const [handover, setHandover] = useState({
    startMileage: "",
    startFuelLevel: "",
    conditionNotes: "",
    existingDamages: "",
    staffId: "",
    staffSignature: "",
    keyCount: "1",
    equipment: "",
  });
  const [beforeValues, setBeforeValues] = useState<Record<string, string>>({});
  const [beforeFiles, setBeforeFiles] = useState<Record<string, string[]>>({});
  const [inspection, setInspection] = useState({
    returnMileage: "",
    returnFuelLevel: "",
    lateMinutes: "0",
    newDamages: "",
    missingEquipment: "",
    notes: "",
    staffId: "",
    staffSignature: "",
    cleaningIssue: false,
  });
  const [afterValues, setAfterValues] = useState<Record<string, string>>({});
  const [afterFiles, setAfterFiles] = useState<Record<string, string[]>>({});
  const [returnMiniStep, setReturnMiniStep] = useState<"form" | "compare">(
    "form",
  );
  const [refund, setRefund] = useState({
    fuel: String(activeReservation.refund?.charges?.fuel ?? 0),
    late: String(activeReservation.refund?.charges?.late ?? 0),
    damage: String(activeReservation.refund?.charges?.damage ?? 0),
    cleaning: String(activeReservation.refund?.charges?.cleaning ?? 0),
    missingEquipment: String(
      activeReservation.refund?.charges?.missingEquipment ?? 0,
    ),
    chargeReason: activeReservation.refund?.chargeReason ?? "",
    reference: activeReservation.refund?.reference ?? "",
    expectedBy: "",
  });
  const [additionalCharges, setAdditionalCharges] = useState<
    AdditionalChargeForm[]
  >(() => additionalChargeRows(activeReservation));

  const loadReservation = useCallback(
    async (signal?: AbortSignal) => {
      if (!needsOperationsData) {
        setLoadingReservation(false);
        return null;
      }
      if (!reservation._id) {
        setLoadError("Reservation ID is missing");
        setLoadingReservation(false);
        return null;
      }

      setLoadingReservation(true);
      setLoadError("");
      try {
        const response = await fetch(`/api/reservations/${reservation._id}`, {
          headers: clientAuthHeaders(),
          cache: "no-store",
          signal,
        });
        const payload = await response.json();
        if (signal?.aborted) return null;
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error || "Could not load reservation form");
        }
        const completeReservation = payload.data as Reservation;
        setLoadedReservation(completeReservation);
        return completeReservation;
      } catch (error) {
        if (signal?.aborted || (error as Error).name === "AbortError")
          return null;
        setLoadError(
          error instanceof Error
            ? error.message
            : "Could not load reservation form",
        );
        return null;
      } finally {
        if (!signal?.aborted) setLoadingReservation(false);
      }
    },
    [needsOperationsData, reservation._id],
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoadedReservation(null);
    setLoadError("");
    setBeforeValues({});
    setBeforeFiles({});
    setAfterValues({});
    setAfterFiles({});
    setReturnMiniStep("form");
    setPreviewImage(null);
    setBeforeImagesModalOpen(false);
    setHandover({
      startMileage: "",
      startFuelLevel: "",
      conditionNotes: "",
      existingDamages: "",
      staffId: "",
      staffSignature: "",
      keyCount: "1",
      equipment: "",
    });
    setInspection({
      returnMileage: "",
      returnFuelLevel: "",
      lateMinutes: "0",
      newDamages: "",
      missingEquipment: "",
      notes: "",
      staffId: "",
      staffSignature: "",
      cleaningIssue: false,
    });
    void loadReservation(controller.signal);
    return () => controller.abort();
  }, [loadReservation]);

  useEffect(() => {
    if (!loadedReservation) return;
    setHandover((current) => ({
      ...current,
      staffId: String(loadedReservation.handover?.staff?.user || ""),
      staffSignature:
        loadedReservation.handover?.staff?.name ||
        loadedReservation.handover?.staffSignature ||
        "",
    }));
    setInspection((current) => ({
      ...current,
      staffId: String(loadedReservation.inspection?.staff?.user || ""),
      staffSignature: loadedReservation.inspection?.staff?.name || "",
    }));
    setRefund({
      fuel: String(loadedReservation.refund?.charges?.fuel ?? 0),
      late: String(loadedReservation.refund?.charges?.late ?? 0),
      damage: String(loadedReservation.refund?.charges?.damage ?? 0),
      cleaning: String(loadedReservation.refund?.charges?.cleaning ?? 0),
      missingEquipment: String(
        loadedReservation.refund?.charges?.missingEquipment ?? 0,
      ),
      chargeReason: loadedReservation.refund?.chargeReason ?? "",
      reference: loadedReservation.refund?.reference ?? "",
      expectedBy: loadedReservation.refund?.expectedBy
        ? dateInputValue(new Date(loadedReservation.refund.expectedBy))
        : "",
    });
    setAdditionalCharges(additionalChargeRows(loadedReservation));
  }, [loadedReservation]);

  const deductions = useMemo(
    () =>
      [
        refund.fuel,
        refund.late,
        refund.damage,
        refund.cleaning,
        refund.missingEquipment,
      ].reduce((total, value) => total + Math.max(0, Number(value) || 0), 0),
    [refund],
  );
  const additionalDeductions = useMemo(
    () =>
      additionalCharges.reduce(
        (total, charge) => total + Math.max(0, Number(charge.amount) || 0),
        0,
      ),
    [additionalCharges],
  );
  const totalDeductions = deductions + additionalDeductions;
  const depositPaid =
    activeReservation.refund?.depositPaid ??
    activeReservation.handoverDepositAmount ??
    category?.deposit?.handoverDepositPrice ??
    activeReservation.deposit?.amount ??
    0;
  const refundAmount = Math.max(0, depositPaid - totalDeductions);

  const post = async (path: string, body: object) => {
    const response = await fetch(path, {
      method: "POST",
      headers: clientAuthHeaders(true),
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!payload.success) throw new Error(payload.error || "Request failed");
    const refreshed = await loadReservation();
    if (refreshed) {
      onUpdated(refreshed);
      return;
    }

    // Mutation endpoints can return unpopulated references. Preserve the full
    // objects already loaded so a transient refresh failure cannot erase the
    // category checklist while still applying the new status/data.
    const mutationReservation = payload.data as Reservation;
    const safeReservation = {
      ...activeReservation,
      ...mutationReservation,
      category:
        mutationReservation?.category &&
        typeof mutationReservation.category === "object"
          ? mutationReservation.category
          : activeReservation.category,
      vehicle:
        mutationReservation?.vehicle &&
        typeof mutationReservation.vehicle === "object"
          ? mutationReservation.vehicle
          : activeReservation.vehicle,
      office:
        mutationReservation?.office &&
        typeof mutationReservation.office === "object"
          ? mutationReservation.office
          : activeReservation.office,
      user:
        mutationReservation?.user &&
        typeof mutationReservation.user === "object"
          ? mutationReservation.user
          : activeReservation.user,
    } as Reservation;
    setLoadError("");
    setLoadedReservation(safeReservation);
    onUpdated(safeReservation);
  };

  const customFieldKey = (field: CategoryHandoverField) =>
    `${field.fieldType}-${field.inputType || "file"}-${
      field._id ||
      field.label
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
    }`;

  const uploadSelectedImages = async (
    files: FileList | null,
    key: string,
    onUploaded: (urls: string[]) => void,
  ) => {
    if (!files?.length) return;
    setUploadingKey(key);
    try {
      const urls = await uploadImages(files);
      onUploaded(urls);
      showToast.success("Files uploaded");
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingKey((current) => (current === key ? null : current));
    }
  };

  const buildCustomFields = async (
    fields: CategoryHandoverField[],
    values: Record<string, string>,
    files: Record<string, string[]>,
  ) => {
    const entries = [];
    for (const field of fields) {
      const key = customFieldKey(field);
      entries.push({
        templateFieldId: field._id ? String(field._id) : undefined,
        label: field.label,
        fieldType: field.fieldType,
        inputType: field.inputType || "text",
        value: field.fieldType === "input" ? values[key] || "" : "",
        files: field.fieldType === "file" ? files[key] || [] : [],
        helpText: field.helpText || "",
      });
    }
    return entries;
  };

  const validateCustomFields = (
    fields: CategoryHandoverField[],
    values: Record<string, string>,
  ) => {
    for (const field of fields) {
      // Image evidence is useful but optional at both handover and return.
      if (field.fieldType === "file") continue;
      const key = customFieldKey(field);
      const hasValue = Boolean((values[key] || "").trim());
      if (!hasValue) {
        showToast.error(`${field.label} is required`);
        return false;
      }
    }
    return true;
  };

  const renderUploadedFiles = (
    label: string,
    urls: string[],
    onRemove: (index: number) => void,
  ) => {
    if (!urls.length) return null;

    return (
      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {urls.map((url, index) => (
          <div
            key={`${label}-${url}-${index}`}
            className="group relative overflow-hidden rounded-xl border border-white/[0.10] bg-[#07101f]/70 shadow-sm shadow-black/20 transition hover:border-white/20"
          >
            {isImageUrl(url) ? (
              <button
                type="button"
                onClick={() =>
                  setPreviewImage({ url, title: `${label} ${index + 1}` })
                }
                className="block w-full"
              >
                <img
                  src={url}
                  alt={`${label} ${index + 1}`}
                  className="h-24 w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </button>
            ) : (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex h-24 items-center justify-center px-3 text-center text-xs font-semibold text-[#fe9a00] transition hover:bg-[#fe9a00]/5"
              >
                View PDF
              </a>
            )}
            <button
              type="button"
              aria-label={`Remove ${label} ${index + 1}`}
              onClick={() => onRemove(index)}
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/80 text-sm text-white shadow-lg transition hover:border-red-400/40 hover:bg-red-500"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderCustomFields = (
    fields: CategoryHandoverField[],
    values: Record<string, string>,
    setValues: Dispatch<SetStateAction<Record<string, string>>>,
    files: Record<string, string[]>,
    setFiles: Dispatch<SetStateAction<Record<string, string[]>>>,
  ) => {
    if (!fields.length) {
      return (
        <div className="rounded-xl border border-dashed border-white/[0.12] bg-black/10 px-4 py-5 text-center text-xs leading-5 text-slate-500 sm:col-span-2">
          No category checklist fields configured for this stage.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
        {fields.map((field) => {
          const key = customFieldKey(field);
          const isUploading = uploadingKey === `custom-${key}`;
          const inputId = `upload-${key}`;
          return (
            <div
              key={key}
              className={`rounded-xl border border-white/[0.09] bg-[#07101f]/55 p-3.5 shadow-sm shadow-black/10 sm:p-4 ${
                field.inputType === "textarea" ? "sm:col-span-2" : ""
              }`}
            >
              <label
                htmlFor={field.fieldType === "file" ? inputId : undefined}
                className="mb-1.5 block text-xs font-semibold text-slate-300"
              >
                {field.label}
                {field.helpText ? (
                  <span className="ml-1 font-normal text-slate-500">
                    — {field.helpText}
                  </span>
                ) : null}
                {field.fieldType === "file" && (
                  <span className="ml-1 font-normal text-slate-500">
                    — optional
                  </span>
                )}
              </label>
              {field.fieldType === "file" ? (
                <>
                  <input
                    id={inputId}
                    className="sr-only"
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isUploading}
                    onChange={(event) =>
                      uploadSelectedImages(
                        event.target.files,
                        `custom-${key}`,
                        (urls) =>
                          setFiles((current) => ({
                            ...current,
                            [key]: [...(current[key] || []), ...urls],
                          })),
                      )
                    }
                  />
                  <label
                    htmlFor={inputId}
                    className={`group flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-white/[0.10] bg-white/[0.035] px-3 py-2.5 shadow-sm shadow-black/10 transition duration-200 hover:border-[#fe9a00]/45 hover:bg-[#fe9a00]/[0.045] focus-within:border-[#fe9a00]/70 focus-within:ring-2 focus-within:ring-[#fe9a00]/10 ${
                      isUploading ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#fe9a00]/25 bg-[#fe9a00]/10 text-[#fe9a00] shadow-sm transition group-hover:bg-[#fe9a00]/15">
                      {isUploading ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#fe9a00]/30 border-t-[#fe9a00]" />
                      ) : (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-4 w-4"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 16V4" />
                          <path d="m7 9 5-5 5 5" />
                          <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-xs font-bold text-slate-100">
                        {isUploading ? "Uploading…" : "Choose images"}
                      </span>
                      <span
                        className={`block truncate text-[10px] ${
                          (files[key] || []).length
                            ? "text-emerald-400"
                            : "text-gray-500"
                        }`}
                      >
                        {(files[key] || []).length
                          ? `${files[key].length} image${files[key].length === 1 ? "" : "s"} uploaded`
                          : "PNG, JPG · max 15MB"}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-base text-gray-600 transition group-hover:text-[#fe9a00]"
                    >
                      +
                    </span>
                  </label>
                  {renderUploadedFiles(field.label, files[key] || [], (index) =>
                    setFiles((current) => ({
                      ...current,
                      [key]: (current[key] || []).filter(
                        (_, fileIndex) => fileIndex !== index,
                      ),
                    })),
                  )}
                </>
              ) : field.inputType === "textarea" ? (
                <textarea
                  className={fieldClass}
                  rows={2}
                  required
                  value={values[key] || ""}
                  onChange={(event) =>
                    setValues({ ...values, [key]: event.target.value })
                  }
                />
              ) : (
                <input
                  className={fieldClass}
                  type={field.inputType || "text"}
                  required
                  value={values[key] || ""}
                  onChange={(event) =>
                    setValues({ ...values, [key]: event.target.value })
                  }
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderCompareValue = (value?: string | number | boolean | null) => {
    if (value === true) return "Yes";
    if (value === false) return "No";
    if (value === 0) return "0";
    return value ? String(value) : "-";
  };

  const renderComparisonRow = (
    label: string,
    before: string | number | boolean | undefined | null,
    after: string | number | boolean | undefined | null,
  ) => (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-white/[0.09] bg-[#07101f]/45 p-3.5 shadow-sm shadow-black/10 sm:grid-cols-2 sm:p-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Before · {label}
        </p>
        <p className="mt-1.5 break-words text-sm font-semibold leading-5 text-white">
          {renderCompareValue(before)}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#fe9a00]">
          After · {label}
        </p>
        <p className="mt-1.5 break-words text-sm font-semibold leading-5 text-white">
          {renderCompareValue(after)}
        </p>
      </div>
    </div>
  );

  const renderFilePreviewList = (label: string, savedUrls?: string[]) => {
    const hasFiles = Boolean(savedUrls?.length);

    if (!hasFiles) {
      return (
        <p className="mt-1.5 break-words text-sm font-semibold leading-5 text-white">
          -
        </p>
      );
    }

    return (
      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2.5 sm:grid-cols-3">
        {(savedUrls || []).map((url, index) => {
          const image = isImageUrl(url);
          return image ? (
            <button
              key={`${label}-saved-${url}-${index}`}
              type="button"
              onClick={() =>
                setPreviewImage({
                  url,
                  title: `${label} before ${index + 1}`,
                })
              }
              className="group overflow-hidden rounded-xl border border-white/[0.10] bg-[#07101f]/65 text-left shadow-sm transition hover:border-white/20"
            >
              <img
                src={url}
                alt={`${label} saved ${index + 1}`}
                className="h-28 w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </button>
          ) : (
            <a
              key={`${label}-saved-${url}-${index}`}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="group overflow-hidden rounded-xl border border-white/[0.10] bg-[#07101f]/65 shadow-sm transition hover:border-white/20"
            >
              <span className="flex h-28 items-center justify-center px-3 text-center text-xs font-semibold text-[#fe9a00]">
                View file {index + 1}
              </span>
            </a>
          );
        })}
      </div>
    );
  };

  const renderFileComparisonRow = (
    label: string,
    beforeUrls?: string[],
    afterUrls?: string[],
  ) => (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-white/[0.09] bg-[#07101f]/45 p-3.5 shadow-sm shadow-black/10 sm:grid-cols-2 sm:p-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Before · {label}
        </p>
        {renderFilePreviewList(label, beforeUrls)}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#fe9a00]">
          After · {label}
        </p>
        {renderFilePreviewList(label, afterUrls)}
      </div>
    </div>
  );

  const savedBeforeCustomFields =
    activeReservation.handover?.customFields || [];
  const savedBeforeImageGroups = [
    ...((activeReservation.handover?.photos?.length || 0) > 0
      ? [
          {
            key: "legacy-handover-photos",
            label: "Vehicle photos",
            files: activeReservation.handover?.photos || [],
          },
        ]
      : []),
    ...savedBeforeCustomFields
      .filter(
        (field) =>
          field.fieldType === "file" && (field.files?.length || 0) > 0,
      )
      .map((field, index) => ({
        key: `before-${field.templateFieldId || index}`,
        label: field.label || "Handover images",
        files: field.files || [],
      })),
  ];
  const savedBeforeImageCount = savedBeforeImageGroups.reduce(
    (total, group) => total + group.files.length,
    0,
  );
  const beforeCustomByTemplateFieldId = new Map(
    savedBeforeCustomFields
      .filter((field) => field.templateFieldId)
      .map((field) => [String(field.templateFieldId), field]),
  );
  const beforeCustomByLabel = new Map(
    savedBeforeCustomFields.map((field) => [
      normalizeFieldLabel(field.label),
      field,
    ]),
  );

  const renderReturnComparison = () => {
    const handoverData = activeReservation.handover;
    if (!handoverData?.completedAt) return null;

    return (
      <div className="space-y-4 rounded-2xl border border-[#fe9a00]/20 bg-gradient-to-b from-[#fe9a00]/10 to-[#fe9a00]/[0.035] p-3.5 shadow-lg shadow-black/10 sm:p-5">
        <div>
          <h4 className="font-bold text-white">Before / after comparison</h4>
          <p className="text-xs font-medium leading-5 text-slate-400">
            Compare the handover values against the return inspection values as
            you fill the return form.
          </p>
        </div>
        <div className="space-y-2.5">
          {renderComparisonRow(
            "Mileage",
            handoverData.startMileage,
            inspection.returnMileage,
          )}
          {renderComparisonRow(
            "Fuel level",
            handoverData.startFuelLevel,
            inspection.returnFuelLevel,
          )}
          {renderComparisonRow(
            "Damages",
            listText(handoverData.existingDamages),
            inspection.newDamages || "-",
          )}
          {renderComparisonRow(
            "Equipment",
            listText(handoverData.equipment),
            inspection.missingEquipment || "-",
          )}
          {returnFields.map((field) => {
            const key = customFieldKey(field);
            const beforeField =
              (field._id
                ? beforeCustomByTemplateFieldId.get(String(field._id))
                : undefined) ||
              beforeCustomByLabel.get(normalizeFieldLabel(field.label));
            return (
              <div key={key}>
                {field.fieldType === "file"
                  ? renderFileComparisonRow(
                      field.label,
                      beforeField?.files,
                      afterFiles[key],
                    )
                  : renderComparisonRow(
                      field.label,
                      beforeField?.value,
                      afterValues[key],
                    )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const submitHandover = async () => {
    const requiredFields = [
      [handover.startMileage, "Starting mileage"],
      [handover.startFuelLevel, "Fuel level"],
      [handover.keyCount, "Key count"],
      [handover.staffId, "Handover staff member"],
      [handover.conditionNotes, "Condition notes"],
      [handover.existingDamages, "Existing damages"],
      [handover.equipment, "Equipment"],
    ];
    const missing = requiredFields.find(([, value]) => !String(value).trim());
    if (missing) {
      showToast.error(`${missing[1]} is required`);
      return;
    }
    if (uploadingKey) {
      showToast.error("Please wait for uploads to finish");
      return;
    }
    if (!validateCustomFields(beforeFields, beforeValues)) return;

    setBusy(true);
    try {
      const customFields = await buildCustomFields(
        beforeFields,
        beforeValues,
        beforeFiles,
      );
      await post(`/api/admin/reservations/${activeReservation._id}/handover`, {
        ...handover,
        existingDamages: lines(handover.existingDamages),
        equipment: lines(handover.equipment),
        customFields,
      });
      showToast.success("Vehicle handover completed");
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Handover failed",
      );
    } finally {
      setBusy(false);
    }
  };

  const validateInspectionForm = () => {
    const requiredFields = [
      [inspection.returnMileage, "Return mileage"],
      [inspection.returnFuelLevel, "Return fuel level"],
      [inspection.lateMinutes, "Late minutes"],
      [inspection.newDamages, "New damages"],
      [inspection.missingEquipment, "Missing equipment"],
      [inspection.notes, "Inspection notes"],
      [inspection.staffId, "Return inspection staff member"],
    ];
    const missing = requiredFields.find(([, value]) => !String(value).trim());
    if (missing) {
      showToast.error(`${missing[1]} is required`);
      return false;
    }
    if (uploadingKey) {
      showToast.error("Please wait for uploads to finish");
      return false;
    }
    return validateCustomFields(returnFields, afterValues);
  };

  const goToReturnComparison = () => {
    if (validateInspectionForm()) {
      setReturnMiniStep("compare");
    }
  };

  const submitInspection = async () => {
    if (!validateInspectionForm()) return;

    setBusy(true);
    try {
      const customFields = await buildCustomFields(
        returnFields,
        afterValues,
        afterFiles,
      );
      await post(
        `/api/admin/reservations/${activeReservation._id}/inspection`,
        {
          ...inspection,
          lateReturn: Number(inspection.lateMinutes) > 0,
          newDamages: lines(inspection.newDamages),
          missingEquipment: lines(inspection.missingEquipment),
          customFields,
        },
      );
      showToast.success("Return inspection completed");
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Inspection failed",
      );
    } finally {
      setBusy(false);
    }
  };

  const submitRefund = async (action: "review" | "approve" | "complete") => {
    if (
      additionalCharges.some(
        (charge) => (Number(charge.amount) || 0) <= 0 || !charge.reason.trim(),
      )
    ) {
      showToast.error("Every additional deduction needs an amount and reason");
      return;
    }
    setBusy(true);
    try {
      await post(`/api/admin/reservations/${activeReservation._id}/refund`, {
        action,
        charges: refund,
        additionalCharges: additionalCharges.map((charge) => ({
          amount: Number(charge.amount),
          reason: charge.reason.trim(),
        })),
        chargeReason: refund.chargeReason,
        reference: refund.reference,
        expectedBy: refund.expectedBy || undefined,
      });
      showToast.success(
        action === "complete"
          ? "Refund completed"
          : action === "approve"
            ? `Refund approved with ${additionalCharges.length} additional deduction${additionalCharges.length === 1 ? "" : "s"}`
            : `${additionalCharges.length} additional deduction${additionalCharges.length === 1 ? "" : "s"} saved`,
      );
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Refund update failed",
      );
    } finally {
      setBusy(false);
    }
  };

  const showHandover = HANDOVER_STATUSES.includes(activeReservation.status);
  const showInspection = INSPECTION_STATUSES.includes(activeReservation.status);
  const showRefund = REFUND_STATUSES.includes(activeReservation.status);
  if (!showHandover && !showInspection && !showRefund) return null;
  if (loadingReservation) {
    return (
      <div className="rounded-2xl border border-white/[0.09] bg-[#0b1224]/75 p-4 shadow-xl shadow-black/15 sm:p-5">
        <div className="flex items-center gap-3.5">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#fe9a00]/25 border-t-[#fe9a00]" />
          <div>
            <p className="text-sm font-bold text-white">
              Loading vehicle inspection form…
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Reading the latest category checklist and reservation data.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="h-20 animate-pulse rounded-xl border border-white/[0.04] bg-white/[0.045]" />
          <div className="h-20 animate-pulse rounded-xl border border-white/[0.04] bg-white/[0.045]" />
        </div>
      </div>
    );
  }
  if (loadError || !loadedReservation) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-gradient-to-b from-red-500/[0.07] to-red-500/[0.025] p-5 text-center shadow-xl shadow-black/10">
        <p className="text-sm font-semibold text-red-200">
          Could not load the vehicle form
        </p>
        <p className="mt-1 text-xs font-medium leading-5 text-slate-400">
          {loadError || "The full reservation data was not returned."}
        </p>
        <button
          type="button"
          onClick={() => void loadReservation()}
          className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15"
        >
          Retry
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-5 rounded-2xl border border-white/[0.09] bg-gradient-to-b from-[#0b1224]/95 to-[#07101f]/90 p-3 shadow-2xl shadow-black/15 sm:p-5 lg:p-6">
      {showHandover && (
        <div className="space-y-4">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
            <div>
              <h3 className="text-lg font-black tracking-tight text-white sm:text-xl">
                Vehicle handover
              </h3>
              <p className="text-xs text-gray-500">
                Record the vehicle state before collection.
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300 shadow-sm shadow-emerald-950/10">
              {category?.name || "Category"} · {beforeFields.length} checklist
              {beforeFields.length === 1 ? " item" : " items"}
            </span>
          </div>

          <section className="rounded-2xl border border-white/[0.08] bg-[#07101f]/50 p-3.5 shadow-sm shadow-black/10 sm:p-4">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Vehicle readings
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium leading-5 text-slate-400">
                Starting mileage
                <input
                  className={`${fieldClass} mt-1`}
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 42,500"
                  value={handover.startMileage}
                  onChange={(e) =>
                    setHandover({ ...handover, startMileage: e.target.value })
                  }
                />
              </label>
              <label className="text-xs font-medium leading-5 text-slate-400">
                Starting fuel level
                <input
                  className={`${fieldClass} mt-1`}
                  required
                  placeholder="e.g. Full"
                  value={handover.startFuelLevel}
                  onChange={(e) =>
                    setHandover({ ...handover, startFuelLevel: e.target.value })
                  }
                />
              </label>
              <label className="text-xs font-medium leading-5 text-slate-400">
                Key count
                <input
                  className={`${fieldClass} mt-1`}
                  type="number"
                  required
                  min="0"
                  placeholder="Key count"
                  value={handover.keyCount}
                  onChange={(e) =>
                    setHandover({ ...handover, keyCount: e.target.value })
                  }
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.08] bg-[#07101f]/50 p-3.5 shadow-sm shadow-black/10 sm:p-4">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Condition and checks
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium leading-5 text-slate-400">
                Condition notes
                <textarea
                  className={`${fieldClass} mt-1`}
                  required
                  rows={2}
                  placeholder="Overall condition"
                  value={handover.conditionNotes}
                  onChange={(e) =>
                    setHandover({ ...handover, conditionNotes: e.target.value })
                  }
                />
              </label>
              <label className="text-xs font-medium leading-5 text-slate-400">
                Existing damages
                <textarea
                  className={`${fieldClass} mt-1`}
                  required
                  rows={2}
                  placeholder="One per line; enter None if clear"
                  value={handover.existingDamages}
                  onChange={(e) =>
                    setHandover({
                      ...handover,
                      existingDamages: e.target.value,
                    })
                  }
                />
              </label>
              <label className="text-xs font-medium leading-5 text-slate-400">
                Equipment
                <textarea
                  className={`${fieldClass} mt-1`}
                  required
                  rows={2}
                  placeholder="One item per line"
                  value={handover.equipment}
                  onChange={(e) =>
                    setHandover({ ...handover, equipment: e.target.value })
                  }
                />
              </label>
              <label className="text-xs font-medium leading-5 text-slate-400">
                Handover completed by
                <SearchableStaffSelect
                  value={handover.staffId}
                  selectedName={handover.staffSignature}
                  disabled={busy}
                  onChange={(staff) =>
                    setHandover({
                      ...handover,
                      staffId: staff._id,
                      staffSignature:
                        `${staff.name} ${staff.lastName || ""}`.trim(),
                    })
                  }
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5 shadow-sm shadow-black/10 sm:p-4">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Category checklist · Before
            </p>
            {renderCustomFields(
              beforeFields,
              beforeValues,
              setBeforeValues,
              beforeFiles,
              setBeforeFiles,
            )}
          </section>
          <button
            disabled={busy || Boolean(uploadingKey)}
            onClick={submitHandover}
            className="w-full rounded-lg bg-[#fe9a00] px-4 py-2 font-bold text-white disabled:opacity-50"
          >
            Confirm handover
          </button>
        </div>
      )}

      {showInspection && (
        <div className="space-y-4">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-black tracking-tight text-white sm:text-xl">
                Return inspection
              </h3>
              <p className="text-xs font-medium leading-5 text-slate-400">
                {returnMiniStep === "form"
                  ? "1. Re-fill the return form first."
                  : "2. Compare before/after, then complete inspection."}
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full border border-[#fe9a00]/20 bg-[#fe9a00]/10 px-3 py-1.5 text-xs font-black text-[#fe9a00]">
              {returnMiniStep === "form" ? "Fill form" : "Compare"}
            </span>
          </div>
          <div className="flex flex-col items-start justify-between gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] px-3.5 py-3 sm:flex-row sm:items-center">
            <p className="text-xs font-medium leading-5 text-slate-400">
              Loaded from{" "}
              <strong className="text-slate-200">
                {category?.name || "category"}
              </strong>
            </p>
            <span className="text-[11px] font-bold text-emerald-300">
              {returnFields.length} return checklist
              {returnFields.length === 1 ? " item" : " items"}
            </span>
          </div>

          {returnMiniStep === "form" ? (
            <>
              <section className="rounded-2xl border border-white/[0.08] bg-[#07101f]/50 p-3.5 shadow-sm shadow-black/10 sm:p-4">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Vehicle readings
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="text-xs font-medium leading-5 text-slate-400">
                    Return mileage
                    <input
                      className={`${fieldClass} mt-1`}
                      type="number"
                      required
                      min="0"
                      placeholder="e.g. 42,650"
                      value={inspection.returnMileage}
                      onChange={(e) =>
                        setInspection({
                          ...inspection,
                          returnMileage: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="text-xs font-medium leading-5 text-slate-400">
                    Return fuel level
                    <input
                      className={`${fieldClass} mt-1`}
                      required
                      placeholder="e.g. Three quarters"
                      value={inspection.returnFuelLevel}
                      onChange={(e) =>
                        setInspection({
                          ...inspection,
                          returnFuelLevel: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="text-xs font-medium leading-5 text-slate-400">
                    Late minutes
                    <input
                      className={`${fieldClass} mt-1`}
                      type="number"
                      required
                      min="0"
                      placeholder="0"
                      value={inspection.lateMinutes}
                      onChange={(e) =>
                        setInspection({
                          ...inspection,
                          lateMinutes: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="text-xs font-medium leading-5 text-slate-400">
                    Return inspection completed by
                    <SearchableStaffSelect
                      value={inspection.staffId}
                      selectedName={inspection.staffSignature}
                      disabled={busy}
                      onChange={(staff) =>
                        setInspection({
                          ...inspection,
                          staffId: staff._id,
                          staffSignature:
                            `${staff.name} ${staff.lastName || ""}`.trim(),
                        })
                      }
                    />
                  </label>
                  <label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/[0.10] bg-[#07101f]/60 px-3.5 py-3 text-sm font-medium text-slate-300 transition hover:border-white/20">
                    <input
                      type="checkbox"
                      className="accent-[#fe9a00]"
                      checked={inspection.cleaningIssue}
                      onChange={(e) =>
                        setInspection({
                          ...inspection,
                          cleaningIssue: e.target.checked,
                        })
                      }
                    />{" "}
                    Cleaning issue found
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-white/[0.08] bg-[#07101f]/50 p-3.5 shadow-sm shadow-black/10 sm:p-4">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Condition and checks
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="text-xs font-medium leading-5 text-slate-400">
                    New damages
                    <textarea
                      className={`${fieldClass} mt-1`}
                      required
                      rows={2}
                      placeholder="One per line; enter None if clear"
                      value={inspection.newDamages}
                      onChange={(e) =>
                        setInspection({
                          ...inspection,
                          newDamages: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="text-xs font-medium leading-5 text-slate-400">
                    Missing equipment
                    <textarea
                      className={`${fieldClass} mt-1`}
                      required
                      rows={2}
                      placeholder="One per line; enter None if clear"
                      value={inspection.missingEquipment}
                      onChange={(e) =>
                        setInspection({
                          ...inspection,
                          missingEquipment: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="text-xs font-medium leading-5 text-slate-400 sm:col-span-2">
                    Inspection notes
                    <textarea
                      className={`${fieldClass} mt-1`}
                      required
                      rows={2}
                      placeholder="Final inspection notes"
                      value={inspection.notes}
                      onChange={(e) =>
                        setInspection({ ...inspection, notes: e.target.value })
                      }
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5 shadow-sm shadow-black/10 sm:p-4">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                      Category checklist · After
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                      Images are optional. Review the handover images before
                      adding return evidence.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBeforeImagesModalOpen(true)}
                    disabled={savedBeforeImageCount === 0}
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#fe9a00]/25 bg-[#fe9a00]/10 px-3 py-2 text-xs font-black text-[#fe9a00] transition hover:border-[#fe9a00]/45 hover:bg-[#fe9a00]/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-slate-600"
                  >
                    View before images
                    <span className="rounded-full bg-black/20 px-1.5 py-0.5 text-[10px]">
                      {savedBeforeImageCount}
                    </span>
                  </button>
                </div>
                {renderCustomFields(
                  returnFields,
                  afterValues,
                  setAfterValues,
                  afterFiles,
                  setAfterFiles,
                )}
              </section>
              <button
                disabled={busy || Boolean(uploadingKey)}
                onClick={goToReturnComparison}
                className="w-full rounded-lg bg-[#fe9a00] px-4 py-2 font-bold text-white disabled:opacity-50"
              >
                Continue to comparison
              </button>
            </>
          ) : (
            <>
              {renderReturnComparison()}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  disabled={busy}
                  onClick={() => setReturnMiniStep("form")}
                  className="rounded-lg bg-white/10 px-4 py-2 font-bold text-white disabled:opacity-50"
                >
                  Back to form
                </button>
                <button
                  disabled={busy}
                  onClick={submitInspection}
                  className="rounded-lg bg-[#fe9a00] px-4 py-2 font-bold text-white disabled:opacity-50"
                >
                  Complete inspection
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {showRefund && (
        <div className="space-y-4">
          <h3 className="text-lg font-black tracking-tight text-white sm:text-xl">
            Deposit and refund review
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                "fuel",
                "late",
                "damage",
                "cleaning",
                "missingEquipment",
              ] as const
            ).map((field) => (
              <label key={field} className="text-xs capitalize text-slate-400">
                {field.replace(/([A-Z])/g, " $1")} charge (£)
                <input
                  className={`${fieldClass} mt-1`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={refund[field]}
                  onChange={(e) =>
                    setRefund({ ...refund, [field]: e.target.value })
                  }
                />
              </label>
            ))}
          </div>
          <textarea
            className={fieldClass}
            rows={2}
            placeholder="Charge reason"
            value={refund.chargeReason}
            onChange={(e) =>
              setRefund({ ...refund, chargeReason: e.target.value })
            }
          />
          <section className="rounded-2xl border border-white/[0.08] bg-[#07101f]/50 p-3.5 shadow-sm shadow-black/10 sm:p-4">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-bold text-white">
                  Additional deductions
                </p>
                <p className="text-xs text-gray-500">
                  Add each extra cost with its own reason.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setAdditionalCharges((current) => [
                    ...current,
                    {
                      id: `charge-${Date.now()}-${current.length}`,
                      amount: "",
                      reason: "",
                    },
                  ])
                }
                className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-[#fe9a00]/30 bg-[#fe9a00]/10 px-4 text-sm font-black text-[#fe9a00] shadow-sm transition hover:border-[#fe9a00]/45 hover:bg-[#fe9a00]/20 sm:w-auto"
              >
                <span className="text-lg leading-none">+</span>
                Add
              </button>
            </div>

            {additionalCharges.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-white/[0.12] bg-black/10 px-4 py-5 text-center text-xs leading-5 text-slate-500">
                No additional deductions
              </p>
            ) : (
              <div className="mt-4 space-y-3.5">
                {additionalCharges.map((charge, index) => (
                  <div
                    key={charge.id}
                    className="grid grid-cols-1 gap-3 rounded-xl border border-white/[0.09] bg-white/[0.025] p-3 shadow-sm shadow-black/10 sm:grid-cols-[110px_minmax(0,1fr)_40px] sm:items-end"
                  >
                    <label className="text-[11px] font-medium text-slate-400">
                      Amount (£)
                      <input
                        className={`${fieldClass} mt-1`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={charge.amount}
                        onChange={(event) =>
                          setAdditionalCharges((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, amount: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className="text-[11px] font-medium text-slate-400">
                      Reason
                      <input
                        className={`${fieldClass} mt-1`}
                        maxLength={300}
                        placeholder="Reason for this deduction"
                        value={charge.reason}
                        onChange={(event) =>
                          setAdditionalCharges((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, reason: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </label>
                    <button
                      type="button"
                      aria-label={`Remove deduction ${index + 1}`}
                      onClick={() =>
                        setAdditionalCharges((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                      className="h-10 w-full rounded-xl border border-red-400/10 bg-red-500/[0.08] text-lg text-red-300 transition hover:border-red-400/25 hover:bg-red-500/20 sm:w-10"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
          <div className="grid grid-cols-1 gap-2 rounded-2xl border border-white/[0.08] bg-[#07101f]/55 p-3 text-sm shadow-sm shadow-black/10 sm:grid-cols-3 sm:gap-3 sm:p-4">
            <p className="text-slate-400">
              Deposit
              <br />
              <strong className="text-white">£{depositPaid.toFixed(2)}</strong>
            </p>
            <p className="text-slate-400">
              Deductions
              <br />
              <strong className="text-red-300">
                £{totalDeductions.toFixed(2)}
              </strong>
            </p>
            <p className="text-slate-400">
              Refund
              <br />
              <strong className="text-emerald-300">
                £{refundAmount.toFixed(2)}
              </strong>
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <label className="text-xs font-medium leading-5 text-slate-400">
              Refund authorization number
              <input
                className={`${fieldClass} mt-1`}
                placeholder="Enter bank authorization number"
                value={refund.reference}
                onChange={(e) =>
                  setRefund({ ...refund, reference: e.target.value })
                }
              />
            </label>
            <label className="text-xs font-medium leading-5 text-slate-400">
              Expected refund date
              <DatePicker
                selected={
                  refund.expectedBy
                    ? new Date(`${refund.expectedBy}T00:00:00`)
                    : null
                }
                onChange={(date: Date | null) =>
                  setRefund({
                    ...refund,
                    expectedBy: dateInputValue(date),
                  })
                }
                minDate={new Date()}
                dateFormat="dd/MM/yyyy"
                placeholderText="Select refund date"
                className={`${fieldClass} mt-1`}
                wrapperClassName="w-full"
                calendarClassName="svh-refund-date-picker"
                showPopperArrow={false}
              />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <button
              disabled={busy}
              onClick={() => submitRefund("review")}
              className="rounded-lg bg-white/10 px-2 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              Save deductions
            </button>
            <button
              disabled={busy}
              onClick={() => submitRefund("approve")}
              className="min-h-11 rounded-xl border border-[#fe9a00]/25 bg-[#fe9a00]/10 px-3 py-2.5 text-xs font-black text-[#fe9a00] transition hover:border-[#fe9a00]/40 hover:bg-[#fe9a00]/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Approve refund
            </button>
            <button
              disabled={busy}
              onClick={() => submitRefund("complete")}
              className="min-h-11 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2.5 text-xs font-black text-emerald-300 transition hover:border-emerald-400/35 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark completed
            </button>
          </div>
        </div>
      )}

      {beforeImagesModalOpen && (
        <div
          className="fixed inset-0 z-[75] flex items-end justify-center bg-black/85 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setBeforeImagesModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Before handover images"
        >
          <div
            className="max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-t-3xl border border-white/[0.10] bg-[#0b1224]/98 p-4 shadow-2xl shadow-black/40 sm:rounded-3xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#fe9a00]">
                  Handover evidence
                </p>
                <h4 className="mt-1 text-lg font-black text-white">
                  Before images
                </h4>
                <p className="mt-1 text-xs font-medium leading-5 text-slate-400">
                  Review the vehicle condition recorded before collection.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBeforeImagesModalOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-lg font-bold text-white transition hover:bg-white/20"
                aria-label="Close before images"
              >
                ×
              </button>
            </div>

            {savedBeforeImageGroups.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {savedBeforeImageGroups.map((group) => (
                  <div
                    key={group.key}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-white">
                        {group.label}
                      </p>
                      <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-slate-400">
                        {group.files.length} image
                        {group.files.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    {renderFilePreviewList(group.label, group.files)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 px-4 py-8 text-center text-sm font-medium text-slate-500">
                No handover images were uploaded.
              </div>
            )}
          </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/85 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-t-3xl border border-white/[0.10] bg-[#0b1224]/98 p-3 shadow-2xl shadow-black/40 sm:rounded-3xl sm:p-5">
            <div className="mb-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <p className="font-bold text-white">{previewImage.title}</p>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/20"
              >
                Close
              </button>
            </div>
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-h-[72dvh] w-full rounded-2xl border border-white/[0.06] bg-black/20 object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
