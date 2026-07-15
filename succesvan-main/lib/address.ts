// Address types and pure helpers for the UK address flow (Ideal Postcodes / PAF).
// Kept free of React / network so they can be unit tested directly.

export type AddressSource = "ideal_postcodes" | "manual";

export type RegistrationAddress = {
  addressLine1: string;
  addressLine2?: string;
  townCity: string;
  county?: string;
  postcode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  udprn?: number;
  addressSource: AddressSource;
  postcodeValidated: boolean;
};

// The subset of Ideal Postcodes (PAF) address fields we consume. The API
// returns many more; everything here is optional for defensive parsing.
export type IdealPostcodesAddress = {
  line_1?: string;
  line_2?: string;
  line_3?: string;
  post_town?: string;
  postcode?: string;
  county?: string;
  postal_county?: string;
  traditional_county?: string;
  administrative_county?: string;
  country?: string;
  longitude?: number;
  latitude?: number;
  udprn?: number;
  organisation_name?: string;
};

// A single selectable address option returned to the client (no raw PAF dump).
export type AddressOption = {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2: string;
  townCity: string;
  county: string;
  postcode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  udprn?: number;
};

/**
 * Normalize a UK postcode for lookup: uppercase + strip all whitespace.
 * e.g. "nw2  7uh " -> "NW27UH".
 */
export function normalizePostcode(input: string): string {
  return (input || "").toUpperCase().replace(/\s+/g, "").trim();
}

/**
 * Restore standard UK display spacing: a single space before the final three
 * characters (the inward code). e.g. "NW27UH" -> "NW2 7UH".
 */
export function formatPostcodeForDisplay(input: string): string {
  const compact = normalizePostcode(input);
  if (compact.length < 5) return compact;
  return `${compact.slice(0, compact.length - 3)} ${compact.slice(-3)}`;
}

const UK_POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/;

/** Loose shape check used to decide whether to auto-trigger a lookup on blur. */
export function looksLikeValidPostcode(input: string): boolean {
  return UK_POSTCODE_RE.test(normalizePostcode(input));
}

/** Human-readable one-line label for an address, used in the dropdown. */
export function formatIdealAddressLabel(raw: IdealPostcodesAddress): string {
  const parts = [raw.line_1, raw.line_2, raw.line_3, raw.post_town]
    .map((p) => (p || "").trim())
    .filter(Boolean);
  // De-dupe consecutive repeats (PAF sometimes repeats town in line_3).
  const deduped = parts.filter(
    (p, i) => p.toLowerCase() !== (parts[i - 1] || "").toLowerCase(),
  );
  return deduped.join(", ");
}

/**
 * Map a raw Ideal Postcodes (PAF) address into our normalized AddressOption.
 * - line 1 = line_1
 * - line 2 = line_2 (+ line_3 when present)
 * - county falls back through the PAF county variants
 */
export function mapIdealAddress(raw: IdealPostcodesAddress): AddressOption {
  const a = raw || {};
  const line1 = (a.line_1 || "").trim();
  const line2 = [a.line_2, a.line_3]
    .map((p) => (p || "").trim())
    .filter(Boolean)
    .join(", ");

  const county = (
    a.county ||
    a.postal_county ||
    a.traditional_county ||
    a.administrative_county ||
    ""
  ).trim();

  const postcode = a.postcode ? formatPostcodeForDisplay(a.postcode) : "";

  return {
    id: a.udprn != null ? String(a.udprn) : formatIdealAddressLabel(a),
    label: formatIdealAddressLabel(a),
    addressLine1: line1,
    addressLine2: line2,
    townCity: (a.post_town || "").trim(),
    county,
    postcode,
    country: (a.country || "United Kingdom").trim(),
    latitude: typeof a.latitude === "number" ? a.latitude : undefined,
    longitude: typeof a.longitude === "number" ? a.longitude : undefined,
    udprn: typeof a.udprn === "number" ? a.udprn : undefined,
  };
}
