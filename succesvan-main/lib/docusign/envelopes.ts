import "server-only";

import type { Types } from "mongoose";
import { getDocuSignApiClient } from "./client";
import { contractPdfAnchors } from "@/lib/contracts/pdf";
import { ContractIntegrationError, normalizeDocuSignSdkError } from "./errors";
import { getDocuSignSdk } from "./sdk";

export type EnvelopeContractInput = {
  id: string;
  bookingId: string;
  contractNumber: string;
  customerName: string;
  customerEmail: string;
  sourcePdf: Buffer;
  signerRecipientId: string;
  signerClientUserId: string;
};

type ConstructableDocuSignModel = {
  constructFromObject(data: Record<string, unknown>): Record<string, unknown>;
};

function fromObject(
  ctor: ConstructableDocuSignModel,
  data: Record<string, unknown>,
) {
  return ctor.constructFromObject(data);
}

export function buildRentalAgreementEnvelope(input: EnvelopeContractInput) {
  const docusign = getDocuSignSdk();
  const document = fromObject(docusign.Document, {
    documentBase64: input.sourcePdf.toString("base64"),
    name: `Rental Agreement ${input.contractNumber}`,
    fileExtension: "pdf",
    documentId: "1",
  });

  const signHere = fromObject(docusign.SignHere, {
    anchorString: contractPdfAnchors.signatureAnchor,
    anchorUnits: "pixels",
    anchorYOffset: "8",
    anchorXOffset: "0",
    scaleValue: "0.45",
  });

  const fullName = fromObject(docusign.FullName, {
    anchorString: contractPdfAnchors.nameAnchor,
    anchorUnits: "pixels",
    anchorYOffset: "0",
    anchorXOffset: "0",
    fontSize: "Size8",
    width: "150",
  });

  const dateSigned = fromObject(docusign.DateSigned, {
    anchorString: contractPdfAnchors.dateAnchor,
    anchorUnits: "pixels",
    anchorYOffset: "0",
    anchorXOffset: "0",
    fontSize: "Size8",
    width: "90",
  });

  const signer = fromObject(docusign.Signer, {
    email: input.customerEmail,
    name: input.customerName,
    recipientId: input.signerRecipientId,
    clientUserId: input.signerClientUserId,
    routingOrder: "1",
    tabs: fromObject(docusign.Tabs, {
      signHereTabs: [signHere],
      fullNameTabs: [fullName],
      dateSignedTabs: [dateSigned],
    }),
  });

  return fromObject(docusign.EnvelopeDefinition, {
    emailSubject: `Success Van Hire rental agreement ${input.contractNumber}`,
    emailBlurb:
      "Please review and sign your Success Van Hire rental agreement. You can complete signing securely from your customer dashboard.",
    documents: [document],
    recipients: fromObject(docusign.Recipients, {
      signers: [signer],
    }),
    customFields: fromObject(docusign.CustomFields, {
      textCustomFields: [
        fromObject(docusign.TextCustomField, {
          name: "contractId",
          value: input.id,
          show: "false",
        }),
        fromObject(docusign.TextCustomField, {
          name: "bookingId",
          value: input.bookingId,
          show: "false",
        }),
        fromObject(docusign.TextCustomField, {
          name: "contractNumber",
          value: input.contractNumber,
          show: "false",
        }),
      ],
    }),
    status: "sent",
  });
}

export async function createRentalAgreementEnvelope(
  input: EnvelopeContractInput,
) {
  const { accountId, envelopesApi } = await getDocuSignApiClient();
  const envelopeDefinition = buildRentalAgreementEnvelope(input);

  try {
    const summary = await envelopesApi.createEnvelope(accountId, {
      envelopeDefinition,
    });

    if (!summary.envelopeId) {
      throw new ContractIntegrationError(
        "DOCUSIGN_ENVELOPE_CREATE_FAILED",
        "DocuSign did not return an envelope ID.",
        502,
      );
    }

    return {
      accountId,
      envelopeId: summary.envelopeId,
      envelopeStatus: summary.status || "sent",
      statusDateTime: summary.statusDateTime,
    };
  } catch (error) {
    if (error instanceof ContractIntegrationError) throw error;
    throw normalizeDocuSignSdkError(error);
  }
}

export async function resendRentalAgreementEnvelope(
  envelopeId: string,
  reason?: string,
) {
  const { accountId, envelopesApi } = await getDocuSignApiClient();
  await envelopesApi.update(accountId, envelopeId, {
    envelope: { status: "sent", emailBlurb: reason },
    resendEnvelope: "true",
  });
}

export async function voidRentalAgreementEnvelope(
  envelopeId: string,
  reason: string,
) {
  const { accountId, envelopesApi } = await getDocuSignApiClient();
  await envelopesApi.update(accountId, envelopeId, {
    envelope: { status: "voided", voidedReason: reason },
  });
}

export function makeSignerClientUserId(contractId: string | Types.ObjectId) {
  return `svh-contract-${String(contractId)}`;
}
