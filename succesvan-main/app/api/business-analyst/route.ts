import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { 
  analyzeBusinessQuery, 
  getBusinessHealthSummary,
  BusinessConversationMessage 
} from "@/lib/business-analyst";

export async function POST(req: NextRequest) {
  try {
    const { query, conversationHistory, action } = await req.json();

    if (!query && action !== "health") {
      return errorResponse("Query is required", 400);
    }

    // Handle different actions
    if (action === "health") {
      const summary = await getBusinessHealthSummary();
      return successResponse({ message: summary, action: "health" });
    }

    // Regular analysis query
    const history: BusinessConversationMessage[] = conversationHistory || [];
    const result = await analyzeBusinessQuery(query, history);

    return successResponse({
      message: result.message,
      conversationHistory: result.conversationHistory,
    });
  } catch (error) {
    console.log("❌ [Business Analyst API] Error:", error);
    const message = error instanceof Error ? error.message : "Analysis failed";
    return errorResponse(message, 500);
  }
}
