import { describe, expect, it } from "vitest";
import { normalizeRefundAdditionalCharges } from "./refund-additional-charges";

describe("refund additional charge metadata", () => {
  it("preserves traffic evidence through refund updates", () => {
    const [charge] = normalizeRefundAdditionalCharges([
      {
        amount: 46,
        reason: "Parking ticket",
        evidenceUrl: "https://example.com/ticket.webp",
        ticketReference: "PCN-100",
        violationDate: "2026-08-16T00:00:00.000Z",
        vehicleNumber: "AB12 CDE",
        source: "traffic_violation",
      },
    ]);
    expect(charge).toMatchObject({
      amount: 46,
      reason: "Parking ticket",
      evidenceUrl: "https://example.com/ticket.webp",
      ticketReference: "PCN-100",
      vehicleNumber: "AB12 CDE",
      source: "traffic_violation",
    });
    expect(charge.violationDate?.toISOString()).toBe(
      "2026-08-16T00:00:00.000Z",
    );
  });
});
