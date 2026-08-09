"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiMail,
  FiUser,
  FiPhone,
  FiHome,
  FiArrowLeft,
  FiCheck,
  FiShield,
} from "react-icons/fi";
import gsap from "gsap";
import { showToast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import AddressFields from "./AddressFields";
import type { RegistrationAddress } from "@/lib/address";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

const emptyAddress: RegistrationAddress = {
  addressLine1: "",
  addressLine2: "",
  townCity: "",
  county: "",
  postcode: "",
  country: "United Kingdom",
  addressSource: "manual",
  postcodeValidated: false,
};

export default function AuthForm() {
  const { setUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code" | "register">("phone");
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    emailAddress: "",
    phoneNumber: "",
    code: "",
  });
  const [addressData, setAddressData] = useState<RegistrationAddress>(emptyAddress);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on step change
  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, y: 30, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" },
      );
    }

    // Auto-focus logic
    const timer = setTimeout(() => {
      if (step === "phone" && phoneInputRef.current) {
        phoneInputRef.current.focus();
      } else if (step === "code" && codeInputRefs.current[0]) {
        codeInputRefs.current[0]?.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [step]);

  // Handle OTP input
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = formData.code.split("");
    newCode[index] = value;
    const updatedCode = newCode.join("").slice(0, 6);

    setFormData((prev) => ({ ...prev, code: updatedCode }));

    if (errors.code) {
      setErrors((prev) => ({ ...prev, code: "" }));
    }

    // Auto-advance to next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !formData.code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    setFormData((prev) => ({ ...prev, code: pastedData }));

    // Focus the appropriate input after paste
    const nextIndex = Math.min(pastedData.length, 5);
    codeInputRefs.current[nextIndex]?.focus();
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phoneNumber.trim()) {
      setErrors({ phoneNumber: "Phone number is required" });
      return;
    }
    if (!/^[0-9]{10}$/.test(formData.phoneNumber)) {
      setErrors({ phoneNumber: "Please enter a valid 10-digit UK phone number" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-code",
          phoneNumber: `+44${formData.phoneNumber}`,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to send code");
      showToast.success("Code sent to your phone!");
      setStep("code");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Failed to send code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || formData.code.length !== 6) {
      setErrors({ code: "Please enter the complete 6-digit code" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          phoneNumber: `+44${formData.phoneNumber}`,
          code: formData.code,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Verification failed");

      if (data.data.userExists) {
        localStorage.setItem("token", data.data.token);
        setUser(data.data.user);
        showToast.success("Welcome back! Redirecting...");
        setTimeout(() => {
          window.location.href = "/customerDashboard";
        }, 1500);
      } else {
        showToast.success("Phone verified! Please complete registration.");
        setStep("register");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.emailAddress.trim()) {
      newErrors.emailAddress = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.emailAddress)) {
      newErrors.emailAddress = "Email is invalid";
    }
    if (!addressData.postcode.trim())
      newErrors.postcode = "Postcode is required";
    if (!addressData.addressLine1.trim())
      newErrors.addressLine1 = "Address line 1 is required";
    if (!addressData.townCity.trim())
      newErrors.townCity = "Town / city is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!agreedToTerms) {
      setErrors({
        ...newErrors,
        terms: "You must accept the terms and conditions",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          phoneNumber: `+44${formData.phoneNumber}`,
          name: formData.name,
          lastName: formData.lastName,
          emailAddress: formData.emailAddress,
          addressData,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Registration failed");

      localStorage.setItem("token", data.data.token);
      setUser(data.data.user);
      showToast.success("Account created! Redirecting...");

      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "phoneNumber") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        [name]: digits,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const steps = [
    { key: "phone", label: "Phone", icon: FiPhone },
    { key: "code", label: "Verify", icon: FiShield },
    { key: "register", label: "Profile", icon: FiUser },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 sm:w-96 sm:h-96 bg-[#fe9a00]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 sm:w-96 sm:h-96 bg-orange-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-linear-to-br from-[#fe9a00]/5 to-orange-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Home button */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="group mb-6 flex items-center gap-2 text-white/70 hover:text-[#fe9a00] transition-colors duration-300"
          aria-label="Go to home page"
        >
          <div className="p-2 rounded-full bg-white/5 group-hover:bg-[#fe9a00]/10 transition-colors duration-300">
            <FiHome className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Back to Home</span>
        </button>

        {/* Progress indicator */}
        <div
          className="mb-8"
          role="navigation"
          aria-label="Registration progress"
        >
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10">
              <div
                className="h-full bg-linear-to-r from-[#fe9a00] to-orange-500 transition-all duration-500 ease-out"
                style={{
                  width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
                }}
              />
            </div>

            {steps.map((s, index) => {
              const Icon = s.icon;
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div
                  key={s.key}
                  className="relative z-10 flex flex-col items-center"
                >
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      transition-all duration-300 ease-out
                      ${
                        isCompleted
                          ? "bg-linear-to-br from-[#fe9a00] to-orange-600 text-white shadow-lg shadow-orange-500/30"
                          : isCurrent
                            ? "bg-linear-to-br from-[#fe9a00] to-orange-600 text-white shadow-lg shadow-orange-500/30 ring-4 ring-[#fe9a00]/20"
                            : "bg-white/10 text-white/40"
                      }
                    `}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    {isCompleted ? (
                      <FiCheck className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`
                      mt-2 text-xs font-medium transition-colors duration-300
                      ${isCurrent ? "text-[#fe9a00]" : "text-white/50"}
                    `}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main form card */}
        <div
          ref={formRef}
          className="relative bg-linear-to-br from-white/12 to-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl shadow-black/20"
        >
          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-[#fe9a00]/20 to-transparent rounded-tr-3xl rounded-bl-[100px] pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-8 relative">
            {step !== "phone" && (
              <button
                type="button"
                onClick={() => setStep(step === "code" ? "phone" : "code")}
                className="absolute left-0 top-0 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all duration-300"
                aria-label="Go back"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-linear-to-br from-[#fe9a00] to-orange-600 shadow-lg shadow-orange-500/30">
              {step === "phone" && <FiPhone className="w-8 h-8 text-white" />}
              {step === "code" && <FiShield className="w-8 h-8 text-white" />}
              {step === "register" && <FiUser className="w-8 h-8 text-white" />}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {step === "register"
                ? "Complete Your Profile"
                : step === "code"
                  ? "Verify Your Phone"
                  : "Welcome Back"}
            </h1>
            <p className="text-white/60 text-sm sm:text-base">
              {step === "register"
                ? "Just a few more details to get started"
                : step === "code"
                  ? `Enter the 6-digit code sent to +44 ${formData.phoneNumber}`
                  : "Enter your phone number to continue"}
            </p>
          </div>

          <form
            onSubmit={
              step === "phone"
                ? handleSendCode
                : step === "code"
                  ? handleVerifyCode
                  : handleCompleteRegistration
            }
            className="space-y-5"
            noValidate
          >
            {/* Phone Step */}
            {step === "phone" && (
              <div className="space-y-4">
                <div className="relative group">
                  <label
                    htmlFor="phoneNumber"
                    className="block text-sm font-medium text-white/80 mb-2"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <FiPhone className="w-5 h-5 text-white/40 group-focus-within:text-[#fe9a00] transition-colors" />
                    </div>
                    <div className="absolute inset-y-0 left-12 flex items-center pointer-events-none">
                      <span className="text-white/60 font-medium text-sm sm:text-base">
                        +44
                      </span>
                    </div>
                    <input
                      ref={phoneInputRef}
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="7400123456"
                      required
                      autoComplete="tel"
                      aria-describedby={
                        errors.phoneNumber ? "phone-error" : undefined
                      }
                      aria-invalid={!!errors.phoneNumber}
                      className={`
                        w-full pl-22 pr-4 py-4
                        bg-white/5 hover:bg-white/[0.07] focus:bg-white/10
                        border-2 rounded-xl
                        text-white text-base sm:text-lg placeholder-white/30
                        focus:outline-none transition-all duration-300
                        ${
                          errors.phoneNumber
                            ? "border-red-500/50 focus:border-red-500"
                            : "border-white/10 focus:border-[#fe9a00]"
                        }
                      `}
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p
                      id="phone-error"
                      className="mt-2 text-red-400 text-sm flex items-center gap-1"
                      role="alert"
                    >
                      <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
                      {errors.phoneNumber}
                    </p>
                  )}
                </div>

                {/* Info text */}
                <p className="text-white/40 text-xs text-center">
                  We&apos;ll send you a verification code via SMS
                </p>
              </div>
            )}

            {/* Code Step */}
            {step === "code" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-4 text-center">
                    Enter Verification Code
                  </label>
                  <div
                    className="flex justify-center gap-2 sm:gap-3"
                    onPaste={handleCodePaste}
                  >
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          codeInputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={formData.code[index] || ""}
                        onChange={(e) =>
                          handleCodeChange(index, e.target.value)
                        }
                        onKeyDown={(e) => handleCodeKeyDown(index, e)}
                        aria-label={`Digit ${index + 1} of verification code`}
                        className={`
                          w-11 h-14 sm:w-14 sm:h-16
                          text-center text-xl sm:text-2xl font-bold
                          bg-white/5 hover:bg-white/[0.07] focus:bg-white/10
                          border-2 rounded-xl
                          text-white
                          focus:outline-none transition-all duration-300
                          ${
                            errors.code
                              ? "border-red-500/50 focus:border-red-500"
                              : formData.code[index]
                                ? "border-[#fe9a00]/50 focus:border-[#fe9a00]"
                                : "border-white/10 focus:border-[#fe9a00]"
                          }
                        `}
                      />
                    ))}
                  </div>
                  {errors.code && (
                    <p
                      className="mt-3 text-red-400 text-sm text-center flex items-center justify-center gap-1"
                      role="alert"
                    >
                      <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
                      {errors.code}
                    </p>
                  )}
                </div>

                {/* Resend code */}
                <div className="text-center space-y-2">
                  <p className="text-white/40 text-sm">
                    Didn&apos;t receive the code?
                  </p>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    className="text-[#fe9a00] hover:text-orange-300 transition-colors text-sm font-medium hover:underline"
                  >
                    Resend Code
                  </button>
                </div>
              </div>
            )}

            {/* Register Step */}
            {step === "register" && (
              <div className="space-y-4">
                {/* Name fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative group">
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-white/80 mb-2"
                    >
                      First Name
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-[#fe9a00] transition-colors" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="John"
                        required
                        autoComplete="given-name"
                        aria-invalid={!!errors.name}
                        className={`
                          w-full pl-12 pr-4 py-3.5
                          bg-white/5 hover:bg-white/[0.07] focus:bg-white/10
                          border-2 rounded-xl
                          text-white placeholder-white/30
                          focus:outline-none transition-all duration-300
                          ${
                            errors.name
                              ? "border-red-500/50 focus:border-red-500"
                              : "border-white/10 focus:border-[#fe9a00]"
                          }
                        `}
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1.5 text-red-400 text-xs" role="alert">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="relative group">
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-white/80 mb-2"
                    >
                      Last Name
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-[#fe9a00] transition-colors" />
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Doe"
                        required
                        autoComplete="family-name"
                        aria-invalid={!!errors.lastName}
                        className={`
                          w-full pl-12 pr-4 py-3.5
                          bg-white/5 hover:bg-white/[0.07] focus:bg-white/10
                          border-2 rounded-xl
                          text-white placeholder-white/30
                          focus:outline-none transition-all duration-300
                          ${
                            errors.lastName
                              ? "border-red-500/50 focus:border-red-500"
                              : "border-white/10 focus:border-[#fe9a00]"
                          }
                        `}
                      />
                    </div>
                    {errors.lastName && (
                      <p className="mt-1.5 text-red-400 text-xs" role="alert">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="relative group">
                  <label
                    htmlFor="emailAddress"
                    className="block text-sm font-medium text-white/80 mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-[#fe9a00] transition-colors" />
                    <input
                      type="email"
                      id="emailAddress"
                      name="emailAddress"
                      value={formData.emailAddress}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      required
                      autoComplete="email"
                      aria-invalid={!!errors.emailAddress}
                      className={`
                        w-full pl-12 pr-4 py-3.5
                        bg-white/5 hover:bg-white/[0.07] focus:bg-white/10
                        border-2 rounded-xl
                        text-white placeholder-white/30
                        focus:outline-none transition-all duration-300
                        ${
                          errors.emailAddress
                            ? "border-red-500/50 focus:border-red-500"
                            : "border-white/10 focus:border-[#fe9a00]"
                        }
                      `}
                    />
                  </div>
                  {errors.emailAddress && (
                    <p className="mt-1.5 text-red-400 text-xs" role="alert">
                      {errors.emailAddress}
                    </p>
                  )}
                </div>

                {/* Address (UK postcode lookup flow) */}
                <AddressFields
                  value={addressData}
                  onChange={setAddressData}
                  errors={errors}
                  onClearError={(field) =>
                    setErrors((prev) =>
                      prev[field] ? { ...prev, [field]: "" } : prev,
                    )
                  }
                />

                {/* Terms checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative  shrink-0 mt-0.5">
                      <input
                        id="terms"
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => {
                          setAgreedToTerms(e.target.checked);
                          if (errors.terms)
                            setErrors((prev) => ({ ...prev, terms: "" }));
                        }}
                        className="sr-only peer"
                        aria-describedby={
                          errors.terms ? "terms-error" : undefined
                        }
                      />
                      <div
                        className={`
                          w-5 h-5 rounded-md border-2
                          flex items-center justify-center
                          transition-all duration-200
                          ${
                            agreedToTerms
                              ? "bg-[#fe9a00] border-[#fe9a00]"
                              : "bg-white/5 border-white/20 group-hover:border-white/40"
                          }
                          ${errors.terms ? "border-red-500/50" : ""}
                        `}
                      >
                        {agreedToTerms && (
                          <FiCheck className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                    </div>
                    <span className="text-white/70 text-sm leading-relaxed">
                      I agree to the{" "}
                      <Link
                        href="/terms-and-conditions/"
                        className="text-[#fe9a00] hover:text-orange-300 hover:underline transition-colors font-medium"
                      >
                        Terms and Conditions
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy-policy/"
                        className="text-[#fe9a00] hover:text-orange-300 hover:underline transition-colors font-medium"
                      >
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  {errors.terms && (
                    <p
                      id="terms-error"
                      className="mt-2 text-red-400 text-xs flex items-center gap-1"
                      role="alert"
                    >
                      <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
                      {errors.terms}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || (step === "register" && !agreedToTerms)}
              className={`
                relative w-full py-4 mt-2
                font-semibold text-white text-base sm:text-lg
                rounded-xl overflow-hidden
                transition-all duration-300
                focus:outline-none focus:ring-2 focus:ring-[#fe9a00] focus:ring-offset-2 focus:ring-offset-transparent
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                ${
                  isLoading
                    ? "bg-[#fe9a00]/80"
                    : "bg-linear-to-r from-[#fe9a00] to-orange-600 hover:from-orange-600 hover:to-[#fe9a00] hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0"
                }
              `}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />

              <span className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {step === "phone"
                      ? "Sending Code..."
                      : step === "code"
                        ? "Verifying..."
                        : "Creating Account..."}
                  </>
                ) : step === "phone" ? (
                  "Send Verification Code"
                ) : step === "code" ? (
                  "Verify & Continue"
                ) : (
                  "Complete Registration"
                )}
              </span>
            </button>
          </form>

          {/* Security badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-white/40 text-xs">
            <FiShield className="w-4 h-4" />
            <span>Your data is encrypted and secure</span>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-white/40 text-sm">
          Need help?{" "}
          <Link
            href="/contact-us"
            className="text-[#fe9a00] hover:text-orange-300 hover:underline transition-colors"
          >
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}
