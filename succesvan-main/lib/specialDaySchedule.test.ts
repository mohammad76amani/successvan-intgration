import { describe, expect, it } from "vitest";
import type { Office } from "@/types/type";
import { calculateOfficeExtensionPrices } from "./specialDaySchedule";

const office = {
  name: "Test office",
  location: { latitude: 0, longitude: 0 },
  categories: [],
  address: "",
  phone: "",
  vehicles: [],
  workingTime: [
    {
      day: "monday",
      isOpen: true,
      returnTime: { isOpen: true, startTime: "09:00", endTime: "17:00" },
      returnExtension: {
        startTime: "17:15",
        endTime: "20:00",
        flatPrice: 25,
      },
    },
  ],
  specialDays: [
    {
      month: 8,
      day: 24,
      isOpen: false,
      reason: "Bank holiday",
      extraPrice: 40,
    },
  ],
} satisfies Office;

describe("calculateOfficeExtensionPrices", () => {
  it("adds the configured out-of-hours return fee", () => {
    const result = calculateOfficeExtensionPrices({
      office,
      returnDate: new Date(2026, 7, 17),
      returnTime: "18:00",
    });

    expect(result.returnExtension).toBe(25);
  });

  it("adds a configured bank-holiday fee for an admin return", () => {
    const result = calculateOfficeExtensionPrices({
      office,
      returnDate: new Date(2026, 7, 24),
      returnTime: "12:00",
    });

    expect(result.returnExtension).toBe(40);
  });
});
