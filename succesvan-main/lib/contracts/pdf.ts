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
  const ink = rgb(0.04, 0.04, 0.04);
  const white = rgb(1, 1, 1);
  const topY = (targetPage: typeof page, top: number, size = 7) =>
    targetPage.getHeight() - top - size;
  const put = (
    targetPage: typeof page,
    value: unknown,
    x: number,
    top: number,
    width = 120,
    size = 7,
  ) => {
    targetPage.drawRectangle({
      x: x - 7,
      y: topY(targetPage, top, size) - 5,
      // The supplied template contains short Excel placeholders (#N/A / "-").
      // Clear only that placeholder area so neighbouring printed labels remain.
      width: Math.min(width + 5, 44),
      height: size + 12,
      color: white,
    });
    targetPage.drawText(valueOrDash(value), {
      x,
      y: topY(targetPage, top, size),
      size,
      font,
      color: ink,
      maxWidth: width - 4,
    });
  };
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

  cover(page, 320, 147, 220, 27);
  text(page, "Ref:", 324, 154, 67, { bold: true });
  text(page, input.contractNumber, 392, 154, 120);
  text(page, "DATE:", 324, 166, 67, { bold: true });
  text(page, contractDate(input.createdAt), 392, 166, 90);

  // Customer data is intentionally laid out as full-width rows. Licence
  // names, addresses, emails and document numbers can be long, and the old
  // multi-column layout allowed them to overlap neighbouring labels.
  cover(page, 50, 246, 490, 138);
  text(page, "Hirer Name:", 53, 251, 66, { bold: true });
  text(page, name.toUpperCase(), 121, 251, 414);
  text(page, "Address:", 53, 264, 66, { bold: true });
  text(page, licence?.address || address, 121, 264, 414, { size: 6.5 });
  text(page, "From (business name):", 53, 277, 112, { bold: true });
  text(page, reservation.office?.name || "Success Van Hire", 167, 277, 368);
  text(page, "Driving Licence number:", 53, 290, 112, { bold: true });
  text(
    page,
    licence?.licenceNumber || licence?.licenseNumber,
    167,
    290,
    368,
    { size: 6.5 },
  );
  text(page, "Email:", 53, 303, 66, { bold: true });
  text(page, reservation.user?.emaildata?.emailAddress, 121, 303, 414, {
    size: 6.5,
  });
  text(page, "Postcode:", 53, 316, 66, { bold: true });
  text(page, licence?.postcode || reservation.user?.postalCode, 121, 316, 86);
  text(page, "Country of Issue:", 211, 316, 82, { bold: true });
  text(page, licence?.issuingCountry || licence?.issuingAuthority, 295, 316, 75);
  text(page, "Exp Date:", 374, 316, 55, { bold: true });
  text(
    page,
    contractDate(licence?.expiryDate || licence?.expirationDate || undefined),
    431,
    316,
    104,
  );
  text(page, "Contact Number:", 53, 329, 86, { bold: true });
  text(page, reservation.user?.phoneData?.phoneNumber, 141, 329, 145);
  text(page, "DOB:", 292, 329, 42, { bold: true });
  text(page, contractDate(licence?.dateOfBirth || undefined), 336, 329, 100);

  page.drawText(
    "The Driver subscribes to use the vehicle supplied by Diba Cooperation LTD for the Rental fee during the Term. Only the authorised driver/drivers named above may drive the Vehicle.",
    {
      x: 53,
      y: topY(page, 343, 6.5),
      size: 6.5,
      lineHeight: 8,
      font,
      color: ink,
      maxWidth: 482,
    },
  );
  text(page, "Additional Driver:", 53, 365, 84, { bold: true });
  text(page, "-", 139, 365, 120);
  text(
    page,
    "Only the authorised driver/drivers above can drive the Vehicle during the Subscription",
    53,
    377,
    482,
    { size: 6.5 },
  );

  cover(page, 50, 391, 370, 28);
  text(page, "Register:", 53, 398, 44, { bold: true });
  text(page, reservation.vehicle?.number, 98, 398, 90);
  text(page, "Model:", 242, 398, 44, { bold: true });
  text(page, reservation.vehicle?.title || reservation.category?.name, 287, 398, 120);
  text(page, "Make:", 53, 411, 44, { bold: true });
  text(page, vehicleProperty(reservation, ["make"]) || reservation.category?.name, 98, 411, 90);
  text(page, "Colour:", 242, 411, 44, { bold: true });
  text(
    page,
    reservation.vehicle?.color ||
      reservation.vehicle?.colour ||
      vehicleProperty(reservation, ["colour", "color"]),
    287,
    411,
    120,
  );

  cover(page, 58, 430, 310, 16);
  text(page, "1.", 61, 437, 16, { bold: true });
  text(page, "RENTAL TERM:", 80, 437, 82, { bold: true });
  text(page, term.days, 164, 437, 28);
  text(page, "Day/Days", 204, 437, 72);
  text(page, term.hours, 287, 437, 28);
  text(page, "Hours", 326, 437, 42);

  cover(page, 50, 475, 330, 29);
  text(page, "Rental Start Date:", 53, 482, 109);
  text(page, contractDate(reservation.startDate, reservation.startDateDisplay), 164, 482, 80);
  text(page, "Time:", 242, 482, 44);
  text(page, reservation.pickupTime || formatDateTime(reservation.startDate), 287, 482, 72);
  text(page, "Rental End Date:", 53, 495, 109);
  text(page, contractDate(reservation.endDate, reservation.endDateDisplay), 164, 495, 80);
  text(page, "Time:", 242, 495, 44);
  text(page, reservation.returnTime || formatDateTime(reservation.endDate), 287, 495, 72);
  cover(page, 50, 549, 270, 28);
  text(page, "Subscription Price:", 53, 556, 109);
  text(page, `£${Number(reservation.totalPrice || 0).toFixed(2)}`, 164, 556, 76);
  text(page, "for duration in section 1.", 204, 556, 130);
  text(page, "Deposit:", 53, 569, 109);
  text(page, `£${Number(reservation.deposit?.amount || 0).toFixed(2)}`, 164, 569, 76);

  cover(page, 50, 613, 270, 41);
  text(page, "Mileage Allowance Weekly:", 53, 620, 202);
  text(page, "-", 256, 620, 45);
  text(page, "Mileage Allowance Daily:", 53, 633, 202);
  text(page, "-", 256, 633, 45);
  text(page, "Excess Mileage Charge is:", 53, 646, 202);
  text(page, "-", 256, 646, 45);

  cover(page, 50, 673, 330, 15);
  text(page, "Arranged Insurance:", 53, 680, 110);
  text(page, "Subject to approval", 165, 680, 180, { size: 6.5 });
  put(page2, insuranceExcessLabel, 164, 76, 80);

  // Invisible DocuSign anchors sit on the existing signature/name lines.
  page2.drawText(signatureAnchor, {
    x: 104,
    y: topY(page2, 253, 1),
    size: 1,
    font,
    color: white,
  });
  page2.drawText(nameAnchor, {
    x: 327,
    y: topY(page2, 253, 1),
    size: 1,
    font,
    color: white,
  });
  page2.drawText(dateAnchor, {
    x: 327,
    y: topY(page2, 270, 1),
    size: 1,
    font,
    color: white,
  });

  // Preserve crisp page numbering after the template is rewritten by pdf-lib.
  cover(page, 520, 805, 32, 18);
  text(page, "1/2", 528, 812, 22);
  cover(page2, 520, 805, 32, 18);
  text(page2, "2/2", 528, 812, 22);

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
