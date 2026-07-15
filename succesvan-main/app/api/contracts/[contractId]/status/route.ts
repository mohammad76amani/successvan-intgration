import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireCustomerAuth } from "@/lib/contracts/access";
import {
  getCustomerContract,
  refreshContractStatus,
} from "@/lib/contracts/service";
import { errorStatus, safeErrorMessage } from "@/lib/docusign/errors";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> },
) {
  try {
    const auth = requireCustomerAuth(req);
    const { contractId } = await params;
    const { searchParams } = new URL(req.url);

    // Ownership check happens here; only refresh envelopes that exist.
    let contract = await getCustomerContract(contractId, auth.userId);
    if (searchParams.get("refresh") === "true" && contract.docusign?.envelopeId) {
      await refreshContractStatus(contractId, {
        actorId: auth.userId,
        source: "customer",
      });
      contract = await getCustomerContract(contractId, auth.userId);
    }
    return successResponse(contract);
  } catch (error) {
    return errorResponse(safeErrorMessage(error), errorStatus(error));
  }
}
