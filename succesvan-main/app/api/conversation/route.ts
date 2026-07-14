import { NextRequest, NextResponse } from "next/server";
import { conversationalReservation, textToSpeech } from "@/lib/openai";
import {
  buildRAGContext,
  fetchFullOffices,
  fetchFullCategories,
} from "@/lib/rag-context";
import connect from "@/lib/data";

export async function POST(request: NextRequest) {
  console.log("💬 [Conversation API] Received conversation request");

  try {
    const body = await request.json();
    const { transcript, currentData = {}, conversationHistory = [] } = body;

    console.log("📝 [Conversation API] Transcript:", transcript);
    console.log("📋 [Conversation API] Current data:", currentData);
    console.log(
      "🗣️ [Conversation API] Conversation history length:",
      conversationHistory.length
    );
    console.log(
      "🗣️ [Conversation API] Conversation history:",
      conversationHistory
    );

    if (!transcript) {
      return NextResponse.json(
        { success: false, error: "Transcript is required" },
        { status: 400 }
      );
    }

    // Get offices and categories from database
    await connect();

    console.log(
      "🔍 [Conversation API] Fetching full office and category data for RAG"
    );

    // Fetch comprehensive data for RAG context
    const fullOffices = await fetchFullOffices();
    const fullCategories = await fetchFullCategories();

    console.log(
      `📍 [Conversation API] Loaded ${fullOffices.length} offices and ${fullCategories.length} categories with full details`
    );

    // Build RAG context with all available information
    const ragContext = await buildRAGContext(
      fullOffices,
      fullCategories,
      currentData.startDate,
      currentData.endDate,
      currentData.office
    );

    console.log(
      "📚 [Conversation API] RAG context size:",
      ragContext.length,
      "characters"
    );

    // Format data for the function (simple version for extraction)
    const formattedOffices = fullOffices.map((o: any) => ({
      _id: o._id,
      name: o.name,
    }));
    const formattedCategories = fullCategories.map((c: any) => ({
      _id: c._id,
      name: c.name,
    }));

    // Get AI response with RAG context
    const aiResponse = await conversationalReservation(
      transcript,
      currentData,
      formattedOffices,
      formattedCategories,
      conversationHistory,
      ragContext // Pass RAG context to AI
    );

    console.log("✅ [Conversation API] AI response:", aiResponse.message);
    console.log("📊 [Conversation API] Is complete:", aiResponse.isComplete);
    console.log(
      "🔍 [Conversation API] Missing fields:",
      aiResponse.missingFields
    );

    // Convert AI message to speech
    console.log("🔊 [Conversation API] Generating speech...");
    const audioBuffer = await textToSpeech(aiResponse.message);
    const audioBase64 = audioBuffer.toString("base64");

    console.log(
      "✅ [Conversation API] Speech generated, size:",
      audioBuffer.length,
      "bytes"
    );

    return NextResponse.json({
      success: true,
      message: aiResponse.message,
      audio: audioBase64, // Base64 encoded audio
      data: aiResponse.data,
      missingFields: aiResponse.missingFields,
      isComplete: aiResponse.isComplete,
      action: aiResponse.action,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.log("❌ [Conversation API] Error:", message);

    return NextResponse.json(
      {
        success: false,
        error: message || "Failed to process conversation",
      },
      { status: 500 }
    );
  }
}
