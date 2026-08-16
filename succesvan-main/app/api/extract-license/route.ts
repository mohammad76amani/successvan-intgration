import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const licenseDataSchema = z.object({
  isFrontSide: z.boolean(),
  sourceSide: z.enum(["front", "back", "unknown"]),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  fullName: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  address: z.string().nullable(),
  postcode: z.string().nullable(),
  licenseNumber: z.string().nullable(),
  licenceNumber: z.string().nullable(),
  issueDate: z.string().nullable(),
  expirationDate: z.string().nullable(),
  expiryDate: z.string().nullable(),
  issuingCountry: z.string().nullable(),
  issuingAuthority: z.string().nullable(),
  licenceCategories: z.array(z.string()).default([]),
});

type ImageInput = {
  dataUrl: string;
  byteLength: number;
  mimeType: string;
};

type LicenceImages = {
  front: ImageInput;
  back?: ImageInput;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function parseDataUrl(image: string, fallbackMimeType?: string): ImageInput {
  const dataUrlMatch = image.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/);
  const mimeType = dataUrlMatch?.[1] ?? fallbackMimeType ?? "image/jpeg";
  const base64 = (dataUrlMatch?.[2] ?? image).replace(/\s/g, "");

  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
    throw new TypeError("Please upload a JPEG, PNG, or WebP image.");
  }

  if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throw new TypeError("The image must be valid base64 data.");
  }

  const byteLength = Buffer.from(base64, "base64").byteLength;
  return {
    dataUrl: `data:${mimeType};base64,${base64}`,
    byteLength,
    mimeType,
  };
}

async function readRemoteImage(value: string): Promise<ImageInput> {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    !(
      url.hostname === "amazonaws.com" ||
      url.hostname.endsWith(".amazonaws.com")
    )
  ) {
    throw new TypeError("Licence images must use a secure S3 URL.");
  }

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new TypeError("A licence image could not be loaded.");
  }

  const mimeType = (response.headers.get("content-type") || "")
    .split(";")[0]
    .trim();
  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
    throw new TypeError("Please upload a JPEG, PNG, or WebP image.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_IMAGE_SIZE) {
    throw new TypeError("The image is too large. Maximum size is 10 MB.");
  }

  return {
    dataUrl: `data:${mimeType};base64,${buffer.toString("base64")}`,
    byteLength: buffer.byteLength,
    mimeType,
  };
}

async function imageInput(value: unknown): Promise<ImageInput> {
  if (value instanceof File && value.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.has(value.type)) {
      throw new TypeError("Please upload a JPEG, PNG, or WebP image.");
    }
    return {
      dataUrl: `data:${value.type};base64,${Buffer.from(
        await value.arrayBuffer(),
      ).toString("base64")}`,
      byteLength: value.size,
      mimeType: value.type,
    };
  }

  if (typeof value === "string" && /^https:\/\//i.test(value)) {
    return readRemoteImage(value);
  }
  if (typeof value === "string" && value.length > 0) {
    return parseDataUrl(value);
  }
  throw new TypeError("Please choose both driver licence images.");
}

async function readImages(request: NextRequest): Promise<LicenceImages> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const frontValue = formData.get("front") || formData.get("image");
    const backValue = formData.get("back");
    return {
      front: await imageInput(frontValue),
      ...(backValue ? { back: await imageInput(backValue) } : {}),
    };
  }

  if (!contentType.includes("application/json")) {
    throw new TypeError("Send an image file as multipart form data or JSON base64 data.");
  }

  const body = (await request.json()) as {
    image?: unknown;
    frontImage?: unknown;
    backImage?: unknown;
  };
  const frontValue = body.frontImage || body.image;
  return {
    front: await imageInput(frontValue),
    ...(body.backImage ? { back: await imageInput(body.backImage) } : {}),
  };
}

export async function POST(request: NextRequest) {
  try {
    const images = await readImages(request);

    if (
      images.front.byteLength > MAX_IMAGE_SIZE ||
      (images.back?.byteLength || 0) > MAX_IMAGE_SIZE
    ) {
      return errorResponse("The image is too large. Maximum size is 10 MB.", 413);
    }

    const apiKey =
      process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      return errorResponse("OpenAI API key is not configured on the server.", 503);
    }

    const openai = new OpenAI({ apiKey });
    const response = await openai.responses.parse({
      model: process.env.OPENAI_LICENSE_MODEL || "gpt-5.6-luna",
      store: false,
      instructions:
        "You extract data from UK photocard driving licence FRONT and BACK images for a vehicle hire agreement. The first image is FRONT and the optional second image is BACK. Confirm the first image has the portrait and fields 1, 2, 3, 4a, 4b, 4c, 5 and 8. Read surname from front field 1, given names from front field 2, dateOfBirth from front field 3, expirationDate/expiryDate from front field 4b, issuing authority from front field 4c, licenseNumber/licenceNumber from front field 5 only, and address/postcode from front field 8. IMPORTANT PROJECT RULE: issueDate must NOT come from front field 4a. Read issueDate only from BACK field 10 (valid-from date) on the f/k/q category row. Field 9 contains categories, field 10 is valid from, and field 11 is valid to. Do not confuse field 10 with field 11. For example, back value 16.01.24 in field 10 becomes 2024-01-16. Never use card number, serial number, issue number, category codes, barcode values, field 11, or front field 4a as issueDate. If no back image or the f/k/q field-10 date is unreadable, set issueDate=null. Return dates as YYYY-MM-DD. Set isFrontSide=true and sourceSide='front' when the first image is a valid front. The sourceSide value identifies the primary identity-data side even though issue date and categories are also read from the back. Copy only readable values; use null for unreadable scalar fields and [] for unreadable categories.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Image 1 — FRONT. Extract identity fields from this side. Do not use front field 4a as issueDate.",
            },
            {
              type: "input_image",
              image_url: images.front.dataUrl,
              detail: "high",
            },
            ...(images.back
              ? [
                  {
                    type: "input_text" as const,
                    text: "Image 2 — BACK. Read licence categories from field 9 and issueDate only from field 10 on the f/k/q row.",
                  },
                  {
                    type: "input_image" as const,
                    image_url: images.back.dataUrl,
                    detail: "high" as const,
                  },
                ]
              : []),
          ],
        },
      ],
      text: {
        format: zodTextFormat(licenseDataSchema, "driver_licence"),
      },
    });

    if (!response.output_parsed) {
      return errorResponse("The licence information could not be read from this image.", 422);
    }

    if (!response.output_parsed.isFrontSide) {
      return errorResponse(
        "The first image must be the front side of the driving licence.",
        422,
      );
    }

    return NextResponse.json(response.output_parsed);
  } catch (error) {
    if (error instanceof TypeError || error instanceof SyntaxError) {
      return errorResponse(error.message, 400);
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Driver licence extraction failed:", message);

    return errorResponse("Failed to extract driver licence information.", 502);
  }
}
