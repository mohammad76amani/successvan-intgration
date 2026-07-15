import type { ContractStatus, SafeContractSummary } from "@/lib/docusign/types";

type ContractLike = {
  _id?: { toString(): string } | string;
  bookingId?: unknown;
  customerId?: unknown;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  contractNumber?: string;
  status?: ContractStatus;
  docusign?: {
    envelopeId?: string;
    envelopeStatus?: string;
    sentAt?: Date | string;
    deliveredAt?: Date | string;
    viewedAt?: Date | string;
    completedAt?: Date | string;
    declinedAt?: Date | string;
    voidedAt?: Date | string;
    declineReason?: string;
    voidReason?: string;
    statusChangedAt?: Date | string;
  };
  sourceDocument?: { storageKey?: string; fileName?: string };
  signedDocument?: { storageKey?: string; fileName?: string };
  certificateDocument?: { storageKey?: string; fileName?: string };
  createdAt?: Date | string;
  updatedAt?: Date | string;
  toObject?: (options?: Record<string, unknown>) => ContractLike;
};

type BookingLike = {
  _id?: { toString(): string } | string;
  category?: { name?: string };
  vehicle?: { title?: string; number?: string | number };
};

function idToString(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "toString" in value) {
    return String(value);
  }
  return String(value);
}

function dateToString(value?: Date | string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function bookingFromContract(contract: ContractLike) {
  if (
    contract.bookingId &&
    typeof contract.bookingId === "object" &&
    "_id" in contract.bookingId
  ) {
    return contract.bookingId as BookingLike;
  }
  return undefined;
}

export function serializeContract(contractInput: ContractLike): SafeContractSummary {
  const contract = contractInput.toObject
    ? contractInput.toObject({ getters: false, virtuals: false })
    : contractInput;
  const booking = bookingFromContract(contract);
  const vehicleLabel =
    booking?.vehicle?.title || booking?.category?.name
      ? [
          booking?.vehicle?.title || booking?.category?.name,
          booking?.vehicle?.number ? `(${booking.vehicle.number})` : undefined,
        ]
          .filter(Boolean)
          .join(" ")
      : undefined;

  return {
    _id: idToString(contract._id),
    bookingId: idToString(booking?._id || contract.bookingId),
    customerId: contract.customerId ? idToString(contract.customerId) : undefined,
    customerName: contract.customerName || "Customer",
    customerEmail: contract.customerEmail || "",
    customerPhone: contract.customerPhone,
    contractNumber: contract.contractNumber || "",
    status: contract.status || "draft",
    bookingReference: idToString(booking?._id || contract.bookingId).slice(-8),
    vehicleLabel,
    docusign: {
      envelopeId: contract.docusign?.envelopeId,
      envelopeStatus: contract.docusign?.envelopeStatus,
      sentAt: dateToString(contract.docusign?.sentAt),
      deliveredAt: dateToString(contract.docusign?.deliveredAt),
      viewedAt: dateToString(contract.docusign?.viewedAt),
      completedAt: dateToString(contract.docusign?.completedAt),
      declinedAt: dateToString(contract.docusign?.declinedAt),
      voidedAt: dateToString(contract.docusign?.voidedAt),
      declineReason: contract.docusign?.declineReason,
      voidReason: contract.docusign?.voidReason,
      statusChangedAt: dateToString(contract.docusign?.statusChangedAt),
    },
    files: {
      source: Boolean(contract.sourceDocument?.fileName || contract.sourceDocument?.storageKey),
      signed: Boolean(contract.signedDocument?.fileName || contract.signedDocument?.storageKey),
      certificate: Boolean(
        contract.certificateDocument?.fileName ||
          contract.certificateDocument?.storageKey,
      ),
    },
    createdAt: dateToString(contract.createdAt),
    updatedAt: dateToString(contract.updatedAt),
  };
}
