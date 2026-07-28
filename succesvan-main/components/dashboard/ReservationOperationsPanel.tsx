"use client";

import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { showToast } from "@/lib/toast";
import { clientAuthHeaders } from "@/lib/client-auth";
import type { Reservation } from "@/types/type";

type CategoryHandoverField = {
  label: string;
  fieldType: "input" | "file";
  inputType?: "text" | "number" | "date" | "textarea";
  requiredBefore?: boolean;
  requiredAfter?: boolean;
  helpText?: string;
};

const fieldClass =
  "w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[#fe9a00] focus:outline-none";

const lines = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const listText = (value?: string[]) =>
  value && value.length > 0 ? value.join(", ") : "-";

const isImageUrl = (url: string) =>
  /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(url) ||
  url.startsWith("blob:") ||
  url.startsWith("data:image/");

async function uploadImages(files: FileList | null) {
  if (!files?.length) return [];
  const urls: string[] = [];
  for (const file of Array.from(files)) {
    const allowed =
      file.type.startsWith("image/") || file.type === "application/pdf";
    if (!allowed || file.size > 15 * 1024 * 1024) {
      throw new Error("Files must be images or PDFs smaller than 15MB");
    }
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: formData });
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
  const [busy, setBusy] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const category = reservation.category as
    | {
        deposit?: { handoverDepositPrice?: number };
        handoverFormFields?: CategoryHandoverField[];
      }
    | undefined;
  const handoverFieldTemplates = category?.handoverFormFields || [];
  const beforeFields = handoverFieldTemplates.filter(
    (field) => field.requiredBefore,
  );
  const returnFields = handoverFieldTemplates.filter(
    (field) => field.requiredBefore || field.requiredAfter,
  );
  const defaultHandoverDeposit =
    reservation.handoverDepositAmount ??
    category?.deposit?.handoverDepositPrice ??
    0;
  const [handover, setHandover] = useState({
    handoverDepositAmount: String(defaultHandoverDeposit),
    startMileage: "",
    startFuelLevel: "",
    conditionNotes: "",
    existingDamages: "",
    customerSignature: "",
    staffSignature: "",
    keyCount: "1",
    equipment: "",
  });
  const [handoverPhotos, setHandoverPhotos] = useState<string[]>([]);
  const [beforeValues, setBeforeValues] = useState<Record<string, string>>({});
  const [beforeFiles, setBeforeFiles] = useState<Record<string, string[]>>(
    {},
  );
  const [inspection, setInspection] = useState({
    returnMileage: "",
    returnFuelLevel: "",
    lateMinutes: "0",
    newDamages: "",
    missingEquipment: "",
    notes: "",
    cleaningIssue: false,
  });
  const [inspectionPhotos, setInspectionPhotos] = useState<string[]>([]);
  const [afterValues, setAfterValues] = useState<Record<string, string>>({});
  const [afterFiles, setAfterFiles] = useState<Record<string, string[]>>(
    {},
  );
  const [returnMiniStep, setReturnMiniStep] = useState<"form" | "compare">(
    "form",
  );
  const [refund, setRefund] = useState({
    fuel: String(reservation.refund?.charges?.fuel ?? 0),
    late: String(reservation.refund?.charges?.late ?? 0),
    damage: String(reservation.refund?.charges?.damage ?? 0),
    cleaning: String(reservation.refund?.charges?.cleaning ?? 0),
    missingEquipment: String(
      reservation.refund?.charges?.missingEquipment ?? 0,
    ),
    other: String(reservation.refund?.charges?.other ?? 0),
    chargeReason: reservation.refund?.chargeReason ?? "",
    otherChargeReason: reservation.refund?.otherChargeReason ?? "",
    reference: reservation.refund?.reference ?? "",
    expectedBy: "",
  });

  const deductions = useMemo(
    () =>
      [
        refund.fuel,
        refund.late,
        refund.damage,
        refund.cleaning,
        refund.missingEquipment,
        refund.other,
      ].reduce((total, value) => total + Math.max(0, Number(value) || 0), 0),
    [refund],
  );
  const depositPaid =
    reservation.refund?.depositPaid ??
    reservation.handoverDepositAmount ??
    reservation.deposit?.amount ??
    0;
  const refundAmount = Math.max(0, depositPaid - deductions);

  const post = async (path: string, body: object) => {
    const response = await fetch(path, {
      method: "POST",
      headers: clientAuthHeaders(true),
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!payload.success) throw new Error(payload.error || "Request failed");
    onUpdated(payload.data);
  };

  const customFieldKey = (field: CategoryHandoverField, index: number) =>
    `${index}-${field.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

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
    for (const [index, field] of fields.entries()) {
      const key = customFieldKey(field, index);
      entries.push({
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
    files: Record<string, string[]>,
  ) => {
    for (const [index, field] of fields.entries()) {
      const key = customFieldKey(field, index);
      const hasValue =
        field.fieldType === "file"
          ? Boolean(files[key]?.length)
          : Boolean((values[key] || "").trim());
      if (!hasValue) {
        showToast.error(`${field.label} is required`);
        return false;
      }
    }
    return true;
  };

  const renderCustomFields = (
    fields: CategoryHandoverField[],
    values: Record<string, string>,
    setValues: Dispatch<SetStateAction<Record<string, string>>>,
    files: Record<string, string[]>,
    setFiles: Dispatch<SetStateAction<Record<string, string[]>>>,
  ) => {
    if (!fields.length) return null;

    return (
      <div className="rounded-lg border border-white/10 bg-black/20 p-3 space-y-3">
        <p className="text-sm font-semibold text-white">
          Category checklist fields
        </p>
        {fields.map((field, index) => {
          const key = customFieldKey(field, index);
          const isUploading = uploadingKey === `custom-${key}`;
          return (
            <label key={key} className="block text-xs text-gray-400">
              <span className="mb-1 block">
                {field.label}
                {field.helpText ? (
                  <span className="ml-1 text-gray-500">— {field.helpText}</span>
                ) : null}
              </span>
              {field.fieldType === "file" ? (
                <>
                  <input
                    className={fieldClass}
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    required
                    disabled={isUploading}
                    onChange={(event) =>
                      uploadSelectedImages(
                        event.target.files,
                        `custom-${key}`,
                        (urls) => setFiles({ ...files, [key]: urls }),
                      )
                    }
                  />
                  {isUploading && (
                    <span className="mt-1 block text-[11px] font-semibold text-[#fe9a00]">
                      Uploading files...
                    </span>
                  )}
                  {files[key]?.length ? (
                    <span className="mt-1 block text-[11px] font-semibold text-emerald-300">
                      {files[key].length} file
                      {files[key].length === 1 ? "" : "s"} uploaded
                    </span>
                  ) : null}
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
            </label>
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
    <div className="grid grid-cols-[1fr_1fr] gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Before · {label}
        </p>
        <p className="mt-1 text-sm font-semibold text-white">
          {renderCompareValue(before)}
        </p>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#fe9a00]">
          After · {label}
        </p>
        <p className="mt-1 text-sm font-semibold text-white">
          {renderCompareValue(after)}
        </p>
      </div>
    </div>
  );

  const renderFilePreviewList = (
    label: string,
    savedUrls?: string[],
  ) => {
    const hasFiles = Boolean(savedUrls?.length);

    if (!hasFiles) {
      return <p className="mt-1 text-sm font-semibold text-white">-</p>;
    }

    return (
      <div className="mt-2 grid grid-cols-2 gap-2">
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
              className="group overflow-hidden rounded-lg border border-white/10 bg-black/20 text-left"
            >
              <img
                src={url}
                alt={`${label} saved ${index + 1}`}
                className="h-24 w-full object-cover transition group-hover:scale-105"
              />
            </button>
          ) : (
            <a
              key={`${label}-saved-${url}-${index}`}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="group overflow-hidden rounded-lg border border-white/10 bg-black/20"
            >
              <span className="flex h-24 items-center justify-center px-2 text-center text-xs font-semibold text-[#fe9a00]">
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
    <div className="grid grid-cols-[1fr_1fr] gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Before · {label}
        </p>
        {renderFilePreviewList(label, beforeUrls)}
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#fe9a00]">
          After · {label}
        </p>
        {renderFilePreviewList(label, afterUrls)}
      </div>
    </div>
  );

  const beforeCustomByLabel = new Map(
    (reservation.handover?.customFields || []).map((field) => [
      field.label || "",
      field,
    ]),
  );

  const renderReturnComparison = () => {
    const handoverData = reservation.handover;
    if (!handoverData?.completedAt) return null;

    return (
      <div className="rounded-xl border border-[#fe9a00]/20 bg-[#fe9a00]/10 p-3 space-y-3">
        <div>
          <h4 className="font-semibold text-white">
            Before / after comparison
          </h4>
          <p className="text-xs text-gray-400">
            Compare the handover values against the return inspection values as
            you fill the return form.
          </p>
        </div>
        <div className="space-y-2">
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
          {renderFileComparisonRow(
            "Photos",
            handoverData.photos,
            inspectionPhotos,
          )}
          {returnFields.map((field, index) => {
            const key = customFieldKey(field, index);
            const beforeField = beforeCustomByLabel.get(field.label);
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
      [handover.handoverDepositAmount, "Handover deposit amount"],
      [handover.startMileage, "Starting mileage"],
      [handover.startFuelLevel, "Fuel level"],
      [handover.keyCount, "Key count"],
      [handover.staffSignature, "Staff signature/name"],
      [handover.customerSignature, "Customer signature/name"],
      [handover.conditionNotes, "Condition notes"],
      [handover.existingDamages, "Existing damages"],
      [handover.equipment, "Equipment"],
    ];
    const missing = requiredFields.find(([, value]) => !String(value).trim());
    if (missing) {
      showToast.error(`${missing[1]} is required`);
      return;
    }
    if (!handoverPhotos.length) {
      showToast.error("Handover photos are required");
      return;
    }
    if (uploadingKey) {
      showToast.error("Please wait for uploads to finish");
      return;
    }
    if (!validateCustomFields(beforeFields, beforeValues, beforeFiles)) return;

    setBusy(true);
    try {
      const customFields = await buildCustomFields(
        beforeFields,
        beforeValues,
        beforeFiles,
      );
      await post(`/api/admin/reservations/${reservation._id}/handover`, {
        ...handover,
        handoverDepositAmount: Number(handover.handoverDepositAmount) || 0,
        existingDamages: lines(handover.existingDamages),
        equipment: lines(handover.equipment),
        photos: handoverPhotos,
        customFields,
      });
      showToast.success("Vehicle handover completed");
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Handover failed");
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
    ];
    const missing = requiredFields.find(([, value]) => !String(value).trim());
    if (missing) {
      showToast.error(`${missing[1]} is required`);
      return false;
    }
    if (!inspectionPhotos.length) {
      showToast.error("Return inspection photos are required");
      return false;
    }
    if (uploadingKey) {
      showToast.error("Please wait for uploads to finish");
      return false;
    }
    return validateCustomFields(returnFields, afterValues, afterFiles);
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
      await post(`/api/admin/reservations/${reservation._id}/inspection`, {
        ...inspection,
        lateReturn: Number(inspection.lateMinutes) > 0,
        newDamages: lines(inspection.newDamages),
        missingEquipment: lines(inspection.missingEquipment),
        photos: inspectionPhotos,
        customFields,
      });
      showToast.success("Return inspection completed");
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Inspection failed");
    } finally {
      setBusy(false);
    }
  };

  const submitRefund = async (action: "review" | "approve" | "complete") => {
    if ((Number(refund.other) || 0) > 0 && !refund.otherChargeReason.trim()) {
      showToast.error("Other charge reason is required");
      return;
    }
    setBusy(true);
    try {
      await post(`/api/admin/reservations/${reservation._id}/refund`, {
        action,
        charges: refund,
        chargeReason: refund.chargeReason,
        otherChargeReason: refund.otherChargeReason,
        reference: refund.reference,
        expectedBy: refund.expectedBy || undefined,
      });
      showToast.success(
        action === "complete"
          ? "Refund completed"
          : action === "approve"
            ? "Refund approved"
            : "Deductions saved",
      );
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Refund update failed");
    } finally {
      setBusy(false);
    }
  };

  const showHandover = [
    "contract_signed",
    "ready_for_collection",
    "handover_in_progress",
  ].includes(reservation.status);
  const showInspection = ["delivered", "vehicle_returned", "return_inspection"].includes(
    reservation.status,
  );
  const showRefund = ["deposit_review", "refund_processing"].includes(
    reservation.status,
  );
  if (!showHandover && !showInspection && !showRefund) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
      {showHandover && (
        <div className="space-y-3">
          <h3 className="font-semibold text-white">Vehicle handover</h3>
          <label className="block text-xs text-gray-400">
            Handover deposit amount (£)
            <input
              className={`${fieldClass} mt-1`}
              type="number"
              required
              min="0"
              step="0.01"
              value={handover.handoverDepositAmount}
              onChange={(e) =>
                setHandover({
                  ...handover,
                  handoverDepositAmount: e.target.value,
                })
              }
            />
            <span className="mt-1 block text-[11px] text-gray-500">
              Defaults from the category, but you can edit it for special
              occasions.
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-gray-400">Starting mileage<input className={`${fieldClass} mt-1`} type="number" required min="0" placeholder="Starting mileage" value={handover.startMileage} onChange={(e) => setHandover({ ...handover, startMileage: e.target.value })} /></label>
            <label className="text-xs text-gray-400">Starting fuel level<input className={`${fieldClass} mt-1`} required placeholder="Fuel level" value={handover.startFuelLevel} onChange={(e) => setHandover({ ...handover, startFuelLevel: e.target.value })} /></label>
            <label className="text-xs text-gray-400">Key count<input className={`${fieldClass} mt-1`} type="number" required min="0" placeholder="Key count" value={handover.keyCount} onChange={(e) => setHandover({ ...handover, keyCount: e.target.value })} /></label>
            <label className="text-xs text-gray-400">Staff signature/name<input className={`${fieldClass} mt-1`} required placeholder="Staff signature/name" value={handover.staffSignature} onChange={(e) => setHandover({ ...handover, staffSignature: e.target.value })} /></label>
          </div>
          <label className="block text-xs text-gray-400">Customer signature/name<input className={`${fieldClass} mt-1`} required placeholder="Customer signature/name" value={handover.customerSignature} onChange={(e) => setHandover({ ...handover, customerSignature: e.target.value })} /></label>
          <label className="block text-xs text-gray-400">Condition notes<textarea className={`${fieldClass} mt-1`} required rows={2} placeholder="Condition notes" value={handover.conditionNotes} onChange={(e) => setHandover({ ...handover, conditionNotes: e.target.value })} /></label>
          <label className="block text-xs text-gray-400">Existing damages<textarea className={`${fieldClass} mt-1`} required rows={2} placeholder="One per line" value={handover.existingDamages} onChange={(e) => setHandover({ ...handover, existingDamages: e.target.value })} /></label>
          <label className="block text-xs text-gray-400">Equipment<textarea className={`${fieldClass} mt-1`} required rows={2} placeholder="One per line" value={handover.equipment} onChange={(e) => setHandover({ ...handover, equipment: e.target.value })} /></label>
          <label className="block text-xs text-gray-400">
            Handover photos
            <input
              className={`${fieldClass} mt-1`}
              type="file"
              accept="image/*"
              multiple
              required
              disabled={uploadingKey === "handover-photos"}
              onChange={(event) =>
                uploadSelectedImages(
                  event.target.files,
                  "handover-photos",
                  setHandoverPhotos,
                )
              }
            />
            {uploadingKey === "handover-photos" && (
              <span className="mt-1 block text-[11px] font-semibold text-[#fe9a00]">
                Uploading handover photos...
              </span>
            )}
            {handoverPhotos.length ? (
              <span className="mt-1 block text-[11px] font-semibold text-emerald-300">
                {handoverPhotos.length} photo
                {handoverPhotos.length === 1 ? "" : "s"} uploaded
              </span>
            ) : null}
          </label>
          {renderCustomFields(
            beforeFields,
            beforeValues,
            setBeforeValues,
            beforeFiles,
            setBeforeFiles,
          )}
          <button disabled={busy || Boolean(uploadingKey)} onClick={submitHandover} className="w-full rounded-lg bg-[#fe9a00] px-4 py-2 font-semibold text-white disabled:opacity-50">Confirm handover</button>
        </div>
      )}

      {showInspection && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">Return inspection</h3>
              <p className="text-xs text-gray-400">
                {returnMiniStep === "form"
                  ? "1. Re-fill the return form first."
                  : "2. Compare before/after, then complete inspection."}
              </p>
            </div>
            <span className="rounded-full bg-[#fe9a00]/15 px-3 py-1 text-xs font-bold text-[#fe9a00]">
              {returnMiniStep === "form" ? "Fill form" : "Compare"}
            </span>
          </div>

          {returnMiniStep === "form" ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-gray-400">Return mileage<input className={`${fieldClass} mt-1`} type="number" required min="0" placeholder="Return mileage" value={inspection.returnMileage} onChange={(e) => setInspection({ ...inspection, returnMileage: e.target.value })} /></label>
                <label className="text-xs text-gray-400">Return fuel level<input className={`${fieldClass} mt-1`} required placeholder="Fuel level" value={inspection.returnFuelLevel} onChange={(e) => setInspection({ ...inspection, returnFuelLevel: e.target.value })} /></label>
                <label className="text-xs text-gray-400">Late minutes<input className={`${fieldClass} mt-1`} type="number" required min="0" placeholder="Late minutes" value={inspection.lateMinutes} onChange={(e) => setInspection({ ...inspection, lateMinutes: e.target.value })} /></label>
                <label className="flex items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-gray-300"><input type="checkbox" checked={inspection.cleaningIssue} onChange={(e) => setInspection({ ...inspection, cleaningIssue: e.target.checked })} /> Cleaning issue</label>
              </div>
              <label className="block text-xs text-gray-400">New damages<textarea className={`${fieldClass} mt-1`} required rows={2} placeholder="One per line" value={inspection.newDamages} onChange={(e) => setInspection({ ...inspection, newDamages: e.target.value })} /></label>
              <label className="block text-xs text-gray-400">Missing equipment<textarea className={`${fieldClass} mt-1`} required rows={2} placeholder="One per line" value={inspection.missingEquipment} onChange={(e) => setInspection({ ...inspection, missingEquipment: e.target.value })} /></label>
              <label className="block text-xs text-gray-400">Inspection notes<textarea className={`${fieldClass} mt-1`} required rows={2} placeholder="Inspection notes" value={inspection.notes} onChange={(e) => setInspection({ ...inspection, notes: e.target.value })} /></label>
              <label className="block text-xs text-gray-400">
                Return inspection photos
                <input
                  className={`${fieldClass} mt-1`}
                  type="file"
                  accept="image/*"
                  multiple
                  required
                  disabled={uploadingKey === "inspection-photos"}
                  onChange={(event) =>
                    uploadSelectedImages(
                      event.target.files,
                      "inspection-photos",
                      setInspectionPhotos,
                    )
                  }
                />
                {uploadingKey === "inspection-photos" && (
                  <span className="mt-1 block text-[11px] font-semibold text-[#fe9a00]">
                    Uploading return photos...
                  </span>
                )}
                {inspectionPhotos.length ? (
                  <span className="mt-1 block text-[11px] font-semibold text-emerald-300">
                    {inspectionPhotos.length} photo
                    {inspectionPhotos.length === 1 ? "" : "s"} uploaded
                  </span>
                ) : null}
              </label>
              {renderCustomFields(
                returnFields,
                afterValues,
                setAfterValues,
                afterFiles,
                setAfterFiles,
              )}
              <button disabled={busy || Boolean(uploadingKey)} onClick={goToReturnComparison} className="w-full rounded-lg bg-[#fe9a00] px-4 py-2 font-semibold text-white disabled:opacity-50">Continue to comparison</button>
            </>
          ) : (
            <>
              {renderReturnComparison()}
              <div className="grid grid-cols-2 gap-2">
                <button disabled={busy} onClick={() => setReturnMiniStep("form")} className="rounded-lg bg-white/10 px-4 py-2 font-semibold text-white disabled:opacity-50">Back to form</button>
                <button disabled={busy} onClick={submitInspection} className="rounded-lg bg-[#fe9a00] px-4 py-2 font-semibold text-white disabled:opacity-50">Complete inspection</button>
              </div>
            </>
          )}
        </div>
      )}

      {showRefund && (
        <div className="space-y-3">
          <h3 className="font-semibold text-white">Deposit and refund review</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(["fuel", "late", "damage", "cleaning", "missingEquipment", "other"] as const).map((field) => (
              <label key={field} className="text-xs capitalize text-gray-400">{field.replace(/([A-Z])/g, " $1")} charge (£)<input className={`${fieldClass} mt-1`} type="number" min="0" step="0.01" value={refund[field]} onChange={(e) => setRefund({ ...refund, [field]: e.target.value })} /></label>
            ))}
          </div>
          <textarea className={fieldClass} rows={2} placeholder="Charge reason" value={refund.chargeReason} onChange={(e) => setRefund({ ...refund, chargeReason: e.target.value })} />
          <textarea className={fieldClass} rows={2} placeholder="Other charge reason" value={refund.otherChargeReason} onChange={(e) => setRefund({ ...refund, otherChargeReason: e.target.value })} />
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-black/20 p-3 text-sm"><p className="text-gray-400">Deposit<br /><strong className="text-white">£{depositPaid.toFixed(2)}</strong></p><p className="text-gray-400">Deductions<br /><strong className="text-red-300">£{deductions.toFixed(2)}</strong></p><p className="text-gray-400">Refund<br /><strong className="text-emerald-300">£{refundAmount.toFixed(2)}</strong></p></div>
          <div className="grid grid-cols-2 gap-2">
            <input className={fieldClass} placeholder="Refund reference" value={refund.reference} onChange={(e) => setRefund({ ...refund, reference: e.target.value })} />
            <input className={fieldClass} type="date" value={refund.expectedBy} onChange={(e) => setRefund({ ...refund, expectedBy: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button disabled={busy} onClick={() => submitRefund("review")} className="rounded-lg bg-white/10 px-2 py-2 text-xs font-semibold text-white disabled:opacity-50">Save review</button>
            <button disabled={busy} onClick={() => submitRefund("approve")} className="rounded-lg bg-[#fe9a00]/20 px-2 py-2 text-xs font-semibold text-[#fe9a00] disabled:opacity-50">Approve refund</button>
            <button disabled={busy} onClick={() => submitRefund("complete")} className="rounded-lg bg-emerald-500/20 px-2 py-2 text-xs font-semibold text-emerald-300 disabled:opacity-50">Mark completed</button>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0b1224] p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-semibold text-white">{previewImage.title}</p>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/20"
              >
                Close
              </button>
            </div>
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-h-[75vh] w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
