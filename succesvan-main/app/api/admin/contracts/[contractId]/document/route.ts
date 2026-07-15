import { NextRequest } from "next/server";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { canAccessDashboard } from "@/lib/roles";
import { ContractIntegrationError } from "@/lib/docusign/errors";
import { getContractDocument } from "@/lib/contracts/service";
import { errorResponse } from "@/lib/api-response";
import { errorStatus, safeErrorMessage } from "@/lib/docusign/errors";

export const runtime = "nodejs";

const documentKindSchema = z.enum(["source", "signed", "certificate"]);

function requireAdminFromRequest(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const queryToken = searchParams.get("token");
  const headerToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const token = queryToken || headerToken;
  if (!token) throw new ContractIntegrationError("CONTRACT_ACCESS_DENIED", "Unauthorized", 401);
  try {
    const payload = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!) as { userId: string; role: string };
    if (!canAccessDashboard(payload.role)) {
      throw new ContractIntegrationError("CONTRACT_ACCESS_DENIED", "Admin access is required.", 403);
    }
    return payload;
  } catch (e) {
    if (e instanceof ContractIntegrationError) throw e;
    throw new ContractIntegrationError("CONTRACT_ACCESS_DENIED", "Unauthorized", 401);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> },
) {
  try {
    requireAdminFromRequest(req);
    const { contractId } = await params;
    const { searchParams } = new URL(req.url);
    const kind = documentKindSchema.parse(searchParams.get("type") || "source");
    const document = await getContractDocument(contractId, null, kind);
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
