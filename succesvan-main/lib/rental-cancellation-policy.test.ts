import { describe, expect, it } from "vitest";
import { calculateRentalCancellation } from "./rental-cancellation-policy";
import { reservationCancellationCalculation } from "./rental-cancellation-policy";

const pickupAt = new Date("2026-09-10T12:00:00Z");
const canceled = (hoursBeforePickup: number) =>
  new Date(pickupAt.getTime() - hoursBeforePickup * 60 * 60 * 1000);

describe("rental fee cancellation policy", () => {
  it("returns all payment when more than 72 hours remain", () => {
    expect(calculateRentalCancellation({ option: "full", paidAmount: 600, pickupAt, canceledAt: canceled(73) }).refundAmount).toBe(600);
  });

  it.each([
    [200, 75, 50],
    [300, 50, 150],
    [500, 10, 450],
  ])("applies the full-payment band for £%s", (paidAmount, percent, refund) => {
    const result = calculateRentalCancellation({ option: "full", paidAmount, pickupAt, canceledAt: canceled(48) });
    expect(result.policyDeductionPercent).toBe(percent);
    expect(result.refundAmount).toBe(refund);
  });

  it("deducts all safe-secure payment between 24 and 72 hours", () => {
    expect(calculateRentalCancellation({ option: "secure", paidAmount: 100, pickupAt, canceledAt: canceled(48) }).refundAmount).toBe(0);
  });

  it("deducts all payment when fewer than 24 hours remain", () => {
    expect(calculateRentalCancellation({ option: "full", paidAmount: 600, pickupAt, canceledAt: canceled(12) }).refundAmount).toBe(0);
  });

  it("uses the admin-agreed percentage when supplied", () => {
    const result = calculateRentalCancellation({ option: "full", paidAmount: 300, pickupAt, canceledAt: canceled(48), agreedDeductionPercent: 25 });
    expect(result.deductionAmount).toBe(75);
    expect(result.refundAmount).toBe(225);
  });

  it("recovers the paid amount for legacy full-payment reservations", () => {
    const result = reservationCancellationCalculation({
      startDate: pickupAt,
      endDate: new Date(pickupAt.getTime() + 24 * 60 * 60 * 1000),
      totalPrice: 300,
      status: "canceled",
      driverAge: 30,
      deposit: {
        option: "full",
        status: "pending",
        receiptUrl: "https://example.com/receipt.webp",
      },
      statusHistory: [
        { status: "canceled", changedAt: canceled(48) },
      ],
    });
    expect(result?.paidAmount).toBe(300);
    expect(result?.agreedDeductionPercent).toBe(50);
    expect(result?.refundAmount).toBe(150);
  });
});
