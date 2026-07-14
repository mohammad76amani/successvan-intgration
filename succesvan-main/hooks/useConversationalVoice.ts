"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { showToast } from "@/lib/toast";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface ConversationResponse {
  message: string;
  audio: string; // Base64 encoded
  data: any;
  missingFields: string[];
  isComplete: boolean;
  action: "ask" | "confirm" | "update";
}

export function useConversationalVoice() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    ConversationMessage[]
  >([]);
  const [currentData, setCurrentData] = useState<any>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Use refs to always have access to latest state (fixes async closure issue)
  const historyRef = useRef<ConversationMessage[]>([]);
  const dataRef = useRef<any>({});

  // Keep refs in sync with state
  useEffect(() => {
    historyRef.current = conversationHistory;
    console.log(
      "🔄 [Ref Sync] historyRef updated, length:",
      conversationHistory.length
    );
  }, [conversationHistory]);

  useEffect(() => {
    dataRef.current = currentData;
    console.log("🔄 [Ref Sync] dataRef updated:", JSON.stringify(currentData));
  }, [currentData]);

  const playAudioFromBase64 = useCallback((base64Audio: string) => {
    return new Promise<void>((resolve, reject) => {
      console.log("🔊 [Audio] Playing AI response");
      setIsPlaying(true);

      try {
        // Convert base64 to blob
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);

        // Create or reuse audio element
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }

        const audio = audioRef.current;
        audio.src = url;

        audio.onended = () => {
          console.log("✅ [Audio] Playback finished");
          setIsPlaying(false);
          URL.revokeObjectURL(url);
          resolve();
        };

        audio.onerror = (error) => {
          console.log("❌ [Audio] Playback error:", error);
          setIsPlaying(false);
          URL.revokeObjectURL(url);
          reject(error);
        };

        audio.play().catch((error) => {
          console.log("❌ [Audio] Failed to play:", error);
          setIsPlaying(false);
          URL.revokeObjectURL(url);
          reject(error);
        });
      } catch (error) {
        console.log("❌ [Audio] Error creating audio:", error);
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
      console.log("⏹️ [Audio] Stopped");
    }
  }, []);

  const sendMessage = useCallback(
    async (transcript: string): Promise<ConversationResponse | null> => {
      console.log("💬 [Conversation Hook] ========== NEW MESSAGE ==========");
      console.log("💬 [Conversation Hook] User transcript:", transcript);

      // Use refs to get current state (refs are always up-to-date, unlike closures)
      const historySnapshot = [...historyRef.current];
      const dataSnapshot = { ...dataRef.current };

      console.log(
        "📚 [Conversation Hook] History from REF, length:",
        historySnapshot.length
      );
      console.log(
        "📊 [Conversation Hook] Data from REF:",
        JSON.stringify(dataSnapshot)
      );

      try {
        console.log("📤 [Conversation Hook] SENDING TO API:");
        console.log("  - transcript:", transcript);
        console.log("  - history length:", historySnapshot.length);
        console.log("  - data:", JSON.stringify(dataSnapshot));

        // Send to conversation API with the current snapshots
        const response = await fetch("/api/conversation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transcript,
            currentData: dataSnapshot,
            conversationHistory: historySnapshot,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to process conversation");
        }

        console.log("✅ [Conversation Hook] API Response received:");
        console.log("  - message:", data.message);
        console.log("  - new data:", JSON.stringify(data.data));
        console.log("  - isComplete:", data.isComplete);
        console.log("  - missing:", data.missingFields);

        // Calculate new values FIRST
        const newHistory: ConversationMessage[] = [
          ...historySnapshot,
          { role: "user" as const, content: transcript },
          { role: "assistant" as const, content: data.message },
        ];
        const newData = { ...dataSnapshot, ...data.data };

        // Update refs IMMEDIATELY (so next call sees new values)
        historyRef.current = newHistory;
        dataRef.current = newData;
        console.log(
          "📝 [Conversation Hook] Refs updated immediately - history length:",
          newHistory.length
        );
        console.log(
          "📝 [Conversation Hook] Refs updated immediately - data:",
          JSON.stringify(newData)
        );

        // Update state for UI re-render
        setConversationHistory(newHistory);
        setCurrentData(newData);

        // Play the audio response
        if (data.audio) {
          await playAudioFromBase64(data.audio);
        }

        return {
          message: data.message,
          audio: data.audio,
          data: data.data,
          missingFields: data.missingFields,
          isComplete: data.isComplete,
          action: data.action,
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.log("❌ [Conversation Hook] Error:", error);
        showToast.error(message || "Failed to process conversation");
        return null;
      }
    },
    [playAudioFromBase64] // Only stable deps - refs handle the rest
  );

  const resetConversation = useCallback(() => {
    console.log("🔄 [Conversation Hook] Resetting conversation");
    setConversationHistory([]);
    setCurrentData({});
    historyRef.current = [];
    dataRef.current = {};
    stopAudio();
  }, [stopAudio]);

  return {
    isPlaying,
    conversationHistory,
    currentData,
    sendMessage,
    resetConversation,
    stopAudio,
  };
}
