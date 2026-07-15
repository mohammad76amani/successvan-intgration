import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import {
  parseDocuSignConnectPayload,
  verifyDocuSignHmac,
} from "@/lib/docusign/webhook";
import { processDocuSignConnectEvent } from "@/lib/contracts/service";
import { errorStatus, safeErrorMessage } from "@/lib/docusign/errors";

export const runtime = "nodejs";

function collectSignatures(req: NextRequest) {
  const signatures: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const signature = req.headers.get(`x-docusign-signature-${i}`);
    if (signature) signatures.push(signature);
  }
  return signatures;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = Buffer.from(await req.arrayBuffer());

    if (!verifyDocuSignHmac(rawBody, collectSignatures(req))) {
      return errorResponse("Invalid webhook signature.", 401);
    }

    const event = parseDocuSignConnectPayload(rawBody);
    const result = await processDocuSignConnectEvent(event);
    return successResponse(result);
  } catch (error) {
    return errorResponse(safeErrorMessage(error), errorStatus(error));
  }
}
