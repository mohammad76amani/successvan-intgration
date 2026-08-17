import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAdminAuth } from "@/lib/contracts/access";
import {
  createReservationExtensionContract,
  previewReservationExtension,
} from "@/lib/contracts/service";
import {
  ContractIntegrationError,
  errorStatus,
  safeErrorMessage,
} from "@/lib/docusign/errors";
import { createLondonDateTimeFromStorage } from "@/lib/englandTime";

export const runtime = "nodejs";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const extensionSchema = z.object({
  newReturnDate: z.string().regex(datePattern, "Enter a valid return date"),
  newReturnTime: z.string().regex(timePattern, "Enter a valid return time"),
  customPrice: z.number().min(0).optional(),
  customPriceReason: z.string().trim().optional(),
  paymentDueAt: z.string().trim().optional(),
  paymentMethod: z.string().trim().max(80).optional(),
  paymentReference: z.string().trim().max(120).optional(),
  lessorName: z.string().trim().max(120).optional(),
});

function returnDateTime(dateValue: string, timeValue: string) {
  try {
    return createLondonDateTimeFromStorage(dateValue, timeValue);
  } catch {
    throw new ContractIntegrationError(
      "BOOKING_MISSING_REQUIRED_DATA",
      "Enter a valid London return date and time",
      400,
    );
  }
}

function paymentDueDateTime(value?: string) {
  if (!value) return undefined;
  if (datePattern.test(value)) {
    try {
      return createLondonDateTimeFromStorage(value, "23:59");
    } catch {
      throw new ContractIntegrationError(
        "BOOKING_MISSING_REQUIRED_DATA",
        "Enter a valid payment due date",
        400,
      );
    }
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ContractIntegrationError(
      "BOOKING_MISSING_REQUIRED_DATA",
      "Enter a valid payment due date",
      400,
    );
  }
  return date.toISOString();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireAdminAuth(req);
    const { id } = await params;
    const url = new URL(req.url);
    const values = extensionSchema.pick({
      newReturnDate: true,
      newReturnTime: true,
    }).parse({
      newReturnDate: url.searchParams.get("newReturnDate"),
      newReturnTime: url.searchParams.get("newReturnTime"),
    });
    const preview = await previewReservationExtension(
      id,
      returnDateTime(values.newReturnDate, values.newReturnTime),
    );
    return successResponse(preview);
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : errorStatus(error);
    return errorResponse(safeErrorMessage(error), status);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAdminAuth(req);
    const { id } = await params;
    const body = extensionSchema.parse(await req.json());
    const contract = await createReservationExtensionContract(
      id,
      { actorId: auth.userId, source: "admin" },
      {
        newReturnDateTime: returnDateTime(
          body.newReturnDate,
          body.newReturnTime,
        ),
        customPrice: body.customPrice,
        customPriceReason: body.customPriceReason,
        paymentDueAt: paymentDueDateTime(body.paymentDueAt),
        paymentMethod: body.paymentMethod,
        paymentReference: body.paymentReference,
        lessorName: body.lessorName,
      },
      true,
    );
    return successResponse(contract, 201);
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : errorStatus(error);
    return errorResponse(safeErrorMessage(error), status);
  }
}
