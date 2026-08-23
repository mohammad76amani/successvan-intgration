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
  | "create_another"
  | "awaiting_signature"
  | "agreement_preparing"
  | "history";

export const extensionPanelState = (input: {
  extensions: Array<{ status?: ContractStatus; sourceAvailable?: boolean }>;
}): ExtensionPanelState => {
  if (!input.extensions.length) return "create";
  const unfinished = input.extensions.find((item) =>
    isPendingExtensionStatus(item.status),
  );
  if (unfinished) {
    return unfinished.sourceAvailable
      ? "awaiting_signature"
      : "agreement_preparing";
  }
  return input.extensions.some((item) => item.status === "completed")
    ? "create_another"
    : "history";
};
