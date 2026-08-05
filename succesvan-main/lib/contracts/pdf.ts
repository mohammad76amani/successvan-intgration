import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

function customerName(reservation: ContractPdfReservation) {
  const licenceName =
    reservation.user?.licenceDetails?.isFrontSide
      ? (
          reservation.user.licenceDetails.fullName ||
          [
            reservation.user.licenceDetails.firstName,
            reservation.user.licenceDetails.lastName,
          ]
            .filter(Boolean)
            .join(" ")
        ).trim()
      : "";

  return (
    licenceName ||
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

const templatePath = path.join(
  process.cwd(),
  "public",
  "contracts",
  "successvan-vehicle-hire-agreement-template.pdf",
);

function contractDate(value?: string | Date, displayValue?: string) {
  const source = displayValue || value;
  if (!source) return "-";
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return valueOrDash(source);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function rentalHours(reservation: ContractPdfReservation) {
  const start = reservation.startDate ? new Date(reservation.startDate) : null;
  const end = reservation.endDate ? new Date(reservation.endDate) : null;
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { days: "-", hours: "-" };
  }
  const totalHours = Math.max(0, (end.getTime() - start.getTime()) / 3_600_000);
  return {
    days: Math.floor(totalHours / 24),
    hours: Math.round(totalHours % 24),
  };
}

export async function generateRentalAgreementPdf(input: ContractPdfInput) {
  const template = await readFile(templatePath);
  const doc = await PDFDocument.load(template);
  doc.setTitle(`Success Van Hire Rental Agreement ${input.contractNumber}`);
  doc.setAuthor("Success Van Hire");
  doc.setCreationDate(input.createdAt);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const reservation = input.reservation;
  const name = customerName(reservation) || "Customer";
  const licence = reservation.user?.licenceDetails?.isFrontSide
    ? reservation.user.licenceDetails
    : undefined;
  const address = [
    reservation.user?.address,
    reservation.user?.city,
    reservation.user?.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
  const term = rentalHours(reservation);
  const insuranceExcess = vehicleProperty(reservation, [
    "insurance excess",
    "excess cost",
  ]);
  const insuranceExcessLabel = insuranceExcess
    ? /^[£$€]/.test(insuranceExcess)
      ? insuranceExcess
      : `£${insuranceExcess}`
    : "-";
  const page = doc.getPage(0);
  const page2 = doc.getPage(1);
  const page3 = doc.getPage(2);
  const ink = rgb(0.04, 0.04, 0.04);
  const white = rgb(1, 1, 1);
  const topY = (targetPage: typeof page, top: number, size = 7) =>
    targetPage.getHeight() - top - size;
  const cover = (
    targetPage: typeof page,
    x: number,
    top: number,
    width: number,
    height: number,
  ) =>
    targetPage.drawRectangle({
      x,
      y: targetPage.getHeight() - top - height,
      width,
      height,
      color: white,
    });
  const text = (
    targetPage: typeof page,
    value: unknown,
    x: number,
    top: number,
    width: number,
    options?: { bold?: boolean; size?: number },
  ) => {
    const size = options?.size ?? 7;
    targetPage.drawText(valueOrDash(value), {
      x,
      y: topY(targetPage, top, size),
      size,
      font: options?.bold ? boldFont : font,
      color: ink,
      maxWidth: width,
    });
  };
  const fitTextSize = (value: unknown, width: number, preferred = 6.4) => {
    const label = valueOrDash(value);
    let size = preferred;
    while (size > 4.2 && font.widthOfTextAtSize(label, size) > width) {
      size -= 0.2;
    }
    return size;
  };
  const cellText = (
    targetPage: typeof page,
    value: unknown,
    x: number,
    top: number,
    width: number,
    height = 10.8,
    preferredSize = 6.4,
  ) => {
    cover(targetPage, x + 0.8, top + 0.8, width - 1.6, height - 1.6);
    const size = fitTextSize(value, width - 8, preferredSize);
    text(targetPage, value, x + 4, top + 2, width - 8, { size });
  };
  const money = (value: unknown) => `£${Number(value || 0).toFixed(2)}`;
  const durationLabel = [
    `${term.days} day${term.days === 1 ? "" : "s"}`,
    Number(term.hours) > 0 ? `${term.hours} hour${term.hours === 1 ? "" : "s"}` : "",
  ]
    .filter(Boolean)
    .join(", ");
  const extensionTotal =
    Number(reservation.pickupExtensionPrice || 0) +
    Number(reservation.returnExtensionPrice || 0);
  const depositPaymentMethod =
    reservation.deposit?.option === "full"
      ? "Full deposit - bank transfer"
      : reservation.deposit?.option === "secure"
        ? "Safe & secure deposit"
        : reservation.deposit?.option === "office"
          ? "Pay at office"
          : "-";

  // Agreement references.
  cellText(page, input.contractNumber, 172.8, 124, 133.2, 10.4);
  cellText(page, contractDate(input.createdAt), 439.2, 124, 133.2, 10.4);
  cellText(page, reservation.reservationCode, 172.8, 134.4, 133.2, 10.2);
  cellText(page, reservation.office?.name, 439.2, 134.4, 133.2, 10.2);

  // Hirer / driver details.
  cellText(page, name.toUpperCase(), 167.4, 206, 133.2);
  cellText(page, "-", 433.8, 206, 133.2);
  cellText(page, licence?.address || address, 167.4, 217, 133.2);
  cellText(page, licence?.postcode || reservation.user?.postalCode, 433.8, 217, 133.2);
  cellText(page, licence?.licenceNumber || licence?.licenseNumber, 167.4, 227.8, 133.2);
  cellText(page, licence?.issuingCountry || licence?.issuingAuthority, 433.8, 227.8, 133.2);
  cellText(
    page,
    contractDate(licence?.expiryDate || licence?.expirationDate || undefined),
    167.4,
    238.6,
    133.2,
  );
  cellText(page, contractDate(licence?.dateOfBirth || undefined), 433.8, 238.6, 133.2);
  cellText(page, reservation.user?.emaildata?.emailAddress, 167.4, 249.5, 133.2);
  cellText(page, reservation.user?.phoneData?.phoneNumber, 433.8, 249.5, 133.2);
  cellText(page, "-", 167.4, 260.4, 133.2);
  cellText(page, "-", 433.8, 260.4, 133.2);

  // Vehicle details.
  cellText(page, reservation.vehicle?.number, 167.4, 290.9, 133.2);
  cellText(
    page,
    vehicleProperty(reservation, ["make"]) || reservation.category?.name,
    433.8,
    290.9,
    133.2,
  );
  cellText(page, reservation.vehicle?.title || reservation.category?.name, 167.4, 301.8, 133.2);
  cellText(
    page,
    reservation.vehicle?.color ||
      reservation.vehicle?.colour ||
      vehicleProperty(reservation, ["colour", "color"]),
    433.8,
    301.8,
    133.2,
  );
  cellText(page, reservation.category?.name, 167.4, 312.6, 133.2);
  cellText(page, "-", 433.8, 312.6, 133.2);

  // Rental term.
  cellText(page, contractDate(reservation.startDate, reservation.startDateDisplay), 167.4, 343.1, 133.2);
  cellText(page, reservation.pickupTime || formatDateTime(reservation.startDate), 433.8, 343.1, 133.2);
  cellText(page, contractDate(reservation.endDate, reservation.endDateDisplay), 167.4, 353.9, 133.2);
  cellText(page, reservation.returnTime || formatDateTime(reservation.endDate), 433.8, 353.9, 133.2);
  cellText(page, durationLabel, 167.4, 364.9, 133.2);
  cellText(page, extensionTotal > 0 ? money(extensionTotal) : "None", 433.8, 364.9, 133.2);

  // Rental fee, deposit and payment details.
  cellText(page, money(reservation.totalPrice), 167.4, 425.1, 133.2);
  cellText(page, money(reservation.deposit?.amount), 433.8, 425.1, 133.2);
  cellText(page, depositPaymentMethod, 167.4, 436.1, 133.2, 21.1);
  cellText(page, extensionTotal > 0 ? money(extensionTotal) : money(0), 167.4, 457.2, 133.2);
  cellText(page, money(0), 433.8, 457.2, 133.2);

  // Insurance details.
  cellText(page, "Subject to approval", 167.4, 584, 133.2, 10.4);
  cellText(page, insuranceExcessLabel, 433.8, 584, 133.2, 10.4);
  cellText(page, "-", 167.4, 594.4, 133.2, 10.2);
  cellText(page, "-", 433.8, 594.4, 133.2, 10.2);
  cellText(page, "-", 167.4, 604.6, 133.2, 10.9);
  cellText(page, "See applicable policy", 433.8, 604.6, 133.2, 10.9);

  // Pre-fill the hirer's name in the first acknowledgement table on page 3.
  cellText(page3, name.toUpperCase(), 167.4, 78.4, 133.2);

  // Invisible DocuSign anchors sit in the final General Declaration table.
  page3.drawText(signatureAnchor, {
    x: 171,
    y: topY(page3, 178, 1),
    size: 1,
    font,
    color: white,
  });
  page3.drawText(nameAnchor, {
    x: 437,
    y: topY(page3, 178, 1),
    size: 1,
    font,
    color: white,
  });
  page3.drawText(dateAnchor, {
    x: 171,
    y: topY(page3, 189, 1),
    size: 1,
    font,
    color: white,
  });

  [page, page2, page3].forEach((targetPage, index) => {
    text(targetPage, `${index + 1}/3`, 553, 775, 25, { size: 6 });
  });

  const buffer = Buffer.from(await doc.save());
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
