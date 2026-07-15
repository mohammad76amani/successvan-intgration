import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAdminAuth } from "@/lib/contracts/access";
import { getAdminContract } from "@/lib/contracts/service";
import { errorStatus, safeErrorMessage } from "@/lib/docusign/errors";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> },
) {
  try {
    requireAdminAuth(req);
    const { contractId } = await params;
    return successResponse(await getAdminContract(contractId));
  } catch (error) {
    return errorResponse(safeErrorMessage(error), errorStatus(error));
  }
}
