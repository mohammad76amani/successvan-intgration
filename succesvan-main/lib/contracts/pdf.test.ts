import { describe, expect, it, vi } from "vitest";
import { writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { generateRentalAgreementPdf } from "./pdf";

vi.mock("server-only", () => ({}));

describe("rental agreement PDF", () => {
  it("inserts the supplemental terms before the unchanged signature page", async () => {
    const result = await generateRentalAgreementPdf({
      contractNumber: "260905-1",
      createdAt: new Date("2026-09-05T10:00:00Z"),
      reservation: {
        reservationCode: "SVH-TEST",
        startDate: "2026-09-08T09:00:00Z",
        endDate: "2026-09-10T09:00:00Z",
        totalPrice: 301,
        handoverDepositAmount: 300,
        user: {
          name: "Test",
          lastName: "Customer",
          emaildata: { emailAddress: "customer@example.com" },
          licenceDetails: {
            isFrontSide: true,
            fullName: "Test Licence Customer",
            licenceNumber: "TEST123456",
          },
        },
        category: {
          name: "Short Wheel Base",
          deposit: { handoverDepositPrice: 300 },
        },
        vehicle: {
          title: "Transit Custom",
          make: "Ford",
          number: "AB12 CDE",
          color: "White",
        },
      },
    });

    const document = await PDFDocument.load(result.buffer);
    if (process.env.CONTRACT_PREVIEW_PATH) {
      await writeFile(process.env.CONTRACT_PREVIEW_PATH, result.buffer);
    }
    expect(document.getPageCount()).toBe(4);
    expect(result.fileName).toBe("260905-1-source-agreement.pdf");
    expect(result.sha256).toHaveLength(64);
  });
});
