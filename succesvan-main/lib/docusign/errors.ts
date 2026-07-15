export type DocuSignErrorCode =
  | "DOCUSIGN_NOT_CONFIGURED"
  | "DOCUSIGN_CONSENT_REQUIRED"
  | "DOCUSIGN_AUTH_FAILED"
  | "DOCUSIGN_ENVELOPE_CREATE_FAILED"
  | "DOCUSIGN_ENVELOPE_NOT_FOUND"
  | "DOCUSIGN_SIGNING_VIEW_FAILED"
  | "DOCUSIGN_WEBHOOK_INVALID_SIGNATURE"
  | "DOCUSIGN_WEBHOOK_INVALID_PAYLOAD"
  | "DOCUSIGN_DOCUMENT_DOWNLOAD_FAILED"
  | "CONTRACT_NOT_FOUND"
  | "CONTRACT_ACCESS_DENIED"
  | "CONTRACT_ALREADY_SENT"
  | "CONTRACT_ALREADY_COMPLETED"
  | "CONTRACT_NOT_SIGNABLE"
  | "BOOKING_NOT_FOUND"
  | "BOOKING_MISSING_REQUIRED_DATA";

export class ContractIntegrationError extends Error {
  code: DocuSignErrorCode;
  status: number;

  constructor(code: DocuSignErrorCode, message: string, status = 400) {
    super(message);
    this.name = "ContractIntegrationError";
    this.code = code;
    this.status = status;
  }
}

export function safeErrorMessage(error: unknown) {
  if (error instanceof ContractIntegrationError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected server error";
}

export function errorStatus(error: unknown) {
  return error instanceof ContractIntegrationError ? error.status : 500;
}

function extractDocuSignErrorText(error: unknown): string {
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>;
    const res = e.response as Record<string, unknown> | undefined;

    // axios: error.response.data
    if (res?.data) {
      const d = res.data;
      if (typeof d === "string") return d;
      if (typeof d === "object") return JSON.stringify(d);
    }
    // superagent: error.response.text / error.response.body
    if (typeof res?.text === "string") return res.text;
    if (res?.body) return JSON.stringify(res.body);
    // plain Error or SDK error with .message
    if (typeof e.message === "string") return e.message;
  }
  if (error instanceof Error) return error.message;
  return "DocuSign request failed";
}

export function normalizeDocuSignSdkError(error: unknown) {
  const raw = extractDocuSignErrorText(error);
  const lower = raw.toLowerCase();

  console.error("[DocuSign] SDK error:", raw);

  if (
    lower.includes("consent_required") ||
    lower.includes("consent is required") ||
    lower.includes("unauthorized_client")
  ) {
    return new ContractIntegrationError(
      "DOCUSIGN_CONSENT_REQUIRED",
      "DocuSign JWT consent has not been granted. Visit the consent URL to authorise the app.",
      403,
    );
  }

  if (
    lower.includes("invalid_grant") ||
    lower.includes("invalid_client") ||
    lower.includes("access_denied")
  ) {
    return new ContractIntegrationError(
      "DOCUSIGN_AUTH_FAILED",
      `DocuSign authentication failed: ${raw.slice(0, 200)}`,
      502,
    );
  }

  return new ContractIntegrationError(
    "DOCUSIGN_AUTH_FAILED",
    `DocuSign request failed: ${raw.slice(0, 200)}`,
    502,
  );
}
