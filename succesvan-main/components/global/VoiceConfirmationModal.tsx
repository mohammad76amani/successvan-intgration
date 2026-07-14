"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiX, FiCheck, FiAlertCircle, FiMic, FiMail } from "react-icons/fi";
import { FaGoogle, FaApple } from "react-icons/fa";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

interface VoiceConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  extractedData: {
    transcript: string;
    data: any;
    missingFields: string[];
  };
  offices: Array<{ _id?: string; name?: string }>;
  types: Array<{ _id?: string; name?: string }>;
}

export default function VoiceConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  extractedData,
  offices,
  types,
}: VoiceConfirmationModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState(extractedData.data);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"review" | "signup">("review");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waitingForVoiceConfirmation, setWaitingForVoiceConfirmation] =
    useState(false);

  // Voice confirmation hook
  const { isRecording, isProcessing, toggleRecording } = useVoiceRecording({
    onTranscriptionComplete: async (result) => {
      console.log("🎤 [Modal] Voice confirmation received:", result.transcript);

      const transcript = result.transcript.toLowerCase();

      // Check if user said "ok", "yes", "confirm", etc.
      if (
        transcript.includes("ok") ||
        transcript.includes("yes") ||
        transcript.includes("confirm") ||
        transcript.includes("correct") ||
        transcript.includes("yeah")
      ) {
        console.log("✅ [Modal] User confirmed via voice");
        setWaitingForVoiceConfirmation(false);
        await handleConfirm();
      } else if (
        transcript.includes("no") ||
        transcript.includes("cancel") ||
        transcript.includes("wrong") ||
        transcript.includes("incorrect")
      ) {
        console.log("❌ [Modal] User cancelled via voice");
        setWaitingForVoiceConfirmation(false);
        showToast.error("Cancelled. Please update the information.");
      } else {
        console.log("❓ [Modal] Voice input unclear, please say 'ok' or 'no'");
        showToast.error("Please say 'OK' to confirm or 'No' to cancel");
        setWaitingForVoiceConfirmation(false);
      }
    },
    autoSubmit: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleConfirm = async () => {
    console.log("✅ [Modal] User confirmed voice data:", formData);

    // Check for required fields
    const requiredFields = [
      "office",
      "category",
      "pickupDate",
      "returnDate",
      "driverAge",
    ];
    const missing = requiredFields.filter((field) => !formData[field]);

    if (missing.length > 0) {
      showToast.error(`Please fill in: ${missing.join(", ")}`);
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      console.log("✅ [Modal] User is logged in, creating reservation...");
      await createReservation(JSON.parse(user));
    } else {
      console.log("⚠️ [Modal] User not logged in, showing signup");
      setStep("signup");
    }
  };

  const createReservation = async (user?: any) => {
    setIsSubmitting(true);
    console.log("🚀 [Modal] Creating reservation...");
    console.log("👤 [Modal] User object:", user);

    try {
      // Prepare reservation data
      const reservationData = {
        userId: user?._id,
        office: formData.office,
        category: formData.category,
        pickupDate: formData.pickupDate,
        returnDate: formData.returnDate,
        pickupTime: formData.pickupTime || "10:00",
        returnTime: formData.returnTime || "10:00",
        driverAge: formData.driverAge,
        message: formData.message || "",
        email: user?.emaildata?.emailAddress || email,
        name: user?.name || "Guest",
        phoneNumber: user?.phoneData?.phoneNumber || "",
      };

      console.log(
        "📤 [Modal] Sending reservation data:",
        JSON.stringify(reservationData, null, 2)
      );
      console.log("🔑 [Modal] Has user token:", !!user);
      console.log("📧 [Modal] Email:", reservationData.email);

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user && {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }),
        },
        body: JSON.stringify(reservationData),
      });

      console.log("📡 [Modal] Response status:", response.status);
      console.log("📡 [Modal] Response ok:", response.ok);

      let data;
      try {
        data = await response.json();
        console.log("📥 [Modal] Response data:", JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.log("❌ [Modal] Failed to parse response JSON:", parseError);
        throw new Error("Server returned invalid response");
      }

      if (response.ok) {
        console.log("✅ [Modal] Reservation created successfully!");
        console.log("📋 [Modal] Reservation ID:", data.data?._id || data._id);
        showToast.success("Reservation created successfully!");

        // Store in session for confirmation page
        const reservationToStore = data.data || data;
        console.log("💾 [Modal] Storing in session:", reservationToStore);
        sessionStorage.setItem(
          "lastReservation",
          JSON.stringify(reservationToStore)
        );

        if (user) {
          // Redirect to customer dashboard
          console.log("🔀 [Modal] Redirecting to dashboard");
          router.push("/customerDashboard");
        } else {
          // Redirect to confirmation page
          console.log("🔀 [Modal] Redirecting to confirmation");
          router.push("/reservation/confirmation");
        }

        onClose();
      } else {
        console.log("❌ [Modal] Server returned error:", data);
        throw new Error(
          data.error || data.message || "Failed to create reservation"
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.log("❌ [Modal] Error creating reservation:", error);
      showToast.error(message || "Failed to create reservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupAndReserve = async () => {
    if (!email || !email.includes("@")) {
      showToast.error("Please enter a valid email");
      return;
    }

    setIsSubmitting(true);
    console.log("📧 [Modal] Creating user and reservation with email:", email);

    try {
      // First, create or get user by email
      console.log("👤 [Modal] Creating/getting user...");
      const userResponse = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          name: "Guest", // Can be updated later
          isGuest: true,
        }),
      });

      const userData = await userResponse.json();
      console.log("📥 [Modal] User response:", userData);

      if (!userResponse.ok) {
        throw new Error(userData.error || "Failed to create user");
      }

      // Then create reservation with the user
      await createReservation(userData.user || userData.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.log("❌ [Modal] Signup error:", error);
      showToast.error(message || "Failed to create account");
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    console.log("🔐 [Modal] Initiating Google login...");
    setIsSubmitting(true);

    try {
      // Store reservation data before redirect
      sessionStorage.setItem("pendingReservation", JSON.stringify(formData));

      // Redirect to Google OAuth
      window.location.href = "/api/auth/google?redirect=/reservation/complete";
    } catch (error) {
      console.log("❌ [Modal] Google login error:", error);
      showToast.error("Failed to initiate Google login");
      setIsSubmitting(false);
    }
  };

  const handleAppleLogin = async () => {
    console.log("🍎 [Modal] Initiating Apple login...");
    setIsSubmitting(true);

    try {
      // Store reservation data before redirect
      sessionStorage.setItem("pendingReservation", JSON.stringify(formData));

      // Redirect to Apple OAuth
      window.location.href = "/api/auth/apple?redirect=/reservation/complete";
    } catch (error) {
      console.log("❌ [Modal] Apple login error:", error);
      showToast.error("Failed to initiate Apple login");
      setIsSubmitting(false);
    }
  };

  const getOfficeName = (id: string) => {
    return offices.find((o) => o._id === id)?.name || "Unknown";
  };

  const getCategoryName = (id: string) => {
    return types.find((c) => c._id === id)?.name || "Unknown";
  };

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-9998 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-amber-500/30 pointer-events-auto animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {step === "review" && "🎤 Voice Input Detected"}
                {step === "signup" && "📧 Complete Your Booking"}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {step === "review" &&
                  "Review and confirm the extracted information"}
                {step === "signup" &&
                  "Enter your email to receive booking confirmation"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <FiX className="text-2xl" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {step === "review" && (
              <>
                {/* What You Said */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-sm font-semibold text-amber-400 mb-2">
                    📝 What You Said:
                  </h3>
                  <p className="text-white italic">
                    "{extractedData.transcript}"
                  </p>
                </div>

                {/* Extracted Information */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Extracted Information:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Office */}
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">
                        Office
                      </label>
                      {formData.office ? (
                        <div className="flex items-center gap-2">
                          <FiCheck className="text-green-400" />
                          <span className="text-white">
                            {getOfficeName(formData.office)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FiAlertCircle className="text-red-400" />
                          <select
                            value={formData.office || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                office: e.target.value,
                              })
                            }
                            className="flex-1 bg-white/10 border border-red-400/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                          >
                            <option value="">Select Office</option>
                            {offices.map((o) => (
                              <option key={o._id} value={o._id}>
                                {o.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Category */}
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">
                        Category
                      </label>
                      {formData.category ? (
                        <div className="flex items-center gap-2">
                          <FiCheck className="text-green-400" />
                          <span className="text-white">
                            {getCategoryName(formData.category)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FiAlertCircle className="text-red-400" />
                          <select
                            value={formData.category || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                category: e.target.value,
                              })
                            }
                            className="flex-1 bg-white/10 border border-red-400/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                          >
                            <option value="">Select type</option>
                            {types.map((c) => (
                              <option key={c._id} value={c._id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Pickup Date */}
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">
                        Pickup Date
                      </label>
                      {formData.pickupDate ? (
                        <div className="flex items-center gap-2">
                          <FiCheck className="text-green-400" />
                          <span className="text-white">
                            {new Date(formData.pickupDate).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FiAlertCircle className="text-red-400" />
                          <input
                            type="date"
                            value={formData.pickupDate || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                pickupDate: e.target.value,
                              })
                            }
                            className="flex-1 bg-white/10 border border-red-400/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      )}
                    </div>

                    {/* Return Date */}
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">
                        Return Date
                      </label>
                      {formData.returnDate ? (
                        <div className="flex items-center gap-2">
                          <FiCheck className="text-green-400" />
                          <span className="text-white">
                            {new Date(formData.returnDate).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FiAlertCircle className="text-red-400" />
                          <input
                            type="date"
                            value={formData.returnDate || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                returnDate: e.target.value,
                              })
                            }
                            className="flex-1 bg-white/10 border border-red-400/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      )}
                    </div>

                    {/* Pickup Time */}
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">
                        Pickup Time
                      </label>
                      {formData.pickupTime ? (
                        <div className="flex items-center gap-2">
                          <FiCheck className="text-green-400" />
                          <span className="text-white">
                            {formData.pickupTime}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FiAlertCircle className="text-red-400" />
                          <input
                            type="time"
                            value={formData.pickupTime || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                pickupTime: e.target.value,
                              })
                            }
                            className="flex-1 bg-white/10 border border-red-400/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      )}
                    </div>

                    {/* Return Time */}
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">
                        Return Time
                      </label>
                      {formData.returnTime ? (
                        <div className="flex items-center gap-2">
                          <FiCheck className="text-green-400" />
                          <span className="text-white">
                            {formData.returnTime}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FiAlertCircle className="text-red-400" />
                          <input
                            type="time"
                            value={formData.returnTime || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                returnTime: e.target.value,
                              })
                            }
                            className="flex-1 bg-white/10 border border-red-400/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      )}
                    </div>

                    {/* Driver Age */}
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">
                        Driver Age
                      </label>
                      {formData.driverAge ? (
                        <div className="flex items-center gap-2">
                          <FiCheck className="text-green-400" />
                          <span className="text-white">
                            {formData.driverAge}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FiAlertCircle className="text-red-400" />
                          <input
                            type="number"
                            value={formData.driverAge || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                driverAge: e.target.value,
                              })
                            }
                         placeholder="23-80"
            min="23"
            max="80"
                            className="flex-1 bg-white/10 border border-red-400/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                           />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Missing Fields Alert */}
                {extractedData.missingFields.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <FiAlertCircle className="text-red-400 mt-0.5" />
                      <div>
                        <h4 className="text-red-400 font-semibold text-sm">
                          Missing Information
                        </h4>
                        <p className="text-gray-300 text-sm mt-1">
                          Please fill in:{" "}
                          {extractedData.missingFields.join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Voice Confirmation Prompt */}
                {waitingForVoiceConfirmation && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <FiMic className="text-amber-400 text-xl animate-bounce" />
                      <p className="text-amber-300 font-medium">
                        Say "OK" to confirm or "No" to cancel...
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {step === "signup" && (
              <div className="space-y-6">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-300 text-sm">
                    Sign in or create an account to complete your booking
                  </p>
                </div>

                {/* OAuth Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-lg disabled:opacity-50"
                  >
                    <FaGoogle className="text-xl text-red-500" />
                    Continue with Google
                  </button>

                  <button
                    onClick={handleAppleLogin}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition-all shadow-lg disabled:opacity-50"
                  >
                    <FaApple className="text-xl" />
                    Continue with Apple
                  </button>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-slate-800 text-gray-400">
                      Or continue with email
                    </span>
                  </div>
                </div>

                {/* Email Option */}
                <div>
                  <label className="text-sm text-gray-400   mb-2 flex items-center gap-2">
                    <FiMail className="text-amber-400" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  <p className="text-gray-400 text-xs mt-2">
                    We'll create an account for you and send booking
                    confirmation
                  </p>
                </div>

                {/* Booking Summary */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-white font-semibold mb-2">
                    Booking Summary:
                  </h4>
                  <div className="space-y-1 text-sm text-gray-300">
                    <p>📍 Office: {getOfficeName(formData.office)}</p>
                    <p>🚗 Category: {getCategoryName(formData.category)}</p>
                    <p>
                      📅 Dates:{" "}
                      {new Date(formData.pickupDate).toLocaleDateString()} -{" "}
                      {new Date(formData.returnDate).toLocaleDateString()}
                    </p>
                    <p>
                      ⏰ Times: {formData.pickupTime || "10:00"} -{" "}
                      {formData.returnTime || "10:00"}
                    </p>
                    <p>👤 Driver Age: {formData.driverAge}</p>
                  </div>
                </div>

                {/* Privacy Notice */}
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-gray-400 text-xs text-center">
                    By continuing, you agree to our Terms of Service and Privacy
                    Policy
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
            {step === "review" && (
              <>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-lg font-semibold text-white bg-white/10 hover:bg-white/20 transition-all"
                  disabled={isSubmitting || isRecording || isProcessing}
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    if (!isRecording) {
                      console.log("🎤 [Modal] Starting voice confirmation...");
                      setWaitingForVoiceConfirmation(true);
                    } else {
                      console.log("🛑 [Modal] Stopping voice recording...");
                    }
                    toggleRecording();
                  }}
                  disabled={isSubmitting || isProcessing}
                  className={`px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                    isRecording
                      ? "bg-red-500 text-white animate-pulse"
                      : isProcessing
                      ? "bg-blue-500 text-white"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <FiMic />
                  {isRecording
                    ? "Click to Stop"
                    : isProcessing
                    ? "Processing..."
                    : "Voice Confirm"}
                </button>

                <button
                  onClick={handleConfirm}
                  disabled={isSubmitting || isRecording || isProcessing}
                  className="px-6 py-2.5 rounded-lg font-semibold text-slate-900 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/30 disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : "Confirm & Continue"}
                </button>
              </>
            )}

            {step === "signup" && (
              <>
                <button
                  onClick={() => setStep("review")}
                  className="px-6 py-2.5 rounded-lg font-semibold text-white bg-white/10 hover:bg-white/20 transition-all"
                  disabled={isSubmitting}
                >
                  Back
                </button>
                <button
                  onClick={handleSignupAndReserve}
                  disabled={isSubmitting || !email}
                  className="px-6 py-2.5 rounded-lg font-semibold text-slate-900 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/30 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating Booking..." : "Complete Booking"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </>
  );

  return createPortal(modalContent, document.body);
}
