import { NextRequest, NextResponse } from "next/server";
import { textToSpeech } from "@/lib/openai";
 
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { success: false, error: "`text` is required" },
        { status: 400 }
      );
    }

    const audioBuffer = await textToSpeech(text);

    // Convert Buffer to Uint8Array for Response compatibility
    const uint8Array = new Uint8Array(audioBuffer);

    return new Response(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to synthesize audio";
    console.log("❌ [TTS API]", message);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
