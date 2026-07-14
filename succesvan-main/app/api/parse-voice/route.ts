import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import connect from "@/lib/data";
import Office from "@/model/office";
import Category from "@/model/category";

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedOffices: { data: any[]; expiresAt: number } | null = null;
let cachedCategories: { data: any[]; expiresAt: number } | null = null;

async function getCachedOffices() {
  const now = Date.now();
  if (cachedOffices && cachedOffices.expiresAt > now) return cachedOffices.data;
  const data = await Office.find({}).select("_id name").lean();
  cachedOffices = { data, expiresAt: now + CACHE_TTL_MS };
  return data;
}

async function getCachedCategories() {
  const now = Date.now();
  if (cachedCategories && cachedCategories.expiresAt > now) return cachedCategories.data;
  const data = await Category.find({}).select("_id name").lean();
  cachedCategories = { data, expiresAt: now + CACHE_TTL_MS };
  return data;
}

function parseRelativeDate(input: string, now: Date) {
  const text = input.toLowerCase();
  if (text.includes("tomorrow")) {
    const d = new Date(now.getTime() + 86400000);
    return d.toISOString().split("T")[0];
  }
  const weekdays = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const nextMatch = text.match(/next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/);
  const dayMatch = text.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  const targetDay = (nextMatch?.[1] || dayMatch?.[1]) as string | undefined;
  if (targetDay) {
    const targetIdx = weekdays.indexOf(targetDay);
    if (targetIdx >= 0) {
      const d = new Date(now);
      let delta = (targetIdx - d.getDay() + 7) % 7;
      if (nextMatch) delta = delta === 0 ? 7 : delta;
      if (!nextMatch && delta === 0) delta = 7;
      d.setDate(d.getDate() + delta);
      return d.toISOString().split("T")[0];
    }
  }
  const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return iso[0];
  return null;
}

function parseTime(input: string) {
  const text = input.toLowerCase();
  const match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (match) {
    let hour = parseInt(match[1], 10);
    const min = match[2] ? parseInt(match[2], 10) : 0;
    const mer = match[3];
    if (mer === "pm" && hour < 12) hour += 12;
    if (mer === "am" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }
  return null;
}

function parseDriverAge(input: string) {
  const text = input.toLowerCase();
  const ageMatch = text.match(/\b(i'?m|i am|age)\s*(\d{2})\b/);
  if (ageMatch) return parseInt(ageMatch[2], 10);
  return null;
}

function matchByName(input: string, items: any[]) {
  const text = input.toLowerCase();
  return items.find((i) => text.includes(String(i.name).toLowerCase()));
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("🎙️ [API] Voice parse request received");

  try {
    // Initialize OpenAI client (lazy)
    let openai: ReturnType<typeof getOpenAI> | null = null;

    // Parse request - support both JSON (old) and FormData (new with audio)
    const contentType = request.headers.get("content-type");
    console.log("📝 [API] Content-Type:", contentType);

    let transcript = "";
    let autoSubmit = false;

    if (contentType?.includes("multipart/form-data")) {
      // Audio upload - Process directly to avoid S3 permission issues
      console.log("🎧 [API] Processing audio file...");
      const formData = await request.formData();
      const audioFile = formData.get("audio") as File;
      autoSubmit = formData.get("autoSubmit") === "true";

      if (!audioFile) {
        console.log("❌ [API] No audio file provided");
        return NextResponse.json(
          { success: false, error: "No audio file provided" },
          { status: 400 },
        );
      }

      console.log(`📊 [API] Audio file size: ${audioFile.size} bytes`);
      
      // Check if file is too large for CloudFront (20MB limit)
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (audioFile.size > maxSize) {
        console.warn(`⚠️ [API] Audio file exceeds CloudFront limit: ${audioFile.size} bytes`);
        return NextResponse.json(
          { 
            success: false, 
            error: "Audio file too large. Please record a shorter message (max 3-4 minutes)." 
          },
          { status: 413 }
        );
      }

      console.log("🎙️ [API] Transcribing with Whisper...");
      
      // Process directly - no S3 needed
      if (!openai) openai = getOpenAI();
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "en",
      });

      transcript = transcription.text;
      console.log(`✅ [API] Transcription complete: "${transcript}"`);
    } else {
      // Old: Direct transcript
      const body = await request.json();
      transcript = body.transcript;
      autoSubmit = body.autoSubmit || false;
    }

    // Fast heuristic extraction to avoid GPT when possible
    const now = new Date();
    await connect();
    const [offices, categories] = await Promise.all([
      getCachedOffices(),
      getCachedCategories(),
    ]);

    const officeMatch = matchByName(transcript, offices);
    const categoryMatch = matchByName(transcript, categories);
    const startDate = parseRelativeDate(transcript, now);
    const endDate = parseRelativeDate(transcript.replace(/return|back/gi, "next"), now);
    const parsedStartTime = parseTime(transcript);
    const parsedEndTime = parseTime(transcript.replace(/return|back/gi, "at"));
    const driverAge = parseDriverAge(transcript);

    const fastParsed = {
      office: officeMatch?._id || null,
      category: categoryMatch?._id || null,
      startDate,
      endDate,
      startTime: parsedStartTime || "10:00",
      endTime: parsedEndTime || "10:00",
      driverAge: driverAge || null,
      message: transcript || "",
    };

    const hasAnyFastField =
      fastParsed.office ||
      fastParsed.category ||
      fastParsed.startDate ||
      fastParsed.endDate ||
      fastParsed.driverAge;

    if (hasAnyFastField) {
      console.log("⚡ [API] Fast parse matched fields, skipping GPT");
      const requiredFields: (keyof typeof fastParsed)[] = [
        "office",
        "category",
        "startDate",
        "endDate",
        "driverAge",
      ];
      const missingFields = requiredFields.filter(
        (field) => !fastParsed[field],
      );
      console.log("📋 [API] Fast parsed data:", fastParsed);
      console.log(`⏱️ [API] Total processing time: ${Date.now() - startTime}ms`);
      return NextResponse.json({
        success: true,
        transcript,
        data: fastParsed,
        missingFields,
        autoSubmit: false,
      });
    }

    console.log("📊 [API] Fetching offices and categories from cache...");
    console.log(
      `✅ [API] Found ${offices.length} offices and ${categories.length} categories`,
    );

    // Extract structured data using GPT-4
    if (!openai) openai = getOpenAI();
    const systemPrompt = `You are a helpful assistant that extracts reservation details from natural language.

Available offices: ${offices
      .map((o: any) => `${o.name} (ID: ${o._id})`)
      .join(", ")}
Available categories: ${categories
      .map((c: any) => `${c.name} (ID: ${c._id})`)
      .join(", ")}

Extract the following information and return ONLY valid JSON:
{
  "office": "office_id_here",
  "category": "category_id_here", 
  "pickupDate": "YYYY-MM-DD",
  "returnDate": "YYYY-MM-DD",
  "pickupTime": "HH:MM",
  "returnTime": "HH:MM",
  "driverAge": 25,
  "message": "any additional notes"
}

Rules:
- Match office by name (e.g., "London" → find London office ID)
- Match category by keywords (e.g., "van", "small van", "large van" → find matching category)
- Parse relative dates: "tomorrow" = next day, "next Monday" = following Monday
- Parse times: "10am" → "10:00", "5pm" → "17:00"
- Default pickup time: "10:00", return time: "10:00"
- Only include fields that are mentioned. Use null for missing fields.`;

    console.log("🤖 [API] Sending to gpt-5-mini for extraction...");

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini", // Use "gpt-4o" for better accuracy
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcript },
      ],
      response_format: { type: "json_object" },
    });

    const result = completion.choices[0].message.content;
    const parsedData = result ? JSON.parse(result) : {};

    console.log("✅ [API] GPT extraction complete:", parsedData);

    // Detect missing required fields (matching reservation model)
    const requiredFields: (keyof typeof normalizedData)[] = [
      "office", // Required in model
      "category", // Required in model
      "startDate", // Required in model (pickup date)
      "endDate", // Required in model (return date)
      "driverAge", // Required in model
    ];

    // Map old field names to new ones for backwards compatibility
    const normalizedData: {
      office: any;
      category: any;
      startDate: any;
      endDate: any;
      startTime: any;
      endTime: any;
      driverAge: any;
      message: any;
    } = {
      office: parsedData.office,
      category: parsedData.category,
      startDate: parsedData.startDate || parsedData.pickupDate,
      endDate: parsedData.endDate || parsedData.returnDate,
      startTime: parsedData.startTime || parsedData.pickupTime || "10:00",
      endTime: parsedData.endTime || parsedData.returnTime || "10:00",
      driverAge: parsedData.driverAge,
      message: parsedData.message || "",
    };

    const missingFields = requiredFields.filter(
      (field) => !normalizedData[field],
    );

    if (missingFields.length > 0) {
      console.warn("⚠️ [API] Missing required fields:", missingFields);
    }

    console.log("📋 [API] Normalized data:", normalizedData);

    const processingTime = Date.now() - startTime;
    console.log(`⏱️ [API] Total processing time: ${processingTime}ms`);

    // If autoSubmit is enabled and we have enough data, create reservation
    if (
      autoSubmit &&
      parsedData.office &&
      parsedData.category &&
      parsedData.pickupDate &&
      parsedData.returnDate
    ) {
      console.log(
        "🚀 [API] Auto-submit enabled and all required fields present",
      );
      // Here you would call your reservation API
      // For now, just return the data with autoSubmit flag
      return NextResponse.json({
        success: true,
        transcript,
        data: parsedData,
        missingFields: [],
        autoSubmit: true,
        message: "Ready to create reservation",
      });
    }

    console.log("✅ [API] Returning extracted data for form filling");

    // Return extracted data for form filling
    return NextResponse.json({
      success: true,
      transcript,
      data: normalizedData,
      missingFields,
      autoSubmit: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const processingTime = Date.now() - startTime;
    console.log("❌ [API] Error parsing voice:", error);
    console.log(`⏱️ [API] Failed after ${processingTime}ms`);
    return NextResponse.json(
      {
        success: false,
        error: message || "Failed to process voice input",
      },
      { status: 500 },
    );
  }
}
