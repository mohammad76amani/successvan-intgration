import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import {
  normalizePostcode,
  formatPostcodeForDisplay,
  mapIdealAddress,
  type IdealPostcodesAddress,
} from "@/lib/address";

// GET /api/address/lookup?postcode=NW2%207UH
// Proxies the Ideal Postcodes (PAF) postcode lookup and returns every official
// address for the postcode. The API key stays server-side and is never exposed.
export async function GET(req: NextRequest) {
  const apiKey = process.env.IDEAL_POSTCODES_API_KEY;
  if (!apiKey) {
    console.log("IDEAL_POSTCODES_API_KEY is not configured");
    return errorResponse("Address lookup is not configured.", 500);
  }

  const { searchParams } = new URL(req.url);
  const normalized = normalizePostcode(searchParams.get("postcode") || "");
  if (!normalized) {
    return errorResponse("Postcode is required", 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const url = new URL(
      `https://api.ideal-postcodes.co.uk/v1/postcodes/${encodeURIComponent(normalized)}`,
    );
    // Pass the key via the Authorization header rather than the query string.
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Authorization: `IDEALPOSTCODES api_key="${apiKey}"`,
        Accept: "application/json",
      },
    });

    const json = await res.json().catch(() => null);

    if (res.status === 404 || json?.code === 4040) {
      return errorResponse("We could not find that postcode.", 404);
    }
    if (res.status === 422) {
      return errorResponse("That doesn't look like a valid UK postcode.", 422);
    }
    if (res.status === 401) {
      console.log("Ideal Postcodes auth error:", json?.message);
      return errorResponse("Address lookup is not configured correctly.", 500);
    }
    if (res.status === 402) {
      console.log("Ideal Postcodes balance/limit error:", json?.message);
      return errorResponse("Address lookup is temporarily unavailable.", 503);
    }
    if (!res.ok || !Array.isArray(json?.result)) {
      console.log("Ideal Postcodes unexpected response:", res.status, json?.code);
      return errorResponse("Address lookup is unavailable right now.", 502);
    }

    const addresses = (json.result as IdealPostcodesAddress[]).map(mapIdealAddress);

    return successResponse({
      postcode: formatPostcodeForDisplay(normalized),
      addresses,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return errorResponse("Address lookup timed out. Please try again.", 504);
    }
    console.log("Address lookup error:", error);
    return errorResponse("Address lookup is unavailable right now.", 502);
  } finally {
    clearTimeout(timeout);
  }
}
