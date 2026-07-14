import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.NEXT_PUBLIC_S3_REGION || "eu-west-2",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});
const bucket = process.env.S3_BUCKET || "svh-bucket-s3";

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Extract the S3 key from the URL
    // URL format: https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/...
    const urlObj = new URL(imageUrl);
    const key = urlObj.pathname.substring(1); // Remove leading slash

    // Validate that the key starts with images/ or videos/
    if (!key.startsWith("images/") && !key.startsWith("videos/")) {
      return NextResponse.json(
        { error: "Invalid image path. Only images and videos can be deleted." },
        { status: 400 }
      );
    }

    console.log("Deleting from S3:", { bucket, key });

    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    console.log("Delete successful:", imageUrl);
    return NextResponse.json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    console.log("Delete error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Delete failed: ${message}` },
      { status: 500 }
    );
  }
}
