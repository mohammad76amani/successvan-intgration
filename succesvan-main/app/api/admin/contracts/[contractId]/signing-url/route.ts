import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAdminAuth } from "@/lib/contracts/access";
import { createContractSigningUrl, getAdminContract } from "@/lib/contracts/service";
import { errorStatus, safeErrorMessage } from "@/lib/docusign/errors";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> },
) {
  try {
    const auth = requireAdminAuth(req);
    const { contractId } = await params;
    const body = await req.json().catch(() => ({}));
    const contract = await getAdminContract(contractId);
    const returnUrl =
      typeof body?.returnUrl === "string" && body.returnUrl.trim()
        ? body.returnUrl.trim()
        : undefined;

    return successResponse(
      await createContractSigningUrl(
        contractId,
        String(contract.customerId || ""),
        { returnUrl, adminActorId: auth.userId },
      ),
    );
  } catch (error) {
    return errorResponse(safeErrorMessage(error), errorStatus(error));
  }
}
