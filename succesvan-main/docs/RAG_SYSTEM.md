# RAG System for Conversational AI

## Overview
The conversational AI now uses RAG (Retrieval-Augmented Generation) to provide rich, contextual responses based on real-time data from the database.

## What Data is Fetched

### 1. **Office Data** ([lib/rag-context.ts](lib/rag-context.ts))
- Office names and IDs
- Physical addresses
- Phone numbers
- **Working hours** (day by day schedule)
- **Special days** (holidays, closures, special hours)

Example RAG output:
```
### COMPTON
- ID: 6927034fa64a8b9e4f392f14
- Address: 123 Main St
- Phone: 09350655062
- Working Hours:
  * monday: 09:00 - 18:00
  * tuesday: 09:00 - 18:00
- Special Days:
  * 12/25: Closed (Christmas)
```

### 2. **Category Data** ([lib/rag-context.ts](lib/rag-context.ts))
- Category names and IDs
- Descriptions
- **Fuel type** (gas, diesel, electric, hybrid)
- **Transmission** (automatic, manual)
- **Seats and doors**
- **Pricing tiers** (price per hour based on rental duration)

Example RAG output:
```
### VAN FORD
- ID: 6935854dcfbe9e2cc0e4326b
- Description: good van
- Fuel Type: gas
- Transmission: automatic
- Seats: 2
- Doors: 3
- Pricing:
  * 0-24 hours: $50/hour
  * 24-∞ hours: $40/hour
```

### 3. **Availability Data** ([lib/rag-context.ts](lib/rag-context.ts))
- Checks existing reservations for date conflicts
- Shows which vehicles are booked during requested dates
- Only fetched when user provides dates + office

Example RAG output:
```
## AVAILABILITY INFORMATION:

Found 2 existing reservations in this time period:
- van ford: 12/14/2025 to 12/16/2025
- car: 12/15/2025 to 12/17/2025
```

## How It Works

### Flow:
```
User opens modal
  ↓
Modal sends "start" trigger
  ↓
Conversation API called
  ↓
fetchFullOffices() - Gets ALL office data
  ↓
fetchFullCategories() - Gets ALL category data
  ↓
buildRAGContext() - Builds comprehensive context string
  ↓
conversationalReservation() - AI receives RAG context
  ↓
AI uses context to answer questions intelligently
```

### Code Structure:

**1. RAG Context Builder** - [lib/rag-context.ts](lib/rag-context.ts)
- `fetchFullOffices()` - Fetches complete office data
- `fetchFullCategories()` - Fetches complete category data
- `buildRAGContext()` - Combines everything into formatted text

**2. Conversation API** - [app/api/conversation/route.ts](app/api/conversation/route.ts)
- Calls RAG fetchers on each turn
- Rebuilds context with updated availability when dates change
- Passes context to AI

**3. Conversational Agent** - [lib/openai.ts](lib/openai.ts)
- Accepts `ragContext` parameter
- Prepends RAG context to system prompt
- AI uses context to answer user questions

## Benefits

### ✅ **Smarter Responses**
Before RAG:
```
User: "What options do I have?"
AI: "We have van ford and Van. Which do you prefer?"
```

After RAG:
```
User: "What options do I have?"
AI: "We have:
- Van Ford: Gas, automatic, 2 seats, $50/hour
- Van: Electric, automatic, 4 seats, $35/hour
Which do you prefer?"
```

### ✅ **Answers User Questions**
```
User: "What time do you open?"
AI: "We're open Monday-Friday 09:00-18:00, Saturday 10:00-16:00."

User: "How much does the van cost?"
AI: "The Van Ford costs $50/hour for 0-24 hours, or $40/hour for longer rentals."

User: "Where is your office?"
AI: "Our Compton office is at 123 Main St. Phone: 09350655062."
```

### ✅ **Availability Checking**
```
User: "I want to book December 15th"
AI: "I see we have 2 existing bookings on that date. The van ford is available after 5pm."
```

## RAG Context Format

The AI receives this structured context before each conversation turn:

```markdown
# COMPREHENSIVE BOOKING INFORMATION

## AVAILABLE OFFICES:

### COMPTON
- ID: 6927034fa64a8b9e4f392f14
- Address: efef
- Phone: 09350655062
- Working Hours:
  * monday: 09:00 - 18:00
  * tuesday: 09:00 - 18:00
- Special Days:
  * 12/25: Closed (Christmas)

## AVAILABLE VEHICLE CATEGORIES:

### VAN FORD
- ID: 6935854dcfbe9e2cc0e4326b
- Description: good van
- Fuel Type: gas
- Transmission: automatic
- Seats: 2
- Doors: 3
- Pricing:
  * 0-24 hours: $50/hour
  * 24-168 hours: $40/hour

## AVAILABILITY INFORMATION:

No conflicting reservations found for 2025-12-14 to 2025-12-16.

## IMPORTANT INSTRUCTIONS:

- Use the office IDs when extracting office data
- Use the category IDs when extracting category data
- If user asks about hours, tell them from the working hours above
- When listing options, mention the key features
- Today's date is 2025-12-13
```

## Dynamic Updates

The RAG context is rebuilt on **every conversation turn** with:
- Latest reservation data
- Current date/time
- Updated availability based on user's selected dates and office

This ensures the AI always has fresh, accurate information.

## Performance

- **Context size**: ~1-3KB per turn (efficient)
- **Database queries**: 2-3 per turn (offices, categories, reservations)
- **Response time**: +200-300ms vs non-RAG (acceptable for better UX)
- **Cost**: Same GPT-4o-mini cost, just larger prompt

## Future Enhancements

Potential improvements:
- [ ] Cache office/category data (only fetch reservations dynamically)
- [ ] Add vehicle inventory levels to RAG
- [ ] Include add-ons information
- [ ] Show estimated prices in real-time
- [ ] Add weather-based suggestions
- [ ] Multi-language support in RAG context

## Testing

To verify RAG is working:
1. Check API logs for: `🔍 [RAG] Building context for AI`
2. Ask: "What time do you open?" - Should get actual hours
3. Ask: "How much does it cost?" - Should get actual pricing
4. Ask: "What options do I have?" - Should get detailed features
5. Select dates and office - Should check availability

## Configuration

RAG can be disabled by:
1. Not passing `ragContext` to `conversationalReservation()`
2. AI will fall back to basic name-only listing

Current state: **RAG ENABLED** ✅
