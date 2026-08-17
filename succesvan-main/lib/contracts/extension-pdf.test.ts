import { describe, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { generateReservationExtensionPdf } from "./extension-pdf";

vi.mock("server-only", () => ({}));

describe("reservation extension PDF", () => {
  it("fills the supplied two-page agreement template", async () => {
    const result = await generateReservationExtensionPdf({
      contractNumber: "260817-1",
      createdAt: new Date("2026-08-17T10:30:00Z"),
      originalContractNumber: "260810-2",
      originalContractCreatedAt: "2026-08-10T09:00:00Z",
      reservation: {
        reservationCode: "SVH-TEST",
        user: {
          name: "Test",
          lastName: "Customer",
          phoneData: { phoneNumber: "+44 7700 900123" },
          licenceDetails: {
            isFrontSide: true,
            fullName: "Test Licence Customer",
            licenceNumber: "TEST123456",
          },
        },
        category: { name: "Long Wheel Base Van" },
        vehicle: { make: "Ford", title: "Transit", number: "AB26 XYZ" },
      },
      extension: {
        previousReturnDateTime: "2026-08-18T09:00:00Z",
        newReturnDateTime: "2026-08-20T15:00:00Z",
        durationHours: 54,
        durationLabel: "2 days 6 hours",
        calculatedPrice: 250,
        agreedPrice: 225,
        customPriceApplied: true,
        paymentMethod: "Pay at office",
      },
    });

    const document = await PDFDocument.load(result.buffer);
    expect(document.getPageCount()).toBe(2);
    expect(result.fileName).toContain("260817-1");
    expect(result.mimeType).toBe("application/pdf");
    expect(result.sha256).toHaveLength(64);
  });
});
