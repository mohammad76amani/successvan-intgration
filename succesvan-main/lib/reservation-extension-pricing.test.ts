import { describe, expect, it } from "vitest";
import { resolveStoredLondonDateTime } from "./englandTime";
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

  it("allows an extension shorter than six hours", () => {
    const result = calculateReservationExtensionPrice({
      currentReturn: "2026-08-17T09:00:00.000Z",
      newReturn: "2026-08-17T11:30:00.000Z",
      pricingTiers: [{ minDays: 1, maxDays: 10, pricePerDay: 100 }],
      extraHoursRate: 10,
    });

    expect(result.durationHours).toBe(2.5);
    expect(result.totalDays).toBe(1);
    expect(result.totalPrice).toBe(100);
  });

  it("includes the category discount and office return surcharge", () => {
    const result = calculateReservationExtensionPrice({
      currentReturn: "2026-08-17T09:00:00.000Z",
      newReturn: "2026-08-18T09:00:00.000Z",
      pricingTiers: [{ minDays: 1, maxDays: 10, pricePerDay: 100 }],
      sellOfferPercent: 10,
      returnExtensionPrice: 25,
    });

    expect(result.daysPrice).toBe(90);
    expect(result.returnExtensionPrice).toBe(25);
    expect(result.totalPrice).toBe(115);
  });

  it("does not add timezone hours to a two-day London extension", () => {
    const currentReturn = resolveStoredLondonDateTime(
      "2026-08-23",
      "06:00",
      "2026-08-23T02:30:00.000Z",
    );
    const newReturn = resolveStoredLondonDateTime(
      "2026-08-25",
      "06:00",
      "2026-08-25T05:00:00.000Z",
    );
    const result = calculateReservationExtensionPrice({
      currentReturn,
      newReturn,
      pricingTiers: [{ minDays: 1, maxDays: 10, pricePerDay: 78 }],
      extraHoursRate: 10,
      addOns: [
        {
          quantity: 1,
          addOn: {
            pricingType: "flat",
            flatPrice: { amount: 60, isPerDay: true },
          },
        },
      ],
    });

    expect(result.durationHours).toBe(48);
    expect(result.totalDays).toBe(2);
    expect(result.extraHours).toBe(0);
    expect(result.totalPrice).toBe(276);
  });

  it("uses London wall-clock hours across the daylight-saving boundary", () => {
    const result = calculateReservationExtensionPrice({
      currentReturn: "2026-10-24T09:00:00.000Z",
      newReturn: "2026-10-25T10:00:00.000Z",
      pricingTiers: [{ minDays: 1, maxDays: 10, pricePerDay: 100 }],
      extraHoursRate: 10,
    });

    expect(result.durationHours).toBe(24);
    expect(result.totalDays).toBe(1);
    expect(result.extraHours).toBe(0);
    expect(result.totalPrice).toBe(100);
  });

  it("adds configured special-day prices across the extension period", () => {
    const result = calculateReservationExtensionPrice({
      currentReturn: "2026-08-23T05:00:00.000Z",
      newReturn: "2026-08-25T05:00:00.000Z",
      pricingTiers: [{ minDays: 1, maxDays: 10, pricePerDay: 100 }],
      specialDays: [
        { month: 8, day: 24, extraPrice: 35, reason: "Bank holiday" },
      ],
    });

    expect(result.specialDaysPrice).toBe(35);
    expect(result.totalPrice).toBe(235);
    expect(result.breakdown).toContainEqual({
      label: "Bank holiday (24 Aug)",
      amount: 35,
    });
  });
});
