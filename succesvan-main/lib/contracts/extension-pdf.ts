import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatDateInLondon, formatTimeInLondon } from "@/lib/englandTime";
import { sha256Hex } from "./hash";
import type { ContractPdfReservation } from "./pdf";

export type ReservationExtensionPdfSnapshot = {
  previousReturnDateTime: Date | string;
  newReturnDateTime: Date | string;
  durationHours: number;
  durationLabel: string;
  calculatedPrice: number;
  agreedPrice: number;
  customPriceApplied: boolean;
  customPriceReason?: string;
  paymentDueAt?: Date | string;
  paymentMethod?: string;
  paymentReference?: string;
  lessorName?: string;
};

export type ReservationExtensionPdfInput = {
  contractNumber: string;
  createdAt: Date;
  originalContractNumber: string;
  originalContractCreatedAt?: Date | string;
  reservation: ContractPdfReservation;
  extension: ReservationExtensionPdfSnapshot;
};

const templatePath = path.join(
  process.cwd(),
  "public",
  "contracts",
  "successvan-vehicle-hire-extension-template.pdf",
);

const value = (input: unknown) =>
  input === undefined || input === null || input === "" ? "-" : String(input);

const customerName = (reservation: ContractPdfReservation) => {
  const licence = reservation.user?.licenceDetails?.isFrontSide
    ? reservation.user.licenceDetails
    : undefined;
  return (
    licence?.fullName ||
    [licence?.firstName, licence?.lastName].filter(Boolean).join(" ") ||
    [reservation.user?.name, reservation.user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Customer"
  ).trim();
};

const licenceNumber = (reservation: ContractPdfReservation) => {
  const licence = reservation.user?.licenceDetails?.isFrontSide
    ? reservation.user.licenceDetails
    : undefined;
  return licence?.licenceNumber || licence?.licenseNumber || "-";
};

function drawSlot(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  top: number,
  width: number,
  options?: { boldFont?: PDFFont; bold?: boolean; size?: number },
) {
  const white = rgb(1, 1, 1);
  const ink = rgb(0.04, 0.04, 0.04);
  const selectedFont = options?.bold && options.boldFont ? options.boldFont : font;
  let size = options?.size ?? 8;
  while (size > 6 && selectedFont.widthOfTextAtSize(text, size) > width - 4) {
    size -= 0.25;
  }
  page.drawRectangle({
    x: x - 1,
    y: page.getHeight() - top - 11,
    width: width + 2,
    height: 12,
    color: white,
  });
  page.drawText(text, {
    x: x + 2,
    y: page.getHeight() - top - size - 0.5,
    size,
    font: selectedFont,
    color: ink,
    maxWidth: width - 4,
  });
}

export async function generateReservationExtensionPdf(
  input: ReservationExtensionPdfInput,
) {
  const template = await readFile(templatePath);
  const doc = await PDFDocument.load(template);
  doc.setTitle(
    `Success Van Hire Extension Confirmation ${input.contractNumber}`,
  );
  doc.setAuthor("Success Van Hire");
  doc.setCreationDate(input.createdAt);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const page1 = doc.getPage(0);
  const page2 = doc.getPage(1);
  const reservation = input.reservation;
  const extension = input.extension;
  const name = customerName(reservation);
  const phone = reservation.user?.phoneData?.phoneNumber || "-";
  const vehicleMake =
    reservation.vehicle?.make ||
    reservation.vehicle?.brand ||
    reservation.vehicleSnapshot?.make ||
    "-";
  const vehicleModel =
    reservation.vehicle?.title || reservation.vehicleSnapshot?.title || "-";
  const vehicleRegistration =
    reservation.vehicle?.number || reservation.vehicleSnapshot?.number || "-";

  drawSlot(page1, font, formatDateInLondon(input.createdAt), 199, 150, 145, {
    bold: true,
    boldFont,
  });
  drawSlot(page1, font, formatTimeInLondon(input.createdAt), 380, 150, 142, {
    bold: true,
    boldFont,
  });

  const tableWidth = 251;
  drawSlot(page1, font, input.originalContractNumber, 311, 196, tableWidth);
  drawSlot(
    page1,
    font,
    reservation.reservationCode || value(reservation._id),
    311,
    206,
    tableWidth,
  );
  drawSlot(
    page1,
    font,
    input.originalContractCreatedAt
      ? formatDateInLondon(input.originalContractCreatedAt)
      : "-",
    311,
    216,
    tableWidth,
  );
  drawSlot(page1, font, name, 311, 227, tableWidth);
  drawSlot(page1, font, value(vehicleRegistration), 311, 261, tableWidth);
  drawSlot(
    page1,
    font,
    `${value(vehicleMake)} / ${value(vehicleModel)}`,
    311,
    271,
    tableWidth,
  );
  drawSlot(page1, font, reservation.category?.name || "Van", 311, 281, tableWidth);
  drawSlot(page1, font, name, 311, 292, tableWidth);
  drawSlot(page1, font, licenceNumber(reservation), 311, 302, tableWidth);
  drawSlot(page1, font, phone, 311, 312, tableWidth);

  drawSlot(
    page1,
    font,
    formatDateInLondon(extension.previousReturnDateTime),
    311,
    346,
    tableWidth,
  );
  drawSlot(
    page1,
    font,
    formatTimeInLondon(extension.previousReturnDateTime),
    311,
    357,
    tableWidth,
  );
  drawSlot(
    page1,
    font,
    formatDateInLondon(extension.previousReturnDateTime),
    311,
    367,
    122,
  );
  drawSlot(
    page1,
    font,
    formatTimeInLondon(extension.previousReturnDateTime),
    439,
    367,
    123,
  );
  drawSlot(
    page1,
    font,
    formatDateInLondon(extension.newReturnDateTime),
    311,
    377,
    tableWidth,
  );
  drawSlot(
    page1,
    font,
    formatTimeInLondon(extension.newReturnDateTime),
    311,
    388,
    tableWidth,
  );
  drawSlot(page1, font, extension.durationLabel, 311, 398, tableWidth);

  drawSlot(
    page1,
    font,
    `£${extension.agreedPrice.toFixed(2)}`,
    306,
    432,
    256,
    { bold: true, boldFont },
  );
  drawSlot(
    page1,
    font,
    extension.paymentDueAt
      ? formatDateInLondon(extension.paymentDueAt)
      : "Pay at office",
    306,
    442,
    256,
  );
  drawSlot(
    page1,
    font,
    value(extension.paymentMethod || "Pay at office").replace(/_/g, " "),
    306,
    453,
    256,
  );
  drawSlot(
    page1,
    font,
    value(extension.paymentReference),
    306,
    463,
    256,
  );

  drawSlot(page2, font, name, 311, 176, tableWidth);
  drawSlot(page2, font, "", 311, 187, tableWidth);
  drawSlot(
    page2,
    font,
    extension.lessorName || "Success Van Hire",
    311,
    197,
    tableWidth,
  );
  drawSlot(
    page2,
    font,
    "Approved electronically",
    311,
    207,
    tableWidth,
  );

  const bytes = await doc.save();
  const buffer = Buffer.from(bytes);
  return {
    buffer,
    fileName: `${input.contractNumber}-extension-confirmation.pdf`,
    mimeType: "application/pdf",
    sha256: sha256Hex(buffer),
  };
}
