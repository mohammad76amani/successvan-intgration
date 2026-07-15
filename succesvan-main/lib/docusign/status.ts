import type { ContractStatus, DocuSignEnvelopeStatus } from "./types";

export const docusignStatusMap: Record<string, ContractStatus> = {
  created: "draft",
  sent: "sent",
  delivered: "delivered",
  viewed: "viewed",
  completed: "completed",
  signed: "completed",
  declined: "declined",
  voided: "voided",
  expired: "expired",
  corrected: "sent",
};

const terminalStatuses = new Set<ContractStatus>([
  "completed",
  "declined",
  "voided",
  "expired",
]);

const statusPrecedence: Record<ContractStatus, number> = {
  draft: 0,
  generating: 1,
  ready: 2,
  sent: 3,
  delivered: 4,
  viewed: 5,
  signing: 6,
  completed: 100,
  declined: 100,
  voided: 100,
  expired: 100,
  error: 90,
};

export function mapDocuSignStatus(status?: string | null): ContractStatus {
  if (!status) return "sent";
  return docusignStatusMap[status.toLowerCase()] || "sent";
}

export function normalizeDocuSignEnvelopeStatus(
  status?: string | null,
): DocuSignEnvelopeStatus {
  const normalized = status?.toLowerCase();
  if (
    normalized === "created" ||
    normalized === "sent" ||
    normalized === "delivered" ||
    normalized === "completed" ||
    normalized === "declined" ||
    normalized === "voided" ||
    normalized === "expired" ||
    normalized === "corrected" ||
    normalized === "deleted" ||
    normalized === "signed" ||
    normalized === "viewed"
  ) {
    return normalized;
  }
  return "unknown";
}

export function isTerminalStatus(status: ContractStatus) {
  return terminalStatuses.has(status);
}

export function canGenerateSigningUrl(status: ContractStatus) {
  return ["sent", "delivered", "viewed", "signing"].includes(status);
}

export function canVoidContract(status: ContractStatus) {
  return !isTerminalStatus(status) && status !== "draft" && status !== "error";
}

export function canDownloadSignedDocument(status: ContractStatus) {
  return status === "completed";
}

export function shouldApplyIncomingStatus(
  currentStatus: ContractStatus,
  incomingStatus: ContractStatus,
) {
  if (currentStatus === incomingStatus) return true;
  if (isTerminalStatus(currentStatus)) return false;
  if (isTerminalStatus(incomingStatus)) return true;
  return statusPrecedence[incomingStatus] >= statusPrecedence[currentStatus];
}

export function customerContractStatusLabel(status: ContractStatus) {
  const labels: Record<ContractStatus, string> = {
    draft: "Agreement being prepared",
    generating: "Agreement being prepared",
    ready: "Ready to send",
    sent: "Waiting for your signature",
    delivered: "Agreement opened",
    viewed: "Agreement opened",
    signing: "Signing in progress",
    completed: "Signed",
    declined: "Signature declined",
    voided: "Agreement cancelled",
    expired: "Agreement expired",
    error: "We're resolving an agreement issue",
  };
  return labels[status];
}
