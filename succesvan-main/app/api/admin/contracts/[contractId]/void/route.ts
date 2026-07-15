import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAdminAuth } from "@/lib/contracts/access";
import { voidContract } from "@/lib/contracts/service";
import { errorStatus, safeErrorMessage } from "@/lib/docusign/errors";

export const runtime = "nodejs";

const voidSchema = z.object({
  reason: z.string().min(3).max(500),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> },
) {
  try {
    const auth = requireAdminAuth(req);
    const { contractId } = await params;
    const body = voidSchema.parse(await req.json());
    return successResponse(
      await voidContract(contractId, body.reason, {
        actorId: auth.userId,
        source: "admin",
      }),
    );
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : errorStatus(error);
    return errorResponse(safeErrorMessage(error), status);
  }
}
