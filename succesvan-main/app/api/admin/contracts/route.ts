import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAdminAuth } from "@/lib/contracts/access";
import {
  createContractForBooking,
  listAdminContracts,
} from "@/lib/contracts/service";
import { errorStatus, safeErrorMessage } from "@/lib/docusign/errors";

export const runtime = "nodejs";

const createContractSchema = z.object({
  bookingId: z.string().min(1),
  sendNow: z.boolean().optional().default(false),
  insuranceProvider: z.enum(["diba", "customer"]),
  insuranceOtherExcess: z.string().trim().optional(),
  handoverDepositAmount: z.number().min(0).optional(),
});

export async function GET(req: NextRequest) {
  try {
    requireAdminAuth(req);
    const { searchParams } = new URL(req.url);
    const result = await listAdminContracts({
      status: searchParams.get("status"),
      customer: searchParams.get("customer"),
      bookingId: searchParams.get("bookingId"),
      page: Number(searchParams.get("page") || 1),
      limit: Number(searchParams.get("limit") || 15),
    });
    return successResponse(result);
  } catch (error) {
    return errorResponse(safeErrorMessage(error), errorStatus(error));
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAdminAuth(req);
    const body = createContractSchema.parse(await req.json());
    const contract = await createContractForBooking(
      body.bookingId,
      { actorId: auth.userId, source: "admin" },
      body.sendNow,
      {
        insuranceProvider: body.insuranceProvider,
        insuranceOtherExcess: body.insuranceOtherExcess,
        handoverDepositAmount: body.handoverDepositAmount,
      },
    );
    return successResponse(contract, 201);
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : errorStatus(error);
    return errorResponse(safeErrorMessage(error), status);
  }
}
