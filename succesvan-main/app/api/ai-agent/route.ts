import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  processAgentTurn,
  createInitialState,
  getInitialGreeting,
  ConversationState,
  ConversationMessage,
} from "@/lib/ai-agent";
import { textToSpeech } from "@/lib/openai";
import connect from "@/lib/data";

export async function POST(request: NextRequest) {
  const reqId = crypto.randomUUID();
  const startedAt = Date.now();
  console.log(`🤖 [AI Agent API] (${reqId}) Received request`);

  try {
    const parseStart = Date.now();
    const body = await request.json();
    const { transcript, currentState, conversationHistory = [] } = body;
    console.log(
      `⏱️ [AI Agent API] (${reqId}) Parsed JSON in ${
        Date.now() - parseStart
      }ms`
    );

    console.log(`📝 [AI Agent API] (${reqId}) Transcript:`, transcript);
    console.log(
      `📍 [AI Agent API] (${reqId}) Current phase:`,
      currentState?.phase || "new"
    );
    console.log(
      `💬 [AI Agent API] (${reqId}) History length:`,
      conversationHistory.length
    );

    // Connect to database
    await connect();

    // Handle initial greeting
    if (
      transcript.toLowerCase() === "start" &&
      (!currentState || currentState.phase === "discovery")
    ) {
      console.log("👋 [AI Agent API] Sending initial greeting");

      const ttsStart = Date.now();
      const greeting = await getInitialGreeting();
      const audioBuffer = await textToSpeech(greeting);
      console.log(
        `🔊 [AI Agent API] (${reqId}) Greeting TTS in ${
          Date.now() - ttsStart
        }ms`
      );

      return NextResponse.json({
        success: true,
        message: greeting,
        audio: audioBuffer.toString("base64"),
        state: createInitialState(),
        action: "ask",
        isComplete: false,
      });
    }

    if (!transcript) {
      return NextResponse.json(
        { success: false, error: "Transcript is required" },
        { status: 400 }
      );
    }

    // Use existing state or create new one
    const state: ConversationState = currentState || createInitialState();

    // Process the conversation turn
    const agentStart = Date.now();
    const response = await processAgentTurn(
      transcript,
      state,
      conversationHistory as ConversationMessage[]
    );
    console.log(
      `⏱️ [AI Agent API] (${reqId}) Agent processed in ${
        Date.now() - agentStart
      }ms`
    );

    console.log(`✅ [AI Agent API] (${reqId}) Response:`, response.message);
    console.log(
      `📍 [AI Agent API] (${reqId}) New phase:`,
      response.state.phase
    );
    console.log(`🎯 [AI Agent API] (${reqId}) Complete:`, response.isComplete);

    // Generate speech
    console.log(`🔊 [AI Agent API] (${reqId}) Generating speech...`);
    const ttsStart = Date.now();
    const audioBuffer = await textToSpeech(response.message);
    console.log(
      `🔊 [AI Agent API] (${reqId}) TTS in ${Date.now() - ttsStart}ms`
    );

    console.log(
      `✅ [AI Agent API] (${reqId}) Speech generated:`,
      audioBuffer.length,
      "bytes"
    );

    return NextResponse.json({
      success: true,
      message: response.message,
      audio: audioBuffer.toString("base64"),
      state: response.state,
      action: response.action,
      isComplete: response.isComplete,
      reservationId: response.reservationId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.log(`❌ [AI Agent API] (${reqId}) Stack:`, message);

    return NextResponse.json(
      {
        success: false,
        error: message || "Failed to process request",
      },
      { status: 500 }
    );
  } finally {
    console.log(
      `✅ [AI Agent API] (${reqId}) Total time: ${
        Date.now() - startedAt
      }ms`
    );
  }
}
