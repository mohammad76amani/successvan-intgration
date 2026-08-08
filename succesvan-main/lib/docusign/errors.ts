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
    const res = e.response as
      | {
          status?: number;
          data?: unknown;
          text?: unknown;
          body?: unknown;
        }
      | undefined;

    // axios: error.response.data
    if (res?.data) {
      const d = res.data;
      const text = typeof d === "string" ? d : JSON.stringify(d);
      return res.status ? `${res.status}: ${text}` : text;
    }
    // superagent: error.response.text / error.response.body
    if (typeof res?.text === "string") {
      return res.status ? `${res.status}: ${res.text}` : res.text;
    }
    if (res?.body) {
      const text = JSON.stringify(res.body);
      return res.status ? `${res.status}: ${text}` : text;
    }
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
    lower.includes("access_denied") ||
    (lower.includes("444") &&
      lower.includes("custom error module"))
  ) {
    return new ContractIntegrationError(
      "DOCUSIGN_AUTH_FAILED",
      lower.includes("444")
        ? "DocuSign JWT authentication was rejected. Check DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID, DOCUSIGN_PRIVATE_KEY, consent, and sandbox/production account settings in .env."
        : `DocuSign authentication failed: ${raw.slice(0, 200)}`,
      502,
    );
  }

  return new ContractIntegrationError(
    "DOCUSIGN_AUTH_FAILED",
    `DocuSign request failed: ${raw.slice(0, 200)}`,
    502,
  );
}
