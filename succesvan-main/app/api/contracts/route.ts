import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireCustomerAuth } from "@/lib/contracts/access";
import { listCustomerContracts } from "@/lib/contracts/service";
import { errorStatus, safeErrorMessage } from "@/lib/docusign/errors";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const auth = requireCustomerAuth(req);
    const { searchParams } = new URL(req.url);
    const contracts = await listCustomerContracts(auth.userId, {
      bookingId: searchParams.get("bookingId"),
    });
    return successResponse(contracts);
  } catch (error) {
    return errorResponse(safeErrorMessage(error), errorStatus(error));
  }
}
