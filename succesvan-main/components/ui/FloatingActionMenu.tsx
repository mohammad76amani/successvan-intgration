"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  FiPhone,
  FiX,
  FiSend,
  FiLoader,
  FiMessageCircle,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { BsRobot } from "react-icons/bs";
import { HiSparkles } from "react-icons/hi2";
import { usePathname } from "next/navigation";
import Image from "next/image";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHATBOT_DISMISSED_KEY = "chatbot_popup_dismissed";
const CHAT_HISTORY_KEY = "chatbot_messages";
const DEVICE_ID_KEY = "chatbot_device_id";

function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = "device_" + crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

function loadMessages(): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.log("Failed to load chat history:", e);
  }
  return [];
}

function saveMessages(messages: Message[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
  } catch (e) {
    console.log("Failed to save chat history:", e);
  }
}

export default function FloatingActionMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showSmallPopup, setShowSmallPopup] = useState(false);
  const [popupAnimated, setPopupAnimated] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const defaultMessage: Message = {
    role: "assistant",
    content:
      "Hi! I'm niki your Success Van Hire assistant. How can I help you today? I can answer questions about our vehicles, pricing, locations, or booking process!",
  };

  const [messages, setMessages] = useState<Message[]>([defaultMessage]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const menuItems = [
    {
      id: "gtm-ai-chat-floating",
      icon: BsRobot,
      color: "#fff",
      onClick: () => {
        setIsChatOpen(true);
        setIsOpen(false);
        setShowSmallPopup(false);
        setPopupAnimated(false);
      },
      label: "AI Assistant",
    },
    {
      id: "gtm-call-us-floating",
      icon: FiPhone,
      color: "#0891b2",
      href: "tel:+442030111198",
      label: "Call Us",
    },
    {
      id: "gtm-whatsapp-floating",
      icon: FaWhatsapp,
      color: "#25D366  ",
      href: "https://wa.me/442030111198",
      label: "WhatsApp",
    },
  ];

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if popup was dismissed
  const isDismissed = useCallback(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(CHATBOT_DISMISSED_KEY) === "true";
  }, []);

  // Handle scroll for small popup
  useEffect(() => {
    if (!isClient) return;

    const handleScroll = () => {
      // Don't show if dismissed or chat is open
      if (isDismissed() || isChatOpen) {
        setShowSmallPopup(false);
        setPopupAnimated(false);
        return;
      }

      // Show popup when scrolled 200px or more
      if (window.scrollY >= 200) {
        if (!showSmallPopup) {
          setShowSmallPopup(true);
          // Delay animation for smooth entrance
          setTimeout(() => {
            setPopupAnimated(true);
          }, 50);
        }
      } else {
        // Optional: hide when scrolling back up
        // setShowSmallPopup(false);
        // setPopupAnimated(false);
      }
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isClient, isChatOpen, isDismissed, showSmallPopup]);

  // Load device ID and chat history from localStorage on mount
  useEffect(() => {
    if (!isClient) return;
    const id = getOrCreateDeviceId();
    setDeviceId(id);

    const stored = loadMessages();
    if (stored.length > 0) {
      setMessages(stored);
    }
  }, [isClient]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (!isClient) return;
    // Only save if we have more than just the default message
    if (messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages, isClient]);

  // Reset popup state when pathname changes
  useEffect(() => {
    if (!isClient) return;

    setShowSmallPopup(false);
    setPopupAnimated(false);

    // Re-check after navigation
    const timer = setTimeout(() => {
      if (!isDismissed() && !isChatOpen && window.scrollY >= 200) {
        setShowSmallPopup(true);
        setTimeout(() => setPopupAnimated(true), 50);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname, isClient, isDismissed, isChatOpen]);

  // Hide small popup when chat is open
  useEffect(() => {
    if (isChatOpen) {
      setShowSmallPopup(false);
      setPopupAnimated(false);
    }
  }, [isChatOpen]);

  // Scroll to bottom of messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Lock background scroll when chat is open
  useEffect(() => {
    if (isChatOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isChatOpen]);

  const handleDismissPopup = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowSmallPopup(false);
    setPopupAnimated(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(CHATBOT_DISMISSED_KEY, "true");
    }
  };

  const handlePopupClick = () => {
    setShowSmallPopup(false);
    setPopupAnimated(false);
    setIsChatOpen(true);
    setIsOpen(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: userMessage,
          deviceId: deviceId,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (data.success && data.message) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error) {
      console.log("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I encountered an error. Please try again or contact us directly at 020 3011 1198.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (pathname === "/dashboard" || pathname === "/customerDashboard") {
    return null;
  }

  return (
    <>
      {/* Small Chatbot Popup - Responsive Design */}
      {isClient && showSmallPopup && !isChatOpen && (
        <div
          className={`fixed bottom-4 right-4    z-100 cursor-pointer transition-all duration-500 ease-out ${
            popupAnimated
              ? "translate-y-0 opacity-100 scale-100"
              : "translate-y-8 opacity-0 scale-95"
          }`}
          onClick={handlePopupClick}
        >
          {/* Main Container */}
          <div className="relative group">
            {/* Mobile Design */}
            <div className="sm:hidden relative flex flex-col gap-3 p-4 bg-linear-to-br from-white via-white/98 to-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/70 w-72 hover:shadow-[0_20px_50px_rgba(254,154,0,0.2)] transition-all duration-500">
              {/* Close Button */}
              <button
                onClick={handleDismissPopup}
                className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-white hover:bg-red-50 rounded-full flex items-center justify-center shadow-lg border border-gray-200 hover:border-red-300 z-20 transition-all"
              >
                <FiX className="w-3 h-3 text-gray-600 hover:text-red-500" />
              </button>

              {/* Avatar Section - Mobile */}
              <div className="relative flex justify-center">
                <div className="relative w-16 h-16 rounded-full bg-linear-to-br from-[#fe9a00] via-[#ff8800] to-[#ff6b00] p-0.5 shadow-lg">
                  <div className="absolute -inset-2 bg-linear-to-r from-[#fe9a00]/30 to-[#ff6b00]/30 rounded-full blur-md" />
                  <div className="relative w-full h-full rounded-full bg-white overflow-hidden">
                    <Image
                      src="/assets/images/bot.jpeg"
                      alt="Niki Assistant"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Text Content - Mobile */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-1">
                  <HiSparkles className="w-3.5 h-3.5 text-[#fe9a00] animate-pulse" />
                  <span className="text-[11px] font-bold text-[#fe9a00] uppercase tracking-wide">
                    I'm Niki
                  </span>
                </div>
                <p className="text-gray-800 text-sm font-semibold">
                  Hi! Need help?
                </p>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Ask me about vans, pricing, locations, or make a booking!
                </p>
              </div>

              {/* Quick Features - Mobile */}
              <div className="flex gap-2 justify-center flex-wrap">
                <span className="px-2.5 py-1 bg-[#fe9a00]/10 border border-[#fe9a00]/30 rounded-full text-[10px] font-semibold text-gray-700">
                  🚐 Vans
                </span>
                <span className="px-2.5 py-1 bg-[#fe9a00]/10 border border-[#fe9a00]/30 rounded-full text-[10px] font-semibold text-gray-700">
                  💰 Pricing
                </span>
                <span className="px-2.5 py-1 bg-[#fe9a00]/10 border border-[#fe9a00]/30 rounded-full text-[10px] font-semibold text-gray-700">
                  📍 Locations
                </span>
              </div>

              {/* CTA Button - Mobile */}
              <button
                onClick={handlePopupClick}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-linear-to-r from-[#fe9a00] to-[#ff8800] rounded-lg shadow-lg hover:shadow-xl transition-all font-bold text-white text-sm active:scale-95"
              >
                <FiMessageCircle className="w-4 h-4" />
                Chat Now
              </button>

              {/* Status - Mobile */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-600">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span>Online • 30s response</span>
              </div>
            </div>

            {/* Desktop Design */}
            <div className="hidden sm:flex sm:flex-col gap-4 p-5 lg:p-6 bg-white backdrop-blur-lg rounded-3xl shadow-2xl border border-white/60 hover:shadow-[0_20px_60px_rgba(254,154,0,0.3)] transition-all duration-500 hover:scale-[1.02] w-80 lg:w-96">
              {/* Close Button - Desktop */}
              <button
                onClick={handleDismissPopup}
                className="absolute -top-2 -right-2 w-7 h-7 bg-white hover:bg-red-50 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border border-gray-200 hover:border-red-300 hover:rotate-90 z-20"
              >
                <FiX className="w-3.5 h-3.5 text-gray-500 hover:text-red-500 transition-colors" />
              </button>

              {/* Top Section: Avatar + Text - Desktop */}
              <div className="flex items-start gap-4">
                {/* Avatar - Desktop */}
                <div className="relative shrink-0">
                  <div className="absolute -inset-2 bg-linear-to-r from-[#fe9a00] to-[#ff6b00] rounded-full opacity-50 animate-pulse blur-sm" />
                  <div className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-linear-to-br from-[#fe9a00] via-[#ff8800] to-[#ff6b00] p-1 shadow-xl">
                    <div className="w-full h-full rounded-full bg-white overflow-hidden">
                      <Image
                        src="/assets/images/bot.jpeg"
                        alt="Niki Assistant"
                        width={96}
                        height={96}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-emerald-500 rounded-full border-[3px] border-white shadow-lg flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                    </div>
                  </div>
                </div>

                {/* Text - Desktop */}
                <div className="flex flex-col gap-2 flex-1 pt-1">
                  <div className="flex items-center gap-1.5">
                    <HiSparkles className="w-4 h-4 text-[#fe9a00] animate-pulse shrink-0" />
                    <span className="text-xs font-bold text-[#fe9a00] uppercase tracking-wider">
                      I'm Niki
                    </span>
                  </div>
                  <p className="text-gray-800 text-base font-semibold leading-snug">
                    Hi! Need help? 👋
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    I'm your Success Van Hire AI assistant. Ask me anything
                    about our vans, pricing, or bookings!
                  </p>
                </div>
              </div>

              {/* Divider - Desktop */}
              <div className="h-px bg-linear-to-r from-[#fe9a00]/20 via-[#fe9a00]/50 to-[#fe9a00]/20" />

              {/* Bottom Section: Features - Desktop */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  What I can help with:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-[#fe9a00]/5 border border-[#fe9a00]/20 hover:border-[#fe9a00]/40 transition-colors hover:bg-[#fe9a00]/10">
                    <div className="w-2 h-2 bg-[#fe9a00] rounded-full" />
                    <span className="text-xs text-gray-700 font-medium">
                      Van Details
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-[#fe9a00]/5 border border-[#fe9a00]/20 hover:border-[#fe9a00]/40 transition-colors hover:bg-[#fe9a00]/10">
                    <div className="w-2 h-2 bg-[#fe9a00] rounded-full" />
                    <span className="text-xs text-gray-700 font-medium">
                      Pricing
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-[#fe9a00]/5 border border-[#fe9a00]/20 hover:border-[#fe9a00]/40 transition-colors hover:bg-[#fe9a00]/10">
                    <div className="w-2 h-2 bg-[#fe9a00] rounded-full" />
                    <span className="text-xs text-gray-700 font-medium">
                      Locations
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-[#fe9a00]/5 border border-[#fe9a00]/20 hover:border-[#fe9a00]/40 transition-colors hover:bg-[#fe9a00]/10">
                    <div className="w-2 h-2 bg-[#fe9a00] rounded-full" />
                    <span className="text-xs text-gray-700 font-medium">
                      Bookings
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA Button - Desktop */}
              <button
                onClick={handlePopupClick}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-[#fe9a00] to-[#ff8800] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold text-white"
              >
                <FiMessageCircle className="w-4 h-4" />
                <span>Start Chat Now</span>
              </button>

              {/* Status Info - Desktop */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span>Online • Average response 30s</span>
              </div>
            </div>

            {/* Floating Particles */}
            <div className="absolute -top-4 left-10 w-2 h-2 bg-[#fe9a00] rounded-full opacity-60 animate-bounce hidden sm:block" />
            <div
              className="absolute -bottom-3 right-20 w-1.5 h-1.5 bg-[#ff6b00] rounded-full opacity-70 animate-bounce hidden sm:block"
              style={{ animationDelay: "0.2s" }}
            />
            <div
              className="absolute top-1/2 -left-3 w-1.5 h-1.5 bg-[#fe9a00] rounded-full opacity-50 animate-bounce hidden sm:block"
              style={{ animationDelay: "0.4s" }}
            />
          </div>

          {/* Speech Bubble Tail - Desktop */}
          <div className="absolute -bottom-2 right-12 w-5 h-5 overflow-hidden hidden sm:block">
            <div className="absolute w-5 h-5 bg-white/90 backdrop-blur-xl border-r border-b border-white/60 transform rotate-45 -translate-y-2.5 shadow-lg" />
          </div>
        </div>
      )}

      {/* Backdrop for Floating Menu */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Menu */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col items-end gap-4">
          {/* Menu Items */}
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isVisible = isOpen;

            return (
              <div
                key={item.id}
                className={`relative flex items-center transition-all duration-500 ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0 pointer-events-none"
                }`}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                {item.onClick ? (
                  <button
                    id={item.id}
                    onClick={item.onClick}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    aria-label={item.label}
                    className="group relative w-12 h-12 bg-[#860a89] rounded-2xl flex items-center justify-center 
                               shadow-2xl transition-all duration-300 hover:scale-110 
                               hover:shadow-[0_0_30px_rgba(254,154,0,0.4)]"
                  >
                    <Icon className="w-7 h-7 text-white drop-shadow-md" />
                    <span
                      className="absolute inset-0 rounded-2xl bg-white opacity-0 
                                     group-hover:opacity-20 group-hover:scale-150 
                                     transition-all duration-700"
                    />
                  </button>
                ) : (
                  <a
                    href={item.href}
                    id={item.id}
                    target={item.id === "whatsapp" ? "_blank" : undefined}
                    rel={
                      item.id === "whatsapp" ? "noopener noreferrer" : undefined
                    }
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    aria-label={item.label}
                    className={`group relative w-12 h-12 ${
                      item.id === "gtm-whatsapp-floating"
                        ? "bg-[#25D366]"
                        : "bg-[#0891b2]"
                    } rounded-2xl flex items-center justify-center 
                               shadow-2xl transition-all duration-300 hover:scale-110 
                               hover:shadow-[0_0_30px_rgba(254,154,0,0.4)]`}
                  >
                    <Icon className="w-7 h-7 text-white drop-shadow-md" />
                    <span
                      className="absolute inset-0 rounded-2xl bg-white opacity-0 
                                     group-hover:opacity-20 group-hover:scale-150 
                                     transition-all duration-700"
                    />
                  </a>
                )}

                {/* Tooltip */}
                {hoveredItem === item.id && (
                  <div
                    className="absolute right-full mr-4 px-4 py-2 bg-black/80 backdrop-blur-md 
                               text-white text-sm font-medium rounded-xl shadow-xl 
                               whitespace-nowrap pointer-events-none"
                  >
                    {item.label}
                    <div
                      className="absolute left-full top-1/2 -translate-y-1/2 
                                    w-0 h-0 border-8 border-transparent 
                                    border-l-black/80"
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Main Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            className="group relative w-12 h-12 bg-[#fe9a00] rounded-2xl flex items-center justify-center 
                       shadow-2xl transition-all duration-500 hover:scale-110 
                       hover:shadow-[0_0_40px_rgba(254,154,0,0.6)]"
          >
            <div
              className={`absolute transition-all duration-500 ${
                isOpen
                  ? "scale-0 rotate-180 opacity-0"
                  : "scale-100 rotate-0 opacity-100"
              }`}
            >
              <FiPhone className="w-6 h-6 text-white drop-shadow-lg" />
            </div>
            <div
              className={`absolute transition-all duration-500 ${
                isOpen
                  ? "scale-100 rotate-0 opacity-100"
                  : "scale-0 -rotate-180 opacity-0"
              }`}
            >
              <FiX className="w-6 h-6 text-white drop-shadow-lg" />
            </div>

            <span
              className="absolute inset-0 rounded-2xl bg-white opacity-0 
                             group-hover:opacity-30 group-hover:scale-150 
                             transition-all duration-700 blur-xl"
            />
          </button>
        </div>
      </div>

      {/* AI Chat Modal */}
      {isChatOpen && (
        <>
          {/* Backdrop with blur */}
          <div
            className="fixed inset-0 z-9999 bg-black/60"
            onClick={() => setIsChatOpen(false)}
          />

          {/* Chat Window */}
          <div className="fixed inset-0 z-10000 flex items-center justify-center p-3 sm:p-4 md:p-6">
            {/* Main Container with Glow Effect */}
            <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl h-[90vh] sm:h-[85vh] max-h-175">
              {/* Animated Glow Background */}

              {/* Glass Card */}
              <div className="relative h-full flex flex-col bg-white/10 backdrop-blur-2xl rounded-[28px] shadow-[0_32px_64px_rgba(0,0,0,0.4)] border border-white/20 overflow-hidden">
                {/* Decorative Top linear */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-[#fe9a00]/10 to-transparent pointer-events-none" />

                {/* Header */}
                <div className="relative z-10 border-b border-white/10 p-4 sm:p-5">
                  {/* Glass Header Background */}
                  <div className="absolute inset-0 bg-linear-to-r from-white/5 to-white/10 backdrop-blur-md" />

                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Avatar with Glow Ring */}
                      <div className="relative">
                        {/* Pulsing Glow */}
                        <div className="absolute -inset-1.5 bg-linear-to-r from-[#fe9a00] to-[#ff6b00] rounded-full opacity-50 blur-md animate-pulse" />

                        {/* Avatar Container */}
                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-linear-to-br from-[#fe9a00] via-[#ff8800] to-[#ff6b00] p-0.5 shadow-xl">
                          <div className="w-full h-full rounded-full bg-white/90 overflow-hidden">
                            <Image
                              src="/assets/images/bot.jpeg"
                              alt="AI Assistant"
                              width={56}
                              height={56}
                              className="w-full h-full object-cover rounded-full"
                            />
                          </div>

                          {/* Online Status */}
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 rounded-full border-[3px] border-slate-900 shadow-lg flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-bold text-base sm:text-lg">
                            I'm Niki
                          </h3>
                          <HiSparkles className="w-4 h-4 text-[#fe9a00] animate-pulse" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                          <p className="text-emerald-400 text-xs sm:text-sm font-medium">
                            Online
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Close Button */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const fresh = [defaultMessage];
                          setMessages(fresh);
                          saveMessages(fresh);
                        }}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-400/30 transition-all duration-300 text-gray-300 hover:text-red-300 text-xs font-medium"
                        title="Clear chat history"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => setIsChatOpen(false)}
                        className="p-2.5 sm:p-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 transition-all duration-300 text-gray-200 hover:text-white hover:rotate-90"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {/* Decorative Background Pattern */}
                  <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="absolute top-20 left-10 w-32 h-32 bg-[#fe9a00] rounded-full blur-3xl" />
                    <div className="absolute bottom-40 right-10 w-40 h-40 bg-[#ff6b00] rounded-full blur-3xl" />
                  </div>

                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`relative flex items-end gap-2 sm:gap-3 ${
                        message.role === "user"
                          ? "flex-row-reverse"
                          : "flex-row"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl shrink-0 flex items-center justify-center shadow-lg ${
                          message.role === "user"
                            ? "bg-linear-to-br from-[#fe9a00] to-[#ff8800]"
                            : "bg-linear-to-br from-slate-600 to-slate-700 border border-white/10"
                        }`}
                      >
                        {message.role === "user" ? (
                          <span className="text-white font-bold text-xs">
                            U
                          </span>
                        ) : (
                          <div className="w-full h-full rounded-full bg-white/90 overflow-hidden">
                            <Image
                              src="/assets/images/bot.jpeg"
                              alt="AI Assistant"
                              width={56}
                              height={56}
                              className="w-full h-full object-cover rounded-full"
                            />
                          </div>
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={`relative max-w-[80%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-lg ${
                          message.role === "user"
                            ? "bg-linear-to-r from-[#fe9a00] to-[#ff8800] text-white rounded-br-sm"
                            : "bg-white/10 backdrop-blur-md text-gray-100 border border-white/10 rounded-bl-sm"
                        }`}
                      >
                        {/* Glass Shine Effect for Assistant Messages */}
                        {message.role === "assistant" && (
                          <div className="absolute inset-0 rounded-2xl rounded-bl-sm bg-linear-to-br from-white/10 to-transparent pointer-events-none" />
                        )}

                        <p className="relative text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>

                        {/* Timestamp (optional) */}
                        <span
                          className={`block text-[10px] mt-1.5 ${
                            message.role === "user"
                              ? "text-white/60"
                              : "text-gray-400"
                          }`}
                        >
                          Just now
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isLoading && (
                    <div className="flex items-end gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-linear-to-br from-slate-600 to-slate-700 border border-white/10 flex items-center justify-center shadow-lg">
                        <div className="w-full h-full rounded-full bg-white/90 overflow-hidden">
                          <Image
                            src="/assets/images/bot.jpeg"
                            alt="AI Assistant"
                            width={56}
                            height={56}
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>{" "}
                      </div>
                      <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl rounded-bl-sm px-5 py-4 shadow-lg">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="relative z-10 p-4 sm:p-5">
                  {/* Glass Background */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent backdrop-blur-md" />

                  {/* Quick Actions (Optional) */}
                  <div className="relative flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                    {["Pricing", "Locations", "Book a Van", "Contact"].map(
                      (action) => (
                        <button
                          key={action}
                          onClick={() => setInputMessage(action)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-[#fe9a00]/50 rounded-full text-xs text-gray-300 hover:text-white transition-all duration-300 whitespace-nowrap"
                        >
                          {action}
                        </button>
                      ),
                    )}
                  </div>

                  {/* Input Container */}
                  <div className="relative">
                    {/* Input Glow on Focus */}
                    <div className="absolute -inset-0.5 bg-linear-to-r from-[#fe9a00] to-[#ff6b00] rounded-2xl opacity-0 blur-sm transition-opacity duration-300 focus-within:opacity-50" />

                    <div className="relative flex items-center gap-2 sm:gap-3 bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 focus-within:border-[#fe9a00]/50 focus-within:bg-white/10 transition-all duration-300">
                      {/* Input Field */}
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="flex-1 bg-transparent text-white text-sm sm:text-base placeholder-gray-400 outline-none font-medium min-w-0"
                      />

                      {/* Send Button */}
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className="relative p-2.5 sm:p-3 rounded-xl bg-linear-to-r from-[#fe9a00] to-[#ff8800] hover:from-[#ff8800] hover:to-[#fe9a00] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(254,154,0,0.4)] transform hover:scale-105 active:scale-95 shrink-0 group"
                      >
                        {/* Button Glow */}
                        <div className="absolute inset-0 rounded-xl bg-linear-to-r from-[#fe9a00] to-[#ff6b00] opacity-0 group-hover:opacity-50 blur-md transition-opacity duration-300" />

                        {isLoading ? (
                          <FiLoader className="relative w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin" />
                        ) : (
                          <FiSend className="relative w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Decorative Corner Elements */}
                <div className="absolute top-4 right-16 w-20 h-20 bg-[#fe9a00]/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-20 left-4 w-16 h-16 bg-[#ff6b00]/10 rounded-full blur-2xl pointer-events-none" />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
