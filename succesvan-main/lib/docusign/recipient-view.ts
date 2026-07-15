import "server-only";

import { getDocuSignEnv } from "@/lib/env/server-env";
import { getDocuSignApiClient } from "./client";
import { ContractIntegrationError, normalizeDocuSignSdkError } from "./errors";
import { getDocuSignSdk } from "./sdk";

export type RecipientViewInput = {
  envelopeId: string;
  contractId: string;
  signerName: string;
  signerEmail: string;
  signerRecipientId: string;
  signerClientUserId: string;
};

export async function createEmbeddedSigningUrl(input: RecipientViewInput) {
  const { accountId, envelopesApi } = await getDocuSignApiClient();
  const env = getDocuSignEnv();
  const docusign = getDocuSignSdk();
  const returnUrl = new URL(env.DOCUSIGN_SIGNING_RETURN_URL);
  returnUrl.searchParams.set("contractId", input.contractId);

  const recipientViewRequest = docusign.RecipientViewRequest.constructFromObject({
    returnUrl: returnUrl.toString(),
    authenticationMethod: "none",
    email: input.signerEmail,
    userName: input.signerName,
    recipientId: input.signerRecipientId,
    clientUserId: input.signerClientUserId,
  });

  try {
    const view = await envelopesApi.createRecipientView(
      accountId,
      input.envelopeId,
      { recipientViewRequest },
    );
    if (!view.url) {
      throw new ContractIntegrationError(
        "DOCUSIGN_SIGNING_VIEW_FAILED",
        "DocuSign did not return a signing URL.",
        502,
      );
    }
    return view.url;
  } catch (error) {
    if (error instanceof ContractIntegrationError) throw error;
    throw normalizeDocuSignSdkError(error);
  }
}
