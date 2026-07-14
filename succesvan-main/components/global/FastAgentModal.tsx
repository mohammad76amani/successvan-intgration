"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  FiX,
  FiMic,
  FiCheck,
  FiTruck,
  FiCalendar,
  FiPhone,
  FiUsers,
  FiLoader,
  FiPlus,
  FiMinus,
 } from "react-icons/fi";
import { BsFuelPump } from "react-icons/bs";
import Image from "next/image";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import {
  useFastAgent,
  CategorySuggestion,
  FastPhase,
  AddOnOption,
  SelectedAddOn,
} from "@/hooks/useFastAgent";
import TimeSelect from "@/components/ui/TimeSelect";
import CustomSelect from "@/components/ui/CustomSelect";
import { generateTimeSlots } from "@/utils/timeSlots";
import { showToast } from "@/lib/toast";
import { DateRange, Range } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { datePickerStyles } from "./DatePickerStyles";
import { MdDoorSliding } from "react-icons/md";
import { getLondonTime } from "@/lib/englandTime";
import FullScreenMobileCalendar from "./FullScreenMobileCalendar";
import {
  findSpecialDayForDate,
  getSpecialDayPickupWindow,
  getSpecialDayReturnWindow,
  getWorkingDayTimeSlots,
  getWorkingDayWindow,
} from "@/lib/specialDaySchedule";

interface FastAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (
    reservationId: string,
    userToken: string,
    isNewUser: boolean,
  ) => void;
}

// --- Enhanced Animations & Styles ---
const uiStyles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes ripple {
    0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); }
    70% { box-shadow: 0 0 0 15px rgba(249, 115, 22, 0); }
    100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
  }
  @keyframes wave {
    0%, 100% { height: 6px; }
    50% { height: 16px; }
  }
  @keyframes pulse-opacity {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
  .animate-fade-in { animation: fadeInUp 0.4s ease-out forwards; }
  .animate-ripple { animation: ripple 1.5s infinite; }
  .animate-wave { animation: wave 1s ease-in-out infinite; }
  .animate-pulse-opacity { animation: pulse-opacity 1.5s ease-in-out infinite; }
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
`;

export default function FastAgentModal({
  isOpen,
  onClose,
  onComplete,
}: FastAgentModalProps) {
  const [mounted, setMounted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [existingUserToken, setExistingUserToken] = useState<string | null>(
    null,
  );
  const chatEndRef = useRef<HTMLDivElement>(null);

  // -- New UI State --
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [msgTimestamps, setMsgTimestamps] = useState<Date[]>([]);
  const hasRecordedOnceRef = useRef(false); // To prevent transcribing loading on initial load

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    officeId: "",
    startDate: "",
    endDate: "",
    startTime: "10:00",
    endTime: "10:00",
    driverAge: 25,
  });

  // Phone verification state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  // Discount code state
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    percentage: number;
    discountAmount: number;
  } | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState("");

  // Add-ons selection state
  const [addOnQuantities, setAddOnQuantities] = useState<
    Record<string, number>
  >({});

  // Gear type selection state
  const [selectedGearType, setSelectedGearType] = useState<
    "manual" | "automatic"
  >("manual");

  // Date range state
  const [showDateRange, setShowDateRange] = useState(false);

  // Prevent background scroll when date picker is open (desktop only)
  useEffect(() => {
    if (showDateRange) {
      // Only lock scroll on desktop (md breakpoint and above)
      if (typeof window !== "undefined" && window.innerWidth >= 768) {
        document.body.style.overflow = "hidden";
      }
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showDateRange]);

  const [dateRange, setDateRange] = useState<Range[]>([
    {
      startDate: undefined,
      endDate: undefined,
      key: "selection",
    },
  ]);

  // Reserved time slots state
  const [startDateReservedSlots, setStartDateReservedSlots] = useState<
    {
      startDate: string;
      endDate: string;
      startTime: string;
      endTime: string;
      isSameDay: boolean;
    }[]
  >([]);
  const [endDateReservedSlots, setEndDateReservedSlots] = useState<
    {
      startDate: string;
      endDate: string;
      startTime: string;
      endTime: string;
      isSameDay: boolean;
    }[]
  >([]);

  const {
    isLoading,
    isPlaying,
    messages,
    agentState,
    offices,
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
  } = useFastAgent();

  const canReturn = agentState.phase !== "ask_needs" && canGoBack;

  // Use ref to track current phase for voice callback
  const phaseRef = useRef(agentState.phase);

  useEffect(() => {
    phaseRef.current = agentState.phase;
  }, [agentState.phase]);

  // --- Timestamp Logic ---
  // Sync timestamps with messages array.
  // If a new message appears, we create a timestamp for it.
  useEffect(() => {
    if (messages.length > msgTimestamps.length) {
      const newItems = messages
        .slice(msgTimestamps.length)
        .map(() => new Date());
      setMsgTimestamps((prev) => [...prev, ...newItems]);
    }
  }, [messages, msgTimestamps.length]);

  // Format time helper
  const formatTime = (date?: Date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // --- Voice Recording & Transcribing State Logic ---
  const { isRecording, toggleRecording } = useVoiceRecording({
    onTranscriptionComplete: async (result) => {
      // 3. Transcription done, turn off loading
      setIsTranscribing(false);
      hasRecordedOnceRef.current = false;

      // Use different handler based on current phase
      let response;
      if (phaseRef.current === "collect_booking") {
        if (result?.data) {
          response = await voiceParsed(result.transcript, result.data);
        } else {
          response = await voiceBooking(result.transcript);
        }
      } else if (phaseRef.current === "verify_phone") {
        response = await voicePhone(result.transcript);
      } else {
        if (result?.data) {
          response = await voiceParsed(result.transcript, result.data);
        } else {
          response = await sendMessage(result.transcript);
        }
      }

      if (response?.isComplete && response.state.reservationId) {
        setTimeout(() => {
          onComplete(
            response.state.reservationId!,
            response.state.userToken || "",
            response.state.isNewUser || false,
          );
        }, 2000);
      }
    },
    autoSubmit: false,
  });

  // Handle "Transcribing" state visual
  useEffect(() => {
    if (isRecording) {
      hasRecordedOnceRef.current = true;
    } else if (!isRecording && hasRecordedOnceRef.current) {
      // 2. Recording stopped, but transcript not back yet -> Start loading
      setIsTranscribing(true);
    }
  }, [isRecording]);

  // Initialize gear type when category is selected
  useEffect(() => {
    if (agentState.selectedCategory) {
      const gear = agentState.selectedCategory.gear;
      if (typeof gear !== "string" && gear.availableTypes?.length > 0) {
        setSelectedGearType(gear.availableTypes[0] as "manual" | "automatic");
      }
    }
  }, [agentState.selectedCategory]);

  useEffect(() => {
    setMounted(true);
    // Check if user is already logged in
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      setExistingUserToken(token);
    }
  }, []);

  // Initialize date range based on London time (16:00 hour check)
  useEffect(() => {
    const londonNow = getLondonTime();
    const hours = londonNow.getUTCHours();

    let minDaysToAdd = 1;
    if (hours >= 16) {
      minDaysToAdd = 2;
    }

    const start = new Date(londonNow);
    start.setDate(start.getDate() + minDaysToAdd);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    setDateRange([
      {
        startDate: start,
        endDate: end,
        key: "selection",
      },
    ]);
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change, or loading/transcribing states change
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isTranscribing]);

  // Auto-advance from non-interactive gear selection
  useEffect(() => {
    if (agentState.phase === "select_Gearbox" && agentState.selectedCategory) {
      const gear = agentState.selectedCategory.gear;
      const hasGearOptions =
        typeof gear !== "string" && gear.availableTypes?.length > 1;

      if (!hasGearOptions) {
        const defaultGear =
          typeof gear === "string"
            ? "manual"
            : (gear.availableTypes?.[0] as "manual" | "automatic") || "manual";
        selectGear(defaultGear, 0);
      }
    }
  }, [agentState.phase, agentState.selectedCategory, selectGear]);

  // Sync booking form with agent state
  useEffect(() => {
    if (agentState.booking) {
      setBookingForm((prev) => ({
        officeId: agentState.booking.officeId || prev.officeId,
        startDate: agentState.booking.startDate || prev.startDate,
        endDate: agentState.booking.endDate || prev.endDate,
        startTime: agentState.booking.startTime || prev.startTime,
        endTime: agentState.booking.endTime || prev.endTime,
        driverAge: agentState.booking.driverAge || prev.driverAge,
      }));
    }
  }, [agentState.booking]);

  // Fetch reserved slots for start date
  useEffect(() => {
    if (bookingForm.officeId && bookingForm.startDate) {
      setStartDateReservedSlots([]);
      fetch(
        `/api/reservations/by-office?office=${bookingForm.officeId}&startDate=${bookingForm.startDate}&type=start`,
      )
        .then((res) => res.json())
        .then((data) => {
          setStartDateReservedSlots(data.data?.reservedSlots || []);
        })
        .catch((err) =>
          console.log("Failed to fetch start date reserved slots:", err),
        );
    }
  }, [bookingForm.officeId, bookingForm.startDate]);

  // Fetch reserved slots for end date
  useEffect(() => {
    if (bookingForm.officeId && bookingForm.endDate) {
      setEndDateReservedSlots([]);
      fetch(
        `/api/reservations/by-office?office=${bookingForm.officeId}&endDate=${bookingForm.endDate}&type=end`,
      )
        .then((res) => res.json())
        .then((data) => {
          setEndDateReservedSlots(data.data?.reservedSlots || []);
        })
        .catch((err) =>
          console.log("Failed to fetch end date reserved slots:", err),
        );
    }
  }, [bookingForm.officeId, bookingForm.endDate]);

  // Sync dateRange with bookingForm
  useEffect(() => {
    if (dateRange[0].startDate && dateRange[0].endDate) {
      const startDate = dateRange[0].startDate.toISOString().split("T")[0];
      const endDate = dateRange[0].endDate.toISOString().split("T")[0];
      setBookingForm((prev) => ({
        ...prev,
        startDate,
        endDate,
      }));
    }
  }, [dateRange]);

  // Start conversation when modal opens
  useEffect(() => {
    if (isOpen && !hasStarted && mounted) {
      setHasStarted(true);
      sendMessage("start");
    }
  }, [isOpen, hasStarted, mounted, sendMessage]);

  // Handle complete
  useEffect(() => {
    if (agentState.phase === "complete" && agentState.reservationId) {
      setTimeout(() => {
        onComplete(
          agentState.reservationId!,
          agentState.userToken || "",
          agentState.isNewUser || false,
        );
      }, 2500);
    }
  }, [agentState, onComplete]);

  // Generate pickup time slots based on office working hours
  const pickupTimeSlots = useMemo(() => {
    if (!bookingForm.officeId || !bookingForm.startDate) return [];
    const office = offices?.find((o) => o._id === bookingForm.officeId) as any;
    if (!office) return [];

    const date = new Date(bookingForm.startDate);
    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][date.getDay()];

    const specialDay = findSpecialDayForDate(office.specialDays, date);
    let start = "00:00",
      end = "23:59";
    let slots: string[] = [];

    if (specialDay && specialDay.isOpen) {
      const pickupWindow = getSpecialDayPickupWindow(specialDay);
      start = pickupWindow.startTime;
      end = pickupWindow.endTime;
      slots = generateTimeSlots(start, end, 15);
    } else {
      const workingDay = office.workingTime?.find(
        (w: any) => w.day === dayName && w.isOpen,
      );
      if (workingDay) {
        slots = getWorkingDayTimeSlots(workingDay, "pickup", 15);
      } else {
        slots = generateTimeSlots(start, end, 15);
      }
    }

    return slots;
  }, [bookingForm.officeId, bookingForm.startDate, offices]);

  const getSelectedOffice = () => {
    return offices?.find((o) => o._id === bookingForm.officeId);
  }; // Generate return time slots based on office working hours

  const returnTimeSlots = useMemo(() => {
    if (!bookingForm.officeId || !bookingForm.endDate) return [];
    const office = offices?.find((o) => o._id === bookingForm.officeId) as any;
    if (!office) return [];

    const date = new Date(bookingForm.endDate);
    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][date.getDay()];

    const specialDay = findSpecialDayForDate(office.specialDays, date);
    let start = "00:00",
      end = "23:59";
    let slots: string[] = [];

    if (specialDay && specialDay.isOpen) {
      const returnWindow = getSpecialDayReturnWindow(specialDay);
      start = returnWindow.startTime;
      end = returnWindow.endTime;
      slots = generateTimeSlots(start, end, 15);
    } else {
      const workingDay = office.workingTime?.find(
        (w: any) => w.day === dayName && w.isOpen,
      );
      if (workingDay) {
        slots = getWorkingDayTimeSlots(workingDay, "return", 15);
      } else {
        slots = generateTimeSlots(start, end, 15);
      }
    }

    return slots;
  }, [bookingForm.officeId, bookingForm.endDate, offices]);

  const isDateDisabled = (date: Date) => {
    const office = getSelectedOffice();
    if (!office) return false;

    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][date.getDay()];

    const specialDay = findSpecialDayForDate(office.specialDays, date);
    if (specialDay && !specialDay.isOpen) return true;

    const workingDay = office.workingTime?.find((w) => w.day === dayName);
    if (workingDay && !workingDay.isOpen) return true;

    return false;
  };

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const body = document.body;
    const scrollY = window.scrollY;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";
    body.style.width = "100%";
    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.overflow = "";
      body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleClose = () => {
    stopAudio();
    reset();
    setHasStarted(false);
    onClose();
  };

  const handleSelectCategory = async (category: CategorySuggestion) => {
    await selectCategory(category._id);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.officeId || !bookingForm.startDate || !bookingForm.endDate)
      return;
    await submitBooking(bookingForm);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    await sendCode(phoneNumber);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) return;
    await verifyCode(verificationCode);
  };

  const getPhaseProgress = (phase: FastPhase): number => {
    switch (phase) {
      case "ask_needs":
        return 10;
      case "show_suggestions":
        return 25;
      case "collect_booking":
        return 40;
      case "select_Gearbox":
        return 50;
      case "select_addons":
        return 55;
      case "show_receipt":
        return 70;
      case "verify_phone":
        return 85;
      case "complete":
        return 100;
      default:
        return 0;
    }
  };

  const getAddOnPrice = (addOn: AddOnOption): number => {
    const totalDays = agentState.booking.totalDays || 1;
    if (addOn.pricingType === "flat") {
      const amount = addOn.flatPrice?.amount || 0;
      return addOn.flatPrice?.isPerDay ? amount * totalDays : amount;
    }
    if (addOn.tieredPrice?.tiers && addOn.tieredPrice.tiers.length > 0) {
      const tier = addOn.tieredPrice.tiers.find(
        (t) => totalDays >= t.minDays && totalDays <= t.maxDays,
      );
      const tierPrice = tier?.price || addOn.tieredPrice.tiers[0].price || 0;
      return addOn.tieredPrice.isPerDay ? tierPrice * totalDays : tierPrice;
    }
    return 0;
  };

  const handleAddOnQuantityChange = (
    addOnId: string,
    delta: number,
    addonType?: string,
  ) => {
    setAddOnQuantities((prev) => {
      const current = prev[addOnId] || 0;

      // If adding (+1)
      if (delta > 0) {
        // Check if already at max quantity (1)
        if (current >= 1) {
          return prev;
        }

        // If addon has a type, check if another addon of same type is already selected
        if (addonType) {
          const hasSameTypeSelected = Object.entries(prev).some(([id, qty]) => {
            if (qty > 0 && id !== addOnId) {
              const selectedAddon = agentState.availableAddOns?.find(
                (a) => a._id === id,
              );
              return (selectedAddon as any)?.type === addonType;
            }
            return false;
          });

          if (hasSameTypeSelected) {
            return prev;
          }
        }
      }

      const newVal = Math.max(0, Math.min(1, current + delta));
      return { ...prev, [addOnId]: newVal };
    });
  };

  const handleGearSelection = () => {
    const extraCost = getGearExtraCost();
    selectGear(selectedGearType, extraCost);
  };

  const getGearExtraCost = (): number => {
    if (!agentState.selectedCategory) return 0;
    const gear = agentState.selectedCategory.gear;
    if (typeof gear === "string") return 0;
    if (
      selectedGearType === "automatic" &&
      gear.availableTypes?.includes("automatic") &&
      gear.availableTypes?.includes("manual")
    ) {
      const totalDays = agentState.booking.totalDays || 1;
      return (gear.automaticExtraCost || 0) * totalDays;
    }
    return 0;
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError("Please enter a discount code");
      return;
    }
    setDiscountLoading(true);
    setDiscountError("");
    try {
      const response = await fetch(
        `/api/discounts?code=${encodeURIComponent(discountCode)}&status=active`,
      );
      const data = await response.json();
      if (!data.success || !data.data || data.data.length === 0) {
        setDiscountError("Invalid discount code");
        setAppliedDiscount(null);
        return;
      }
      const discount = data.data[0];
      if (
        !discount ||
        !discount.percentage ||
        !discount.validFrom ||
        !discount.validTo
      ) {
        setDiscountError("Invalid discount data");
        setAppliedDiscount(null);
        return;
      }
      const now = new Date();
      const validFrom = new Date(discount.validFrom);
      const validTo = new Date(discount.validTo);
      if (now < validFrom || now > validTo) {
        setDiscountError("This discount code has expired");
        setAppliedDiscount(null);
        return;
      }
      if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
        setDiscountError("This discount code has reached its usage limit");
        setAppliedDiscount(null);
        return;
      }
      if (discount.categories && discount.categories.length > 0) {
        const categoryIds = discount.categories.map(
          (cat: any) => cat._id || cat,
        );
        if (!categoryIds.includes(agentState.booking.categoryId)) {
          setDiscountError(
            "This discount code is not valid for the selected vehicle",
          );
          setAppliedDiscount(null);
          return;
        }
      }
      const totalPrice = agentState.booking.totalPrice || 0;
      const discountAmount = (totalPrice * discount.percentage) / 100;
      setAppliedDiscount({
        code: discount.code,
        percentage: discount.percentage,
        discountAmount,
      });
      setDiscountError("");
      showToast.success(`Discount applied! ${discount.percentage}% off`);
    } catch (error) {
      setDiscountError("Failed to apply discount. Please try again.");
      setAppliedDiscount(null);
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountError("");
  };

  const handleConfirmAddOns = async () => {
    const selectedAddOns: SelectedAddOn[] = [];
    for (const addOn of agentState.availableAddOns || []) {
      const quantity = addOnQuantities[addOn._id] || 0;
      if (quantity > 0) {
        const pricePerUnit = getAddOnPrice(addOn);
        selectedAddOns.push({
          addOnId: addOn._id,
          name: addOn.name,
          quantity,
          pricePerUnit,
          totalPrice: pricePerUnit * quantity,
        });
      }
    }
    await confirmAddOns(selectedAddOns);
  };

  const handleConfirmReceipt = async () => {
    if (isAuthenticated && existingUserToken) {
      try {
        const tokenPayload = JSON.parse(atob(existingUserToken.split(".")[1]));
        const userId = tokenPayload.userId || tokenPayload.id;
        if (!userId) throw new Error("Invalid token: No user ID found");

        const { booking } = agentState;
        const startDateObj = new Date(booking.startDate!);
        const endDateObj = new Date(booking.endDate!);
        if (booking.startTime) {
          const [startHour, startMin] = booking.startTime
            .split(":")
            .map(Number);
          startDateObj.setHours(startHour, startMin, 0, 0);
        }
        if (booking.endTime) {
          const [endHour, endMin] = booking.endTime.split(":").map(Number);
          endDateObj.setHours(endHour, endMin, 0, 0);
        }
        const reservationAddOns = (booking.selectedAddOns || []).map(
          (addon) => ({
            addOn: addon.addOnId,
            quantity: addon.quantity,
          }),
        );
        const response = await fetch("/api/reservations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userData: { userId: userId },
            reservationData: {
              office: booking.officeId,
              category: booking.categoryId,
              startDate: startDateObj.toISOString(),
              endDate: endDateObj.toISOString(),
              totalPrice: booking.totalPrice || 0,
              status: "pending",
              driverAge: booking.driverAge || 25,
              messege: "Booked via AI Assistant",
              addOns: reservationAddOns,
              gearType: booking.gearType || "manual",
              reservationType: "Website",
            },
          }),
        });
        const data = await response.json();
        if (data.success) {
          showToast.success("Booking confirmed successfully!");
          onComplete(data.data._id, existingUserToken, false);
        } else {
          throw new Error(data.error || "Failed to create reservation");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to create reservation. Please try again.";
        showToast.error(errorMessage);
      }
    } else {
      confirmReceipt();
    }
  };

  const isInputPhase =
    agentState.phase === "ask_needs" ||
    agentState.phase === "collect_booking" ||
    agentState.phase === "verify_phone";

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm">
      <style>{uiStyles}</style>

      {/* Main Container */}
      <div className="bg-[#0f172b] w-full md:w-150 h-[95dvh] md:h-[95vh] md:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col relative overflow-hidden transition-all duration-300 border border-white/10">
        {/* --- Header --- */}
        <div className="bg-[#1e293b]/90 backdrop-blur-md border-b border-white/5 p-4 z-20 flex flex-col gap-3 sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-500 flex items-center justify-center shadow-inner">
                  <Image
                    src="/assets/images/bot.jpeg"
                    alt="AI Agent"
                    width={50}
                    height={50}
                    className="w-10 h-10 rounded-md"
                  />
                </div>
                {/* Status Dot */}
                <div
                  className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#1e293b] flex items-center justify-center ${
                    isLoading
                      ? "bg-blue-500"
                      : isRecording
                        ? "bg-red-500"
                        : isPlaying
                          ? "bg-green-500"
                          : "bg-gray-400"
                  }`}
                >
                  {isLoading && (
                    <div className="w-2 h-2 border-t-2 border-r-2 border-white rounded-full animate-spin" />
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <h2 className="font-bold text-lg text-white leading-tight">
                  AI Van Assistant
                </h2>
                <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                  {isLoading ? (
                    <span className="text-blue-400 animate-pulse">
                      Processing...
                    </span>
                  ) : isRecording ? (
                    <span className="text-red-400 animate-pulse">
                      Listening...
                    </span>
                  ) : isPlaying ? (
                    <span className="text-green-400">Speaking...</span>
                  ) : (
                    "Ready to help"
                  )}
                </span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition-colors active:scale-90"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden relative">
            <div
              className="absolute top-0 left-0 h-full bg-linear-to-r from-orange-600 to-amber-500 transition-all duration-700 ease-out"
              style={{ width: `${getPhaseProgress(agentState.phase)}%` }}
            />
          </div>
        </div>

        {/* --- Scrollable Content --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 mb-8 space-y-5 pb-32 md:pb-24 bg-linear-to-b from-[#0f172b] to-[#1e293b]">
          {/* Chat Messages */}
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col animate-fade-in ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm md:text-base leading-relaxed shadow-sm backdrop-blur-sm relative ${
                    msg.role === "user"
                      ? "bg-orange-600 text-white rounded-br-sm ml-8"
                      : "bg-[#2d3a52] text-gray-100 rounded-bl-sm mr-8 border border-white/5"
                  }`}
                >
                  {msg.content}
                </div>
                {/* Message Timestamp */}
                <span
                  className={`text-[10px] text-gray-500 mt-1 px-1 ${msg.role === "user" ? "text-right" : "text-left"}`}
                >
                  {msgTimestamps[i]
                    ? formatTime(msgTimestamps[i])
                    : formatTime(new Date())}
                </span>
              </div>
            ))}

            {/* Voice-to-Text Loading State (User Side) */}
            {isTranscribing && (
              <div className="flex flex-col items-end animate-fade-in">
                <div className="bg-orange-600/50 backdrop-blur-sm rounded-2xl rounded-br-sm px-4 py-3 ml-8 border border-orange-500/30 flex items-center gap-2">
                  <div className="flex gap-1 items-end h-4">
                    <div
                      className="w-1 bg-white/80 animate-wave rounded-full"
                      style={{ animationDelay: "0s" }}
                    ></div>
                    <div
                      className="w-1 bg-white/80 animate-wave rounded-full"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-1 bg-white/80 animate-wave rounded-full"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-1 bg-white/80 animate-wave rounded-full"
                      style={{ animationDelay: "0.3s" }}
                    ></div>
                  </div>
                  <span className="text-xs text-white/90 font-medium animate-pulse-opacity">
                    Converting voice...
                  </span>
                </div>
              </div>
            )}

            {/* AI Processing State (Left Side) */}
            {isLoading && !isTranscribing && (
              <div className="flex flex-col items-start animate-fade-in">
                <div className="bg-[#2d3a52] border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* --- Dynamic Modules --- */}

          {/* 1. Suggestion Cards */}
          {agentState.phase === "show_suggestions" &&
            agentState.suggestions && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in py-8 pt-2">
                {agentState.suggestions.map((category) => (
                  <SuggestionCard
                    key={category._id}
                    category={category}
                    onSelect={() => handleSelectCategory(category)}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            )}

          {/* 2. Booking Form */}
          {agentState.phase === "collect_booking" && (
            <div className="bg-[#1e293b]/50 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg animate-fade-in">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <FiCalendar className="text-orange-500" /> Verify Details
              </h3>
              <form onSubmit={handleSubmitBooking} className="space-y-4">
                {/* Office */}
                <div className="space-y-1.5">
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1">
                    Location
                  </label>
                  <CustomSelect
                    options={offices.map(o => ({ _id: o._id ?? '', name: o.name }))}
                    value={bookingForm.officeId}
                    onChange={(officeId) =>
                      setBookingForm((p) => ({ ...p, officeId }))
                    }
                    placeholder="Select pickup office"
                  />
                </div>

                {/* Date Picker (Inline or Popup) */}
                <div className="space-y-1.5">
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1">
                    Dates
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowDateRange(!showDateRange)}
                      className="w-full bg-[#0f172b] border border-white/10 hover:border-orange-500/50 rounded-xl px-4 py-3.5 text-left text-white transition-all flex items-center gap-3"
                    >
                      <FiCalendar className="text-orange-500 text-lg" />
                      <span className="text-sm font-medium">
                        {dateRange[0].startDate && dateRange[0].endDate
                          ? `${dateRange[0].startDate.toLocaleDateString()} - ${dateRange[0].endDate.toLocaleDateString()}`
                          : "Select Dates"}
                      </span>
                    </button>
                    {showDateRange && (
                      <div className="absolute hidden md:block left-0 min-h-44 max-h-100 overflow-y-auto -top-44 z-99999 bg-slate-800 backdrop-blur-xl border border-white/20 rounded-lg p-4 w-70 sm:w-75  ">
                        <DateRange
                          className="w-full"
                          ranges={dateRange}
                          onChange={(item) => {
                            const { startDate, endDate } = item.selection;
                            setDateRange([
                              {
                                startDate: startDate || new Date(),
                                endDate: endDate || new Date(),
                                key: "selection",
                              },
                            ]);
                          }}
                          // *** تغییر: minDate پویا بر اساس زمان انگلیس ***
                          minDate={(() => {
                            try {
                              const londonNow = getLondonTime();
                              const hours = londonNow.getUTCHours();

                              let minDaysToAdd = 1;
                              if (hours >= 16) minDaysToAdd = 2;

                              const min = new Date(londonNow);
                              min.setDate(min.getDate() + minDaysToAdd);
                              min.setHours(0, 0, 0, 0);
                              return min;
                            } catch (err) {
                              // fallback: فردا بر اساس زمان محلی
                              const fallback = new Date();
                              fallback.setDate(fallback.getDate() + 1);
                              fallback.setHours(0, 0, 0, 0);
                              return fallback;
                            }
                          })()}
                          // *** جدید: maxDate تا پایان سال جاری ***
                          maxDate={(() => {
                            try {
                              const londonNow = getLondonTime();
                              const endOfYear = new Date(
                                londonNow.getFullYear(),
                                11,
                                31,
                                23,
                                59,
                                59,
                                999,
                              );
                              return endOfYear;
                            } catch (err) {
                              const fallback = new Date();
                              fallback.setFullYear(
                                fallback.getFullYear(),
                                11,
                                31,
                              );
                              fallback.setHours(23, 59, 59, 999);
                              return fallback;
                            }
                          })()}
                          rangeColors={["#fbbf24"]}
                          months={12}
                          scroll={{ enabled: true }}
                          showMonthAndYearPickers={true}
                          moveRangeOnFirstSelection={false}
                          retainEndDateOnFirstSelection={false}
                          editableDateInputs={true}
                          dragSelectionEnabled={true}
                          disabledDates={
                            offices
                              ? (Array.from({ length: 400 }, (_, i) => {
                                  const date = new Date();
                                  date.setDate(date.getDate() + i);
                                  return isDateDisabled(date) ? date : null;
                                }).filter(Boolean) as Date[])
                              : []
                          }
                        />
                        <button
                          type="button"
                          onClick={() => setShowDateRange(false)}
                          className="w-full sticky -bottom-1 mt-3 px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded-lg hover:bg-amber-400 transition-colors text-sm"
                        >
                          Done
                        </button>
                      </div>
                    )}
                    {showDateRange && (
                      <FullScreenMobileCalendar
                        dateRange={dateRange}
                        onChange={(item) => {
                          const { startDate, endDate } = item.selection;
                          setDateRange([
                            {
                              startDate: startDate || new Date(),
                              endDate: endDate || new Date(),
                              key: "selection",
                            },
                          ]);
                        }}
                        minDate={(() => {
                          try {
                            const londonNow = getLondonTime();
                            const hours = londonNow.getUTCHours();

                            let minDaysToAdd = 1;
                            if (hours >= 16) minDaysToAdd = 2;

                            const min = new Date(londonNow);
                            min.setDate(min.getDate() + minDaysToAdd);
                            min.setHours(0, 0, 0, 0);
                            return min;
                          } catch (err) {
                            const fallback = new Date();
                            fallback.setDate(fallback.getDate() + 1);
                            fallback.setHours(0, 0, 0, 0);
                            return fallback;
                          }
                        })()}
                        maxDate={(() => {
                          try {
                            const londonNow = getLondonTime();
                            const endOfYear = new Date(
                              londonNow.getFullYear(),
                              11,
                              31,
                              23,
                              59,
                              59,
                              999,
                            );
                            return endOfYear;
                          } catch (err) {
                            const fallback = new Date();
                            fallback.setFullYear(
                              fallback.getFullYear(),
                              11,
                              31,
                            );
                            fallback.setHours(23, 59, 59, 999);
                            return fallback;
                          }
                        })()}
                        disabledDates={
                          offices
                            ? (Array.from({ length: 400 }, (_, i) => {
                                const date = new Date();
                                date.setDate(date.getDate() + i);
                                return isDateDisabled(date) ? date : null;
                              }).filter(Boolean) as Date[])
                            : []
                        }
                        onClose={() => setShowDateRange(false)}
                      />
                    )}
                  </div>
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1">
                      Pickup Time
                    </label>
                    <div className="bg-[#0f172b] border border-white/10 rounded-xl h-12">
                      {bookingForm.startDate &&
                        (() => {
                          const office = getSelectedOffice();
                          const date = new Date(bookingForm.startDate);
                          const dayName = [
                            "sunday",
                            "monday",
                            "tuesday",
                            "wednesday",
                            "thursday",
                            "friday",
                            "saturday",
                          ][date.getDay()];
                          const workingDay = office?.workingTime?.find(
                            (w: any) => w.day === dayName && w.isOpen,
                          );
                          const pickupWindow = workingDay
                            ? getWorkingDayWindow(workingDay, "pickup")
                            : undefined;
                          const extensionTimes = workingDay?.pickupExtension
                            ? {
                                start: pickupTimeSlots[0],
                                end: pickupTimeSlots[
                                  pickupTimeSlots.length - 1
                                ],
                                normalStart:
                                  pickupWindow?.startTime || "00:00",
                                normalEnd: pickupWindow?.endTime || "23:59",
                                price: workingDay.pickupExtension.flatPrice,
                              }
                            : undefined;
                          return (
                            <TimeSelect
                              value={bookingForm.startTime}
                              onChange={(time) =>
                                setBookingForm((p) => ({
                                  ...p,
                                  startTime: time,
                                }))
                              }
                              slots={pickupTimeSlots}
                              reservedSlots={startDateReservedSlots}
                              selectedDate={date}
                              isStartTime={true}
                              isInline={false}
                              extensionTimes={extensionTimes}
                            />
                          );
                        })()}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1">
                      Return Time
                    </label>
                    <div className="bg-[#0f172b] border border-white/10 rounded-xl h-12">
                      {bookingForm.endDate &&
                        (() => {
                          const office = getSelectedOffice();
                          const date = new Date(bookingForm.endDate);
                          const dayName = [
                            "sunday",
                            "monday",
                            "tuesday",
                            "wednesday",
                            "thursday",
                            "friday",
                            "saturday",
                          ][date.getDay()];
                          const workingDay = office?.workingTime?.find(
                            (w: any) => w.day === dayName && w.isOpen,
                          );
                          const returnWindow = workingDay
                            ? getWorkingDayWindow(workingDay, "return")
                            : undefined;
                          const extensionTimes = workingDay?.returnExtension
                            ? {
                                start: returnTimeSlots[0],
                                end: returnTimeSlots[
                                  returnTimeSlots.length - 1
                                ],
                                normalStart:
                                  returnWindow?.startTime || "00:00",
                                normalEnd: returnWindow?.endTime || "23:59",
                                price: workingDay.returnExtension.flatPrice,
                              }
                            : undefined;
                          return (
                            <TimeSelect
                              value={bookingForm.endTime}
                              onChange={(time) =>
                                setBookingForm((p) => ({ ...p, endTime: time }))
                              }
                              slots={returnTimeSlots}
                              reservedSlots={endDateReservedSlots}
                              selectedDate={date}
                              isStartTime={false}
                              isInline={false}
                              extensionTimes={extensionTimes}
                            />
                          );
                        })()}
                    </div>
                  </div>
                </div>

                {/* Driver Age */}
                <div className="space-y-1.5">
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1">
                    Driver Age
                  </label>
                  <div className="relative">
                    <FiUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" />
                    <input
                      type="number"
                      value={bookingForm.driverAge}
                      placeholder="23-80"
                      min={23}
                      max={80}
                      onChange={(e) =>
                        setBookingForm((p) => ({
                          ...p,
                          driverAge: parseInt(e.target.value) || 23,
                        }))
                      }
                      className="w-full bg-[#0f172b] border border-white/10 rounded-xl px-4 py-3.5 pl-11 text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    !bookingForm.officeId ||
                    !bookingForm.startDate ||
                    !bookingForm.endDate
                  }
                  className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:text-gray-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-900/20 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <FiLoader className="animate-spin text-xl" />
                  ) : (
                    "Continue"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* 3. Gear Selection */}
          {agentState.phase === "select_Gearbox" &&
            agentState.selectedCategory && (
              <div className="bg-[#1e293b]/50 border border-white/10 rounded-2xl p-5 animate-fade-in space-y-4">
                <div className="text-center pb-2">
                  <h3 className="text-lg font-bold text-white">Transmission</h3>
                  <p className="text-gray-400 text-sm">
                    Select your preference
                  </p>
                </div>

                <div className="space-y-3">
                  {(() => {
                    const gear = agentState.selectedCategory.gear;
                    if (typeof gear === "string" || !gear.availableTypes)
                      return null;
                    return gear.availableTypes.map((type) => {
                      const isSelected = selectedGearType === type;
                      const extraCost =
                        type === "automatic" && gear.automaticExtraCost
                          ? gear.automaticExtraCost
                          : 0;
                      return (
                        <button
                          key={type}
                          onClick={() =>
                            setSelectedGearType(type as "manual" | "automatic")
                          }
                          className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between group ${
                            isSelected
                              ? "border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                              : "border-white/10 bg-[#0f172b] hover:bg-[#16223b]"
                          }`}
                        >
                          <div className="text-left">
                            <p className="text-white font-bold capitalize text-lg group-hover:text-orange-400 transition-colors">
                              {type}
                            </p>
                            <p
                              className={`text-sm ${extraCost > 0 ? "text-orange-400" : "text-green-400"}`}
                            >
                              {extraCost > 0
                                ? `+£${extraCost}/day`
                                : "Included"}
                            </p>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-orange-500" : "border-gray-500"}`}
                          >
                            {isSelected && (
                              <div className="w-3 h-3 bg-orange-500 rounded-full" />
                            )}
                          </div>
                        </button>
                      );
                    });
                  })()}
                </div>
                <button
                  onClick={handleGearSelection}
                  disabled={isLoading}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg mt-2"
                >
                  Confirm Selection
                </button>
              </div>
            )}

          {/* 4. Add-ons */}
          {agentState.phase === "select_addons" &&
            agentState.availableAddOns && (
              <div className="bg-[#1e293b]/50 border border-white/10 rounded-2xl p-5 animate-fade-in space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-bold text-lg">Extras</h3>
                  <span className="bg-orange-500/10 text-orange-400 text-xs px-2 py-1 rounded-full font-medium">
                    Optional
                  </span>
                </div>
                <div className="space-y-3">
                  {agentState.availableAddOns.map((addOn) => {
                    const quantity = addOnQuantities[addOn._id] || 0;
                    const price = getAddOnPrice(addOn);
                    const isActive = quantity > 0;

                    // Check if another addon with the same type is already selected
                    const addonType = (addOn as any).type;
                    const isTypeDisabled =
                      addonType &&
                      Object.entries(addOnQuantities).some(([id, qty]) => {
                        if (qty > 0 && id !== addOn._id) {
                          const selectedAddon =
                            agentState.availableAddOns?.find(
                              (a) => a._id === id,
                            );
                          return (selectedAddon as any)?.type === addonType;
                        }
                        return false;
                      });

                    return (
                      <div
                        key={addOn._id}
                        className={`p-4 rounded-xl border transition-all ${
                          isActive
                            ? "bg-orange-500/5 border-orange-500/50 cursor-default"
                            : isTypeDisabled
                              ? "bg-white/5 border-red-500/30 opacity-60 cursor-not-allowed"
                              : "bg-[#0f172b] border-white/5 cursor-pointer"
                        }`}
                        onClick={() => {
                          if (!isActive && !isTypeDisabled) {
                            handleAddOnQuantityChange(addOn._id, 1, addonType);
                          }
                        }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-white font-bold">{addOn.name}</p>
                            <p className="text-gray-400 text-xs mt-1 max-w-[90%]">
                              {addOn.description}
                            </p>
                            {isTypeDisabled && (
                              <p className="text-red-400 text-xs mt-1">
                                Another option of this type is already selected
                              </p>
                            )}
                          </div>
                          <span
                            className={`font-bold whitespace-nowrap ${
                              isTypeDisabled
                                ? "text-gray-500"
                                : "text-orange-400"
                            }`}
                          >
                            £{price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-end">
                          <div className="flex items-center gap-3 bg-[#1e293b] rounded-lg p-1 border border-white/10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddOnQuantityChange(addOn._id, -1);
                              }}
                              disabled={quantity === 0}
                              className="w-8 h-8 flex items-center justify-center bg-white/5 rounded hover:bg-white/10 text-white disabled:opacity-30"
                            >
                              <FiMinus />
                            </button>
                            <span className="w-6 text-center text-white font-bold">
                              {quantity}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddOnQuantityChange(
                                  addOn._id,
                                  1,
                                  addonType,
                                );
                              }}
                              disabled={quantity >= 1 || isTypeDisabled}
                              className="w-8 h-8 flex items-center justify-center bg-orange-500 rounded hover:bg-orange-600 text-white disabled:bg-gray-700 disabled:opacity-50"
                            >
                              <FiPlus />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={handleConfirmAddOns}
                  disabled={isLoading}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl mt-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Processing..." : "Confirm Add-ons"}
                </button>
              </div>
            )}

          {/* 5. Summary & Receipt */}
          {agentState.phase === "show_receipt" && agentState.booking && (
            <div className="bg-[#1e293b] border border-white/10 rounded-2xl p-6 animate-fade-in shadow-xl">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 text-green-500 mb-3">
                  <FiCheck className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Booking Summary
                </h3>
              </div>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0f172b] p-3 rounded-xl border border-white/5">
                    <span className="text-gray-500 text-xs block mb-1">
                      Pickup
                    </span>
                    <span className="text-white font-bold block">
                      {agentState.booking.startDate}
                    </span>
                    <span className="text-orange-500 block text-xs">
                      {agentState.booking.startTime}
                    </span>
                  </div>
                  <div className="bg-[#0f172b] p-3 rounded-xl border border-white/5">
                    <span className="text-gray-500 text-xs block mb-1">
                      Return
                    </span>
                    <span className="text-white font-bold block">
                      {agentState.booking.endDate}
                    </span>
                    <span className="text-orange-500 block text-xs">
                      {agentState.booking.endTime}
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Price</span>
                    <span className="text-2xl font-bold text-green-400">
                      £{(agentState.booking.totalPrice || 0).toFixed(2)}
                    </span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between items-center mt-2 text-sm text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg">
                      <span>Discount Applied</span>
                      <span>-£{appliedDiscount.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Promo Code */}
                <div className="pt-2">
                  {!appliedDiscount ? (
                    <div className="flex gap-2">
                      <input
                        value={discountCode}
                        onChange={(e) =>
                          setDiscountCode(e.target.value.toUpperCase())
                        }
                        placeholder="DISCOUNT CODE"
                        className="flex-1 bg-[#0f172b] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:border-orange-500 outline-none"
                      />
                      <button
                        onClick={handleApplyDiscount}
                        disabled={discountLoading}
                        className="px-4 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-bold border border-white/5"
                      >
                        Apply
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-lg">
                      <span className="text-green-400 text-sm flex items-center gap-2">
                        <FiCheck /> {appliedDiscount.code} active
                      </span>
                      <button
                        onClick={handleRemoveDiscount}
                        className="text-gray-400 hover:text-white"
                      >
                        <FiX />
                      </button>
                    </div>
                  )}
                  {discountError && (
                    <p className="text-red-400 text-xs mt-1 ml-1">
                      {discountError}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleConfirmReceipt}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg mt-2 transition-all active:scale-[0.98]"
                >
                  {isAuthenticated
                    ? "Complete Booking"
                    : "Proceed to Verification"}
                </button>
              </div>
            </div>
          )}

          {/* 6. Verification */}
          {agentState.phase === "verify_phone" && (
            <div className="bg-[#1e293b] border border-white/10 rounded-2xl p-6 animate-fade-in text-center">
              {!agentState.verificationSent ? (
                <form onSubmit={handleSendCode} className="space-y-4">
                  <h3 className="text-white font-bold text-lg">
                    Verify Mobile Number
                  </h3>
                  <p className="text-gray-400 text-sm">
                    To secure your booking, please enter your number.
                  </p>
                  <div className="relative">
                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+44 7123 456789"
                      className="w-full bg-[#0f172b] border border-white/10 rounded-xl py-4 pl-11 text-white focus:border-orange-500 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !phoneNumber}
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg"
                  >
                    Send Code
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <h3 className="text-white font-bold text-lg">Enter Code</h3>
                  <p className="text-gray-400 text-sm">
                    Code sent to {phoneNumber}
                  </p>
                  <div className="flex justify-center">
                    <input
                      value={verificationCode}
                      onChange={(e) =>
                        setVerificationCode(e.target.value.slice(0, 6))
                      }
                      maxLength={6}
                      placeholder="000000"
                      className="w-48 text-center text-4xl tracking-[0.2em] bg-transparent border-b-2 border-orange-500 text-white focus:outline-none pb-2 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || verificationCode.length !== 6}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg"
                  >
                    Verify & Book
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 7. Success */}
          {agentState.phase === "complete" && (
            <div className="flex flex-col items-center justify-center py-10 animate-fade-in text-center h-full">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)] mb-6 animate-bounce">
                <FiCheck className="text-5xl text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Booking Confirmed!
              </h2>
              <p className="text-gray-400 max-w-xs mx-auto">
                Redirecting you to the next step...
              </p>
            </div>
          )}
        </div>

        {/* --- Bottom Action Bar (Fixed) --- */}
        {(isInputPhase || canReturn) && (
          <div className="absolute bottom-0 -mb-3 left-0 right-0 bg-[#0f172b]/50 backdrop-blur-md border-t border-white/5 p-4 z-30 pb-6 md:pb-4">
            <div className="flex items-center gap-4 max-w-lg mx-auto relative">
              {/* Back Button */}
              {canReturn && (
                <button
                  onClick={goBack}
                  disabled={isLoading}
                  className="absolute left-0 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <span className="text-xs font-bold   uppercase">Back</span>
                </button>
              )}

              {/* Voice Interaction Area - Centered */}
              <div className="flex-1 flex flex-col items-center justify-center">
                {isInputPhase ? (
                  <div className="relative group">
                    {/* Visual Rings */}
                    {isRecording && (
                      <div className="absolute inset-0 rounded-full bg-red-500 opacity-20 animate-ripple"></div>
                    )}
                    {isPlaying && (
                      <div className="absolute inset-0 rounded-full bg-green-500 opacity-20 animate-ripple"></div>
                    )}

                    <button
                      onClick={toggleRecording}
                      disabled={
                        isPlaying ||
                        isLoading ||
                        agentState.verificationSent ||
                        isTranscribing
                      }
                      className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform ${
                        isLoading || isTranscribing
                          ? "bg-gray-700 cursor-wait scale-100"
                          : isRecording
                            ? "bg-red-500 scale-110 shadow-red-500/40"
                            : isPlaying
                              ? "bg-green-500 scale-105 shadow-green-500/40"
                              : "bg-linear-to-tr from-orange-500 to-amber-500 hover:scale-105 shadow-orange-500/30"
                      } text-white disabled:opacity-80`}
                    >
                      {/* Loading State for AI Processing */}
                      {isLoading || isTranscribing ? (
                        <FiLoader className="w-6 h-6 animate-spin text-gray-300" />
                      ) : isRecording ? (
                        <div className="flex gap-0.5 items-end justify-center h-4 w-4">
                          <div
                            className="w-1 bg-white animate-wave"
                            style={{ animationDelay: "0s" }}
                          ></div>
                          <div
                            className="w-1 bg-white animate-wave"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-1 bg-white animate-wave"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      ) : (
                        <FiMic className="w-7 h-7" />
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="h-16" />
                )}

                {/* Dynamic Status Text */}
                <p className="text-xs text-gray-400 mt-2 font-medium tracking-wide">
                  {isTranscribing
                    ? "Converting to text..."
                    : isLoading
                      ? "Thinking..."
                      : isRecording
                        ? "Listening..."
                        : "Tap to Speak"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>
        {datePickerStyles}
      </style>
    </div>,
    document.body,
  );
}

// --- Suggestion Card Component (Enhanced) ---
function SuggestionCard({
  category,
  onSelect,
  isLoading,
}: {
  category: CategorySuggestion;
  onSelect: () => void;
  isLoading: boolean;
}) {
  return (
    <div
      onClick={!isLoading ? onSelect : undefined}
      className="group relative rounded-2xl overflow-hidden cursor-pointer border border-white/5 bg-[#1e293b] hover:border-orange-500/50 transition-all hover:shadow-[0_0_20px_rgba(249,115,22,0.15)] hover:-translate-y-1"
    >
      <div className="relative h-40 w-full bg-linear-to-b from-[#0f172b] to-[#1e293b]">
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-700 flex-col gap-2">
            <FiTruck className="text-3xl text-gray-600" />
            <span className="text-xs">No Image</span>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-green-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg uppercase tracking-wide">
          {category.matchScore}% Match
        </div>
      </div>

      <div className="p-4 relative bg-[#1e293b]">
        {/* Separator */}
        <div className="absolute top-0 left-4 right-4 h-px bg-white/5"></div>

        <h3 className="text-base font-bold text-white mb-1 group-hover:text-orange-400 transition-colors">
          {category.name}
        </h3>
        <p className="text-gray-400 text-xs mb-3 line-clamp-2 h-8 leading-relaxed">
          {category.matchReason}
        </p>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
          <Badge icon={<FiUsers />} text={category.seats} />
          <Badge icon={<BsFuelPump />} text={category.fuel} />
          <Badge icon={<MdDoorSliding />} text={`${category.doors}`} />
        </div>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white">
              £{category.pricingTiers?.[0]?.pricePerDay || 0}
            </span>
            <span className="text-gray-500 text-[10px] uppercase">Per Day</span>
          </div>
          <div className="px-5 py-2 bg-white/5 group-hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors border border-white/5 group-hover:border-transparent">
            Select
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string | number;
}) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0f172b] border border-white/5 text-[10px] font-medium text-gray-300 whitespace-nowrap">
      <span className="text-orange-500 text-xs">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
