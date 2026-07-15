import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAdminAuth } from "@/lib/contracts/access";
import { sendContract } from "@/lib/contracts/service";
import { errorStatus, safeErrorMessage } from "@/lib/docusign/errors";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> },
) {
  try {
    const auth = requireAdminAuth(req);
    const { contractId } = await params;
    return successResponse(
      await sendContract(contractId, { actorId: auth.userId, source: "admin" }),
    );
  } catch (error) {
    return errorResponse(safeErrorMessage(error), errorStatus(error));
  }
}
