import "server-only";

import { Types } from "mongoose";
import connect from "@/lib/data";
import Contract from "@/model/contract";
import Reservation from "@/model/reservation";
import AddOn from "@/model/addOn";
import {
  createLondonDateTime,
  formatDateInputInLondon,
} from "@/lib/englandTime";
import { generateRentalAgreementPdf } from "./pdf";
import { getContractStorage } from "./storage";
import { sha256Hex } from "./hash";
import { serializeContract } from "./serialization";
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
  makeSignerClientUserId,
  resendRentalAgreementEnvelope,
  voidRentalAgreementEnvelope,
} from "@/lib/docusign/envelopes";
import { createEmbeddedSigningUrl } from "@/lib/docusign/recipient-view";
import {
  downloadEnvelopeDocument,
  getEnvelopeMetadata,
} from "@/lib/docusign/documents";

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
  const prefix = `${year.slice(-1)}${Number(month)}${day}`;
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

  return `${prefix}-${String(nextSequence).padStart(2, "0")}`;
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
    .populate("user", "-password")
    .populate("office")
    .populate("category")
    .populate("vehicle")
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
    sourceDocument?: Record<string, unknown>;
    save: () => Promise<unknown>;
  },
  reservation: Record<string, unknown>,
  actor?: ActorInput,
) {
  const pdf = await generateRentalAgreementPdf({
    contractNumber: contract.contractNumber,
    createdAt: new Date(),
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
    fileName: "source-agreement.pdf",
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

export async function supersedeContractForBooking(
  bookingId: string,
  reason: string,
  actor: ActorInput,
) {
  await connect();
  objectId(bookingId, "BOOKING_NOT_FOUND");

  const contract = await Contract.findOne({
    bookingId,
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
    dbQuery.$or = [
      { contractNumber: { $regex: query.customer, $options: "i" } },
      { customerName: { $regex: query.customer, $options: "i" } },
      { customerEmail: { $regex: query.customer, $options: "i" } },
      { customerPhone: { $regex: query.customer, $options: "i" } },
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
  const envelope = await createRentalAgreementEnvelope({
    id: contract._id.toString(),
    bookingId: contract.bookingId.toString(),
    contractNumber: contract.contractNumber,
    customerName: contract.customerName,
    customerEmail: contract.customerEmail,
    sourcePdf,
    signerRecipientId: contract.docusign.signerRecipientId,
    signerClientUserId: contract.docusign.signerClientUserId,
  });

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
    bookingId?: Types.ObjectId | string;
  },
  contractStatus: ContractStatus,
  occurredAt: Date,
  actor: ActorInput,
) {
  if (!contract.bookingId || contractStatus !== "completed") return;

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
