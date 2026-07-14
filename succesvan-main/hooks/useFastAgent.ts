"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { showToast } from "@/lib/toast";
import { Office } from "@/types/type";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
  


export type FastPhase =    
  | "ask_needs"
  | "show_suggestions"
  | "collect_booking"
  | "select_Gearbox"
  | "select_addons"
  | "show_receipt"
  | "verify_phone"
  | "complete";

export interface CategorySuggestion {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  fuel: string;
  gear: {
    availableTypes: string[];
    automaticExtraCost?: number;
  } | string;
  seats: number;
  doors: number;
  pricingTiers: Array<{
    minDays: number;
    maxDays: number;
    pricePerDay: number;
  }>;
  extrahoursRate?: number;
  matchScore: number;
  matchReason: string;
}

export interface AddOnOption {
  _id: string;
  name: string;
  description?: string;
  pricingType: "flat" | "tiered";
  flatPrice?: {
    amount: number;
    isPerDay: boolean;
  };
  type:String
  tieredPrice?: {
    isPerDay: boolean;
    tiers: Array<{
      minDays: number;
      maxDays: number;
      price: number;
    }>;
  };
}

export interface SelectedAddOn {
  addOnId: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export interface FastAgentState {
  phase: FastPhase;
  needs?: {
    purpose: string;
    description: string;
    size: "small" | "medium" | "large";
  };
  suggestions?: CategorySuggestion[];
  selectedCategory?: CategorySuggestion;
  availableAddOns?: AddOnOption[];
  booking: {
    officeId?: string;
    officeName?: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    driverAge?: number;
    phoneNumber?: string;
    gearType?: "manual" | "automatic";
    // Price calculation fields
    totalDays?: number;
    extraHours?: number;
    pricePerDay?: number;
    extraHoursRate?: number;
    totalPrice?: number;
    priceBreakdown?: string;
    // Add-ons
    selectedAddOns?: SelectedAddOn[];
    addOnsTotal?: number;
  };
  userId?: string;
  userToken?: string;
  isNewUser?: boolean;
  verificationSent?: boolean;
  reservationId?: string;
}

 

export interface FastAgentResponse {
  message: string;
  audio?: string;
  state: FastAgentState;
  showSuggestions: boolean;
  needsPhoneInput: boolean;
  needsCodeInput: boolean;
  needsBookingForm: boolean;
  needsAddOns: boolean;
  needsReceipt: boolean;
  isComplete: boolean;
  error?: string;
}

// ============================================================================
// HOOK
// ============================================================================

export function useFastAgent() {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [agentState, setAgentState] = useState<FastAgentState>({
    phase: "ask_needs",
    booking: { startTime: "10:00", endTime: "10:00" },
  });
  const [history, setHistory] = useState<FastAgentState[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, []);
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stateRef = useRef<FastAgentState>(agentState);

  const pushHistory = useCallback((snapshot: FastAgentState) => {
    console.log("📚 [pushHistory] Saving state to history:", snapshot.phase);
    setHistory((prev) => {
      const cloned =
        typeof structuredClone === "function"
          ? structuredClone(snapshot)
          : (JSON.parse(JSON.stringify(snapshot)) as FastAgentState);
      console.log("📚 [pushHistory] History length before:", prev.length, "-> after:", prev.length + 1);
      return [...prev, cloned];
    });
  }, []);

  const goBack = useCallback(() => {
    console.log("⬅️ [goBack] Going back from phase:", stateRef.current.phase);
    stopAudio();

    const isNonInteractiveGearStep = (state: FastAgentState) => {
      if (state.phase !== "select_Gearbox") return false;
      const gear = state.selectedCategory?.gear;
      if (!gear) return true;
      if (typeof gear === "string") return true;
      return !(gear.availableTypes?.length > 1);
    };

    // Calculate target BEFORE updating history
    let targetState: FastAgentState | null = null;
    
    setHistory((prev) => {
      console.log("⬅️ [goBack] History length:", prev.length);
      if (prev.length === 0) {
        console.log("⬅️ [goBack] No history available!");
        return prev;
      }

      const last = prev[prev.length - 1];
      console.log("⬅️ [goBack] Last history item phase:", last.phase);
      
      if (isNonInteractiveGearStep(last) && prev.length >= 2) {
        targetState = prev[prev.length - 2];
        console.log("⬅️ [goBack] Skipping non-interactive gear step, going to:", targetState.phase);
        return prev.slice(0, -2);
      }

      targetState = last;
      console.log("⬅️ [goBack] Restoring to phase:", targetState.phase);
      return prev.slice(0, -1);
    });

    // Use setTimeout to ensure state update happens after history update completes
    setTimeout(() => {
      if (targetState) {
        console.log("⬅️ [goBack] Setting agent state to:", targetState.phase);
        setAgentState(targetState);
      } else {
        console.log("⬅️ [goBack] No target state to restore!");
      }
    }, 0);
  }, [stopAudio]);

  const canGoBack = history.length > 0;

  // Keep ref in sync
  useEffect(() => {
    console.log("🔄 [stateRef] Syncing ref to phase:", agentState.phase);
    stateRef.current = agentState;
  }, [agentState]);

  // Fetch offices on mount
  useEffect(() => {
    fetchOffices();
  }, []);

  const fetchOffices = async () => {
    try {
      const res = await fetch("/api/fast-agent");
      const data = await res.json();
      if (data.success) {
        setOffices(data.data.offices);
      }
    } catch (error) {
      console.log("Failed to fetch offices:", error);
    }
  };

  // Play audio
  const playAudio = useCallback((base64Audio: string) => {
    try {
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audioRef.current = audio;
      setIsPlaying(true);

      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };

      audio.play().catch(() => setIsPlaying(false));
    } catch {
      setIsPlaying(false);
    }
  }, []);

  // Stop audio


  // Send message to agent
  const sendMessage = useCallback(
    async (
      message: string,
      action?: string,
      parsedData?: any
    ): Promise<FastAgentResponse | null> => {
      const startedAt = Date.now();
      setIsLoading(true);
      stopAudio();

      // Add user message (except for start)
      if (message !== "start") {
        setMessages((prev) => [...prev, { role: "user", content: message }]);
      }

      try {
        console.log(
          "📤 [useFastAgent] Sending",
          JSON.stringify({ message, action, phase: stateRef.current.phase })
        );
        const res = await fetch("/api/fast-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            state: stateRef.current,
            action,
            parsedData,
            includeAudio: true,
          }),
        });

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || "Agent failed");
        }

        const response: FastAgentResponse = data.data;
        console.log(
          "📥 [useFastAgent] Received response",
          JSON.stringify({
            phase: response.state.phase,
            showSuggestions: response.showSuggestions,
            needsBookingForm: response.needsBookingForm,
            needsPhoneInput: response.needsPhoneInput,
            needsCodeInput: response.needsCodeInput,
            isComplete: response.isComplete,
            elapsedMs: Date.now() - startedAt,
          })
        );

        // Save current state so we can return to it later
        console.log("💾 [sendMessage] Saving current phase before transition:", stateRef.current.phase, "-> new phase:", response.state.phase);
        pushHistory(stateRef.current);

        // Update state
        setAgentState(response.state);

        // Add assistant message
        if (response.message) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: response.message },
          ]);
        }

        // Play audio
        if (response.audio) {
          playAudio(response.audio);
        }

        return response;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.log("Agent error:", error);
        showToast.error(message || "Something went wrong");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [playAudio, stopAudio, pushHistory]
  );

  // Select a category
  const selectCategory = useCallback(
    async (categoryId: string) => {
      return sendMessage(categoryId, "select_category");
    },
    [sendMessage]
  );

  // Submit booking form
  const submitBooking = useCallback(
    async (booking: {
      officeId: string;
      startDate: string;
      endDate: string;
      driverAge: number;
    }) => {
      return sendMessage(JSON.stringify(booking), "submit_booking");
    },
    [sendMessage]
  );

  // Voice booking - parse natural language booking details
  const voiceBooking = useCallback(
    async (voiceInput: string) => {
      return sendMessage(voiceInput, "voice_booking");
    },
    [sendMessage]
  );

  // Voice parsed - send transcript + structured data (skips LLM parsing)
  const voiceParsed = useCallback(
    async (transcript: string, parsedData: any) => {
      return sendMessage(transcript, "voice_parsed", parsedData);
    },
    [sendMessage]
  );

  // Voice phone - parse phone number from voice
  const voicePhone = useCallback(
    async (voiceInput: string) => {
      return sendMessage(voiceInput, "voice_phone");
    },
    [sendMessage]
  );

  // Confirm add-ons - proceed to receipt with selected add-ons
  const confirmAddOns = useCallback(
    async (selectedAddOns: SelectedAddOn[]) => {
      return sendMessage(JSON.stringify({ selectedAddOns }), "confirm_addons");
    },
    [sendMessage]
  );

  // Confirm receipt - proceed to phone verification
  const confirmReceipt = useCallback(async () => {
    return sendMessage("confirm", "confirm_receipt");
  }, [sendMessage]);

  // Select gear type - transition from select_gear to select_addons
  const selectGear = useCallback((gearType: "manual" | "automatic", gearExtraCost: number) => {
    console.log("⚙️ [selectGear] Transitioning from", stateRef.current.phase, "to select_addons with gear:", gearType);
    pushHistory(stateRef.current);
    setAgentState(prev => ({
      ...prev,
      phase: "select_addons",
      booking: {
        ...prev.booking,
        gearType,
        totalPrice: (prev.booking.totalPrice || 0) + gearExtraCost,
      },
    }));
  }, [pushHistory]);

  // Send phone verification code
  const sendCode = useCallback(
    async (phoneNumber: string) => {
      return sendMessage(phoneNumber, "send_code");
    },
    [sendMessage]
  );

  // Verify code
  const verifyCode = useCallback(
    async (code: string) => {
      return sendMessage(code, "verify_code");
    },
    [sendMessage]
  );

  // Reset
  const reset = useCallback(() => {
    stopAudio();
    setMessages([]);
    setHistory([]);
    setAgentState({
      phase: "ask_needs",
      booking: { startTime: "10:00", endTime: "10:00" },
    });
  }, [stopAudio]);

  return {
    // State
    isLoading,
    isPlaying,
    messages,
    agentState,
    offices,

    // Actions
    sendMessage,
    selectCategory,
    submitBooking,
    voiceBooking,
    voiceParsed,
    voicePhone,
    confirmAddOns,
    selectGear,
    confirmReceipt,
    sendCode,
    verifyCode,
    goBack,
    canGoBack,
    reset,
    stopAudio,
  };
}
