"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { showToast } from "@/lib/toast";

// ============================================================================
// TYPE DEFINITIONS (mirror the server types)
// ============================================================================

export type ConversationPhase =
  | "discovery"
  | "recommendation"
  | "booking"
  | "availability"
  | "confirmation"
  | "complete";

export interface CustomerNeeds {
  purpose?: string;
  itemsDescription?: string;
  estimatedWeight?: string;
  distance?: string;
  numPassengers?: number;
  urgency?: string;
  budget?: string;
}

export interface BookingData {
  office?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  driverAge?: number;
  phoneNumber?: string;
  message?: string;
}

export interface ConversationState {
  phase: ConversationPhase;
  customerNeeds?: CustomerNeeds;
  recommendedCategory?: {
    id: string;
    name: string;
    reason: string;
  };
  userAcceptedRecommendation?: boolean;
  bookingData: BookingData;
  availabilityChecked?: boolean;
  isAvailable?: boolean;
  availabilityMessage?: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentResponse {
  message: string;
  audio: string;
  state: ConversationState;
  action: string;
  isComplete: boolean;
  reservationId?: string;
}

// ============================================================================
// HOOK
// ============================================================================

export function useAIAgent() {
  // UI State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Conversation State (using refs to avoid stale closures)
  const [conversationHistory, setConversationHistory] = useState<
    ConversationMessage[]
  >([]);
  const [agentState, setAgentState] = useState<ConversationState>({
    phase: "discovery",
    bookingData: { startTime: "10:00", endTime: "10:00" },
  });

  // Refs to always have latest state
  const historyRef = useRef<ConversationMessage[]>([]);
  const stateRef = useRef<ConversationState>(agentState);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Keep refs in sync
  useEffect(() => {
    historyRef.current = conversationHistory;
    console.log(
      "🔄 [AI Agent Hook] History updated, length:",
      conversationHistory.length
    );
  }, [conversationHistory]);

  useEffect(() => {
    stateRef.current = agentState;
    console.log("🔄 [AI Agent Hook] State updated, phase:", agentState.phase);
  }, [agentState]);

  // ============================================================================
  // AUDIO PLAYBACK
  // ============================================================================

  const playAudio = useCallback((base64Audio: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      console.log("🔊 [AI Agent Hook] Playing audio...");
      setIsPlaying(true);

      try {
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);

        if (!audioRef.current) {
          audioRef.current = new Audio();
        }

        const audio = audioRef.current;
        audio.src = url;

        audio.onended = () => {
          console.log("✅ [AI Agent Hook] Audio finished");
          setIsPlaying(false);
          URL.revokeObjectURL(url);
          resolve();
        };

        audio.onerror = (error) => {
          console.log("❌ [AI Agent Hook] Audio error:", error);
          setIsPlaying(false);
          URL.revokeObjectURL(url);
          reject(error);
        };

        audio.play().catch(reject);
      } catch (error) {
        console.log("❌ [AI Agent Hook] Audio setup error:", error);
        setIsPlaying(false);
        reject(error);
      }
    });
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  // ============================================================================
  // MAIN SEND MESSAGE FUNCTION
  // ============================================================================

  const sendMessage = useCallback(
    async (transcript: string): Promise<AgentResponse | null> => {
      console.log("💬 [AI Agent Hook] ========== NEW MESSAGE ==========");
      console.log("💬 [AI Agent Hook] User said:", transcript);
      console.log("📍 [AI Agent Hook] Current phase:", stateRef.current.phase);
      console.log(
        "📚 [AI Agent Hook] History length:",
        historyRef.current.length
      );

      setIsLoading(true);

      try {
        const response = await fetch("/api/ai-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            currentState: stateRef.current,
            conversationHistory: historyRef.current,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to process message");
        }

        console.log("✅ [AI Agent Hook] Response received");
        console.log("  - Message:", data.message);
        console.log("  - Phase:", data.state?.phase);
        console.log("  - Complete:", data.isComplete);

        // Update conversation history
        const newHistory: ConversationMessage[] = [
          ...historyRef.current,
          { role: "user", content: transcript },
          { role: "assistant", content: data.message },
        ];
        historyRef.current = newHistory;
        setConversationHistory(newHistory);

        // Update agent state
        if (data.state) {
          stateRef.current = data.state;
          setAgentState(data.state);
        }

        // Play audio response
        if (data.audio) {
          await playAudio(data.audio);
        }

        setIsLoading(false);

        return {
          message: data.message,
          audio: data.audio,
          state: data.state,
          action: data.action,
          isComplete: data.isComplete,
          reservationId: data.reservationId,
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.log("❌ [AI Agent Hook] Error:", error);
        showToast.error(message || "Failed to process message");
        setIsLoading(false);
        return null;
      }
    },
    [playAudio]
  );

  // ============================================================================
  // RESET CONVERSATION
  // ============================================================================

  const resetConversation = useCallback(() => {
    console.log("🔄 [AI Agent Hook] Resetting conversation");
    stopAudio();

    const initialState: ConversationState = {
      phase: "discovery",
      bookingData: { startTime: "10:00", endTime: "10:00" },
    };

    setConversationHistory([]);
    setAgentState(initialState);
    historyRef.current = [];
    stateRef.current = initialState;
  }, [stopAudio]);

  // ============================================================================
  // HELPER GETTERS
  // ============================================================================

  const getPhaseLabel = useCallback((): string => {
    const labels: Record<ConversationPhase, string> = {
      discovery: "Understanding your needs",
      recommendation: "Finding the perfect van",
      booking: "Collecting booking details",
      availability: "Checking availability",
      confirmation: "Confirming your booking",
      complete: "Booking complete!",
    };
    return labels[agentState.phase];
  }, [agentState.phase]);

  const getProgressPercentage = useCallback((): number => {
    const progress: Record<ConversationPhase, number> = {
      discovery: 20,
      recommendation: 40,
      booking: 60,
      availability: 80,
      confirmation: 90,
      complete: 100,
    };
    return progress[agentState.phase];
  }, [agentState.phase]);

  return {
    // State
    isPlaying,
    isLoading,
    conversationHistory,
    agentState,

    // Actions
    sendMessage,
    resetConversation,
    stopAudio,

    // Helpers
    getPhaseLabel,
    getProgressPercentage,
  };
}
