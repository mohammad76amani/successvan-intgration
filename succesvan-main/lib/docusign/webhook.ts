import crypto from "node:crypto";
import { getDocuSignEnv } from "@/lib/env/server-env";
import { ContractIntegrationError } from "./errors";
import type { DocuSignConnectEvent } from "./types";

export function verifyDocuSignHmac(
  rawBody: Buffer,
  signatures: string[],
  secret = getDocuSignEnv().DOCUSIGN_CONNECT_HMAC_SECRET,
) {
  if (!secret || !signatures.length) return false;

  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");
  const expected = Buffer.from(digest, "utf8");

  return signatures.some((signature) => {
    const candidate = Buffer.from(signature.trim(), "utf8");
    return (
      candidate.byteLength === expected.byteLength &&
      crypto.timingSafeEqual(candidate, expected)
    );
  });
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readDate(value: unknown) {
  const raw = readString(value);
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function readCustomField(payload: Record<string, unknown>, name: string) {
  const customFields =
    payload.data &&
    typeof payload.data === "object" &&
    "customFields" in payload.data
      ? (payload.data as Record<string, unknown>).customFields
      : undefined;

  const textFields =
    customFields &&
    typeof customFields === "object" &&
    "textCustomFields" in customFields
      ? (customFields as Record<string, unknown>).textCustomFields
      : undefined;

  if (Array.isArray(textFields)) {
    const match = textFields.find(
      (field) =>
        field &&
        typeof field === "object" &&
        readString((field as Record<string, unknown>).name) === name,
    ) as Record<string, unknown> | undefined;
    return readString(match?.value);
  }

  return undefined;
}

export function parseDocuSignConnectPayload(
  rawBody: Buffer,
): DocuSignConnectEvent {
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>;
  } catch {
    throw new ContractIntegrationError(
      "DOCUSIGN_WEBHOOK_INVALID_PAYLOAD",
      "DocuSign Connect webhook must be configured to send JSON payloads.",
      400,
    );
  }

  const data =
    payload.data && typeof payload.data === "object"
      ? (payload.data as Record<string, unknown>)
      : {};
  const envelopeSummary =
    data.envelopeSummary && typeof data.envelopeSummary === "object"
      ? (data.envelopeSummary as Record<string, unknown>)
      : {};

  const eventType =
    readString(payload.event) ||
    readString(payload.eventType) ||
    readString(data.event) ||
    "unknown";
  const envelopeId =
    readString(data.envelopeId) ||
    readString(payload.envelopeId) ||
    readString(envelopeSummary.envelopeId);
  const envelopeStatus =
    readString(data.status) ||
    readString(payload.status) ||
    readString(envelopeSummary.status) ||
    eventType.replace(/^envelope-/, "");

  return {
    eventId:
      readString(payload.eventId) ||
      readString(payload.id) ||
      readString(data.eventId),
    eventType,
    envelopeId,
    envelopeStatus,
    occurredAt:
      readDate(data.statusChangedDateTime) ||
      readDate(envelopeSummary.statusChangedDateTime) ||
      readDate(payload.generatedDateTime),
    contractId: readCustomField(payload, "contractId"),
    bookingId: readCustomField(payload, "bookingId"),
    declineReason:
      readString(envelopeSummary.declinedReason) ||
      readString(data.declineReason),
    voidReason:
      readString(envelopeSummary.voidedReason) || readString(data.voidReason),
  };
}
