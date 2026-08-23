import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
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
  const selectedFont =
    options?.bold && options.boldFont ? options.boldFont : font;
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

function drawTableSlot(
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
  const selectedFont =
    options?.bold && options.boldFont ? options.boldFont : font;
  const horizontalPadding = 4;
  const rowHeight = 10.6;
  const rowTop = top - 1.25;
  let size = options?.size ?? 7.75;

  while (
    size > 5.5 &&
    selectedFont.widthOfTextAtSize(text, size) > width - horizontalPadding * 2
  ) {
    size -= 0.25;
  }

  // Replace the complete placeholder cell, then redraw its border. The
  // template rows are only about ten points high, so an inset redaction can
  // leave placeholder ascenders/descenders visible while an oversized one
  // erases the table grid.
  page.drawRectangle({
    x,
    y: page.getHeight() - rowTop - rowHeight,
    width,
    height: rowHeight,
    color: white,
    borderColor: ink,
    borderWidth: 0.45,
  });
  page.drawText(text, {
    x: x + horizontalPadding,
    y: page.getHeight() - top - size - 0.35,
    size,
    font: selectedFont,
    color: ink,
    maxWidth: width - horizontalPadding * 2,
  });
}

function fittedFontSize(
  font: PDFFont,
  text: string,
  width: number,
  preferredSize = 7.75,
  minimumSize = 5.5,
) {
  let size = preferredSize;
  while (size > minimumSize && font.widthOfTextAtSize(text, size) > width) {
    size -= 0.25;
  }
  return size;
}

function drawExtensionSignatureTable(
  page: PDFPage,
  font: PDFFont,
  boldFont: PDFFont,
  values: { customerName: string; lessorName: string },
) {
  const white = rgb(1, 1, 1);
  const ink = rgb(0.04, 0.04, 0.04);
  const x = 45.5;
  const top = 175;
  const width = 520.5;
  const labelWidth = 252.5;
  const valueWidth = width - labelWidth;
  const rowHeights = [11, 28, 11, 11];
  const labels = [
    "Hirer Full Name",
    "Hirer Signature / Electronic Acceptance",
    "Success Van Hire Representative",
    "Success Van Hire Approval / Signature",
  ];
  const rowValues = [
    values.customerName,
    "",
    values.lessorName,
    "Approved electronically",
  ];
  const totalHeight = rowHeights.reduce((sum, height) => sum + height, 0);

  // Replace the compact template table. DocuSign's signature widget is
  // taller than the original ten-point row and otherwise overlaps staff data.
  page.drawRectangle({
    x: x - 1,
    y: page.getHeight() - top - totalHeight - 10,
    width: width + 2,
    height: totalHeight + 12,
    color: white,
  });

  let rowTop = top;
  rowHeights.forEach((rowHeight, index) => {
    const rowBottom = page.getHeight() - rowTop - rowHeight;
    page.drawRectangle({
      x,
      y: rowBottom,
      width,
      height: rowHeight,
      color: white,
      borderColor: ink,
      borderWidth: 0.55,
    });
    page.drawLine({
      start: { x: x + labelWidth, y: rowBottom },
      end: { x: x + labelWidth, y: rowBottom + rowHeight },
      color: ink,
      thickness: 0.55,
    });

    const labelSize = fittedFontSize(
      boldFont,
      labels[index],
      labelWidth - 10,
      8.5,
      7,
    );
    page.drawText(labels[index], {
      x: x + 6,
      y: rowBottom + rowHeight - labelSize - 1.5,
      size: labelSize,
      font: boldFont,
      color: ink,
    });

    if (rowValues[index]) {
      const valueSize = fittedFontSize(font, rowValues[index], valueWidth - 10);
      page.drawText(rowValues[index], {
        x: x + labelWidth + 5,
        y: rowBottom + rowHeight - valueSize - 1.5,
        size: valueSize,
        font,
        color: ink,
      });
    }
    rowTop += rowHeight;
  });

  const recordText =
    "RECORD KEEPING: Retain this Extension Confirmation together with the Original Vehicle Hire Agreement.";
  const recordSize = fittedFontSize(boldFont, recordText, width, 8.5, 7);
  page.drawText(recordText, {
    x: x + (width - boldFont.widthOfTextAtSize(recordText, recordSize)) / 2,
    y: page.getHeight() - top - totalHeight - recordSize - 3,
    size: recordSize,
    font: boldFont,
    color: ink,
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

  const detailsTableX = 298;
  const detailsTableWidth = 268;
  const paymentTableX = 292;
  const paymentTableWidth = 268;
  drawTableSlot(
    page1,
    font,
    input.originalContractNumber,
    detailsTableX,
    196,
    detailsTableWidth,
  );
  drawTableSlot(
    page1,
    font,
    reservation.reservationCode || value(reservation._id),
    detailsTableX,
    206,
    detailsTableWidth,
  );
  drawTableSlot(
    page1,
    font,
    input.originalContractCreatedAt
      ? formatDateInLondon(input.originalContractCreatedAt)
      : "-",
    detailsTableX,
    216,
    detailsTableWidth,
  );
  drawTableSlot(page1, font, name, detailsTableX, 227, detailsTableWidth);
  drawTableSlot(
    page1,
    font,
    value(vehicleRegistration),
    detailsTableX,
    261,
    detailsTableWidth,
  );
  drawTableSlot(
    page1,
    font,
    `${value(vehicleMake)} / ${value(vehicleModel)}`,
    detailsTableX,
    271,
    detailsTableWidth,
  );
  drawTableSlot(
    page1,
    font,
    reservation.category?.name || "Van",
    detailsTableX,
    281,
    detailsTableWidth,
  );
  drawTableSlot(page1, font, name, detailsTableX, 292, detailsTableWidth);
  drawTableSlot(
    page1,
    font,
    licenceNumber(reservation),
    detailsTableX,
    302,
    detailsTableWidth,
  );
  drawTableSlot(page1, font, phone, detailsTableX, 312, detailsTableWidth);

  drawTableSlot(
    page1,
    font,
    formatDateInLondon(extension.previousReturnDateTime),
    detailsTableX,
    346,
    detailsTableWidth,
  );
  drawTableSlot(
    page1,
    font,
    formatTimeInLondon(extension.previousReturnDateTime),
    detailsTableX,
    357,
    detailsTableWidth,
  );
  drawTableSlot(
    page1,
    font,
    `${formatDateInLondon(extension.previousReturnDateTime)} / ${formatTimeInLondon(extension.previousReturnDateTime)}`,
    detailsTableX,
    367,
    detailsTableWidth,
  );
  drawTableSlot(
    page1,
    font,
    formatDateInLondon(extension.newReturnDateTime),
    detailsTableX,
    377,
    detailsTableWidth,
  );
  drawTableSlot(
    page1,
    font,
    formatTimeInLondon(extension.newReturnDateTime),
    detailsTableX,
    388,
    detailsTableWidth,
  );
  drawTableSlot(
    page1,
    font,
    extension.durationLabel,
    detailsTableX,
    398,
    detailsTableWidth,
  );

  drawTableSlot(
    page1,
    font,
    `£${extension.agreedPrice.toFixed(2)}`,
    paymentTableX,
    432,
    paymentTableWidth,
    { bold: true, boldFont },
  );
  drawTableSlot(
    page1,
    font,
    extension.paymentDueAt
      ? formatDateInLondon(extension.paymentDueAt)
      : "Pay at office",
    paymentTableX,
    442,
    paymentTableWidth,
  );
  drawTableSlot(
    page1,
    font,
    value(extension.paymentMethod || "Pay at office").replace(/_/g, " "),
    paymentTableX,
    453,
    paymentTableWidth,
  );
  drawTableSlot(
    page1,
    font,
    value(extension.paymentReference),
    paymentTableX,
    463,
    paymentTableWidth,
  );

  drawExtensionSignatureTable(page2, font, boldFont, {
    customerName: name,
    lessorName: extension.lessorName || "Success Van Hire",
  });

  const bytes = await doc.save();
  const buffer = Buffer.from(bytes);
  return {
    buffer,
    fileName: `${input.contractNumber}-extension-confirmation.pdf`,
    mimeType: "application/pdf",
    sha256: sha256Hex(buffer),
  };
}
