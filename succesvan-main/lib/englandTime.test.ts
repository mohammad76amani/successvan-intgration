import { describe, expect, it } from "vitest";
import {
  createLondonDateTimeFromStorage,
  formatDateInputInLondon,
  formatTimeInLondon,
  resolveStoredLondonDateTime,
} from "./englandTime";

describe("Europe/London reservation date-time round trips", () => {
  it("stores and restores a winter GMT civil time", () => {
    const stored = createLondonDateTimeFromStorage("2026-01-15", "16:30");

    expect(stored).toBe("2026-01-15T16:30:00.000Z");
    expect(formatDateInputInLondon(stored)).toBe("2026-01-15");
    expect(formatTimeInLondon(stored)).toBe("16:30");
  });

  it("stores and restores a summer BST civil time", () => {
    const stored = createLondonDateTimeFromStorage("2026-08-17", "16:30");

    expect(stored).toBe("2026-08-17T15:30:00.000Z");
    expect(formatDateInputInLondon(stored)).toBe("2026-08-17");
    expect(formatTimeInLondon(stored)).toBe("16:30");
  });

  it("prefers stored London return fields over a legacy shifted timestamp", () => {
    const resolved = resolveStoredLondonDateTime(
      "2026-08-23",
      "06:00",
      "2026-08-23T02:30:00.000Z",
    );

    expect(resolved.toISOString()).toBe("2026-08-23T05:00:00.000Z");
  });
});
