"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FiChevronDown,
  FiFileText,
  FiCreditCard,
  FiMapPin,
  FiTruck,
  FiSearch,
  FiRefreshCw,
  FiClock,
  FiClipboard,
  FiUpload,
  FiCheckCircle,
  FiAlertCircle,
  FiDownload,
  FiEdit3,
} from "react-icons/fi";
import type { Reservation } from "@/types/type";
import type { ReservationJourneyViewModel } from "@/types/reservation-journey";
import type { SafeContractSummary } from "@/lib/docusign/types";
import { statusLabel } from "@/lib/reservation-status";
import DepositPanel from "./DepositPanel";

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
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-950 font-semibold text-right">{value ?? "-"}</span>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
      <FiClock className="shrink-0" />
      {text}
    </div>
  );
}

function Section({
  id,
  icon,
  title,
  open,
  onToggle,
  children,
}: {
  id: JourneySectionId;
  icon: React.ReactNode;
  title: string;
  open: boolean;
  onToggle: (id: JourneySectionId) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
    >
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-3 text-slate-950 font-bold text-sm">
          <span className="text-[#fe9a00]">{icon}</span>
          {title}
        </span>
        <FiChevronDown
          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

export default function JourneyAccordions({
  reservation,
  journey,
  contract,
  openSection,
  onToggle,
  onEditBooking,
  onSignContract,
  onDownloadContract,
  onDepositUpdated,
  signBusy,
}: {
  reservation: Reservation;
  journey: ReservationJourneyViewModel;
  contract: SafeContractSummary | null;
  openSection: JourneySectionId | null;
  onToggle: (id: JourneySectionId) => void;
  onEditBooking: () => void;
  onSignContract: () => void;
  onDownloadContract: (kind: "signed" | "certificate") => void;
  onDepositUpdated: () => void;
  signBusy: boolean;
}) {
  const [licence] = useState<{ front?: boolean; back?: boolean }>(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return {};
    try {
      const userData = JSON.parse(storedUser);
      return {
        front: Boolean(userData?.licenceAttached?.front),
        back: Boolean(userData?.licenceAttached?.back),
      };
    } catch {
      return {};
    }
  });

  const handover = reservation.handover;
  const inspection = reservation.inspection;
  const refund = reservation.refund;
  const user = reservation.user as
    | { name?: string; lastName?: string; emaildata?: { emailAddress?: string }; phoneData?: { phoneNumber?: string } }
    | undefined;

  const canEdit = journey.mainStatus === "pending";
  const licenceComplete = licence.front && licence.back;

  return (
    <div className="space-y-3">
      {/* ── Booking summary ─────────────────────────────────── */}
      <Section
        id="summary"
        icon={<FiClipboard />}
        title="Booking summary"
        open={openSection === "summary"}
        onToggle={onToggle}
      >
        <Row label="Booking reference" value={journey.bookingReference} />
        <Row label="Vehicle" value={journey.vehicleName} />
        <Row label="Pickup" value={journey.pickupDateTime} />
        <Row label="Return" value={journey.returnDateTime} />
        <Row label="Duration" value={journey.durationLabel} />
        <Row label="Office" value={journey.collection?.location} />
        <Row
          label="Gear"
          value={reservation.selectedGear === "automatic" ? "Automatic" : "Manual"}
        />
        <Row label="Driver" value={[user?.name, user?.lastName].filter(Boolean).join(" ") || "-"} />
        <Row label="Phone" value={user?.phoneData?.phoneNumber} />
        <Row label="Email" value={user?.emaildata?.emailAddress} />
        {(reservation.addOns?.length ?? 0) > 0 && (
          <Row
            label="Add-ons"
            value={reservation.addOns!
              .map((a) => {
                const name =
                  typeof a.addOn === "object" ? a.addOn?.name : undefined;
                return `${name || "Add-on"} ×${a.quantity}`;
              })
              .join(", ")}
          />
        )}
        {reservation.messege && <Row label="Notes" value={reservation.messege} />}
        <Row
          label="Total price"
          value={
            reservation.perInvoice && !reservation.totalPrice
              ? "Per Invoice"
              : `£${reservation.totalPrice}`
          }
        />
        {canEdit && (
          <button
            type="button"
            onClick={onEditBooking}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[#fe9a00]/10 hover:bg-[#fe9a00]/20 text-[#fe9a00] rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            <FiEdit3 /> Edit booking
          </button>
        )}
      </Section>

      {/* ── Documents ───────────────────────────────────────── */}
      <Section
        id="documents"
        icon={<FiUpload />}
        title="Documents"
        open={openSection === "documents"}
        onToggle={onToggle}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
            <span className="text-sm text-slate-950 font-semibold">
              Driving licence
            </span>
            {licenceComplete ? (
              <span className="inline-flex items-center gap-1 text-green-400 text-sm font-semibold">
                <FiCheckCircle /> Uploaded
              </span>
            ) : (
              <Link
                href="/customerDashboard#profile"
                className="inline-flex items-center gap-1 text-[#fe9a00] text-sm font-semibold hover:underline"
              >
                <FiAlertCircle /> Upload in Profile
              </Link>
            )}
          </div>
          {["Proof of address", "ID card / passport", "Payment card proof"].map(
            (doc) => (
              <div
                key={doc}
                className="flex items-center justify-between bg-slate-50 rounded-lg p-3"
              >
                <span className="text-sm text-slate-950 font-semibold">{doc}</span>
                <span className="text-slate-500 text-sm">
                  Bring to collection if requested
                </span>
              </div>
            ),
          )}
        </div>
      </Section>

      {/* ── Payment & deposit ──────────────────────────────── */}
      <Section
        id="deposit"
        icon={<FiCreditCard />}
        title="Payment & deposit"
        open={openSection === "deposit"}
        onToggle={onToggle}
      >
        <DepositPanel reservation={reservation} onUpdated={onDepositUpdated} />
      </Section>

      {/* ── Contract ────────────────────────────────────────── */}
      <Section
        id="contract"
        icon={<FiFileText />}
        title="Rental agreement"
        open={openSection === "contract"}
        onToggle={onToggle}
      >
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
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
      <Section
        id="collection"
        icon={<FiMapPin />}
        title="Collection & return"
        open={openSection === "collection"}
        onToggle={onToggle}
      >
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
        <p className="text-slate-500 text-sm mt-2">
          Bring your driving licence and booking reference. Please return the
          van with the same fuel level and on time to avoid extra charges.
        </p>
        {reservation.office?.address && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(reservation.office.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-sm font-semibold transition-colors"
          >
            <FiMapPin /> Get Directions
          </a>
        )}
      </Section>

      {/* ── Handover form ──────────────────────────────────── */}
      <Section
        id="handover"
        icon={<FiTruck />}
        title="Handover form"
        open={openSection === "handover"}
        onToggle={onToggle}
      >
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
      <Section
        id="inspection"
        icon={<FiSearch />}
        title="Return inspection"
        open={openSection === "inspection"}
        onToggle={onToggle}
      >
        {inspection?.completedAt ? (
          <>
            <Row label="Return mileage" value={inspection.returnMileage} />
            <Row label="Return fuel level" value={inspection.returnFuelLevel} />
            {(inspection.newDamages?.length ?? 0) > 0 && (
              <Row label="New damages" value={inspection.newDamages!.join(", ")} />
            )}
            <Row label="Late return" value={inspection.lateReturn ? "Yes" : "No"} />
            {(inspection.lateMinutes ?? 0) > 0 && (
              <Row label="Late by" value={`${inspection.lateMinutes} minutes`} />
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
      <Section
        id="refund"
        icon={<FiRefreshCw />}
        title="Refund summary"
        open={openSection === "refund"}
        onToggle={onToggle}
      >
        {refund && journey.refund ? (
          <>
            <Row label="Deposit paid" value={`£${journey.refund.depositPaid}`} />
            {(refund.charges?.fuel ?? 0) > 0 && (
              <Row label="Fuel charge" value={`-£${refund.charges!.fuel}`} />
            )}
            {(refund.charges?.late ?? 0) > 0 && (
              <Row label="Late charge" value={`-£${refund.charges!.late}`} />
            )}
            {(refund.charges?.damage ?? 0) > 0 && (
              <Row label="Damage charge" value={`-£${refund.charges!.damage}`} />
            )}
            {(refund.charges?.cleaning ?? 0) > 0 && (
              <Row
                label="Cleaning charge"
                value={`-£${refund.charges!.cleaning}`}
              />
            )}
            {(refund.charges?.missingEquipment ?? 0) > 0 && (
              <Row
                label="Missing equipment"
                value={`-£${refund.charges!.missingEquipment}`}
              />
            )}
            {(refund.charges?.other ?? 0) > 0 && (
              <Row label="Other charge" value={`-£${refund.charges!.other}`} />
            )}
            <Row
              label="Total deductions"
              value={`-£${journey.refund.deductionsTotal}`}
            />
            <Row
              label="Refund amount"
              value={
                <span className="text-green-400">
                  £{journey.refund.refundAmount}
                </span>
              }
            />
            <Row
              label="Status"
              value={journey.refund.status.replace(/_/g, " ")}
            />
            {journey.refund.reference && (
              <Row label="Refund reference" value={journey.refund.reference} />
            )}
            {refund.chargeReason && (
              <Row label="Deduction reason" value={refund.chargeReason} />
            )}
            {refund.expectedBy && (
              <Row
                label="Expected by"
                value={new Date(refund.expectedBy).toLocaleDateString("en-GB")}
              />
            )}
            <p className="text-slate-500 text-xs mt-2">
              Refunds usually reach your account within 5–10 working days.
            </p>
          </>
        ) : (
          <Placeholder text="Your deposit refund will be reviewed after the return inspection. Details will appear here." />
        )}
      </Section>

      {/* ── Activity timeline ──────────────────────────────── */}
      <Section
        id="timeline"
        icon={<FiClock />}
        title="Activity timeline"
        open={openSection === "timeline"}
        onToggle={onToggle}
      >
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
                  <p className="text-slate-950 text-sm font-semibold">
                    {statusLabel(entry.status)}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {new Date(entry.changedAt).toLocaleString("en-GB", {
                      timeZone: "Europe/London",
                    })}
                  </p>
                  {entry.note && (
                    <p className="text-slate-500 text-xs mt-0.5">{entry.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Placeholder text="Booking activity will appear here as your reservation progresses." />
        )}
      </Section>
    </div>
  );
}

export { authHeaders };
