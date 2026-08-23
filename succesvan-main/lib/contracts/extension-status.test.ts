import { describe, expect, it } from "vitest";
import {
  extensionPanelState,
  isPendingExtensionStatus,
} from "./extension-status";

describe("extension agreement status selection", () => {
  it.each(["generating", "ready", "sent", "delivered", "viewed", "signing"] as const)(
    "treats %s as awaiting customer completion",
    (status) => expect(isPendingExtensionStatus(status)).toBe(true),
  );

  it.each(["completed", "declined", "voided", "expired", "error"] as const)(
    "does not classify %s as awaiting customer completion",
    (status) => expect(isPendingExtensionStatus(status)).toBe(false),
  );

  it("allows sequential extensions after completion", () => {
    expect(extensionPanelState({ extensions: [] })).toBe("create");
    expect(
      extensionPanelState({
        extensions: [{ status: "sent", sourceAvailable: true }],
      }),
    ).toBe("awaiting_signature");
    expect(
      extensionPanelState({
        extensions: [{ status: "generating", sourceAvailable: false }],
      }),
    ).toBe("agreement_preparing");
    expect(
      extensionPanelState({
        extensions: [{ status: "completed", sourceAvailable: true }],
      }),
    ).toBe("create_another");
  });
});
