import { NextRequest, NextResponse } from "next/server";
import {
  ListObjectsV2Command,
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";

function getFileType(key: string) {
  const lowerKey = key.toLowerCase();

  // Check for voice recordings first (most specific)
  if (lowerKey.includes("voice-temp/") || 
      (lowerKey.endsWith(".webm") && lowerKey.includes("voice"))) {
    return "audio";
  }

  // Image files
  if (
    lowerKey.endsWith(".jpg") ||
    lowerKey.endsWith(".jpeg") ||
    lowerKey.endsWith(".png") ||
    lowerKey.endsWith(".webp") ||
    lowerKey.endsWith(".gif") ||
    lowerKey.endsWith(".svg") ||
    lowerKey.endsWith(".bmp") ||
    lowerKey.endsWith(".ico")
  ) {
    return "image";
  }

  // Audio files
  if (
    lowerKey.endsWith(".mp3") ||
    lowerKey.endsWith(".wav") ||
    lowerKey.endsWith(".ogg") ||
    lowerKey.endsWith(".m4a") ||
    lowerKey.endsWith(".flac") ||
    lowerKey.endsWith(".aac")
  ) {
    return "audio";
  }

  // Video files (webm files that are not voice recordings)
  if (
    lowerKey.endsWith(".mp4") ||
    lowerKey.endsWith(".mov") ||
    lowerKey.endsWith(".avi") ||
    lowerKey.endsWith(".mkv") ||
    lowerKey.endsWith(".wmv") ||
    lowerKey.endsWith(".flv") ||
    (lowerKey.endsWith(".webm") && !lowerKey.includes("voice-temp/"))
  ) {
    return "video";
  }

  // Everything else (documents, etc.)
  return "other";
}

export async function GET(req: NextRequest) {
  try {
    const accessKey = process.env.ACCESS_KEY_ID;
    const secretKey = process.env.SECRET_ACCESS_KEY;
    const region = process.env.S3_REGION || "eu-west-2";
    const bucket = process.env.S3_BUCKET || "svh-bucket-s3";

    if (!accessKey || !secretKey || !bucket || !region) {
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error: Missing AWS configuration",
        },
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

    const { searchParams } = new URL(req.url);
    const prefix = searchParams.get("prefix") || "";
    const typeFilter = searchParams.get("type") || "";
    const searchQuery = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const minSize = parseInt(searchParams.get("minSize") || "0");
    const maxSize = parseInt(searchParams.get("maxSize") || "0");

    // Get all objects first (we need to filter client-side)
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: 1000,
    });

    let allObjects: any[] = [];
    let response;
    let continuationToken: string | undefined;

    // Fetch all objects (handle pagination from S3)
    do {
      const currentCommand = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      });
      
      response = await s3.send(currentCommand);
      
      if (response.Contents) {
        allObjects = allObjects.concat(response.Contents);
      }
      
      continuationToken = response.NextContinuationToken;
    } while (response.IsTruncated);

    // Process all objects and apply filters
    const processedItems = await Promise.all(
      allObjects
        .filter((item) => item.Key)
        .map(async (item) => {
          const key = item.Key as string;
          const size = item.Size ?? 0;
          const type = getFileType(key);

          // Debug logging for file type detection
          if (key.includes('voice') || key.endsWith('.webm')) {
            console.log(`File: ${key} -> Type: ${type}`);
          }

          // Apply filters
          if (typeFilter && type !== typeFilter) return null;
          if (searchQuery && !key.toLowerCase().includes(searchQuery.toLowerCase())) return null;
          if (minSize > 0 && size < minSize) return null;
          if (maxSize > 0 && size > maxSize) return null;

          try {
            const signedUrl = await getSignedUrl(
              s3,
              new GetObjectCommand({
                Bucket: bucket,
                Key: key,
              }),
              {
                expiresIn: 3600, // 1 hour
              }
            );

            return {
              key,
              url: signedUrl,
              size,
              lastModified: item.LastModified?.toISOString() || null,
              type,
            };
          } catch (error) {
            console.log(`Failed to generate signed URL for ${key}:`, error);
            const fallbackUrl = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
            return {
              key,
              url: fallbackUrl,
              size,
              lastModified: item.LastModified?.toISOString() || null,
              type,
            };
          }
        })
    );

    // Filter out null items and sort
    const filteredItems = processedItems
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        if (!a.lastModified || !b.lastModified) return 0;
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      });

    // Apply pagination
    const totalItems = filteredItems.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      bucket,
      region,
      prefix,
      objects: paginatedItems,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      filters: {
        type: typeFilter,
        search: searchQuery,
        minSize,
        maxSize,
      },
    });
  } catch (error) {
    console.log("S3 list error:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: `Unable to list bucket contents: ${message}`,
      },
      { status: 500 }
    );
  }
}