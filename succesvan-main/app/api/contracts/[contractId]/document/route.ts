import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/api-response";
import { requireCustomerAuth } from "@/lib/contracts/access";
import { getContractDocument } from "@/lib/contracts/service";
import { errorStatus, safeErrorMessage } from "@/lib/docusign/errors";

export const runtime = "nodejs";

const documentKindSchema = z.enum(["source", "signed", "certificate"]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> },
) {
  try {
    const auth = requireCustomerAuth(req);
    const { contractId } = await params;
    const { searchParams } = new URL(req.url);
    const kind = documentKindSchema.parse(searchParams.get("type") || "signed");
    const document = await getContractDocument(contractId, auth.userId, kind);
    return new Response(new Uint8Array(document.buffer), {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `attachment; filename="${document.fileName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : errorStatus(error);
    return errorResponse(safeErrorMessage(error), status);
  }
}
