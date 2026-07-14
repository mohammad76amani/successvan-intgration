/**
 * AI Van Hire Consultant Agent
 * 
 * A sophisticated conversational agent that:
 * 1. DISCOVERS customer needs (what they're moving, distance, weight, etc.)
 * 2. RECOMMENDS the best vehicle based on their situation
 * 3. COLLECTS booking details after user accepts recommendation
 * 4. CHECKS availability for the requested dates
 * 5. CONFIRMS booking with phone number
 * 6. CREATES the reservation
 * 
 * Conversation Flow:
 * [discovery] → [recommendation] → [booking] → [availability] → [confirmation] → [complete]
 */

import { getOpenAI } from "./openai";
import { buildComprehensiveRAG, checkAvailability, getSimpleLists } from "./comprehensive-rag";
import Reservation from "@/model/reservation";
import connect from "@/lib/data";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ConversationPhase = 
  | "discovery"      // Understanding customer needs
  | "recommendation" // AI suggests best vehicle
  | "booking"        // Collecting reservation details
  | "availability"   // Checking if vehicle is available
  | "confirmation"   // Getting phone number to confirm
  | "complete";      // Reservation created

export interface ConversationState {
  phase: ConversationPhase;
  
  // Discovery data (what customer needs)
  customerNeeds?: {
    purpose?: string;        // "moving furniture", "delivery", "transport"
    itemsDescription?: string; // What they're moving
    estimatedWeight?: string;  // "heavy", "light", number in kg
    distance?: string;         // Short or long distance
    numPassengers?: number;    // If they need passenger space
    urgency?: string;          // When they need it
    budget?: string;           // If mentioned
  };
  
  // Recommendation data
  recommendedCategory?: {
    id: string;
    name: string;
    reason: string;
  };
  userAcceptedRecommendation?: boolean;
  
  // Booking data (matches reservation model)
  bookingData: {
    office?: string;         // Office ID
    category?: string;       // Category ID
    startDate?: string;      // ISO date
    endDate?: string;        // ISO date
    startTime?: string;      // HH:MM
    endTime?: string;        // HH:MM
    driverAge?: number;      // 18-99
    phoneNumber?: string;    // For confirmation
    message?: string;        // Special requests
    addOns?: Array<{ addOnId: string; quantity: number }>;
  };
  
  // Availability status
  availabilityChecked?: boolean;
  isAvailable?: boolean;
  availabilityMessage?: string;
}

export interface AgentResponse {
  message: string;
  state: ConversationState;
  action: "ask" | "recommend" | "confirm" | "check_availability" | "create_reservation";
  isComplete: boolean;
  reservationId?: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

// ============================================================================
// MAIN AGENT FUNCTION
// ============================================================================

/**
 * Process a conversation turn with the AI consultant
 */
export async function processAgentTurn(
  userMessage: string,
  currentState: ConversationState,
  conversationHistory: ConversationMessage[]
): Promise<AgentResponse> {
  console.log("🤖 [AI Agent] Processing turn...");
  console.log("📍 [AI Agent] Current phase:", currentState.phase);
  console.log("💬 [AI Agent] User message:", userMessage);
  
  // Build RAG context with availability if we have booking data
  const ragOptions = {
    officeId: currentState.bookingData.office,
    startDate: currentState.bookingData.startDate,
    endDate: currentState.bookingData.endDate,
    includeAvailability: currentState.phase === "availability" || currentState.phase === "booking",
  };
  
  const { context: ragContext, data: ragData } = await buildComprehensiveRAG(ragOptions);
  
  // Get simple lists for ID matching
  const { offices, categories } = await getSimpleLists();
  
  // Build the system prompt based on current phase
  const systemPrompt = buildSystemPrompt(currentState, ragContext, offices, categories);
  
  // Build messages for API call
  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];
  
  console.log("📤 [AI Agent] Sending to GPT with", messages.length, "messages");
  
  // Call OpenAI
  const client = getOpenAI();
  const completion = await client.chat.completions.create({
    model: "gpt-5-mini",
    messages: messages as any,
    response_format: { type: "json_object" },
  });
  
  const result = completion.choices[0].message.content;
  const response = result ? JSON.parse(result) : {};
  
  console.log("✅ [AI Agent] GPT response:", JSON.stringify(response, null, 2));
  
  // Process the response and update state
  const newState = updateState(currentState, response, offices, categories);
  
  // Check if we need to do availability check
  if (newState.phase === "availability" && !newState.availabilityChecked) {
    const availResult = await checkAndUpdateAvailability(newState);
    Object.assign(newState, availResult);
  }
  
  // Check if we need to create the reservation
  let reservationId: string | undefined;
  if (newState.phase === "complete" && response.action === "create_reservation") {
    reservationId = await createReservation(newState);
  }
  
  return {
    message: response.message || "I didn't catch that. Could you repeat?",
    state: newState,
    action: response.action || "ask",
    isComplete: newState.phase === "complete",
    reservationId,
  };
}

// ============================================================================
// SYSTEM PROMPT BUILDER
// ============================================================================

function buildSystemPrompt(
  state: ConversationState,
  ragContext: string,
  offices: Array<{ _id: string; name: string }>,
  categories: Array<{ _id: string; name: string }>
): string {
  const officeList = offices.map(o => `${o.name} (ID: ${o._id})`).join(", ");
  const categoryList = categories.map(c => `${c.name} (ID: ${c._id})`).join(", ");
  const today = new Date().toISOString().split("T")[0];
  
  let prompt = ragContext + "\n\n---\n\n";
  
  prompt += `# AI VAN HIRE CONSULTANT

You are an expert van hire consultant helping customers find the PERFECT vehicle for their needs.
You have friendly, warm personality and speak conversationally (responses will be spoken aloud).

IMPORTANT: You MUST respond with valid JSON in the format specified for each phase.

Current Date: ${today}

## CONVERSATION PHASES:

1. **DISCOVERY** - Understand what the customer needs
   - Ask about: What they're moving, weight, distance, when they need it
   - Extract: purpose, items, weight estimate, passengers needed
   
2. **RECOMMENDATION** - Suggest the best vehicle
   - Use the knowledge base to recommend the ideal category
   - Explain WHY this vehicle is perfect for their situation
   - Wait for user to accept the recommendation
   
3. **BOOKING** - Collect reservation details
   - Get: office, dates, times, driver age
   - Try to collect multiple fields at once
   
4. **AVAILABILITY** - Check if vehicle is available
   - Verify the dates work
   - If not available, suggest alternatives
   
5. **CONFIRMATION** - Final confirmation
   - Get phone number
   - Read back all details
   - Ask for confirmation
   
6. **COMPLETE** - Create the reservation

## CURRENT STATE:
Phase: ${state.phase}
Customer Needs: ${JSON.stringify(state.customerNeeds || {}, null, 2)}
Recommended: ${state.recommendedCategory ? `${state.recommendedCategory.name} - ${state.recommendedCategory.reason}` : "Not yet"}
Accepted Recommendation: ${state.userAcceptedRecommendation || false}
Booking Data: ${JSON.stringify(state.bookingData, null, 2)}
Availability Checked: ${state.availabilityChecked || false}

## AVAILABLE OPTIONS:
Offices: ${officeList}
Categories: ${categoryList}

`;

  // Phase-specific instructions
  switch (state.phase) {
    case "discovery":
      prompt += `
## YOUR TASK (DISCOVERY PHASE):

You need to understand what the customer needs before recommending a vehicle.

ASK ABOUT (try to get all in 1-2 questions):
- What are they moving/transporting? (furniture, boxes, equipment, passengers?)
- Roughly how heavy? (just a few items vs full house move)
- Short trip or long distance?
- When do they need it?

EXAMPLES:
User: "I need a van"
You: "Happy to help! Tell me - what are you planning to move and roughly how much stuff?"

User: "Moving some furniture"
You: "Great! Is this a big move like a house or just a few items? And is it local or a longer trip?"

When you have enough info (purpose, rough size/weight, timing), move to RECOMMENDATION phase.

RESPONSE FORMAT:
{
  "message": "Your friendly question (keep brief - 15-20 words)",
  "phase": "discovery" or "recommendation",
  "customerNeeds": {
    "purpose": "what they're doing",
    "itemsDescription": "what they're moving",
    "estimatedWeight": "heavy/medium/light or kg",
    "numPassengers": number if mentioned,
    "urgency": "when they need it"
  },
  "action": "ask"
}
`;
      break;
      
    case "recommendation":
      prompt += `
## YOUR TASK (RECOMMENDATION PHASE):

Based on the customer's needs, recommend the BEST vehicle category.

Customer Needs: ${JSON.stringify(state.customerNeeds, null, 2)}

Use the VEHICLE CATEGORIES and RECOMMENDATION GUIDELINES from the knowledge base.

Your recommendation should:
1. Name the specific category
2. Explain WHY it's perfect for their situation
3. Mention key features (cargo space, ease of driving, price)
4. Ask if this sounds good

EXAMPLE:
"For moving furniture across town, I'd recommend our **Large Van**. It's got plenty of cargo space for sofas and beds, and at £X/hour it's great value. Does that work for you?"

If user says yes/sounds good/perfect → move to BOOKING phase
If user wants something different → adjust recommendation

RESPONSE FORMAT:
{
  "message": "Your recommendation with explanation",
  "phase": "recommendation" or "booking",
  "recommendedCategory": {
    "id": "category_id_here",
    "name": "Category Name",
    "reason": "Why this is perfect"
  },
  "userAcceptedRecommendation": true/false,
  "action": "recommend"
}
`;
      break;
      
    case "booking":
      prompt += `
## YOUR TASK (BOOKING PHASE):

Collect the reservation details efficiently.

Already recommended: ${state.recommendedCategory?.name || "Not set"}
Current booking: ${JSON.stringify(state.bookingData, null, 2)}

REQUIRED FIELDS:
- office: Which office/location (ID required)
- category: Already set from recommendation
- startDate: When they're picking up (YYYY-MM-DD)
- endDate: When they're returning (YYYY-MM-DD)  
- startTime: Pickup time (HH:MM, default 10:00)
- endTime: Return time (HH:MM, default 10:00)
- driverAge: Must be 21+ (ask if not mentioned)

TRY TO GET MULTIPLE FIELDS AT ONCE:
"Great! Which office works best for you (${offices.map(o => o.name).join(' or ')})? And what dates do you need it?"

PARSE DATES:
- "tomorrow" = ${new Date(Date.now() + 86400000).toISOString().split('T')[0]}
- "next Monday" = calculate from today
- "December 20th" = 2025-12-20

When all required fields are collected → move to AVAILABILITY phase

RESPONSE FORMAT:
{
  "message": "Your question (brief)",
  "phase": "booking" or "availability",
  "bookingData": {
    "office": "id if mentioned",
    "category": "${state.recommendedCategory?.id || ''}",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "startTime": "HH:MM",
    "endTime": "HH:MM",
    "driverAge": number
  },
  "action": "ask"
}
`;
      break;
      
    case "availability":
      prompt += `
## YOUR TASK (AVAILABILITY PHASE):

Check if the vehicle is available for the requested dates.

Booking: ${JSON.stringify(state.bookingData, null, 2)}
Availability: ${state.availabilityMessage || "Checking..."}

If AVAILABLE:
- Say "Great news! That's available."
- Move to CONFIRMATION phase
- Ask for their phone number to confirm

If NOT AVAILABLE:
- Apologize and explain
- Suggest alternative dates or categories
- Stay in AVAILABILITY phase

RESPONSE FORMAT:
{
  "message": "Availability result and next step",
  "phase": "availability" or "confirmation",
  "action": "check_availability" or "ask"
}
`;
      break;
      
    case "confirmation":
      prompt += `
## YOUR TASK (CONFIRMATION PHASE):

Get phone number and final confirmation.

Current booking: ${JSON.stringify(state.bookingData, null, 2)}

STEPS:
1. If no phone number → Ask for it
2. Read back ALL booking details clearly
3. Ask "Is everything correct?"
4. If user confirms → move to COMPLETE phase

EXAMPLE:
"Just need your phone number to confirm the booking."
Then: "Perfect! So that's a Large Van from Compton, December 14-16, picking up at 10am. Driver age 28. Is that all correct?"

RESPONSE FORMAT:
{
  "message": "Confirmation message",
  "phase": "confirmation" or "complete",
  "bookingData": {
    "phoneNumber": "if provided"
  },
  "action": "confirm" or "create_reservation"
}
`;
      break;
  }

  return prompt;
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

function updateState(
  currentState: ConversationState,
  response: any,
  offices: Array<{ _id: string; name: string }>,
  categories: Array<{ _id: string; name: string }>
): ConversationState {
  const newState = { ...currentState };
  
  // Update phase if specified
  if (response.phase) {
    newState.phase = response.phase;
  }
  
  // Update customer needs
  if (response.customerNeeds) {
    newState.customerNeeds = { ...newState.customerNeeds, ...response.customerNeeds };
  }
  
  // Update recommendation
  if (response.recommendedCategory) {
    // Match category ID
    const matchedCat = matchCategory(response.recommendedCategory.name || response.recommendedCategory.id, categories);
    newState.recommendedCategory = {
      id: matchedCat?._id || response.recommendedCategory.id,
      name: matchedCat?.name || response.recommendedCategory.name,
      reason: response.recommendedCategory.reason || "",
    };
    
    // Set category in booking data
    if (matchedCat) {
      newState.bookingData.category = matchedCat._id;
    }
  }
  
  if (response.userAcceptedRecommendation !== undefined) {
    newState.userAcceptedRecommendation = response.userAcceptedRecommendation;
  }
  
  // Update booking data
  if (response.bookingData) {
    const bd = response.bookingData;
    
    // Match office
    if (bd.office) {
      const matchedOffice = matchOffice(bd.office, offices);
      if (matchedOffice) {
        newState.bookingData.office = matchedOffice._id;
      }
    }
    
    // Match category
    if (bd.category) {
      const matchedCat = matchCategory(bd.category, categories);
      if (matchedCat) {
        newState.bookingData.category = matchedCat._id;
      }
    }
    
    // Copy other fields
    if (bd.startDate) newState.bookingData.startDate = bd.startDate;
    if (bd.endDate) newState.bookingData.endDate = bd.endDate;
    if (bd.startTime) newState.bookingData.startTime = bd.startTime;
    if (bd.endTime) newState.bookingData.endTime = bd.endTime;
    if (bd.driverAge) newState.bookingData.driverAge = parseInt(bd.driverAge);
    if (bd.phoneNumber) newState.bookingData.phoneNumber = bd.phoneNumber;
    if (bd.message) newState.bookingData.message = bd.message;
  }
  
  return newState;
}

function matchOffice(
  input: string,
  offices: Array<{ _id: string; name: string }>
): { _id: string; name: string } | undefined {
  // Check if it's already an ID
  const byId = offices.find(o => o._id === input);
  if (byId) return byId;
  
  // Fuzzy match by name
  const inputLower = input.toLowerCase();
  return offices.find(o => 
    o.name.toLowerCase().includes(inputLower) || 
    inputLower.includes(o.name.toLowerCase())
  );
}

function matchCategory(
  input: string,
  categories: Array<{ _id: string; name: string }>
): { _id: string; name: string } | undefined {
  // Check if it's already an ID
  const byId = categories.find(c => c._id === input);
  if (byId) return byId;
  
  // Fuzzy match by name
  const inputLower = input.toLowerCase();
  return categories.find(c => 
    c.name.toLowerCase().includes(inputLower) || 
    inputLower.includes(c.name.toLowerCase())
  );
}

// ============================================================================
// AVAILABILITY CHECK
// ============================================================================

async function checkAndUpdateAvailability(
  state: ConversationState
): Promise<Partial<ConversationState>> {
  console.log("📊 [AI Agent] Checking availability...");
  
  const { office, startDate, endDate, category } = state.bookingData;
  
  if (!office || !startDate || !endDate) {
    return {
      availabilityChecked: false,
      availabilityMessage: "Missing office or dates for availability check",
    };
  }
  
  try {
    const availability = await checkAvailability(
      office,
      new Date(startDate),
      new Date(endDate)
    );
    
    // Find the specific category
    const catAvail = availability.find(a => a.categoryId === category);
    
    if (!catAvail) {
      return {
        availabilityChecked: true,
        isAvailable: false,
        availabilityMessage: "This vehicle category is not available at this office.",
      };
    }
    
    if (catAvail.isAvailable) {
      return {
        availabilityChecked: true,
        isAvailable: true,
        availabilityMessage: `Available! ${catAvail.availableCount} ${catAvail.categoryName}(s) in stock.`,
      };
    } else {
      return {
        availabilityChecked: true,
        isAvailable: false,
        availabilityMessage: `Sorry, ${catAvail.categoryName} is fully booked for these dates. ${catAvail.reservedCount} already reserved.`,
      };
    }
  } catch (error) {
    console.log("❌ [AI Agent] Availability check failed:", error);
    return {
      availabilityChecked: true,
      isAvailable: true, // Assume available on error
      availabilityMessage: "Availability check encountered an issue, but we'll proceed.",
    };
  }
}

// ============================================================================
// RESERVATION CREATION
// ============================================================================

async function createReservation(state: ConversationState): Promise<string | undefined> {
  console.log("📝 [AI Agent] Creating reservation...");
  
  const { bookingData } = state;
  
  // Validate required fields
  if (!bookingData.office || !bookingData.category || 
      !bookingData.startDate || !bookingData.endDate || !bookingData.driverAge) {
    console.log("❌ [AI Agent] Missing required fields for reservation");
    return undefined;
  }
  
  try {
    await connect();
    
    // Calculate total price (simplified - you may want more complex logic)
    const startDate = new Date(bookingData.startDate);
    const endDate = new Date(bookingData.endDate);
    const hours = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
    const totalPrice = hours * 10; // Placeholder - use actual pricing
    
    const reservation = new Reservation({
      // Note: In production, you'd have the actual user ID
      user: "000000000000000000000000", // Placeholder - needs actual user
      office: bookingData.office,
      category: bookingData.category,
      startDate: startDate,
      endDate: endDate,
      totalPrice: totalPrice,
      status: "pending",
      driverAge: bookingData.driverAge, // Note: typo matches the model
      messege: `Phone: ${bookingData.phoneNumber || "N/A"}. ${bookingData.message || ""}`,
      addOns: [],
    });
    
    await reservation.save();
    
    console.log("✅ [AI Agent] Reservation created:", reservation._id);
    return reservation._id.toString();
    
  } catch (error) {
    console.log("❌ [AI Agent] Failed to create reservation:", error);
    return undefined;
  }
}

// ============================================================================
// INITIAL STATE
// ============================================================================

export function createInitialState(): ConversationState {
  return {
    phase: "discovery",
    customerNeeds: {},
    bookingData: {
      startTime: "10:00",
      endTime: "10:00",
    },
  };
}

/**
 * Get the initial greeting message
 */
export async function getInitialGreeting(): Promise<string> {
  return "Hi there! I'm your van hire consultant. Tell me, what do you need to move or transport today?";
}
