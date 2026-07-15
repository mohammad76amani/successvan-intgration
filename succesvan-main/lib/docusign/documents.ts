import "server-only";

import { getDocuSignApiClient } from "./client";
import { ContractIntegrationError, normalizeDocuSignSdkError } from "./errors";

function toBuffer(value: Buffer | ArrayBuffer | Uint8Array | string) {
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === "string") return Buffer.from(value, "binary");
  if (value instanceof ArrayBuffer) return Buffer.from(value);
  return Buffer.from(value);
}

export async function getEnvelopeMetadata(envelopeId: string) {
  const { accountId, envelopesApi } = await getDocuSignApiClient();
  try {
    return envelopesApi.getEnvelope(accountId, envelopeId);
  } catch (error) {
    throw normalizeDocuSignSdkError(error);
  }
}

export async function downloadEnvelopeDocument(
  envelopeId: string,
  documentId: "combined" | "certificate" | string,
) {
  const { accountId, envelopesApi } = await getDocuSignApiClient();
  try {
    return toBuffer(await envelopesApi.getDocument(accountId, envelopeId, documentId));
  } catch (error) {
    if (error instanceof ContractIntegrationError) throw error;
    throw new ContractIntegrationError(
      "DOCUSIGN_DOCUMENT_DOWNLOAD_FAILED",
      "Could not download the signed DocuSign document.",
      502,
    );
  }
}
