import { Reservation } from "@/types/type";

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

const statusLabel = (status?: string) =>
  status === "delivered" ? "collected" : status || "-";

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
  const days = Math.max(1, Math.ceil(totalHours / 24));
  return `${days} day${days === 1 ? "" : "s"} / ${totalHours} hour${
    totalHours === 1 ? "" : "s"
  }`;
};

const getAddOnsRows = (reservation: Reservation) => {
  const addOns = reservation.addOns || [];
  if (!addOns.length) {
    return `<tr><td colspan="3" class="muted">No add-ons selected</td></tr>`;
  }

  return addOns
    .map((item: any) => {
      const addOn = item.addOn || {};
      return `
        <tr>
          <td>${escapeHtml(addOn.name || "Add-on")}</td>
          <td>${escapeHtml(item.quantity || 1)}</td>
          <td>${escapeHtml(
            item.selectedTierIndex !== undefined
              ? `Tier ${Number(item.selectedTierIndex) + 1}`
              : "-",
          )}</td>
        </tr>
      `;
    })
    .join("");
};

export function downloadReservationReceiptPng(reservation: Reservation | null) {
  if (!reservation || typeof window === "undefined") return;
  printReservationReceipt(reservation);
}

export function printReservationReceipt(reservation: Reservation | null) {
  if (!reservation || typeof window === "undefined") return;

  const user = (reservation.user || {}) as any;
  const office = (reservation.office || {}) as any;
  const category = (reservation.category || {}) as any;
  const vehicle = (reservation.vehicle || {}) as any;
  const customerName =
    `${user.name || ""} ${user.lastName || ""}`.trim() || "Customer";
  const pickupExtensionPrice = Number(
    (reservation as any).pickupExtensionPrice || 0,
  );
  const returnExtensionPrice = Number(
    (reservation as any).returnExtensionPrice || 0,
  );
  const gear = (reservation as any).selectedGear || "-";

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
        <div class="badge">${escapeHtml(statusLabel(reservation.status))}</div>
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
                <div class="label">Type</div>
                <div class="value">${escapeHtml((reservation as any).reservationType || "-")}</div>
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
                <div class="label">Vehicle</div>
                <div class="value">${escapeHtml(vehicle.title || vehicle.number || "-")}</div>
              </div>
              <div>
                <div class="label">Duration</div>
                <div class="value">${escapeHtml(calculateDuration(reservation))}</div>
              </div>
              <div>
                <div class="label">Pickup</div>
                <div class="value">${formatDateTime(reservation.startDate)}</div>
              </div>
              <div>
                <div class="label">Return</div>
                <div class="value">${formatDateTime(reservation.endDate)}</div>
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <h3 class="section-title"><span class="bar"></span>Price Summary</h3>
          <div class="panel">
            <div class="price-row">
              <span>Pickup extension (either out of working time or weekend time)</span>
              <strong>${formatCurrency(pickupExtensionPrice)}</strong>
            </div>
            <div class="price-row">
              <span>Return extension (either out of working time or weekend time)</span>
              <strong>${formatCurrency(returnExtensionPrice)}</strong>
            </div>
            <div class="price-row">
              <span>Total reservation price</span>
              <strong>${formatCurrency(reservation.totalPrice)}</strong>
            </div>
            ${
              (reservation as any).manualPriceNote
                ? `<div class="price-row"><span>Admin note</span><strong>${escapeHtml(
                    (reservation as any).manualPriceNote,
                  )}</strong></div>`
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
              </tr>
            </thead>
            <tbody>
              ${getAddOnsRows(reservation)}
            </tbody>
          </table>
        </section>

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
