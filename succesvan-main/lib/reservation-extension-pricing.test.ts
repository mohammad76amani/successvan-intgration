import { describe, expect, it } from "vitest";
import { calculateReservationExtensionPrice } from "./reservation-extension-pricing";

describe("calculateReservationExtensionPrice", () => {
  it("uses the reservation day and extra-hour rules", () => {
    const result = calculateReservationExtensionPrice({
      currentReturn: "2026-08-17T10:00:00.000Z",
      newReturn: "2026-08-18T14:00:00.000Z",
      pricingTiers: [{ minDays: 1, maxDays: 10, pricePerDay: 100 }],
      extraHoursRate: 10,
    });
    expect(result.totalDays).toBe(1);
    expect(result.extraHours).toBe(4);
    expect(result.totalPrice).toBe(140);
  });

  it("charges only per-day add-ons during the extension", () => {
    const result = calculateReservationExtensionPrice({
      currentReturn: "2026-08-17T10:00:00.000Z",
      newReturn: "2026-08-18T10:00:00.000Z",
      pricingTiers: [{ minDays: 1, maxDays: 10, pricePerDay: 100 }],
      addOns: [
        {
          quantity: 1,
          addOn: {
            pricingType: "flat",
            flatPrice: { amount: 25, isPerDay: false },
          },
        },
        {
          quantity: 2,
          addOn: {
            pricingType: "flat",
            flatPrice: { amount: 5, isPerDay: true },
          },
        },
      ],
    });
    expect(result.addOnsPrice).toBe(10);
    expect(result.totalPrice).toBe(110);
  });
});
