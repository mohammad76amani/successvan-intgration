import { Reservation } from "@/types/type";
import {
  DEPOSIT_OPTION_LABELS,
  statusLabel as getReservationStatusLabel,
} from "@/lib/reservation-status";

type PrintAddOnItem = NonNullable<Reservation["addOns"]>[number] & {
  totalPrice?: number;
};

type PrintUser = {
  name?: string;
  lastName?: string;
  phoneData?: { phoneNumber?: string };
  emaildata?: { emailAddress?: string };
  address?: string;
  city?: string;
  postalCode?: string;
};

type PrintOffice = { name?: string };
type PrintCategory = { name?: string };
type PrintVehicle = {
  title?: string;
  make?: string;
  number?: string | number;
  color?: string;
  keyNumber?: string;
};

const escapeHtml = (value: unknown) =>
  String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatCurrency = (value: unknown) => {
  const amount = Number(value || 0);
  return `£${amount.toFixed(2)}`;
};

const formatDateTime = (value: unknown) => {
  if (!value) return "-";
  const date = new Date(value as string | Date);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const humanize = (value: unknown) => {
  const text = String(value ?? "").trim();
  if (!text) return "-";
  return text
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatDisplayDateTime = (
  displayDate: string | undefined,
  time: string | undefined,
  fallback: Date | string,
) => {
  if (!displayDate) return formatDateTime(fallback);
  const parsed = new Date(`${displayDate}T${time || "00:00"}:00`);
  if (Number.isNaN(parsed.getTime())) {
    return `${escapeHtml(displayDate)}${time ? ` at ${escapeHtml(time)}` : ""}`;
  }
  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getRentalDays = (reservation: Reservation) => {
  const start = new Date(reservation.startDate);
  const end = new Date(reservation.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
};

const calculateDuration = (reservation: Reservation) => {
  const start = new Date(reservation.startDate);
  const end = new Date(reservation.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "-";
  }

  const totalHours = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60)),
  );
  const days = getRentalDays(reservation);
  return `${days} day${days === 1 ? "" : "s"} / ${totalHours} hour${
    totalHours === 1 ? "" : "s"
  }`;
};

const getAddOnAmount = (item: PrintAddOnItem, rentalDays: number) => {
  const storedTotal = Number(item.totalPrice);
  if (Number.isFinite(storedTotal) && storedTotal > 0) return storedTotal;

  const addOn = item.addOn;
  if (!addOn) return 0;
  const quantity = Math.max(1, Number(item.quantity) || 1);
  if (addOn.pricingType === "flat") {
    const amount =
      typeof addOn.flatPrice === "object"
        ? Number(addOn.flatPrice?.amount || 0)
        : Number(addOn.flatPrice || 0);
    const isPerDay =
      typeof addOn.flatPrice === "object" && addOn.flatPrice?.isPerDay;
    return (isPerDay ? amount * rentalDays : amount) * quantity;
  }

  const tierIndex = Number(item.selectedTierIndex ?? 0);
  const tier = addOn.tieredPrice?.tiers?.[tierIndex] || addOn.tiers?.[tierIndex];
  const amount = Number(tier?.price || 0);
  const isPerDay = Boolean(addOn.tieredPrice?.isPerDay);
  return (isPerDay ? amount * rentalDays : amount) * quantity;
};

const getAddOnsRows = (reservation: Reservation, rentalDays: number) => {
  const addOns = reservation.addOns || [];
  if (!addOns.length) {
    return `<tr><td colspan="4" class="muted">No add-ons selected</td></tr>`;
  }

  return addOns
    .map((item: PrintAddOnItem) => {
      const addOn = item.addOn;
      return `
        <tr>
          <td>${escapeHtml(addOn?.name || "Add-on")}</td>
          <td>${escapeHtml(item.quantity || 1)}</td>
          <td>${escapeHtml(
            item.selectedTierIndex !== undefined
              ? `Tier ${Number(item.selectedTierIndex) + 1}`
              : "-",
          )}</td>
          <td>${formatCurrency(getAddOnAmount(item, rentalDays))}</td>
        </tr>
      `;
    })
    .join("");
};

const hasMeaningfulData = (value: unknown) => {
  if (!value || typeof value !== "object") return false;
  return Object.values(value as Record<string, unknown>).some((item) => {
    if (Array.isArray(item)) return item.length > 0;
    return item !== undefined && item !== null && item !== "";
  });
};

const customFieldRows = (
  fields: NonNullable<Reservation["handover"]>["customFields"] = [],
) =>
  (fields || [])
    .map((field) => {
      const value =
        field.fieldType === "file"
          ? `${field.files?.length || 0} uploaded file(s)`
          : field.value || "-";
      return `<div class="price-row"><span>${escapeHtml(
        field.label || "Checklist item",
      )}</span><strong>${escapeHtml(value)}</strong></div>`;
    })
    .join("");

export function downloadReservationReceiptPng(reservation: Reservation | null) {
  if (!reservation || typeof window === "undefined") return;
  printReservationReceipt(reservation);
}

export function printReservationReceipt(reservation: Reservation | null) {
  if (!reservation || typeof window === "undefined") return;

  const user = (reservation.user || {}) as PrintUser;
  const office = (reservation.office || {}) as PrintOffice;
  const category = (reservation.category || {}) as PrintCategory;
  const vehicle = (reservation.vehicle || {}) as PrintVehicle;
  const vehicleSnapshot = reservation.vehicleSnapshot || {};
  const deposit = reservation.deposit;
  const handover = reservation.handover;
  const inspection = reservation.inspection;
  const refund = reservation.refund;
  const customerName =
    `${user.name || ""} ${user.lastName || ""}`.trim() || "Customer";
  const pickupExtensionPrice = Number(reservation.pickupExtensionPrice || 0);
  const returnExtensionPrice = Number(reservation.returnExtensionPrice || 0);
  const gear = reservation.selectedGear || "-";
  const rentalDays = getRentalDays(reservation);
  const addOnsTotal = (reservation.addOns || []).reduce(
    (total, item) => total + getAddOnAmount(item, rentalDays),
    0,
  );
  const depositDiscount = Number(deposit?.discountAmount || 0);
  const rentalBalance = Math.max(
    0,
    Number(reservation.totalPrice || 0) +
      depositDiscount -
      addOnsTotal -
      pickupExtensionPrice -
      returnExtensionPrice,
  );
  const assignedVehicleName =
    vehicle.title || vehicleSnapshot.title || category.name || "-";
  const assignedVehicleMake = vehicle.make || vehicleSnapshot.make || "-";
  const assignedVehicleNumber =
    vehicle.number || vehicleSnapshot.number || "-";
  const assignedVehicleColor = vehicle.color || vehicleSnapshot.color || "-";
  const assignedVehicleKey =
    vehicle.keyNumber || vehicleSnapshot.keyNumber || "-";
  const refundChargeRows = refund
    ? [
        ["Fuel charge", refund.charges?.fuel],
        ["Late return charge", refund.charges?.late],
        ["Damage charge", refund.charges?.damage],
        ["Cleaning charge", refund.charges?.cleaning],
        ["Missing equipment", refund.charges?.missingEquipment],
        [refund.otherChargeReason || "Other charge", refund.charges?.other],
        ...(refund.additionalCharges || []).map((charge) => [
          charge.reason || "Additional charge",
          charge.amount,
        ]),
      ]
        .filter(([, amount]) => Number(amount || 0) > 0)
        .map(
          ([label, amount]) =>
            `<div class="price-row"><span>${escapeHtml(
              label,
            )}</span><strong>-${formatCurrency(amount)}</strong></div>`,
        )
        .join("")
    : "";
  const statusHistoryRows = (reservation.statusHistory || [])
    .slice()
    .reverse()
    .map(
      (entry) => `<tr>
        <td>${escapeHtml(getReservationStatusLabel(entry.status, true))}</td>
        <td>${formatDateTime(entry.changedAt)}</td>
        <td>${escapeHtml(humanize(entry.source))}</td>
        <td>${escapeHtml(entry.note || "-")}</td>
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Reservation ${escapeHtml(reservation._id)}</title>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #f3f5f8;
        color: #172033;
        font-family: Arial, Helvetica, sans-serif;
      }
      .page {
        width: 820px;
        min-height: 1060px;
        margin: 28px auto;
        background: #ffffff;
        border-radius: 18px;
        overflow: hidden;
        box-shadow: 0 24px 70px rgba(15, 23, 43, 0.18);
      }
      .hero {
        background: linear-gradient(135deg, #101b34, #1d3157);
        color: white;
        padding: 34px 42px;
        display: flex;
        justify-content: space-between;
        gap: 24px;
      }
      .brand {
        font-size: 28px;
        font-weight: 900;
        letter-spacing: 0;
      }
      .brand span { color: #fe9a00; }
      .subtitle {
        margin-top: 6px;
        color: #cbd5e1;
        font-size: 13px;
      }
      .badge {
        align-self: flex-start;
        padding: 9px 14px;
        border-radius: 999px;
        background: rgba(254, 154, 0, 0.18);
        color: #ffb342;
        font-weight: 800;
        text-transform: uppercase;
        font-size: 12px;
      }
      .content { padding: 34px 42px 42px; }
      .summary {
        display: grid;
        grid-template-columns: 1.3fr 0.7fr;
        gap: 20px;
        margin-bottom: 26px;
      }
      .panel {
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 18px;
        background: #fbfdff;
      }
      .panel h2 {
        margin: 0 0 14px;
        font-size: 15px;
        color: #172033;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 14px 20px;
      }
      .label {
        font-size: 10px;
        color: #64748b;
        text-transform: uppercase;
        font-weight: 800;
        margin-bottom: 4px;
      }
      .value {
        font-size: 13px;
        font-weight: 700;
        color: #172033;
        overflow-wrap: anywhere;
      }
      .total-card {
        background: #111c34;
        color: white;
        border-radius: 14px;
        padding: 20px;
      }
      .total-card .label { color: #94a3b8; }
      .total {
        font-size: 38px;
        line-height: 1;
        font-weight: 900;
        color: #fe9a00;
        margin-top: 8px;
      }
      .section {
        margin-top: 22px;
        break-inside: avoid;
      }
      .section-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 16px;
        font-weight: 900;
        margin: 0 0 12px;
      }
      .bar {
        width: 4px;
        height: 18px;
        border-radius: 999px;
        background: #fe9a00;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        overflow: hidden;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
      }
      th, td {
        text-align: left;
        padding: 12px 14px;
        border-bottom: 1px solid #e2e8f0;
        font-size: 12px;
      }
      th {
        background: #f8fafc;
        color: #475569;
        text-transform: uppercase;
        font-size: 10px;
        font-weight: 900;
      }
      tr:last-child td { border-bottom: 0; }
      .status-note {
        margin-top: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        background: #fff7ed;
        color: #9a3412;
        font-size: 12px;
        font-weight: 700;
      }
      .price-row {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        padding: 12px 0;
        border-bottom: 1px solid #e2e8f0;
        font-size: 13px;
      }
      .price-row:last-child {
        border-bottom: 0;
        padding-bottom: 0;
      }
      .muted { color: #64748b; }
      .footer {
        margin-top: 30px;
        padding-top: 18px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        gap: 16px;
        color: #64748b;
        font-size: 11px;
      }
      @media print {
        body { background: white; }
        .page {
          width: 100%;
          min-height: auto;
          margin: 0;
          box-shadow: none;
          border-radius: 0;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <header class="hero">
        <div>
          <div class="brand">Success<span>Van</span>Hire</div>
          <div class="subtitle">Reservation receipt and hire summary</div>
        </div>
        <div class="badge">${escapeHtml(getReservationStatusLabel(reservation.status, true))}</div>
      </header>

      <section class="content">
        <div class="summary">
          <div class="panel">
            <h2>Reservation</h2>
            <div class="grid">
              <div>
                <div class="label">Order ID</div>
                <div class="value">${escapeHtml(reservation.reservationCode || reservation._id)}</div>
              </div>
              <div>
                <div class="label">Created</div>
                <div class="value">${formatDateTime(reservation.createdAt)}</div>
              </div>
              <div>
                <div class="label">Last Updated</div>
                <div class="value">${formatDateTime(reservation.updatedAt)}</div>
              </div>
              <div>
                <div class="label">Type</div>
                <div class="value">${escapeHtml(reservation.reservationType || "-")}</div>
              </div>
              <div>
                <div class="label">Driver Age</div>
                <div class="value">${escapeHtml(reservation.driverAge)}</div>
              </div>
            </div>
          </div>
          <div class="total-card">
            <div class="label">Total Price</div>
            <div class="total">${formatCurrency(reservation.totalPrice)}</div>
            <div class="subtitle">Gear: ${escapeHtml(gear)}</div>
          </div>
        </div>

        <section class="section">
          <h3 class="section-title"><span class="bar"></span>Customer</h3>
          <div class="panel">
            <div class="grid">
              <div>
                <div class="label">Name</div>
                <div class="value">${escapeHtml(customerName)}</div>
              </div>
              <div>
                <div class="label">Phone</div>
                <div class="value">${escapeHtml(user.phoneData?.phoneNumber || "-")}</div>
              </div>
              <div>
                <div class="label">Email</div>
                <div class="value">${escapeHtml(user.emaildata?.emailAddress || "-")}</div>
              </div>
              <div>
                <div class="label">Address</div>
                <div class="value">${escapeHtml(
                  [user.address, user.city, user.postalCode]
                    .filter(Boolean)
                    .join(", ") || "-",
                )}</div>
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <h3 class="section-title"><span class="bar"></span>Hire Details</h3>
          <div class="panel">
            <div class="grid">
              <div>
                <div class="label">Office</div>
                <div class="value">${escapeHtml(office.name || "-")}</div>
              </div>
              <div>
                <div class="label">Category</div>
                <div class="value">${escapeHtml(category.name || "-")}</div>
              </div>
              <div>
                <div class="label">Vehicle Make</div>
                <div class="value">${escapeHtml(assignedVehicleMake)}</div>
              </div>
              <div>
                <div class="label">Vehicle</div>
                <div class="value">${escapeHtml(assignedVehicleName)}</div>
              </div>
              <div>
                <div class="label">Duration</div>
                <div class="value">${escapeHtml(calculateDuration(reservation))}</div>
              </div>
              <div>
                <div class="label">Pickup</div>
                <div class="value">${formatDisplayDateTime(
                  reservation.startDateDisplay,
                  reservation.pickupTime,
                  reservation.startDate,
                )}</div>
              </div>
              <div>
                <div class="label">Return</div>
                <div class="value">${formatDisplayDateTime(
                  reservation.endDateDisplay,
                  reservation.returnTime,
                  reservation.endDate,
                )}</div>
              </div>
              <div>
                <div class="label">Vehicle Registration</div>
                <div class="value">${escapeHtml(assignedVehicleNumber)}</div>
              </div>
              <div>
                <div class="label">Vehicle Colour</div>
                <div class="value">${escapeHtml(assignedVehicleColor)}</div>
              </div>
              <div>
                <div class="label">Key Number</div>
                <div class="value">${escapeHtml(assignedVehicleKey)}</div>
              </div>
              <div>
                <div class="label">Collection Code</div>
                <div class="value">${escapeHtml(reservation.collectionCode || "-")}</div>
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <h3 class="section-title"><span class="bar"></span>Price Summary</h3>
          <div class="panel">
            <div class="price-row">
              <span>Rental balance <span class="muted">(base hire, hours, gear and special-day pricing)</span></span>
              <strong>${formatCurrency(rentalBalance)}</strong>
            </div>
            <div class="price-row">
              <span>Add-ons</span>
              <strong>${formatCurrency(addOnsTotal)}</strong>
            </div>
            <div class="price-row">
              <span>Pickup extension (either out of working time or weekend time)</span>
              <strong>${formatCurrency(pickupExtensionPrice)}</strong>
            </div>
            <div class="price-row">
              <span>Return extension (either out of working time or weekend time)</span>
              <strong>${formatCurrency(returnExtensionPrice)}</strong>
            </div>
            ${
              depositDiscount > 0
                ? `<div class="price-row"><span>Full-payment discount (${escapeHtml(
                    deposit?.discountPercent || 0,
                  )}%)</span><strong>-${formatCurrency(depositDiscount)}</strong></div>`
                : ""
            }
            <div class="price-row">
              <span>Total reservation price</span>
              <strong>${formatCurrency(reservation.totalPrice)}</strong>
            </div>
            ${
              reservation.manualPriceNote
                ? `<div class="price-row"><span>Admin note</span><strong>${escapeHtml(
                    reservation.manualPriceNote,
                  )}</strong></div>`
                : ""
            }
            ${
              reservation.discountCode
                ? `<div class="price-row"><span>Discount code</span><strong>${escapeHtml(
                    reservation.discountCode,
                  )}</strong></div>`
                : ""
            }
            ${
              reservation.perInvoice
                ? `<div class="price-row"><span>Pricing method</span><strong>Per invoice</strong></div>`
                : ""
            }
          </div>
        </section>

        <section class="section">
          <h3 class="section-title"><span class="bar"></span>Add-ons</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Qty</th>
                <th>Tier</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${getAddOnsRows(reservation, rentalDays)}
            </tbody>
          </table>
        </section>

        ${
          deposit
            ? `<section class="section">
                <h3 class="section-title"><span class="bar"></span>Deposit Payment</h3>
                <div class="panel">
                  <div class="grid">
                    <div><div class="label">Option</div><div class="value">${escapeHtml(
                      deposit.option
                        ? DEPOSIT_OPTION_LABELS[deposit.option]
                        : "-",
                    )}</div></div>
                    <div><div class="label">Status</div><div class="value">${escapeHtml(
                      humanize(deposit.status),
                    )}</div></div>
                    <div><div class="label">Amount</div><div class="value">${formatCurrency(
                      deposit.amount,
                    )}</div></div>
                    <div><div class="label">Original Amount</div><div class="value">${formatCurrency(
                      deposit.originalAmount,
                    )}</div></div>
                    <div><div class="label">Discount</div><div class="value">${formatCurrency(
                      deposit.discountAmount,
                    )}${
                      deposit.discountPercent
                        ? ` (${escapeHtml(deposit.discountPercent)}%)`
                        : ""
                    }</div></div>
                    <div><div class="label">Method</div><div class="value">${escapeHtml(
                      humanize(deposit.method),
                    )}</div></div>
                    <div><div class="label">Due</div><div class="value">${formatDateTime(
                      deposit.dueAt,
                    )}</div></div>
                    <div><div class="label">Paid</div><div class="value">${formatDateTime(
                      deposit.paidAt,
                    )}</div></div>
                    <div><div class="label">Transaction Reference</div><div class="value">${escapeHtml(
                      deposit.transactionRef || "-",
                    )}</div></div>
                    <div><div class="label">Receipt Uploaded</div><div class="value">${formatDateTime(
                      deposit.receiptUploadedAt,
                    )}</div></div>
                    <div><div class="label">Verified</div><div class="value">${formatDateTime(
                      deposit.verifiedAt,
                    )}</div></div>
                    <div><div class="label">Handover Deposit</div><div class="value">${formatCurrency(
                      reservation.handoverDepositAmount,
                    )}</div></div>
                  </div>
                  ${
                    deposit.failureReason
                      ? `<div class="status-note">Payment issue: ${escapeHtml(
                          deposit.failureReason,
                        )}</div>`
                      : ""
                  }
                  ${
                    deposit.priceAdjustment
                      ? `<div class="section">
                          <div class="label">Price adjustment after booking edit</div>
                          <div class="price-row"><span>Previous total</span><strong>${formatCurrency(
                            deposit.priceAdjustment.previousTotal,
                          )}</strong></div>
                          <div class="price-row"><span>Revised total</span><strong>${formatCurrency(
                            deposit.priceAdjustment.revisedTotal,
                          )}</strong></div>
                          <div class="price-row"><span>Paid amount</span><strong>${formatCurrency(
                            deposit.priceAdjustment.paidAmount,
                          )}</strong></div>
                          <div class="price-row"><span>Balance due</span><strong>${formatCurrency(
                            deposit.priceAdjustment.balanceDue,
                          )}</strong></div>
                          <div class="price-row"><span>Credit due</span><strong>${formatCurrency(
                            deposit.priceAdjustment.creditAmount,
                          )}</strong></div>
                          <div class="price-row"><span>Status</span><strong>${escapeHtml(
                            humanize(deposit.priceAdjustment.status),
                          )}</strong></div>
                        </div>`
                      : ""
                  }
                </div>
              </section>`
            : ""
        }

        ${
          hasMeaningfulData(handover)
            ? `<section class="section">
                <h3 class="section-title"><span class="bar"></span>Vehicle Handover</h3>
                <div class="panel">
                  <div class="grid">
                    <div><div class="label">Starting Mileage</div><div class="value">${escapeHtml(
                      handover?.startMileage,
                    )}</div></div>
                    <div><div class="label">Starting Fuel</div><div class="value">${escapeHtml(
                      handover?.startFuelLevel,
                    )}</div></div>
                    <div><div class="label">Keys</div><div class="value">${escapeHtml(
                      handover?.keyCount,
                    )}</div></div>
                    <div><div class="label">Staff</div><div class="value">${escapeHtml(
                      handover?.staff?.name || "-",
                    )}</div></div>
                    <div><div class="label">Completed</div><div class="value">${formatDateTime(
                      handover?.completedAt,
                    )}</div></div>
                    <div><div class="label">Equipment</div><div class="value">${escapeHtml(
                      handover?.equipment?.join(", ") || "-",
                    )}</div></div>
                    <div><div class="label">Existing Damage</div><div class="value">${escapeHtml(
                      handover?.existingDamages?.join(", ") || "None recorded",
                    )}</div></div>
                    <div><div class="label">Condition Notes</div><div class="value">${escapeHtml(
                      handover?.conditionNotes || "-",
                    )}</div></div>
                  </div>
                  ${customFieldRows(handover?.customFields)}
                </div>
              </section>`
            : ""
        }

        ${
          hasMeaningfulData(inspection)
            ? `<section class="section">
                <h3 class="section-title"><span class="bar"></span>Return Inspection</h3>
                <div class="panel">
                  <div class="grid">
                    <div><div class="label">Return Mileage</div><div class="value">${escapeHtml(
                      inspection?.returnMileage,
                    )}</div></div>
                    <div><div class="label">Return Fuel</div><div class="value">${escapeHtml(
                      inspection?.returnFuelLevel,
                    )}</div></div>
                    <div><div class="label">Late Return</div><div class="value">${
                      inspection?.lateReturn ? "Yes" : "No"
                    }${
                      inspection?.lateMinutes
                        ? ` (${escapeHtml(inspection.lateMinutes)} minutes)`
                        : ""
                    }</div></div>
                    <div><div class="label">Cleaning Issue</div><div class="value">${
                      inspection?.cleaningIssue ? "Yes" : "No"
                    }</div></div>
                    <div><div class="label">New Damage</div><div class="value">${escapeHtml(
                      inspection?.newDamages?.join(", ") || "None recorded",
                    )}</div></div>
                    <div><div class="label">Missing Equipment</div><div class="value">${escapeHtml(
                      inspection?.missingEquipment?.join(", ") || "None recorded",
                    )}</div></div>
                    <div><div class="label">Staff</div><div class="value">${escapeHtml(
                      inspection?.staff?.name || "-",
                    )}</div></div>
                    <div><div class="label">Completed</div><div class="value">${formatDateTime(
                      inspection?.completedAt,
                    )}</div></div>
                  </div>
                  ${
                    inspection?.notes
                      ? `<div class="status-note">Inspection notes: ${escapeHtml(
                          inspection.notes,
                        )}</div>`
                      : ""
                  }
                  ${customFieldRows(inspection?.customFields)}
                </div>
              </section>`
            : ""
        }

        ${
          hasMeaningfulData(refund)
            ? `<section class="section">
                <h3 class="section-title"><span class="bar"></span>Refund Summary</h3>
                <div class="panel">
                  <div class="price-row"><span>Deposit paid</span><strong>${formatCurrency(
                    refund?.depositPaid,
                  )}</strong></div>
                  ${refundChargeRows || '<div class="price-row"><span>Deductions</span><strong>£0.00</strong></div>'}
                  <div class="price-row"><span>Total deductions</span><strong>-${formatCurrency(
                    refund?.deductionsTotal,
                  )}</strong></div>
                  <div class="price-row"><span>Refund amount</span><strong>${formatCurrency(
                    refund?.refundAmount,
                  )}</strong></div>
                  <div class="price-row"><span>Status</span><strong>${escapeHtml(
                    humanize(refund?.status),
                  )}</strong></div>
                  <div class="price-row"><span>Authorization number</span><strong>${escapeHtml(
                    refund?.reference || "-",
                  )}</strong></div>
                  <div class="price-row"><span>Expected by</span><strong>${formatDateTime(
                    refund?.expectedBy,
                  )}</strong></div>
                  <div class="price-row"><span>Processed</span><strong>${formatDateTime(
                    refund?.processedAt,
                  )}</strong></div>
                </div>
              </section>`
            : ""
        }

        ${
          statusHistoryRows
            ? `<section class="section">
                <h3 class="section-title"><span class="bar"></span>Activity Timeline</h3>
                <table>
                  <thead><tr><th>Status</th><th>Date</th><th>Changed by</th><th>Note</th></tr></thead>
                  <tbody>${statusHistoryRows}</tbody>
                </table>
              </section>`
            : ""
        }

        ${
          reservation.cancelReason
            ? `<section class="section">
                <h3 class="section-title"><span class="bar"></span>Cancellation</h3>
                <div class="status-note">${escapeHtml(
                  reservation.cancelReason,
                )}</div>
              </section>`
            : ""
        }

        ${
          reservation.messege
            ? `<section class="section">
                <h3 class="section-title"><span class="bar"></span>Message</h3>
                <div class="panel muted">${escapeHtml(reservation.messege)}</div>
              </section>`
            : ""
        }

        <footer class="footer">
          <span>Success Van Hire</span>
          <span>Generated ${formatDateTime(new Date())}</span>
        </footer>
      </section>
    </main>
  </body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return;
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  let printed = false;

  const doPrint = () => {
    if (printed) return;
    printed = true;
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 100);
  };

  iframe.onload = doPrint;
  setTimeout(doPrint, 500);
}
