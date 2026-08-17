import "server-only";

import type { Types } from "mongoose";
import { getDocuSignApiClient } from "./client";
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

  const positioned = (pageNumber: string, x: string, y: string) => ({
    documentId: "1",
    pageNumber,
    xPosition: x,
    yPosition: y,
  });
  const signHereTabs = [
    // Authorised-driver declaration on page 2.
    fromObject(docusign.SignHere, {
      ...positioned("2", "266", "363"),
      scaleValue: "0.35",
    }),
    // PCN / TfL liability acknowledgement on page 3.
    fromObject(docusign.SignHere, {
      ...positioned("3", "170", "98"),
      scaleValue: "0.3",
    }),
    // Final General Declaration signature on page 3.
    fromObject(docusign.SignHere, {
      ...positioned("3", "170", "231"),
      scaleValue: "0.35",
    }),
  ];
  const dateSignedTabs = [
    fromObject(docusign.DateSigned, {
      ...positioned("2", "450", "374"),
      fontSize: "Size7",
      width: "68",
    }),
    fromObject(docusign.DateSigned, {
      ...positioned("3", "435", "81"),
      fontSize: "Size7",
      width: "100",
    }),
    fromObject(docusign.DateSigned, {
      ...positioned("3", "170", "267"),
      fontSize: "Size7",
      width: "100",
    }),
  ];
  const initialHereTabs = [
    fromObject(docusign.InitialHere, {
      ...positioned("2", "262", "294"),
      scaleValue: "0.5",
    }),
  ];

  const signer = fromObject(docusign.Signer, {
    email: input.customerEmail,
    name: input.customerName,
    recipientId: input.signerRecipientId,
    clientUserId: input.signerClientUserId,
    routingOrder: "1",
    tabs: fromObject(docusign.Tabs, {
      signHereTabs,
      dateSignedTabs,
      initialHereTabs,
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

export function buildReservationExtensionEnvelope(
  input: EnvelopeContractInput,
) {
  const docusign = getDocuSignSdk();
  const document = fromObject(docusign.Document, {
    documentBase64: input.sourcePdf.toString("base64"),
    name: `Hire Extension Confirmation ${input.contractNumber}`,
    fileExtension: "pdf",
    documentId: "1",
  });
  const signer = fromObject(docusign.Signer, {
    email: input.customerEmail,
    name: input.customerName,
    recipientId: input.signerRecipientId,
    clientUserId: input.signerClientUserId,
    routingOrder: "1",
    tabs: fromObject(docusign.Tabs, {
      signHereTabs: [
        fromObject(docusign.SignHere, {
          documentId: "1",
          pageNumber: "2",
          xPosition: "315",
          yPosition: "184",
          scaleValue: "0.38",
        }),
      ],
    }),
  });

  return fromObject(docusign.EnvelopeDefinition, {
    emailSubject: `Success Van Hire extension confirmation ${input.contractNumber}`,
    emailBlurb:
      "Please review and sign your Success Van Hire extension confirmation. Signing confirms the new return date and extension charge.",
    documents: [document],
    recipients: fromObject(docusign.Recipients, { signers: [signer] }),
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
        fromObject(docusign.TextCustomField, {
          name: "contractType",
          value: "reservation_extension",
          show: "false",
        }),
      ],
    }),
    status: "sent",
  });
}

export async function createReservationExtensionEnvelope(
  input: EnvelopeContractInput,
) {
  const { accountId, envelopesApi } = await getDocuSignApiClient();
  try {
    const summary = await envelopesApi.createEnvelope(accountId, {
      envelopeDefinition: buildReservationExtensionEnvelope(input),
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
