"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiX, FiMic, FiVolume2, FiMessageCircle } from "react-icons/fi";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { useConversationalVoice } from "@/hooks/useConversationalVoice";
import { showToast } from "@/lib/toast";

interface ConversationalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
  offices: Array<{ _id?: string; name?: string }>;
  types: Array<{ _id?: string; name?: string }>;
}

export default function ConversationalModal({
  isOpen,
  onClose,
  onComplete,
  offices,
  types,
}: ConversationalModalProps) {
  const [mounted, setMounted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const {
    isPlaying,
    conversationHistory,
    currentData,
    sendMessage,
    resetConversation,
    stopAudio,
  } = useConversationalVoice();

  const { isRecording, isProcessing, toggleRecording } = useVoiceRecording({
    onTranscriptionComplete: async (result) => {
      console.log("🎤 [Conversational Modal] User said:", result.transcript);

      // Send the transcript to the AI for conversation
      const response = await sendMessage(result.transcript);

      if (response) {
        console.log("📋 [Conversational Modal] Response data:", response.data);
        console.log(
          "🎯 [Conversational Modal] Is complete:",
          response.isComplete
        );
        console.log(
          "🔍 [Conversational Modal] Missing:",
          response.missingFields
        );

        // Only complete if all required fields are filled AND user confirmed
        const requiredFields = [
          "office",
          "category",
          "pickupDate",
          "returnDate",
          "driverAge",
        ];
        const allFieldsFilled = requiredFields.every(
          (field) => response.data[field]
        );

        console.log(
          "✅ [Conversational Modal] All fields filled:",
          allFieldsFilled
        );

        // Check if user said "yes", "correct", "confirm" etc in their last message
        const transcript = result.transcript.toLowerCase();
        const isConfirmation =
          transcript.includes("yes") ||
          transcript.includes("correct") ||
          transcript.includes("confirm") ||
          transcript.includes("yeah") ||
          transcript.includes("yep") ||
          transcript.includes("that's right");

        if (
          allFieldsFilled &&
          isConfirmation &&
          response.action === "confirm"
        ) {
          console.log("✅ [Conversational Modal] Conversation complete!");
          // Wait for the AI to finish speaking the confirmation
          setTimeout(() => {
            onComplete(response.data);
          }, 2000);
        }
      }
    },
    autoSubmit: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationHistory]);

  // Start conversation when modal opens
  useEffect(() => {
    if (isOpen && !hasStarted && mounted) {
      setHasStarted(true);
      // Send initial greeting - user hasn't said anything yet, just opened modal
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

  const getOfficeName = (id: string) => {
    return offices.find((o) => o._id === id)?.name || id;
  };

  const getCategoryName = (id: string) => {
    return types.find((c) => c._id === id)?.name || id;
  };

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-9998 animate-fadeIn"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full border border-amber-500/30 pointer-events-auto animate-scaleIn flex flex-col max-h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/20 p-3 rounded-full">
                <FiMessageCircle className="text-2xl text-amber-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Voice Assistant
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Talk with our AI to complete your booking
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <FiX className="text-2xl" />
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-75">
            {conversationHistory.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    message.role === "user"
                      ? "bg-amber-500 text-white"
                      : "bg-slate-700 text-gray-100"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.role === "assistant" && (
                      <FiVolume2 className="text-amber-400 mt-1  shrink-0" />
                    )}
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Processing indicator */}
            {(isProcessing || isPlaying) && (
              <div className="flex justify-start">
                <div className="bg-slate-700 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    {isPlaying ? (
                      <>
                        <FiVolume2 className="text-amber-400 animate-pulse" />
                        <span className="text-gray-300 text-sm">
                          Speaking...
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" />
                          <div
                            className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          />
                          <div
                            className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          />
                        </div>
                        <span className="text-gray-300 text-sm">
                          Thinking...
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Current Reservation Data Preview */}
          {Object.keys(currentData).length > 0 && (
            <div className="px-6 pb-4">
              <div className="bg-slate-700/50 rounded-xl p-4 border border-amber-500/20">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <FiMessageCircle className="text-amber-400" />
                  Current Booking Details
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {currentData.office && (
                    <div>
                      <span className="text-gray-400">Office:</span>{" "}
                      <span className="text-white">
                        {getOfficeName(currentData.office)}
                      </span>
                    </div>
                  )}
                  {currentData.category && (
                    <div>
                      <span className="text-gray-400">Category:</span>{" "}
                      <span className="text-white">
                        {getCategoryName(currentData.category)}
                      </span>
                    </div>
                  )}
                  {currentData.pickupDate && (
                    <div>
                      <span className="text-gray-400">Pickup:</span>{" "}
                      <span className="text-white">
                        {currentData.pickupDate}
                      </span>
                    </div>
                  )}
                  {currentData.returnDate && (
                    <div>
                      <span className="text-gray-400">Return:</span>{" "}
                      <span className="text-white">
                        {currentData.returnDate}
                      </span>
                    </div>
                  )}
                  {currentData.pickupTime && (
                    <div>
                      <span className="text-gray-400">Pickup Time:</span>{" "}
                      <span className="text-white">
                        {currentData.pickupTime}
                      </span>
                    </div>
                  )}
                  {currentData.returnTime && (
                    <div>
                      <span className="text-gray-400">Return Time:</span>{" "}
                      <span className="text-white">
                        {currentData.returnTime}
                      </span>
                    </div>
                  )}
                  {currentData.driverAge && (
                    <div>
                      <span className="text-gray-400">Driver Age:</span>{" "}
                      <span className="text-white">
                        {currentData.driverAge}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Voice Input Button */}
          <div className="p-6 border-t border-white/10">
            <button
              onClick={toggleRecording}
              disabled={isProcessing || isPlaying}
              className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                  : isProcessing || isPlaying
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20"
              }`}
            >
              <FiMic className="text-2xl" />
              {isRecording
                ? "Stop Recording"
                : isProcessing
                ? "Processing..."
                : isPlaying
                ? "AI is Speaking..."
                : "Hold to Speak"}
            </button>
            <p className="text-center text-gray-400 text-sm mt-2">
              {isPlaying
                ? "Listen to the AI's response"
                : "Click the button and speak your answer"}
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
