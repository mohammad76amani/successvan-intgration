# Voice Agent Strategies

This document explains the two different AI agents for voice reservation booking and their distinct strategies.

## 🚀 Quick Voice Agent (`extractReservationData`)

**Use Case:** User says everything at once, wants fast form-fill  
**Location:** [lib/openai.ts](lib/openai.ts) - Quick Voice Agent section  
**API Endpoint:** [/api/parse-voice](app/api/parse-voice/route.ts)  
**UI Button:** "Quick Voice" (Amber button)

### Strategy: One-Shot Extraction
- **Goal:** Extract ALL information from a single utterance
- **Behavior:** Aggressive extraction, tries to get as much data as possible
- **Temperature:** 0.3 (balanced for accurate extraction)
- **Response:** Returns extracted data immediately, no follow-up

### Example Interaction
```
User (speaks): "I need a large van from Hendon tomorrow at 9am returning Sunday at 5pm, I'm 28"

Agent extracts:
{
  "office": "hendon_id",
  "category": "large_id", 
  "startDate": "2025-12-14",
  "endDate": "2025-12-21",
  "startTime": "09:00",
  "endTime": "17:00",
  "driverAge": 28
}

Result: Form is populated with all extracted fields
```

### When to Use
✅ User knows exactly what they want  
✅ User provides complete information upfront  
✅ User wants fastest possible booking  
✅ User speaks full sentences with all details

### Limitations
❌ Doesn't ask follow-up questions  
❌ Incomplete information = incomplete form  
❌ No conversation or guidance  
❌ User must re-record if they forget something

---

## 💬 Conversational Agent (`conversationalReservation`)

**Use Case:** User wants to talk naturally, needs help with booking  
**Location:** [lib/openai.ts](lib/openai.ts) - Conversational Voice Agent section  
**API Endpoint:** [/api/conversation](app/api/conversation/route.ts)  
**UI Button:** "Talk to AI" (Purple button)  
**Hook:** [hooks/useConversationalVoice.ts](hooks/useConversationalVoice.ts)  
**Modal:** [components/global/ConversationalModal.tsx](components/global/ConversationalModal.tsx)

### Strategy: Step-by-Step Guided Conversation
- **Goal:** Guide user through booking with ONE question at a time
- **Behavior:** Patient, conversational, asks follow-up questions
- **Temperature:** 0.2 (very predictable, focused responses)
- **Response:** AI speaks back with voice, maintains conversation context

### Example Interaction
```
Turn 1:
User: "I need a van"
AI (speaks): "Great! Which office would you like to pick up from?"

Turn 2:
User: "Hendon"
AI (speaks): "Perfect! What size van do you need?"

Turn 3:
User: "Large"
AI (speaks): "Got it! When do you want to pick it up?"

Turn 4:
User: "Tomorrow at 9am"
AI (speaks): "Sounds good! When will you return it?"

Turn 5:
User: "Sunday evening"
AI (speaks): "Perfect! How old are you?"

Turn 6:
User: "28"
AI (speaks): "Large van from Hendon, Dec 14 9 AM to Dec 21 5 PM, age 28. Correct?"

Turn 7:
User: "Yes"
AI (speaks): "Booking confirmed! You're all set."
```

### Conversation Rules
1. ✅ **ONE question at a time** - never rushes
2. ✅ **Fixed order:** office → category → startDate → endDate → driverAge → confirm
3. ✅ **Brief responses** (10-15 words) - optimized for speech
4. ✅ **Validates completion** - requires user confirmation with "yes/correct"
5. ✅ **Maintains context** - remembers entire conversation history

### When to Use
✅ User unsure what information they need  
✅ User wants conversational experience  
✅ User prefers guidance through the process  
✅ User wants to hear AI responses  
✅ User provides information piecemeal

### Features
✅ Text-to-speech voice responses  
✅ Multi-turn conversation tracking  
✅ Real-time booking preview  
✅ Speech bubbles showing conversation  
✅ Audio playback of AI responses

---

## Key Differences

| Feature | Quick Voice Agent | Conversational Agent |
|---------|------------------|---------------------|
| **Interaction Style** | One-shot extraction | Multi-turn conversation |
| **Questions** | None | One at a time |
| **AI Voice Response** | ❌ No | ✅ Yes (TTS) |
| **Conversation History** | ❌ No | ✅ Yes |
| **Guidance** | ❌ None | ✅ Step-by-step |
| **Completion Time** | Fast (1 turn) | Slower (5-7 turns) |
| **Temperature** | 0.3 | 0.2 |
| **Best For** | Complete info upfront | Partial info, needs help |
| **User Experience** | Quick & efficient | Conversational & guided |
| **Cost per booking** | ~$0.002 | ~$0.03 (includes TTS) |

---

## Technical Implementation

### Quick Voice Agent Flow
```
User clicks "Quick Voice" 
  → Records audio
  → POST /api/parse-voice
  → transcribeAudio(audioBlob)
  → extractReservationData(transcript)
  → Normalize fields (pickupDate→startDate)
  → Validate 5 required fields
  → Return extracted data
  → Populate form
```

### Conversational Agent Flow
```
User clicks "Talk to AI"
  → Opens ConversationalModal
  → Records audio (Turn 1)
  → POST /api/conversation
  → transcribeAudio(audioBlob)
  → conversationalReservation(transcript, currentData, history)
  → textToSpeech(aiMessage)
  → Return {message, audio, data, isComplete}
  → Play AI audio response
  → Show speech bubble
  → Update booking preview
  → User responds (Turn 2)
  → Repeat until isComplete=true
  → Close modal with complete data
```

---

## Database Schema Alignment

Both agents now use the same field names matching [model/reservation.ts](model/reservation.ts):

### Required Fields (5)
1. `office` - Office ObjectId
2. `category` - Category ObjectId  
3. `startDate` - Pickup date (not pickupDate)
4. `endDate` - Return date (not returnDate)
5. `driverAge` - Driver age (maps to `driverAge` in DB - typo in model)

### Optional Fields
- `startTime` - Pickup time (default: "10:00")
- `endTime` - Return time (default: "10:00")
- `message` - Special requests

### Field Normalization
Both agents normalize legacy field names for backwards compatibility:
- `pickupDate` → `startDate`
- `returnDate` → `endDate`
- `pickupTime` → `startTime`
- `returnTime` → `endTime`

This ensures the form and database always use the correct schema.

---

## Customization Points

### Quick Voice Agent Customization
**File:** [lib/openai.ts](lib/openai.ts) - `extractReservationData` function

Adjust these to change strategy:
- `temperature`: Higher = more creative extraction, Lower = stricter matching
- System prompt: Add more extraction rules or fuzzy matching logic
- Model: Upgrade to `gpt-4o` for better accuracy (costs 15x more)

### Conversational Agent Customization
**File:** [lib/openai.ts](lib/openai.ts) - `conversationalReservation` function

Adjust these to change strategy:
- `temperature`: Currently 0.2 (very focused), increase for more natural responses
- Question order: Change the step-by-step flow in system prompt
- Response length: Adjust "10-15 words max" guideline
- Voice: Change TTS voice in `textToSpeech` function (alloy, echo, fable, onyx, nova, shimmer)
- Confirmation: Add more validation before `isComplete=true`

---

## Cost Analysis

### Quick Voice Agent
- Whisper transcription: $0.006/min (~$0.001 per 10s recording)
- GPT-4o-mini extraction: ~$0.001 per call
- **Total per booking:** ~$0.002

### Conversational Agent  
- Whisper transcription: $0.006/min × 7 turns = ~$0.007
- GPT-4o-mini conversation: ~$0.001 × 7 turns = ~$0.007
- TTS-1 voice: $15/1M chars × ~100 chars × 7 turns = ~$0.01
- **Total per booking:** ~$0.03

*Conversational agent costs 15x more but provides significantly better UX*

---

## Testing Checklist

### Quick Voice Agent
- [ ] Record complete info in one go
- [ ] Verify all fields extracted correctly
- [ ] Test fuzzy matching (e.g., "Hendon" → Hendon Office)
- [ ] Test date parsing (tomorrow, next Monday, etc.)
- [ ] Test time parsing (9am, 5pm, noon)
- [ ] Verify field normalization (startDate/endDate in response)
- [ ] Check missing fields validation

### Conversational Agent
- [ ] Test step-by-step flow (office → category → dates → age)
- [ ] Verify ONE question at a time (no multi-questions)
- [ ] Test AI voice responses play correctly
- [ ] Test conversation history maintained
- [ ] Test confirmation flow (all fields filled + user says yes)
- [ ] Verify booking preview updates each turn
- [ ] Test premature completion rejection
- [ ] Check audio playback queueing

---

## Logs & Debugging

Both agents include extensive console logging:

**Quick Voice Agent:**
```
🚀 [Quick Voice Agent] Processing one-shot extraction
📝 [Quick Voice Agent] Transcript: ...
✅ [Quick Voice Agent] Extracted data: {...}
```

**Conversational Agent:**
```
💬 [Conversational Agent] Starting conversation turn
📝 [Conversational Agent] User said: ...
📋 [Conversational Agent] Current data: {...}
🤖 [Conversational Agent] Sending to GPT with N messages
✅ [Conversational Agent] GPT response: {...}
📝 [Conversational Agent] Updated field: ...
📊 [Conversational Agent] Current state: ...
```

Check browser console for detailed flow tracking.
