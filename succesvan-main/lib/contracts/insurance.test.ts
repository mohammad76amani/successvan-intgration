import { describe, expect, it } from "vitest";
import {
  contractInsuranceAddOns,
  contractInsuranceValues,
} from "./insurance";

describe("contractInsuranceValues", () => {
  it("uses Diba Cooperation Ltd when the lessor arranges insurance", () => {
    expect(
      contractInsuranceValues({
        provider: "diba",
        licenceHolderName: "Licence Holder",
        selectedInsuranceAddOns: "£550 Excess protection",
        otherExcess: "£1,250",
      }),
    ).toEqual({
      arrangedBy: "Diba Cooperation Ltd",
      glassWindscreenExcess: "£250",
      insuranceExcess: "£550 Excess protection",
      otherExcess: "£1,250",
    });
  });

  it("uses the licence holder for customer-arranged insurance", () => {
    expect(
      contractInsuranceValues({
        provider: "customer",
        licenceHolderName: "Theodore Francis-Crossley",
      }),
    ).toEqual({
      arrangedBy: "THEODORE FRANCIS-CROSSLEY",
      glassWindscreenExcess: "£250",
      insuranceExcess: "-",
      otherExcess: "-",
    });
  });

  it("lists selected insurance add-ons and their quantities", () => {
    expect(
      contractInsuranceAddOns([
        {
          addOn: { name: "£550 Excess protection", type: "Excess" },
          quantity: 2,
        },
        {
          addOn: { name: "Additional Mileage (400 miles)", type: "Mileage" },
          quantity: 1,
        },
      ]),
    ).toBe("£550 Excess protection x 2");
  });

  it("uses a dash when no insurance add-on was selected", () => {
    expect(contractInsuranceAddOns()).toBe("-");
  });
});
