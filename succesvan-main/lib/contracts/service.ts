import "server-only";

import { Types } from "mongoose";
import connect from "@/lib/data";
import Contract from "@/model/contract";
import Reservation from "@/model/reservation";
import AddOn from "@/model/addOn";
import User from "@/model/user";
import Office from "@/model/office";
import Category from "@/model/category";
import Vehicle from "@/model/vehicle";
import {
  createLondonDateTime,
  formatDateInputInLondon,
  formatTimeInLondon,
  parseStorageDate,
} from "@/lib/englandTime";
import { generateRentalAgreementPdf } from "./pdf";
import { generateReservationExtensionPdf } from "./extension-pdf";
import { getContractStorage } from "./storage";
import { sha256Hex } from "./hash";
import { serializeContract } from "./serialization";
import {
  contractNumberDatePrefix,
  formatContractNumber,
} from "./number";
import {
  canDownloadSignedDocument,
  canGenerateSigningUrl,
  canVoidContract,
  mapDocuSignStatus,
  shouldApplyIncomingStatus,
} from "@/lib/docusign/status";
import type {
  ContractAuditSource,
  ContractDocumentKind,
  ContractStatus,
  DocuSignConnectEvent,
} from "@/lib/docusign/types";
import {
  ContractIntegrationError,
  normalizeDocuSignSdkError,
} from "@/lib/docusign/errors";
import {
  createRentalAgreementEnvelope,
  createReservationExtensionEnvelope,
  makeSignerClientUserId,
  resendRentalAgreementEnvelope,
  voidRentalAgreementEnvelope,
} from "@/lib/docusign/envelopes";
import { createEmbeddedSigningUrl } from "@/lib/docusign/recipient-view";
import {
  downloadEnvelopeDocument,
  getEnvelopeMetadata,
} from "@/lib/docusign/documents";
import { calculateOfficeExtensionPrices } from "@/lib/specialDaySchedule";
import { calculateReservationExtensionPrice } from "@/lib/reservation-extension-pricing";

const contractDocumentSelect =
  "+sourceDocument.storageKey +signedDocument.storageKey +certificateDocument.storageKey";

type ActorInput = {
  actorId?: string;
  source: ContractAuditSource;
};

type ContractQuery = {
  status?: string | null;
  customer?: string | null;
  bookingId?: string | null;
  page?: number;
  limit?: number;
};

type ContractCreationOptions = {
  recreateEnvelope?: boolean;
  insuranceProvider?: "diba" | "customer";
  insuranceOtherExcess?: string;
  handoverDepositAmount?: number;
};

export type ReservationExtensionCreationOptions = {
  newReturnDateTime: Date | string;
  customPrice?: number;
  customPriceReason?: string;
  paymentDueAt?: Date | string;
  paymentMethod?: string;
  paymentReference?: string;
  lessorName?: string;
};

function objectId(value: string, code = "CONTRACT_NOT_FOUND") {
  if (!Types.ObjectId.isValid(value)) {
    throw new ContractIntegrationError(
      code as "CONTRACT_NOT_FOUND",
      "Invalid ID.",
      400,
    );
  }
  return new Types.ObjectId(value);
}

function contractNumberDateParts(date: Date) {
  const [year, month, day] = formatDateInputInLondon(date).split("-");
  const prefix = contractNumberDatePrefix(date);
  const calendarDate = new Date(Number(year), Number(month) - 1, Number(day));
  const followingDate = new Date(Number(year), Number(month) - 1, Number(day) + 1);

  return {
    prefix,
    dayStart: new Date(createLondonDateTime(calendarDate, "00:00")),
    dayEnd: new Date(createLondonDateTime(followingDate, "00:00")),
  };
}

async function nextContractNumber(date = new Date()) {
  const { prefix, dayStart, dayEnd } = contractNumberDateParts(date);
  const [contractsCreatedToday, numberedToday] = await Promise.all([
    Contract.countDocuments({
      createdAt: { $gte: dayStart, $lt: dayEnd },
    }),
    Contract.find({
      contractNumber: { $regex: `^${prefix}-\\d+$` },
    })
      .select("contractNumber")
      .lean(),
  ]);

  const highestSequence = numberedToday.reduce((highest, contract) => {
    const sequence = Number(String(contract.contractNumber).split("-").at(-1));
    return Number.isFinite(sequence) ? Math.max(highest, sequence) : highest;
  }, 0);
  const nextSequence = Math.max(contractsCreatedToday, highestSequence) + 1;

  return formatContractNumber(prefix, nextSequence);
}

function isDuplicateContractNumber(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const duplicateError = error as {
    code?: number;
    keyPattern?: Record<string, unknown>;
    keyValue?: Record<string, unknown>;
    message?: string;
  };

  return (
    duplicateError.code === 11000 &&
    (Boolean(duplicateError.keyPattern?.contractNumber) ||
      Boolean(duplicateError.keyValue?.contractNumber) ||
      duplicateError.message?.includes("contractNumber") === true)
  );
}

function isDuplicateExtensionRevision(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const duplicateError = error as {
    code?: number;
    keyPattern?: Record<string, unknown>;
    message?: string;
  };
  return (
    duplicateError.code === 11000 &&
    (Boolean(duplicateError.keyPattern?.extensionBookingKey) ||
      duplicateError.message?.includes("one_extension_per_booking") === true ||
      Boolean(duplicateError.keyPattern?.["extension.previousReturnDateTime"]) ||
      duplicateError.message?.includes("one_extension_per_return_revision") ===
        true)
  );
}

function addAudit(
  contract: {
    _id?: unknown;
    auditTrail?: Array<Record<string, unknown>>;
  },
  action: string,
  source: ContractAuditSource,
  actorId?: string,
  metadata?: Record<string, unknown>,
) {
  contract.auditTrail = contract.auditTrail || [];
  contract.auditTrail.push({
    action,
    source,
    actorId: actorId && Types.ObjectId.isValid(actorId) ? new Types.ObjectId(actorId) : undefined,
    metadata,
    createdAt: new Date(),
  });
}

async function loadReservation(bookingId: string) {
  const reservation = await Reservation.findById(bookingId)
    .populate({ path: "user", model: User, select: "-password" })
    .populate({ path: "office", model: Office })
    .populate({ path: "category", model: Category })
    .populate({ path: "vehicle", model: Vehicle })
    .populate({ path: "addOns.addOn", model: AddOn });

  if (!reservation) {
    throw new ContractIntegrationError(
      "BOOKING_NOT_FOUND",
      "Booking was not found.",
      404,
    );
  }

  return reservation;
}

async function removeLegacySingleContractIndex() {
  const indexes = await Contract.collection.indexes();
  const legacyIndex = indexes.find(
    (index) =>
      index.unique === true &&
      Object.keys(index.key || {}).length === 1 &&
      index.key?.bookingId === 1,
  );
  if (legacyIndex?.name) {
    await Contract.collection.dropIndex(legacyIndex.name);
  }
}

let singleExtensionIndexPromise: Promise<void> | null = null;

async function ensureSingleExtensionIndex() {
  if (singleExtensionIndexPromise) return singleExtensionIndexPromise;
  singleExtensionIndexPromise = (async () => {
    const indexes = await Contract.collection.indexes();
    const previousIndex = indexes.find(
      (index) => index.name === "one_extension_per_return_revision",
    );
    if (previousIndex?.name) {
      await Contract.collection.dropIndex(previousIndex.name);
    }
    await Contract.collection.createIndex(
      { extensionBookingKey: 1 },
      {
        unique: true,
        name: "one_extension_per_booking",
        partialFilterExpression: {
          extensionBookingKey: { $type: "string" },
        },
      },
    );

    // Backfill only unambiguous historical bookings. Development databases
    // that already contain multiple extensions are preserved; the service
    // guard below still prevents any further extension for those bookings.
    const groups = await Contract.aggregate<{
      _id: Types.ObjectId;
      contractIds: Types.ObjectId[];
      count: number;
    }>([
      { $match: { contractType: "reservation_extension" } },
      {
        $group: {
          _id: "$bookingId",
          contractIds: { $push: "$_id" },
          count: { $sum: 1 },
        },
      },
      { $match: { count: 1 } },
    ]);
    if (groups.length) {
      await Contract.bulkWrite(
        groups.map((group) => ({
          updateOne: {
            filter: {
              _id: group.contractIds[0],
              extensionBookingKey: { $exists: false },
            },
            update: { $set: { extensionBookingKey: group._id.toString() } },
          },
        })),
      );
    }
  })().catch((error) => {
    singleExtensionIndexPromise = null;
    throw error;
  });
  return singleExtensionIndexPromise;
}

function requireInsuranceArrangement(reservation: {
  insuranceArrangement?: { provider?: string; otherExcess?: string };
}) {
  if (
    !["diba", "customer"].includes(
      reservation.insuranceArrangement?.provider || "",
    )
  ) {
    throw new ContractIntegrationError(
      "BOOKING_MISSING_REQUIRED_DATA",
      "Select who arranges the insurance before creating the contract.",
      400,
    );
  }
}

function applyContractInsuranceOptions(
  reservation: Record<string, unknown>,
  options: ContractCreationOptions,
) {
  if (!options.insuranceProvider && options.handoverDepositAmount === undefined) {
    return reservation;
  }

  const currentArrangement =
    reservation.insuranceArrangement &&
    typeof reservation.insuranceArrangement === "object"
      ? (reservation.insuranceArrangement as Record<string, unknown>)
      : {};

  return {
    ...reservation,
    ...(options.handoverDepositAmount !== undefined
      ? { handoverDepositAmount: options.handoverDepositAmount }
      : {}),
    insuranceArrangement: {
      ...currentArrangement,
      ...(options.insuranceProvider
        ? {
            provider: options.insuranceProvider,
            otherExcess:
              options.insuranceProvider === "diba"
                ? options.insuranceOtherExcess?.trim() || undefined
                : undefined,
          }
        : {}),
    },
  };
}

function reservationCustomer(reservation: {
  user?: {
    _id?: Types.ObjectId | string;
    name?: string;
    lastName?: string;
    licenceDetails?: {
      isFrontSide?: boolean | null;
      fullName?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    };
    emaildata?: { emailAddress?: string };
    phoneData?: { phoneNumber?: string };
  };
}) {
  const user = reservation.user;
  const licenceName =
    user?.licenceDetails?.isFrontSide
      ? (
          user.licenceDetails.fullName ||
          [
            user.licenceDetails.firstName,
            user.licenceDetails.lastName,
          ]
            .filter(Boolean)
            .join(" ")
        ).trim()
      : "";
  const accountName = `${user?.name || ""} ${user?.lastName || ""}`.trim();
  const customerName = licenceName || accountName;
  const customerEmail = user?.emaildata?.emailAddress?.trim();

  if (!user?._id || !customerName || !customerEmail) {
    throw new ContractIntegrationError(
      "BOOKING_MISSING_REQUIRED_DATA",
      "Booking is missing customer name, user, or email.",
      422,
    );
  }

  return {
    customerId: user._id,
    customerName,
    customerEmail,
    customerPhone: user.phoneData?.phoneNumber,
  };
}

function sourceStorageKey(contractId: string) {
  return `contracts/${contractId}/source-agreement.pdf`;
}

function signedStorageKey(contractId: string) {
  return `contracts/${contractId}/signed-agreement.pdf`;
}

function certificateStorageKey(contractId: string) {
  return `contracts/${contractId}/certificate-of-completion.pdf`;
}

async function getContractWithFiles(contractId: string) {
  const contract = await Contract.findById(contractId).select(contractDocumentSelect);
  if (!contract) {
    throw new ContractIntegrationError(
      "CONTRACT_NOT_FOUND",
      "Contract was not found.",
      404,
    );
  }
  return contract;
}

async function getContractForCustomer(contractId: string, customerId: string) {
  const contract = await Contract.findOne({
    _id: objectId(contractId),
    customerId: objectId(customerId, "CONTRACT_ACCESS_DENIED"),
  })
    .select(contractDocumentSelect)
    .populate("bookingId");

  if (!contract) {
    throw new ContractIntegrationError(
      "CONTRACT_ACCESS_DENIED",
      "Contract was not found for this customer.",
      404,
    );
  }
  return contract;
}

function isUnknownEnvelopeRecipient(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.toUpperCase().includes("UNKNOWN_ENVELOPE_RECIPIENT");
}

async function recreateEnvelopeForEmbeddedSigning(
  contract: {
    _id: Types.ObjectId;
    bookingId: Types.ObjectId;
    status: ContractStatus;
    docusign?: {
      envelopeId?: string;
      signerRecipientId: string;
      signerClientUserId: string;
      envelopeStatus?: string;
      voidedAt?: Date;
      voidReason?: string;
    };
    auditTrail?: Array<Record<string, unknown>>;
    save: () => Promise<unknown>;
  },
  customerId: string,
) {
  if (contract.status === "completed") {
    throw new ContractIntegrationError(
      "CONTRACT_ALREADY_COMPLETED",
      "Completed contracts cannot be recreated for signing.",
      409,
    );
  }

  if (contract.docusign?.envelopeId) {
    try {
      await voidRentalAgreementEnvelope(
        contract.docusign.envelopeId,
        "Recreated with embedded signing recipient.",
      );
      contract.docusign.envelopeStatus = "voided";
      contract.docusign.voidedAt = new Date();
      contract.docusign.voidReason =
        "Recreated with embedded signing recipient.";
    } catch (voidError) {
      console.error(
        "Could not void broken DocuSign envelope before recreation:",
        voidError instanceof Error ? voidError.message : "Unknown error",
      );
    }
  }

  if (contract.docusign) {
    contract.docusign.envelopeId = undefined;
    contract.docusign.envelopeStatus = undefined;
  }
  contract.status = "ready";
  addAudit(
    contract,
    "docusign_envelope_recreate_started",
    "customer",
    customerId,
    { reason: "UNKNOWN_ENVELOPE_RECIPIENT" },
  );
  await contract.save();

  await sendContract(contract._id.toString(), {
    source: "system",
  });
}

async function generateAndStoreSourcePdf(
  contract: {
    _id: Types.ObjectId;
    contractNumber: string;
    contractType?: "rental_agreement" | "reservation_extension";
    originalContractId?: Types.ObjectId;
    extension?: Record<string, unknown>;
    sourceDocument?: Record<string, unknown>;
    save: () => Promise<unknown>;
  },
  reservation: Record<string, unknown>,
  actor?: ActorInput,
) {
  const createdAt = new Date();
  const pdf =
    contract.contractType === "reservation_extension"
      ? await (async () => {
          const originalContract = contract.originalContractId
            ? await Contract.findById(contract.originalContractId)
                .select("contractNumber createdAt")
            : null;
          if (!originalContract || !contract.extension) {
            throw new ContractIntegrationError(
              "BOOKING_MISSING_REQUIRED_DATA",
              "The extension is missing its original agreement or extension details.",
              422,
            );
          }
          return generateReservationExtensionPdf({
            contractNumber: contract.contractNumber,
            createdAt,
            originalContractNumber: originalContract.contractNumber,
            originalContractCreatedAt: originalContract.createdAt,
            reservation,
            extension: contract.extension as never,
          });
        })()
      : await generateRentalAgreementPdf({
          contractNumber: contract.contractNumber,
          createdAt,
          reservation,
        });
  const key = sourceStorageKey(contract._id.toString());
  await getContractStorage().put({
    key,
    body: pdf.buffer,
    contentType: pdf.mimeType,
    metadata: {
      contractNumber: contract.contractNumber,
      sha256: pdf.sha256,
    },
  });

  contract.sourceDocument = {
    storageKey: key,
    fileName:
      contract.contractType === "reservation_extension"
        ? "extension-confirmation.pdf"
        : "source-agreement.pdf",
    mimeType: pdf.mimeType,
    sha256: pdf.sha256,
  };
  addAudit(contract, "source_pdf_generated", actor?.source || "system", actor?.actorId, {
    sha256: pdf.sha256,
  });
  await contract.save();
}

export async function createContractForBooking(
  bookingId: string,
  actor: ActorInput,
  sendNow = false,
  options: ContractCreationOptions = {},
) {
  await connect();
  objectId(bookingId, "BOOKING_NOT_FOUND");

  if (
    options.insuranceProvider ||
    options.handoverDepositAmount !== undefined
  ) {
    const updateFields: Record<string, unknown> = {};
    if (options.insuranceProvider) {
      updateFields.insuranceArrangement = {
        provider: options.insuranceProvider,
        otherExcess:
          options.insuranceProvider === "diba"
            ? options.insuranceOtherExcess?.trim()
            : undefined,
        selectedAt: new Date(),
        selectedBy:
          actor.actorId && Types.ObjectId.isValid(actor.actorId)
            ? new Types.ObjectId(actor.actorId)
            : undefined,
      };
    }
    if (options.handoverDepositAmount !== undefined) {
      updateFields.handoverDepositAmount = options.handoverDepositAmount;
    }
    await Reservation.findByIdAndUpdate(bookingId, {
      $set: updateFields,
    });
  }

  const existing = await Contract.findOne({
    bookingId,
    contractType: "rental_agreement",
    status: { $nin: ["voided", "expired", "declined"] },
  })
    .select(contractDocumentSelect)
    .populate("bookingId");

  if (existing) {
    if (existing.status === "completed") {
      return serializeContract(
        await Contract.findById(existing._id).populate("bookingId"),
      );
    }

    if (
      options.recreateEnvelope &&
      existing.docusign?.envelopeId &&
      existing.status !== "completed"
    ) {
      try {
        await voidRentalAgreementEnvelope(
          existing.docusign.envelopeId,
          "Recreated after vehicle assignment.",
        );
      } catch (voidError) {
        console.error(
          "Could not void existing DocuSign envelope before recreation:",
          voidError instanceof Error ? voidError.message : "Unknown error",
        );
      }
      existing.docusign.envelopeId = undefined;
      existing.docusign.envelopeStatus = undefined;
      existing.docusign.voidedAt = new Date();
      existing.docusign.voidReason = "Recreated after vehicle assignment.";
      existing.sourceDocument = {};
      existing.status = "ready";
      addAudit(
        existing,
        "docusign_envelope_recreate_started",
        actor.source,
        actor.actorId,
        { reason: "vehicle_assigned" },
      );
      await existing.save();
    }

    if (!existing.sourceDocument?.storageKey || options.recreateEnvelope) {
      const reservation = await loadReservation(bookingId);
      const contractReservation = applyContractInsuranceOptions(
        reservation.toObject(),
        options,
      );
      requireInsuranceArrangement(contractReservation);
      await generateAndStoreSourcePdf(existing, contractReservation, actor);
    }
    if (sendNow && !existing.docusign?.envelopeId) {
      await sendContract(existing._id.toString(), actor);
    }
    return serializeContract(await Contract.findById(existing._id).populate("bookingId"));
  }

  const reservation = await loadReservation(bookingId);
  const contractReservation = applyContractInsuranceOptions(
    reservation.toObject(),
    options,
  );
  requireInsuranceArrangement(contractReservation);
  const customer = reservationCustomer(reservation.toObject());
  const id = new Types.ObjectId();

  let contract;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      contract = await Contract.create({
        _id: id,
        bookingId: reservation._id,
        customerId: customer.customerId,
        customerName: customer.customerName,
        customerEmail: customer.customerEmail,
        customerPhone: customer.customerPhone,
        contractNumber: await nextContractNumber(),
        contractType: "rental_agreement",
        status: "generating",
        docusign: {
          signerRecipientId: "1",
          signerClientUserId: makeSignerClientUserId(id),
        },
        createdBy: actor.actorId,
        auditTrail: [
          {
            action: "contract_created",
            source: actor.source,
            actorId: actor.actorId,
            createdAt: new Date(),
          },
        ],
      });
      break;
    } catch (error) {
      if (!isDuplicateContractNumber(error)) throw error;
    }
  }

  if (!contract) {
    throw new ContractIntegrationError(
      "CONTRACT_NUMBER_GENERATION_FAILED",
      "Could not generate a unique contract number. Please try again.",
      409,
    );
  }

  await generateAndStoreSourcePdf(contract, contractReservation, actor);
  await Contract.findByIdAndUpdate(contract._id, {
    $set: { status: "ready" },
    $push: {
      auditTrail: {
        action: "contract_ready",
        source: actor.source,
        actorId: actor.actorId && Types.ObjectId.isValid(actor.actorId)
          ? new Types.ObjectId(actor.actorId)
          : undefined,
        createdAt: new Date(),
      },
    },
  });

  if (sendNow) {
    await sendContract(contract._id.toString(), actor);
  }

  return serializeContract(await Contract.findById(contract._id).populate("bookingId"));
}

async function extensionContext(
  bookingId: string,
  newReturnInput: Date | string,
) {
  await connect();
  objectId(bookingId, "BOOKING_NOT_FOUND");
  const reservation = await loadReservation(bookingId);
  if (reservation.status !== "delivered") {
    throw new ContractIntegrationError(
      "BOOKING_MISSING_REQUIRED_DATA",
      "A rental can only be extended while it is active.",
      409,
    );
  }
  const originalContract = await Contract.findOne({
    bookingId,
    contractType: "rental_agreement",
    status: "completed",
  }).sort({ createdAt: -1 });
  if (!originalContract) {
    throw new ContractIntegrationError(
      "BOOKING_MISSING_REQUIRED_DATA",
      "The original rental agreement must be signed before creating an extension.",
      409,
    );
  }
  const existingExtension = await Contract.findOne({
    bookingId,
    contractType: "reservation_extension",
  }).select("contractNumber status");
  if (existingExtension) {
    throw new ContractIntegrationError(
      "CONTRACT_ALREADY_SENT",
      "This reservation already has an extension agreement. Only one extension is allowed per reservation.",
      409,
    );
  }

  const currentReturn = new Date(reservation.endDate);
  const newReturn = new Date(newReturnInput);
  if (
    Number.isNaN(newReturn.getTime()) ||
    newReturn <= currentReturn
  ) {
    throw new ContractIntegrationError(
      "BOOKING_MISSING_REQUIRED_DATA",
      "The new return date and time must be after the current return.",
      400,
    );
  }

  const vehicleId =
    reservation.vehicle?._id ||
    reservation.vehicleSnapshot?.vehicleId ||
    reservation.vehicle;
  if (vehicleId) {
    const conflict = await Reservation.findOne({
      _id: { $ne: reservation._id },
      status: { $nin: ["canceled", "completed", "refund_completed"] },
      startDate: { $lt: newReturn },
      endDate: { $gt: currentReturn },
      $or: [
        { vehicle: vehicleId },
        { "vehicleSnapshot.vehicleId": vehicleId },
      ],
    })
      .select("reservationCode startDate endDate");
    if (conflict) {
      throw new ContractIntegrationError(
        "BOOKING_MISSING_REQUIRED_DATA",
        `The assigned vehicle is already reserved by ${conflict.reservationCode || "another booking"} during the requested extension.`,
        409,
      );
    }
  }

  const category = reservation.category as {
    pricingTiers?: Array<{
      minDays: number;
      maxDays: number;
      pricePerDay: number;
    }>;
    extrahoursRate?: number;
    selloffer?: number;
    gear?: { automaticExtraCost?: number };
  };
  const office = reservation.office as Record<string, unknown>;
  const newReturnDay = parseStorageDate(formatDateInputInLondon(newReturn));
  const officePrices =
    newReturnDay
      ? calculateOfficeExtensionPrices({
          office: office as never,
          returnDate: newReturnDay,
          returnTime: formatTimeInLondon(newReturn),
        })
      : { pickupExtension: 0, returnExtension: 0 };
  const pricing = calculateReservationExtensionPrice({
    currentReturn,
    newReturn,
    pricingTiers: category.pricingTiers || [],
    extraHoursRate: category.extrahoursRate,
    sellOfferPercent: category.selloffer,
    gearExtraCostPerDay:
      reservation.selectedGear === "automatic"
        ? category.gear?.automaticExtraCost
        : 0,
    returnExtensionPrice: officePrices.returnExtension,
    addOns: reservation.addOns as never,
  });

  return { reservation, originalContract, currentReturn, newReturn, pricing };
}

export async function previewReservationExtension(
  bookingId: string,
  newReturnDateTime: Date | string,
) {
  const context = await extensionContext(bookingId, newReturnDateTime);
  return {
    currentReturnDateTime: context.currentReturn.toISOString(),
    newReturnDateTime: context.newReturn.toISOString(),
    originalContractNumber: context.originalContract.contractNumber,
    pricing: context.pricing,
  };
}

export async function createReservationExtensionContract(
  bookingId: string,
  actor: ActorInput,
  options: ReservationExtensionCreationOptions,
  sendNow = true,
) {
  await removeLegacySingleContractIndex();
  const context = await extensionContext(bookingId, options.newReturnDateTime);
  await ensureSingleExtensionIndex();
  const customPriceProvided = options.customPrice !== undefined;
  const customPrice = Number(options.customPrice);
  if (
    customPriceProvided &&
    (!Number.isFinite(customPrice) || customPrice < 0)
  ) {
    throw new ContractIntegrationError(
      "BOOKING_MISSING_REQUIRED_DATA",
      "Enter a valid custom extension price.",
      400,
    );
  }
  const customPriceReason = options.customPriceReason?.trim() || "";
  if (customPriceProvided && customPriceReason.length < 3) {
    throw new ContractIntegrationError(
      "BOOKING_MISSING_REQUIRED_DATA",
      "Explain why the calculated extension price was changed.",
      400,
    );
  }
  const paymentDueAt = options.paymentDueAt
    ? new Date(options.paymentDueAt)
    : undefined;
  if (paymentDueAt && Number.isNaN(paymentDueAt.getTime())) {
    throw new ContractIntegrationError(
      "BOOKING_MISSING_REQUIRED_DATA",
      "Enter a valid payment due date.",
      400,
    );
  }

  const customer = reservationCustomer(context.reservation.toObject());
  const id = new Types.ObjectId();
  let contract;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      contract = await Contract.create({
        _id: id,
        bookingId: context.reservation._id,
        customerId: customer.customerId,
        customerName: customer.customerName,
        customerEmail: customer.customerEmail,
        customerPhone: customer.customerPhone,
        contractNumber: await nextContractNumber(),
        contractType: "reservation_extension",
        extensionBookingKey: context.reservation._id.toString(),
        originalContractId: context.originalContract._id,
        status: "generating",
        extension: {
          previousReturnDateTime: context.currentReturn,
          newReturnDateTime: context.newReturn,
          durationHours: context.pricing.durationHours,
          durationLabel: context.pricing.durationLabel,
          calculatedPrice: context.pricing.totalPrice,
          agreedPrice: customPriceProvided
            ? Number(customPrice.toFixed(2))
            : context.pricing.totalPrice,
          customPriceApplied: customPriceProvided,
          customPriceReason: customPriceProvided
            ? customPriceReason
            : undefined,
          priceBreakdown: context.pricing.breakdown,
          paymentDueAt,
          paymentMethod: options.paymentMethod?.trim() || "Pay at office",
          paymentReference: options.paymentReference?.trim(),
          lessorName: options.lessorName?.trim() || "Success Van Hire",
        },
        docusign: {
          signerRecipientId: "1",
          signerClientUserId: makeSignerClientUserId(id),
        },
        createdBy: actor.actorId,
        auditTrail: [
          {
            action: "reservation_extension_created",
            source: actor.source,
            actorId: actor.actorId,
            metadata: {
              previousReturnDateTime: context.currentReturn,
              newReturnDateTime: context.newReturn,
              calculatedPrice: context.pricing.totalPrice,
              agreedPrice: customPriceProvided
                ? Number(customPrice.toFixed(2))
                : context.pricing.totalPrice,
            },
            createdAt: new Date(),
          },
        ],
      });
      break;
    } catch (error) {
      if (isDuplicateExtensionRevision(error)) {
        throw new ContractIntegrationError(
          "CONTRACT_ALREADY_SENT",
          "This reservation already has an extension agreement. Only one extension is allowed per reservation.",
          409,
        );
      }
      if (!isDuplicateContractNumber(error)) throw error;
    }
  }
  if (!contract) {
    throw new ContractIntegrationError(
      "CONTRACT_NUMBER_GENERATION_FAILED",
      "Could not generate a unique extension number. Please try again.",
      409,
    );
  }

  await generateAndStoreSourcePdf(
    contract,
    context.reservation.toObject(),
    actor,
  );
  contract.status = "ready";
  addAudit(contract, "reservation_extension_ready", actor.source, actor.actorId);
  await contract.save();
  if (sendNow) await sendContract(contract._id.toString(), actor);
  return serializeContract(
    await Contract.findById(contract._id).populate("bookingId"),
  );
}

export async function supersedeContractForBooking(
  bookingId: string,
  reason: string,
  actor: ActorInput,
) {
  await connect();
  objectId(bookingId, "BOOKING_NOT_FOUND");

  const contract = await Contract.findOne({
    bookingId,
    contractType: "rental_agreement",
    status: { $nin: ["voided", "expired", "declined"] },
  }).select(contractDocumentSelect);
  if (!contract) return null;

  // Completed envelopes cannot be voided in DocuSign. Their signed files stay
  // on the historical contract record, while the local revision is expired so
  // a fresh active agreement can be created for the edited booking.
  if (
    contract.status !== "completed" &&
    contract.docusign?.envelopeId &&
    canVoidContract(contract.status)
  ) {
    try {
      await voidRentalAgreementEnvelope(contract.docusign.envelopeId, reason);
      contract.docusign.envelopeStatus = "voided";
      contract.docusign.voidedAt = new Date();
      contract.docusign.voidReason = reason;
    } catch (voidError) {
      // DocuSign may complete the envelope between loading the booking and
      // voiding it. Refresh that terminal state, retain the signed documents,
      // and then supersede the local revision. Other void failures stay fatal.
      const metadata = await getEnvelopeMetadata(contract.docusign.envelopeId);
      const envelopeStatus = String(metadata.status || "").toLowerCase();
      if (!["completed", "signed"].includes(envelopeStatus)) {
        throw voidError;
      }
      await applyEnvelopeStatus(
        contract,
        envelopeStatus,
        metadata.statusChangedDateTime
          ? new Date(metadata.statusChangedDateTime)
          : new Date(),
        actor,
      );
    }
  }

  contract.status = "expired";
  addAudit(contract, "contract_superseded_after_booking_edit", actor.source, actor.actorId, {
    reason,
  });
  await contract.save();
  return serializeContract(
    await Contract.findById(contract._id).populate("bookingId"),
  );
}

export async function listAdminContracts(query: ContractQuery) {
  await connect();
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 15)));
  const dbQuery: Record<string, unknown> = {};

  if (query.status) dbQuery.status = query.status;
  if (query.bookingId && Types.ObjectId.isValid(query.bookingId)) {
    dbQuery.bookingId = query.bookingId;
  }
  if (query.customer) {
    const searchTerm = query.customer.trim();
    const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matchingBookings = await Reservation.find({
      reservationCode: { $regex: escapedSearch, $options: "i" },
    })
      .select("_id")
      .limit(100)
      .lean();
    dbQuery.$or = [
      { contractNumber: { $regex: escapedSearch, $options: "i" } },
      { customerName: { $regex: escapedSearch, $options: "i" } },
      { customerEmail: { $regex: escapedSearch, $options: "i" } },
      { customerPhone: { $regex: escapedSearch, $options: "i" } },
      { bookingId: { $in: matchingBookings.map((booking) => booking._id) } },
    ];
  }

  const [contracts, total] = await Promise.all([
    Contract.find(dbQuery)
      .populate("bookingId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Contract.countDocuments(dbQuery),
  ]);

  return {
    data: contracts.map(serializeContract),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function listCustomerContracts(
  customerId: string,
  query: { bookingId?: string | null },
) {
  await connect();
  const dbQuery: Record<string, unknown> = {
    customerId: objectId(customerId, "CONTRACT_ACCESS_DENIED"),
  };
  if (query.bookingId && Types.ObjectId.isValid(query.bookingId)) {
    dbQuery.bookingId = query.bookingId;
  }
  const contracts = await Contract.find(dbQuery)
    .populate("bookingId")
    .sort({ createdAt: -1 });
  return contracts.map(serializeContract);
}

export async function getAdminContract(contractId: string) {
  await connect();
  const contract = await Contract.findById(objectId(contractId)).populate("bookingId");
  if (!contract) {
    throw new ContractIntegrationError(
      "CONTRACT_NOT_FOUND",
      "Contract was not found.",
      404,
    );
  }
  return serializeContract(contract);
}

export async function getCustomerContract(contractId: string, customerId: string) {
  await connect();
  const contract = await getContractForCustomer(contractId, customerId);
  return serializeContract(contract);
}

export async function generateContractPdf(contractId: string, actor: ActorInput) {
  await connect();
  const contract = await getContractWithFiles(contractId);
  if (contract.status === "completed") {
    throw new ContractIntegrationError(
      "CONTRACT_ALREADY_COMPLETED",
      "Completed contracts cannot be regenerated.",
      409,
    );
  }
  const reservation = await loadReservation(contract.bookingId.toString());
  const previousStatus = contract.status;
  contract.status = "generating";
  addAudit(contract, "source_pdf_regeneration_started", actor.source, actor.actorId);
  await contract.save();
  await generateAndStoreSourcePdf(contract, reservation.toObject(), actor);
  const regeneratedStatus = contract.docusign?.envelopeId ? previousStatus : "ready";
  await Contract.findByIdAndUpdate(contract._id, {
    $set: { status: regeneratedStatus },
    $push: {
      auditTrail: {
        action: "source_pdf_regenerated",
        source: actor.source,
        actorId: actor.actorId && Types.ObjectId.isValid(actor.actorId)
          ? new Types.ObjectId(actor.actorId)
          : undefined,
        createdAt: new Date(),
      },
    },
  });
  return serializeContract(await Contract.findById(contract._id).populate("bookingId"));
}

export async function sendContract(contractId: string, actor: ActorInput) {
  await connect();
  const contract = await getContractWithFiles(contractId);

  if (contract.status === "completed") {
    throw new ContractIntegrationError(
      "CONTRACT_ALREADY_COMPLETED",
      "This contract is already completed.",
      409,
    );
  }

  if (contract.docusign?.envelopeId) {
    return serializeContract(await Contract.findById(contract._id).populate("bookingId"));
  }

  if (!contract.sourceDocument?.storageKey) {
    const reservation = await loadReservation(contract.bookingId.toString());
    await generateAndStoreSourcePdf(contract, reservation.toObject(), actor);
  }

  const sourcePdf = await getContractStorage().get(contract.sourceDocument.storageKey);
  const envelopeInput = {
    id: contract._id.toString(),
    bookingId: contract.bookingId.toString(),
    contractNumber: contract.contractNumber,
    customerName: contract.customerName,
    customerEmail: contract.customerEmail,
    sourcePdf,
    signerRecipientId: contract.docusign.signerRecipientId,
    signerClientUserId: contract.docusign.signerClientUserId,
  };
  const envelope =
    contract.contractType === "reservation_extension"
      ? await createReservationExtensionEnvelope(envelopeInput)
      : await createRentalAgreementEnvelope(envelopeInput);

  contract.status = "sent";
  contract.docusign.envelopeId = envelope.envelopeId;
  contract.docusign.accountId = envelope.accountId;
  contract.docusign.envelopeStatus = envelope.envelopeStatus;
  contract.docusign.sentAt = new Date();
  contract.docusign.statusChangedAt = envelope.statusDateTime
    ? new Date(envelope.statusDateTime)
    : new Date();
  addAudit(contract, "docusign_envelope_created", actor.source, actor.actorId, {
    envelopeId: envelope.envelopeId,
  });
  await contract.save();

  return serializeContract(await Contract.findById(contract._id).populate("bookingId"));
}

export async function createContractSigningUrl(
  contractId: string,
  customerId: string,
  options?: { returnUrl?: string },
) {
  await connect();
  const contract = await getContractForCustomer(contractId, customerId);

  if (!canGenerateSigningUrl(contract.status)) {
    throw new ContractIntegrationError(
      "CONTRACT_NOT_SIGNABLE",
      "This agreement is not currently available for signing.",
      409,
    );
  }

  if (!contract.docusign?.envelopeId) {
    throw new ContractIntegrationError(
      "DOCUSIGN_ENVELOPE_NOT_FOUND",
      "This agreement has not been sent for signature yet.",
      409,
    );
  }

  let url: string;
  let signingContract = contract;
  try {
    url = await createEmbeddedSigningUrl({
      envelopeId: contract.docusign.envelopeId,
      contractId: contract._id.toString(),
      signerName: contract.customerName,
      signerEmail: contract.customerEmail,
      signerRecipientId: contract.docusign.signerRecipientId,
      signerClientUserId: contract.docusign.signerClientUserId,
      returnUrl: options?.returnUrl,
    });
  } catch (error) {
    if (!isUnknownEnvelopeRecipient(error)) throw error;

    await recreateEnvelopeForEmbeddedSigning(contract, customerId);
    const repairedContract = await getContractForCustomer(contractId, customerId);
    if (!repairedContract.docusign?.envelopeId) {
      throw new ContractIntegrationError(
        "DOCUSIGN_ENVELOPE_NOT_FOUND",
        "This agreement has not been sent for signature yet.",
        409,
      );
    }

    url = await createEmbeddedSigningUrl({
      envelopeId: repairedContract.docusign.envelopeId,
      contractId: repairedContract._id.toString(),
      signerName: repairedContract.customerName,
      signerEmail: repairedContract.customerEmail,
      signerRecipientId: repairedContract.docusign.signerRecipientId,
      signerClientUserId: repairedContract.docusign.signerClientUserId,
      returnUrl: options?.returnUrl,
    });
    signingContract = repairedContract;
  }

  signingContract.status = "signing";
  addAudit(signingContract, "signing_url_requested", "customer", customerId);
  await signingContract.save();

  return { url };
}

async function storeCompletedDocuments(contract: {
  _id: Types.ObjectId;
  docusign?: { envelopeId?: string };
  signedDocument?: Record<string, unknown>;
  certificateDocument?: Record<string, unknown>;
  error?: Record<string, unknown>;
  save: () => Promise<unknown>;
}) {
  if (!contract.docusign?.envelopeId) return;
  const storage = getContractStorage();
  const contractId = contract._id.toString();

  try {
    if (!contract.signedDocument?.storageKey) {
      const signedPdf = await downloadEnvelopeDocument(
        contract.docusign.envelopeId,
        "combined",
      );
      const signedKey = signedStorageKey(contractId);
      const signedHash = sha256Hex(signedPdf);
      await storage.put({
        key: signedKey,
        body: signedPdf,
        contentType: "application/pdf",
        metadata: { sha256: signedHash },
      });
      contract.signedDocument = {
        storageKey: signedKey,
        fileName: "signed-agreement.pdf",
        mimeType: "application/pdf",
        sha256: signedHash,
        downloadedAt: new Date(),
      };
    }

    if (!contract.certificateDocument?.storageKey) {
      const certificatePdf = await downloadEnvelopeDocument(
        contract.docusign.envelopeId,
        "certificate",
      );
      const certificateKey = certificateStorageKey(contractId);
      const certificateHash = sha256Hex(certificatePdf);
      await storage.put({
        key: certificateKey,
        body: certificatePdf,
        contentType: "application/pdf",
        metadata: { sha256: certificateHash },
      });
      contract.certificateDocument = {
        storageKey: certificateKey,
        fileName: "certificate-of-completion.pdf",
        mimeType: "application/pdf",
        sha256: certificateHash,
        downloadedAt: new Date(),
      };
    }
  } catch (error) {
    contract.error = {
      code: "DOCUSIGN_DOCUMENT_DOWNLOAD_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "Completed document download failed.",
      occurredAt: new Date(),
    };
  }

  await contract.save();
}

async function syncReservationFromContractStatus(
  contract: {
    _id: Types.ObjectId;
    bookingId?: Types.ObjectId | string;
    contractType?: "rental_agreement" | "reservation_extension";
  },
  contractStatus: ContractStatus,
  occurredAt: Date,
  actor: ActorInput,
) {
  if (!contract.bookingId || contractStatus !== "completed") return;

  if (contract.contractType === "reservation_extension") {
    const extensionContract = await Contract.findById(contract._id).select(
      "contractNumber extension",
    );
    const extension = extensionContract?.extension;
    if (
      !extensionContract ||
      !extension?.newReturnDateTime ||
      !extension?.previousReturnDateTime ||
      !Number.isFinite(extension.agreedPrice)
    ) {
      throw new ContractIntegrationError(
        "BOOKING_MISSING_REQUIRED_DATA",
        "The signed extension is missing its return date or agreed price.",
        422,
      );
    }

    const newReturn = new Date(extension.newReturnDateTime);
    const updateResult = await Reservation.updateOne(
      {
        _id: contract.bookingId,
        "rentalExtensions.contract": { $ne: contract._id },
      },
      {
        $set: {
          endDate: newReturn,
          endDateDisplay: formatDateInputInLondon(newReturn),
          returnTime: formatTimeInLondon(newReturn),
        },
        $inc: { totalPrice: Number(extension.agreedPrice) },
        $push: {
          rentalExtensions: {
            contract: contract._id,
            contractNumber: extensionContract.contractNumber,
            previousReturnDateTime: extension.previousReturnDateTime,
            newReturnDateTime: extension.newReturnDateTime,
            calculatedPrice: extension.calculatedPrice,
            agreedPrice: extension.agreedPrice,
            customPriceApplied: extension.customPriceApplied,
            customPriceReason: extension.customPriceReason,
            signedAt: occurredAt,
          },
          statusHistory: {
            status: "delivered",
            changedAt: occurredAt,
            source: actor.source === "customer" ? "customer" : "system",
            note: `Rental extended to ${formatDateInputInLondon(newReturn)} ${formatTimeInLondon(newReturn)} under agreement ${extensionContract.contractNumber}.`,
          },
        },
      },
    );

    if (updateResult.modifiedCount > 0 || !extension.appliedAt) {
      extension.appliedAt = occurredAt;
      await extensionContract.save();
    }
    return;
  }

  const reservation = await Reservation.findById(contract.bookingId);
  if (!reservation) return;

  if (["contract_pending", "deposit_paid"].includes(reservation.status)) {
    reservation.status = "contract_signed";
    reservation.statusHistory.push({
      status: "contract_signed",
      changedAt: occurredAt,
      source: actor.source === "customer" ? "customer" : "system",
      note: "Rental agreement signed through DocuSign.",
    });
    await reservation.save();
  }
}

async function applyEnvelopeStatus(
  contract: {
    bookingId?: Types.ObjectId | string;
    status: ContractStatus;
    docusign: {
      envelopeId?: string;
      envelopeStatus?: string;
      statusChangedAt?: Date;
      deliveredAt?: Date;
      viewedAt?: Date;
      completedAt?: Date;
      declinedAt?: Date;
      voidedAt?: Date;
      declineReason?: string;
      voidReason?: string;
    };
    save: () => Promise<unknown>;
    _id: Types.ObjectId;
  },
  envelopeStatus: string,
  occurredAt: Date,
  actor: ActorInput,
  reason?: { declineReason?: string; voidReason?: string },
) {
  const incomingStatus = mapDocuSignStatus(envelopeStatus);
  if (!shouldApplyIncomingStatus(contract.status, incomingStatus)) {
    if (incomingStatus === "completed" && contract.status === "completed") {
      await storeCompletedDocuments(contract);
      await syncReservationFromContractStatus(
        contract,
        incomingStatus,
        occurredAt,
        actor,
      );
      return;
    }
    addAudit(contract, "stale_status_ignored", actor.source, actor.actorId, {
      envelopeStatus,
      currentStatus: contract.status,
    });
    await contract.save();
    return;
  }

  contract.status = incomingStatus;
  contract.docusign.envelopeStatus = envelopeStatus;
  contract.docusign.statusChangedAt = occurredAt;
  if (incomingStatus === "delivered") contract.docusign.deliveredAt = occurredAt;
  if (incomingStatus === "viewed") contract.docusign.viewedAt = occurredAt;
  if (incomingStatus === "completed") contract.docusign.completedAt = occurredAt;
  if (incomingStatus === "declined") {
    contract.docusign.declinedAt = occurredAt;
    contract.docusign.declineReason = reason?.declineReason;
  }
  if (incomingStatus === "voided") {
    contract.docusign.voidedAt = occurredAt;
    contract.docusign.voidReason = reason?.voidReason;
  }

  addAudit(contract, "docusign_status_updated", actor.source, actor.actorId, {
    envelopeStatus,
    status: incomingStatus,
  });
  await contract.save();

  if (incomingStatus === "completed") {
    await storeCompletedDocuments(contract);
    await syncReservationFromContractStatus(
      contract,
      incomingStatus,
      occurredAt,
      actor,
    );
  }
}

export async function refreshContractStatus(contractId: string, actor: ActorInput) {
  await connect();
  const contract = await getContractWithFiles(contractId);
  if (!contract.docusign?.envelopeId) {
    throw new ContractIntegrationError(
      "DOCUSIGN_ENVELOPE_NOT_FOUND",
      "This contract does not have a DocuSign envelope yet.",
      409,
    );
  }

  try {
    const metadata = await getEnvelopeMetadata(contract.docusign.envelopeId);
    const status = String(metadata.status || contract.docusign.envelopeStatus || "sent");
    const occurredAt = metadata.statusChangedDateTime
      ? new Date(metadata.statusChangedDateTime)
      : new Date();
    await applyEnvelopeStatus(contract, status, occurredAt, actor);
  } catch (error) {
    throw normalizeDocuSignSdkError(error);
  }

  return serializeContract(await Contract.findById(contract._id).populate("bookingId"));
}

export async function voidContract(
  contractId: string,
  reason: string,
  actor: ActorInput,
) {
  await connect();
  const contract = await getContractWithFiles(contractId);
  if (!canVoidContract(contract.status)) {
    throw new ContractIntegrationError(
      "CONTRACT_ALREADY_COMPLETED",
      "This contract cannot be voided in its current state.",
      409,
    );
  }
  if (!contract.docusign?.envelopeId) {
    throw new ContractIntegrationError(
      "DOCUSIGN_ENVELOPE_NOT_FOUND",
      "This contract does not have a DocuSign envelope yet.",
      409,
    );
  }

  await voidRentalAgreementEnvelope(contract.docusign.envelopeId, reason);
  contract.status = "voided";
  contract.docusign.envelopeStatus = "voided";
  contract.docusign.voidedAt = new Date();
  contract.docusign.voidReason = reason;
  addAudit(contract, "contract_voided", actor.source, actor.actorId, { reason });
  await contract.save();
  return serializeContract(await Contract.findById(contract._id).populate("bookingId"));
}

export async function resendContract(contractId: string, actor: ActorInput) {
  await connect();
  const contract = await getContractWithFiles(contractId);
  if (!contract.docusign?.envelopeId) {
    throw new ContractIntegrationError(
      "DOCUSIGN_ENVELOPE_NOT_FOUND",
      "This contract does not have a DocuSign envelope yet.",
      409,
    );
  }
  if (contract.status === "completed") {
    throw new ContractIntegrationError(
      "CONTRACT_ALREADY_COMPLETED",
      "Completed contracts cannot be resent.",
      409,
    );
  }
  await resendRentalAgreementEnvelope(contract.docusign.envelopeId);
  addAudit(contract, "docusign_envelope_resent", actor.source, actor.actorId);
  await contract.save();
  return serializeContract(await Contract.findById(contract._id).populate("bookingId"));
}

export async function handleCompletedDocumentRetry(contractId: string, actor: ActorInput) {
  await connect();
  const contract = await getContractWithFiles(contractId);
  if (!canDownloadSignedDocument(contract.status)) {
    throw new ContractIntegrationError(
      "CONTRACT_NOT_SIGNABLE",
      "Signed documents are only available after completion.",
      409,
    );
  }
  await storeCompletedDocuments(contract);
  addAudit(contract, "completed_documents_retry", actor.source, actor.actorId);
  await contract.save();
  return serializeContract(await Contract.findById(contract._id).populate("bookingId"));
}

export async function getContractDocument(
  contractId: string,
  customerId: string | null,
  kind: ContractDocumentKind,
) {
  await connect();
  const contract = customerId
    ? await getContractForCustomer(contractId, customerId)
    : await getContractWithFiles(contractId);

  const document =
    kind === "source"
      ? contract.sourceDocument
      : kind === "signed"
        ? contract.signedDocument
        : contract.certificateDocument;

  if (!document?.storageKey) {
    throw new ContractIntegrationError(
      "CONTRACT_NOT_FOUND",
      "Contract document is not available yet.",
      404,
    );
  }

  if (customerId && kind === "source" && contract.status !== "completed") {
    throw new ContractIntegrationError(
      "CONTRACT_ACCESS_DENIED",
      "This document is not available to download yet.",
      403,
    );
  }

  const buffer = await getContractStorage().get(document.storageKey);
  return {
    buffer,
    fileName:
      document.fileName ||
      (kind === "certificate"
        ? "certificate-of-completion.pdf"
        : "rental-agreement.pdf"),
    mimeType: document.mimeType || "application/pdf",
  };
}

export async function processDocuSignConnectEvent(event: DocuSignConnectEvent) {
  await connect();
  if (!event.envelopeId) {
    throw new ContractIntegrationError(
      "DOCUSIGN_WEBHOOK_INVALID_PAYLOAD",
      "DocuSign webhook did not include an envelope ID.",
      400,
    );
  }

  const contract = await Contract.findOne({
    "docusign.envelopeId": event.envelopeId,
  }).select(contractDocumentSelect);

  if (!contract) {
    console.warn("DocuSign webhook ignored for unknown envelope", {
      envelopeId: event.envelopeId,
      eventType: event.eventType,
    });
    return { ignored: true };
  }

  if (event.eventId && contract.lastWebhookEvent?.eventId === event.eventId) {
    return { duplicate: true };
  }

  const occurredAt = event.occurredAt || new Date();
  const envelopeStatus =
    event.envelopeStatus || event.eventType.replace(/^envelope-/, "");

  await applyEnvelopeStatus(
    contract,
    envelopeStatus,
    occurredAt,
    { source: "docusign" },
    {
      declineReason: event.declineReason,
      voidReason: event.voidReason,
    },
  );

  contract.lastWebhookEvent = {
    eventId: event.eventId,
    eventType: event.eventType,
    receivedAt: new Date(),
    processedAt: new Date(),
  };
  await contract.save();
  return { processed: true };
}
