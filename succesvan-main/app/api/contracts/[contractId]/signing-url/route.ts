import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireCustomerAuth } from "@/lib/contracts/access";
import { createContractSigningUrl } from "@/lib/contracts/service";
import { errorStatus, safeErrorMessage } from "@/lib/docusign/errors";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> },
) {
  try {
    const auth = requireCustomerAuth(req);
    const { contractId } = await params;
    return successResponse(
      await createContractSigningUrl(contractId, auth.userId),
    );
  } catch (error) {
    return errorResponse(safeErrorMessage(error), errorStatus(error));
  }
}
