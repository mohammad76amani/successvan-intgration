import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { compressImageToTarget } from "@/lib/compress-image";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
const accessKey = process.env.ACCESS_KEY_ID;
const secretKey = process.env.SECRET_ACCESS_KEY;
const bucket = process.env.S3_BUCKET || "svh-bucket-s3";
const region = process.env.S3_REGION || "eu-west-2";

    console.log("AWS ENV CHECK:", {
      hasAccessKey: !!accessKey,
      hasSecretKey: !!secretKey,
      bucket,
      region,
    });

    if (!accessKey) console.log("ACCESS_KEY_ID is missing");
    if (!secretKey) console.log("SECRET_ACCESS_KEY is missing");
    if (!bucket) console.log("S3_BUCKET is missing");

    if (!accessKey || !secretKey || !bucket) {
      console.log("Missing AWS configuration");

      return NextResponse.json(
        { error: "Server configuration error: Missing AWS configuration" },
        { status: 500 }
      );
    }

    const s3 = new S3Client({
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Only image and video files are allowed" },
        { status: 400 }
      );
    }

    const maxSize = isVideo ? 50 * 1024 * 1024 : 15 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size must be less than ${isVideo ? "50MB" : "15MB"}` },
        { status: 400 }
      );
    }

    let buffer: Buffer = Buffer.from(await file.arrayBuffer());
    const folder = isVideo ? "videos" : "images";

    if (isImage) {
      console.log("Compressing image before upload...");
      buffer = await compressImageToTarget(buffer);
    }

    const originalExtension = file.name.split(".").pop();
    const extension = isImage ? "webp" : originalExtension;

    const safeName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .replace(/\.[^/.]+$/, "");

    const key = `${folder}/${Date.now()}-${safeName}.${extension}`;

    console.log("Uploading to S3:", {
      bucket,
      key,
      size: buffer.length,
    });

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: isImage ? "image/webp" : file.type,
      })
    );

    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    console.log("Upload successful:", url);

    return NextResponse.json({
      url,
      size: buffer.length,
      filename: key.split("/").pop(),
      contentType: isImage ? "image/webp" : file.type,
    });
  } catch (error) {
    console.log("Upload error:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Upload failed: ${message}` },
      { status: 500 }
    );
  }
}