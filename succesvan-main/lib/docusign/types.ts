export const CONTRACT_STATUSES = [
  "draft",
  "generating",
  "ready",
  "sent",
  "delivered",
  "viewed",
  "signing",
  "completed",
  "declined",
  "voided",
  "expired",
  "error",
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export type ContractDocumentKind = "source" | "signed" | "certificate";

export type ContractAuditSource = "admin" | "customer" | "docusign" | "system";

export type StoredContractFile = {
  storageKey?: string;
  fileName?: string;
  mimeType?: string;
  sha256?: string;
  downloadedAt?: Date;
};

export type DocuSignEnvelopeStatus =
  | "created"
  | "sent"
  | "delivered"
  | "completed"
  | "declined"
  | "voided"
  | "expired"
  | "corrected"
  | "deleted"
  | "signed"
  | "viewed"
  | "unknown";

export type SafeContractSummary = {
  _id: string;
  bookingId: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  contractNumber: string;
  status: ContractStatus;
  bookingReference?: string;
  vehicleLabel?: string;
  docusign?: {
    envelopeId?: string;
    envelopeStatus?: string;
    sentAt?: string;
    deliveredAt?: string;
    viewedAt?: string;
    completedAt?: string;
    declinedAt?: string;
    voidedAt?: string;
    declineReason?: string;
    voidReason?: string;
    statusChangedAt?: string;
  };
  files: {
    source: boolean;
    signed: boolean;
    certificate: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type DocuSignConnectEvent = {
  eventId?: string;
  eventType: string;
  envelopeId?: string;
  envelopeStatus?: string;
  occurredAt?: Date;
  contractId?: string;
  bookingId?: string;
  declineReason?: string;
  voidReason?: string;
};
