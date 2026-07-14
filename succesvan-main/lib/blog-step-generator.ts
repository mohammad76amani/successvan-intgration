/**
 * Step-by-Step Blog Content Generator
 *
 * Generates blog content in discrete steps with user approval gates:
 * 1. Headings tree
 * 2. Section content (one at a time)
 * 3. Summary
 * 4. Conclusion
 * 5. FAQs
 * 6. SEO metadata
 *
 * ✅ Brand-aware (Success Van Hire):
 * - Brand name + contact details used naturally (no spam)
 * - Brand features injected where relevant
 * - Van fleet data for smart recommendations
 *
 * ✅ Modern Search Optimization (2026):
 * - SEO (classic search), AEO (answer engines), GEO (generative engines
 *   like ChatGPT/Perplexity/Gemini), AIO (AI overviews), SXO (search experience)
 *
 * ✅ Hard limits enforced in CODE (not just prompts):
 * - SHOW_VANS and internal-link markers are intentional admin placeholders.
 * - Per-section and article-wide marker caps are applied automatically while
 *   each section is generated, using already-generated sections as the budget.
 * - enforceArticleLimits() remains exported as a final safety pass for callers.
 */

import { generateId, getCurrentYear } from "./blog-utils";
import { getOpenAI } from "./openai";

// ============================================================================
// ✅ 1) SAFE JSON.parse (Reusable helper)
// ============================================================================

type JsonFallback<T> = T | (() => T);

function safeJsonParse<T>(raw: string, fallback: JsonFallback<T>): T {
  try {
    const parsed = JSON.parse(raw) as T;
    return parsed;
  } catch (err) {
    console.error("❌ JSON parse failed. Returning fallback.", {
      err,
      rawPreview: (raw || "").slice(0, 500),
    });
    return typeof fallback === "function" ? (fallback as () => T)() : fallback;
  }
}

interface HeadingPlan {
  id?: string;
  level: number;
  text: string;
  content?: string;
  sectionGoal?: string;
  uniqueAngle?: string;
  mustCover?: string[];
  avoidCovering?: string[];
  recommendedElements?: string[];
  snippetTarget?: string;
  transitionFromPrevious?: string;
  transitionToNext?: string;
}

interface OutlineResult {
  suggestedTitle: string;
  titleAlternatives?: string[];
  focusKeyword: string;
  searchIntent?: "informational" | "commercial" | "local" | "transactional";
  readerProfile?: string;
  articlePromise?: string;
  narrativeArc?: string[];
  headings: HeadingPlan[];
}

interface FAQItem {
  id?: string;
  question: string;
  answer: string;
}

interface FAQResult {
  faqs?: FAQItem[];
  faq?: FAQItem[];
}

interface InternalLinkAnchor {
  id: string;
  keyword: string;
  url: string;
}

interface SEOResult {
  seoDescription: string;
  tags: string[];
  author?: string;
  publishDate?: string;
  anchors?: InternalLinkAnchor[];
}

export interface LocalAreaContext {
  areaName: string;
  aliases: string[];
  verifiedCollectionAddress: string;
  locationRelationship: string;
  practicalConsiderations: string[];
  forbiddenClaims: string[];
}

// ============================================================================
// BLOG LIST FOR INTERNAL LINKING
// ============================================================================

interface BlogListItem {
  slug: string;
  topic: string;
  summary: string;
  conclusion: string; 
}

let cachedBlogList: BlogListItem[] | null = null;

/**
 * Fetch published blog list from API for internal linking
 */
 
 
async function fetchBlogList(): Promise<BlogListItem[]> {
  if (cachedBlogList?.length) {
    return cachedBlogList;
  }

  try {
    const isDevelopment = process.env.NODE_ENV === "development";

    const baseUrl = isDevelopment
      ? process.env.LOCAL_SITE_URL || "http://localhost:3000"
      : process.env.NEXT_PUBLIC_SITE_URL ||
        "https://successvanhire.co.uk";

    const response = await fetch(
      `${baseUrl}/api/blog/list?status=published`,
      {
        cache: isDevelopment ? "no-store" : "force-cache",
        next: isDevelopment
          ? undefined
          : {
              revalidate: 300,
            },
      },
    );

    if (!response.ok) {
      console.error("Failed to fetch blog list:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      });

      return [];
    }

    const data = await response.json();

    const blogs: BlogListItem[] = Array.isArray(data.blogs)
      ? data.blogs
      : [];

    cachedBlogList = blogs;

    return blogs;
  } catch (error) {
    console.error("Error fetching blog list:", error);
    return [];
  }
}
 

 


/**
 * Clear cached blog list (useful when blogs are updated)
 */
export function clearBlogListCache() {
  cachedBlogList = null;
}

/**
 * Build a trusted list of real published posts for internal-link markers.
 * The AI may only use the exact topic text supplied here.
 */
function buildBlogListContext(
  blogs: BlogListItem[],
  currentTopic: string,
): string {
  const normalise = (value: string) =>
    (value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const current = normalise(currentTopic);
  const eligibleBlogs = blogs.filter((blog) => {
    const blogTopic = normalise(blog.topic);
    return blog.topic && blog.slug && blogTopic && blogTopic !== current;
  });

  if (eligibleBlogs.length === 0) {
    return `
INTERNAL LINKING CONTEXT:
No relevant published blog posts are available. Do not invent internal links.`;
  }

  const blogSummary = eligibleBlogs
    .map((blog) => {
      const cleanSummary = (blog.summary || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 180);
      const cleanConclusion = (blog.conclusion || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120);

      return `• Exact topic: ${blog.topic}
  Slug: ${blog.slug}
  Summary: ${cleanSummary}${cleanSummary.length === 180 ? "..." : ""}
  Conclusion: ${cleanConclusion}${cleanConclusion.length === 120 ? "..." : ""}`;
    })
    .join("\n\n");

  return `
EXISTING PUBLISHED BLOG POSTS (trusted internal-link destinations):
${blogSummary}

INTERNAL LINK MARKERS ARE INTENTIONAL ADMIN PLACEHOLDERS.
Use a marker only when the current paragraph genuinely relates to a post above.

STRICT RULES:
- Use ONLY an exact "Exact topic" value from the list above.
- Never invent a topic, destination, slug, or SEO anchor phrase.
- Never link the article to itself.
- Maximum 3 markers across the article.
- Put the marker naturally inside a useful sentence, not in a detached link list.
- If no listed post is relevant, add no marker.

EXACT MARKER FORMAT:
**link to (EXACT BLOG TOPIC)**
`.trim();
}

// ============================================================================
// BRAND CONFIG (Success Van Hire)
// ============================================================================

const BRAND = {
  name: "Success Van Hire",
  phone: "+44 20 3011 1198",
  address: "Strata House, Waterloo Road, London, NW2 7UH",
};

const BRAND_FEATURES = {
  expertise:
    "Short- and long-term self-drive van hire with a fleet marketed as 50+ vehicles",
  licenceChecks:
    "Driver and licence eligibility is checked during booking; never invent accepted documents or guarantee eligibility",
  booking:
    "Customers can make a booking enquiry and receive confirmation details; never describe availability as universally guaranteed",
  pricing:
    "Use only the explicit 'from' prices supplied in VAN_FLEET and describe them as starting prices",
  eco:
    "Vehicles meeting EU6 emission standards are available; do not claim every vehicle is EU6 unless verified",
  service:
    "Friendly service for personal and commercial hire, with rental details confirmed during booking",
};

// ============================================================================
// VERIFIED BRAND FACTS
// ============================================================================

const BRAND_FACTS = {
  positioning: [
    "Self-drive van hire with flexible options",
    "Short- and long-term hire, from a day to longer rental periods",
    "Modern, maintained vehicle fleet",
    "Flexible rental periods including daily, weekly and monthly options",
    `Vehicle collection from the verified office at ${BRAND.address}`,
  ],
  vanTypesMarketing: [
    "LWB & SWB Vans",
    "Transit Vans",
    "Tipper Transits",
    "Luton With Tail-Lift",
    "Refrigerated Vans",
  ],
  differentiators: [
    "Van and minibus hire for personal and commercial use",
    "Vehicles suitable for moving, transporting goods and group travel",
    "Vehicle choices range from small vans to larger vans and minibuses",
    "Free customer car parking may be available while hiring; present this only as the supplied business perk",
  ],
  stats: {
    yearsExperience: "10+",
    modernVehicles: "50+",
    happyCustomers: "5000+",
  },
};

function buildBrandFactsContext(): string {
  const s = BRAND_FACTS.stats;
  return `
VERIFIED BRAND FACTS (use sparingly and only when relevant):
- Positioning: ${BRAND_FACTS.positioning.join("; ")}
- Van types promoted: ${BRAND_FACTS.vanTypesMarketing.join(", ")}
- Differentiators: ${BRAND_FACTS.differentiators.join("; ")}
- Supplied business figures: ${s.yearsExperience} years of experience; ${s.modernVehicles} vehicles; ${s.happyCustomers} customers.

FACT RULES:
- Do not invent or extend these facts.
- Describe every fleet price as "from £X/day", never as a fixed final quote.
- Use no more than one business statistic in an article unless the topic is specifically about the company.
- Never claim "100% satisfaction", "UK-wide service", "the cheapest", "the best", "no hidden fees", full insurance, guaranteed availability, guaranteed outcomes, awards or certifications.
- Never invent deposits, excess amounts, mileage allowances, late fees, fuel policies, age limits, accepted identity documents, proof-of-address requirements, opening hours, delivery services or collection points.
- If insurance, documents or eligibility matter, tell the reader to check the confirmed booking terms rather than inventing details.
- Licence entitlement depends on the driver and vehicle. Never guarantee that a reader can drive a particular vehicle. Refer them to their licence categories and current GOV.UK/DVLA guidance.
`.trim();
}

// ============================================================================
// LOCAL AREA ACCURACY
// ============================================================================

const SUPPORTED_SERVICE_AREAS = [
  {
    areaName: "North West London",
    aliases: [
      "north west london",
      "northwest london",
      "north-west london",
      "nw london",
    ],
  },
  {
    areaName: "Brent Cross",
    aliases: ["brent cross", "brentcross"],
  },
  {
    areaName: "Camden",
    aliases: ["camden"],
  },
  {
    areaName: "Colindale",
    aliases: ["colindale"],
  },
  {
    areaName: "Cricklewood",
    aliases: ["cricklewood"],
  },
  {
    areaName: "Dollis Hill",
    aliases: ["dollis hill", "dollishill"],
  },
  {
    areaName: "Ealing",
    aliases: ["ealing"],
  },
  {
    areaName: "Edgware",
    aliases: ["edgware"],
  },
  {
    areaName: "Finchley",
    aliases: ["finchley"],
  },
  {
    areaName: "Golders Green",
    aliases: ["golders green", "goldersgreen"],
  },
  {
    areaName: "Hampstead",
    aliases: ["hampstead"],
  },
  {
    areaName: "Harrow",
    aliases: ["harrow"],
  },
  {
    areaName: "Hendon",
    aliases: ["hendon"],
  },
  {
    areaName: "Kilburn",
    aliases: ["kilburn"],
  },
  {
    areaName: "Mill Hill",
    aliases: ["mill hill", "millhill"],
  },
  {
    areaName: "Neasden",
    aliases: ["neasden"],
  },
  {
    areaName: "Park Royal",
    aliases: ["park royal", "parkroyal"],
  },
  {
    areaName: "Staples Corner",
    aliases: ["staples corner", "staplescorner"],
  },
  {
    areaName: "Wembley",
    aliases: ["wembley"],
  },
  {
    areaName: "West Hampstead",
    aliases: ["west hampstead", "westhampstead"],
  },
  {
    areaName: "Willesden Green",
    aliases: ["willesden green", "willesdengreen"],
  },
] as const;

const AREA_SPECIFIC_CONSIDERATIONS: Record<string, string[]> = {
  "North West London": [
    "North West London is a wider service region, not a single neighbourhood or collection location",
    "Do not imply that every district in North West London has its own office or depot",
  ],

  "Mill Hill": [
    "Route planning may involve roads such as the A1 or M1, but never invent live traffic, journey times or distances",
  ],

  "Brent Cross": [
    "Check vehicle-height restrictions before entering covered car parks or loading areas",
    "Do not make live traffic claims about the Brent Cross area",
  ],

  Camden: [
    "Check parking, loading access and available space before choosing a larger vehicle",
    "A smaller van may be more practical where access is restricted",
  ],

  Hampstead: [
    "Check loading access and vehicle dimensions before travelling",
    "Do not invent parking restrictions or local access rules",
  ],

  "Park Royal": [
    "Consider payload and loading access for commercial, trade or equipment transport",
    "Check whether the collection or destination site can accommodate an LWB, XLWB or Luton van",
  ],

  "Staples Corner": [
    "Plan the collection and return route in advance without inventing live congestion information",
  ],

  Wembley: [
    "Do not make live claims about event traffic, road closures or congestion",
    "Check loading and parking access before choosing a large van",
  ],
};

const LOCAL_AREA_CONTEXTS: LocalAreaContext[] =
  SUPPORTED_SERVICE_AREAS.map(({ areaName, aliases }) => ({
    areaName,
    aliases: [...aliases],
    verifiedCollectionAddress: BRAND.address,

    locationRelationship:
      `Success Van Hire provides van hire services for customers travelling from ${areaName}. ` +
      `This is a supported service area, not a verified branch, depot or collection office. ` +
      `Vehicle collection is from the verified office at ${BRAND.address}.`,

    practicalConsiderations: [
      "Check parking and safe loading access before choosing a large van",
      "Check vehicle-height restrictions before entering car parks or covered loading areas",
      "Plan the collection and return route before travelling",
      "Never invent live traffic conditions, journey times, distances or road closures",
      "Choose the van using both load volume and payload, not appearance alone",
      "A correctly sized van may be more practical than making several journeys",
      `Vehicle collection is from ${BRAND.address}`,
      ...(AREA_SPECIFIC_CONSIDERATIONS[areaName] ?? []),
    ],

    forbiddenClaims: [
      `Success Van Hire in ${areaName}`,
      `Success Van Hire is based in ${areaName}`,
      `our ${areaName} branch`,
      `our ${areaName} office`,
      `our ${areaName} depot`,
      `our ${areaName} collection point`,
      `collect from our ${areaName} location`,
      `vehicle collection in ${areaName}`,
      `vehicles are delivered to ${areaName}`,
      `based in ${areaName}`,
    ],
  }));
function findLocalAreaContext(topic: string): LocalAreaContext | null {
  const normalised = (topic || "").toLowerCase().replace(/[-_]+/g, " ");
  return (
    LOCAL_AREA_CONTEXTS.find((context) =>
      context.aliases.some((alias) => normalised.includes(alias)),
    ) || null
  );
}

function buildLocalAreaContext(topic: string): string {
  const context = findLocalAreaContext(topic);

  const universalRules = `
LOCAL BUSINESS ACCURACY (STRICT):
- The only verified Success Van Hire office/collection address is: ${BRAND.address}.
- Never imply that the company has a branch, office, depot or collection point in the article's target area unless a verified location is explicitly supplied.
- Distinguish where the customer lives from where the vehicle is collected.
- Do not invent delivery, one-way hire, local availability, exact travel times, distances, parking laws, road restrictions, live traffic or neighbourhood facts.
- Use "serving customers from [area]" or "van hire for customers in [area]" rather than implying a local branch.


LOCAL FACT SAFETY:

- Do not describe local streets as narrow, busy, congested, restricted,
  difficult or easy unless that exact fact is supplied in the verified
  area context.
- Do not claim parking is limited or available unless verified.
- Do not describe the NW2 office as nearby, close, convenient,
  centrally located or easy to reach unless supported by verified data.
- Do not imply a short journey or use phrases such as:
  "without travelling far"
  "close to home"
  "just a short drive"
  "conveniently located"
- Safe wording:
  "Customers travelling from [area] collect vehicles from the NW2 office."
`;

  if (!context) {
    return `${universalRules}
No verified area-specific context was found for this topic. Keep local statements cautious and general. Do not manufacture local detail.`.trim();
  }

  return `${universalRules}
VERIFIED LOCAL CONTEXT — ${context.areaName}:
- Relationship: ${context.locationRelationship}
- Collection address: ${context.verifiedCollectionAddress}
- Practical considerations:
${context.practicalConsiderations.map((item) => `  • ${item}`).join("\n")}
- Forbidden wording:
${context.forbiddenClaims.map((item) => `  • ${item}`).join("\n")}

For a booking or collection section, clearly state the verified NW2 collection address once.`.trim();
}

function sanitiseLocalBusinessClaims(
  content: string,
  context: LocalAreaContext | null,
): string {
  if (!content || !context) return content;

  const area = context.areaName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const brand = BRAND.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  let out = content;
  out = out.replace(
    new RegExp(`${brand}\\s+in\\s+${area}`, "gi"),
    `${BRAND.name}, serving customers from ${context.areaName}`,
  );
  out = out.replace(
    new RegExp(`our\\s+${area}\\s+(branch|office|depot|location)`, "gi"),
    "our NW2 office",
  );
  out = out.replace(
    new RegExp(`based\\s+in\\s+${area}`, "gi"),
    `serving customers from ${context.areaName}`,
  );
  out = out.replace(
    new RegExp(`collect(?:ion)?\\s+from\\s+(?:our|the)\\s+${area}\\s+(?:branch|office|depot|location)`, "gi"),
    "collection from our NW2 office",
  );

  return out;
}

function ensureCollectionAddressForRelevantSection(
  content: string,
  headingText: string,
  context: LocalAreaContext | null,
): string {
  if (!context) return content;
  if (!/(book|booking|collect|collection|pick.?up|provider|reservation)/i.test(headingText)) {
    return content;
  }
  if (content.toLowerCase().includes(BRAND.address.toLowerCase())) {
    return content;
  }

  return `${content}
<p>Customers travelling from ${context.areaName} collect their vehicle from our verified office at <strong>${BRAND.address}</strong>.</p>`;
}

const UNSUPPORTED_BOOKING_TERM_PATTERN =
  /\b(proof of address|utility bill|bank statement|personal identification|additional identification|accepted documents?|driver age|age requirement|experience requirement|deposit|excess amount|insurance(?: coverage| inclusion| option)?|mileage(?: allowance| limit| charge)?|extra mileage|late[- ]return(?: charge| fee)?|late fees?|payment method|remaining fees?|fuel policy|additional fees?|potential fees?)\b/i;

/**
 * Remove concrete booking-policy claims that are not present in verified data.
 * SHOW_VANS and internal-link markers are untouched.
 */
function sanitiseUnsupportedBookingClaims(
  content: string,
  headingText: string,
): string {
  if (!content) return content;

  let removed = false;
  let out = content.replace(/<li\b[^>]*>[\s\S]*?<\/li>/gi, (item) => {
    const plain = item.replace(/<[^>]*>/g, " ");
    if (!UNSUPPORTED_BOOKING_TERM_PATTERN.test(plain)) return item;
    removed = true;
    return "";
  });

  out = out.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, (paragraph) => {
    const plain = paragraph.replace(/<[^>]*>/g, " ");
    if (!UNSUPPORTED_BOOKING_TERM_PATTERN.test(plain)) return paragraph;
    removed = true;
    return "";
  });

  // Remove empty lists left behind by filtered items.
  out = out.replace(/<(ul|ol)\b[^>]*>\s*<\/\1>/gi, "");

  const isOperationalSection =
    /\b(book|booking|eligibility|terms|requirement|collect|collection|pick[ -]?up|pickup)\b/i.test(
      headingText,
    );

  if (removed && isOperationalSection) {
    out += `
<p>Before booking, check the requirements and terms shown in your booking confirmation. Rely on those confirmed details rather than a generic rental checklist.</p>`;
  }

  return out.replace(/\n{3,}/g, "\n\n").trim();
}

// ============================================================================
// VAN FLEET DATA (Simple format for AI)
// ============================================================================


interface VanHirePricing {
  /**
   * Daily rate when the total hire duration is between 1 and 6 days.
   */
  days1To6PerDay: number;

  /**
   * Daily rate when the total hire duration is exactly 7 days.
   * This comes from the vehicle's 7+ day pricing tier.
   */
  sevenDayHirePerDay: number;
}

interface VanFleetItem {
  name: string;
  type: "Van" | "Minibus";
  seats: number;
  fuel: "Diesel";

  pricing: VanHirePricing;

  idealFor: string;
  loadVolume?: string;
  payload?: string;
  special?: string;

  /**
   * Internal reference only.
   * Do not present this as guaranteed legal advice in generated articles.
   */
  requiredLicense?: string;
}

const VAN_FLEET: VanFleetItem[] = [
  {
    name: "Short Wheel Base",
    type: "Van",
    seats: 3,
    fuel: "Diesel",

    pricing: {
      days1To6PerDay: 78,
      sevenDayHirePerDay: 60,
    },

    idealFor:
      "Small moves, trades and tools, city driving, small furniture and office furniture",
    loadVolume: "6.0-6.5 m³",
    payload: "800-1,100 kg",
    requiredLicense: "Licence B / 3 **",
  },

  {
    name: "Medium Wheel Base",
    type: "Van",
    seats: 3,
    fuel: "Diesel",

    pricing: {
      days1To6PerDay: 96,
      sevenDayHirePerDay: 78,
    },

    idealFor:
      "Furniture moves, trade jobs and loads or pallets up to approximately 3 metres long",
    loadVolume: "10.0 m³",
    payload: "900-1,200 kg",
    requiredLicense: "Licence B / 3 **",
  },

  {
    name: "Long Wheel Base",
    type: "Van",
    seats: 3,
    fuel: "Diesel",

    pricing: {
      days1To6PerDay: 102,
      sevenDayHirePerDay: 72,
    },

    idealFor:
      "Furniture and office relocations, trade equipment and up to 4 Euro pallets",
    loadVolume: "11.5 m³",
    payload: "1.1-1.3 tonnes",
    requiredLicense: "Licence B / 3 **",
  },

  {
    name: "Extra Long Wheel Base",
    type: "Van",
    seats: 3,
    fuel: "Diesel",

    pricing: {
      days1To6PerDay: 115,
      sevenDayHirePerDay: 108,
    },

    idealFor:
      "Large or long loads, furniture, timber, pipes, trade materials, event equipment and up to 5 Euro pallets",
    loadVolume: "15.1 m³",
    payload: "1.0-1.35 tonnes",
    requiredLicense: "Licence B / 3 **",
  },

  {
    name: "Luton With Tail-Lift",
    type: "Van",
    seats: 3,
    fuel: "Diesel",

    pricing: {
      days1To6PerDay: 132,
      sevenDayHirePerDay: 100,
    },

    idealFor:
      "House moves, office relocations, furniture, appliances, pallets and bulky items",
    loadVolume: "16-18.5 m³",
    payload: "600-1,000 kg",
    special:
      "Hydraulic tail-lift with an approximate lifting capacity of 500 kg",
    requiredLicense: "Licence B / 3 **",
  },

  {
    name: "CrewCab Van",
    type: "Van",
    seats: 6,
    fuel: "Diesel",

    pricing: {
      days1To6PerDay: 108,
      sevenDayHirePerDay: 84,
    },

    idealFor:
      "Work crews, construction teams, trade equipment, maintenance jobs and transporting people with tools",
    loadVolume: "3.1-3.7 m³",
    payload: "700-900 kg",
    special: "Carries a work team and equipment in one vehicle",
    requiredLicense: "Licence B / 3 **",
  },

  {
    name: "Flat Bed Pickup Van",
    type: "Van",
    seats: 2,
    fuel: "Diesel",

    pricing: {
      days1To6PerDay: 120,
      sevenDayHirePerDay: 108,
    },

    idealFor:
      "Oversized or awkward loads, construction, landscaping, forklift loading and crane loading",
    payload: "Up to 2.2 tonnes",
    special:
      "Open flatbed with drop sides and an approximate 3.6 m × 2.05 m load bed",
    requiredLicense: "Licence B / 3 **",
  },

  {
    name: "Fridge Van",
    type: "Van",
    seats: 3,
    fuel: "Diesel",

    pricing: {
      days1To6PerDay: 150,
      sevenDayHirePerDay: 120,
    },

    idealFor:
      "Food and beverage delivery, catering, chilled goods, frozen goods, pharmaceuticals and temperature-sensitive products",
    loadVolume: "9.3-10 m³",
    payload: "900-1,030 kg",
    special:
      "Chilled operation from 0°C to +5°C, with an optional freezer specification down to -18°C",
    requiredLicense: "Licence B / 3 **",
  },

  {
    name: "Tipper Van",
    type: "Van",
    seats: 2,
    fuel: "Diesel",

    pricing: {
      days1To6PerDay: 144,
      sevenDayHirePerDay: 120,
    },

    idealFor:
      "Construction waste, gravel, sand, soil, landscaping, site clearance and other loose materials",
    payload: "Up to 1.5 tonnes",
    special: "Hydraulic tipping body for faster unloading",
    requiredLicense: "Licence B / 3 **",
  },

  {
    name: "8 Seater Tourneo",
    type: "Minibus",
    seats: 8,
    fuel: "Diesel",

    pricing: {
      days1To6PerDay: 150,
      sevenDayHirePerDay: 120,
    },

    idealFor:
      "Family trips, group travel, corporate outings, events, day trips and airport transport",
    requiredLicense: "Licence B / 3 **",
  },

  {
    name: "9 Seater Tourneo",
    type: "Minibus",
    seats: 9,
    fuel: "Diesel",

    pricing: {
      days1To6PerDay: 180,
      sevenDayHirePerDay: 144,
    },

    idealFor:
      "Family trips, larger group travel, airport transfers, school runs, corporate travel and sightseeing",
    requiredLicense: "Licence B / 3 **",
  },

  {
    name: "14 Seater Minibus",
    type: "Minibus",
    seats: 14,
    fuel: "Diesel",

    pricing: {
      days1To6PerDay: 180,
      sevenDayHirePerDay: 150,
    },

    idealFor:
      "Large groups, corporate events, organised trips, school trips and sightseeing tours",
    requiredLicense: "Licence Class D / D1 **",
  },

  {
    name: "17 Seater Minibus",
    type: "Minibus",
    seats: 17,
    fuel: "Diesel",

    pricing: {
      days1To6PerDay: 198,
      sevenDayHirePerDay: 180,
    },

    idealFor:
      "Larger group transport, corporate events, organised tours and extended group journeys",
    requiredLicense: "Licence Class D / D1",
  },
];

/**
 * Build trusted fleet information for the AI.
 *
 * Important:
 * - 1-6 day hire and 7-day hire have different daily rates.
 * - Prices are starting daily rates for the specified duration.
 * - Licence fields are not included in the generated context because
 *   licence entitlement must be checked separately.
 */
function buildVanFleetContext(): string {
  const vanList = VAN_FLEET.map((van) => {
    let info =
      `• ${van.name} (${van.type}) — ` +
      `${van.seats} seats, ${van.fuel} `;

    info +=
      `\n  Pricing: ` +
      `£${van.pricing.days1To6PerDay}/day for a 1-6 day hire; ` +
      `£${van.pricing.sevenDayHirePerDay}/day for a 7-day hire`;

    info += `\n  Best for: ${van.idealFor}`;

    if (van.loadVolume) {
      info += `\n  Load volume: ${van.loadVolume}`;
    }

    if (van.payload) {
      info += ` | Payload: ${van.payload}`;
    }

    if (van.special) {
      info += `\n  Special feature: ${van.special}`;
    }

    return info;
  }).join("\n\n");

  return `
AVAILABLE VEHICLE FLEET:

${vanList}

PRICING RULES:
- The 1-6 day figure is the daily rate when the total hire duration is between 1 and 6 days.
- The 7-day figure is the daily rate when the total hire duration is exactly 7 days.
- Always connect a price to its hire duration.
- Correct:
  "Short Wheel Base costs from £78/day for a 1-6 day hire."
- Correct:
  "A 7-day Short Wheel Base hire is priced from £60/day."
- Incorrect:
  "Short Wheel Base costs £60/day."
- Do not describe these figures as guaranteed final quotes.
- Do not invent discounts or pricing rules outside the supplied data.
- Tell the reader to confirm the final quote during booking.

LICENCE SAFETY:
- The internal requiredLicense field is not legal advice.
- Do not guarantee that a reader can drive a particular vehicle.
- Refer readers to their licence categories and current GOV.UK/DVLA guidance.

VAN RECOMMENDATION MARKER:
Use exact vehicle names only.

Examples:

**SHOW_VANS: Short Wheel Base, Medium Wheel Base**

**SHOW_VANS: Long Wheel Base, Extra Long Wheel Base, Luton With Tail-Lift**

**SHOW_VANS: CrewCab Van, Tipper Van, Flat Bed Pickup Van**

**SHOW_VANS: 8 Seater Tourneo, 9 Seater Tourneo**

**SHOW_VANS: 14 Seater Minibus, 17 Seater Minibus**
`.trim();
}



/**
 * Build van fleet context string for AI
 */


/**
 * Lightweight relevance detector
 */
function isServiceRelatedTopic(topic: string): boolean {
  const t = (topic || "").toLowerCase();
  const keywords = [
    "van",
    "van hire",
    "hire a van",
    "rent",
    "rental",
    "moving",
    "removal",
    "delivery",
    "courier",
    "transport",
    "logistics",
    "man and van",
    "london",
    "uk",
    "pickup",
    "drop off",
    "book",
    "booking",
    "quote",
    "price",
    "pricing",
    "b2b",
    "business",
    "fleet",
    "emissions",
    "ulez",
    "clean air",
    "minibus",
    "group",
    "travel",
    "construction",
    "trade",
    "fridge",
    "refrigerated",
  ];
  return keywords.some((k) => t.includes(k));
}

// ============================================================================
// ✅ MODERN SEARCH OPTIMIZATION (2026): SEO + AEO + GEO + AIO + SXO
// This block teaches the AI to write for classic search AND answer engines,
// generative engines (ChatGPT/Perplexity/Gemini), AI overviews, and search
// experience — the things most competitor blogs completely ignore.
// ============================================================================

function buildModernSearchContext(): string {
  return `
MODERN SEARCH QUALITY — APPLY NATURALLY:

1) SEO AND SEARCH INTENT
- Answer the reader's actual task, not merely the keyword.
- Use the focus keyword naturally and use sensible variations without repetition.
- Prefer specific decisions, costs, sizes, requirements and trade-offs over generic filler.

2) AEO / DIRECT ANSWERS
- Create a standalone 40–60 word answer block ONLY when the current section has a non-empty snippetTarget.
- No more than 3 sections in the entire outline may have snippetTarget.
- Do not label every answer "Quick answer".
- Do not repeat the same answer in the introduction, body, FAQ and conclusion.

3) GEO / AI-FRIENDLY CLARITY
- Use only supplied, verifiable facts: exact fleet categories, volumes, payloads and "from" prices.
- Write clear, self-contained sentences that remain accurate out of context.
- Expertise must come from useful explanation and honest trade-offs, not fake stories or invented statistics.

4) SXO / READER EXPERIENCE
- Give useful information in the first two sentences.
- Keep paragraphs readable, headings meaningful, and lists/tables genuinely informative.
- Use one helpful CTA near the end or in an explicit booking section, not at the end of every section.

5) DIFFERENTIATION
- Add practical considerations competitors often skip, but only when they are supported by supplied data or safe general guidance.
- Never manufacture an "insider secret", dramatic edge case, local fact, fee, requirement or customer story.
`.trim();
}

function buildBrandContext(
  topic: string,
  allowContact: boolean,
  blogList: BlogListItem[] = [],
): string {
  const blogListContext = buildBlogListContext(blogList, topic);
  return `
BRAND IDENTITY:
- Brand name: ${BRAND.name}
- Phone: ${BRAND.phone}
- Verified office and collection address: ${BRAND.address}

VERIFIED BRAND GUIDANCE:
1) Expertise: ${BRAND_FEATURES.expertise}
2) Licence checks: ${BRAND_FEATURES.licenceChecks}
3) Booking: ${BRAND_FEATURES.booking}
4) Pricing: ${BRAND_FEATURES.pricing}
5) Eco: ${BRAND_FEATURES.eco}
6) Service: ${BRAND_FEATURES.service}

BRAND USAGE:
- Keep the article primarily educational.
- Mention "${BRAND.name}" only in an explicit provider/collection section or once in the conclusion.
- Do not place a sales CTA at the end of every section.
- Contact details are ${allowContact ? "allowed once in a genuine booking/contact section" : "not allowed for this topic"}.
- Never imply an office in the target area. Use the verified NW2 address.

${buildLocalAreaContext(topic)}

${buildModernSearchContext()}

${buildVanFleetContext()}
${buildBrandFactsContext()}
${blogListContext}

STYLE:
- British English.
- Warm, plain-spoken and practical.
- No generic SEO theatre, inflated promises or keyword stuffing.
`.trim();
}

const BANNED_CLICHE_PHRASES = [
  "picture this",
  "ever felt",
  "you're not alone",
  "tricky puzzle",
  "choices can be overwhelming",
  "that's where this guide comes in",
  "without any guesswork",
  "let's get started",
  "here's the thing",
  "a common mistake",
  "can feel daunting",
  "make your collection day a breeze",
  "ready to head off with confidence",
  "doesn't have to be a chore",
  "happy travels",
  "let's delve into",
  "buckle up",
  "navigate like a pro",
  "unlock the secrets",
  "insider's guide",
  "complete guide",
  "smooth sailing",
  "make all the difference",
  "we've got you covered",
  "without a hitch",
  "make all the difference",
  "handy tips",
  "streamline your experience",
  "no fluff",
  "keep reading",
  "right for you",
  "let's explore",
  "has you covered",
  "set you up",
  "smooth and straightforward",
  "get you on the road",
] as const;

const ARTICLE_VOICE_POLICY = `
VOICE PERSPECTIVE:
- Educational sections speak directly to the reader using "you".
- Use "we" and "our" only in an explicit Success Van Hire booking, collection or final CTA context.
- Once the article uses "we/our" as the company voice, never switch to "they/their" for Success Van Hire.
- Do not write from the reader's perspective as though the reader operates a van-hire company. Never write phrases such as "when you're serving customers from Mill Hill".
- Prefer direct statements over theatrical hooks, chatty filler or motivational endings.
`.trim();

const BOOKING_DATA_SAFETY = `
BOOKING DATA SAFETY:
- Do not state or list specific age limits, driving-experience rules, accepted identity documents, proof-of-address requirements, payment methods, deposits, insurance inclusions, mileage limits, late-return charges, fuel rules, excess amounts or additional fees unless they are explicitly supplied as verified data.
- Do not turn common rental-industry practice into Success Van Hire policy.
- For unavailable details, use one neutral instruction: "Check the requirements and terms shown in your booking confirmation."
- A booking section may explain what the reader should confirm, but must not claim what the company's actual terms are unless those terms are provided.
`.trim();

/**
 * One reusable system message builder for all steps
 */
function buildSystemMessage(brandContext: string) {
  return {
    role: "system" as const,
    content:
      `You write practical British-English guidance for a van-hire company's website. The voice should feel knowledgeable, relaxed and useful, but never fabricated.

TRUTHFULNESS OVERRIDES STYLE:
- Never invent personal memories, customer stories, quotes, case studies, statistics, percentages, studies, awards, certifications or local facts.
- Never invent prices, deposits, mileage limits, late fees, fuel terms, excess amounts, insurance inclusions, accepted documents, proof-of-address rules, age limits, opening hours, vehicle availability, delivery services or collection points.
- Use only figures and specifications supplied in the context. Prices must always be described as starting prices: "from £X/day".
- Never name a vehicle manufacturer or model unless it appears in the supplied data. SWB, MWB, LWB and Luton are vehicle categories here, not manufacturer models.
- Never guarantee licence entitlement. Refer readers to their own licence categories and current GOV.UK/DVLA guidance.
- Never imply that Success Van Hire has a branch in a target area. The verified office is in NW2.
- If a detail is not supplied, either leave it out or tell the reader to confirm it in the booking terms.

VOICE:
- Write to one intelligent reader using "you".
- Use contractions and varied sentence lengths, but do not force quirky asides.
- Use "we" only when clearly referring to the company, and never manufacture a first-person experience.
- Do not use any phrase listed in BANNED_CLICHE_PHRASES, or close variations of those phrases.
- Avoid "In conclusion", "It is important to note", "When it comes to", "In today's fast-paced world", "Look no further", and "Whether you're... or...".
- Do not end every section with a CTA, a teaser for the next section, or a motivational sign-off. Let useful sections end naturally.

${ARTICLE_VOICE_POLICY}

${BOOKING_DATA_SAFETY}` +
      "\n\n" +
      brandContext,
  };
}

function enforceDistinctOperationalSections(
  headings: HeadingPlan[],
): HeadingPlan[] {
  let bookingSectionSeen = false;
  let collectionSectionSeen = false;

  return headings.filter((heading) => {
    if (heading.level !== 2) return true;

    const text = (heading.text || "").toLowerCase();
    const isCollectionSection =
      /\b(nw2|collect|collection|pick[ -]?up|pickup)\b/i.test(text);
    const isBookingSection =
      !isCollectionSection &&
      /\b(booking|before booking|before you book|eligibility|terms|requirements|final checklist|booking checklist)\b/i.test(
        text,
      );

    if (isCollectionSection) {
      if (collectionSectionSeen) {
        console.warn(
          `⚠️ [Outline] Removed overlapping collection section: ${heading.text}`,
        );
        return false;
      }
      collectionSectionSeen = true;
    }

    if (isBookingSection) {
      if (bookingSectionSeen) {
        console.warn(
          `⚠️ [Outline] Removed overlapping booking section: ${heading.text}`,
        );
        return false;
      }
      bookingSectionSeen = true;
    }

    return true;
  });
}

// ============================================================================
// STEP 1: GENERATE HEADINGS TREE
// ============================================================================

export async function generateHeadingsTree(prompt: string) {
  console.log("📋 [Step Generator] Generating headings tree for:", prompt);

  const currentYear = getCurrentYear();
  const allowContact = isServiceRelatedTopic(prompt);

  // Fetch blog list for internal linking context
  const blogList = await fetchBlogList();
  const brandContext = buildBrandContext(prompt, allowContact, blogList);
  const systemMessage = buildSystemMessage(brandContext);

  const systemPrompt = `Create a comprehensive blog post outline that's built to win in modern search (Google + AI answer engines) AND make a real human actually want to click and read.

Generate a JSON response with:
{
  "suggestedTitle": "Accurate, specific, click-worthy title (usually 50-65 chars; use ${currentYear} only for genuinely time-sensitive topics)",
  "titleAlternatives": ["2-3 alternative click-worthy titles in different styles (number, question, mistake/curiosity)"],
  "focusKeyword": "Primary SEO keyword (1-3 words)",
  "searchIntent": "informational | commercial | local | transactional",
  "readerProfile": "Who the article is for",
  "articlePromise": "What the reader will understand or be able to do after reading",
  "narrativeArc": [
    "Opening problem",
    "Key explanation",
    "Practical comparison",
    "Decision guidance",
    "Action step"
  ],
  "headings": [
    {
      "id": "unique-id",
      "level": 2,
      "text": "Heading text",
      "content": "",
      "sectionGoal": "Purpose of this section",
      "uniqueAngle": "What new value this section adds that competitors miss",
      "mustCover": ["point 1", "point 2", "point 3"],
      "avoidCovering": ["point reserved for another section"],
      "recommendedElements": ["bullet-list", "comparison-table"],
      "snippetTarget": "The exact question this section should answer in a quotable 40-60 word block (for AEO/AI engines), or empty if not applicable",
      "transitionFromPrevious": "How this connects from previous section",
      "transitionToNext": "How this prepares the next section"
    }
  ]
}

TITLE RULES:
- For a local van-hire article, place "Van Hire in [Area]" or "[Area] Van Hire" near the beginning.
- Include a concrete payoff such as sizes, verified starting prices, booking checks, collection, requirements or mistakes.
- Generate alternatives using three distinct angles: practical/direct, question-led, and risk/mistake-led.
- Use a number only when the article contains exactly that number of useful items.
- Do not add the year to an evergreen topic merely to look current.
- Never use vague title language such as: "Navigating", "Top Choices", "Expert Tips", "Ultimate Guide", "Complete Guide", "Best Options", "Discover", "Everything You Need to Know", "Unlock the Secrets", "Insider's Guide", or "Simplifying Your Experience".
- Avoid dishonest urgency and promises the article cannot deliver.
- Prefer clarity and specificity over rigid character-count obedience.

HEADING RULES:
- Create 5-7 main sections (H2 level)
- Each H2 can have 2-3 subsections (H3 level)
- Headings should be specific and benefit-led, the kind people scan and think "yes, that's my question". Prefer "What it really costs to hire a Luton for a day" over "Pricing".
- The headings should flow logically and cover the topic comprehensively
- Ensure uniqueness and original structure (no copying)

MODERN SEARCH PLANNING (AEO / GEO / AIO):
- For sections where it makes sense, set "snippetTarget" to the precise question that section will answer in a clean, quotable 40-60 word block. This is what gets pulled into featured snippets, voice answers, and AI engine citations.
- Assign snippetTarget to 2-3 genuinely useful sections, and NEVER more than 3 sections.
- Plan for entity-rich, specific content: sections should invite real numbers, van models, licence types, UK terms, locations — the specific stuff that gets cited by ChatGPT/Perplexity/Gemini, not vague filler.

SECTION PLANNING REQUIREMENTS:
For every heading, include:
- sectionGoal: the exact purpose of this section in the full article
- uniqueAngle: what genuinely useful, TRUTHFUL value this section adds that other blogs skip — a real practical consideration, an honest trade-off, or a correct detail from the provided van/brand data. Do NOT plan angles that would require inventing stats, anecdotes, or insider stories.
- mustCover: 3-5 specific points this section should cover
- avoidCovering: points that belong to other sections
- recommendedElements: choose from:
  ["bullet-list", "numbered-list", "comparison-table", "pricing-table", "checklist", "example-box", "none"]
- transitionFromPrevious: how this section connects to the previous section
- transitionToNext: how this section prepares the reader for the next section

ARTICLE COHESION RULE:
The blog must feel like one complete guide written by one person, not separate disconnected sections.
Each section should build on the previous one.
Avoid repeating the same advice in multiple sections.

SECTION OWNERSHIP:
- Every H2 must solve a different reader problem.
- Do not create both a generic "understand your needs" section and a separate "choose the right van" section when both cover size, volume or payload.
- For a local van-hire article, create no more than ONE pre-booking/terms section and no more than ONE NW2 collection section.
- Never create all three of these as separate H2s: "booking terms", "collection checklist", and "final booking checklist". They overlap.
- A useful local structure is:
  1) the quick local answer and verified collection relationship,
  2) van-size comparison,
  3) verified starting prices,
  4) local access/loading considerations,
  5) what to confirm before booking, using no invented policy details,
  6) collection from the verified NW2 office.
- The final body section may be the NW2 collection section. The separate conclusion already provides the final action step, so do not add a second generic final checklist.
- Include one section that accurately explains collection from the verified NW2 office when the topic targets a supported London service area.

ANTI-AI DETECTION / HUMAN WRITING RULES:
- Break predictable rhythm. Mix short and long.
- Avoid overly structured symmetry and perfect paragraph balance.
- Subtle personal tone and reasonable opinions are good.
- Avoid generic filler and robotic transitions.
- Write like a knowledgeable, clear human — never an algorithm chasing keywords.

TRUTHFULNESS RULE (applies to the outline too):
- Plan only sections that can be filled with TRUE, useful content.
- mustCover points, uniqueAngles and snippetTargets must NOT assume invented statistics, fabricated anecdotes, fake case studies, or specs/prices not present in the provided van/brand data.
- If a section's value would depend on made-up "data" or stories, replace it with a section built on real, general, verifiable guidance instead.

IMPORTANT - DO NOT INCLUDE FAQs:
- Do NOT create a heading like "Frequently Asked Questions" or "FAQ"
- Do NOT create a heading about common questions or Q&A
- FAQs are generated in a SEPARATE step and should NOT be in the headings
- Only create content sections, not FAQ sections

BRAND STRUCTURE RULE:
- If topic is service-related, include ONE heading that could naturally support:
  (a) booking/reservation steps OR
  (b) choosing a provider / comparing options OR
  (c) which van/vehicle is right for you
- If topic is not service-related, do not include booking/contact/provider-comparison headings.

Return ONLY valid JSON.`;

  const client = getOpenAI();
  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      systemMessage,
      { role: "user", content: `Create blog outline for: ${prompt}` },
      { role: "user", content: systemPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.65,
  });

  const rawHeadings = completion.choices[0].message.content || "";
  const result = safeJsonParse<OutlineResult>(rawHeadings, () => ({
    suggestedTitle: "",
    focusKeyword: "",
    headings: [],
  }));

  const titleCandidates = [
    result.suggestedTitle,
    ...(result.titleAlternatives || []),
  ].filter(Boolean);
  const forbiddenTitlePhrases = [
    "navigating",
    "top choices",
    "expert tips",
    "ultimate guide",
    "complete guide",
    "best options",
    "discover",
    "everything you need to know",
    "unlock the secrets",
    "insider's guide",
    "simplifying your experience",
  ];
  const validTitle = titleCandidates.find((candidate) =>
    forbiddenTitlePhrases.every(
      (phrase) => !candidate.toLowerCase().includes(phrase),
    ),
  );
  if (validTitle) {
    result.suggestedTitle = validTitle;
  } else {
    const localContext = findLocalAreaContext(prompt);
    if (localContext && /van|hire|rental/i.test(prompt)) {
      result.suggestedTitle = `Van Hire in ${localContext.areaName}: Sizes, Costs and Booking Checks`;
    }
  }

  const distinctHeadings = enforceDistinctOperationalSections(
    result.headings || [],
  );

  let snippetCount = 0;
  result.headings = distinctHeadings.map((heading) => {
    const snippetTarget = (heading.snippetTarget || "").trim();
    const keepSnippet = Boolean(snippetTarget) && snippetCount < 3;
    if (keepSnippet) snippetCount++;

    return {
      ...heading,
      id: heading.id || generateId(),
      content: "",
      snippetTarget: keepSnippet ? snippetTarget : "",
    };
  });

  console.log(
    `✅ [Step Generator] Generated ${result.headings?.length || 0} headings`,
  );

  return result;
}

// ============================================================================
// STEP 2: GENERATE SECTION CONTENT
// ============================================================================

/**
 * Extract a brief summary from previous sections' content (max 150 words per section)
 * to help the AI understand what's been covered without sending too much data
 */
function extractPreviousContentSummaries(
  headings: any[],
  currentIndex: number,
): string {
  const previousSections = headings.filter(
    (h, i) => i < currentIndex && h.content,
  );

  if (previousSections.length === 0) return "";

  return previousSections
    .map((h) => {
      // Strip HTML tags and get plain text
      const plainText = h.content
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      // Take first 150 words
      const words = plainText.split(/\s+/).slice(0, 150).join(" ");
      return `Section "${h.text}": ${words}${plainText.split(/\s+/).length > 150 ? "..." : ""}`;
    })
    .join("\n\n");
}

export async function generateSectionContent(
  topic: string,
  headingText: string,
  level: number,
  focusKeyword: string,
  headings: any[],
  currentIndex: number,
): Promise<string> {
  console.log(`📝 [Step Generator] Generating content for: ${headingText}`);

  const wordCount = level === 2 ? "350-450" : "220-320";
  const allowContact = isServiceRelatedTopic(topic);

  // Fetch blog list for internal linking context
  const blogList = await fetchBlogList();
  const brandContext = buildBrandContext(topic, allowContact, blogList);
  const systemMessage = buildSystemMessage(brandContext);

  // Build context about all headings for the AI to understand the full blog structure
  const allHeadings = headings
    .map((h, i) => {
      const marker =
        i === currentIndex
          ? "(CURRENT SECTION - write content for this)"
          : h.content
            ? "(already has content)"
            : "";
      return `${i + 1}. [H${h.level}] ${h.text} ${marker}`;
    })
    .join("\n");

  // Extract summaries from previous sections (max 150 words each)
  const previousContentSummaries = extractPreviousContentSummaries(
    headings,
    currentIndex,
  );
  const previousContentContext = previousContentSummaries
    ? `\n\nPREVIOUS SECTIONS CONTENT (read to avoid repetition):\n${previousContentSummaries}`
    : "";

  // Get previously covered topics to avoid repetition
  const previousHeadings = headings
    .filter((h, i) => i < currentIndex && h.content)
    .map((h) => h.text);
  const previousTopicsContext =
    previousHeadings.length > 0
      ? `\n\nAlready covered in earlier sections: ${previousHeadings.join(", ")}`
      : "";
  const currentHeading = headings[currentIndex];

  const sectionPlanContext = `
CURRENT SECTION PLAN:
Section goal: ${currentHeading?.sectionGoal || "Not provided"}
Unique angle (the thing competitors miss): ${currentHeading?.uniqueAngle || "Not provided"}
Snippet target (answer this in a quotable 40-60 word block for AI/voice/snippets): ${currentHeading?.snippetTarget || "Not provided"}

Must cover:
${Array.isArray(currentHeading?.mustCover)
      ? currentHeading.mustCover.map((p: string) => `- ${p}`).join("\n")
      : "Not provided"
    }

Avoid covering:
${Array.isArray(currentHeading?.avoidCovering)
      ? currentHeading.avoidCovering.map((p: string) => `- ${p}`).join("\n")
      : "Not provided"
    }

Recommended elements:
${Array.isArray(currentHeading?.recommendedElements)
      ? currentHeading.recommendedElements.join(", ")
      : "none"
    }

Transition from previous:
${currentHeading?.transitionFromPrevious || "Not provided"}

Transition to next:
${currentHeading?.transitionToNext || "Not provided"}
`;
  const systemPrompt = `Write this section like a real, experienced person sharing what they actually know — not like an SEO article.

CONTEXT - FULL BLOG STRUCTURE:
You are writing ONE section of a complete blog post. Understand the big picture:

COMPLETE HEADINGS LIST:
${allHeadings}
${previousTopicsContext}${previousContentContext}

${sectionPlanContext}

This is section #${currentIndex + 1} of ${headings.length}. The blog flows from the first heading to the last.

LENGTH & BASICS:
- Write ${wordCount} words
- Output HTML only (no heading tags), using <p>, <ul>, <ol>, <li>, <strong>, <em>, <table> where appropriate
- Include focus keyword "${focusKeyword}" naturally ONLY if it fits — never force it
- Use only provided numbers/specs. Every price must use the exact "from £X/day" wording.
- Do not invent documents, deposits, insurance inclusions, mileage charges, late fees, fuel rules, availability or collection arrangements.
- Actionable advice beats vague filler.

VOICE (clear, grounded and consistent):
- Sound knowledgeable and plain-spoken, like a helpful expert talking to one reader.
- Use "you" in educational sections. Use "we/our" only when this is explicitly a company booking or collection section.
- Never refer to Success Van Hire as "they/their" after using "we/our" elsewhere in the article.
- Open with a direct fact, decision or practical consequence. Do not use a theatrical question or a stock conversational aside.
- Do not use phrases such as "Here's the thing", "A common mistake", "can feel daunting", "let's delve into", "make it a breeze", "ready to head off with confidence", "doesn't have to be a chore", or close variations.
- Do not invent first-person anecdotes, customer stories, statistics or case studies.
- Avoid robotic transitions and avoid perfectly symmetrical paragraph patterns.
READER PERSPECTIVE:

- The reader is a customer hiring a van, not a rental company.
- Never write:
  "when you're serving customers from [area]"
  "when serving customers from [area]"
- Write:
  "if you're hiring a van for a job in [area]"
  "customers travelling from [area]"
  "if you're based in [area]"
- Keep educational sections in second person: "you".
- Use "we" only in explicit company, booking or collection sections.


PRICING SAFETY:

- Do not claim that longer rental periods have cheaper daily rates
  unless verified long-term pricing data is supplied.
- Do not invent discounts, package rates or cost-saving policies.
- Safe wording:
  "For longer hires, request a confirmed quote rather than multiplying
  the daily starting price."

BOOKING-TERMS SAFETY:
- Do not list specific driver-age rules, experience rules, identity documents, proof of address, payment methods, deposits, insurance inclusions, mileage terms, late-return charges, fuel policies, excess amounts or extra fees.
- Do not write generic rental-industry assumptions as if they are Success Van Hire policy.
- If this section concerns booking or eligibility, say only that the reader should check the requirements and terms shown in the confirmed booking details.

MODERN SEARCH (AEO / GEO / AIO / SXO) — bake these in invisibly:
- SXO: Front-load value. The first 1-2 sentences must reward the reader immediately so they don't bounce. No warm-up.
- AEO: ONLY if this section has a non-empty snippet target, answer that exact question in one clean, self-contained 40-60 word block. Otherwise do not manufacture a snippet block.
- GEO: Be specific and entity-rich using ONLY the real provided data — actual van model names, load volumes, payloads, and prices from the VAN_FLEET list, plus genuine UK terms (ULEZ, EU6) used correctly. Specificity from real data gets cited by ChatGPT/Perplexity/Gemini; never invent specs or figures to seem specific. Write at least one clean, "quotable" standalone sentence built on real provided facts.
- AIO: State checkable facts plainly so an AI overview can extract them — but ONLY facts actually provided in this prompt. Every number/claim must be accurate and sourced from the given data.
- DIFFERENTIATION: Add a genuinely useful angle competitors skip (a practical consideration, a real trade-off, a sensible checklist), NOT a fabricated "nobody tells you this" stat or story. If a point is obvious, sharpen it with real detail from the provided data or replace it.

COHESION RULE:
This section is one part of a larger guide, not a standalone article.
- Continue naturally from the previous section.
- Don't re-introduce the whole topic or repeat definitions already covered.
- Add NEW value based on the sectionGoal and uniqueAngle.
- Do not force a teaser ending. Use transitionToNext only when it sounds natural; otherwise end after the useful point is complete.

STRUCTURE ELEMENT RULES:
Use formatting based on the section plan.
- If recommendedElements includes "bullet-list": include one useful <ul> with 3-6 items, each adding real value (not filler).
- If it includes "numbered-list": include one <ol> for steps/process.
- If it includes "comparison-table" or "pricing-table": include one HTML <table>, used only for genuinely comparable things (van sizes, costs, pros/cons, requirements, decision factors).
- If it includes "checklist": include a practical checklist as a <ul>.
- If it includes "example-box": include one hypothetical example using <aside class="example-box"><strong>Example:</strong><p>...</p></aside>. Clearly frame it as an example, never as a real customer story.
- If recommendedElements contains anything except "none", you MUST use at least one of those elements here. Never output a paragraph-only section when a list/table is recommended.
- Don't force tables into emotional/intro/conclusion/purely-explanatory sections. Use them when they truly make things clearer.

AVOID REPETITION:
- Don't repeat points covered in other sections or restate the same idea in new words.
- Each section adds NEW information. If another section owns a topic, reference it briefly and move on.
- Do NOT include FAQs — those are generated separately.

CTA RULE:
- Use a CTA only in an explicit booking/provider section or the conclusion.
- Do not end ordinary educational sections with sales language, "ready to book?", or repeated brand prompts.

BRAND & FEATURES USAGE:
- Mention "${BRAND.name}" only in an explicit provider, booking or collection section.
- Do not mention the brand in generic educational sections.
- Use at most one verified brand fact in that section.
- Use the exact office address only in a booking/collection context.
- Never describe the business as being based in the target area unless that location is verified.

REAL FACTS INJECTION:
- If this section touches pricing, long-term hire, reliability, service quality, or choosing a provider, you MAY weave in ONE relevant REAL BRAND FACT (from the provided data only) as a subtle one-line proof point. Never invent a fact to fill this.

SECTION OPENING RULE:
Each section must open differently from the others. One with a question. One with a quick relatable situation (framed generally, not as a fabricated personal anecdote). One with a clear, bold statement. One with a real provided figure (e.g. a real van price from the fleet data) — never a made-up statistic. Never start every section the same way.

ADMIN PLACEHOLDERS:
- If van cards would help here, insert ONE marker on its own line after the relevant paragraph:
  **SHOW_VANS: Van Name 1, Van Name 2**
- Use only exact VAN_FLEET names.
- If a real published blog is genuinely relevant, use the exact marker supplied in the internal-link context:
  **link to (EXACT BLOG TOPIC)**
- Both marker types are intentional and must remain visible to the admin.

Return ONLY the HTML content (no heading tags).`;

  const userPrompt = `Write content for the section: "${headingText}"

Blog topic: ${topic}
Heading level: H${level}
Section position: ${currentIndex + 1} of ${headings.length} in this blog

Make it feel like genuine, experienced advice. Specific, human, and more useful than anything a competitor wrote on this.
Ensure this section complements - not duplicates - the other sections.`;

  const client3 = getOpenAI();
  const completion = await client3.chat.completions.create({
    model: "gpt-4o",
    messages: [
      systemMessage,
      { role: "user", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.65,
  });

  const content = completion.choices[0].message.content || "";

  // Clean up any markdown code blocks or HTML document tags
  let cleanedContent = content;
  cleanedContent = cleanedContent.replace(/```html\n?/g, "");
  cleanedContent = cleanedContent.replace(/```\n?/g, "");
  cleanedContent = cleanedContent.replace(/<!DOCTYPE[^>]*>/gi, "");
  cleanedContent = cleanedContent.replace(/<\/html[^>]*>/gi, "");
  cleanedContent = cleanedContent.replace(/<head[^>]*>[^<]*<\/head>/gi, "");
  cleanedContent = cleanedContent.replace(/<body[^>]*>|<\/body>/gi, "");
  cleanedContent = cleanedContent.replace(/<title>[^<]*<\/title>/gi, "");
  cleanedContent = cleanedContent.replace(/<meta[^>]*>/gi, "");
  cleanedContent = cleanedContent.trim();

  const localContext = findLocalAreaContext(topic);
  cleanedContent = sanitiseLocalBusinessClaims(cleanedContent, localContext);
  cleanedContent = ensureCollectionAddressForRelevantSection(
    cleanedContent,
    headingText,
    localContext,
  );
  cleanedContent = sanitiseUnsupportedBookingClaims(
    cleanedContent,
    headingText,
  );
  cleanedContent = sanitiseVanMarkers(cleanedContent);
  cleanedContent = sanitiseInternalLinkMarkers(cleanedContent, blogList, topic);
  cleanedContent = enforceSectionLimits(cleanedContent);
  cleanedContent = enforceIncrementalArticleLimits(
    cleanedContent,
    headings,
    currentIndex,
  );

  console.log(
    `✅ [Step Generator] Content generated (${cleanedContent.length} chars)`,
  );

  return cleanedContent;
}

// ============================================================================
// STEP 3: GENERATE SUMMARY
// ============================================================================

export async function generateSummary(
  topic: string,
  title: string,
  focusKeyword: string,
): Promise<string> {
  console.log(`📋 [Step Generator] Generating summary for: ${topic}`);

  const allowContact = isServiceRelatedTopic(topic);
  const blogList = await fetchBlogList();
  const brandContext = buildBrandContext(topic, allowContact, blogList);
  const systemMessage = buildSystemMessage(brandContext);

  const systemPrompt = `Write the opening of the blog — the intro that decides whether someone keeps reading or bounces.

Requirements:
- 120-180 words
- Give immediate practical value in the first sentence. Start with a direct decision, verified fact or practical consequence, not a theatrical hook.
- Do not open with "Picture this", "Ever felt", "You're not alone", "tricky puzzle", "choices can be overwhelming", "that's where this guide comes in", "without any guesswork", "let's get started", "buckle up", "unlock the secrets", "insider's guide", "In today's world", "When it comes to", or "Whether you're...".
- Make a clear promise of what they'll get out of the article (the payoff), in a human way.
- Sound like a real person who does this for a living talking to one reader. Use "you". Contractions. A little personality.
- Include focus keyword "${focusKeyword}" naturally (don't force it).
- HTML tags only: <p>, <strong>, <em>

AEO/SXO NOTE:
- State the article's practical answer or decision criteria plainly, but do not duplicate a planned body snippet word-for-word.
- Front-load value: the reader should understand the article's payoff within two sentences.

HUMAN WRITING RULES:
- Mix sentence lengths. Short punch. Then a longer thought.
- No robotic transitions, no perfect symmetry, no filler.
- Write like experience, not like an algorithm.

BRAND USAGE:
- Keep the summary educational and do not mention the brand, phone or address.
- Do not include SHOW_VANS or internal-link markers in the summary.

Return ONLY HTML starting with <p> and ending with </p>.`;

  const userPrompt = `Write an introduction for a blog post titled: "${title}"

Topic: ${topic}

Make it compelling enough that someone keeps scrolling — like the start of advice from someone who actually knows their stuff.`;

  const client3 = getOpenAI();
  const completion = await client3.chat.completions.create({
    model: "gpt-4o",
    messages: [
      systemMessage,
      { role: "user", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.6,
  });

  let summary = completion.choices[0].message.content || "";

  summary = summary.replace(/```html\n?/g, "");
  summary = summary.replace(/```\n?/g, "");
  summary = summary.replace(/<!DOCTYPE[^>]*>/gi, "");
  summary = summary.replace(/<\/?html[^>]*>/gi, "");
  summary = summary.replace(/<\/?head[^>]*>/gi, "");
  summary = summary.replace(/<\/?body[^>]*>/gi, "");
  summary = summary.replace(/<title>[^<]*<\/title>/gi, "");
  summary = summary.replace(/<meta[^>]*>/gi, "");
  summary = summary.trim();

  console.log(
    `✅ [Step Generator] Summary generated (${summary.length} chars)`,
  );

  return summary;
}

// ============================================================================
// STEP 4: GENERATE CONCLUSION
// ============================================================================

export async function generateConclusion(
  topic: string,
  title: string,
  focusKeyword: string,
  headings: any[],
): Promise<string> {
  console.log(`🎯 [Step Generator] Generating conclusion`);

  const allowContact = isServiceRelatedTopic(topic);
  const blogList = await fetchBlogList();
  const brandContext = buildBrandContext(topic, allowContact, blogList);
  const systemMessage = buildSystemMessage(brandContext);

  const mainPoints = headings
    .filter((h) => h.level === 2)
    .slice(0, 3)
    .map((h) => h.text)
    .join(", ");

  const systemPrompt = `Write the ending — the part that leaves the reader feeling sorted and knowing exactly what to do next.

Requirements:
- 120-150 words
- Pull the key takeaways together in a natural, human way (don't just list them back robotically — say it like you're wrapping up a chat).
- Give ONE clear next step / CTA that feels genuinely helpful, not salesy.
- Include focus keyword "${focusKeyword}" naturally.
- HTML tags only: <p>, <strong>, <em>. No heading tags.
- Do NOT open with "In conclusion", "To sum up", "All in all", or any robotic closer. Start like a person actually would.

ADDRESS REPETITION:

- If the full office address already appears in a collection section,
  do not repeat the full address in the conclusion.
- Refer to it as "our NW2 office".
- The full address should normally appear no more than twice in the article.

HUMAN WRITING RULES:
- Mix sentence lengths, keep it warm and confident.
- No robotic transitions, no perfect symmetry, no filler.

BRAND USAGE AND PERSPECTIVE:
- Write the CTA in the company's first-person voice: use "we", "our" or "contact us".
- Do not refer to Success Van Hire as "they" or "their".
- You may name "${BRAND.name}" once, but do not combine "our" voice with third-person brand language in the same conclusion.
- If the topic targets a local London area, accurately say that collection is from ${BRAND.address}; never imply a branch in the target area.
- Do not invent availability, insurance, document or price promises.
- Do not use "So, there you have it", "Happy travels", "ready to hit the road", or similar generic endings.
- Do not include SHOW_VANS or internal-link markers in the conclusion.

Return ONLY HTML starting with <p> and ending with </p>.`;

  const userPrompt = `Write a conclusion for: "${title}"

Main topics covered: ${mainPoints}
Topic: ${topic}

Make it land — memorable, warm, and clear on the next step.`;

  const client4 = getOpenAI();
  const completion = await client4.chat.completions.create({
    model: "gpt-4o",
    messages: [
      systemMessage,
      { role: "user", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.6,
  });

  let conclusion = completion.choices[0].message.content || "";

  conclusion = conclusion.replace(/```html\n?/g, "");
  conclusion = conclusion.replace(/```\n?/g, "");
  conclusion = conclusion.replace(/<!DOCTYPE[^>]*>/gi, "");
  conclusion = conclusion.replace(/<\/?html[^>]*>/gi, "");
  conclusion = conclusion.replace(/<\/?head[^>]*>/gi, "");
  conclusion = conclusion.replace(/<\/?body[^>]*>/gi, "");
  conclusion = conclusion.replace(/<title>[^<]*<\/title>/gi, "");
  conclusion = conclusion.replace(/<meta[^>]*>/gi, "");
  conclusion = conclusion.replace(/<\/?h[1-6][^>]*>/gi, "");
  conclusion = conclusion.trim();

  console.log(
    `✅ [Step Generator] Conclusion generated (${conclusion.length} chars)`,
  );

  return conclusion;
}

// ============================================================================
// STEP 5: GENERATE FAQs
// ============================================================================

export async function generateFAQs(
  topic: string,
  focusKeyword: string,
  headings: any[],
): Promise<any[]> {
  console.log(`❓ [Step Generator] Generating FAQs`);
  console.log(
    `   Total headings with content: ${headings.filter((h) => h.content).length}`,
  );

  const allowContact = isServiceRelatedTopic(topic);
  const blogList = await fetchBlogList();
  const brandContext = buildBrandContext(topic, allowContact, blogList);
  const systemMessage = buildSystemMessage(brandContext);

  const mainTopics = headings
    .filter((h) => h.level === 2)
    .map((h) => h.text)
    .join(", ");

  const fullContent = headings
    .filter((h) => h.content)
    .map((h) => {
      const cleanContent = (h.content || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return `${h.text}: ${cleanContent}`;
    })
    .join("\n\n");

  const contentContext =
    fullContent.length > 3000
      ? fullContent.substring(0, 3000) + "..."
      : fullContent;

  console.log(`   Content context length: ${contentContext.length} characters`);

  const systemPrompt = `Create FAQs that win the "People Also Ask" boxes and get cited by AI answer engines — while still sounding like a real person answering.

Requirements:
- Generate exactly 5-9 FAQ pairs
- Questions must be REAL questions people actually type or ask an AI about this topic — phrase them in natural search language ("How much does it cost to...", "What size van do I need for...", "Can I drive a... on a normal licence?", "Do I need...?"). Avoid generic textbook questions.
- Tie questions to the content, but do not simply repeat H2 headings or copy paragraphs from the article.
- Prefer follow-up questions the body did not fully resolve.
- Mix: sizing, verified starting prices, collection, terms to confirm, licence caution and practical concerns.
- Answers 50-100 words each, in a warm, plain-spoken human voice — but lead with a direct, self-contained answer in the FIRST sentence (this is what AI engines and voice assistants quote). Then add the useful context.
- Use only supplied fleet categories, prices and specifications. Always write prices as "from £X/day".
- Never invent documents, deposits, insurance inclusions, mileage, fees, age rules or local availability.
- Never guarantee licence entitlement; advise checking current GOV.UK/DVLA guidance when relevant.
- Include focus keyword "${focusKeyword}" naturally in 2-3 FAQs.
- Plain text only (no HTML).

BRAND USAGE:
- Keep FAQs educational. Do not include phone/address.
- Mention "${BRAND.name}" at most once across all FAQs and only when directly necessary.
- Do not include SHOW_VANS or internal-link markers in FAQs.

Return JSON:
{
  "faqs": [
    { "id": "faq-1", "question": "...?", "answer": "..." }
  ]
}

Return ONLY valid JSON.`;

  const userPrompt = `Generate 5-9 FAQs for a blog about: "${topic}"

Main sections covered: ${mainTopics}

Blog content summary:
${contentContext}

Create FAQs that match how real people search and ask, and that directly address the content above.`;

  const client5 = getOpenAI();
  const completion = await client5.chat.completions.create({
    model: "gpt-4o",
    messages: [
      systemMessage,
      { role: "user", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.6,
  });

  const rawFaqs = completion.choices[0].message.content || "";

  // ✅ SAFE parse (no crash)
  const result = safeJsonParse<FAQResult | FAQItem[]>(rawFaqs, () => ({ faqs: [] }));

  // ✅ Normalize possible shapes
  let faqsArray: any[] = [];
  if (Array.isArray(result)) faqsArray = result;
  else if (Array.isArray(result.faqs)) faqsArray = result.faqs;
  else if (Array.isArray(result.faq)) faqsArray = result.faq;
  else faqsArray = [];

  if (faqsArray.length < 5) {
    console.warn(
      `⚠️ Only ${faqsArray.length} FAQs generated, expected minimum 5`,
    );
  }
  if (faqsArray.length > 9) {
    console.warn(`⚠️ ${faqsArray.length} FAQs generated, limiting to 9`);
    faqsArray = faqsArray.slice(0, 9);
  }

  // ✅ Ensure each FAQ has an id
  const faqs = faqsArray.map((faq: any, index: number) => ({
    ...faq,
    id: faq?.id || `faq-${index + 1}`,
  }));

  console.log(`✅ [Step Generator] Generated ${faqs.length} FAQs`);

  return faqs;
}

// ============================================================================
// STEP 6: GENERATE SEO METADATA
// ============================================================================

export async function generateSEOMetadata(
  topic: string,
  title: string,
  headings: any[],
  faqs: any[],
  summary?: string,
  conclusion?: string,
): Promise<any> {
  console.log(`🔍 [Step Generator] Generating SEO metadata`);

  const allowContact = isServiceRelatedTopic(topic);
  const blogList = await fetchBlogList();
  const brandContext = buildBrandContext(topic, allowContact, blogList);
  const systemMessage = buildSystemMessage(brandContext);

  const systemPrompt = `You are an SEO expert who also understands AI answer engines. Generate SEO metadata that earns clicks AND reads naturally.

Requirements:
- Meta description: usually 140-155 characters.
- Describe at least two concrete benefits actually covered, such as van sizes, verified starting prices, booking checks, local access or collection from the NW2 office.
- Include the focus keyword naturally if it reads well.
- Do not use empty phrases such as "discover the best", "expert tips", "simplify your experience", "everything you need", "unlock the secrets", "insider's guide", "perfect van", or "hassle-free experience".
- Do not imply an office or branch in the target area.
- Tags: 7-10 relevant, natural tags. Do not create fake internal links or stuffed anchor phrases.

BRAND USAGE:
- Do not force the brand name into the meta description.
- For a local article, you may mention collection from the nearby NW2 office if it fits accurately.
- Do not include phone details in metadata.

Return JSON:
{
  "seoDescription": "Meta description text",
  "tags": ["tag1", "tag2", ...]
}

Return ONLY valid JSON.`;

  const mainTopics = headings
    .filter((h) => h.level === 2)
    .slice(0, 3)
    .map((h) => h.text)
    .join(", ");

  const summaryText = summary
    ? summary.replace(/<[^>]*>/g, " ").substring(0, 200)
    : "";
  const conclusionText = conclusion
    ? conclusion.replace(/<[^>]*>/g, " ").substring(0, 200)
    : "";

  const userPrompt = `Generate SEO metadata for: "${title}"

Topic: ${topic}
Main sections: ${mainTopics}
${summaryText ? `\nSummary: ${summaryText}` : ""}
${conclusionText ? `\nConclusion: ${conclusionText}` : ""}`;

  const client6 = getOpenAI();
  const completion = await client6.chat.completions.create({
    model: "gpt-4o",
    messages: [
      systemMessage,
      { role: "user", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
  });

  const rawSeo = completion.choices[0].message.content || "";
  const seoResult = safeJsonParse<SEOResult>(rawSeo, () => ({
    seoDescription: "",
    tags: [],
  }));

  // Then continue using seoResult instead of result:
  if (!seoResult.author) seoResult.author = "admin";

  seoResult.publishDate = new Date().toISOString();
  seoResult.anchors = extractInternalLinkAnchors(
    headings,
    blogList,
    topic,
  );

  console.log(`✅ [Step Generator] SEO metadata generated`);
  return seoResult;
}

// ============================================================================
// ✅ CONSTRAINT ENFORCEMENT (code-level, NOT just prompt instructions)
//
// The prompts ASK the model to respect limits (max SHOW_VANS, max internal
// links, max brand mentions), but models frequently ignore them. These helpers
// HARD-ENFORCE the limits after generation so the output is always within spec.
// ============================================================================

export const ENFORCEMENT_LIMITS = {
  vanMarkersPerSection: 1,
  vanMarkersPerArticle: 3,
  internalLinksPerArticle: 3,
  brandMentionsPerSection: 1,
  brandMentionsPerArticle: 2,
};

const VAN_MARKER_REGEX = /\*\*SHOW_VANS:\s*([\s\S]*?)\*\*/g;
const INTERNAL_LINK_REGEX = /\*\*link to \(([^)]*)\)\*\*/g;

function countMatches(text: string, regexSource: string): number {
  const re = new RegExp(regexSource, "g");
  let count = 0;
  while (re.exec(text || "") !== null) count++;
  return count;
}

function countBrandMentions(text: string): number {
  if (!text) return 0;
  const escaped = BRAND.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.match(new RegExp(escaped, "gi"))?.length || 0;
}

function trimToLimit(
  text: string,
  globalRegexSource: string,
  keep: number,
  replaceExtra: (match: string, innerGroup: string) => string,
): string {
  const re = new RegExp(globalRegexSource, "g");
  let seen = 0;
  return text.replace(re, (full, inner) => {
    seen++;
    return seen <= Math.max(0, keep)
      ? full
      : replaceExtra(full, inner ?? "");
  });
}

/**
 * Keep intentional SHOW_VANS markers, but make every marker canonical.
 * Unknown names are removed rather than passed to the card renderer.
 */
function sanitiseVanMarkers(content: string): string {
  const canonicalNames = new Map(
    VAN_FLEET.map((van) => [van.name.toLowerCase(), van.name]),
  );

  return content.replace(
    new RegExp(VAN_MARKER_REGEX.source, "g"),
    (_full, rawNames: string) => {
      const names = rawNames
        .split(",")
        .map((name) => name.trim())
        .map((name) => canonicalNames.get(name.toLowerCase()))
        .filter((name): name is string => Boolean(name));
      const uniqueNames = [...new Set(names)];
      return uniqueNames.length
        ? `**SHOW_VANS: ${uniqueNames.join(", ")}**`
        : "";
    },
  );
}

/**
 * Keep internal-link markers only when they match a real fetched blog topic.
 * Invalid/self-link markers become readable plain topic text.
 */
function sanitiseInternalLinkMarkers(
  content: string,
  blogs: BlogListItem[],
  currentTopic: string,
): string {
  const normalise = (value: string) =>
    (value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const current = normalise(currentTopic);
  const exactTopics = new Map(
    blogs
      .filter((blog) => blog.topic && normalise(blog.topic) !== current)
      .map((blog) => [normalise(blog.topic), blog.topic]),
  );

  return content.replace(
    new RegExp(INTERNAL_LINK_REGEX.source, "g"),
    (_full, rawTopic: string) => {
      const readable = (rawTopic || "").trim();
      const exactTopic = exactTopics.get(normalise(readable));
      return exactTopic ? `**link to (${exactTopic})**` : readable;
    },
  );
}

function buildInternalBlogUrl(slug: string): string {
  const cleanSlug = (slug || "").replace(/^\/+|\/+$/g, "");
  if (!cleanSlug) return "";
  return cleanSlug.startsWith("blog/")
    ? `/${cleanSlug}`
    : `/blog/${cleanSlug}`;
}

/**
 * Build the Auto-Links UI data only from valid markers already present in body
 * sections. This prevents made-up anchor keywords such as
 * "affordable van hire in Mill Hill".
 */
function extractInternalLinkAnchors(
  headings: HeadingPlan[],
  blogs: BlogListItem[],
  currentTopic: string,
): InternalLinkAnchor[] {
  const normalise = (value: string) =>
    (value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const current = normalise(currentTopic);
  const realBlogs = new Map(
    blogs
      .filter(
        (blog) =>
          blog.topic &&
          blog.slug &&
          normalise(blog.topic) !== current,
      )
      .map((blog) => [normalise(blog.topic), blog]),
  );

  const anchors: InternalLinkAnchor[] = [];
  const seen = new Set<string>();

  for (const heading of headings) {
    const content = heading.content || "";
    const regex = new RegExp(INTERNAL_LINK_REGEX.source, "g");
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      const blog = realBlogs.get(normalise(match[1] || ""));
      if (!blog || seen.has(blog.slug)) continue;

      const url = buildInternalBlogUrl(blog.slug);
      if (!url) continue;

      seen.add(blog.slug);
      anchors.push({
        id: generateId(),
        keyword: blog.topic,
        url,
      });

      if (anchors.length >= ENFORCEMENT_LIMITS.internalLinksPerArticle) {
        return anchors;
      }
    }
  }

  return anchors;
}

/**
 * Enforce the per-section marker limit. Brand text is never rewritten with a
 * blind regex because that produced broken phrases such as "we provides".
 */
export function enforceSectionLimits(sectionHtml: string): string {
  if (!sectionHtml) return sectionHtml;

  const out = trimToLimit(
    sectionHtml,
    VAN_MARKER_REGEX.source,
    ENFORCEMENT_LIMITS.vanMarkersPerSection,
    () => "",
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const brandCount = countBrandMentions(out);
  if (brandCount > ENFORCEMENT_LIMITS.brandMentionsPerSection) {
    console.warn(
      `⚠️ [Brand Review] Section contains ${brandCount} brand mentions. Text was preserved to avoid damaging grammar.`,
    );
  }

  return out;
}

/**
 * Automatic article-wide budgets for the current section. Since
 * generateSectionContent receives all earlier headings, no shared/global state
 * or caller-only enforcement is required.
 */
function enforceIncrementalArticleLimits(
  currentSectionHtml: string,
  headings: Array<{ content?: string }>,
  currentIndex: number,
): string {
  const previousContent = headings
    .slice(0, currentIndex)
    .map((heading) => heading.content || "")
    .join("\n");

  const remainingVans = Math.max(
    0,
    ENFORCEMENT_LIMITS.vanMarkersPerArticle -
    countMatches(previousContent, VAN_MARKER_REGEX.source),
  );
  const remainingLinks = Math.max(
    0,
    ENFORCEMENT_LIMITS.internalLinksPerArticle -
    countMatches(previousContent, INTERNAL_LINK_REGEX.source),
  );

  let out = trimToLimit(
    currentSectionHtml,
    VAN_MARKER_REGEX.source,
    remainingVans,
    () => "",
  );
  out = trimToLimit(
    out,
    INTERNAL_LINK_REGEX.source,
    remainingLinks,
    (_match, topic) => topic.trim(),
  );

  const totalBrandMentions =
    countBrandMentions(previousContent) + countBrandMentions(out);
  if (totalBrandMentions > ENFORCEMENT_LIMITS.brandMentionsPerArticle) {
    console.warn(
      `⚠️ [Brand Review] Generated sections currently contain ${totalBrandMentions} brand mentions. Content was not regex-rewritten.`,
    );
  }

  return out.replace(/\n{3,}/g, "\n\n").trim();
}

export interface ArticleEnforcementResult {
  sections: string[];
  removedVanMarkers: number;
  removedLinks: number;
  /** @deprecated Brand names are no longer regex-replaced. */
  reducedBrandMentions: number;
  excessBrandMentions: number;
}

/**
 * Final safety pass. Intentional markers inside the configured limits remain.
 * Extra link markers keep readable text. Brand text is reported, not damaged.
 */
export function enforceArticleLimits(
  sectionHtmls: string[],
): ArticleEnforcementResult {
  let vanBudget = ENFORCEMENT_LIMITS.vanMarkersPerArticle;
  let linkBudget = ENFORCEMENT_LIMITS.internalLinksPerArticle;
  let removedVanMarkers = 0;
  let removedLinks = 0;

  const sections = sectionHtmls.map((html) => {
    if (!html) return html;
    let out = sanitiseVanMarkers(html);

    out = out.replace(new RegExp(VAN_MARKER_REGEX.source, "g"), (full) => {
      if (vanBudget > 0) {
        vanBudget--;
        return full;
      }
      removedVanMarkers++;
      return "";
    });

    out = out.replace(
      new RegExp(INTERNAL_LINK_REGEX.source, "g"),
      (full, inner: string) => {
        if (linkBudget > 0) {
          linkBudget--;
          return full;
        }
        removedLinks++;
        return (inner || "").trim();
      },
    );

    return out.replace(/\n{3,}/g, "\n\n").trim();
  });

  const totalBrandMentions = countBrandMentions(sections.join("\n"));
  const excessBrandMentions = Math.max(
    0,
    totalBrandMentions - ENFORCEMENT_LIMITS.brandMentionsPerArticle,
  );

  if (removedVanMarkers || removedLinks || excessBrandMentions) {
    console.warn(
      `🔒 [Enforcement] extraVanMarkers:${removedVanMarkers}, extraLinks:${removedLinks}, excessBrandMentions:${excessBrandMentions}`,
    );
  }

  return {
    sections,
    removedVanMarkers,
    removedLinks,
    reducedBrandMentions: 0,
    excessBrandMentions,
  };
}

export interface GeneratedContentValidation {
  warnings: string[];
  errors: string[];
}

/**
 * Optional pre-save/publish validation. SHOW_VANS and link markers are valid
 * admin placeholders and are intentionally not treated as errors.
 */
export function validateGeneratedContent(
  topic: string,
  title: string,
  contentParts: string[],
  seoDescription = "",
): GeneratedContentValidation {
  const warnings: string[] = [];
  const errors: string[] = [];
  const allContent = contentParts.join("\n");
  const localContext = findLocalAreaContext(topic);

  const forbiddenTitlePhrases = [
    "navigating",
    "top choices",
    "expert tips",
    "ultimate guide",
    "complete guide",
    "best options",
    "unlock the secrets",
    "insider's guide",
  ];
  if (!title.trim()) errors.push("Missing title.");
  if (
    forbiddenTitlePhrases.some((phrase) =>
      title.toLowerCase().includes(phrase),
    )
  ) {
    warnings.push("Title contains a banned generic phrase.");
  }

  if (localContext) {
    const lower = allContent.toLowerCase();
    for (const claim of localContext.forbiddenClaims) {
      if (lower.includes(claim.toLowerCase())) {
        errors.push(`False local-location wording detected: ${claim}`);
      }
    }
  }

  const unsafeClaims = [
    "100% satisfaction",
    "uk-wide service",
    "guarantees your van",
    "full insurance coverage",
    "no hidden fees",
    "proof of address",
    "utility bill",
    "bank statement",
    "personal identification",
    "additional identification",
    "driver age",
    "experience requirements",
    "deposit",
    "mileage charge",
    "extra mileage",
    "late return fee",
    "insurance coverage",
    "payment method",
    "fuel policy",
  ];
  for (const claim of unsafeClaims) {
    if (allContent.toLowerCase().includes(claim)) {
      errors.push(`Unsupported booking-policy claim detected: ${claim}`);
    }
  }

  for (const phrase of BANNED_CLICHE_PHRASES) {
    if (allContent.toLowerCase().includes(phrase)) {
      warnings.push(`Formulaic phrase detected: ${phrase}`);
    }
  }

  const brandMentions = countBrandMentions(allContent);
  if (brandMentions > ENFORCEMENT_LIMITS.brandMentionsPerArticle) {
    warnings.push(
      `Brand is mentioned ${brandMentions} times; target is ${ENFORCEMENT_LIMITS.brandMentionsPerArticle}.`,
    );
  }

  if (seoDescription && seoDescription.length < 120) {
    warnings.push("Meta description is unusually short.");
  }

  return { warnings, errors };
}

// ============================================================================
// HELPER: Parse van markers from content
// ============================================================================

export interface VanMarker {
  fullMatch: string;
  vanNames: string[];
}

/**
 * Extract all **SHOW_VANS: ...** markers from content
 */
export function parseVanMarkers(content: string): VanMarker[] {
  const regex = /\*\*SHOW_VANS:\s*([\s\S]*?)\*\*/g;
  const markers: VanMarker[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    const vanNames = match[1]
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    markers.push({
      fullMatch: match[0],
      vanNames,
    });
  }

  return markers;
}

/**
 * Get van data by names (for rendering)
 */
export function getVansByNames(names: string[]): typeof VAN_FLEET {
  return VAN_FLEET.filter((van) =>
    names.some(
      (name) =>
        van.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(van.name.toLowerCase()),
    ),
  );
}

// Export van fleet for external use
export { VAN_FLEET };