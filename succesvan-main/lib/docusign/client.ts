import "server-only";

import { getDocuSignAccess } from "./auth";
import { getDocuSignSdk } from "./sdk";

export async function getDocuSignApiClient() {
  const access = await getDocuSignAccess();
  const docusign = getDocuSignSdk();
  const apiClient = new docusign.ApiClient();
  apiClient.setBasePath(access.basePath);
  apiClient.addDefaultHeader("Authorization", `Bearer ${access.accessToken}`);

  return {
    accountId: access.accountId,
    apiClient,
    envelopesApi: new docusign.EnvelopesApi(apiClient),
  };
}
