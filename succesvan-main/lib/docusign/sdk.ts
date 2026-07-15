import "server-only";

type DocusignModel = Record<string, unknown>;

type DocusignModelConstructor = {
  constructFromObject(data: Record<string, unknown>, obj?: DocusignModel): DocusignModel;
};

type DocuSignApiClient = {
  setOAuthBasePath(path: string): void;
  setBasePath(path: string): void;
  addDefaultHeader(name: string, value: string): void;
  requestJWTUserToken(
    clientId: string,
    userId: string,
    scopes: string[],
    privateKey: Buffer,
    expiresIn: number,
  ): Promise<{
    body?: {
      access_token?: string;
      expires_in?: number;
    };
  }>;
  getUserInfo(accessToken: string): Promise<{
    accounts?: Array<{
      accountId?: string;
      account_id?: string;
      baseUri?: string;
      base_uri?: string;
      isDefault?: boolean | string;
    }>;
  }>;
};

type DocuSignEnvelopesApi = {
  createEnvelope(
    accountId: string,
    opts: { envelopeDefinition: DocusignModel },
  ): Promise<{ envelopeId?: string; status?: string; statusDateTime?: string }>;
  createRecipientView(
    accountId: string,
    envelopeId: string,
    opts: { recipientViewRequest: DocusignModel },
  ): Promise<{ url?: string }>;
  getEnvelope(
    accountId: string,
    envelopeId: string,
    opts?: Record<string, unknown>,
  ): Promise<
    DocusignModel & {
      envelopeId?: string;
      status?: string;
      statusChangedDateTime?: string;
    }
  >;
  getDocument(
    accountId: string,
    envelopeId: string,
    documentId: string,
    opts?: Record<string, unknown>,
  ): Promise<Buffer | ArrayBuffer | Uint8Array | string>;
  update(
    accountId: string,
    envelopeId: string,
    opts: { envelope?: DocusignModel; resendEnvelope?: string },
  ): Promise<DocusignModel>;
};

type DocuSignSdk = {
  ApiClient: new () => DocuSignApiClient;
  EnvelopesApi: new (apiClient?: DocuSignApiClient) => DocuSignEnvelopesApi;
  EnvelopeDefinition: DocusignModelConstructor;
  Document: DocusignModelConstructor;
  Signer: DocusignModelConstructor;
  Recipients: DocusignModelConstructor;
  SignHere: DocusignModelConstructor;
  FullName: DocusignModelConstructor;
  DateSigned: DocusignModelConstructor;
  Tabs: DocusignModelConstructor;
  TextCustomField: DocusignModelConstructor;
  CustomFields: DocusignModelConstructor;
  RecipientViewRequest: DocusignModelConstructor;
};

let cachedSdk: DocuSignSdk | null = null;

export function getDocuSignSdk() {
  if (!cachedSdk) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedSdk = require("docusign-esign") as DocuSignSdk;
  }
  return cachedSdk;
}
