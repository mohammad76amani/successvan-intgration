# Voice-Powered Reservation System with OpenAI

This implementation uses OpenAI's Whisper and GPT-4 models to enable voice-based form filling and automatic reservation creation.

## 🎯 Features

- **Speech-to-Text**: Uses OpenAI Whisper API for accurate audio transcription
- **Intelligent Form Filling**: GPT-4o-mini extracts structured data from natural language
- **Auto-Submit**: Optional automatic reservation submission
- **Smart Date Parsing**: Understands relative dates ("tomorrow", "next Monday")
- **Time Conversion**: Converts natural time ("10am", "5pm") to 24-hour format
- **Office & Category Matching**: Intelligently matches spoken names to database IDs

## 🚀 Setup

### 1. Install Dependencies

```bash
npm install openai
```

### 2. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-openai-api-key-here
NEXT_PUBLIC_MONGODB_URI=your-mongodb-connection-string
```

## 📁 File Structure

```
lib/
  └── openai.ts              # OpenAI client and utility functions
hooks/
  └── useVoiceRecording.ts   # Voice recording React hook
app/api/parse-voice/
  └── route.ts               # API endpoint for voice processing
components/global/
  └── ReservationForm.tsx    # Updated form with voice integration
```

## 🔧 How It Works

### 1. Voice Recording
```typescript
const { isRecording, isProcessing, toggleRecording } = useVoiceRecording({
  onTranscriptionComplete: (result) => {
    // Handle the extracted data
  },
  autoSubmit: false, // Set to true for automatic submission
});
```

### 2. Audio Processing Flow

```
User speaks → MediaRecorder captures audio → Sent to API
                                                    ↓
                                          Whisper transcribes
                                                    ↓
                                          GPT-4 extracts data
                                                    ↓
                                          Returns structured JSON
                                                    ↓
                                          Form auto-fills
```

### 3. Example Voice Commands

**Basic Booking:**
```
"I need a van from London office tomorrow at 10am returning next day at 5pm, driver age 30"
```

**With Category:**
```
"Small van rental, Brent Cross office, pickup Monday 9am, return Wednesday 6pm, age 35"
```

**Minimal:**
```
"London, van, tomorrow to next week"
```

## 🤖 OpenAI Models Used

### 1. **Whisper-1** (Speech-to-Text)
- **Purpose**: Converts audio to text
- **Accuracy**: High accuracy for English speech
- **Cost**: $0.006 per minute
- **Supported formats**: mp3, mp4, mpeg, mpga, m4a, wav, webm

### 2. **GPT-4o-mini** (Data Extraction)
- **Purpose**: Extracts structured reservation data
- **Why**: Fast, cost-effective, good accuracy
- **Cost**: $0.150 per 1M input tokens, $0.600 per 1M output tokens
- **Alternative**: Use `gpt-4o` for even better accuracy (higher cost)

### Model Comparison

| Model | Speed | Cost | Accuracy | Best For |
|-------|-------|------|----------|----------|
| GPT-4o-mini | ⚡⚡⚡ | 💰 | ⭐⭐⭐⭐ | Production (Recommended) |
| GPT-4o | ⚡⚡ | 💰💰💰 | ⭐⭐⭐⭐⭐ | High accuracy needs |
| GPT-3.5-turbo | ⚡⚡⚡ | 💰 | ⭐⭐⭐ | Simple extractions |

## 💰 Cost Estimation

**Example: 100 voice bookings per day**

- Audio duration: ~10 seconds average
- Whisper cost: 100 × (10/60) × $0.006 = **$0.10/day**
- GPT-4o-mini cost: 100 × ~500 tokens × $0.15/1M = **$0.0075/day**
- **Total: ~$0.11/day** or **$3.30/month**

## 🛠️ Advanced Configuration

### Enable Auto-Submit

In `ReservationForm.tsx`, set `autoSubmit: true`:

```typescript
const { isRecording, isProcessing, toggleRecording } = useVoiceRecording({
  autoSubmit: true, // Enable automatic submission
  onTranscriptionComplete: (result) => {
    if (result.autoSubmit) {
      // Reservation was automatically created
      router.push('/confirmation');
    }
  },
});
```

### Customize GPT Prompt

In `lib/openai.ts` or `app/api/parse-voice/route.ts`, modify the system prompt:

```typescript
const systemPrompt = `You are a helpful assistant...
Additional rules:
- Default pickup time to 9:00 if not mentioned
- Assume "van" category if vehicle type unclear
- Parse "this weekend" as next Saturday
`;
```

### Add Custom Fields

Extend the extraction schema:

```typescript
{
  "office": "office_id",
  "category": "category_id",
  // ... existing fields
  "insuranceType": "basic|premium",  // NEW
  "numberOfPassengers": 2,           // NEW
  "additionalRequests": "GPS needed" // NEW
}
```

## 🧪 Testing

### Test Voice Input

1. Click the microphone button
2. Speak clearly: "London office, small van, tomorrow 10am to next Friday 5pm, age 30"
3. Wait for processing
4. Form should auto-fill with extracted data

### Test API Directly

```bash
# Create test audio file
curl -X POST http://localhost:3000/api/parse-voice \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@test-audio.webm" \
  -F "autoSubmit=false"
```

### Test with Text (Development)

```bash
curl -X POST http://localhost:3000/api/parse-voice \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "I need a van from London tomorrow 10am returning next day 5pm, age 25",
    "autoSubmit": false
  }'
```

## 🐛 Troubleshooting

### Error: "OpenAI API key not found"
- Ensure `.env.local` has `NEXT_PUBLIC_OPENAI_API_KEY`
- Restart Next.js dev server after adding env variables

### Error: "Microphone permission denied"
- Browser needs microphone permissions
- Check browser settings → Privacy → Microphone

### Poor transcription quality
- Speak clearly and at moderate pace
- Reduce background noise
- Use a good quality microphone
- Consider switching to `gpt-4o` for better parsing

### Form not auto-filling
- Check browser console for errors
- Verify office and category IDs match database
- Check API response in Network tab

## 🔒 Security Best Practices

1. **Never expose API keys client-side**
   - Keep OpenAI calls server-side only
   - Use environment variables

2. **Validate extracted data**
   - Verify office and category IDs exist
   - Validate date ranges
   - Sanitize user inputs

3. **Rate limiting**
   - Implement rate limits on voice API endpoint
   - Prevent API abuse

4. **Audio file size limits**
   - Limit recording duration (e.g., 30 seconds max)
   - Validate file size before processing

## 📊 Monitoring

Track usage and costs:

```typescript
// Add logging in parse-voice/route.ts
console.log({
  timestamp: new Date(),
  transcriptionLength: transcript.length,
  processingTime: Date.now() - startTime,
  autoSubmit,
});
```

## 🚀 Production Checklist

- [ ] OpenAI API key configured
- [ ] Environment variables set
- [ ] Rate limiting implemented
- [ ] Error handling tested
- [ ] Audio file size limits set
- [ ] Microphone permissions handled
- [ ] Fallback UI for unsupported browsers
- [ ] Cost monitoring setup
- [ ] Privacy policy updated (audio recording)

## 📚 Resources

- [OpenAI Whisper API Docs](https://platform.openai.com/docs/guides/speech-to-text)
- [OpenAI GPT-4 API Docs](https://platform.openai.com/docs/guides/text-generation)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [OpenAI Pricing](https://openai.com/pricing)

## 🎓 Example Use Cases

1. **Quick Bookings**: Users can book while driving (hands-free)
2. **Accessibility**: Helps users with typing difficulties
3. **Mobile Optimization**: Easier than typing on mobile keyboards
4. **Speed**: Faster than manual form filling
5. **Customer Service**: Phone operators can use voice to create bookings

---

**Need help?** Check the console logs or contact the development team.
