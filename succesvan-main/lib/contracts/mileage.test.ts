import { describe, expect, it } from "vitest";
import { contractMileageAllowance } from "./mileage";

describe("contractMileageAllowance", () => {
  it("uses the standard allowance without a mileage add-on", () => {
    expect(contractMileageAllowance()).toMatchObject({
      dailyLabel: "150 miles",
      weeklyLabel: "1,000 miles",
      excessChargeLabel: "25p per mile",
    });
  });

  it("adds a per-day mileage add-on to daily and weekly allowances", () => {
    expect(
      contractMileageAllowance([
        {
          addOn: { name: "Additional Mileage (400 miles)", type: "Mileage" },
          quantity: 1,
        },
      ]),
    ).toMatchObject({
      dailyLabel: "550 miles",
      weeklyLabel: "3,800 miles",
    });
  });

  it("respects add-on quantity", () => {
    expect(
      contractMileageAllowance([
        {
          addOn: { name: "Additional Mileage (800 miles)", type: "Mileage" },
          quantity: 2,
        },
      ]),
    ).toMatchObject({
      dailyLabel: "1,750 miles",
      weeklyLabel: "12,200 miles",
    });
  });

  it("removes mileage limits when unlimited mileage is selected", () => {
    expect(
      contractMileageAllowance([
        {
          addOn: {
            name: "Additional Mileage (Unlimited miles)",
            type: "Mileage",
          },
        },
      ]),
    ).toMatchObject({
      unlimited: true,
      dailyLabel: "Unlimited",
      weeklyLabel: "Unlimited",
      excessChargeLabel: "Not applicable",
    });
  });
});
