"use client";

import { useMemo, useState } from "react";
import { showToast } from "@/lib/toast";
import { clientAuthHeaders } from "@/lib/client-auth";
import type { Reservation } from "@/types/type";

const fieldClass =
  "w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[#fe9a00] focus:outline-none";

const lines = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

async function uploadImages(files: FileList | null) {
  if (!files?.length) return [];
  const urls: string[] = [];
  for (const file of Array.from(files)) {
    if (!file.type.startsWith("image/") || file.size > 15 * 1024 * 1024) {
      throw new Error("Photos must be images smaller than 15MB");
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
  const [handover, setHandover] = useState({
    startMileage: "",
    startFuelLevel: "",
    conditionNotes: "",
    existingDamages: "",
    customerSignature: "",
    staffSignature: "",
    keyCount: "1",
    equipment: "",
  });
  const [handoverPhotos, setHandoverPhotos] = useState<FileList | null>(null);
  const [inspection, setInspection] = useState({
    returnMileage: "",
    returnFuelLevel: "",
    lateMinutes: "0",
    newDamages: "",
    missingEquipment: "",
    notes: "",
    cleaningIssue: false,
  });
  const [inspectionPhotos, setInspectionPhotos] = useState<FileList | null>(null);
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
    reservation.refund?.depositPaid ?? reservation.deposit?.amount ?? 0;
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

  const submitHandover = async () => {
    setBusy(true);
    try {
      const photos = await uploadImages(handoverPhotos);
      await post(`/api/admin/reservations/${reservation._id}/handover`, {
        ...handover,
        existingDamages: lines(handover.existingDamages),
        equipment: lines(handover.equipment),
        photos,
      });
      showToast.success("Vehicle handover completed");
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Handover failed");
    } finally {
      setBusy(false);
    }
  };

  const submitInspection = async () => {
    setBusy(true);
    try {
      const photos = await uploadImages(inspectionPhotos);
      await post(`/api/admin/reservations/${reservation._id}/inspection`, {
        ...inspection,
        lateReturn: Number(inspection.lateMinutes) > 0,
        newDamages: lines(inspection.newDamages),
        missingEquipment: lines(inspection.missingEquipment),
        photos,
      });
      showToast.success("Return inspection completed");
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Inspection failed");
    } finally {
      setBusy(false);
    }
  };

  const submitRefund = async (action: "review" | "approve" | "complete") => {
    setBusy(true);
    try {
      await post(`/api/admin/reservations/${reservation._id}/refund`, {
        action,
        charges: refund,
        chargeReason: refund.chargeReason,
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

  const showHandover = ["ready_for_collection", "handover_in_progress"].includes(
    reservation.status,
  );
  const showInspection = ["delivered", "vehicle_returned", "return_inspection"].includes(
    reservation.status,
  );
  const showRefund = ["deposit_review", "refund_processing", "refund_completed"].includes(
    reservation.status,
  );
  if (!showHandover && !showInspection && !showRefund) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
      {showHandover && (
        <div className="space-y-3">
          <h3 className="font-semibold text-white">Vehicle handover</h3>
          <div className="grid grid-cols-2 gap-2">
            <input className={fieldClass} type="number" min="0" placeholder="Starting mileage" value={handover.startMileage} onChange={(e) => setHandover({ ...handover, startMileage: e.target.value })} />
            <input className={fieldClass} placeholder="Fuel level" value={handover.startFuelLevel} onChange={(e) => setHandover({ ...handover, startFuelLevel: e.target.value })} />
            <input className={fieldClass} type="number" min="0" placeholder="Key count" value={handover.keyCount} onChange={(e) => setHandover({ ...handover, keyCount: e.target.value })} />
            <input className={fieldClass} placeholder="Staff signature/name" value={handover.staffSignature} onChange={(e) => setHandover({ ...handover, staffSignature: e.target.value })} />
          </div>
          <input className={fieldClass} placeholder="Customer signature/name" value={handover.customerSignature} onChange={(e) => setHandover({ ...handover, customerSignature: e.target.value })} />
          <textarea className={fieldClass} rows={2} placeholder="Condition notes" value={handover.conditionNotes} onChange={(e) => setHandover({ ...handover, conditionNotes: e.target.value })} />
          <textarea className={fieldClass} rows={2} placeholder="Existing damages — one per line" value={handover.existingDamages} onChange={(e) => setHandover({ ...handover, existingDamages: e.target.value })} />
          <textarea className={fieldClass} rows={2} placeholder="Equipment — one per line" value={handover.equipment} onChange={(e) => setHandover({ ...handover, equipment: e.target.value })} />
          <input className={fieldClass} type="file" accept="image/*" multiple onChange={(e) => setHandoverPhotos(e.target.files)} />
          <button disabled={busy} onClick={submitHandover} className="w-full rounded-lg bg-[#fe9a00] px-4 py-2 font-semibold text-white disabled:opacity-50">Confirm handover</button>
        </div>
      )}

      {showInspection && (
        <div className="space-y-3">
          <h3 className="font-semibold text-white">Return inspection</h3>
          <div className="grid grid-cols-2 gap-2">
            <input className={fieldClass} type="number" min="0" placeholder="Return mileage" value={inspection.returnMileage} onChange={(e) => setInspection({ ...inspection, returnMileage: e.target.value })} />
            <input className={fieldClass} placeholder="Fuel level" value={inspection.returnFuelLevel} onChange={(e) => setInspection({ ...inspection, returnFuelLevel: e.target.value })} />
            <input className={fieldClass} type="number" min="0" placeholder="Late minutes" value={inspection.lateMinutes} onChange={(e) => setInspection({ ...inspection, lateMinutes: e.target.value })} />
            <label className="flex items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-gray-300"><input type="checkbox" checked={inspection.cleaningIssue} onChange={(e) => setInspection({ ...inspection, cleaningIssue: e.target.checked })} /> Cleaning issue</label>
          </div>
          <textarea className={fieldClass} rows={2} placeholder="New damages — one per line" value={inspection.newDamages} onChange={(e) => setInspection({ ...inspection, newDamages: e.target.value })} />
          <textarea className={fieldClass} rows={2} placeholder="Missing equipment — one per line" value={inspection.missingEquipment} onChange={(e) => setInspection({ ...inspection, missingEquipment: e.target.value })} />
          <textarea className={fieldClass} rows={2} placeholder="Inspection notes" value={inspection.notes} onChange={(e) => setInspection({ ...inspection, notes: e.target.value })} />
          <input className={fieldClass} type="file" accept="image/*" multiple onChange={(e) => setInspectionPhotos(e.target.files)} />
          <button disabled={busy} onClick={submitInspection} className="w-full rounded-lg bg-[#fe9a00] px-4 py-2 font-semibold text-white disabled:opacity-50">Complete inspection</button>
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
    </div>
  );
}
