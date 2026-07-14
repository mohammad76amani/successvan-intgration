"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DateRange, Range } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import {
  FiCalendar,
  FiClock,
  FiMic,
  FiMapPin,
  FiTruck,
  FiUser,
} from "react-icons/fi";
import { showToast } from "../../lib/toast";
import { Office, Category, Type } from "../../types/type";
import CustomSelect from "../../components/ui/CustomSelect";
import { generateTimeSlots } from "../../utils/timeSlots";
import TimeSelect from "../../components/ui/TimeSelect";
import { useVoiceRecording } from "../../hooks/useVoiceRecording";
import VoiceConfirmationModal from "../../components/global/VoiceConfirmationModal";
import ConversationalModal from "../../components/global/ConversationalModal";
import FastAgentModal from "../../components/global/FastAgentModal";
import { FiCpu } from "react-icons/fi";
import { datePickerStyles } from "../global/DatePickerStyles";
import {
  ReservationFormProps,
  FormData,
  ReservedSlot,
  VoiceData,
  ExtractedVoiceData,
  ConversationData,
  RentalDetails,
  WorkingTime,
  TimeSlotInfo,
} from "../../types/reservation-form";
import { createLondonDateTime, getLondonTime } from "@/lib/englandTime";
import FullScreenMobileCalendar from "../global/FullScreenMobileCalendar";
import {
  calculateOfficeExtensionPrices,
  findSpecialDayForDate,
  getSpecialDayPickupWindow,
  getSpecialDayReturnWindow,
  getWorkingDayExtensionRanges,
  getWorkingDayTimeSlots,
  getWorkingDayWindow,
  isSameCalendarDate,
} from "@/lib/specialDaySchedule";

const formatDateForStorage = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function AdminReservationForm({
  isModal = false,
  isInline = false,
  onClose,
  onBookNow,
  isAdminMode = false,
}: ReservationFormProps) {
  const router = useRouter();
  const [showDateRange, setShowDateRange] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Prevent background scroll when date picker is open (desktop only)
  useEffect(() => {
    if (showDateRange) {
      // Only lock scroll on desktop (md breakpoint and above)
      if (window.innerWidth >= 768) {
        document.body.style.overflow = "hidden";
      }
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showDateRange]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [types, setTypes] = useState<Type[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<Type[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [startDateReservedSlots, setStartDateReservedSlots] = useState<
    ReservedSlot[]
  >([]);
  const [endDateReservedSlots, setEndDateReservedSlots] = useState<
    ReservedSlot[]
  >([]);

  // Voice modal state
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [voiceData, setVoiceData] = useState<ExtractedVoiceData | null>(null);

  // Conversational modal state
  const [showConversationalModal, setShowConversationalModal] =
    useState<boolean>(false);

  // Fast AI Agent modal state (quick 1-minute booking)
  const [showFastAgentModal, setShowFastAgentModal] = useState<boolean>(false);

  // Tooltip visibility for same-day reservations
  const [showSameDayTooltip, setShowSameDayTooltip] = useState<boolean>(true);
  const [showAgeTooltip, setShowAgeTooltip] = useState<boolean>(false);

  // Admin-only manual extension override (pickup / return flat prices)
  const [isManualExtension, setIsManualExtension] = useState<boolean>(false);
  const [manualPickupExtension, setManualPickupExtension] =
    useState<string>("");
  const [manualReturnExtension, setManualReturnExtension] =
    useState<string>("");

  // Initialize with undefined to avoid hydration mismatch
  const [dateRange, setDateRange] = useState<Range[]>([
    {
      startDate: undefined,
      endDate: undefined,
      key: "selection",
    },
  ]);

  // *** تغییر: تنظیم dates بر اساس زمان انگلیس (برای جلوگیری از رزرو امروز و فردا اگر بعد 16:00 باشد) ***
  useEffect(() => {
    const londonNow = getLondonTime();
    const hours = londonNow.getUTCHours();
    console.log(hours, "london time");

    let minDaysToAdd = 1;
    // Admin can book from today, customers follow 2-day rule
    if (isAdminMode) {
      minDaysToAdd = 0;
    } else if (hours >= 16) {
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
  }, [isAdminMode]);

  const [formData, setFormData] = useState<FormData>({
    office: "",
    type: "",
    pickupTime: "",
    returnTime: "",
    driverAge: "",
    message: "",
    name: "",
    email: "",
    phoneNumber: "",
  });

  const pickupTimeSlots = useMemo(() => {
    if (!formData.office || !dateRange[0].startDate) return [];
    const office = offices?.find((o) => o._id === formData.office);
    if (!office) return [];

    const date = dateRange[0].startDate;
    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][date.getDay()] as WorkingTime["day"];

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
      // Regular working days can have extensions
      const workingDay = office.workingTime?.find(
        (w: WorkingTime) => w.day === dayName && w.isOpen,
      );
      if (workingDay) {
        slots = getWorkingDayTimeSlots(workingDay, "pickup", 15);
      } else {
        slots = generateTimeSlots(start, end, 15);
      }
    }

    // Admin can pick up at any time from 06:00 to 23:45 regardless of office
    // working hours; extension is charged manually in admin mode.
    if (isAdminMode) {
      slots = generateTimeSlots("06:00", "23:45", 15);
    }

    // If pickup and return are on the same date and return time is selected,
    // ensure pickup slots do not allow a duration less than 6 hours.
    if (
      dateRange[0].endDate &&
      dateRange[0].startDate &&
      dateRange[0].startDate.toDateString() ===
        dateRange[0].endDate.toDateString() &&
      formData.returnTime
    ) {
      const [retHour, retMin] = formData.returnTime.split(":").map(Number);
      const retMinutes = retHour * 60 + retMin;
      const maxPickupMinutes = retMinutes - 6 * 60;
      // If maxPickupMinutes < 0 then no pickup slots are valid (same-day 6h rule impossible)
      if (maxPickupMinutes < 0) {
        slots = [];
      } else {
        slots = slots.filter((s) => {
          const [h, m] = s.split(":").map(Number);
          const minutes = h * 60 + m;
          return minutes <= maxPickupMinutes;
        });
      }
    }

    return slots;
  }, [formData.office, dateRange, offices, formData.returnTime, isAdminMode]);

  const returnTimeSlots = useMemo(() => {
    if (!formData.office || !dateRange[0].endDate) return [];
    const office = offices?.find((o) => o._id === formData.office);
    if (!office) return [];

    const date = dateRange[0].endDate;
    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][date.getDay()] as WorkingTime["day"];

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
      // Regular working days can have extensions
      const workingDay = office.workingTime?.find(
        (w: WorkingTime) => w.day === dayName && w.isOpen,
      );
      if (workingDay) {
        slots = getWorkingDayTimeSlots(workingDay, "return", 15);
      } else {
        slots = generateTimeSlots(start, end, 15);
      }
    }

    // Admin can return at any time from 06:00 to 23:45 regardless of office
    // working hours; extension is charged manually in admin mode.
    if (isAdminMode) {
      slots = generateTimeSlots("06:00", "23:45", 15);
    }

    // If pickup and return are on the same date and pickup time is selected,
    // ensure return slots respect minimum 6 hours duration.
    if (
      dateRange[0].startDate &&
      dateRange[0].endDate &&
      dateRange[0].startDate.toDateString() ===
        dateRange[0].endDate.toDateString() &&
      formData.pickupTime
    ) {
      const [pickHour, pickMin] = formData.pickupTime.split(":").map(Number);
      const pickMinutes = pickHour * 60 + pickMin;
      const minReturnMinutes = pickMinutes + 6 * 60;
      // If minReturnMinutes > 1439 then no return slots are valid (same-day 6h rule impossible)
      if (minReturnMinutes > 1439) {
        slots = [];
      } else {
        slots = slots.filter((s) => {
          const [h, m] = s.split(":").map(Number);
          const minutes = h * 60 + m;
          return minutes >= minReturnMinutes;
        });
      }
    }

    return slots;
  }, [formData.office, dateRange, offices, formData.pickupTime, isAdminMode]);

  // Calculate minimum driver age based on selected type
  const minDriverAge = useMemo(() => {
    if (!formData.type) return 23;
    const selectedType = types.find((t) => t._id === formData.type);
    return selectedType?.name?.toLowerCase() === "minibus" ? 25 : 23;
  }, [formData.type, types]);

  // Initialize voice recording hook
  const { isRecording, isProcessing, toggleRecording } = useVoiceRecording({
    onTranscriptionComplete: (result: ExtractedVoiceData) => {
      console.log("📥 [Form] Voice result received:", result);

      // Store the voice data and show modal for confirmation
      setVoiceData(result);
      setShowVoiceModal(true);
    },
    onError: (error: Error) => {
      showToast.error(error.message);
    },
    autoSubmit: false, // Set to true if you want automatic submission
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        setIsAuthenticated(true);
        // setUserData(parsedUser);
        setFormData((prev) => ({
          ...prev,
          name: parsedUser.name || "",
          email: parsedUser.emaildata?.emailAddress || "",
          phoneNumber: parsedUser.phoneData?.phoneNumber || "",
        }));
      } catch (error) {
        console.log("Failed to parse user data");
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [offRes, typeRes] = await Promise.all([
          fetch("/api/offices?status=active"),
          fetch("/api/types?status=active"),
        ]);
        const offData = await offRes.json();
        const typeData = await typeRes.json();
        setOffices(offData.data || []);
        setTypes(typeData.data || []);
      } catch (error) {
        console.log("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  // Fetch and filter categories based on office and type
  useEffect(() => {
    if (formData.office && formData.type) {
      fetch(`/api/offices/${formData.office}`)
        .then((res) => res.json())
        .then((data) => {
          const office = data.data;
          if (office?.categories && office.categories.length > 0) {
            const filtered = office.categories.filter((cat: any) => {
              const catTypeId =
                typeof cat.type === "string" ? cat.type : cat.type?._id;
              return catTypeId === formData.type;
            });
            setCategories(filtered);
          } else {
            setCategories([]);
          }
        })
        .catch((err) => console.log(err));
    } else {
      setCategories([]);
    }
  }, [formData.office, formData.type]);

  // Filter types based on selected office
  useEffect(() => {
    if (formData.office) {
      const filtered = types.filter((type: Type) => {
        return (
          type.offices &&
          type.offices.some((office) => {
            const officeId = typeof office === "string" ? office : office._id;
            return officeId === formData.office;
          })
        );
      });
      setFilteredTypes(filtered);
    } else {
      setFilteredTypes(types);
    }
  }, [formData.office, types]);

  useEffect(() => {
    if (formData.office && dateRange[0].startDate) {
      const date = dateRange[0].startDate;
      const startDate = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      setStartDateReservedSlots([]);
      fetch(
        `/api/reservations/by-office?office=${formData.office}&startDate=${startDate}&type=start`,
      )
        .then((res) => res.json())
        .then((data) => {
          setStartDateReservedSlots(data.data?.reservedSlots || []);
        })
        .catch((err) => console.log(err));
    }
  }, [formData.office, dateRange[0].startDate]);

  useEffect(() => {
    if (formData.office && dateRange[0].endDate) {
      const date = dateRange[0].endDate;
      const endDate = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      setEndDateReservedSlots([]);
      fetch(
        `/api/reservations/by-office?office=${formData.office}&endDate=${endDate}&type=end`,
      )
        .then((res) => res.json())
        .then((data) => {
          setEndDateReservedSlots(data.data?.reservedSlots || []);
        })
        .catch((err) => console.log(err));
    }
  }, [formData.office, dateRange[0].endDate]);

  const handleGlobalVoice = () => {
    console.log("  [Form] Voice button clicked");
    toggleRecording();
  };

  const handleAIAgentMode = () => {
    console.log("  [Form] Starting Fast AI Agent mode");
    setShowFastAgentModal(true);
  };

  const handleFastAgentComplete = (
    reservationId: string,
    userToken: string,
    isNewUser: boolean,
  ) => {
    console.log(
      "✅ [Form] Fast Agent completed booking:",
      reservationId,
      "isNewUser:",
      isNewUser,
    );
    setShowFastAgentModal(false);

    // Store the token if provided
    if (userToken) {
      localStorage.setItem("token", userToken);
    }

    showToast.success("Booking created successfully!");

    // Close any parent modal before navigation
    if (onClose) {
      onClose();
    }

    // Navigate based on whether it's a new user
    if (isNewUser) {
      router.push(`/customerDashboard?uploadLicense=true`);
    } else {
      router.push(`/customerDashboard`);
    }
  };

  const handleConversationComplete = (data: ConversationData) => {
    console.log("✅ [Form] Conversation completed with data:", data);
    setShowConversationalModal(false);

    // Update form with conversation data
    setFormData((prev) => ({
      ...prev,
      office: data.office || prev.office,
      type: data.type || prev.type,
      pickupTime: data.pickupTime || prev.pickupTime,
      returnTime: data.returnTime || prev.returnTime,
      driverAge: data.driverAge || prev.driverAge,
      message: data.message || prev.message,
    }));

    // Update date range if provided
    if (data.pickupDate && data.returnDate) {
      setDateRange([
        {
          startDate: new Date(data.pickupDate),
          endDate: new Date(data.returnDate),
          key: "selection",
        },
      ]);
    }

    showToast.success("Reservation details filled via conversation!");
  };

  const handleVoiceConfirm = (data: VoiceData) => {
    console.log("✅ [Form] User confirmed voice data:", data);

    // Update form with confirmed data
    setFormData((prev) => ({
      ...prev,
      office: data.office || prev.office,
      type: data.type || prev.type,
      pickupTime: data.pickupTime || prev.pickupTime,
      returnTime: data.returnTime || prev.returnTime,
      driverAge: data.driverAge || prev.driverAge,
      message: data.message || prev.message,
    }));

    // Update date range if provided
    if (data.pickupDate && data.returnDate) {
      console.log("📅 [Form] Updating date range:", {
        pickup: data.pickupDate,
        return: data.returnDate,
      });

      setDateRange([
        {
          startDate: new Date(data.pickupDate),
          endDate: new Date(data.returnDate),
          key: "selection",
        },
      ]);
    }

    console.log("✅ [Form] Form updated with voice data");
    showToast.success("Form filled successfully!");
  };

  // const handleAutoSubmit = async (data: VoiceData) => {
  //   try {
  //     // Store rental details in sessionStorage
  //     const pickupDateTime = new Date(data.pickupDate || "");
  //     const returnDateTime = new Date(data.returnDate || "");

  //     const rentalDetails: RentalDetails = {
  //       office: data.office || "",
  //       type: data.type || "",
  //       pickupDate: pickupDateTime.toISOString(),
  //       returnDate: returnDateTime.toISOString(),
  //       pickupTime: data.pickupTime || "",
  //       returnTime: data.returnTime || "",
  //       pickupLocation: offices.find((o) => o._id === data.office)?.name || "",
  //       driverAge: data.driverAge || "",
  //       message: data.message || "",
  //     };
  //     sessionStorage.setItem("rentalDetails", JSON.stringify(rentalDetails));

  //     // Navigate to reservation page
  //     const url = `/reservation?type=${data.type}&office=${data.office}&age=${data.driverAge}`;
  //     router.push(url);
  //   } catch (error) {
  //     showToast.error("Failed to process reservation");
  //   }
  // };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    if (name === "driverAge") {
      setShowAgeTooltip(false);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleTimeChange = (name: string, time: string) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: time };

      // Enforce 6-hour minimum if pickup and return are the same date
      if (
        dateRange[0].startDate &&
        dateRange[0].endDate &&
        dateRange[0].startDate.toDateString() ===
          dateRange[0].endDate.toDateString()
      ) {
        if (name === "pickupTime" && prev.returnTime) {
          const [pickH, pickM] = time.split(":").map(Number);
          const [retH, retM] = prev.returnTime.split(":").map(Number);
          const pickMinutes = pickH * 60 + pickM;
          const retMinutes = retH * 60 + retM;
          if (retMinutes - pickMinutes < 6 * 60) {
            // Clear return time as it's no longer valid
            next.returnTime = "";
            showToast.error("Minimum reservation on the same day is 6 hours");
          }
        }

        if (name === "returnTime" && prev.pickupTime) {
          const [retH, retM] = time.split(":").map(Number);
          const [pickH, pickM] = prev.pickupTime.split(":").map(Number);
          const pickMinutes = pickH * 60 + pickM;
          const retMinutes = retH * 60 + retM;
          if (retMinutes - pickMinutes < 6 * 60) {
            // Clear return time as it's the invalid value being changed.
            next.returnTime = "";
            showToast.error("Minimum reservation on the same day is 6 hours");
          }
        }
      }

      // Show age tooltip when return time is selected and age is empty
      if (name === "returnTime" && time && !formData.driverAge) {
        setShowAgeTooltip(true);
      }

      return next;
    });
  };

  const getSelectedOffice = (): Office | undefined => {
    return offices?.find((o) => o._id === formData.office);
  };

  // When admin enters a manual extension price, the TimeSelect must show that
  // price (not the office flat price) on out-of-hours slots. Build the
  // extensionTimes object from the manual value + the office's normal window.
  const buildManualExtensionTimes = (
    date: Date,
    kind: "pickup" | "return",
    slots: string[],
  ) => {
    const office = getSelectedOffice();
    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][date.getDay()] as WorkingTime["day"];
    const workingDay = office?.workingTime?.find(
      (w) => w.day === dayName && w.isOpen,
    );
    const win = workingDay ? getWorkingDayWindow(workingDay, kind) : undefined;
    const price =
      (kind === "pickup"
        ? parseFloat(manualPickupExtension)
        : parseFloat(manualReturnExtension)) || 0;
    return {
      start: slots[0] || win?.startTime || "06:00",
      end: slots[slots.length - 1] || win?.endTime || "23:45",
      // Slots outside the normal window get the +£ indicator. If the office
      // has no window that day, normalStart === normalEnd marks every slot.
      normalStart: win?.startTime || "00:00",
      normalEnd: win?.endTime || "00:00",
      price,
    };
  };

  // Admin-only manual extension override block (reused on desktop + mobile)
  const renderManualExtension = () => {
    if (!isAdminMode) return null;
    return (
      <div className="bg-amber-500/5 border border-amber-400/30 rounded-lg p-3 space-y-3">
        <label className="flex items-center gap-2 text-amber-300 text-sm font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={isManualExtension}
            onChange={(e) => setIsManualExtension(e.target.checked)}
            className="accent-amber-500"
          />
          Manual extension price (out-of-hours)
        </label>
        {isManualExtension && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-white/70 text-xs mb-1">
                Pickup extension (£)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={manualPickupExtension}
                onChange={(e) => setManualPickupExtension(e.target.value)}
                placeholder="0"
                className="w-full bg-white/10 border border-white/20 rounded-lg text-white px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-white/70 text-xs mb-1">
                Return extension (£)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={manualReturnExtension}
                onChange={(e) => setManualReturnExtension(e.target.value)}
                placeholder="0"
                className="w-full bg-white/10 border border-white/20 rounded-lg text-white px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const isDateDisabled = (date: Date): boolean => {
    const office = getSelectedOffice();
    if (!office) return false;

    // *** تغییر جزئی: استفاده از getLondonTime برای محاسبه ماه/روز، اما اینجا لازم نیست چون date ورودی است ***
    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][date.getDay()] as WorkingTime["day"];

    // Check special days first
    const specialDay = findSpecialDayForDate(office.specialDays, date);
    if (specialDay && !specialDay.isOpen) return true;

    // Check working hours
    const workingDay = office.workingTime?.find((w) => w.day === dayName);
    if (workingDay && !workingDay.isOpen) return true;

    return false;
  };

  const getAvailableTimeSlots = (date: Date): TimeSlotInfo => {
    const office = getSelectedOffice();
    if (!office) return { start: "00:00", end: "23:59", info: "" };

    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][date.getDay()] as WorkingTime["day"];

    // Check special days first
    const specialDay = findSpecialDayForDate(office.specialDays, date);
    if (specialDay && specialDay.isOpen) {
      const pickupWindow = getSpecialDayPickupWindow(specialDay);
      const returnWindow = getSpecialDayReturnWindow(specialDay);

      return {
        start: pickupWindow.startTime,
        end: returnWindow.endTime,
        info: `Special day: ${specialDay.reason || "Special Day"} (Pickup ${pickupWindow.startTime} - ${pickupWindow.endTime}, Return ${returnWindow.startTime} - ${returnWindow.endTime})`,
      };
    }

    // Use working hours
    const workingDay = office.workingTime?.find((w) => w.day === dayName);
    if (workingDay && workingDay.isOpen) {
      const pickupWindow = getWorkingDayWindow(workingDay, "pickup");
      const returnWindow = getWorkingDayWindow(workingDay, "return");
      let info = `${workingDay.day}: Pickup ${
        pickupWindow.isOpen
          ? `${pickupWindow.startTime} - ${pickupWindow.endTime}`
          : "Closed"
      }, Return ${
        returnWindow.isOpen
          ? `${returnWindow.startTime} - ${returnWindow.endTime}`
          : "Closed"
      }`;

      const pickupExtensionRanges = getWorkingDayExtensionRanges(
        workingDay,
        "pickup",
      );
      const returnExtensionRanges = getWorkingDayExtensionRanges(
        workingDay,
        "return",
      );

      if (pickupExtensionRanges.length > 0 || returnExtensionRanges.length > 0) {
        info += " ";
        if (pickupExtensionRanges.length > 0) {
          info += `🟡 Pickup ext: ${pickupExtensionRanges
            .map((range) => `${range.startTime} - ${range.endTime}`)
            .join(", ")} (+£${pickupExtensionRanges[0].flatPrice}) `;
        }
        if (returnExtensionRanges.length > 0) {
          info += `🟡 Return ext: ${returnExtensionRanges
            .map((range) => `${range.startTime} - ${range.endTime}`)
            .join(", ")} (+£${returnExtensionRanges[0].flatPrice})`;
        }
      }

      return {
        start: pickupWindow.startTime,
        end: returnWindow.endTime,
        info,
      };
    }

    return { start: "00:00", end: "23:59", info: "" };
  };

  useEffect(() => {
    setFormData((prev) => {
      const isPickupInvalid = Boolean(
        prev.pickupTime &&
          pickupTimeSlots.length > 0 &&
          !pickupTimeSlots.includes(prev.pickupTime),
      );
      const isReturnInvalid = Boolean(
        prev.returnTime &&
          returnTimeSlots.length > 0 &&
          !returnTimeSlots.includes(prev.returnTime),
      );

      if (!isPickupInvalid && !isReturnInvalid) {
        return prev;
      }

      return {
        ...prev,
        pickupTime: isPickupInvalid ? "" : prev.pickupTime,
        returnTime: isReturnInvalid ? "" : prev.returnTime,
      };
    });
  }, [pickupTimeSlots, returnTimeSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const age = parseInt(formData.driverAge, 10);

    // Validation for age
    if (isNaN(age) || age < minDriverAge || age > 80) {
      showToast.error(
        `Driver age must be between ${minDriverAge} and 80 years`,
      );
      setIsSubmitting(false);
      return;
    }

    // Validation: if pickup and return dates are the same, ensure minimum 6 hours
    if (
      dateRange[0].startDate &&
      dateRange[0].endDate &&
      dateRange[0].startDate.toDateString() ===
        dateRange[0].endDate.toDateString()
    ) {
      if (!formData.pickupTime || !formData.returnTime) {
        showToast.error(
          "Please select pickup and return times (minimum 6 hours)",
        );
        setIsSubmitting(false);
        return;
      }
      const [pickH, pickM] = formData.pickupTime.split(":").map(Number);
      const [retH, retM] = formData.returnTime.split(":").map(Number);
      const pickMinutes = pickH * 60 + pickM;
      const retMinutes = retH * 60 + retM;
      if (retMinutes - pickMinutes < 6 * 60) {
        showToast.error("Minimum reservation on the same day is 6 hours");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const pickupDateTimeISO = createLondonDateTime(
        dateRange[0].startDate || new Date(),
        formData.pickupTime,
      );
      const returnDateTimeISO = createLondonDateTime(
        dateRange[0].endDate || new Date(),
        formData.returnTime,
      );

      const office = offices?.find((o) => o._id === formData.office);
      const autoExtensionPrices = office
        ? calculateOfficeExtensionPrices({
            office,
            pickupDate: dateRange[0].startDate,
            pickupTime: formData.pickupTime,
            returnDate: dateRange[0].endDate,
            returnTime: formData.returnTime,
          })
        : { pickupExtension: 0, returnExtension: 0 };

      // Admin can override the extension prices manually.
      const useManualExtension = isAdminMode && isManualExtension;
      const extensionPrices = useManualExtension
        ? {
            pickupExtension: parseFloat(manualPickupExtension) || 0,
            returnExtension: parseFloat(manualReturnExtension) || 0,
          }
        : autoExtensionPrices;
      const extensionCost =
        extensionPrices.pickupExtension + extensionPrices.returnExtension;

      const rentalDetails: RentalDetails = {
        office: formData.office,
        type: formData.type,
        pickupDate: pickupDateTimeISO,
        returnDate: returnDateTimeISO,
        pickupTime: formData.pickupTime,
        returnTime: formData.returnTime,
        pickupLocation:
          offices?.find((o) => o._id === formData.office)?.name || "",
        driverAge: formData.driverAge,
        message: formData.message,
        pickupExtensionPrice: extensionPrices.pickupExtension,
        returnExtensionPrice: extensionPrices.returnExtension,
        extensionCost,
        isManualExtension: useManualExtension,
        startDateDisplay: dateRange[0].startDate
          ? formatDateForStorage(dateRange[0].startDate)
          : "",
        endDateDisplay: dateRange[0].endDate
          ? formatDateForStorage(dateRange[0].endDate)
          : "",
      };
      sessionStorage.setItem("rentalDetails", JSON.stringify(rentalDetails));

      // Open modal instead of redirecting
      if (onBookNow) {
        onBookNow();
        if (onClose) onClose();
      } else {
        const url = `/reservation?type=${formData.type}&office=${formData.office}&age=${formData.driverAge}`;
        router.push(url);
      }
    } catch (error) {
      showToast.error("Reservation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={
        isInline
          ? "space-y-0 bg-white/5 py-8 px-4 rounded-xl backdrop-blur-lg border border-gray-500/50"
          : "space-y-6"
      }
    >
      <div
        className={
          isInline
            ? "grid grid-cols-8 gap-1 mx-auto justify-center items-end"
            : "hidden md:grid grid-cols-2 gap-4"
        }
      >
        {/* Office */}
        <div>
          <label
            className={`text-white font-semibold mb-2 flex items-center gap-2 ${
              isInline ? "text-xs mb-1" : "text-sm"
            }`}
          >
            <FiMapPin className="text-amber-400 text-lg" /> Office
          </label>
          <CustomSelect
            options={offices.filter(
              (o): o is Office & { _id: string } => !!o._id,
            )}
            value={formData.office}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, office: val }))
            }
            placeholder="Select Office"
            isInline={isInline}
            id="gtm-reservation-office"
          />
        </div>

        {/* Type */}
        <div>
          <label
            className={`text-white font-semibold mb-2 flex items-center gap-2 ${
              isInline ? "text-xs mb-1" : "text-sm"
            }`}
          >
            <FiTruck className="text-amber-400 text-lg relative" /> Type
          </label>
          <CustomSelect
            options={filteredTypes.filter(
              (t): t is Type & { _id: string } => !!t._id,
            )}
            value={formData.type}
            onChange={(val) => setFormData((prev) => ({ ...prev, type: val }))}
            placeholder="Select Type"
            isInline={isInline}
            disabled={!formData.office}
            id="gtm-reservation-type"
          />
        </div>

        {/* Date Range */}
        <div>
          <label
            className={`text-white font-semibold mb-2 flex items-center gap-2 ${
              isInline ? "text-xs mb-1" : "text-sm"
            }`}
          >
            <FiCalendar className="text-amber-400 text-lg" /> Dates
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDateRange(!showDateRange)}
              disabled={!formData.office || !formData.type}
              id="gtm-reservation-dates"
              className={`w-full bg-white/10 border border-white/20 rounded-lg text-white text-left focus:outline-none focus:border-amber-400 transition-colors ${
                isInline ? "px-2 py-2 text-xs" : "px-4 py-3 text-sm"
              } ${!formData.office || !formData.type ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {dateRange[0]?.startDate && dateRange[0]?.endDate
                ? `${formatDate(dateRange[0].startDate)} - ${formatDate(
                    dateRange[0].endDate,
                  )}`
                : "Select Dates"}
            </button>
            {showDateRange && (
              <div className="absolute right-0 -top-44 mt-2 min-h-40 max-h-110 overflow-y-auto z-50 bg-slate-800 backdrop-blur-xl border border-white/20 rounded-lg p-4 w-70 sm:w-75">
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
                  minDate={
                    isAdminMode
                      ? (() => {
                          const today = new Date();
                          today.setDate(today.getDate() - 30);
                          today.setHours(0, 0, 0, 0);
                          return today;
                        })()
                      : (() => {
                          try {
                            const londonNow = getLondonTime();
                            const hours = londonNow.getUTCHours();

                            let minDaysToAdd = 1;
                            if (hours >= 16) {
                              minDaysToAdd = 2;
                            }

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
                        })()
                  }
                  // *** جدید: maxDate تا پایان سال جاری ***
                  maxDate={
                    isAdminMode
                      ? (() => {
                          const nextYear = new Date();
                          nextYear.setFullYear(nextYear.getFullYear() + 1);
                          nextYear.setMonth(11, 31);
                          nextYear.setHours(23, 59, 59, 999);
                          return nextYear;
                        })()
                      : (() => {
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
                        })()
                  }
                  rangeColors={["#fbbf24"]}
                  months={12}
                  scroll={{ enabled: true }}
                  showMonthAndYearPickers={true}
                  moveRangeOnFirstSelection={false}
                  retainEndDateOnFirstSelection={false}
                  editableDateInputs={true}
                  dragSelectionEnabled={true}
                  disabledDates={
                    formData.office
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
          </div>
        </div>

        {/* Pickup Time */}
        <div>
          <label
            className={`text-white font-semibold mb-2 flex items-center gap-2 ${
              isInline ? "text-xs mb-1" : "text-sm"
            }`}
          >
            <FiClock className="text-amber-400 text-lg" /> From
          </label>

          {dateRange[0].startDate &&
            (() => {
              const office = getSelectedOffice();
              const date = dateRange[0].startDate;
              const dayName = [
                "sunday",
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
              ][date.getDay()];

              // Check if this is a special day
              const specialDay = office
                ? findSpecialDayForDate(office.specialDays, date)
                : undefined;

              let specialDayInfo = undefined;
              let extensionTimes = undefined;

              if (isAdminMode && isManualExtension) {
                // Admin override: show the manually entered extension price
                extensionTimes = buildManualExtensionTimes(
                  date,
                  "pickup",
                  pickupTimeSlots,
                );
              } else if (specialDay && specialDay.isOpen) {
                // Special day - show blue indicator with price
                specialDayInfo = {
                  reason: specialDay.reason || "Special Day",
                  price: specialDay.extraPrice || 0,
                };
              } else {
                // Regular day - show extension times if available
                const workingDay = office?.workingTime?.find(
                  (w: any) => w.day === dayName && w.isOpen,
                );
                const pickupWindow = workingDay
                  ? getWorkingDayWindow(workingDay, "pickup")
                  : undefined;
                extensionTimes = workingDay?.pickupExtension
                  ? {
                      start: pickupTimeSlots[0],
                      end: pickupTimeSlots[pickupTimeSlots.length - 1],
                      normalStart: pickupWindow?.startTime || "00:00",
                      normalEnd: pickupWindow?.endTime || "23:59",
                      price: workingDay.pickupExtension.flatPrice,
                    }
                  : undefined;
              }

              return (
                <TimeSelect
                  value={formData.pickupTime}
                  onChange={(time) => handleTimeChange("pickupTime", time)}
                  slots={pickupTimeSlots}
                  reservedSlots={startDateReservedSlots}
                  isInline={isInline}
                  tooltip={getAvailableTimeSlots(dateRange[0].startDate).info}
                  selectedDate={dateRange[0].startDate}
                  isStartTime={true}
                  specialDayInfo={specialDayInfo}
                  extensionTimes={extensionTimes}
                  disabled={
                    !formData.office ||
                    !formData.type ||
                    !dateRange[0].startDate
                  }
                  id="gtm-reservation-pickup-time"
                />
              );
            })()}
        </div>

        {/* Return Time */}
        <div className="">
          {/* Info for same-day reservation */}
          {/* Tooltip for same-day reservation info */}
          <div className="relative w-full">
            {dateRange[0].startDate &&
              dateRange[0].endDate &&
              dateRange[0].startDate.toDateString() ===
                dateRange[0].endDate.toDateString() &&
              showSameDayTooltip && (
                <div className="absolute -top-7 left-11 z-20 px-3 py-1 bg-slate-900 border border-amber-400/30 rounded text-amber-300 text-xs whitespace-nowrap shadow-lg pointer-events-auto flex items-center gap-2">
                  <span>
                    Reservations less than 24 hours <br /> are calculated as{" "}
                    <b>1 day</b>.
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSameDayTooltip(false)}
                    aria-label="Close tooltip"
                    className="ml-2 text-amber-200 hover:text-amber-100 text-sm leading-none px-2 py-0.5 rounded focus:outline-none"
                  >
                    ×
                  </button>
                </div>
              )}
          </div>
          <label
            className={`text-white font-semibold mb-2 flex items-center gap-2 ${
              isInline ? "text-xs mb-1" : "text-sm"
            }`}
          >
            <FiClock className="text-amber-400 text-lg" /> To
          </label>
          {dateRange[0].endDate &&
            (() => {
              const office = getSelectedOffice();
              const date = dateRange[0].endDate;
              const dayName = [
                "sunday",
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
              ][date.getDay()];

              // Check if this is a special day
              const specialDay = office
                ? findSpecialDayForDate(office.specialDays, date)
                : undefined;
              const pickupSpecialDay =
                office && dateRange[0].startDate
                  ? findSpecialDayForDate(
                      office.specialDays,
                      dateRange[0].startDate,
                    )
                  : undefined;
              const isSamePricedSpecialDay = Boolean(
                dateRange[0].startDate &&
                pickupSpecialDay?.isOpen &&
                specialDay?.isOpen &&
                pickupSpecialDay.month === specialDay.month &&
                pickupSpecialDay.day === specialDay.day &&
                isSameCalendarDate(dateRange[0].startDate, date),
              );

              let specialDayInfo = undefined;
              let extensionTimes = undefined;

              if (isAdminMode && isManualExtension) {
                // Admin override: show the manually entered extension price
                extensionTimes = buildManualExtensionTimes(
                  date,
                  "return",
                  returnTimeSlots,
                );
              } else if (specialDay && specialDay.isOpen) {
                // Special day - show blue indicator with price
                specialDayInfo = {
                  reason: specialDay.reason || "Special Day",
                  price: isSamePricedSpecialDay
                    ? 0
                    : specialDay.extraPrice || 0,
                  alreadyCharged: isSamePricedSpecialDay,
                };
              } else {
                // Regular day - show extension times if available
                const workingDay = office?.workingTime?.find(
                  (w: any) => w.day === dayName && w.isOpen,
                );
                const returnWindow = workingDay
                  ? getWorkingDayWindow(workingDay, "return")
                  : undefined;
                extensionTimes = workingDay?.returnExtension
                  ? {
                      start: returnTimeSlots[0],
                      end: returnTimeSlots[returnTimeSlots.length - 1],
                      normalStart: returnWindow?.startTime || "00:00",
                      normalEnd: returnWindow?.endTime || "23:59",
                      price: workingDay.returnExtension.flatPrice,
                    }
                  : undefined;
              }

              return (
                <TimeSelect
                  value={formData.returnTime}
                  onChange={(time) => handleTimeChange("returnTime", time)}
                  slots={returnTimeSlots}
                  reservedSlots={endDateReservedSlots}
                  isInline={isInline}
                  tooltip={getAvailableTimeSlots(dateRange[0].endDate).info}
                  selectedDate={dateRange[0].endDate}
                  isStartTime={false}
                  specialDayInfo={specialDayInfo}
                  extensionTimes={extensionTimes}
                  disabled={
                    !formData.office ||
                    !formData.type ||
                    !dateRange[0].endDate ||
                    !formData.pickupTime
                  }
                  id="gtm-reservation-return-time"
                />
              );
            })()}
        </div>

        {/* Driver Age */}
        <div className="relative">
          <label
            className={`text-white font-semibold mb-2 flex items-center gap-2 ${
              isInline ? "text-xs mb-1" : "text-sm"
            }`}
          >
            <FiUser className="text-amber-400 text-lg" /> Age
          </label>
          {showAgeTooltip && (
            <div className="absolute -top-1 right-0 text-red-500 text-xs font-normal whitespace-nowrap">
              Enter your age
            </div>
          )}
          <input
            type="number"
            name="driverAge"
            value={formData.driverAge}
            onChange={handleInputChange}
            required
            disabled={
              !formData.office ||
              !formData.type ||
              !dateRange[0].endDate ||
              !formData.pickupTime ||
              !formData.returnTime
            }
            id="gtm-reservation-driver-age"
            className={`w-full bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 transition-colors ${
              isInline ? "px-2 py-2 text-xs" : "px-4 py-3 text-sm"
            } ${!formData.office || !formData.type || !dateRange[0].endDate || !formData.pickupTime || !formData.returnTime ? "opacity-50 cursor-not-allowed" : ""}`}
            placeholder={`${minDriverAge}-80`}
            min={minDriverAge}
            max="80"
          />
          <small>
            {formData.driverAge &&
              (parseInt(formData.driverAge, 10) < minDriverAge ||
                parseInt(formData.driverAge, 10) > 80) && (
                <span className="text-red-500 text-xs  font-semibold   ">
                  Driver age must be between {minDriverAge} and 80 .
                </span>
              )}
          </small>
        </div>

        {/* Manual extension (admin, desktop) */}
        {!isInline && isAdminMode && (
          <div className="col-span-2">{renderManualExtension()}</div>
        )}

        {/* Buttons Row */}
        {isInline ? (
          <div className="flex gap-2">
            <button
              type="submit"
              id="gtm-reservation-submit-inline"
              disabled={
                isSubmitting ||
                !formData.office ||
                !formData.type ||
                !formData.pickupTime ||
                !formData.returnTime ||
                !formData.driverAge
              }
              className="bg-linear-to-r from-amber-500 to-amber-600 text-slate-900 font-bold rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all duration-300 shadow-lg hover:shadow-amber-500/50 disabled:opacity-50 px-4 py-1 text-xs"
            >
              {isSubmitting ? "Booking..." : "BOOK"}
            </button>
            <button
              type="button"
              id="gtm-reservation-voice-inline"
              onClick={handleGlobalVoice}
              disabled={isProcessing}
              className={`px-6 py-1 rounded-lg font-semibold flex items-center gap-2 transition-all text-xs disabled:opacity-50 ${
                isRecording
                  ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50"
                  : isProcessing
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50"
                    : "bg-linear-to-r from-amber-500 to-amber-600 text-white hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/50"
              }`}
            >
              <FiMic className="text-lg" />
            </button>
          </div>
        ) : (
          <div className="col-span-2 space-y-3">
            <button
              type="submit"
              id="gtm-reservation-submit"
              disabled={
                isSubmitting ||
                !formData.office ||
                !formData.type ||
                !formData.pickupTime ||
                !formData.returnTime ||
                !formData.driverAge
              }
              className="w-full bg-linear-to-r from-amber-500 to-amber-600 text-slate-900 font-bold rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all duration-300 shadow-lg hover:shadow-amber-500/50 disabled:opacity-50 px-8 py-3 text-sm"
            >
              {isSubmitting ? "Booking..." : "RESERVE NOW"}
            </button>

            {/* AI Consultant Button - New comprehensive agent */}
            {/* <button
              type="button"
              id="gtm-reservation-ai-consultant"
              onClick={handleAIAgentMode}
              className="w-full px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all text-sm bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 shadow-lg shadow-purple-500/50"
            >
              <FiCpu className="text-lg" />
              AI Van Consultant - Tell Me What You Need!
            </button> */}
          </div>
        )}
      </div>

      {/* Mobile: Flex Col */}
      <div className="md:hidden space-y-3">
        <div>
          <label className="text-white text-xs font-semibold mb-1 flex items-center gap-1">
            <FiMapPin className="text-amber-400" /> Office
          </label>
          <CustomSelect
            options={offices.filter(
              (o): o is Office & { _id: string } => !!o._id,
            )}
            value={formData.office}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, office: val }))
            }
            placeholder="Select Office"
            isInline={true}
            id="gtm-reservation-office-mobile"
          />
        </div>

        <div>
          <label className="text-white text-xs font-semibold mb-1 flex items-center gap-1">
            <FiTruck className="text-amber-400" /> Type
          </label>
          <CustomSelect
            options={filteredTypes.filter(
              (t): t is Type & { _id: string } => !!t._id,
            )}
            value={formData.type}
            onChange={(val) => setFormData((prev) => ({ ...prev, type: val }))}
            placeholder="Select Type"
            isInline={true}
            disabled={!formData.office}
            id="gtm-reservation-type-mobile"
          />
        </div>

        <div className="w-full ">
          <label className="text-white text-xs font-semibold mb-1 flex items-center gap-1">
            <FiCalendar className="text-amber-400" /> Select Dates
          </label>
          <button
            type="button"
            onClick={() => setShowDateRange(!showDateRange)}
            disabled={!formData.office || !formData.type}
            id="gtm-reservation-dates-mobile"
            className={`w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs text-left focus:outline-none focus:border-amber-400 transition-colors ${
              !formData.office || !formData.type
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {dateRange[0]?.startDate && dateRange[0]?.endDate
              ? `${formatDate(dateRange[0].startDate)} - ${formatDate(
                  dateRange[0].endDate,
                )}`
              : "Select Dates"}
          </button>
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
              minDate={
                isAdminMode
                  ? (() => {
                      const today = new Date();
                      today.setDate(today.getDate() - 7);
                      today.setHours(0, 0, 0, 0);
                      return today;
                    })()
                  : (() => {
                      try {
                        const londonNow = getLondonTime();
                        const hours = londonNow.getUTCHours();

                        let minDaysToAdd = 1;
                        if (hours >= 16) {
                          minDaysToAdd = 2;
                        }

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
                    })()
              }
              maxDate={
                isAdminMode
                  ? (() => {
                      const nextYear = new Date();
                      nextYear.setFullYear(nextYear.getFullYear() + 1);
                      nextYear.setMonth(11, 31);
                      nextYear.setHours(23, 59, 59, 999);
                      return nextYear;
                    })()
                  : (() => {
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
                        fallback.setFullYear(fallback.getFullYear(), 11, 31);
                        fallback.setHours(23, 59, 59, 999);
                        return fallback;
                      }
                    })()
              }
              disabledDates={
                formData.office
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

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-white text-xs font-semibold mb-1">
              Pickup Time
            </label>
            {dateRange[0].startDate &&
              (() => {
                const office = getSelectedOffice();
                const date = dateRange[0].startDate;
                const dayName = [
                  "sunday",
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                ][date.getDay()];

                // Check if this is a special day
                const specialDay = office
                  ? findSpecialDayForDate(office.specialDays, date)
                  : undefined;

                let specialDayInfo = undefined;
                let extensionTimes = undefined;

                if (isAdminMode && isManualExtension) {
                  // Admin override: show the manually entered extension price
                  extensionTimes = buildManualExtensionTimes(
                    date,
                    "pickup",
                    pickupTimeSlots,
                  );
                } else if (specialDay && specialDay.isOpen) {
                  // Special day - show blue indicator with price
                  specialDayInfo = {
                    reason: specialDay.reason || "Special Day",
                    price: specialDay.extraPrice || 0,
                  };
                } else {
                  // Regular day - show extension times if available
                  const workingDay = office?.workingTime?.find(
                    (w: any) => w.day === dayName && w.isOpen,
                  );
                  const pickupWindow = workingDay
                    ? getWorkingDayWindow(workingDay, "pickup")
                    : undefined;
                  extensionTimes = workingDay?.pickupExtension
                    ? {
                        start: pickupTimeSlots[0],
                        end: pickupTimeSlots[pickupTimeSlots.length - 1],
                        normalStart: pickupWindow?.startTime || "00:00",
                        normalEnd: pickupWindow?.endTime || "23:59",
                        price: workingDay.pickupExtension.flatPrice,
                      }
                    : undefined;
                }

                // Filter pickup slots for mobile - same logic as desktop
                let mobilePickupSlots = pickupTimeSlots;
                if (
                  dateRange[0].endDate &&
                  dateRange[0].startDate.toDateString() ===
                    dateRange[0].endDate.toDateString() &&
                  formData.returnTime
                ) {
                  const [retHour, retMin] = formData.returnTime
                    .split(":")
                    .map(Number);
                  const retMinutes = retHour * 60 + retMin;
                  const maxPickupMinutes = retMinutes - 6 * 60;
                  if (maxPickupMinutes < 0) {
                    mobilePickupSlots = [];
                  } else {
                    mobilePickupSlots = pickupTimeSlots.filter((s) => {
                      const [h, m] = s.split(":").map(Number);
                      const minutes = h * 60 + m;
                      return minutes <= maxPickupMinutes;
                    });
                  }
                }

                return (
                  <TimeSelect
                    value={formData.pickupTime}
                    onChange={(time) => handleTimeChange("pickupTime", time)}
                    slots={mobilePickupSlots}
                    reservedSlots={startDateReservedSlots}
                    isInline={true}
                    tooltip={getAvailableTimeSlots(dateRange[0].startDate).info}
                    selectedDate={dateRange[0].startDate}
                    isStartTime={true}
                    specialDayInfo={specialDayInfo}
                    extensionTimes={extensionTimes}
                    disabled={
                      !formData.office ||
                      !formData.type ||
                      !dateRange[0].startDate
                    }
                    id="gtm-reservation-pickup-time-mobile"
                  />
                );
              })()}
          </div>
          <div>
            <label className="block text-white text-xs font-semibold mb-1">
              Return Time
            </label>
            {dateRange[0].endDate &&
              (() => {
                const office = getSelectedOffice();
                const date = dateRange[0].endDate;
                const dayName = [
                  "sunday",
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                ][date.getDay()];

                // Check if this is a special day
                const specialDay = office
                  ? findSpecialDayForDate(office.specialDays, date)
                  : undefined;
                const pickupSpecialDay =
                  office && dateRange[0].startDate
                    ? findSpecialDayForDate(
                        office.specialDays,
                        dateRange[0].startDate,
                      )
                    : undefined;
                const isSamePricedSpecialDay = Boolean(
                  dateRange[0].startDate &&
                  pickupSpecialDay?.isOpen &&
                  specialDay?.isOpen &&
                  pickupSpecialDay.month === specialDay.month &&
                  pickupSpecialDay.day === specialDay.day &&
                  isSameCalendarDate(dateRange[0].startDate, date),
                );

                let specialDayInfo = undefined;
                let extensionTimes = undefined;

                if (isAdminMode && isManualExtension) {
                  // Admin override: show the manually entered extension price
                  extensionTimes = buildManualExtensionTimes(
                    date,
                    "return",
                    returnTimeSlots,
                  );
                } else if (specialDay && specialDay.isOpen) {
                  // Special day - show blue indicator with price
                  specialDayInfo = {
                    reason: specialDay.reason || "Special Day",
                    price: isSamePricedSpecialDay
                      ? 0
                      : specialDay.extraPrice || 0,
                    alreadyCharged: isSamePricedSpecialDay,
                  };
                } else {
                  // Regular day - show extension times if available
                  const workingDay = office?.workingTime?.find(
                    (w: any) => w.day === dayName && w.isOpen,
                  );
                  const returnWindow = workingDay
                    ? getWorkingDayWindow(workingDay, "return")
                    : undefined;
                  extensionTimes = workingDay?.returnExtension
                    ? {
                        start: returnTimeSlots[0],
                        end: returnTimeSlots[returnTimeSlots.length - 1],
                        normalStart: returnWindow?.startTime || "00:00",
                        normalEnd: returnWindow?.endTime || "23:59",
                        price: workingDay.returnExtension.flatPrice,
                      }
                    : undefined;
                }

                // Filter return slots for mobile - same logic as desktop
                let mobileReturnSlots = returnTimeSlots;
                if (
                  dateRange[0].startDate &&
                  dateRange[0].startDate.toDateString() ===
                    dateRange[0].endDate.toDateString() &&
                  formData.pickupTime
                ) {
                  const [pickHour, pickMin] = formData.pickupTime
                    .split(":")
                    .map(Number);
                  const pickMinutes = pickHour * 60 + pickMin;
                  const minReturnMinutes = pickMinutes + 6 * 60;
                  if (minReturnMinutes > 1439) {
                    mobileReturnSlots = [];
                  } else {
                    mobileReturnSlots = returnTimeSlots.filter((s) => {
                      const [h, m] = s.split(":").map(Number);
                      const minutes = h * 60 + m;
                      return minutes >= minReturnMinutes;
                    });
                  }
                }

                return (
                  <TimeSelect
                    value={formData.returnTime}
                    onChange={(time) => handleTimeChange("returnTime", time)}
                    slots={mobileReturnSlots}
                    reservedSlots={endDateReservedSlots}
                    isInline={true}
                    tooltip={getAvailableTimeSlots(dateRange[0].endDate).info}
                    selectedDate={dateRange[0].endDate}
                    isStartTime={false}
                    specialDayInfo={specialDayInfo}
                    extensionTimes={extensionTimes}
                    disabled={
                      !formData.office ||
                      !formData.type ||
                      !dateRange[0].endDate ||
                      !formData.pickupTime
                    }
                    id="gtm-reservation-return-time-mobile"
                  />
                );
              })()}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <div>
            <label className="text-white text-xs font-semibold mb-1 flex items-center gap-1">
              <FiUser className="text-amber-400" /> Age
            </label>
            <input
              type="number"
              name="driverAge"
              value={formData.driverAge}
              onChange={handleInputChange}
              required
              disabled={
                !formData.office ||
                !formData.type ||
                !dateRange[0].endDate ||
                !formData.pickupTime ||
                !formData.returnTime
              }
              id="gtm-reservation-driver-age-mobile"
              className="w-full px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-base md:text-xs placeholder-gray-400 focus:outline-none focus:border-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={`${minDriverAge}-80`}
              min={minDriverAge}
              max="80"
            />
            <small>
              {formData.driverAge &&
                (parseInt(formData.driverAge, 10) < minDriverAge ||
                  parseInt(formData.driverAge, 10) > 80) && (
                  <span className="text-red-500 text-xs font-semibold   ">
                    Driver age must be between {minDriverAge} and 80 .
                  </span>
                )}
            </small>
          </div>
        </div>

        {/* Manual extension (admin, mobile) */}
        {isAdminMode && renderManualExtension()}

        <button
          type="submit"
          id="gtm-reservation-submit-mobile"
          disabled={
            isSubmitting ||
            !formData.office ||
            !formData.type ||
            !formData.pickupTime ||
            !formData.returnTime ||
            !formData.driverAge
          }
          className="w-full px-4 py-2.5 bg-linear-to-r from-amber-500 to-amber-600 text-slate-900 font-bold rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all duration-300 shadow-lg hover:shadow-amber-500/50 text-sm disabled:opacity-50"
        >
          {isSubmitting ? "Booking..." : "RESERVE NOW"}
        </button>

        {/* AI Consultant Button - Mobile */}
        <button
          type="button"
          id="gtm-reservation-ai-consultant-mobile"
          onClick={handleAIAgentMode}
          className="w-full px-4 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all text-sm bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 shadow-lg shadow-purple-500/50"
        >
          <FiCpu className="text-lg" />
          AI Van Consultant
        </button>
      </div>

      <style jsx global>
        {datePickerStyles}
      </style>

      {/* Voice Confirmation Modal */}
      {voiceData && (
        <VoiceConfirmationModal
          isOpen={showVoiceModal}
          onClose={() => {
            console.log("❌ [Form] Modal closed without confirmation");
            setShowVoiceModal(false);
          }}
          onConfirm={handleVoiceConfirm}
          extractedData={voiceData}
          offices={offices}
          types={types}
        />
      )}

      {/* Conversational Modal */}
      <ConversationalModal
        isOpen={showConversationalModal}
        onClose={() => {
          console.log("❌ [Form] Conversational modal closed");
          setShowConversationalModal(false);
        }}
        onComplete={handleConversationComplete}
        offices={offices}
        types={types}
      />

      {/* Fast AI Agent Modal - Quick 1-minute booking */}
      <FastAgentModal
        isOpen={showFastAgentModal}
        onClose={() => {
          console.log("❌ [Form] Fast Agent modal closed");
          setShowFastAgentModal(false);
        }}
        onComplete={handleFastAgentComplete}
      />
    </form>
  );
}
