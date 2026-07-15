import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getServerEnv } from "@/lib/env/server-env";
import { ContractIntegrationError } from "@/lib/docusign/errors";

export type StoredFile = {
  key: string;
  contentType: string;
  size: number;
};

export type ContractStoragePutInput = {
  key: string;
  body: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
};

export interface ContractStorage {
  put(input: ContractStoragePutInput): Promise<StoredFile>;
  get(key: string): Promise<Buffer>;
  exists(key: string): Promise<boolean>;
  delete?(key: string): Promise<void>;
}

function safeStorageKey(key: string) {
  const normalized = key.replace(/^\/+/, "");
  if (normalized.includes("..")) {
    throw new ContractIntegrationError(
      "CONTRACT_ACCESS_DENIED",
      "Invalid contract document path.",
      400,
    );
  }
  return normalized;
}

class LocalContractStorage implements ContractStorage {
  private rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = path.isAbsolute(rootDir)
      ? rootDir
      : path.join(process.cwd(), rootDir);
  }

  private resolveKey(key: string) {
    const safeKey = safeStorageKey(key);
    const resolved = path.join(this.rootDir, safeKey);
    if (!resolved.startsWith(this.rootDir)) {
      throw new ContractIntegrationError(
        "CONTRACT_ACCESS_DENIED",
        "Invalid contract document path.",
        400,
      );
    }
    return resolved;
  }

  async put(input: ContractStoragePutInput) {
    const filePath = this.resolveKey(input.key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, input.body);
    return {
      key: safeStorageKey(input.key),
      contentType: input.contentType,
      size: input.body.byteLength,
    };
  }

  async get(key: string) {
    return fs.readFile(this.resolveKey(key));
  }

  async exists(key: string) {
    try {
      await fs.access(this.resolveKey(key));
      return true;
    } catch {
      return false;
    }
  }
}

class S3ContractStorage implements ContractStorage {
  private client: S3Client;
  private bucket: string;

  constructor() {
    const env = getServerEnv();
    const accessKeyId = env.ACCESS_KEY_ID;
    const secretAccessKey = env.SECRET_ACCESS_KEY;
    const bucket = env.S3_BUCKET;

    if (!accessKeyId || !secretAccessKey || !bucket) {
      throw new ContractIntegrationError(
        "DOCUSIGN_NOT_CONFIGURED",
        "S3 contract storage requires S3_BUCKET, ACCESS_KEY_ID, and SECRET_ACCESS_KEY.",
        500,
      );
    }

    this.bucket = bucket;
    this.client = new S3Client({
      region: env.S3_REGION || env.NEXT_PUBLIC_S3_REGION || "eu-west-2",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async put(input: ContractStoragePutInput) {
    const key = safeStorageKey(input.key);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: input.body,
        ContentType: input.contentType,
        Metadata: input.metadata,
      }),
    );

    return {
      key,
      contentType: input.contentType,
      size: input.body.byteLength,
    };
  }

  async get(key: string) {
    const safeKey = safeStorageKey(key);
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: safeKey }),
    );

    if (!result.Body) {
      throw new ContractIntegrationError(
        "CONTRACT_NOT_FOUND",
        "Contract document was not found.",
        404,
      );
    }

    if (result.Body instanceof Readable) {
      const chunks: Buffer[] = [];
      for await (const chunk of result.Body) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    }

    const body = result.Body as unknown as {
      transformToByteArray?: () => Promise<Uint8Array>;
    };
    if (body.transformToByteArray) {
      return Buffer.from(await body.transformToByteArray());
    }

    throw new ContractIntegrationError(
      "CONTRACT_NOT_FOUND",
      "Contract document could not be read.",
      500,
    );
  }

  async exists(key: string) {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: safeStorageKey(key),
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}

let cachedStorage: ContractStorage | null = null;

export function getContractStorage() {
  if (!cachedStorage) {
    const env = getServerEnv();
    cachedStorage =
      env.CONTRACT_STORAGE_PROVIDER === "s3"
        ? new S3ContractStorage()
        : new LocalContractStorage(env.CONTRACT_LOCAL_STORAGE_DIR);
  }
  return cachedStorage;
}
