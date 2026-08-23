import { describe, expect, it } from "vitest";
import { calculateRefundBalance } from "./refund-balance";

describe("calculateRefundBalance", () => {
  it("keeps customer debt negative", () => {
    expect(
      calculateRefundBalance({
        depositPaid: 200,
        deductionsTotal: 220,
        refundAmount: 0,
      }),
    ).toBe(-20);
  });

  it("uses a stored amount when calculation inputs are unavailable", () => {
    expect(calculateRefundBalance({ refundAmount: 75.5 })).toBe(75.5);
  });
});
