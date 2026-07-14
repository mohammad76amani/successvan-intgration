/**
 * Fast AI Agent API Route
 *
 * Streamlined booking flow that completes in ~1 minute
 */



import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  processFastAgent,
  createInitialFastState,
  getOfficesList,
  FastAgentState,
} from "@/lib/fast-agent";
import { textToSpeech } from "@/lib/openai";

export async function POST(request: NextRequest) {
  const reqId = crypto.randomUUID();
  const startedAt = Date.now();
  console.log(`⚡ [Fast Agent API] (${reqId}) Received request`);

  try {
    const parseStart = Date.now();
    const body = await request.json();
    console.log(
      `⏱️ [Fast Agent API] (${reqId}) Parsed JSON in ${
        Date.now() - parseStart
      }ms`
    );
    const { message, state: clientState, action, includeAudio = true, parsedData } = body;

    console.log(`📝 [Fast Agent API] (${reqId}) Message:`, message);
    console.log(`🎯 [Fast Agent API] (${reqId}) Action:`, action);
    console.log(`📍 [Fast Agent API] (${reqId}) Phase:`, clientState?.phase);

    // Use provided state or create initial
    const currentState: FastAgentState =
      clientState || createInitialFastState();

    // Process the agent turn
    const agentStart = Date.now();
    const response = await processFastAgent(
      message,
      currentState,
      action,
      parsedData
    );
    console.log(
      `⏱️ [Fast Agent API] (${reqId}) Agent processed in ${
        Date.now() - agentStart
      }ms`
    );

    console.log(
      `✅ [Fast Agent API] (${reqId}) Response phase:`,
      response.state.phase
    );
    console.log(`📢 [Fast Agent API] (${reqId}) Message:`, response.message);

    // Generate audio for the message (if requested and not too long)
    let audioBase64: string | undefined;
    if (includeAudio && response.message && response.message.length < 500) {
      try {
        const ttsStart = Date.now();
        const audioBuffer = await textToSpeech(response.message);
        audioBase64 = audioBuffer.toString("base64");
        console.log(
          `🔊 [Fast Agent API] (${reqId}) Audio generated in ${
            Date.now() - ttsStart
          }ms, base64 length: ${audioBase64.length}`
        );
      } catch (audioError) {
        console.warn(
          `⚠️ [Fast Agent API] (${reqId}) Audio generation failed:`,
          audioError
        );
      }
    }

    console.log(
      `✅ [Fast Agent API] (${reqId}) Total time: ${
        Date.now() - startedAt
      }ms`
    );

    return NextResponse.json({
      success: true,
      data: {
        ...response,
        audio: audioBase64,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.log(`❌ [Fast Agent API] (${reqId}) Error:`, error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch offices for the booking form
export async function GET() {
  const reqId = crypto.randomUUID();
  const startedAt = Date.now();
  try {
    const offices = await getOfficesList();
    console.log(
      `✅ [Fast Agent API] (${reqId}) GET offices in ${
        Date.now() - startedAt
      }ms`
    );
    return NextResponse.json({ success: true, data: { offices } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.log(`❌ [Fast Agent API] (${reqId}) GET Error:`, error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
