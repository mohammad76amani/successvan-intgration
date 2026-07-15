import "server-only";

import { getDocuSignEnv } from "@/lib/env/server-env";
import {
  ContractIntegrationError,
  normalizeDocuSignSdkError,
} from "./errors";
import { getDocuSignSdk } from "./sdk";

const tokenSafetyBufferMs = 5 * 60 * 1000;
const jwtTokenLifetimeSeconds = 60 * 60;

type CachedToken = {
  accessToken: string;
  expiresAt: number;
  basePath: string;
  accountId: string;
};

let cachedToken: CachedToken | null = null;

function normalizeBasePath(baseUri: string) {
  const trimmed = baseUri.replace(/\/+$/, "");
  return trimmed.endsWith("/restapi") ? trimmed : `${trimmed}/restapi`;
}

export function getDocuSignConsentUrl() {
  const env = getDocuSignEnv();
  const params = new URLSearchParams({
    response_type: "code",
    scope: env.scopes.join(" "),
    client_id: env.DOCUSIGN_INTEGRATION_KEY,
    redirect_uri: env.DOCUSIGN_REDIRECT_URI,
  });

  return `https://${env.DOCUSIGN_OAUTH_BASE_PATH}/oauth/auth?${params.toString()}`;
}

async function requestToken() {
  const env = getDocuSignEnv();
  const docusign = getDocuSignSdk();
  const apiClient = new docusign.ApiClient();
  apiClient.setOAuthBasePath(env.DOCUSIGN_OAUTH_BASE_PATH);

  try {
    const response = await apiClient.requestJWTUserToken(
      env.DOCUSIGN_INTEGRATION_KEY,
      env.DOCUSIGN_USER_ID,
      env.scopes,
      Buffer.from(env.privateKey),
      jwtTokenLifetimeSeconds,
    );

    const accessToken = response.body?.access_token;
    if (!accessToken) {
      throw new ContractIntegrationError(
        "DOCUSIGN_AUTH_FAILED",
        "DocuSign did not return an access token.",
        502,
      );
    }

    const userInfo = await apiClient.getUserInfo(accessToken);
    const configuredAccount =
      userInfo.accounts?.find(
        (account) =>
          account.accountId === env.DOCUSIGN_ACCOUNT_ID ||
          account.account_id === env.DOCUSIGN_ACCOUNT_ID,
      ) || userInfo.accounts?.find((account) => account.isDefault === true || account.isDefault === "true");

    const baseUri =
      configuredAccount?.baseUri ||
      configuredAccount?.base_uri ||
      env.DOCUSIGN_API_BASE_PATH;

    cachedToken = {
      accessToken,
      expiresAt:
        Date.now() +
        (response.body?.expires_in || jwtTokenLifetimeSeconds) * 1000,
      basePath: normalizeBasePath(baseUri),
      accountId:
        configuredAccount?.accountId ||
        configuredAccount?.account_id ||
        env.DOCUSIGN_ACCOUNT_ID,
    };

    return cachedToken;
  } catch (error) {
    if (error instanceof ContractIntegrationError) throw error;
    throw normalizeDocuSignSdkError(error);
  }
}

export async function getDocuSignAccess() {
  if (
    cachedToken &&
    cachedToken.expiresAt - tokenSafetyBufferMs > Date.now()
  ) {
    return cachedToken;
  }

  return requestToken();
}

export function clearDocuSignTokenCacheForTests() {
  cachedToken = null;
}
