"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  FiX, 
  FiMic, 
  FiVolume2, 
  FiCheck, 
  FiTruck, 
  FiCalendar, 
  FiMapPin,
  FiUser
} from "react-icons/fi";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { useAIAgent, ConversationPhase } from "@/hooks/useAIAgent";

interface AIAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (reservationId: string, bookingData: any) => void;
}

export default function AIAgentModal({
  isOpen,
  onClose,
  onComplete,
}: AIAgentModalProps) {
  const [mounted, setMounted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const {
    isPlaying,
    isLoading,
    conversationHistory,
    agentState,
    sendMessage,
    resetConversation,
    stopAudio,
    getPhaseLabel,
    getProgressPercentage,
  } = useAIAgent();

  const { isRecording, isProcessing, toggleRecording } = useVoiceRecording({
    onTranscriptionComplete: async (result) => {
      console.log("🎤 [AI Agent Modal] User said:", result.transcript);
      
      const response = await sendMessage(result.transcript);
      
      if (response?.isComplete && response.reservationId) {
        console.log("✅ [AI Agent Modal] Booking complete!");
        setTimeout(() => {
          onComplete(response.reservationId!, response.state.bookingData);
        }, 2000);
      }
    },
    autoSubmit: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationHistory]);

  // Start conversation when modal opens
  useEffect(() => {
    if (isOpen && !hasStarted && mounted) {
      setHasStarted(true);
      sendMessage("start");
    }
  }, [isOpen, hasStarted, mounted, sendMessage]);

  if (!isOpen || !mounted) return null;

  const handleClose = () => {
    stopAudio();
    resetConversation();
    setHasStarted(false);
    onClose();
  };

  // Phase icons
  const getPhaseIcon = (phase: ConversationPhase) => {
    switch (phase) {
      case "discovery": return <FiUser className="w-4 h-4" />;
      case "recommendation": return <FiTruck className="w-4 h-4" />;
      case "booking": return <FiCalendar className="w-4 h-4" />;
      case "availability": return <FiMapPin className="w-4 h-4" />;
      case "confirmation": return <FiCheck className="w-4 h-4" />;
      case "complete": return <FiCheck className="w-4 h-4" />;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header with Phase Indicator */}
        <div className="bg-linear-to-r from-orange-500 to-orange-600 text-white px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <FiTruck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Van Hire Consultant</h2>
                <p className="text-orange-100 text-sm">AI-Powered Booking</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-orange-100 mb-1">
              <span className="flex items-center gap-1">
                {getPhaseIcon(agentState.phase)}
                {getPhaseLabel()}
              </span>
              <span>{getProgressPercentage()}%</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-500 ease-out"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {conversationHistory.length === 0 && !isLoading && (
            <div className="text-center text-gray-400 py-8">
              <FiVolume2 className="w-8 h-8 mx-auto mb-2 animate-pulse" />
              <p>Starting conversation...</p>
            </div>
          )}
          
          {conversationHistory.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.role === "user"
                    ? "bg-orange-500 text-white rounded-br-none"
                    : "bg-white shadow-md text-gray-800 rounded-bl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white shadow-md rounded-2xl rounded-bl-none px-4 py-2.5">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Booking Summary (shown during confirmation phase) */}
        {agentState.phase === "confirmation" && agentState.bookingData.office && (
          <div className="px-4 py-3 bg-orange-50 border-t border-orange-100">
            <p className="text-xs text-orange-600 font-medium mb-1">Booking Summary:</p>
            <div className="text-xs text-gray-600 space-y-0.5">
              {agentState.recommendedCategory?.name && (
                <p>🚐 {agentState.recommendedCategory.name}</p>
              )}
              {agentState.bookingData.startDate && agentState.bookingData.endDate && (
                <p>📅 {agentState.bookingData.startDate} → {agentState.bookingData.endDate}</p>
              )}
              {agentState.bookingData.driverAge && (
                <p>👤 Driver age: {agentState.bookingData.driverAge}</p>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-center justify-center gap-4">
            {/* Status Text */}
            <div className="text-sm text-gray-500">
              {isRecording ? (
                <span className="text-red-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Recording...
                </span>
              ) : isProcessing ? (
                <span>Processing...</span>
              ) : isPlaying ? (
                <span className="flex items-center gap-1">
                  <FiVolume2 className="animate-pulse" />
                  Speaking...
                </span>
              ) : (
                <span>Tap to speak</span>
              )}
            </div>
            
            {/* Record Button */}
            <button
              onClick={toggleRecording}
              disabled={isPlaying || isProcessing || isLoading || agentState.phase === "complete"}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all transform hover:scale-105 ${
                isRecording
                  ? "bg-red-500 animate-pulse"
                  : agentState.phase === "complete"
                  ? "bg-green-500"
                  : "bg-orange-500 hover:bg-orange-600"
              } text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {agentState.phase === "complete" ? (
                <FiCheck className="w-6 h-6" />
              ) : (
                <FiMic className="w-6 h-6" />
              )}
            </button>
          </div>
          
          {/* Completion Message */}
          {agentState.phase === "complete" && (
            <div className="mt-4 text-center">
              <p className="text-green-600 font-medium">Booking Complete! 🎉</p>
              <p className="text-sm text-gray-500">Redirecting to your reservation...</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
