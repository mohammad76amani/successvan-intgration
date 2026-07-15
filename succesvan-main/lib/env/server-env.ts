import "server-only";

import { ContractIntegrationError } from "@/lib/docusign/errors";

export type ServerEnv = {
  CONTRACT_STORAGE_PROVIDER: "local" | "s3";
  CONTRACT_LOCAL_STORAGE_DIR: string;
  S3_BUCKET?: string;
  S3_REGION?: string;
  NEXT_PUBLIC_S3_REGION?: string;
  ACCESS_KEY_ID?: string;
  SECRET_ACCESS_KEY?: string;
};

export type DocuSignEnv = {
  DOCUSIGN_INTEGRATION_KEY: string;
  DOCUSIGN_USER_ID: string;
  DOCUSIGN_ACCOUNT_ID: string;
  DOCUSIGN_OAUTH_BASE_PATH: string;
  DOCUSIGN_API_BASE_PATH: string;
  DOCUSIGN_REDIRECT_URI: string;
  DOCUSIGN_SIGNING_RETURN_URL: string;
  DOCUSIGN_CONNECT_HMAC_SECRET: string;
  scopes: string[];
  privateKey: string;
};

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function requireEnv(name: string) {
  const value = readEnv(name);
  if (!value) {
    throw new ContractIntegrationError(
      "DOCUSIGN_NOT_CONFIGURED",
      `Missing required environment variable ${name}.`,
      500,
    );
  }
  return value;
}

// .env stores the RSA key on one line with literal \n escapes (and the
// value may arrive wrapped in quotes on some hosts) — normalize both.
function normalizePrivateKey(raw: string) {
  const key = raw.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n").trim();
  if (!key.includes("-----BEGIN")) {
    throw new ContractIntegrationError(
      "DOCUSIGN_NOT_CONFIGURED",
      "DOCUSIGN_PRIVATE_KEY does not look like a PEM private key.",
      500,
    );
  }
  return key;
}

export function getServerEnv(): ServerEnv {
  return {
    CONTRACT_STORAGE_PROVIDER:
      readEnv("CONTRACT_STORAGE_PROVIDER") === "s3" ? "s3" : "local",
    CONTRACT_LOCAL_STORAGE_DIR:
      readEnv("CONTRACT_LOCAL_STORAGE_DIR") || "private/contracts",
    S3_BUCKET: readEnv("S3_BUCKET"),
    S3_REGION: readEnv("S3_REGION"),
    NEXT_PUBLIC_S3_REGION: readEnv("NEXT_PUBLIC_S3_REGION"),
    ACCESS_KEY_ID: readEnv("ACCESS_KEY_ID"),
    SECRET_ACCESS_KEY: readEnv("SECRET_ACCESS_KEY"),
  };
}

export function getDocuSignEnv(): DocuSignEnv {
  return {
    DOCUSIGN_INTEGRATION_KEY: requireEnv("DOCUSIGN_INTEGRATION_KEY"),
    DOCUSIGN_USER_ID: requireEnv("DOCUSIGN_USER_ID"),
    DOCUSIGN_ACCOUNT_ID: requireEnv("DOCUSIGN_ACCOUNT_ID"),
    DOCUSIGN_OAUTH_BASE_PATH:
      readEnv("DOCUSIGN_OAUTH_BASE_PATH") || "account-d.docusign.com",
    DOCUSIGN_API_BASE_PATH:
      readEnv("DOCUSIGN_API_BASE_PATH") || "https://demo.docusign.net/restapi",
    DOCUSIGN_REDIRECT_URI: requireEnv("DOCUSIGN_REDIRECT_URI"),
    DOCUSIGN_SIGNING_RETURN_URL: requireEnv("DOCUSIGN_SIGNING_RETURN_URL"),
    DOCUSIGN_CONNECT_HMAC_SECRET: requireEnv("DOCUSIGN_CONNECT_HMAC_SECRET"),
    scopes: (readEnv("DOCUSIGN_SCOPES") || "signature impersonation")
      .split(/[\s,]+/)
      .filter(Boolean),
    privateKey: normalizePrivateKey(requireEnv("DOCUSIGN_PRIVATE_KEY")),
  };
}
