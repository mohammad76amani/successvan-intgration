import type { ContractStatus } from "@/lib/docusign/types";

const pendingExtensionStatuses = new Set<ContractStatus>([
  "generating",
  "ready",
  "sent",
  "delivered",
  "viewed",
  "signing",
]);

export const isPendingExtensionStatus = (status?: ContractStatus) =>
  Boolean(status && pendingExtensionStatuses.has(status));

export type ExtensionPanelState =
  | "create"
  | "agreement_preparing"
  | "download";

export const extensionPanelState = (input: {
  exists: boolean;
  sourceAvailable?: boolean;
}): ExtensionPanelState => {
  if (!input.exists) return "create";
  return input.sourceAvailable ? "download" : "agreement_preparing";
};
