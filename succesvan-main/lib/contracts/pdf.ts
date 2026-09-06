import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { sha256Hex } from "./hash";
import { contractMileageAllowance } from "./mileage";
import {
  contractInsuranceAddOns,
  contractInsuranceValues,
} from "./insurance";
import { hasAdditionalDriverAddOn } from "@/lib/additional-driver";

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
    deposit?: {
      depositFee?: number;
      handoverDepositPrice?: number;
    };
  };
  vehicle?: {
    title?: string;
    make?: string;
    number?: string | number;
    brand?: string;
    color?: string;
    colour?: string;
    properties?: Array<{ name?: string; key?: string; value?: string }>;
  };
  vehicleSnapshot?: {
    title?: string;
    make?: string;
    number?: string | number;
    color?: string;
  };
  addOns?: Array<{
    addOn?: { name?: string; type?: string; pricingType?: string };
    quantity?: number;
    selectedTierIndex?: number;
  }>;
  additionalDriver?: {
    name?: string;
    licenceNumber?: string;
  };
  startDate?: string | Date;
  endDate?: string | Date;
  startDateDisplay?: string;
  endDateDisplay?: string;
  pickupTime?: string;
  returnTime?: string;
  totalPrice?: number;
  perInvoice?: boolean;
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
  insuranceArrangement?: {
    provider?: "diba" | "customer";
    otherExcess?: string;
  };
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
  const insuranceValues = contractInsuranceValues({
    provider: reservation.insuranceArrangement?.provider,
    licenceHolderName: name,
    selectedInsuranceAddOns: contractInsuranceAddOns(reservation.addOns),
    otherExcess: reservation.insuranceArrangement?.otherExcess,
  });
  // The agreement deposit is the refundable return/handover deposit configured
  // independently for each category. It is not the customer's payment amount
  // or the category's separate deposit fee.
  const refundableDeposit = Number(
    reservation.handoverDepositAmount ??
      reservation.category?.deposit?.handoverDepositPrice ??
      0,
  );
  const page = doc.getPage(0);
  const page2 = doc.getPage(1);
  // Keep the existing signature page's geometry intact. Additional terms are
  // inserted before it so no signature field or footer has to be repositioned.
  const signaturePageTemplate = doc.getPage(2);
  const termsPage = doc.insertPage(2, [
    signaturePageTemplate.getWidth(),
    signaturePageTemplate.getHeight(),
  ]);
  const page3 = doc.getPage(3);
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
    while (size > 2.8 && font.widthOfTextAtSize(label, size) > width) {
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
  const wrapText = (
    value: string,
    width: number,
    selectedFont: typeof font,
    size: number,
  ) => {
    const lines: string[] = [];
    for (const paragraph of value.split("\n")) {
      const words = paragraph.trim().split(/\s+/).filter(Boolean);
      let line = "";
      words.forEach((word) => {
        const candidate = line ? `${line} ${word}` : word;
        if (line && selectedFont.widthOfTextAtSize(candidate, size) > width) {
          lines.push(line);
          line = word;
        } else {
          line = candidate;
        }
      });
      if (line) lines.push(line);
    }
    return lines;
  };
  const money = (value: unknown) => `£${Number(value || 0).toFixed(2)}`;
  const durationLabel = [
    `${term.days} day${term.days === 1 ? "" : "s"}`,
    Number(term.hours) > 0 ? `${term.hours} hour${term.hours === 1 ? "" : "s"}` : "",
  ]
    .filter(Boolean)
    .join(", ");
  const depositPaymentMethod =
    reservation.deposit?.option === "full"
      ? "Full rental fee - bank transfer"
      : reservation.deposit?.option === "secure"
        ? "Safe & secure rental fee"
        : reservation.deposit?.option === "office"
          ? "Rental fee payable at office"
          : reservation.perInvoice
            ? "Per invoice"
            : "-";
  const additionalDriverIncluded = hasAdditionalDriverAddOn(
    reservation.addOns,
  );
  const additionalDriverName = additionalDriverIncluded
    ? reservation.additionalDriver?.name || "Included"
    : "None";
  const additionalDriverLicence = additionalDriverIncluded
    ? reservation.additionalDriver?.licenceNumber || "Not provided"
    : "Not applicable";
  const mileageAllowance = contractMileageAllowance(reservation.addOns);

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
  cellText(page, additionalDriverName, 167.4, 260.4, 133.2);
  cellText(page, additionalDriverLicence, 433.8, 260.4, 133.2);

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
    reservation.vehicle?.make ||
      reservation.vehicleSnapshot?.make ||
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
  // Remove "Extension (if agreed)" and rebuild the final rental-term row as
  // one full-width duration field. Keeping the row in its original vertical
  // position preserves every later page and DocuSign coordinate.
  cover(page, 33.7, 364.2, 533.8, 12.2);
  drawGrid(page, [34.2, 167.4, 567], 364.6, [10.9]);
  cellText(page, "Agreed Duration:", 34.2, 364.6, 133.2, 10.9, 7.2);
  cellText(page, durationLabel, 167.4, 364.6, 399.6, 10.9, 7.2);

  // Rental fee, deposit and payment details.
  // Remove the Administration Fee, Other Charges, and Fuel / Other Deposit
  // fields. Rebuild this section with only Rental Fee, Deposit, and Payment
  // Method, leaving the rest of page 1 at its existing coordinates.
  cover(page, 33.7, 424.3, 533.8, 44.3);
  drawGrid(page, [34.2, 167.4, 300.6, 433.8, 567], 424.7, [10.9]);
  drawGrid(page, [34.2, 167.4, 567], 435.6, [21.7]);
  cellText(page, "Rental Fee:", 34.2, 424.7, 133.2, 10.9, 7.2);
  cellText(page, reservation.perInvoice ? "Per invoice" : money(reservation.totalPrice), 167.4, 424.7, 133.2, 10.9, 7.2);
  cellText(page, "Deposit:", 300.6, 424.7, 133.2, 10.9, 7.2);
  cellText(page, money(refundableDeposit), 433.8, 424.7, 133.2, 10.9, 7.2);
  cellText(page, "Payment Method:", 34.2, 435.6, 133.2, 21.7, 7.2);
  cellText(page, depositPaymentMethod, 167.4, 435.6, 399.6, 21.7, 7.2);

  // Mileage allowance. Mileage add-ons are sold per rental day, so their
  // stated mileage increases the daily allowance and seven times that amount
  // increases the weekly allowance. Unlimited mileage removes both limits.
  cellText(page, mileageAllowance.weeklyLabel, 300.6, 487.2, 266.4, 10.5);
  cellText(page, mileageAllowance.dailyLabel, 300.6, 497.7, 266.4, 10.5);
  cellText(page, mileageAllowance.excessChargeLabel, 300.6, 508.2, 266.4, 10.5);

  // Insurance details.
  cellText(page, insuranceValues.arrangedBy, 167.4, 584, 133.2, 10.4);
  cellText(
    page,
    insuranceValues.insuranceExcess,
    433.8,
    584,
    133.2,
    10.4,
  );
  cellText(page, insuranceValues.glassWindscreenExcess, 167.4, 594.4, 133.2, 10.2);
  cellText(page, insuranceValues.otherExcess, 433.8, 594.4, 133.2, 10.2);
  // Remove the unused Insurer / Policy Ref and Cover Notes row from the
  // source template, then close the shortened two-row insurance table.
  cover(page, 33.7, 604.2, 533.8, 11.7);
  page.drawLine({
    start: { x: 34.2, y: page.getHeight() - 604.6 },
    end: { x: 567, y: page.getHeight() - 604.6 },
    thickness: 0.65,
    color: ink,
  });

  // Supplemental clauses present in the latest agreement draft but absent
  // from the established template. Existing clauses are deliberately not
  // repeated, keeping the agreement readable and the original styling intact.
  centeredText(termsPage, "ADDITIONAL GENERAL TERMS AND CONDITIONS", 38, {
    bold: true,
    size: 11,
  });
  centeredText(
    termsPage,
    "These terms form part of the Vehicle Hire Agreement.",
    55,
    { italic: true, size: 7.5 },
  );

  const supplementalTerms = [
    {
      heading: "1. AGREEMENT AND RENTAL TERM",
      body: "The Rental Agreement, these General Terms and Conditions, the vehicle handover/condition record and any written booking confirmation together form the agreement between the parties. The Rental Term runs from the time the Hirer or Driver takes possession until the vehicle is returned to and accepted by the Lessor, including any agreed extension.",
    },
    {
      heading: "2. COLLECTION, CONDITION AND RETURN",
      body: "The Hirer must inspect the vehicle at collection and promptly report any damage, defect or discrepancy not recorded on the handover record. The vehicle, keys, documents and equipment must be returned to the agreed location at the agreed date and time, in substantially the same condition as supplied, allowing for fair wear and tear. The Lessor may inspect and photograph the exterior, interior, wheels, tyres, glass, underbody, load area and equipment. Where an out-of-hours return prevents reasonable inspection, the Lessor may inspect when practicable and notify the Hirer of subsequently identified damage or loss. Keys, documents or the vehicle must not be left at an unauthorised location unless specifically instructed by the Lessor.",
    },
    {
      heading: "3. USE AND HIRER OBLIGATIONS",
      body: "The Hirer must take reasonable care of the vehicle, secure it when unattended, use the correct fuel, avoid overloading, secure all loads and comply with applicable road-traffic, vehicle and Operator's Licence requirements. Unless expressly authorised in writing, the Hirer must not sub-hire or lend the vehicle, permit an unauthorised driver, race, speed-test, drive off-road, use it unlawfully, tow where prohibited, carry goods or passengers unlawfully, modify it or arrange repairs except emergency action reasonably necessary for safety.",
    },
    {
      heading: "4. EXTENSIONS AND LATE RETURN",
      body: "Any extension must be agreed by the Lessor before the original return time and may be subject to additional rental, insurance, deposit and other agreed charges. Continued possession does not itself constitute an agreed extension. If the vehicle is not returned when required without an agreed extension, the Hirer may be responsible for additional rental, recovery and other reasonable losses or costs to the extent permitted by law.",
    },
    {
      heading: "5. PAYMENT, DEPOSIT AND MILEAGE EVIDENCE",
      body: "The deposit is security for sums properly due and is not a damage or insurance excess waiver. Where card payment is used, the Hirer authorises charges properly due under this Agreement, subject to the card agreement and applicable law. The Lessor will account for the deposit after reasonable post-hire checks and return any undisputed balance through its normal process. Mileage may be calculated from the odometer and/or other reliable mileage information reasonably available to the Lessor.",
    },
    {
      heading: "6. INSURANCE, DAMAGE, BREAKDOWN AND RECOVERY",
      body: "Where the Lessor does not arrange insurance, the Hirer must obtain appropriate comprehensive motor insurance before use and ensure every authorised driver is covered. The Hirer must immediately report any collision, impact, damage, theft, warning light, breakdown or defect and must stop using the vehicle where continued driving could cause further damage or create a safety risk. Recovery, storage or repair costs caused by misuse, negligence, unauthorised use or breach may be charged to the Hirer to the extent permitted by law. The Lessor is not responsible for business, income or consequential loss arising from breakdown, accident, detention or unavailability, except where liability cannot lawfully be excluded.",
    },
    {
      heading: "7. FUEL, CLEANING, KEYS AND EQUIPMENT",
      body: "The vehicle must be returned with the agreed fuel level and in a reasonably clean condition. Reasonable replenishment, disclosed service or administration, and exceptional cleaning costs may be charged. The Hirer is responsible for loss or damage to supplied keys, documents, tools, equipment and accessories where caused by their act, omission, negligence or breach, and must not duplicate them or interfere with vehicle security, tracking or immobilisation equipment.",
    },
    {
      heading: "8. ACCIDENTS, THEFT AND INCIDENTS",
      body: "The Hirer must promptly notify the Lessor, the police where required and the relevant insurer where applicable; obtain and provide reasonable details of vehicles, drivers, witnesses and circumstances; not admit liability or settle for the Lessor without authority; and cooperate with claims, investigations and vehicle recovery.",
    },
    {
      heading: "9. TERMINATION AND REPLACEMENT VEHICLES",
      body: "Where permitted by law, the Lessor may terminate the hire or require immediate return for non-payment, materially inaccurate information, unauthorised or unlawful use, material safety or insurance risk, or material breach. Following a lawful demand, reasonable possession-recovery steps may be taken and reasonable related costs charged to the extent permitted by law. Accrued rights remain unaffected. If a replacement vehicle is supplied, this Agreement continues unless varied in writing; the Hirer must inspect it and promptly report apparent damage or defects.",
    },
    {
      heading: "10. DATA AND GENERAL PROVISIONS",
      body: "The Lessor may retain hire records, condition records, photographs and correspondence for legitimate business, legal, insurance and regulatory purposes, subject to data-protection law. The Hirer is responsible for ensuring every authorised driver complies with this Agreement. If any provision is invalid or unenforceable, the remaining provisions continue. No variation is effective unless agreed by the Lessor, except where law requires otherwise. Nothing excludes mandatory liability or statutory rights.",
    },
  ];

  let termsTop = 78;
  supplementalTerms.forEach(({ heading, body }) => {
    text(termsPage, heading, 39.7, termsTop, 527, { bold: true, size: 7.6 });
    termsTop += 11;
    const lines = wrapText(body, 527, font, 7.15);
    lines.forEach((line) => {
      text(termsPage, line, 39.7, termsTop, 527, { size: 7.15 });
      termsTop += 8.7;
    });
    termsTop += 5;
  });

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

  [page, page2, termsPage, page3].forEach((targetPage, index) => {
    cover(targetPage, 548, 770, 34, 15);
    text(targetPage, `${index + 1}/4`, 553, 775, 25, { size: 6 });
  });

  const buffer = Buffer.from(await doc.save());
  return {
    buffer,
    sha256: sha256Hex(buffer),
    fileName: `${input.contractNumber}-source-agreement.pdf`,
    mimeType: "application/pdf",
  };
}
