import "server-only";

import { sha256Hex } from "./hash";

export type ContractPdfReservation = {
  _id?: unknown;
  user?: {
    name?: string;
    lastName?: string;
    emaildata?: { emailAddress?: string };
    phoneData?: { phoneNumber?: string };
    address?: string;
    postalCode?: string;
    city?: string;
    licenceDetails?: {
      isFrontSide?: boolean;
      sourceSide?: "front" | "back" | "unknown";
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
  };
  office?: { name?: string; address?: string; phone?: string };
  category?: {
    name?: string;
    fuel?: string;
    requiredLicense?: string;
    seats?: number;
    doors?: number;
  };
  vehicle?: {
    title?: string;
    number?: string | number;
    color?: string;
    colour?: string;
    properties?: Array<{ name?: string; key?: string; value?: string }>;
  };
  addOns?: Array<{
    addOn?: { name?: string; pricingType?: string };
    quantity?: number;
    selectedTierIndex?: number;
  }>;
  startDate?: string | Date;
  endDate?: string | Date;
  startDateDisplay?: string;
  endDateDisplay?: string;
  pickupTime?: string;
  returnTime?: string;
  totalPrice?: number;
  reservationCode?: string;
  deposit?: {
    amount?: number;
    option?: string;
    status?: string;
    paidAt?: string | Date;
    transactionRef?: string;
  };
  status?: string;
  driverAge?: number;
  selectedGear?: string;
  pickupExtensionPrice?: number;
  returnExtensionPrice?: number;
  discountCode?: string;
  isManualPrice?: boolean;
  manualPricePerDay?: number;
  manualPriceNote?: string;
  reservationType?: string;
  createdAt?: string | Date;
};

export type ContractPdfInput = {
  contractNumber: string;
  createdAt: Date;
  reservation: ContractPdfReservation;
};

const signatureAnchor = "/svh_customer_signature/";
const nameAnchor = "/svh_customer_name/";
const dateAnchor = "/svh_signed_date/";

function valueOrDash(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function formatDate(value?: string | Date, displayValue?: string) {
  if (displayValue) return displayValue;
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string | Date) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value?: number) {
  return `GBP ${Number(value || 0).toFixed(2)}`;
}

function customerName(reservation: ContractPdfReservation) {
  return (
    (reservation.user?.licenceDetails?.isFrontSide
      ? reservation.user.licenceDetails.fullName
      : undefined) ||
    `${reservation.user?.name || ""} ${reservation.user?.lastName || ""}`.trim()
  );
}

function vehicleProperty(
  reservation: ContractPdfReservation,
  names: string[],
) {
  const properties = reservation.vehicle?.properties || [];
  const match = properties.find((property) => {
    const label = `${property.name || property.key || ""}`.toLowerCase();
    return names.some((name) => label.includes(name));
  });
  return match?.value;
}

const leftMargin = 48;
const valueColumnX = 218;

function addSection(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(1);
  doc
    .fontSize(13)
    .fillColor("#111827")
    .font("Helvetica-Bold")
    .text(title, leftMargin);
  doc.moveDown(0.3);
  doc
    .moveTo(leftMargin, doc.y)
    .lineTo(540, doc.y)
    .strokeColor("#fe9a00")
    .lineWidth(1)
    .stroke();
  doc.moveDown(0.6);
}

function addRows(doc: PDFKit.PDFDocument, rows: Array<[string, unknown]>) {
  rows.forEach(([label, value]) => {
    // Two fixed columns: label on the left, value starting at valueColumnX.
    const rowY = doc.y;
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#4b5563")
      .text(label, leftMargin, rowY + 1.5, { width: valueColumnX - leftMargin - 10 });
    const labelBottom = doc.y;
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#111827")
      .text(valueOrDash(value), valueColumnX, rowY, { width: 540 - valueColumnX });
    doc.y = Math.max(labelBottom, doc.y);
    doc.x = leftMargin;
    doc.moveDown(0.35);
  });
}

function ensureSpace(doc: PDFKit.PDFDocument, needed = 120) {
  if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
}

export async function generateRentalAgreementPdf(input: ContractPdfInput) {
  // Runtime require so Turbopack never statically analyzes pdfkit's
  // internal dynamic font requires (which cause "expression is too dynamic").
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PDFDocument = require("pdfkit") as typeof import("pdfkit");
  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    info: {
      Title: `Success Van Hire Rental Agreement ${input.contractNumber}`,
      Author: "Success Van Hire",
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));

  const bufferPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const reservation = input.reservation;
  const name = customerName(reservation) || "Customer";
  const licence = reservation.user?.licenceDetails?.isFrontSide
    ? reservation.user.licenceDetails
    : undefined;
  const bookingReference = valueOrDash(
    reservation.reservationCode || reservation._id,
  );
  const address = [
    reservation.user?.address,
    reservation.user?.city,
    reservation.user?.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  doc.rect(0, 0, doc.page.width, 105).fill("#0f172b");
  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(24)
    .text("VEHICLE HIRE AGREEMENT", 48, 34);
  doc
    .fillColor("#fe9a00")
    .fontSize(13)
    .text("Success Van Hire", 48, 67);
  doc
    .fillColor("#ffffff")
    .fontSize(10)
    .text(`Contract: ${input.contractNumber}`, 350, 42, { align: "right" })
    .text(`Created: ${formatDateTime(input.createdAt)}`, 350, 58, {
      align: "right",
    });

  // Reset the write position under the header banner (the banner text left
  // doc.x at the right-hand column).
  doc.x = leftMargin;
  doc.y = 130;
  addSection(doc, "Agreement Reference");
  addRows(doc, [
    ["Ref", input.contractNumber],
    ["Date", formatDateTime(input.createdAt)],
    ["Booking reference", bookingReference],
    ["From", "Success Van Hire"],
  ]);

  ensureSpace(doc);
  addSection(doc, "Hirer Details");
  addRows(doc, [
    ["Hirer name", name],
    ["Email", reservation.user?.emaildata?.emailAddress],
    ["Mobile", reservation.user?.phoneData?.phoneNumber],
    ["Address", licence?.address || address || "-"],
    ["Postcode", licence?.postcode || reservation.user?.postalCode],
    ["Driving licence number", licence?.licenceNumber || licence?.licenseNumber],
    ["Exp date", licence?.expiryDate || licence?.expirationDate],
    ["DOB", licence?.dateOfBirth],
    ["Issuing authority", licence?.issuingAuthority],
    ["Licence categories", licence?.licenceCategories?.join(", ")],
  ]);

  ensureSpace(doc);
  addSection(doc, "Additional Driver");
  addRows(doc, [
    ["Name", "-"],
    ["Licence number", "-"],
    ["DOB", "-"],
  ]);

  ensureSpace(doc);
  addSection(doc, "Vehicle");
  addRows(doc, [
    ["Register", reservation.vehicle?.number],
    ["Make", vehicleProperty(reservation, ["make"]) || reservation.category?.name],
    ["Model", reservation.vehicle?.title || reservation.category?.name],
    [
      "Colour",
      reservation.vehicle?.color ||
        reservation.vehicle?.colour ||
        vehicleProperty(reservation, ["colour", "color"]),
    ],
    ["Transmission", reservation.selectedGear],
    ["Fuel", reservation.category?.fuel],
    ["Required licence", reservation.category?.requiredLicense],
  ]);

  ensureSpace(doc);
  addSection(doc, "Rental Term");
  addRows(doc, [
    ["Rental start date", formatDate(reservation.startDate, reservation.startDateDisplay)],
    ["Rental start time", reservation.pickupTime || formatDateTime(reservation.startDate)],
    ["Rental end date", formatDate(reservation.endDate, reservation.endDateDisplay)],
    ["Rental end time", reservation.returnTime || formatDateTime(reservation.endDate)],
    ["Reservation status", reservation.status],
    ["Pickup location", reservation.office?.name],
    ["Pickup address", reservation.office?.address],
  ]);

  ensureSpace(doc);
  addSection(doc, "Rental Fee");
  addRows(doc, [
    ["Subscription price", formatCurrency(reservation.totalPrice)],
    ["Deposit", formatCurrency(reservation.deposit?.amount)],
    ["Deposit option", reservation.deposit?.option],
    ["Deposit status", reservation.deposit?.status],
    ["Deposit transaction ref", reservation.deposit?.transactionRef],
    ["Pickup extension", formatCurrency(reservation.pickupExtensionPrice)],
    ["Return extension", formatCurrency(reservation.returnExtensionPrice)],
    ["Discount code", reservation.discountCode],
  ]);

  ensureSpace(doc);
  addSection(doc, "Mileage & Insurance");
  addRows(doc, [
    ["Weekly mileage", "-"],
    ["Daily mileage", "-"],
    ["Excess mileage charge", "-"],
    ["Arranged insurance", "Subject to Success Van Hire approval and policy terms"],
    ["Insurance excess cost", "-"],
  ]);

  const addOns = reservation.addOns || [];
  if (addOns.length) {
    ensureSpace(doc);
    addSection(doc, "Selected Add-ons");
    addOns.forEach((item) => {
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#111827")
        .text(
          `${item.addOn?.name || "Add-on"} - quantity ${item.quantity || 1}${
            item.selectedTierIndex !== undefined
              ? `, tier ${item.selectedTierIndex + 1}`
              : ""
          }`,
        );
      doc.moveDown(0.25);
    });
  }

  ensureSpace(doc, 220);
  addSection(doc, "Declaration");
  const terms = [
    "The customer confirms the booking information above is accurate and must present a valid driving licence and any required identity checks before collection.",
    "The vehicle must be returned at the agreed date, time, location, fuel level, and condition unless Success Van Hire agrees otherwise in writing.",
    "The customer is responsible for traffic, parking, toll, congestion, penalty, damage, excess, key, fuel, and late-return charges that apply during the hire period.",
    "Insurance, deposit, cancellation, mileage, and damage terms are governed by the Success Van Hire reservation terms and conditions supplied to the customer.",
    "Signing this agreement does not replace required payment, deposit, licence, identity, or operational approval checks.",
  ];
  doc.font("Helvetica").fontSize(10).fillColor("#111827");
  terms.forEach((term) => {
    doc.text(`- ${term}`, { indent: 12 });
    doc.moveDown(0.4);
  });

  ensureSpace(doc, 170);
  addSection(doc, "Customer Signature");
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#111827")
    .text("Please review the agreement and sign through DocuSign.");
  doc.moveDown(1.2);
  doc.text("Customer signature:");
  doc.moveDown(0.2);
  doc
    .moveTo(48, doc.y + 18)
    .lineTo(300, doc.y + 18)
    .strokeColor("#111827")
    .lineWidth(0.5)
    .stroke();
  doc
    .fontSize(6)
    .fillColor("#ffffff")
    .text(signatureAnchor, 52, doc.y + 4);
  doc.moveDown(2);
  doc.fillColor("#111827").fontSize(10).text("Customer name:");
  doc
    .fontSize(6)
    .fillColor("#ffffff")
    .text(nameAnchor, 52, doc.y + 2);
  doc.moveDown(1.8);
  doc.fillColor("#111827").fontSize(10).text("Date signed:");
  doc
    .fontSize(6)
    .fillColor("#ffffff")
    .text(dateAnchor, 52, doc.y + 2);

  doc.end();

  const buffer = await bufferPromise;
  return {
    buffer,
    sha256: sha256Hex(buffer),
    fileName: `${input.contractNumber}-source-agreement.pdf`,
    mimeType: "application/pdf",
  };
}

export const contractPdfAnchors = {
  signatureAnchor,
  nameAnchor,
  dateAnchor,
};
