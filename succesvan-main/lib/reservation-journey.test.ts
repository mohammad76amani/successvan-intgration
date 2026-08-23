import { describe, expect, it } from "vitest";
import { buildReservationJourney, threeCalendarDaysAfter } from "./reservation-journey";

describe("completed reservation journey", () => {
  it("calculates the expected bank arrival three calendar days later", () => {
    expect(threeCalendarDaysAfter("2026-08-18T10:00:00.000Z")).toBe(
      "2026-08-21T10:00:00.000Z",
    );
  });

  it("exposes completion/refund dates and removes Book Again", () => {
    const journey = buildReservationJourney({
      _id: "reservation",
      startDate: new Date("2026-08-01T09:00:00.000Z"),
      endDate: new Date("2026-08-02T09:00:00.000Z"),
      totalPrice: 100,
      driverAge: 30,
      status: "completed",
      statusHistory: [
        { status: "completed", changedAt: "2026-08-18T11:00:00.000Z" },
      ],
      refund: {
        status: "completed",
        processedAt: "2026-08-18T10:00:00.000Z",
        refundAmount: 75,
        depositPaid: 100,
        deductionsTotal: 25,
      },
    });
    expect(journey.nextAction.type).toBe("none");
    expect(journey.nextAction.buttonLabel).toBeUndefined();
    expect(journey.completedAt).toBe("2026-08-18T11:00:00.000Z");
    expect(journey.refund?.bankExpectedBy).toBe("2026-08-21T10:00:00.000Z");
  });
});
