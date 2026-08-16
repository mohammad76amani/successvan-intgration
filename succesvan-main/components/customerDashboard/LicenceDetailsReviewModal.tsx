"use client";

import { useState } from "react";
import Image from "next/image";
import { FiAlertCircle, FiCheckCircle, FiX } from "react-icons/fi";

export type LicenceDetailsReview = {
  isFrontSide?: boolean;
  sourceSide?: "front" | "back" | "unknown";
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  postcode?: string | null;
  licenseNumber?: string | null;
  licenceNumber?: string | null;
  issueDate?: string | null;
  expirationDate?: string | null;
  expiryDate?: string | null;
  issuingCountry?: string | null;
  issuingAuthority?: string | null;
  licenceCategories?: string[];
};

type EditableLicenceDetails = {
  fullName: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  licenceNumber: string;
  issueDate: string;
  expiryDate: string;
  address: string;
  postcode: string;
  issuingAuthority: string;
  issuingCountry: string;
  licenceCategories: string;
};

const emptyDetails: EditableLicenceDetails = {
  fullName: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  licenceNumber: "",
  issueDate: "",
  expiryDate: "",
  address: "",
  postcode: "",
  issuingAuthority: "",
  issuingCountry: "",
  licenceCategories: "",
};

function toForm(details: LicenceDetailsReview): EditableLicenceDetails {
  return {
    fullName: details.fullName || "",
    firstName: details.firstName || "",
    lastName: details.lastName || "",
    dateOfBirth: details.dateOfBirth || "",
    licenceNumber: details.licenceNumber || details.licenseNumber || "",
    issueDate: details.issueDate || "",
    expiryDate: details.expiryDate || details.expirationDate || "",
    address: details.address || "",
    postcode: details.postcode || "",
    issuingAuthority: details.issuingAuthority || "",
    issuingCountry: details.issuingCountry || "",
    licenceCategories: details.licenceCategories?.join(", ") || "",
  };
}

function toDetails(form: EditableLicenceDetails): LicenceDetailsReview {
  const licenceNumber = form.licenceNumber.trim();
  const expiryDate = form.expiryDate.trim();

  return {
    isFrontSide: true,
    sourceSide: "front",
    fullName: form.fullName.trim() || null,
    firstName: form.firstName.trim() || null,
    lastName: form.lastName.trim() || null,
    dateOfBirth: form.dateOfBirth.trim() || null,
    licenceNumber: licenceNumber || null,
    licenseNumber: licenceNumber || null,
    issueDate: form.issueDate.trim() || null,
    expiryDate: expiryDate || null,
    expirationDate: expiryDate || null,
    address: form.address.trim() || null,
    postcode: form.postcode.trim() || null,
    issuingAuthority: form.issuingAuthority.trim() || null,
    issuingCountry: form.issuingCountry.trim() || null,
    licenceCategories: form.licenceCategories
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-gray-500">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-[#fe9a00]/70"
      />
    </label>
  );
}

export default function LicenceDetailsReviewModal({
  open,
  imagePreview,
  details,
  saving,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  imagePreview?: string;
  details: LicenceDetailsReview | null;
  saving?: boolean;
  onCancel: () => void;
  onConfirm: (details: LicenceDetailsReview) => void;
}) {
  if (!open || !details) return null;

  return (
    <LicenceDetailsReviewForm
      key={imagePreview || "licence-review"}
      imagePreview={imagePreview}
      details={details}
      saving={saving}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}

function LicenceDetailsReviewForm({
  imagePreview,
  details,
  saving,
  onCancel,
  onConfirm,
}: {
  imagePreview?: string;
  details: LicenceDetailsReview;
  saving?: boolean;
  onCancel: () => void;
  onConfirm: (details: LicenceDetailsReview) => void;
}) {
  const [form, setForm] = useState<EditableLicenceDetails>(() =>
    details ? toForm(details) : emptyDetails,
  );

  const updateField =
    (field: keyof EditableLicenceDetails) => (value: string) =>
      setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-[#101a31]/95 p-5 shadow-2xl shadow-black/40">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#fe9a00]">
              Licence scan review
            </p>
            <h3 className="mt-1 text-xl font-black text-white">
              Check your licence details
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              We scanned both sides of your licence. Please correct anything
              wrong before saving — these details are used on your rental
              agreement.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg bg-white/5 p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            aria-label="Close licence review"
          >
            <FiX />
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <div className="space-y-3">
            {imagePreview && (
              <div className="relative h-44 overflow-hidden rounded-xl border border-white/10 bg-black/25">
                <Image
                  src={imagePreview}
                  alt="Driving licence front preview"
                  fill
                  sizes="280px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <div className="rounded-xl border border-[#fe9a00]/25 bg-[#fe9a00]/10 p-3 text-sm text-[#fe9a00]">
              <div className="flex gap-2">
                <FiAlertCircle className="mt-0.5 shrink-0" />
                <p>
                  DOB, expiry and licence number come from the front. The issue
                  date comes from field 10 on the f/k/q row on the back.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name" value={form.fullName} onChange={updateField("fullName")} />
            <Field label="Licence number" value={form.licenceNumber} onChange={updateField("licenceNumber")} />
            <Field label="First name" value={form.firstName} onChange={updateField("firstName")} />
            <Field label="Last name" value={form.lastName} onChange={updateField("lastName")} />
            <Field label="Date of birth" value={form.dateOfBirth} onChange={updateField("dateOfBirth")} placeholder="YYYY-MM-DD" />
            <Field label="Expiry date" value={form.expiryDate} onChange={updateField("expiryDate")} placeholder="YYYY-MM-DD" />
            <Field label="Issue date" value={form.issueDate} onChange={updateField("issueDate")} placeholder="YYYY-MM-DD" />
            <Field label="Postcode" value={form.postcode} onChange={updateField("postcode")} />
            <div className="sm:col-span-2">
              <Field label="Address" value={form.address} onChange={updateField("address")} />
            </div>
            <Field label="Issuing authority" value={form.issuingAuthority} onChange={updateField("issuingAuthority")} />
            <Field label="Issuing country" value={form.issuingCountry} onChange={updateField("issuingCountry")} />
            <div className="sm:col-span-2">
              <Field label="Licence categories" value={form.licenceCategories} onChange={updateField("licenceCategories")} placeholder="B, BE, C1" />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(toDetails(form))}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#fe9a00] px-4 py-2 text-sm font-black text-white transition-colors hover:bg-[#e68a00] disabled:opacity-50"
          >
            <FiCheckCircle />
            {saving ? "Saving..." : "Confirm and save"}
          </button>
        </div>
      </div>
    </div>
  );
}
