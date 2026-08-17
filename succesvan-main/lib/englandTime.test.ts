import { describe, expect, it } from "vitest";
import {
  createLondonDateTimeFromStorage,
  formatDateInputInLondon,
  formatTimeInLondon,
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
});
