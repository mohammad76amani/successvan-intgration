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
    brand?: string;
    color?: string;
    colour?: string;
    properties?: Array<{ name?: string; key?: string; value?: string }>;
  };
  vehicleSnapshot?: {
    title?: string;
    number?: string | number;
    color?: string;
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
  handoverDepositAmount?: number;
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
  const italicFont = await doc.embedFont(StandardFonts.HelveticaOblique);
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
  const centeredCellText = (
    targetPage: typeof page,
    value: unknown,
    x: number,
    top: number,
    width: number,
    height: number,
    preferredSize = 7,
  ) => {
    cover(targetPage, x + 0.8, top + 0.8, width - 1.6, height - 1.6);
    const size = fitTextSize(value, width - 8, preferredSize);
    text(
      targetPage,
      value,
      x + 4,
      top + Math.max(2, (height - size) / 2 - 0.5),
      width - 8,
      { size },
    );
  };
  const drawGrid = (
    targetPage: typeof page,
    xPositions: number[],
    top: number,
    rowHeights: number[],
  ) => {
    const bottom = top + rowHeights.reduce((sum, height) => sum + height, 0);
    const y = (topPosition: number) => targetPage.getHeight() - topPosition;
    xPositions.forEach((x) => {
      targetPage.drawLine({
        start: { x, y: y(top) },
        end: { x, y: y(bottom) },
        thickness: 0.65,
        color: ink,
      });
    });
    let rowTop = top;
    [top, ...rowHeights.map((height) => (rowTop += height))].forEach(
      (lineTop) => {
        targetPage.drawLine({
          start: { x: xPositions[0], y: y(lineTop) },
          end: { x: xPositions[xPositions.length - 1], y: y(lineTop) },
          thickness: 0.65,
          color: ink,
        });
      },
    );
  };
  const centeredText = (
    targetPage: typeof page,
    value: string,
    top: number,
    options?: { bold?: boolean; italic?: boolean; size?: number },
  ) => {
    const size = options?.size ?? 8;
    const selectedFont = options?.bold
      ? boldFont
      : options?.italic
        ? italicFont
        : font;
    const width = selectedFont.widthOfTextAtSize(value, size);
    targetPage.drawText(value, {
      x: Math.max(34, (targetPage.getWidth() - width) / 2),
      y: topY(targetPage, top, size),
      size,
      font: selectedFont,
      color: ink,
    });
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
  const additionalDriverIncluded = (reservation.addOns || []).some((item) =>
    String(item.addOn?.name || "")
      .toLowerCase()
      .includes("additional driver"),
  );

  // Agreement references.
  cellText(page, input.contractNumber, 172.8, 124, 133.2, 10.4);
  cellText(page, contractDate(input.createdAt), 439.2, 124, 133.2, 10.4);
  cellText(page, reservation.reservationCode, 172.8, 134.4, 133.2, 10.2);
  cellText(page, reservation.office?.name, 439.2, 134.4, 133.2, 10.2);

  // Hirer / driver details.
  cellText(page, name.toUpperCase(), 167.4, 206, 133.2);
  cellText(page, "Not provided", 433.8, 206, 133.2);
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
  cellText(page, additionalDriverIncluded ? "Included" : "None", 167.4, 260.4, 133.2);
  cellText(page, additionalDriverIncluded ? "Not provided" : "Not applicable", 433.8, 260.4, 133.2);

  // Vehicle details.
  cellText(
    page,
    reservation.vehicle?.number || reservation.vehicleSnapshot?.number,
    167.4,
    290.9,
    133.2,
  );
  cellText(
    page,
    reservation.vehicle?.brand ||
      vehicleProperty(reservation, ["make", "brand"]) ||
      "Not provided",
    433.8,
    290.9,
    133.2,
  );
  cellText(
    page,
    reservation.vehicle?.title ||
      reservation.vehicleSnapshot?.title ||
      reservation.category?.name,
    167.4,
    301.8,
    133.2,
  );
  cellText(
    page,
    reservation.vehicle?.color ||
      reservation.vehicle?.colour ||
      reservation.vehicleSnapshot?.color ||
      vehicleProperty(reservation, ["colour", "color"]) ||
      "Not provided",
    433.8,
    301.8,
    133.2,
  );
  cellText(page, reservation.category?.name, 167.4, 312.6, 133.2);
  cellText(page, "None", 433.8, 312.6, 133.2);

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
  cellText(page, money(reservation.handoverDepositAmount), 433.8, 457.2, 133.2);

  // Insurance details.
  cellText(page, "Subject to approval", 167.4, 584, 133.2, 10.4);
  cellText(
    page,
    insuranceExcessLabel === "-" ? "See applicable policy" : insuranceExcessLabel,
    433.8,
    584,
    133.2,
    10.4,
  );
  cellText(page, "See applicable policy", 167.4, 594.4, 133.2, 10.2);
  cellText(page, "See applicable policy", 433.8, 594.4, 133.2, 10.2);
  cellText(page, "See applicable policy", 167.4, 604.6, 133.2, 10.9);
  cellText(page, "See applicable policy", 433.8, 604.6, 133.2, 10.9);

  // Page 3 has ample space, so rebuild both signing blocks with proper room
  // for DocuSign's handwritten signature stamp instead of one-line rows.
  cover(page3, 30, 72, 552, 320);
  const signatureColumns = [34.2, 167.4, 300.6, 433.8, 567];
  const firstSignatureTop = 76;
  const firstSignatureRows = [18, 34, 18];
  drawGrid(page3, signatureColumns, firstSignatureTop, firstSignatureRows);
  centeredCellText(page3, "Hirer's Full Name:", 34.2, 76, 133.2, 18, 8);
  centeredCellText(page3, name.toUpperCase(), 167.4, 76, 133.2, 18);
  centeredCellText(page3, "Date:", 300.6, 76, 133.2, 18, 8);
  centeredCellText(page3, "Hirer's Signature:", 34.2, 94, 133.2, 34, 8);
  centeredCellText(page3, "Time:", 300.6, 94, 133.2, 34, 8);
  centeredCellText(
    page3,
    "Recorded in DocuSign audit",
    433.8,
    94,
    133.2,
    34,
  );
  centeredCellText(page3, "Lessor Signature:", 34.2, 128, 133.2, 18, 8);
  centeredCellText(page3, "Lessor Name:", 300.6, 128, 133.2, 18, 8);
  centeredCellText(page3, "SUCCESS VAN HIRE", 433.8, 128, 133.2, 18);

  text(page3, "9. GENERAL DECLARATION", 39.7, 158, 530, {
    bold: true,
    size: 10,
  });
  page3.drawText(
    "The Hirer confirms that the information supplied in connection with this hire is, to the best of their knowledge, true and complete. The Hirer confirms that they have read and understood this agreement, including the insurance terms, authorised-driver declaration and Liability Statement, and agree to be bound by its terms.",
    {
      x: 39.7,
      y: topY(page3, 176, 9),
      size: 9,
      lineHeight: 12,
      font,
      color: ink,
      maxWidth: 527,
    },
  );

  const finalSignatureTop = 226;
  const finalSignatureRows = [38, 18, 24];
  drawGrid(page3, signatureColumns, finalSignatureTop, finalSignatureRows);
  centeredCellText(page3, "Hirer Signature:", 34.2, 226, 133.2, 38, 8);
  centeredCellText(page3, "Print Name:", 300.6, 226, 133.2, 38, 8);
  centeredCellText(page3, name.toUpperCase(), 433.8, 226, 133.2, 38);
  centeredCellText(page3, "Date:", 34.2, 264, 133.2, 18, 8);
  centeredCellText(page3, "Time:", 300.6, 264, 133.2, 18, 8);
  centeredCellText(
    page3,
    "Recorded in DocuSign audit",
    433.8,
    264,
    133.2,
    18,
  );
  centeredCellText(page3, "Lessor Signature:", 34.2, 282, 133.2, 24, 8);
  centeredCellText(page3, "Print Name:", 300.6, 282, 133.2, 24, 8);
  centeredCellText(page3, "SUCCESS VAN HIRE", 433.8, 282, 133.2, 24);

  centeredText(
    page3,
    "Vehicle & Correspondence Address: Flat 20, Garrison Heights, London, NW7 1RF",
    322,
    { bold: true, size: 8 },
  );
  centeredText(
    page3,
    "Address used for vehicle registration and vehicle-related correspondence.",
    335,
    { italic: true, size: 7.5 },
  );
  centeredText(
    page3,
    "DIBA COOPERATION LTD trading as SUCCESS VAN HIRE",
    352,
    { bold: true, size: 9 },
  );
  centeredText(
    page3,
    "Please retain a copy of this agreement for your records.",
    367,
    { size: 8.5 },
  );

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
