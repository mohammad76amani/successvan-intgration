import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

type UploadOptions = {
  ContentType?: string;
};

const S3_BUCKET = process.env.S3_BUCKET?.trim() || "svh-bucket-s3";
const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID?.trim();
const SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY?.trim();

if (!ACCESS_KEY_ID) {
  throw new Error("Missing AWS_ACCESS_KEY_ID");
}

if (!SECRET_ACCESS_KEY) {
  throw new Error("Missing AWS_SECRET_ACCESS_KEY");
}

if (!S3_BUCKET) {
  throw new Error("Missing AWS_S3_BUCKET");
}

const s3 = new S3Client({
  region: process.env.NEXT_PUBLIC_S3_REGION || "eu-west-2",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

export async function uploadImage(
  key: string,
  file: Buffer | Uint8Array,
  options?: UploadOptions,
) {
  const cmd = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET || "svh-bucket-s3",
    Key: key,
    Body: file,
    ContentType: options?.ContentType || "application/octet-stream",
  });

  await s3.send(cmd);
}

export async function getImageUrl(key: string) {
  // Return permanent S3 URL format
  return `https://${process.env.S3_BUCKET || "svh-bucket-s3"}.s3.${process.env.S3_REGION || "eu-west-2"}.amazonaws.com/${key}`;
}

export async function deleteImage(key: string) {
  const cmd = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET || "svh-bucket-s3",
    Key: key,
  });

  await s3.send(cmd);
}