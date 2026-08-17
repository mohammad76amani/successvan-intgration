import { describe, expect, it } from "vitest";
import {
  contractNumberDatePrefix,
  formatContractNumber,
} from "./number";

describe("contract number format", () => {
  it("uses a six-digit YYMMDD date", () => {
    expect(contractNumberDatePrefix(new Date("2026-08-16T12:00:00Z"))).toBe(
      "260816",
    );
  });

  it("does not pad the daily sequence", () => {
    expect(formatContractNumber("260816", 4)).toBe("260816-4");
  });
});
