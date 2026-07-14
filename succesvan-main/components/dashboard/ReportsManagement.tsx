"use client";

import { useState, useEffect, useRef } from "react";
import {
  FiBarChart2,
  FiHome,
  FiClipboard,
  FiTruck,
  FiUsers,
  FiGift,
  FiMessageCircle,
  FiX,
  FiMic,
  FiSend,
  FiLoader,
  FiTrendingUp,
  FiChevronRight,
  FiVolume2,
  FiVolumeX,
} from "react-icons/fi";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import CategoryReport from "./reports/CategoryReport";
import OfficeReport from "./reports/OfficeReport";
import VehicleReservationReport from "./reports/VehicleReservationReport";
import ReservationReport from "./reports/ReservationReport";
import CustomerReport from "./reports/CustomerReport";
import AddOnReport from "./reports/AddOnReport";

interface Report {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const reports: Report[] = [
  {
    id: "categories",
    name: "Categories",
    description: "Revenue by category",
    icon: <FiBarChart2 size={18} />,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "offices",
    name: "Offices",
    description: "Branch performance",
    icon: <FiHome size={18} />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "reservations",
    name: "Reservations",
    description: "Booking trends",
    icon: <FiClipboard size={18} />,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: "vehicles",
    name: "Vehicles",
    description: "Fleet utilization",
    icon: <FiTruck size={18} />,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  {
    id: "customers",
    name: "Customers",
    description: "Customer insights",
    icon: <FiUsers size={18} />,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
  },
  {
    id: "addons",
    name: "Add-Ons",
    description: "Extra services",
    icon: <FiGift size={18} />,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
];

export default function ReportsManagement() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentReport = reports.find((r) => r.id === selectedReport);

  const { isRecording, toggleRecording } = useVoiceRecording({
    onTranscriptionComplete: async (result) => {
      setInputMessage(result.transcript);
      await handleSendMessage(result.transcript);
    },
    autoSubmit: false,
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (showAIModal && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content:
            "👋 Hello! I'm your AI Business Analyst. Ask me anything about sales, customers, vehicles, or trends — I'll analyze your data and give clear insights.",
        },
      ]);
    }
  }, [showAIModal, messages.length]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputMessage.trim();
    if (!text || isLoading) return;

    const newMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(newMessages);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/business-analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, conversationHistory }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.data.message },
        ]);
        setConversationHistory(data.data.conversationHistory);
        await playAudioResponse(data.data.message);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudioResponse = async (text: string) => {
    try {
      setIsPlaying(true);
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("TTS failed");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) audioRef.current.pause();

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      await audio.play();
    } catch (error) {
      console.log("TTS Error:", error);
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Business Intelligence</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Analytics and insights for smarter decisions
          </p>
        </div>
        <button
          onClick={() => setShowAIModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg font-semibold text-sm transition-all shadow-lg shadow-[#fe9a00]/20"
        >
          <FiMessageCircle size={16} />
          <span>AI Analyst</span>
        </button>
      </div>

      {/* Report Tabs */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-1.5">
        <div className="flex flex-wrap gap-1">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedReport === report.id
                  ? "bg-[#fe9a00] text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className={selectedReport === report.id ? "text-white" : report.color}>
                {report.icon}
              </span>
              <span className="hidden sm:inline">{report.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Report Cards Grid - Alternative View */}
      {!selectedReport && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className="group bg-[#111827] border border-white/5 rounded-xl p-4 text-left hover:border-[#fe9a00]/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-lg ${report.bgColor}`}>
                  <span className={report.color}>{report.icon}</span>
                </div>
                <FiChevronRight className="text-gray-600 group-hover:text-[#fe9a00] transition-colors" size={16} />
              </div>
              <h3 className="text-white font-semibold mt-3 text-sm">{report.name}</h3>
              <p className="text-gray-500 text-xs mt-1">{report.description}</p>
            </button>
          ))}
        </div>
      )}

      {/* Selected Report Content */}
      {currentReport && (
        <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${currentReport.bgColor}`}>
                <span className={currentReport.color}>{currentReport.icon}</span>
              </div>
              <div>
                <h2 className="text-white font-bold">{currentReport.name} Report</h2>
                <p className="text-gray-500 text-xs">{currentReport.description}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedReport(null)}
              className="text-xs text-[#fe9a00] bg-white font-bold p-2 rounded-xl hover:text-[#fe9a00]/70 transition-colors"
            >
              ← Back
            </button>
          </div>

          <div className="p-5">
            {selectedReport === "categories" && <CategoryReport />}
            {selectedReport === "offices" && <OfficeReport />}
            {selectedReport === "vehicles" && <VehicleReservationReport />}
            {selectedReport === "reservations" && <ReservationReport />}
            {selectedReport === "customers" && <CustomerReport />}
            {selectedReport === "addons" && <AddOnReport />}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedReport && (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-12 text-center">
          <div className="max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <FiTrendingUp className="text-gray-500" size={24} />
            </div>
            <h3 className="text-white font-semibold mb-2">Select a Report</h3>
            <p className="text-gray-500 text-sm">
              Choose a report from above or use the AI Analyst for custom queries.
            </p>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-white/10">
            {/* Modal Header */}
            <div className="bg-[#fe9a00] px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                    <FiMessageCircle size={18} />
                  </div>
                  <div>
                    <h2 className="font-bold text-white">AI Business Analyst</h2>
                    <p className="text-orange-100 text-xs">Ask about your data</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAIModal(false);
                    stopAudio();
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex flex-col h-[60vh]">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-[#fe9a00] text-white"
                          : "bg-white/5 text-white border border-white/5"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Suggestions */}
              <div className="px-4 py-3 border-t border-white/5">
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    "Monthly revenue?",
                    "Top customers?",
                    "Popular vehicles?",
                    "Growth trend?",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInputMessage(q)}
                      disabled={isLoading || isRecording}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-xs transition-all disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Input Area */}
                <div className="flex gap-2">
                  <button
                    onClick={toggleRecording}
                    disabled={isLoading || isPlaying}
                    className={`p-3 rounded-lg transition-all  shrink-0 ${
                      isRecording
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-white/5 hover:bg-white/10 text-gray-400"
                    }`}
                  >
                    <FiMic size={18} />
                  </button>

                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && handleSendMessage()
                    }
                    placeholder="Ask about your business..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]/50 focus:ring-2 focus:ring-[#fe9a00]/20 transition-all"
                    disabled={isLoading || isRecording}
                  />

                  {isPlaying ? (
                    <button
                      onClick={stopAudio}
                      className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-all  shrink-0"
                    >
                      <FiVolumeX size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputMessage.trim() || isLoading || isRecording}
                      className="px-4 py-3 bg-[#fe9a00] hover:bg-[#e68a00] rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      {isLoading ? (
                        <FiLoader size={18} className="animate-spin" />
                      ) : (
                        <FiSend size={18} />
                      )}
                    </button>
                  )}
                </div>

                {/* Status Indicators */}
                {(isRecording || isPlaying) && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    {isRecording && (
                      <span className="flex items-center gap-1.5 text-xs text-red-400">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                        Recording...
                      </span>
                    )}
                    {isPlaying && (
                      <span className="flex items-center gap-1.5 text-xs text-[#fe9a00]">
                        <FiVolume2 size={12} className="animate-pulse" />
                        Playing response...
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}