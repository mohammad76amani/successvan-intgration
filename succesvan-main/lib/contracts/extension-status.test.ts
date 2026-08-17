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

  it("only offers creation when no extension exists", () => {
    expect(extensionPanelState({ exists: false })).toBe("create");
    expect(
      extensionPanelState({ exists: true, sourceAvailable: true }),
    ).toBe("download");
    expect(
      extensionPanelState({ exists: true, sourceAvailable: false }),
    ).toBe("agreement_preparing");
  });
});
