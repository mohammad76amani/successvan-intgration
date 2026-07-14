/**
 * Fast AI Van Consultant Agent
 *
 * A streamlined agent that completes the booking in ~1 minute:
 * 1. ASK ONCE - Get all needs in 1-2 questions max
 * 2. SHOW SUGGESTIONS - Display matching categories as cards
 * 3. COMPLETE BOOKING - Collect dates, verify phone, create reservation
 */

import { getOpenAI } from "./openai";
import connect from "@/lib/data";
import Category from "@/model/category";
import Office from "@/model/office";
import User from "@/model/user";
import Reservation from "@/model/reservation";
import jwt from "jsonwebtoken";

// Simple in-memory cache to reduce DB hits during fast flow
const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedCategories: { data: any[]; expiresAt: number } | null = null;
let cachedOffices: { data: any[]; expiresAt: number } | null = null;

async function getCachedCategories() {
  const now = Date.now();
  if (cachedCategories && cachedCategories.expiresAt > now) {
    return cachedCategories.data;
  }
  const data = await Category.find({}).lean();
  cachedCategories = { data, expiresAt: now + CACHE_TTL_MS };
  return data;
}

async function getCachedOffices() {
  const now = Date.now();
  if (cachedOffices && cachedOffices.expiresAt > now) {
    return cachedOffices.data;
  }
  const data = await Office.find({}).lean();
  cachedOffices = { data, expiresAt: now + CACHE_TTL_MS };
  return data;
}



// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type FastPhase =
  | "ask_needs" // Quick question about needs
  | "show_suggestions" // Display category cards
  | "collect_booking" // Get dates, office, age
  | "select_Gearbox" // Select gear type
  | "select_addons" // Optional add-ons selection
  | "show_receipt" // Show price and booking summary
  | "verify_phone" // Phone verification
  | "complete"; // Done!

export interface CategorySuggestion {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  fuel: string;
  gear: {
    availableTypes: string[];
    automaticExtraCost?: number;
  } | string;
  seats: number;
  doors: number;
  pricingTiers: Array<{
    minDays: number;
    maxDays: number;
    pricePerDay: number;
  }>;
  extrahoursRate?: number;
  matchScore: number; // 1-100 how well it matches needs
  matchReason: string; // Why this was suggested
}

export interface AddOnOption {
  _id: string;
  name: string;
  description?: string;
  type?: string;
  pricingType: "flat" | "tiered";
  flatPrice?: {
    amount: number;
    isPerDay: boolean;
  };
  tieredPrice?: {
    isPerDay: boolean;
    tiers: Array<{
      minDays: number;
      maxDays: number;
      price: number;
    }>;
  };
}

export interface SelectedAddOn {
  addOnId: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export interface FastAgentState {
  phase: FastPhase;

  // User needs (gathered in 1 question)
  needs?: {
    purpose: string;
    description: string;
    size: "small" | "medium" | "large";
  };

  // Suggestions (categories that match)
  suggestions?: CategorySuggestion[];
  selectedCategory?: CategorySuggestion;

  // Booking data
  booking: {
    officeId?: string;
    officeName?: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    driverAge?: number;
    phoneNumber?: string;
    gearType?: "manual" | "automatic";
    message?: string;
    // Calculated price
    totalDays?: number;
    extraHours?: number;
    pricePerDay?: number;
    extraHoursRate?: number;
    totalPrice?: number;
    priceBreakdown?: string;
    // Add-ons
    selectedAddOns?: SelectedAddOn[];
    addOnsTotal?: number;
  };

  // Available add-ons (fetched from DB)
  availableAddOns?: AddOnOption[];

  // Auth
  userId?: string;
  userToken?: string;
  isNewUser?: boolean;
  verificationSent?: boolean;

  // Result
  reservationId?: string;
}

export interface FastAgentResponse {
  message: string;
  state: FastAgentState;
  showSuggestions: boolean;
  needsPhoneInput: boolean;
  needsCodeInput: boolean;
  needsBookingForm: boolean;
  needsAddOns: boolean;
  needsReceipt: boolean;
  isComplete: boolean;
  error?: string;
}

// ============================================================================
// MAIN AGENT FUNCTION
// ============================================================================

function wordNumberToInt(word: string): number | null {
  const map: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
  };
  return map[word.toLowerCase()] ?? null;
}

function extractBoxHeuristic(message: string, existingNeeds?: FastAgentState["needs"]) {
  const text = message.toLowerCase();
  if (!text.includes("box")) return null;

  // Quantity: digits or word numbers near "box/boxes"
  let quantity: number | null = null;
  const qtyDigitMatch = text.match(/(\d+)\s*(boxes?|box)/);
  if (qtyDigitMatch) {
    quantity = parseInt(qtyDigitMatch[1], 10);
  } else {
    const qtyWordMatch = text.match(
      /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b\s*(boxes?|box)/
    );
    if (qtyWordMatch) {
      quantity = wordNumberToInt(qtyWordMatch[1]);
    }
  }

  // Weight: capture kg
  let weightKg: number | null = null;
  const weightMatch = text.match(/(\d+(?:\.\d+)?)\s*(kg|kilograms?)/);
  if (weightMatch) {
    weightKg = parseFloat(weightMatch[1]);
  }

  const isEach = text.includes("each");
  const isTotal = text.includes("total");

  // Dimensions: capture meters/centimeters/feet
  const dimMatches = Array.from(
    text.matchAll(/(\d+(?:\.\d+)?)\s*(m|meter|metre|cm|centimeter|centimetre|ft|feet)/g)
  );
  let maxDimM: number | null = null;
  if (dimMatches.length > 0) {
    maxDimM = Math.max(
      ...dimMatches.map((m) => {
        const val = parseFloat(m[1]);
        const unit = m[2];
        if (unit === "cm" || unit.startsWith("centi")) return val / 100;
        if (unit === "ft" || unit === "feet") return val * 0.3048;
        return val; // meters
      })
    );
  }

  // Use existing needs when user gives partial follow-up
  const prevQty = existingNeeds?.description?.match(/(\d+)\s*boxes?/)?.[1];
  if (!quantity && prevQty) quantity = parseInt(prevQty, 10);

  let totalWeightKg: number | null = null;
  if (weightKg !== null && quantity) {
    totalWeightKg = isEach ? weightKg * quantity : weightKg;
  } else if (weightKg !== null) {
    totalWeightKg = weightKg;
  }

  if (!quantity && !totalWeightKg && !maxDimM) return null;

  let size: "small" | "medium" | "large" = "small";
  if ((maxDimM && maxDimM >= 2) || (totalWeightKg && totalWeightKg >= 300)) {
    size = "large";
  } else if ((totalWeightKg && totalWeightKg >= 120) || (quantity && quantity >= 10)) {
    size = "medium";
  }

  const descParts = [];
  if (quantity) descParts.push(`${quantity} boxes`);
  if (totalWeightKg) descParts.push(`${totalWeightKg} kg total`);
  if (maxDimM) descParts.push(`${maxDimM}m max dimension`);

  return {
    needs: {
      purpose: "moving",
      description: descParts.join(", "),
      size,
    },
    quantity,
    totalWeightKg,
    maxDimM,
  };
}

export async function processFastAgent(
  userMessage: string,
  currentState: FastAgentState,
  action?: string, // "select_category" | "submit_booking" | "send_code" | "verify_code" | "voice_parsed"
  parsedData?: any
): Promise<FastAgentResponse> {
  const startedAt = Date.now();
  console.log("⚡ [Fast Agent] Processing...");
  console.log("📍 Phase:", currentState.phase);
  console.log("💬 Message:", userMessage);
  console.log("🎯 Action:", action);

  await connect();

  try {
    let response: FastAgentResponse;
    switch (currentState.phase) {
      case "ask_needs":
        if (action === "voice_parsed" && parsedData) {
          response = await handleVoiceParsed(userMessage, currentState, parsedData);
          break;
        }
        response = await handleAskNeeds(userMessage, currentState);
        break;

      case "show_suggestions":
        if (action === "select_category") {
          response = handleSelectCategory(userMessage, currentState);
          break;
        }
        response = {
          message: "Please select a van from the suggestions above.",
          state: currentState,
          showSuggestions: true,
          needsPhoneInput: false,
          needsCodeInput: false,
          needsBookingForm: false,
          needsAddOns: false,
          needsReceipt: false,
          isComplete: false,
        };
        break;

      case "collect_booking":
        if (action === "submit_booking") {
          response = await handleSubmitBooking(userMessage, currentState);
          break;
        }
        if (action === "voice_booking") {
          response = await handleVoiceBooking(userMessage, currentState);
          break;
        }
        if (action === "voice_parsed" && parsedData) {
          response = await handleVoiceParsed(userMessage, currentState, parsedData);
          break;
        }
        response = {
          message:
            "Please fill in the booking details or tap the mic to speak them.",
          state: currentState,
          showSuggestions: false,
          needsPhoneInput: false,
          needsCodeInput: false,
          needsBookingForm: true,
          needsAddOns: false,
          needsReceipt: false,
          isComplete: false,
        };
        break;

      case "select_Gearbox":
        // Gear selection is handled by the client, just provide default response
        response = {
          message: "Please select your preferred transmission type.",
          state: currentState,
          showSuggestions: false,
          needsPhoneInput: false,
          needsCodeInput: false,
          needsBookingForm: false,
          needsAddOns: false,
          needsReceipt: false,
          isComplete: false,
        };
        break;

      case "select_addons":
        if (action === "confirm_addons") {
          response = handleConfirmAddOns(userMessage, currentState);
          break;
        }
        if (action === "skip_addons") {
          response = handleSkipAddOns(currentState);
          break;
        }
        response = {
          message: "Would you like to add any extras to your booking?",
          state: currentState,
          showSuggestions: false,
          needsPhoneInput: false,
          needsCodeInput: false,
          needsBookingForm: false,
          needsAddOns: true,
          needsReceipt: false,
          isComplete: false,
        };
        break;

      case "show_receipt":
        if (action === "confirm_receipt") {
          response = {
            message:
              "Great! Now let's verify your phone number to confirm the booking:",
            state: { ...currentState, phase: "verify_phone" },
            showSuggestions: false,
            needsPhoneInput: true,
            needsCodeInput: false,
            needsBookingForm: false,
            needsAddOns: false,
            needsReceipt: false,
            isComplete: false,
          };
          break;
        }
        response = {
          message: "Please review your booking details and confirm to proceed.",
          state: currentState,
          showSuggestions: false,
          needsPhoneInput: false,
          needsCodeInput: false,
          needsBookingForm: false,
          needsAddOns: false,
          needsReceipt: true,
          isComplete: false,
        };
        break;

      case "verify_phone":
        if (action === "send_code") {
          response = await handleSendCode(userMessage, currentState);
          break;
        }
        if (action === "verify_code") {
          response = await handleVerifyCode(userMessage, currentState);
          break;
        }
        if (action === "voice_phone") {
          response = await handleVoicePhone(userMessage, currentState);
          break;
        }
        response = {
          message: "Please enter your phone number to confirm the booking.",
          state: currentState,
          showSuggestions: false,
          needsPhoneInput: !currentState.verificationSent,
          needsCodeInput: !!currentState.verificationSent,
          needsBookingForm: false,
          needsAddOns: false,
          needsReceipt: false,
          isComplete: false,
        };
        break;

      case "complete":
        response = {
          message: "Your booking is complete! Redirecting to your dashboard...",
          state: currentState,
          showSuggestions: false,
          needsPhoneInput: false,
          needsCodeInput: false,
          needsBookingForm: false,
          needsAddOns: false,
          needsReceipt: false,
          isComplete: true,
        };
        break;

      default:
        if (action === "voice_parsed" && parsedData) {
          response = await handleVoiceParsed(userMessage, currentState, parsedData);
          break;
        }
        response = await handleAskNeeds(userMessage, currentState);
        break;
    }

    console.log(
      `⏱️ [Fast Agent] Phase ${currentState.phase} -> ${response.state.phase} in ${
        Date.now() - startedAt
      }ms`
    );
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.log("❌ [Fast Agent] Error:", error);
    return {
      message: "Sorry, something went wrong. Please try again.",
      state: currentState,
      showSuggestions: false,
      needsPhoneInput: false,
      needsCodeInput: false,
      needsBookingForm: false,
      needsAddOns: false,
      needsReceipt: false,
      isComplete: false,
      error: message,
    };
  }
}

// ============================================================================
// PHASE HANDLERS
// ============================================================================

async function handleVoiceParsed(
  transcript: string,
  currentState: FastAgentState,
  parsedData: any
): Promise<FastAgentResponse> {
  console.log("🎤 [Fast Agent] Using parsed voice data");

  const newBooking = { ...currentState.booking };
  if (parsedData.office) {
    newBooking.officeId = parsedData.office;
  }
  if (parsedData.startDate) newBooking.startDate = parsedData.startDate;
  if (parsedData.endDate) newBooking.endDate = parsedData.endDate;
  if (parsedData.startTime) newBooking.startTime = parsedData.startTime;
  if (parsedData.endTime) newBooking.endTime = parsedData.endTime;
  if (parsedData.driverAge) newBooking.driverAge = parsedData.driverAge;
  if (parsedData.message) newBooking.message  = parsedData.message;

  let selectedCategory = currentState.selectedCategory;
  if (parsedData.category) {
    try {
      const categoryDoc = (await Category.findById(parsedData.category).lean()) as any;
      if (categoryDoc) {
        selectedCategory = {
          _id: categoryDoc._id.toString(),
          name: categoryDoc.name,
          description: categoryDoc.description,
          image: categoryDoc.image,
          fuel: categoryDoc.fuel,
          gear: categoryDoc.gear,
          seats: categoryDoc.seats,
          doors: categoryDoc.doors,
          pricingTiers: categoryDoc.pricingTiers || [],
          extrahoursRate: categoryDoc.extrahoursRate,
          matchScore: 95,
          matchReason: "Matched from voice input.",
        };
        newBooking.categoryId = selectedCategory._id;
      }
    } catch (error) {
      console.log("⚠️ [Fast Agent] Failed to load category by ID:", error);
    }
  }

  // If no category yet, try heuristic suggestions and show cards
  if (!selectedCategory) {
    const categories = await getCachedCategories();
    const fallbackSuggestions: CategorySuggestion[] = categories.slice(0, 3).map((cat: any, i: number) => ({
      _id: cat._id.toString(),
      name: cat.name,
      description: cat.description,
      image: cat.image,
      fuel: cat.fuel,
      gear: cat.gear,
      seats: cat.seats,
      doors: cat.doors,
      pricingTiers: cat.pricingTiers || [],
      matchScore: 85 - i * 5,
      matchReason: "Good all-purpose option based on your request",
    }));

    return {
      message: "Got it. Pick a van size and I’ll book it right away:",
      state: {
        ...currentState,
        phase: "show_suggestions",
        suggestions: fallbackSuggestions,
        booking: newBooking,
      },
      showSuggestions: true,
      needsPhoneInput: false,
      needsCodeInput: false,
      needsBookingForm: false,
      needsAddOns: false,
      needsReceipt: false,
      isComplete: false,
    };
  }

  // Check if booking is complete
  const isComplete =
    newBooking.officeId &&
    newBooking.startDate &&
    newBooking.endDate &&
    newBooking.driverAge;

  if (!isComplete) {
    return {
      message: "Thanks! Please complete the remaining booking details.",
      state: {
        ...currentState,
        phase: "collect_booking",
        selectedCategory,
        booking: newBooking,
      },
      showSuggestions: false,
      needsPhoneInput: false,
      needsCodeInput: false,
      needsBookingForm: true,
      needsAddOns: false,
      needsReceipt: false,
      isComplete: false,
    };
  }

  // Calculate price and go to add-ons
  let priceInfo = null;
  if (selectedCategory) {
    const categoryDoc = (await Category.findById(selectedCategory._id).lean()) as any;
    if (categoryDoc?.pricingTiers) {
      priceInfo = calculatePrice(
        newBooking.startDate!,
        newBooking.endDate!,
        newBooking.startTime || "10:00",
        newBooking.endTime || "10:00",
        categoryDoc.pricingTiers,
        categoryDoc.extrahoursRate || 0
      );
    }
  }

  const AddOn = (await import("@/model/addOn")).default;
  const addOns = await AddOn.find({}).lean();
  const availableAddOns: AddOnOption[] = (addOns as any[]).map((a: any) => ({
    _id: a._id.toString(),
    name: a.name,
    description: a.description,
    type: a.type,
    pricingType: a.pricingType,
    flatPrice: a.flatPrice,
    tieredPrice: a.tieredPrice,
  }));

  return {
    message: "Great! Would you like to add any extras to your booking?",
    state: {
      ...currentState,
      phase: "select_addons",
      selectedCategory,
      availableAddOns,
      booking: {
        ...newBooking,
        totalPrice: priceInfo?.totalPrice,
        priceBreakdown: priceInfo?.breakdown,
        totalDays: priceInfo?.totalDays,
        extraHours: priceInfo?.extraHours,
        pricePerDay: priceInfo?.pricePerDay,
        extraHoursRate: priceInfo?.extraHoursRate,
        selectedAddOns: [],
        addOnsTotal: 0,
      },
    },
    showSuggestions: false,
    needsPhoneInput: false,
    needsCodeInput: false,
    needsBookingForm: false,
    needsAddOns: true,
    needsReceipt: false,
    isComplete: false,
  };
}

async function handleAskNeeds(
  userMessage: string,
  currentState: FastAgentState
): Promise<FastAgentResponse> {
  // If this is the initial "start" message, ask what they need
  if (userMessage === "start" || !userMessage.trim()) {
    return {
      message:
        "Hi! Im niki you're AI friend  What do you need to move or transport? Tell me about your job - furniture, boxes, equipment, or something else?",
      state: { ...currentState, phase: "ask_needs" },
      showSuggestions: false,
      needsPhoneInput: false,
      needsCodeInput: false,
      needsBookingForm: false,
      needsAddOns: false,
      needsReceipt: false,
      isComplete: false,
    };
  }

  // User has described their needs - analyze and get suggestions
  const [categories, offices] = await Promise.all([
    getCachedCategories(),
    getCachedOffices(),
  ]);

  // Heuristic short-circuit for common box moves (avoid LLM latency)
  const heuristic = extractBoxHeuristic(userMessage, currentState.needs);
  if (heuristic) {
    const sizeKeyword = heuristic.needs.size;
    const matchedCat =
      categories.find((c: any) =>
        String(c.name).toLowerCase().includes(sizeKeyword)
      ) || categories[0];

    const suggestion: CategorySuggestion = {
      _id: matchedCat._id.toString(),
      name: matchedCat.name,
      description: matchedCat.description,
      image: matchedCat.image,
      fuel: matchedCat.fuel,
      gear: matchedCat.gear,
      seats: matchedCat.seats,
      doors: matchedCat.doors,
      pricingTiers: matchedCat.pricingTiers || [],
      matchScore: 95,
      matchReason: `Based on ${heuristic.needs.description || "your load"} size/weight.`,
    };

    const newState: FastAgentState = {
      ...currentState,
      phase: "collect_booking",
      needs: heuristic.needs,
      suggestions: [suggestion],
      selectedCategory: suggestion,
      booking: {
        ...currentState.booking,
        categoryId: suggestion._id,
      },
    };

    return {
      message: `Perfect! I recommend the **${suggestion.name}**. Let’s lock in your dates and pickup office.`,
      state: newState,
      showSuggestions: false,
      needsPhoneInput: false,
      needsCodeInput: false,
      needsBookingForm: true,
      needsAddOns: false,
      needsReceipt: false,
      isComplete: false,
    };
  }

  // Use GPT to understand needs and match categories
  const client = getOpenAI();
  const completion = await client.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: `You are a van hire expert. Analyze needs and match the best van category.

IMPORTANT: Before suggesting vans, you MUST gather these key details:
1. What items/things they're moving (type and quantity)
2. Approximate weight or size of items
3. How many items/boxes/pieces of furniture

AVAILABLE CATEGORIES:
${categories
  .map(
    (c: any) =>
      `- ${c.name} (ID: ${c._id}): ${c.seats} seats, ${c.fuel}, ${c.gear}, ${c.doors} doors`
  )
  .join("\n")}

AVAILABLE OFFICES:
${offices
  .map((o: any) => `- ${o.name} (ID: ${o._id}): ${o.address}`)
  .join("\n")}

Respond with valid JSON:
{
  "hasEnoughInfo": true/false (true only if you know: what, how much/many, approximate size/weight),
  "needs": {
    "purpose": "what they're doing (moving, delivery, transport, etc.)",
    "description": "brief description of items",
    "size": "small|medium|large",
    "quantity": "approximate number or amount if known"
  },
  "suggestions": [
    {
      "categoryId": "the category _id",
      "matchScore": 1-100,
      "matchReason": "Why this van is perfect for them (1 sentence)"
    }
  ],
  "followUpQuestion": "If hasEnoughInfo is false, ask ONE specific question about quantity, weight, or size to help recommend the right van"
}

EXAMPLES:
- User: "I need to move boxes" → hasEnoughInfo: false, ask "How many boxes approximately, and do you know their total weight or size?"
- User: "I need to move 50 heavy boxes" → hasEnoughInfo: true, suggest appropriate vans
- User: "Moving furniture" → hasEnoughInfo: false, ask "What furniture items and approximately how many pieces?"
- User: "Moving a 3-bedroom house" → hasEnoughInfo: true, suggest large vans`,
      },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0].message.content || "{}");
  console.log("🧠 [Fast Agent] Analysis:", JSON.stringify(result, null, 2));

  // Soft override: if user provided quantity + weight/size, treat as enough info
  const desc = `${result?.needs?.description || ""} ${userMessage || ""}`.toLowerCase();
  const hasWeight = /\d+(\.\d+)?\s*(kg|kilograms?)/.test(desc);
  const hasDimensions = /\d+(\.\d+)?\s*(m|meter|metre|cm|centimeter|centimetre|ft|feet)/.test(desc);
  const hasQuantity =
    /\d+\s*(boxes?|items?)/.test(desc) ||
    /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b\s*(boxes?|items?)/.test(desc);
  if (hasQuantity && (hasWeight || hasDimensions)) {
    result.hasEnoughInfo = true;
  }

  // If we don't have enough info yet, ask follow-up question and STAY in ask_needs phase
  if (!result.hasEnoughInfo && result.followUpQuestion) {
    console.log(
      "🧩 [Fast Agent] Needs follow-up question:",
      result.followUpQuestion
    );
    return {
      message: result.followUpQuestion,
      state: { 
        ...currentState, 
        phase: "ask_needs",
        needs: result.needs // Save partial needs info
      },
      showSuggestions: false,
      needsPhoneInput: false,
      needsCodeInput: false,
      needsBookingForm: false,
      needsAddOns: false,
      needsReceipt: false,
      isComplete: false,
    };
  }

  // Build suggestions with full category data
  const suggestions: CategorySuggestion[] = (result.suggestions || [])
    .map((s: any) => {
      const cat = categories.find(
        (c: any) => c._id.toString() === s.categoryId
      );
      if (!cat) return null;
      return {
        _id: (cat as any)._id.toString(),
        name: (cat as any).name,
        description: (cat as any).description,
        image: (cat as any).image,
        fuel: (cat as any).fuel,
        gear: (cat as any).gear,
        seats: (cat as any).seats,
        doors: (cat as any).doors,
        pricingTiers: (cat as any).pricingTiers || [],
        matchScore: s.matchScore,
        matchReason: s.matchReason,
      };
    })
    .filter(Boolean)
    .slice(0, 3); // Max 3 suggestions
  console.log(
    "✅ [Fast Agent] Suggestions:",
    suggestions.map((s) => `${s.name} (${s.matchScore})`).join(", ")
  );

  // If no matches, show all categories
  if (suggestions.length === 0) {
    categories.forEach((cat: any, i) => {
      suggestions.push({
        _id: cat._id.toString(),
        name: cat.name,
        description: cat.description,
        image: cat.image,
        fuel: cat.fuel,
        gear: cat.gear,
        seats: cat.seats,
        doors: cat.doors,
        pricingTiers: cat.pricingTiers || [],
        matchScore: 80 - i * 10,
        matchReason: "Great all-purpose van for your needs",
      });
    });
  }

  const topMatch = suggestions[0];
  const highConfidence =
    !!topMatch && typeof topMatch.matchScore === "number" && topMatch.matchScore >= 90;
  console.log(
    "🎯 [Fast Agent] Top match:",
    topMatch?.name,
    "score:",
    topMatch?.matchScore,
    "highConfidence:",
    highConfidence
  );

  if (highConfidence) {
    const newState: FastAgentState = {
      ...currentState,
      phase: "collect_booking",
      needs: result.needs,
      suggestions,
      selectedCategory: topMatch,
      booking: {
        ...currentState.booking,
        categoryId: topMatch._id,
      },
    };

    return {
      message: `Perfect! The **${topMatch.name}** is the best fit. Let’s lock in your dates and pickup office.`,
      state: newState,
      showSuggestions: false,
      needsPhoneInput: false,
      needsCodeInput: false,
      needsBookingForm: true,
      needsAddOns: false,
      needsReceipt: false,
      isComplete: false,
    };
  }

  const newState: FastAgentState = {
    ...currentState,
    phase: "show_suggestions",
    needs: result.needs,
    suggestions,
  };

  const message = `Perfect! Based on your needs, I recommend the **${topMatch?.name}** - ${topMatch?.matchReason}. Here are your best options:`;

  return {
    message,
    state: newState,
    showSuggestions: true,
    needsPhoneInput: false,
    needsCodeInput: false,
    needsBookingForm: false,
    needsAddOns: false,
    needsReceipt: false,
    isComplete: false,
  };
}

function handleSelectCategory(
  categoryId: string,
  currentState: FastAgentState
): FastAgentResponse {
  const selected = currentState.suggestions?.find((s) => s._id === categoryId);

  if (!selected) {
    return {
      message: "Please select a valid van option.",
      state: currentState,
      showSuggestions: true,
      needsPhoneInput: false,
      needsCodeInput: false,
      needsBookingForm: false,
      needsAddOns: false,
      needsReceipt: false,
      isComplete: false,
    };
  }

  const newState: FastAgentState = {
    ...currentState,
    phase: "collect_booking",
    selectedCategory: selected,
    booking: {
      ...currentState.booking,
      categoryId: selected._id,
    },
  };

  return {
    message: `Great choice! The **${selected.name}** is perfect. Now let's get your booking details:`,
    state: newState,
    showSuggestions: false,
    needsPhoneInput: false,
    needsCodeInput: false,
    needsBookingForm: true,
    needsAddOns: false,
    needsReceipt: false,
    isComplete: false,
  };
}

// Helper function to calculate price (mirrors usePriceCalculation logic)
function calculatePrice(
  startDateStr: string,
  endDateStr: string,
  startTime: string,
  endTime: string,
  pricingTiers: { minDays: number; maxDays: number; pricePerDay: number }[],
  extraHoursRate: number = 0
): {
  totalPrice: number;
  breakdown: string;
  totalDays: number;
  extraHours: number;
  pricePerDay: number;
  extraHoursRate: number;
} | null {
  if (
    !startDateStr ||
    !endDateStr ||
    !pricingTiers ||
    pricingTiers.length === 0
  ) {
    return null;
  }

  // Combine date and time
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (startTime) {
    const [h, m] = startTime.split(":").map(Number);
    start.setHours(h, m, 0, 0);
  }
  if (endTime) {
    const [h, m] = endTime.split(":").map(Number);
    end.setHours(h, m, 0, 0);
  }

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return null;
  }

  const diffTime = end.getTime() - start.getTime();
  const totalMinutes = diffTime / (1000 * 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  // If minutes > 15, count as extra hour
  const billableHours = remainingMinutes > 15 ? totalHours + 1 : totalHours;

  if (billableHours <= 0) {
    return null;
  }

  // Calculate full days and extra hours
  const totalDays = Math.floor(billableHours / 24);
  const extraHours = billableHours % 24;

  // Find the appropriate pricing tier
  const tier =
    pricingTiers.find(
      (t) => totalDays >= t.minDays && totalDays <= t.maxDays
    ) || pricingTiers[pricingTiers.length - 1];

  const pricePerDay = tier?.pricePerDay || 0;

  // Calculate total price
  const daysPrice = totalDays * pricePerDay;
  const extraHoursPrice = extraHours * extraHoursRate;
  const totalPrice = daysPrice + extraHoursPrice;

  // Build breakdown
  let breakdown = "";
  if (totalDays > 0 && extraHours > 0) {
    breakdown = `${totalDays} day${
      totalDays > 1 ? "s" : ""
    } (£${pricePerDay}/day) + ${extraHours}h (£${extraHoursRate}/hr) = £${totalPrice}`;
  } else if (totalDays > 0) {
    breakdown = `${totalDays} day${
      totalDays > 1 ? "s" : ""
    } (£${pricePerDay}/day) = £${totalPrice}`;
  } else {
    breakdown = `${extraHours}h (£${extraHoursRate}/hr) = £${totalPrice}`;
  }

  return {
    totalPrice,
    breakdown,
    totalDays,
    extraHours,
    pricePerDay,
    extraHoursRate,
  };
}

async function handleSubmitBooking(
  bookingJson: string,
  currentState: FastAgentState
): Promise<FastAgentResponse> {
  try {
    const booking = JSON.parse(bookingJson);

    // Validate required fields
    if (
      !booking.officeId ||
      !booking.startDate ||
      !booking.endDate ||
      !booking.driverAge
    ) {
      return {
        message:
          "Please fill in all required fields: office, dates, and driver age.",
        state: currentState,
        showSuggestions: false,
        needsPhoneInput: false,
        needsCodeInput: false,
        needsBookingForm: true,
        needsAddOns: false,
        needsReceipt: false,
        isComplete: false,
      };
    }

    // Get category for pricing
    const category = currentState.selectedCategory;
    let priceInfo = null;

    if (category) {
      const categoryDoc = (await Category.findById(category._id).lean()) as any;
      if (categoryDoc?.pricingTiers) {
        priceInfo = calculatePrice(
          booking.startDate,
          booking.endDate,
          booking.startTime || "10:00",
          booking.endTime || "10:00",
          categoryDoc.pricingTiers,
          categoryDoc.extrahoursRate || 0
        );
      }
    }

    // Get office name + add-ons in parallel
    const AddOn = (await import("@/model/addOn")).default;
    const [office, addOns] = await Promise.all([
      Office.findById(booking.officeId).lean(),
      AddOn.find({}).lean(),
    ]);
    const officeName = (office as any)?.name || "Selected Office";

    const availableAddOns: AddOnOption[] = (addOns as any[]).map((a: any) => ({
      _id: a._id.toString(),
      name: a.name,
      description: a.description,
      type: a.type,
      pricingType: a.pricingType,
      flatPrice: a.flatPrice,
      tieredPrice: a.tieredPrice,
    }));

    const newState: FastAgentState = {
      ...currentState,
      phase: "select_Gearbox",
      availableAddOns,
      booking: {
        ...currentState.booking,
        ...booking,
        officeName,
        totalPrice: priceInfo?.totalPrice,
        priceBreakdown: priceInfo?.breakdown,
        totalDays: priceInfo?.totalDays,
        extraHours: priceInfo?.extraHours,
        pricePerDay: priceInfo?.pricePerDay,
        extraHoursRate: priceInfo?.extraHoursRate,
        selectedAddOns: [],
        addOnsTotal: 0,
      },
    };

    return {
      message: "Great! Now let's select your transmission preference.",
      state: newState,
      showSuggestions: false,
      needsPhoneInput: false,
      needsCodeInput: false,
      needsBookingForm: false,
      needsAddOns: false,
      needsReceipt: false,
      isComplete: false,
    };
  } catch (error) {
    console.log("[Fast Agent] Submit booking error:", error);
    return {
      message: "Invalid booking data. Please try again.",
      state: currentState,
      showSuggestions: false,
      needsPhoneInput: false,
      needsCodeInput: false,
      needsBookingForm: true,
      needsAddOns: false,
      needsReceipt: false,
      isComplete: false,
    };
  }
}

async function handleVoiceBooking(
  voiceInput: string,
  currentState: FastAgentState
): Promise<FastAgentResponse> {
  console.log("🎤 [Fast Agent] Processing voice booking input:", voiceInput);

  const offices = await getCachedOffices();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Use GPT to parse the voice input for booking details
  const client2 = getOpenAI();
  const completion = await client2.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: `You are a booking assistant. Parse the user's voice input to extract booking details.

AVAILABLE OFFICES:
${offices.map((o: any) => `- "${o.name}" (ID: ${o._id})`).join("\n")}

TODAY'S DATE: ${todayStr} (${today.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })})

Extract and respond with valid JSON:
{
  "understood": true/false,
  "officeId": "office ID if mentioned, or null",
  "officeName": "office name if mentioned",
  "startDate": "YYYY-MM-DD format or null",
  "endDate": "YYYY-MM-DD format or null",
  "startTime": "HH:MM 24hr format or null",
  "endTime": "HH:MM 24hr format or null",
  "driverAge": number or null,
  "missingFields": ["list of fields still needed"],
  "confirmationMessage": "brief confirmation of what you understood"
}

Examples of date parsing:
- "tomorrow" = next day from today
- "Friday" = the upcoming Friday
- "next week" = 7 days from today
- "10am" or "10 a.m." = "10:00"
- "5pm" or "5 p.m." = "17:00"`,
      },
      { role: "user", content: voiceInput },
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0].message.content || "{}");
  console.log(
    "📋 [Fast Agent] Parsed booking:",
    JSON.stringify(result, null, 2)
  );

  // Update booking data with parsed values
  const newBooking = { ...currentState.booking };

  if (result.officeId) {
    newBooking.officeId = result.officeId;
    newBooking.officeName = result.officeName;
  }
  if (result.startDate) newBooking.startDate = result.startDate;
  if (result.endDate) newBooking.endDate = result.endDate;
  if (result.startTime) newBooking.startTime = result.startTime;
  if (result.endTime) newBooking.endTime = result.endTime;
  if (result.driverAge) newBooking.driverAge = result.driverAge;

  // Check if all required fields are filled
  const isComplete =
    newBooking.officeId &&
    newBooking.startDate &&
    newBooking.endDate &&
    newBooking.driverAge;
  console.log(
    "✅ [Fast Agent] Booking completeness:",
    isComplete,
    "missing:",
    result.missingFields
  );

  if (isComplete) {
    // Calculate price
    const category = currentState.selectedCategory;
    let priceInfo = null;

    if (category) {
      const categoryDoc = (await Category.findById(category._id).lean()) as any;
      if (categoryDoc?.pricingTiers) {
        priceInfo = calculatePrice(
          newBooking.startDate!,
          newBooking.endDate!,
          newBooking.startTime || "10:00",
          newBooking.endTime || "10:00",
          categoryDoc.pricingTiers,
          categoryDoc.extrahoursRate || 0
        );
      }
    }

    // Update booking with price info
    if (priceInfo) {
      newBooking.totalPrice = priceInfo.totalPrice;
      newBooking.priceBreakdown = priceInfo.breakdown;
      newBooking.totalDays = priceInfo.totalDays;
      newBooking.extraHours = priceInfo.extraHours;
      newBooking.pricePerDay = priceInfo.pricePerDay;
      newBooking.extraHoursRate = priceInfo.extraHoursRate;
    }

    // Fetch available add-ons
    const AddOn = (await import("@/model/addOn")).default;
    const addOns = await AddOn.find({}).lean();
    const availableAddOns: AddOnOption[] = addOns.map((a: any) => ({
      _id: a._id.toString(),
      name: a.name,
      description: a.description,
      type: a.type,
      pricingType: a.pricingType,
      flatPrice: a.flatPrice,
      tieredPrice: a.tieredPrice,
    }));

    return {
      message: "Great! Would you like to add any extras to your booking?",
      state: {
        ...currentState,
        phase: "select_addons",
        availableAddOns,
        booking: {
          ...newBooking,
          selectedAddOns: [],
          addOnsTotal: 0,
        },
      },
      showSuggestions: false,
      needsPhoneInput: false,
      needsCodeInput: false,
      needsBookingForm: false,
      needsAddOns: true,
      needsReceipt: false,
      isComplete: false,
    };
  }

  // Still need more info
  return {
    message:
      result.confirmationMessage ||
      "I got some details. What else can you tell me about your booking?",
    state: {
      ...currentState,
      booking: newBooking,
    },
    showSuggestions: false,
    needsPhoneInput: false,
    needsCodeInput: false,
    needsBookingForm: true,
    needsAddOns: false,
    needsReceipt: false,
    isComplete: false,
  };
}

async function handleVoicePhone(
  voiceInput: string,
  currentState: FastAgentState
): Promise<FastAgentResponse> {
  console.log("🎤 [Fast Agent] Processing voice phone input:", voiceInput);

  // First, try to extract digits directly from the input (handles cases like "0901-552-8576")
  const digitsOnly = voiceInput.replace(/[^0-9]/g, "");
  console.log("📱 [Fast Agent] Extracted digits:", digitsOnly);

  // If we have at least 10 digits, treat it as a phone number directly
  if (digitsOnly.length >= 10) {
    console.log(
      "✅ [Fast Agent] Valid phone number detected directly:",
      digitsOnly
    );
    return await handleSendCode(digitsOnly, currentState);
  }

  // Use GPT to extract phone number from natural language
  const client3 = getOpenAI();
  const completion = await client3.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: `Extract a phone number from the user's voice input. Accept ANY valid phone number format from any country.
        
Respond with valid JSON:
{
  "phoneNumber": "the extracted phone number (digits only or with country code), or null if not found",
  "message": "confirmation or request for clarification"
}

IMPORTANT: Accept phone numbers in ANY format:
- UK: 07123456789, +44 7123456789
- US: 555-123-4567, (555) 123-4567
- International: +1234567890
- With dashes/spaces: 0901-552-8576, 090 1552 8576
- Spoken: "zero nine zero one five five two eight five seven six"

Examples:
- "my number is 07123456789" → {"phoneNumber": "07123456789", "message": "Got it!"}
- "0901-552-8576" → {"phoneNumber": "09015528576", "message": "Got it!"}
- "call me at zero seven one two three" → {"phoneNumber": "07123", "message": "Got it!"}
- "I don't want to share" → {"phoneNumber": null, "message": "I need your phone number to confirm the booking."}`,
      },
      { role: "user", content: voiceInput },
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0].message.content || "{}");
  console.log("📋 [Fast Agent] Parsed phone:", JSON.stringify(result, null, 2));

  if (result.phoneNumber) {
    // Send the verification code
    return await handleSendCode(result.phoneNumber, currentState);
  }

  return {
    message:
      result.message ||
      "I didn't catch your phone number. Could you repeat it?",
    state: currentState,
    showSuggestions: false,
    needsPhoneInput: true,
    needsCodeInput: false,
    needsBookingForm: false,
    needsAddOns: false,
    needsReceipt: false,
    isComplete: false,
  };
}

async function handleSendCode(
  phoneNumber: string,
  currentState: FastAgentState
): Promise<FastAgentResponse> {
  if (!phoneNumber || phoneNumber.length < 10) {
    return {
      message: "Please enter a valid phone number.",
      state: currentState,
      showSuggestions: false,
      needsPhoneInput: true,
      needsCodeInput: false,
      needsBookingForm: false,
      needsAddOns: false,
      needsReceipt: false,
      isComplete: false,
    };
  }

  try {
    // Call the auth API to send code
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-code",
          phoneNumber,
        }),
      }
    );

    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    const newState: FastAgentState = {
      ...currentState,
      booking: {
        ...currentState.booking,
        phoneNumber,
      },
      verificationSent: true,
    };

    return {
      message: "Code sent! Enter the 6-digit code you received:",
      state: newState,
      showSuggestions: false,
      needsPhoneInput: false,
      needsCodeInput: true,
      needsBookingForm: false,
      needsAddOns: false,
      needsReceipt: false,
      isComplete: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      message: `Failed to send code: ${message}. Please try again.`,
      state: currentState,
      showSuggestions: false,
      needsPhoneInput: true,
      needsCodeInput: false,
      needsBookingForm: false,
      needsAddOns: false,
      needsReceipt: false,
      isComplete: false,
      error: message,
    };
  }
}

async function handleVerifyCode(
  code: string,
  currentState: FastAgentState
): Promise<FastAgentResponse> {
  if (!code || code.length !== 6) {
    return {
      message: "Please enter the 6-digit code.",
      state: currentState,
      showSuggestions: false,
      needsPhoneInput: false,
      needsCodeInput: true,
      needsBookingForm: false,
      needsAddOns: false,
      needsReceipt: false,
      isComplete: false,
    };
  }

  const phoneNumber = currentState.booking.phoneNumber;

  try {
    // Verify the code
    const verifyRes = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          phoneNumber,
          code,
        }),
      }
    );

    const verifyData = await verifyRes.json();
    if (!verifyData.success) throw new Error(verifyData.error);

    let userId: string;
    let userToken: string;
    let isNewUser = false;

    if (verifyData.data.userExists) {
      // Existing user
      userId = verifyData.data.user._id;
      userToken = verifyData.data.token;
    } else {
      // Create new user
      const cleanPhone = phoneNumber?.replace(/\D/g, "") || "unknown";
      const user = new User({
        name: "Van Customer",
        lastName: "Guest",
        emaildata: {
          emailAddress: `${cleanPhone}@guest.successvan.com`,
          isVerified: false,
        },
        phoneData: {
          phoneNumber,
          isVerified: true,
        },
        role: "user",
      });

      await user.save();

      userId = user._id.toString();
      userToken = jwt.sign(
        { userId, phoneNumber },
        process.env.NEXT_PUBLIC_JWT_SECRET || "your-secret-key",
        { expiresIn: "7d" }
      );
      isNewUser = true;
    }

    // Create the reservation
    const { booking, selectedCategory } = currentState;

    // Combine date and time
    const startDateObj = new Date(booking.startDate!);
    const endDateObj = new Date(booking.endDate!);

    // Apply times if provided
    if (booking.startTime) {
      const [startHour, startMin] = booking.startTime.split(":").map(Number);
      startDateObj.setHours(startHour, startMin, 0, 0);
    }
    if (booking.endTime) {
      const [endHour, endMin] = booking.endTime.split(":").map(Number);
      endDateObj.setHours(endHour, endMin, 0, 0);
    }

    // Use pre-calculated price from booking state
    const totalPrice = booking.totalPrice || 0;

    // Build add-ons array for reservation
    const reservationAddOns = (booking.selectedAddOns || []).map((addon) => ({
      addOn: addon.addOnId,
      quantity: addon.quantity,
    }));

    const reservation = new Reservation({
      user: userId,
      office: booking.officeId,
      category: booking.categoryId,
      startDate: startDateObj,
      endDate: endDateObj,
      totalPrice,
      status: "pending",
      driverAge: booking.driverAge || 25,
      messege: `Booked via AI Assistant. Phone: ${phoneNumber}`,
      addOns: reservationAddOns,
    });

    await reservation.save();

    const newState: FastAgentState = {
      ...currentState,
      phase: "complete",
      userId,
      userToken,
      isNewUser,
      reservationId: reservation._id.toString(),
    };

    const successMessage = isNewUser
      ? `🎉 Booking confirmed! We've created an account for you. Redirecting to upload your licences...`
      : `🎉 Booking confirmed! Your ${selectedCategory?.name} is reserved. Redirecting to your dashboard...`;

    return {
      message: successMessage,
      state: newState,
      showSuggestions: false,
      needsPhoneInput: false,
      needsCodeInput: false,
      needsBookingForm: false,
      needsAddOns: false,
      needsReceipt: false,
      isComplete: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      message: `Verification failed: ${message}. Please try again.`,
      state: { ...currentState, verificationSent: false },
      showSuggestions: false,
      needsPhoneInput: true,
      needsCodeInput: false,
      needsBookingForm: false,
      needsAddOns: false,
      needsReceipt: false,
      isComplete: false,
      error: message,
    };
  }
}

// ============================================================================
// ADD-ONS HANDLERS
// ============================================================================

function handleConfirmAddOns(
  addOnsJson: string,
  currentState: FastAgentState
): FastAgentResponse {
  try {
    const { selectedAddOns } = JSON.parse(addOnsJson) as {
      selectedAddOns: SelectedAddOn[];
    };

    // Calculate add-ons total
    const addOnsTotal = selectedAddOns.reduce(
      (sum, addon) => sum + addon.totalPrice,
      0
    );

    // Update total price
    const basePrice = currentState.booking.totalPrice || 0;
    const newTotalPrice = basePrice + addOnsTotal;

    const newState: FastAgentState = {
      ...currentState,
      phase: "show_receipt",
      booking: {
        ...currentState.booking,
        selectedAddOns,
        addOnsTotal,
        totalPrice: newTotalPrice,
      },
    };

    // Build receipt message
    const category = currentState.selectedCategory;
    const booking = newState.booking;
    const categoryName = category?.name || "Van";
    const startDateFormatted = new Date(booking.startDate!).toLocaleDateString(
      "en-GB",
      { weekday: "short", day: "numeric", month: "short" }
    );
    const endDateFormatted = new Date(booking.endDate!).toLocaleDateString(
      "en-GB",
      { weekday: "short", day: "numeric", month: "short" }
    );

    let receiptMessage = `📋 **Booking Summary**\n\n`;
    receiptMessage += `🚐 **Vehicle:** ${categoryName}\n`;
    receiptMessage += `📍 **Pickup:** ${booking.officeName || "Office"}\n`;
    receiptMessage += `📅 **From:** ${startDateFormatted} at ${booking.startTime}\n`;
    receiptMessage += `📅 **Until:** ${endDateFormatted} at ${booking.endTime}\n`;
    receiptMessage += `👤 **Driver Age:** ${booking.driverAge}\n`;

    if (selectedAddOns.length > 0) {
      receiptMessage += `\n📦 **Add-ons:**\n`;
      selectedAddOns.forEach((addon) => {
        receiptMessage += `  • ${addon.name} x${
          addon.quantity
        } = £${addon.totalPrice.toFixed(2)}\n`;
      });
    }

    receiptMessage += `\n💰 **Total Price:** £${newTotalPrice.toFixed(2)}\n`;
    if (booking.priceBreakdown) {
      receiptMessage += `📊 **Breakdown:** ${booking.priceBreakdown}`;
      if (addOnsTotal > 0) {
        receiptMessage += ` + £${addOnsTotal.toFixed(2)} add-ons`;
      }
      receiptMessage += `\n\n`;
    }

    receiptMessage += `Review your booking and tap "Confirm" to proceed with phone verification.`;

    return {
      message: receiptMessage,
      state: newState,
      showSuggestions: false,
      needsPhoneInput: false,
      needsCodeInput: false,
      needsBookingForm: false,
      needsAddOns: false,
      needsReceipt: true,
      isComplete: false,
    };
  } catch (error) {
    console.log("[Fast Agent] Confirm add-ons error:", error);
    return handleSkipAddOns(currentState);
  }
}

function handleSkipAddOns(currentState: FastAgentState): FastAgentResponse {
  // Skip add-ons and go directly to receipt
  const category = currentState.selectedCategory;
  const booking = currentState.booking;
  const categoryName = category?.name || "Van";
  const startDateFormatted = new Date(booking.startDate!).toLocaleDateString(
    "en-GB",
    { weekday: "short", day: "numeric", month: "short" }
  );
  const endDateFormatted = new Date(booking.endDate!).toLocaleDateString(
    "en-GB",
    { weekday: "short", day: "numeric", month: "short" }
  );

  let receiptMessage = `📋 **Booking Summary**\n\n`;
  receiptMessage += `🚐 **Vehicle:** ${categoryName}\n`;
  receiptMessage += `📍 **Pickup:** ${booking.officeName || "Office"}\n`;
  receiptMessage += `📅 **From:** ${startDateFormatted} at ${booking.startTime}\n`;
  receiptMessage += `📅 **Until:** ${endDateFormatted} at ${booking.endTime}\n`;
  receiptMessage += `👤 **Driver Age:** ${booking.driverAge}\n\n`;

  receiptMessage += `💰 **Total Price:** £${(booking.totalPrice || 0).toFixed(
    2
  )}\n`;
  if (booking.priceBreakdown) {
    receiptMessage += `📊 **Breakdown:** ${booking.priceBreakdown}\n\n`;
  }

  receiptMessage += `Review your booking and tap "Confirm" to proceed with phone verification.`;

  return {
    message: receiptMessage,
    state: {
      ...currentState,
      phase: "show_receipt",
      booking: {
        ...booking,
        selectedAddOns: [],
        addOnsTotal: 0,
      },
    },
    showSuggestions: false,
    needsPhoneInput: false,
    needsCodeInput: false,
    needsBookingForm: false,
    needsAddOns: false,
    needsReceipt: true,
    isComplete: false,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function createInitialFastState(): FastAgentState {
  return {
    phase: "ask_needs",
    booking: {
      startTime: "10:00",
      endTime: "10:00",
    },
  };
}

export async function getOfficesList() {
  await connect();
  const offices = await Office.find({}).lean();
  return offices.map((o: any) => ({
    _id: o._id.toString(),
    name: o.name,
    address: o.address,
    workingTime: o.workingTime || [],
    specialDays: o.specialDays || [],
  }));
}
