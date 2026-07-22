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

async function readImage(request: NextRequest): Promise<ImageInput> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File) || image.size === 0) {
      throw new TypeError("Please choose a driver licence image.");
    }

    if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
      throw new TypeError("Please upload a JPEG, PNG, or WebP image.");
    }

    return {
      dataUrl: `data:${image.type};base64,${Buffer.from(await image.arrayBuffer()).toString("base64")}`,
      byteLength: image.size,
      mimeType: image.type,
    };
  }

  if (!contentType.includes("application/json")) {
    throw new TypeError("Send an image file as multipart form data or JSON base64 data.");
  }

  const body = (await request.json()) as { image?: unknown; mimeType?: unknown };
  if (typeof body.image !== "string" || body.image.length === 0) {
    throw new TypeError("Missing 'image' field.");
  }

  return parseDataUrl(
    body.image,
    typeof body.mimeType === "string" ? body.mimeType : undefined,
  );
}

export async function POST(request: NextRequest) {
  try {
    const image = await readImage(request);

    if (image.byteLength > MAX_IMAGE_SIZE) {
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
        "You extract data ONLY from the FRONT side of a UK photocard driving licence for a vehicle hire agreement. First decide if the image is the front side. The front side normally has the portrait/photo and numbered fields: 1 surname, 2 given names, 3 date of birth, 4a issue date, 4b licence expiry date, 4c issuing authority, 5 driver/licence number, 8 address. If the image appears to be the back side, set isFrontSide=false, sourceSide='back', and return null for all scalar fields and [] for licenceCategories. For a valid front side, set isFrontSide=true and sourceSide='front'. licenseNumber/licenceNumber MUST be field 5 only; do not use card number, serial number, issue number, category codes, barcode numbers, or any number from the back. dateOfBirth MUST be field 3. expirationDate/expiryDate MUST be field 4b, not 4a. issueDate MUST be field 4a. Return all readable dates as YYYY-MM-DD. UK licence dates often appear as DD.MM.YYYY or DD-MM-YYYY: convert them carefully. Copy names, address, postcode, issuing authority, issuing country, and licence categories exactly as readable. Return null for any unreadable scalar field and an empty array when licence categories are unreadable.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Read this as the FRONT of a UK photocard driving licence. Extract: field 1 surname, field 2 given names, field 3 date of birth, field 4a issue date, field 4b expiry date, field 4c issuing authority, field 5 licence number, and field 8 address/postcode. If this is not the front side, say isFrontSide=false and do not extract data.",
            },
            {
              type: "input_image",
              image_url: image.dataUrl,
              detail: "high",
            },
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
        "Please upload the front side of the driving licence for extraction.",
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
