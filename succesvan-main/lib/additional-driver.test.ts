import { describe, expect, it } from "vitest";
import {
  hasAdditionalDriverAddOn,
  isAdditionalDriverAddOn,
  validateAdditionalDriver,
} from "./additional-driver";

describe("additional driver add-on", () => {
  it("detects normalized names and types", () => {
    expect(isAdditionalDriverAddOn({ name: " Additional-Driver " })).toBe(true);
    expect(isAdditionalDriverAddOn({ type: "additional_driver" })).toBe(true);
    expect(hasAdditionalDriverAddOn([{ addOn: { name: "Additional Driver" } }])).toBe(true);
  });

  it("requires and trims the contract snapshot", () => {
    expect(() =>
      validateAdditionalDriver([{ addOn: { type: "additional-driver" } }], {
        name: "",
        licenceNumber: "",
      }),
    ).toThrow(/full name/i);
    expect(
      validateAdditionalDriver([{ addOn: { name: "Additional Driver" } }], {
        name: "  Alexandra Very Long Driver Name  ",
        licenceNumber: "  LONG-LICENCE-123456789  ",
      }),
    ).toEqual({
      name: "Alexandra Very Long Driver Name",
      licenceNumber: "LONG-LICENCE-123456789",
    });
  });

  it("does not require details without the add-on", () => {
    expect(validateAdditionalDriver([], null)).toBeNull();
  });
});
