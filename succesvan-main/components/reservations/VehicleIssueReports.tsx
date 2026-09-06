"use client";

import { useEffect, useState } from "react";
import { FiAlertTriangle, FiCamera, FiCheck, FiChevronDown, FiLoader, FiX } from "react-icons/fi";
import type { Reservation } from "@/types/type";
import { clientAuthHeaders } from "@/lib/client-auth";
import { showToast } from "@/lib/toast";

export default function VehicleIssueReports({
  reservation,
  admin = false,
  onUpdated,
}: {
  reservation: Reservation;
  admin?: boolean;
  onUpdated?: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reviewReasons, setReviewReasons] = useState<Record<string, string>>({});
  const reports = reservation.vehicleIssueNotes || [];
  const canSubmit =
    !admin &&
    Boolean(reservation.handover?.completedAt) &&
    !reservation.inspection?.receivedAt &&
    ["delivered", "rental_active"].includes(reservation.status);

  useEffect(() => {
    if (reports.some((item) => item.status === "pending")) setOpen(true);
  }, [reports]);

  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast.error("Please select an image");
      return;
    }
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok || !payload.url) throw new Error(payload.error || "Upload failed");
      setImageUrl(payload.url);
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!reservation._id || !note.trim() || !imageUrl) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/reservations/${reservation._id}/vehicle-issues`, {
        method: "POST",
        headers: clientAuthHeaders(true),
        body: JSON.stringify({ note: note.trim(), imageUrl }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "Could not submit report");
      setNote("");
      setImageUrl("");
      await onUpdated?.();
      showToast.success("Vehicle problem sent for review");
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Could not submit report");
    } finally {
      setBusy(false);
    }
  };

  const review = async (noteId: string, status: "accepted" | "refused") => {
    if (!reservation._id) return;
    const reviewReason = reviewReasons[noteId]?.trim() || "";
    if (status === "refused" && !reviewReason) {
      showToast.error("Enter a refusal reason");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/reservations/${reservation._id}/vehicle-issues`, {
        method: "PATCH",
        headers: clientAuthHeaders(true),
        body: JSON.stringify({ noteId, status, reviewReason }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "Review failed");
      await onUpdated?.();
      showToast.success(status === "accepted" ? "Report accepted" : "Report refused");
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Review failed");
    } finally {
      setBusy(false);
    }
  };

  if (!admin && !canSubmit && reports.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300"><FiAlertTriangle /></span>
          <span><strong className="block text-sm text-white">Vehicle problem reports</strong><span className="text-xs text-slate-400">{reports.length ? `${reports.length} report${reports.length === 1 ? "" : "s"}` : "Report a problem with photo evidence"}</span></span>
        </span>
        <FiChevronDown className={`shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-white/10 p-4">
          {reports.map((report, index) => {
            const id = String(report._id || index);
            return (
              <article key={id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="flex gap-3">
                  <button type="button" onClick={() => setPreview(report.imageUrl)} className="shrink-0"><img src={report.imageUrl} alt="Vehicle problem" className="h-16 w-20 rounded-lg object-cover" /></button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2"><span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${report.status === "accepted" ? "bg-emerald-500/15 text-emerald-300" : report.status === "refused" ? "bg-red-500/15 text-red-300" : "bg-amber-500/15 text-amber-300"}`}>{report.status}</span><time className="text-[11px] text-slate-500">{new Date(report.createdAt).toLocaleString("en-GB", { timeZone: "Europe/London" })}</time></div>
                    <p className="mt-2 break-words text-sm text-slate-200">{report.note}</p>
                    {report.reviewReason && <p className="mt-2 text-xs text-slate-400">Admin response: {report.reviewReason}</p>}
                  </div>
                </div>
                {admin && report.status === "pending" && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                    <input value={reviewReasons[id] || ""} onChange={(event) => setReviewReasons((current) => ({ ...current, [id]: event.target.value }))} placeholder="Reason (required when refused)" className="min-h-10 rounded-lg border border-white/10 bg-[#07101f] px-3 text-sm text-white outline-none focus:border-[#fe9a00]" />
                    <button disabled={busy} onClick={() => void review(id, "refused")} className="min-h-10 rounded-lg bg-red-500/15 px-3 text-xs font-bold text-red-300"><FiX className="mr-1 inline" />Refuse</button>
                    <button disabled={busy} onClick={() => void review(id, "accepted")} className="min-h-10 rounded-lg bg-emerald-500/15 px-3 text-xs font-bold text-emerald-300"><FiCheck className="mr-1 inline" />Accept</button>
                  </div>
                )}
              </article>
            );
          })}
          {canSubmit && (
            <div className="rounded-xl border border-dashed border-white/15 bg-black/10 p-3">
              <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} rows={3} placeholder="Describe the vehicle problem…" className="w-full resize-none rounded-lg border border-white/10 bg-[#07101f] p-3 text-sm text-white outline-none focus:border-[#fe9a00]" />
              {imageUrl && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.07] p-2.5">
                  <button
                    type="button"
                    onClick={() => setPreview(imageUrl)}
                    className="group relative shrink-0 overflow-hidden rounded-lg"
                    aria-label="Open uploaded problem image"
                  >
                    <img
                      src={imageUrl}
                      alt="Uploaded vehicle problem"
                      className="h-16 w-20 object-cover transition group-hover:scale-105"
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-emerald-300">Image uploaded</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">Click the thumbnail to view it.</p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setImageUrl("")}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-400/15 bg-red-500/10 text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                    aria-label="Remove uploaded problem image"
                    title="Remove image"
                  >
                    <FiX />
                  </button>
                </div>
              )}
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <label className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] text-sm font-bold text-slate-200"><input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(event) => void upload(event.target.files?.[0])} />{busy ? <FiLoader className="animate-spin" /> : <FiCamera />}{imageUrl ? "Replace photo" : "Upload photo"}</label>
                <button type="button" disabled={busy || !note.trim() || !imageUrl} onClick={() => void submit()} className="min-h-11 rounded-lg bg-[#fe9a00] px-5 text-sm font-black text-white disabled:opacity-40">Send report</button>
              </div>
            </div>
          )}
          {!canSubmit && !admin && <p className="text-xs text-slate-500">New reports are closed after the vehicle is returned.</p>}
        </div>
      )}
      {preview && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4" onClick={() => setPreview(null)}><img src={preview} alt="Vehicle problem evidence" className="max-h-[85vh] max-w-full rounded-xl object-contain" /></div>}
    </div>
  );
}
