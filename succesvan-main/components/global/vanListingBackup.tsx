"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { IoIosArrowForward } from "react-icons/io";
import { GiCarDoor } from "react-icons/gi";

import {
  FiUsers,
  FiPackage,
  FiCheckCircle,
  FiInfo,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiMapPin,
  FiMessageSquare,
  FiClock,
  FiAlertCircle,
  FiFileText,
  FiShield,
} from "react-icons/fi";
import { BsFuelPump } from "react-icons/bs";
import Image from "next/image";
import { VanData, Office } from "@/types/type";
import CustomSelect from "@/components/ui/CustomSelect";
import TimeSelect from "@/components/ui/TimeSelect";
import { generateTimeSlots } from "@/utils/timeSlots";
import { usePriceCalculation } from "@/hooks/usePriceCalculation";
import AddOnsModal from "./AddOnsModal";
import useCategories from "@/hooks/useCategories";
import CategoryRulesModal from "./CategoryRulesModal";

interface AddOn {
  _id: string;
  name: string;
  description?: string;
  pricingType: "flat" | "tiered";
  flatPrice?: {
    amount: number;
    isPerDay: boolean;
  };
  tieredPrice?: {
    isPerDay: boolean;
    tiers: { minDays: number; maxDays: number; price: number }[];
  };
  status?: "active" | "inactive";
}
import { DateRange, Range } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";
import Link from "next/link";
import {
  createLondonDateTime,
  getLondonTime,
  syncServerClock,
} from "@/lib/englandTime";
import FullScreenMobileCalendar from "./FullScreenMobileCalendar";
import {
  calculateOfficeExtensionPrices,
  findSpecialDayForDate,
  getSpecialDayPickupWindow,
  getSpecialDayReturnWindow,
  getWorkingDayTimeSlots,
  getWorkingDayWindow,
  isSameCalendarDate,
} from "@/lib/specialDaySchedule";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export interface Category extends VanData {
  expert?: string;
  properties?: { key: string; value: string }[];
  purpose?: string;
  video?: string;
}

interface VanListingProps {
  vans?: VanData[];
  showHeader?: boolean;
  gridCols?: number;
}

type CategoryWithShowPrice = Category & {
  showPrice?: number | string | null;
};

const getCategoryShowPrice = (category: CategoryWithShowPrice) => {
  const price = Number(category.showPrice ?? 0);
  return Number.isFinite(price) ? price : 0;
};

const sortCategoriesByPriceAndName = <T extends CategoryWithShowPrice>(
  categories: T[],
) =>
  [...categories].sort((a, b) => {
    const priceDifference = getCategoryShowPrice(a) - getCategoryShowPrice(b);

    if (priceDifference !== 0) {
      return priceDifference;
    }

    return a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

const formatDateForStorage = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function VanListingHome({
  vans = [],
  showHeader = true,
  gridCols = 3,
}: VanListingProps) {
  const { setUser } = useAuth();
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [detailsCategory, setDetailsCategory] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  const { categories: fetchedCategories, isLoading: categoriesLoading } =
    useCategories("active");

  const categories = useMemo(() => {
    const sourceCategories =
      vans.length > 0
        ? (vans as Category[])
        : Array.isArray(fetchedCategories)
          ? (fetchedCategories as Category[])
          : [];

    return sortCategoriesByPriceAndName(sourceCategories);
  }, [vans, fetchedCategories]);

  const isLoading = vans.length === 0 && categoriesLoading;

  const setCardRef = useCallback((index: number, el: HTMLDivElement | null) => {
    cardsRef.current[index] = el;
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#0f172b]  md:pb-25  pb-28 pt-30  z-10"
    >
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="hidden md:block absolute top-1/4 right-1/4 w-96 h-96 bg-[#fe9a00]/10 rounded-full blur-3xl" />{" "}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {showHeader && (
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl  lg:text-5xl font-black text-white mb-4">
              Choose Your {" "}
               <span className="text-[#fe9a00]">Perfect Van</span>
            </h2>
            <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
              Find the ideal van for your needs from our modern fleet
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
            {Array(3)
              .fill(0)
              .map((_, index) => (
                <SkeletonCard key={index} />
              ))}
          </div>
        ) : categories.length > 0 ? (
          <div>
            <div
              className={`grid grid-cols-1 lg:grid-cols-${gridCols} gap-3 lg:gap-4`}
            >
              {categories.map((category, index) => (
                <div key={category._id} ref={(el) => setCardRef(index, el)}>
                  <CategoryCard
                    category={category}
                    onView={() => setSelectedCategory(category)}
                    onDetails={() => {
                      setDetailsCategory(category); // Use separate state
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FiAlertCircle className="mx-auto h-20 w-20 text-gray-400 mb-6" />
            <h3 className="text-2xl lg:text-3xl font-black text-white mb-4">
              No vans available right now
            </h3>
            <p className="text-gray-400 text-lg max-w-md mb-8">
              Our fleet is being updated. Check back soon or contact us for
              options.
            </p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {detailsCategory && (
        <CategoryDetailsModal
          category={detailsCategory}
          onClose={() => setDetailsCategory(null)}
        />
      )}

      {/* Reservation Panel */}
      {selectedCategory && (
        <ReservationPanelPortal
          van={selectedCategory}
          onClose={() => setSelectedCategory(null)}
          setUser={setUser}
        />
      )}
    </section>
  );
}

export function ReservationPanelPortal({
  van,
  onClose,
  setUser,
}: {
  van: VanData;
  onClose: () => void;
  setUser: (user: any) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <ReservationPanel van={van} onClose={onClose} setUser={setUser} />,
    document.body,
  );
}

export function ReservationPanel({
  van,
  onClose,
  setUser,
}: {
  van: VanData;
  onClose: () => void;
  setUser: (user: any) => void;
}) {
  const [step, setStep] = useState<"details" | "auth">("details");
  const [authStep, setAuthStep] = useState<"phone" | "code" | "register">(
    "phone",
  );
  // Calculate minimum driver age based on van type
  const minDriverAge = useMemo(() => {
    const vanType = (van as any)?.type?.name?.toLowerCase();
    return vanType === "minibus" ? 25 : 23;
  }, [van]);

  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    phone: "",
    code: "",
    pickupDate: "",
    returnDate: "",
    pickupTime: "",
    returnTime: "",
    pickupLocation: "",
    notes: "",
    acceptTerms: false,
    office: "",
    category: van._id || "",
    driverAge: "" as any,
    gearType: "manual" as "manual" | "automatic",
    address: "",
  });

  const [dateRange, setDateRange] = useState<Range[]>([
    {
      startDate: undefined,
      endDate: undefined,
      key: "selection",
    },
  ]);
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

  const [offices, setOffices] = useState<Office[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
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
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<
    { addOn: string; quantity: number; selectedTierIndex?: number }[]
  >([]);
  const [showAddOnsModal, setShowAddOnsModal] = useState(false);
  const [addOnsCost, setAddOnsCost] = useState(0);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const router = useRouter();
  const [pickupExtensionPrice, setPickupExtensionPrice] = useState(0);
  const [returnExtensionPrice, setReturnExtensionPrice] = useState(0);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [discountError, setDiscountError] = useState("");
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [postalCode, setPostalCode] = useState<string>("");
  const [city, setCity] = useState<string>("");

  const [showSameDayTooltip, setShowSameDayTooltip] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login status
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    setIsLoggedIn(!!(token && user));
  }, []);

  const pickupDateTimeString = useMemo(
    () =>
      dateRange[0].startDate && formData.pickupTime
        ? createLondonDateTime(dateRange[0].startDate, formData.pickupTime)
        : "",
    [dateRange, formData.pickupTime],
  );

  const returnDateTimeString = useMemo(
    () =>
      dateRange[0].endDate && formData.returnTime
        ? createLondonDateTime(dateRange[0].endDate, formData.returnTime)
        : "",
    [dateRange, formData.returnTime],
  );

  const basePriceCalc = usePriceCalculation(
    pickupDateTimeString,
    returnDateTimeString,
    (van as any).pricingTiers || [],
    (van as any).extrahoursRate || 0,
    pickupExtensionPrice,
    returnExtensionPrice,
    formData.gearType === "automatic" &&
      (van as any)?.gear?.availableTypes?.includes("automatic") &&
      (van as any)?.gear?.availableTypes?.includes("manual")
      ? (van as any)?.gear?.automaticExtraCost || 0
      : 0,
    addOnsCost,
    (van as any)?.selloffer || 0,
    [],
  );

  const priceCalc = useMemo(() => {
    if (!basePriceCalc) return null;
    if (!appliedDiscount) return basePriceCalc;
    const discountAmount =
      (basePriceCalc.totalPrice * appliedDiscount.percentage) / 100;
    return {
      ...basePriceCalc,
      totalPrice: parseFloat(
        (basePriceCalc.totalPrice - discountAmount).toFixed(2),
      ),
      discountAmount,
    };
  }, [basePriceCalc, appliedDiscount]);

  useEffect(() => {
    let cancelled = false;

    const initDates = async () => {
      // اول با ساعت سرور sync کن تا ساعت اشتباه دستگاه تاریخ‌ها را جابجا نکند
      await syncServerClock().catch(() => {});
      if (cancelled) return;

      const londonNow = getLondonTime();
      const hours = londonNow.getUTCHours(); // همیشه از UTC استفاده کن

      let minDaysToAdd = 1; // حداقل فردا
      if (hours >= 16) {
        minDaysToAdd = 2; // پس‌فردا اگر بعد از ۱۶:۰۰ لندن باشه
      }

      const start = new Date(londonNow);
      start.setUTCDate(start.getUTCDate() + minDaysToAdd); // استفاده از UTC برای دقت
      start.setUTCHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);

      setDateRange([
        {
          startDate: start,
          endDate: end,
          key: "selection",
        },
      ]);
    };

    initDates();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch offices
  useEffect(() => {
    fetch("/api/offices?status=active")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const offices = data?.data?.data || data?.data || [];
        if (Array.isArray(offices)) {
          setOffices(offices);
        }
      })
      .catch((err) => console.log("Failed to fetch offices", err));
  }, []);

  // Fetch add-ons
  useEffect(() => {
    fetch("/api/addons?status=active")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const addOns = data?.data?.data || data?.data || [];
        if (Array.isArray(addOns)) {
          setAddOns(addOns);
        }
      })
      .catch((err) => console.log(err));
  }, []);

  // Calculate extension prices
  useEffect(() => {
    if (!formData.office) {
      setPickupExtensionPrice(0);
      setReturnExtensionPrice(0);
      return;
    }

    const office = offices.find((o) => o._id === formData.office);
    if (!office) {
      setPickupExtensionPrice(0);
      setReturnExtensionPrice(0);
      return;
    }

    const extensionPrices = calculateOfficeExtensionPrices({
      office,
      pickupDate: dateRange[0].startDate,
      pickupTime: formData.pickupTime,
      returnDate: dateRange[0].endDate,
      returnTime: formData.returnTime,
    });

    setPickupExtensionPrice(extensionPrices.pickupExtension);
    setReturnExtensionPrice(extensionPrices.returnExtension);
  }, [
    formData.office,
    formData.pickupTime,
    formData.returnTime,
    dateRange,
    offices,
  ]);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError("Please enter a discount code");
      return;
    }
    const user = localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user")!)
      : null;
    if (!user) {
      setDiscountError("Please login to apply discount");
      return;
    }
    setIsApplyingDiscount(true);
    setDiscountError("");
    try {
      const res = await fetch(`/api/discounts?status=active`);
      const data = await res.json();
      if (!data.success) throw new Error("Invalid discount code");
      const discounts = data.data.data || data.data;
      const discount = discounts.find(
        (d: any) => d.code.toUpperCase() === discountCode.toUpperCase(),
      );
      if (!discount) throw new Error("Invalid discount code");
      const now = new Date();
      const validFrom = new Date(discount.validFrom);
      const validTo = new Date(discount.validTo);
      if (now < validFrom || now > validTo)
        throw new Error("Discount code has expired");
      if (discount.usageLimit && discount.usageCount >= discount.usageLimit)
        throw new Error("Discount code usage limit reached");
      if (discount.usedBy?.includes(user._id))
        throw new Error("You have already used this discount code");
      if (discount.categories?.length > 0) {
        const categoryIds = discount.categories.map((c: any) => c._id || c);
        if (!categoryIds.includes(van._id))
          throw new Error("Discount not valid for this vehicle");
      }
      setAppliedDiscount(discount);
      setDiscountError("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid discount code";
      setDiscountError(message);
      setAppliedDiscount(null);
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountError("");
  };

  // Calculate add-ons cost
  useEffect(() => {
    const cost = selectedAddOns.reduce((total, item) => {
      const addon = addOns.find((a) => a._id === item.addOn);
      if (!addon) return total;
      if (addon.pricingType === "flat") {
        const amount = addon.flatPrice?.amount || 0;
        const isPerDay = addon.flatPrice?.isPerDay || false;
        const price =
          (isPerDay ? amount * (basePriceCalc?.totalDays || 1) : amount) *
          item.quantity;
        return total + price;
      } else {
        const tierIndex = item.selectedTierIndex ?? 0;
        const tier = addon.tieredPrice?.tiers?.[tierIndex];
        if (tier) {
          const isPerDay = addon.tieredPrice?.isPerDay || false;
          const price =
            (isPerDay
              ? tier.price * (basePriceCalc?.totalDays || 1)
              : tier.price) * item.quantity;
          return total + price;
        }
        return total;
      }
    }, 0);
    setAddOnsCost(cost);
  }, [selectedAddOns, basePriceCalc, addOns]);

  const pickupTimeSlots = useMemo(() => {
    if (!formData.office || !dateRange[0].startDate) return [];
    const office = offices.find((o) => o._id === formData.office);
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
    ][date.getDay()];

    // Check for special day first
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
      // Use regular working hours
      const workingDay = office.workingTime?.find(
        (w: any) => w.day === dayName && w.isOpen,
      );
      if (workingDay) {
        slots = getWorkingDayTimeSlots(workingDay, "pickup", 15);
      } else {
        slots = generateTimeSlots(start, end, 15);
      }
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
  }, [formData.office, dateRange, offices, formData.returnTime]);

  const returnTimeSlots = useMemo(() => {
    if (!formData.office || !dateRange[0].endDate) return [];
    const office = offices.find((o) => o._id === formData.office);
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
    ][date.getDay()];

    // Check for special day first
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
      // Use regular working hours
      const workingDay = office.workingTime?.find(
        (w: any) => w.day === dayName && w.isOpen,
      );
      if (workingDay) {
        slots = getWorkingDayTimeSlots(workingDay, "return", 15);
      } else {
        slots = generateTimeSlots(start, end, 15);
      }
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
  }, [formData.office, dateRange, offices, formData.pickupTime]);

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
  }, [formData.office, dateRange]);

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
  }, [formData.office, dateRange]);

  // Check if user is logged in and load URL params
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      const userData = JSON.parse(user);
      setFormData((prev) => ({
        ...prev,
        name: userData.name || "",
        lastName: userData.lastName || "",
        email: userData.emaildata?.emailAddress || "",
        phone: userData.phoneData?.phoneNumber || "",
      }));
      // User is already logged in, stay on details step
    }

    const stored = sessionStorage.getItem("rentalDetails");
    if (stored) {
      const details = JSON.parse(stored);
      setFormData((prev) => ({
        ...prev,
        pickupDate: details.pickupDate || "",
        returnDate: details.returnDate || "",
        notes: details.message || "",
        office: details.office || "",
      }));
    }

    const urlParams = new URLSearchParams(window.location.search);
    const ageParam = urlParams.get("age");
    const officeParam = urlParams.get("office");
    const discountParam = urlParams.get("discount");

    if (ageParam) {
      setFormData((prev) => ({ ...prev, driverAge: parseInt(ageParam) || 25 }));
    }
    if (officeParam) {
      setFormData((prev) => ({ ...prev, office: officeParam }));
    }
    if (discountParam) {
      setDiscountCode(discountParam.toUpperCase());
    }
  }, []);

  // Lock body scroll when panel opens
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    // Show rules modal automatically when panel opens
    setShowRulesModal(true);

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Validate dates
  useEffect(() => {
    if (formData.pickupDate && formData.returnDate) {
      const pickup = new Date(formData.pickupDate);
      const returnDate = new Date(formData.returnDate);
      if (returnDate <= pickup) {
        setErrors((prev) => ({
          ...prev,
          returnDate: "Return date must be after pickup date",
        }));
      } else {
        setErrors((prev) => ({ ...prev, returnDate: "" }));
      }
    }
  }, [formData.pickupDate, formData.returnDate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Validate driver age in real-time
    if (name === "driverAge" && value) {
      const age = parseInt(value, 10);
      if (isNaN(age) || age < minDriverAge || age > 80) {
        setErrors((prev) => ({
          ...prev,
          driverAge: `Driver age must be between ${minDriverAge} and 80 years`,
        }));
      } else {
        setErrors((prev) => ({ ...prev, driverAge: "" }));
      }
    }
  };

  const handleTimeChange = (name: string, time: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: time,
      // Clear return time when pickup changes on same day
      ...(name === "pickupTime" &&
        dateRange[0].startDate &&
        dateRange[0].endDate &&
        dateRange[0].startDate.toDateString() ===
          dateRange[0].endDate.toDateString() && {
          returnTime: "",
        }),
    }));
  };

  const handleSendCode = async () => {
    if (!formData.phone.trim()) {
      setErrors({ phone: "Phone number required" });
      return;
    }
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      setErrors({ phone: "Please enter a valid 10-digit UK phone number" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-code",
          phoneNumber: `+44${formData.phone}`,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setAuthStep("code");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setErrors({ phone: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!formData.code.trim()) {
      setErrors({ code: "Code required" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          phoneNumber: `+44${formData.phone}`,
          code: formData.code,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      if (data.data.userExists) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        setUser(data.data.user);
        setFormData((prev) => ({
          ...prev,
          name: data.data.user.name,
          lastName: data.data.user.lastName,
          email: data.data.user.emaildata?.emailAddress || "",
          phone: data.data.user.phoneData?.phoneNumber || "",
        }));
        setIsLoggedIn(true);
        setStep("details");
      } else {
        setAuthStep("register");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setErrors({ code: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name required";
    if (!formData.email.trim()) newErrors.email = "Email required";
    if (!formData.address.trim()) newErrors.address = "Address required";
    if (!postalCode.trim()) newErrors.postalCode = "Postal code required";
    if (!city.trim()) newErrors.city = "City required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          phoneNumber: `+44${formData.phone}`,
          name: formData.name,
          lastName: formData.lastName,
          emailAddress: formData.email,
          address: formData.address,
          postalCode: postalCode,
          city: city,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      setUser(data.data.user);
      setIsNewUser(true);
      setIsLoggedIn(true);
      setStep("details");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setErrors({ submit: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.office) newErrors.office = "Office is required";

    // Validate dates from dateRange state
    if (!dateRange[0].startDate)
      newErrors.pickupDate = "Pickup date is required";
    if (!dateRange[0].endDate) newErrors.returnDate = "Return date is required";

    // Validate times
    if (!formData.pickupTime) newErrors.pickupTime = "Pickup time is required";
    if (!formData.returnTime) newErrors.returnTime = "Return time is required";

    // Validate driver age
    const age = parseInt(String(formData.driverAge), 10);
    if (!formData.driverAge || isNaN(age)) {
      newErrors.driverAge = "Driver age is required";
    } else if (age < minDriverAge || age > 80) {
      newErrors.driverAge = `Driver age must be between ${minDriverAge} and 80 years`;
    }

    if (!formData.acceptTerms)
      newErrors.acceptTerms = "You must accept the terms";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Show specific error for driver age if it exists
      if (errors.driverAge) {
        // Error will be shown inline, no need for additional toast
      }
      return;
    }

    // Additional validation for driver age
    const age = parseInt(String(formData.driverAge), 10);
    if (isNaN(age) || age < minDriverAge || age > 80) {
      setErrors((prev) => ({
        ...prev,
        driverAge: `Driver age must be between ${minDriverAge} and 80 years`,
      }));
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
        setErrors({
          submit: "Please select pickup and return times (minimum 6 hours)",
        });
        return;
      }
      const [pickH, pickM] = formData.pickupTime.split(":").map(Number);
      const [retH, retM] = formData.returnTime.split(":").map(Number);
      const pickMinutes = pickH * 60 + pickM;
      const retMinutes = retH * 60 + retM;
      const duration = retMinutes - pickMinutes;

      if (duration < 6 * 60) {
        setErrors({ submit: "Minimum reservation on the same day is 6 hours" });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user")!)
        : null;

      if (!token || !user) {
        setErrors({ submit: "Please login first" });
        setStep("auth");
        setIsSubmitting(false);
        return;
      }

      // Format dates from dateRange state
      const pickupDate = dateRange[0].startDate;
      const returnDate = dateRange[0].endDate;

      if (!pickupDate || !returnDate) {
        setErrors({ submit: "Please select pickup and return dates" });
        setIsSubmitting(false);
        return;
      }

      const pickupDateTime = createLondonDateTime(
        pickupDate,
        formData.pickupTime,
      );
      const returnDateTime = createLondonDateTime(
        returnDate,
        formData.returnTime,
      );

      const payload = {
        userData: {
          userId: user._id,
          name: formData.name,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phone,
        },
        reservationData: {
          office: formData.office,
          category: formData.category,
          startDate: pickupDateTime,
          endDate: returnDateTime,
          startDateDisplay: formatDateForStorage(pickupDate),
          endDateDisplay: formatDateForStorage(returnDate),
          pickupTime: formData.pickupTime,
          returnTime: formData.returnTime,
          totalPrice: priceCalc?.totalPrice || 0,
          driverAge: formData.driverAge || 25,
          messege: formData.notes,
          status: "pending",
          addOns: selectedAddOns,
          discountCode: appliedDiscount?.code || null,
          selectedGear: formData.gearType,
          pickupExtensionPrice,
          returnExtensionPrice,
          reservationType: "Website",
        },
      };

      if (appliedDiscount) {
        const discountRes = await fetch(
          `/api/discounts?id=${appliedDiscount._id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ addUserToUsedBy: user._id }),
          },
        );
      }

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Reservation failed");
      }

      setIsSuccess(true);

      // Detect user role and redirect accordingly
      const userRole = user?.role || "user";
      const dashboardUrl =
        userRole === "admin" ? "/dashboard" : "/customerDashboard";

      if (isNewUser) {
        setTimeout(() => {
          router.push(`${dashboardUrl}?uploadLicense=true`);
        }, 2000);
      } else {
        setTimeout(() => {
          // onClose();
          router.replace(dashboardUrl);
        }, 2000);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Reservation submission error:", error);
      console.error("Error message:", message);
      setErrors({ submit: message || "Failed to create reservation" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedOffice = () => {
    return offices.find((o) => o._id === formData.office);
  };

  const isDateDisabled = (date: Date) => {
    const londonNow = getLondonTime(); // برای consistency
    const londonDate = new Date(date); // کپی
    londonDate.setTime(
      date.getTime() + londonNow.getTimezoneOffset() * 60 * 1000,
    ); // تنظیم تقریبی

    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][londonDate.getDay()];

    const office = getSelectedOffice();
    if (!office) return false;

    const specialDay = findSpecialDayForDate(office.specialDays, londonDate);
    if (specialDay && !specialDay.isOpen) return true;

    const workingDay = office.workingTime?.find((w) => w.day === dayName);
    if (workingDay && !workingDay.isOpen) return true;

    return false;
  };

  if (isSuccess) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black/50 md:backdrop-blur-sm z-9999"
          onClick={onClose}
        />
        <div className="fixed right-0 top-0 h-screen w-full sm:w-96 bg-linear-to-br from-[#0f172b] to-[#1e293b] z-10000 flex items-center justify-center motion-safe:animate-in motion-safe:slide-in-from-right motion-safe:duration-200">
          <div className="text-center p-8">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
              <FiCheckCircle className="text-5xl text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Booking Confirmed!
            </h3>
            <p className="text-gray-400">
              {isNewUser
                ? "Please upload your licences in the dashboard to finalize your request."
                : "We'll send you a confirmation email shortly."}
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 md:backdrop-blur-sm z-9999 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-screen z-10000 w-full sm:max-w-lg bg-linear-to-br from-[#0f172b] to-[#1e293b] border-l border-white/10 overflow-y-auto shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-right motion-safe:duration-200 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {/* Header */}
        <div className="sticky top-0 bg-[#0f172b] md:bg-linear-to-r  md:from-[#0f172b]/70 md:to-[#1e293b]/50 md:backdrop-blur-xl border-b border-white/10 p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="md:text-2xl text-lg font-black text-white">
              Complete Booking
            </h2>
            <button
              id="gtm-sidebar-close"
              onClick={onClose}
              className="md:w-10 md:h-10 w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all hover:rotate-90 duration-300"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-400 text-xs md:text-sm">
            Fill in your details to reserve this van
          </p>
        </div>

        {/* Van Summary Card */}
        <div className="m-6 p-4 rounded-2xl bg-linear-to-br from-[#fe9a00]/10 to-[#fe9a00]/5 border border-[#fe9a00]/20 md:backdrop-blur-sm">
          <div className="flex gap-4 mb-4">
            <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 shrink-0 overflow-hidden">
              <Image
                src={van.image}
                alt={van.name}
                width={80}
                height={80}
                sizes="80px"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold line-clamp-2 text-xl mt-6">
                {van.name}
              </h3>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
              <GiCarDoor className="text-[#fe9a00] mx-auto mb-1 text-sm" />
              <p className="text-white font-semibold text-xs">{van.doors}</p>
              <p className="text-gray-400 text-[10px]">doors</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
              <BsFuelPump className="text-[#fe9a00] mx-auto mb-1 text-sm" />
              <p className="text-white font-semibold text-xs">{van.fuel}</p>
              <p className="text-gray-400 text-[10px]">Fuel</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
              <FiUsers className="text-[#fe9a00] mx-auto mb-1 text-sm" />
              <p className="text-white font-semibold text-xs">{van.seats}</p>
              <p className="text-gray-400 text-[10px]">Seats</p>
            </div>
          </div>
        </div>

        {/* Auth Step */}
        {step === "auth" && (
          <div className="px-6 pb-6 space-y-5">
            <div className="text-center mb-4">
              <h3 className="text-white font-bold text-lg mb-2">
                Reservation Request
              </h3>
              <p className="text-gray-400 text-sm">
                Verify your phone to continue
              </p>
            </div>

            {authStep === "phone" && (
              <div>
                <label className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                  <FiPhone className="text-[#fe9a00]" />
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 font-medium">
                    +44
                  </div>
                  <input
                    type="tel"
                    id="gtm-sidebar-phone"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setFormData((prev) => ({ ...prev, phone: digits }));
                    }}
                    className={`w-full bg-white/5 border ${
                      errors.phone ? "border-red-500" : "border-white/10"
                    } rounded-xl pl-14 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] focus:ring-2 focus:ring-[#fe9a00]/20 transition-all`}
                    placeholder="7400123456"
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
                )}
                <button
                  type="button"
                  id="gtm-sidebar-send-code"
                  onClick={handleSendCode}
                  disabled={isSubmitting}
                  className="w-full mt-4 bg-[#fe9a00] text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Sending..." : "Send Code"}
                </button>
              </div>
            )}

            {authStep === "code" && (
              <div>
                <label className="text-white text-sm font-semibold mb-2 block text-center">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  id="gtm-sidebar-verification-code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  maxLength={6}
                  className={`w-full bg-white/5 border ${
                    errors.code ? "border-red-500" : "border-white/10"
                  } rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] focus:ring-2 focus:ring-[#fe9a00]/20 transition-all`}
                  placeholder="000000"
                />
                {errors.code && (
                  <p className="text-red-400 text-xs mt-1 text-center">
                    {errors.code}
                  </p>
                )}
                <button
                  type="button"
                  id="gtm-sidebar-verify-code"
                  onClick={handleVerifyCode}
                  disabled={isSubmitting}
                  className="w-full mt-4 bg-[#fe9a00] text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Verifying..." : "Verify Code"}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthStep("phone")}
                  className="w-full mt-2 text-[#fe9a00] text-sm hover:underline"
                >
                  Change phone number
                </button>
              </div>
            )}

            {authStep === "register" && (
              <div className="space-y-3">
                <p className="text-white text-sm text-center mb-4">
                  Complete your profile
                </p>
                <div>
                  <label className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <FiUser className="text-[#fe9a00]" />
                    First Name
                  </label>
                  <input
                    type="text"
                    id="gtm-sidebar-first-name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full bg-white/5 border ${
                      errors.name ? "border-red-500" : "border-white/10"
                    } rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] focus:ring-2 focus:ring-[#fe9a00]/20 transition-all`}
                    placeholder="John"
                  />
                  {errors.name && (
                    <p className="text-red-400 text-xs mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <FiUser className="text-[#fe9a00]" />
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="gtm-sidebar-last-name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full bg-white/5 border ${
                      errors.lastName ? "border-red-500" : "border-white/10"
                    } rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] focus:ring-2 focus:ring-[#fe9a00]/20 transition-all`}
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <FiMail className="text-[#fe9a00]" />
                    Email
                  </label>
                  <input
                    type="email"
                    id="gtm-sidebar-email"
                    name="email"
                    value={formData.email}
                    required
                    onChange={handleChange}
                    className={`w-full bg-white/5 border ${
                      errors.email ? "border-red-500" : "border-white/10"
                    } rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] focus:ring-2 focus:ring-[#fe9a00]/20 transition-all`}
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <FiMapPin className="text-[#fe9a00]" />
                    Address
                  </label>
                  <input
                    type="text"
                    id="gtm-sidebar-address"
                    name="address"
                    value={formData.address}
                    required
                    onChange={handleChange}
                    className={`w-full bg-white/5 border ${
                      errors.address ? "border-red-500" : "border-white/10"
                    } rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] focus:ring-2 focus:ring-[#fe9a00]/20 transition-all`}
                    placeholder="123 Main Street"
                  />
                  {errors.address && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.address}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                      <FiMapPin className="text-[#fe9a00]" />
                      Postal Code
                    </label>
                    <input
                      type="text"
                      id="gtm-sidebar-postal-code"
                      required
                      value={postalCode}
                      onChange={(e) => {
                        setPostalCode(e.target.value);
                        setErrors({ ...errors, postalCode: "" });
                      }}
                      className={`w-full bg-white/5 border ${
                        errors.postalCode ? "border-red-500" : "border-white/10"
                      } rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] focus:ring-2 focus:ring-[#fe9a00]/20 transition-all`}
                      placeholder="SW1A 1AA"
                    />
                    {errors.postalCode && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.postalCode}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                      <FiMapPin className="text-[#fe9a00]" />
                      City
                    </label>
                    <input
                      type="text"
                      id="gtm-sidebar-city"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        setErrors({ ...errors, city: "" });
                      }}
                      className={`w-full bg-white/5 border ${
                        errors.city ? "border-red-500" : "border-white/10"
                      } rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] focus:ring-2 focus:ring-[#fe9a00]/20 transition-all`}
                      placeholder="London"
                    />
                    {errors.city && (
                      <p className="text-red-400 text-xs mt-1">{errors.city}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  id="gtm-sidebar-register"
                  onClick={handleRegister}
                  disabled={isSubmitting}
                  className="w-full mt-4 bg-[#fe9a00] text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Creating Account..."
                    : "Complete Registration"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        {step === "details" && (
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
            {/* Rental Details Section */}
            <div>
              <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#fe9a00]/20 flex items-center justify-center text-[#fe9a00] text-xs font-bold">
                  1
                </div>
                Rental Details
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <FiMapPin className="text-[#fe9a00]" />
                    Office
                  </label>
                  <CustomSelect
                    options={offices.filter(
                      (o): o is Office & { _id: string } => !!o._id,
                    )}
                    value={formData.office}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, office: value }))
                    }
                    placeholder="Select office"
                    id="gtm-sidebar-office"
                  />
                  {errors.office && (
                    <p className="text-red-400 text-xs mt-1">{errors.office}</p>
                  )}
                </div>

                <div>
                  <label className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <FiCalendar className="text-[#fe9a00]" />
                    Pickup & Return Dates
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      id="gtm-sidebar-dates"
                      onClick={() =>
                        formData.office && setShowDateRange(!showDateRange)
                      }
                      disabled={!formData.office}
                      className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-left focus:outline-none focus:border-[#fe9a00] focus:ring-2 focus:ring-[#fe9a00]/20 transition-all ${
                        !formData.office ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {dateRange[0].startDate && dateRange[0].endDate
                        ? `${format(
                            dateRange[0].startDate,
                            "MMM dd",
                          )} - ${format(dateRange[0].endDate, "MMM dd, yyyy")}`
                        : "Select dates"}
                    </button>
                    {showDateRange && (
                      <div className="absolute hidden md:block left-0 min-h-44 max-h-120 overflow-y-auto -top-44 z-50 bg-slate-800 md:backdrop-blur-xl border border-white/20 rounded-lg p-4 w-70 sm:w-75  ">
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
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                      <FiClock className="text-[#fe9a00]" />
                      Pickup Time
                    </label>
                    {dateRange[0].startDate && dateRange[0].endDate ? (
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

                        // Check if it's a special day first
                        const specialDay = office
                          ? findSpecialDayForDate(office.specialDays, date)
                          : undefined;

                        let extensionTimes = undefined;
                        let specialDayInfo = undefined;

                        if (specialDay && specialDay.isOpen) {
                          // It's a special day - show special day info
                          specialDayInfo = {
                            price: specialDay.extraPrice || 0,
                            reason: specialDay.reason,
                          };
                        } else {
                          // Not a special day - apply extension if available
                          const workingDay = office?.workingTime?.find(
                            (w: any) => w.day === dayName && w.isOpen,
                          );
                          if (workingDay?.pickupExtension) {
                            const pickupWindow = getWorkingDayWindow(
                              workingDay,
                              "pickup",
                            );
                            extensionTimes = {
                              start: pickupTimeSlots[0],
                              end: pickupTimeSlots[pickupTimeSlots.length - 1],
                              normalStart: pickupWindow.startTime,
                              normalEnd: pickupWindow.endTime,
                              price: workingDay.pickupExtension.flatPrice,
                            };
                          }
                        }

                        return (
                          <TimeSelect
                            value={formData.pickupTime}
                            onChange={(time) =>
                              setFormData((prev) => ({
                                ...prev,
                                pickupTime: time,
                              }))
                            }
                            slots={pickupTimeSlots}
                            reservedSlots={startDateReservedSlots}
                            selectedDate={dateRange[0].startDate}
                            isStartTime={true}
                            extensionTimes={extensionTimes}
                            specialDayInfo={specialDayInfo}
                          />
                        );
                      })()
                    ) : (
                      <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-500 text-sm opacity-50">
                        Select dates first
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    {/* Tooltip for same-day reservation info */}
                    {dateRange[0].startDate &&
                      dateRange[0].endDate &&
                      dateRange[0].startDate.toDateString() ===
                        dateRange[0].endDate.toDateString() &&
                      showSameDayTooltip && (
                        <div className="absolute -top-7 left-0 z-20 px-1 py-1 bg-slate-900 border border-amber-400/30 rounded text-amber-300 text-xs whitespace-nowrap shadow-lg pointer-events-auto flex items-center gap-2">
                          <span>
                            Reservations less than 24 hours <br /> are
                            calculated as <b>1 day</b>.
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
                    <label className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                      <FiClock className="text-[#fe9a00]" />
                      Return Time
                    </label>
                    {dateRange[0].endDate && formData.pickupTime ? (
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

                        // Check if it's a special day first
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

                        let extensionTimes = undefined;
                        let specialDayInfo = undefined;

                        if (specialDay && specialDay.isOpen) {
                          // It's a special day - show special day info
                          specialDayInfo = {
                            price: isSamePricedSpecialDay
                              ? 0
                              : specialDay.extraPrice || 0,
                            reason: specialDay.reason,
                            alreadyCharged: isSamePricedSpecialDay,
                          };
                        } else {
                          // Not a special day - apply extension if available
                          const workingDay = office?.workingTime?.find(
                            (w: any) => w.day === dayName && w.isOpen,
                          );
                          if (workingDay?.returnExtension) {
                            const returnWindow = getWorkingDayWindow(
                              workingDay,
                              "return",
                            );
                            extensionTimes = {
                              start: returnTimeSlots[0],
                              end: returnTimeSlots[returnTimeSlots.length - 1],
                              normalStart: returnWindow.startTime,
                              normalEnd: returnWindow.endTime,
                              price: workingDay.returnExtension.flatPrice,
                            };
                          }
                        }

                        return (
                          <TimeSelect
                            value={formData.returnTime}
                            onChange={(time) =>
                              setFormData((prev) => ({
                                ...prev,
                                returnTime: time,
                              }))
                            }
                            slots={returnTimeSlots}
                            reservedSlots={endDateReservedSlots}
                            selectedDate={dateRange[0].endDate}
                            isStartTime={false}
                            extensionTimes={extensionTimes}
                            specialDayInfo={specialDayInfo}
                          />
                        );
                      })()
                    ) : (
                      <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-500 text-sm opacity-50">
                        {!dateRange[0].endDate
                          ? "Select dates first"
                          : "Select pickup time"}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <FiUser className="text-[#fe9a00]" />
                    Driver Age
                  </label>
                  <input
                    type="number"
                    id="gtm-sidebar-driver-age"
                    name="driverAge"
                    value={formData.driverAge}
                    onChange={handleChange}
                    placeholder={`${minDriverAge}-80`}
                    min={minDriverAge}
                    max="80"
                    disabled={!formData.returnTime}
                    className={`w-full bg-white/5 border ${
                      errors.driverAge ? "border-red-500" : "border-white/10"
                    } rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#fe9a00] focus:ring-2 focus:ring-[#fe9a00]/20 transition-all ${
                      !formData.returnTime
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  />
                  {errors.driverAge && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <FiAlertCircle className="text-xs" />
                      {errors.driverAge}
                    </p>
                  )}
                </div>

                <div>
                  <label className="  text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <FiMessageSquare className="text-[#fe9a00]" />
                    Additional Notes{" "}
                    <span className="text-gray-500 text-xs font-normal">
                      (Optional)
                    </span>
                  </label>
                  <textarea
                    id="gtm-sidebar-notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    disabled={!formData.driverAge}
                    className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] focus:ring-2 focus:ring-[#fe9a00]/20 transition-all resize-none ${
                      !formData.driverAge ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    placeholder="Any special requirements or questions?"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10"></div>

            {/* Gear Selection */}
            {(van as any)?.gear?.availableTypes?.length > 1 && (
              <div>
                <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#fe9a00]/20 flex items-center justify-center text-[#fe9a00] text-xs font-bold">
                    2
                  </div>
                  Gear Option
                </h3>
                <div className="flex gap-2">
                  {(van as any).gear.availableTypes.includes("manual") && (
                    <button
                      type="button"
                      onClick={() =>
                        formData.driverAge &&
                        setFormData((prev) => ({ ...prev, gearType: "manual" }))
                      }
                      disabled={!formData.driverAge}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                        formData.gearType === "manual"
                          ? "bg-[#fe9a00] text-white"
                          : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                      } ${
                        !formData.driverAge
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      Manual
                    </button>
                  )}
                  {(van as any).gear.availableTypes.includes("automatic") && (
                    <button
                      type="button"
                      onClick={() =>
                        formData.driverAge &&
                        setFormData((prev) => ({
                          ...prev,
                          gearType: "automatic",
                        }))
                      }
                      disabled={!formData.driverAge}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                        formData.gearType === "automatic"
                          ? "bg-[#fe9a00] text-white"
                          : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                      } ${
                        !formData.driverAge
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <div>Automatic</div>
                      {(van as any)?.gear?.automaticExtraCost > 0 && (
                        <div className="text-xs mt-0.5">
                          +£{(van as any).gear.automaticExtraCost}/day
                        </div>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-white/10"></div>

            {/* Add-ons Section */}
            {addOns.length > 0 &&
              dateRange[0].startDate &&
              dateRange[0].endDate && (
                <div>
                  <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#fe9a00]/20 flex items-center justify-center text-[#fe9a00] text-xs font-bold">
                      {(van as any)?.gear?.availableTypes?.length > 1
                        ? "3"
                        : "2"}
                    </div>
                    Add-ons
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      formData.gearType && setShowAddOnsModal(true)
                    }
                    disabled={!formData.gearType}
                    className={`w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#fe9a00]/50 rounded-xl p-4 transition-all group ${
                      !formData.gearType
                        ? "opacity-50 cursor-not-allowed hover:bg-white/5 hover:border-white/10"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-white font-semibold text-sm">
                          {selectedAddOns.length === 0
                            ? "Select Add-ons"
                            : `${selectedAddOns.length} Add-on${
                                selectedAddOns.length > 1 ? "s" : ""
                              } Selected`}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {selectedAddOns.length === 0
                            ? "Enhance your rental experience"
                            : `Total: £${addOnsCost}`}
                        </p>
                      </div>
                      <FiPackage className="text-[#fe9a00] text-xl group-hover:scale-110 transition-transform" />
                    </div>
                  </button>
                </div>
              )}

            {/* Divider */}
            {addOns.length > 0 &&
              dateRange[0].startDate &&
              dateRange[0].endDate && (
                <div className="border-t border-white/10"></div>
              )}

            {/* Personal Information Section - Check if user is logged in */}
            {(() => {
              if (!isLoggedIn) {
                // User not logged in - show login prompt with price
                return (
                  <>
                    {/* Show Total Price */}
                    {priceCalc && (
                      <div className="bg-linear-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-bold text-lg">
                            Total Price
                          </span>
                          <span className="text-[#fe9a00] font-black text-2xl">
                            £{priceCalc.totalPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="border-t border-white/10"></div>

                    {/* Login Required Section */}
                    <div>
                      <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#fe9a00]/20 flex items-center justify-center text-[#fe9a00] text-xs font-bold">
                          {addOns.length > 0 &&
                          dateRange[0].startDate &&
                          dateRange[0].endDate
                            ? (van as any)?.gear?.availableTypes?.length > 1
                              ? "4"
                              : "3"
                            : (van as any)?.gear?.availableTypes?.length > 1
                              ? "3"
                              : "2"}
                        </div>
                        Personal Information
                      </h3>
                      <div className="bg-[#fe9a00]/10 border border-[#fe9a00]/30 rounded-xl p-6 text-center">
                        <FiUser className="text-[#fe9a00] text-4xl mx-auto mb-3" />
                        <h4 className="text-white font-bold text-lg mb-2">
                          Login Required
                        </h4>
                        <p className="text-gray-300 text-sm mb-4">
                          To enter discount code or complete booking, we need
                          your information
                        </p>
                        <button
                          type="button"
                          onClick={() => setStep("auth")}
                          className="w-full bg-[#fe9a00] hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  </>
                );
              }

              // User is logged in - show personal info fields
              return (
                <div>
                  <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#fe9a00]/20 flex items-center justify-center text-[#fe9a00] text-xs font-bold">
                      {addOns.length > 0 &&
                      dateRange[0].startDate &&
                      dateRange[0].endDate
                        ? (van as any)?.gear?.availableTypes?.length > 1
                          ? "4"
                          : "3"
                        : (van as any)?.gear?.availableTypes?.length > 1
                          ? "3"
                          : "2"}
                    </div>
                    Personal Information
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="  text-white text-sm font-semibold mb-2 flex items-center gap-2">
                        <FiUser className="text-[#fe9a00]" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="gtm-sidebar-full-name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full bg-white/5 border ${
                          errors.name ? "border-red-500" : "border-white/10"
                        } rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] focus:ring-2 focus:ring-[#fe9a00]/20 transition-all`}
                        placeholder="John Doe"
                      />
                      {errors.name && (
                        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                          <FiAlertCircle className="text-xs" />
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="  text-white text-sm font-semibold mb-2 flex items-center gap-2">
                        <FiMail className="text-[#fe9a00]" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="gtm-sidebar-email-details"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full bg-white/5 border ${
                          errors.email ? "border-red-500" : "border-white/10"
                        } rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] focus:ring-2 focus:ring-[#fe9a00]/20 transition-all`}
                        placeholder="john@example.com"
                      />
                      {errors.email && (
                        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                          <FiAlertCircle className="text-xs" />
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="  text-white text-sm font-semibold mb-2 flex items-center gap-2">
                        <FiPhone className="text-[#fe9a00]" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="gtm-sidebar-phone-details"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`w-full bg-white/5 border ${
                          errors.phone ? "border-red-500" : "border-white/10"
                        } rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] focus:ring-2 focus:ring-[#fe9a00]/20 transition-all`}
                        placeholder="+44 123 456 7890"
                      />
                      {errors.phone && (
                        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                          <FiAlertCircle className="text-xs" />
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Divider - only show if user is logged in */}
            {isLoggedIn && <div className="border-t border-white/10"></div>}

            {/* Discount Code Section - only show if user is logged in */}
            {isLoggedIn && (
              <div>
                <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#fe9a00]/20 flex items-center justify-center text-[#fe9a00] text-xs font-bold">
                    {addOns.length > 0 &&
                    dateRange[0].startDate &&
                    dateRange[0].endDate
                      ? (van as any)?.gear?.availableTypes?.length > 1
                        ? "5"
                        : "4"
                      : (van as any)?.gear?.availableTypes?.length > 1
                        ? "4"
                        : "3"}
                  </div>
                  Discount Code
                </h3>
                {!appliedDiscount ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => {
                          setDiscountCode(e.target.value.toUpperCase());
                          setDiscountError("");
                        }}
                        placeholder="Enter discount code"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] focus:ring-2 focus:ring-[#fe9a00]/20 transition-all uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleApplyDiscount}
                        disabled={isApplyingDiscount || !discountCode.trim()}
                        className="md:px-6 px-2 py-3 bg-[#fe9a00] text-xs md:text-base hover:bg-orange-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isApplyingDiscount ? "..." : "Apply"}
                      </button>
                    </div>
                    {discountError && (
                      <p className="text-red-400 text-xs flex items-center gap-1">
                        <FiAlertCircle className="text-xs" />
                        {discountError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-400 font-bold">
                          {appliedDiscount.code}
                        </p>
                        <p className="text-green-300 text-xs mt-1">
                          {appliedDiscount.percentage}% discount applied
                        </p>
                      </div>
                      <button
                        type="button"
                        id="gtm-sidebar-remove-discount"
                        onClick={handleRemoveDiscount}
                        className="text-red-400 hover:text-red-300 text-sm font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Divider - only show if user is logged in */}
            {isLoggedIn && <div className="border-t border-white/10"></div>}

            {/* Cost Summary - only show if user is logged in */}
            {isLoggedIn && (
              <div className="bg-linear-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-4 space-y-3">
                <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#fe9a00]/20 flex items-center justify-center text-[#fe9a00] text-xs font-bold">
                    {addOns.length > 0 &&
                    dateRange[0].startDate &&
                    dateRange[0].endDate
                      ? (van as any)?.gear?.availableTypes?.length > 1
                        ? "6"
                        : "5"
                      : (van as any)?.gear?.availableTypes?.length > 1
                        ? "5"
                        : "4"}
                  </div>
                  Cost Summary
                </h3>

                {/* Special Days Alert */}
                {priceCalc?.specialDaysInfo &&
                  priceCalc.specialDaysInfo.length > 0 && (
                    <div className="bg-[#fe9a00]/10 border border-[#fe9a00]/30 rounded-xl p-4 mb-3">
                      <div className="flex items-start gap-2 mb-2">
                        <FiCalendar className="text-[#fe9a00] text-lg mt-0.5" />
                        <div className="flex-1">
                          <p className="text-[#fe9a00] font-bold text-sm mb-1">
                            Special Days Detected!
                          </p>
                          <p className="text-gray-300 text-xs mb-2">
                            Your rental includes special days with additional
                            charges:
                          </p>
                          <div className="space-y-1">
                            {priceCalc.specialDaysInfo.map((info, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2"
                              >
                                <div>
                                  <span className="text-white font-semibold text-xs">
                                    {info.date}
                                  </span>
                                  {info.reason && (
                                    <span className="text-gray-400 text-xs ml-2">
                                      ({info.reason})
                                    </span>
                                  )}
                                </div>
                                <span className="text-[#fe9a00] font-bold text-sm">
                                  +£{info.price}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                <div className="space-y-2 text-sm">
                  {priceCalc && (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-gray-400">Rental charges</span>
                          <div className="text-gray-500 text-xs mt-0.5">
                            {priceCalc.totalDays} days x £
                            {priceCalc.pricePerDay}
                            {priceCalc.extraHours > 0 &&
                              ` + ${priceCalc.extraHours}h x £${priceCalc.extraHoursRate}`}
                          </div>
                        </div>
                        <span className="text-white font-semibold">
                          £
                          {(
                            priceCalc.totalDays * priceCalc.pricePerDay +
                            priceCalc.extraHours * priceCalc.extraHoursRate
                          ).toFixed(2)}
                        </span>
                      </div>
                      {formData.gearType === "automatic" &&
                        (van as any)?.gear?.automaticExtraCost > 0 && (
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-gray-400">
                                Automatic gear
                              </span>
                              <div className="text-gray-500 text-xs mt-0.5">
                                {priceCalc.totalDays} days x £
                                {(van as any).gear.automaticExtraCost}
                              </div>
                            </div>
                            <span className="text-white font-semibold">
                              £
                              {(
                                (van as any).gear.automaticExtraCost *
                                priceCalc.totalDays
                              ).toFixed(2)}
                            </span>
                          </div>
                        )}
                      {pickupExtensionPrice > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">
                            Pickup Extension (either out of working time or weekend time)
                          </span>
                          <span className="text-white font-semibold">
                            £{pickupExtensionPrice}
                          </span>
                        </div>
                      )}
                      {returnExtensionPrice > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">
                            Return Extension (either out of working time or weekend time)
                          </span>
                          <span className="text-white font-semibold">
                            £{returnExtensionPrice}
                          </span>
                        </div>
                      )}
                      {selectedAddOns.map((item) => {
                        const addon = addOns.find((a) => a._id === item.addOn);
                        if (!addon) return null;
                        let price = 0;
                        if (addon.pricingType === "flat") {
                          const amount = addon.flatPrice?.amount || 0;
                          const isPerDay = addon.flatPrice?.isPerDay || false;
                          price =
                            (isPerDay ? amount * priceCalc.totalDays : amount) *
                            item.quantity;
                        } else if (
                          item.selectedTierIndex !== undefined &&
                          addon.tieredPrice?.tiers?.[item.selectedTierIndex]
                        ) {
                          const tier =
                            addon.tieredPrice.tiers[item.selectedTierIndex];
                          const isPerDay = addon.tieredPrice.isPerDay || false;
                          price =
                            (isPerDay
                              ? tier.price * priceCalc.totalDays
                              : tier.price) * item.quantity;
                        }
                        return (
                          <div
                            key={item.addOn}
                            className="flex justify-between items-center"
                          >
                            <span className="text-gray-400">
                              {addon.name}
                              {item.quantity > 1 && ` x ${item.quantity}`}
                            </span>
                            <span className="text-white font-semibold">
                              £{price.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                      {Number(priceCalc.specialDaysPrice || 0) > 0 && (
                        <div className="flex justify-between items-center bg-[#fe9a00]/10 rounded-lg px-3 py-2">
                          <span className="text-[#fe9a00] font-semibold">
                            Special Days Charge
                          </span>
                          <span className="text-[#fe9a00] font-bold">
                            £{Number(priceCalc.specialDaysPrice || 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                      {appliedDiscount && (
                        <div className="flex justify-between items-center text-green-400">
                          <span className="font-semibold">
                            Discount ({appliedDiscount.percentage}%)
                          </span>
                          <span className="font-semibold">
                            -£{(priceCalc as any).discountAmount?.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="border-t border-[#fe9a00]/20 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-bold">
                            Total Price
                          </span>
                          <span className="text-[#fe9a00] font-black text-xl">
                            £{priceCalc.totalPrice}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                  {!priceCalc && (
                    <div className="text-center text-gray-400 py-4">
                      Select dates and times to see pricing
                    </div>
                  )}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-3">
                  <p className="text-blue-300 text-xs flex items-start gap-2">
                    <FiInfo className="text-sm mt-0.5 shrink-0" />
                    <span>
                      Security deposit is fully refundable upon return of the
                      van in good condition
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Terms & Conditions - only show if user is logged in */}
            {isLoggedIn && (
              <div>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-[#fe9a00] checked:border-[#fe9a00] focus:ring-2 focus:ring-[#fe9a00]/20 transition-all cursor-pointer"
                  />
                  <span className="text-gray-300 text-sm group-hover:text-white transition-colors leading-relaxed">
                    I agree to the{" "}
                    <Link
                      href="/terms-and-conditions"
                      className="text-[#fe9a00] hover:underline font-semibold inline-flex items-center gap-1 transition-all hover:text-orange-300"
                    >
                      <FiFileText className="text-xs" />
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="#"
                      className="text-[#fe9a00] hover:underline font-semibold inline-flex items-center gap-1 transition-all hover:text-orange-300"
                    >
                      <FiShield className="text-xs" />
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.acceptTerms && (
                  <p className="text-red-400 text-xs mt-2 flex items-center gap-1 ml-8">
                    <FiAlertCircle className="text-xs" />
                    {errors.acceptTerms}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons - only show if user is logged in */}
            {isLoggedIn && (
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  id="gtm-sidebar-submit"
                  disabled={isSubmitting}
                  className="w-full bg-linear-to-r from-[#fe9a00] to-[#ff8800] hover:from-[#ff8800] hover:to-[#fe9a00] text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-[#fe9a00]/20 hover:shadow-[#fe9a00]/40 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="text-xl" />
                      Confirm Reservation
                    </>
                  )}
                </button>
                <button
                  type="button"
                  id="gtm-sidebar-cancel"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Trust Indicators - only show if user is logged in */}
            {isLoggedIn && (
              <div className="flex items-center justify-center gap-4 text-xs text-gray-400 pt-2">
                <div className="flex items-center gap-1">
                  <FiCheckCircle className="text-green-500" />
                  <span>Secure Booking</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                <div className="flex items-center gap-1">
                  <FiCheckCircle className="text-green-500" />
                  <span>Instant Confirmation</span>
                </div>
              </div>
            )}
          </form>
        )}

        {/* Add-ons Modal */}
        {showAddOnsModal && (
          <AddOnsModal
            addOns={addOns}
            selectedAddOns={selectedAddOns}
            onSave={setSelectedAddOns}
            onClose={() => setShowAddOnsModal(false)}
            rentalDays={priceCalc?.totalDays || 1}
            selectedCategoryId={van._id || ""}
          />
        )}

        {/* Rules Modal */}
        {showRulesModal && (
          <CategoryRulesModal
            categoryId={van._id || ""}
            onClose={() => setShowRulesModal(false)}
            showLoadingImmediately
          />
        )}
      </div>
    </>
  );
}

function CategoryCard({
  category,
  onView,
  onDetails,
}: {
  category: Category;
  onView: () => void;
  onDetails: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [canHoverVideo, setCanHoverVideo] = useState(false);

  const [isHovered, setIsHovered] = useState(false);
  const [isTouching, setIsTouching] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setCanHoverVideo(
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    );
  }, []);
  // Desktop hover handlers
  const handleMouseEnter = () => {
    if (canHoverVideo) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  // Mobile touch handlers
  const handleTouchStart = () => {
    if (!canHoverVideo) {
      setIsTouching(true);
    }
  };

  const handleTouchMove = () => {
    if (!isTouching) {
      setIsTouching(true);
    }
    // Video will autoplay when rendered due to autoPlay prop
  };

  const handleTouchEnd = () => {
    setIsTouching(false);

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  // Determine if video should show
  const showVideo = category.video && (canHoverVideo ? isHovered : isTouching);
  return (
    <div
      ref={cardRef}
      title={category.name}
      
      className="group relative h-125 rounded-3xl overflow-hidden cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      // onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Background Layer: Image + Lazy Video */}
      <div className="absolute inset-0">
        {/* Static Image - always visible initially */}
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`object-cover transition-opacity duration-200 ease-out ${
              showVideo ? "opacity-0" : "opacity-100"
            }`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-[#fe9a00]/20 to-[#fe9a00]/5" />
        )}

        {/* Video - only loads when hovered/touched */}
        {showVideo && category.video && (
          <video
            ref={videoRef}
            src={category.video}
            muted
            loop
            playsInline
            autoPlay
            preload="none"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Overlay gradient for better text visibility */}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      {/* Touch hint for mobile */}
      {category.video && (
        <div className="absolute top-4 right-4 z-20 md:hidden">
          <div
            className={`bg-black/50 md:backdrop-blur-sm rounded-full p-2 transition-all duration-300 ${
              isTouching ? "bg-[#fe9a00] scale-105" : "bg-black/60"
            }`}
          >
            {isTouching ? (
              <svg
                className="w-5 h-5 text-black"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Content Layer */}
      <div className="relative h-full flex flex-col p-6 justify-between text-white z-10">
        <div>
          <h3 className="text-xl md:text-2xl font-black leading-tight mb-2 drop-shadow-lg">
            {category.name}
          </h3>
          <p className="text-gray-200 text-xs md:text-sm font-medium mb-4 drop-shadow-md">
            {category.expert}
          </p>

          {/* Feature Badges */}
          <div className="flex flex-wrap gap-1 md:gap-2 mb-3">
            <div className="md:px-3 md:py-1.5 px-2 py-1 rounded-full bg-white/15 md:backdrop-blur-md border border-white/30 flex items-center gap-2 shadow-sm">
              <FiUsers className="text-[#fe9a00] text-xs md:text-sm" />
              <span className="text-[10px] md:text-xs font-bold">
                {category.seats} seats
              </span>
            </div>
            <div className="md:px-3 md:py-1.5 px-2 py-1 rounded-full bg-white/15 md:backdrop-blur-md border border-white/30 flex items-center gap-2 shadow-sm">
              <BsFuelPump className="text-[#fe9a00] text-xs md:text-sm" />
              <span className="text-[10px] md:text-xs font-bold">
                {category.fuel}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-white/15 md:backdrop-blur-md border border-white/30 flex items-center gap-2 shadow-sm">
              <GiCarDoor className="text-[#fe9a00] text-xs md:text-sm" />
              <span className="text-[10px] md:text-xs font-bold">
                {category.doors} doors
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 flex items-end justify-between">
          <div className="space-y-2">
            {/* License Badge */}
            <div className="inline-flex items-center gap-2 px-2 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-500 text-[10px] font-semibold shadow-sm">
              <span>{category.requiredLicense}</span>
            </div>

            {/* Details Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDetails();
              }}
              className="flex items-center gap-2 text-[#fe9a00] font-bold text-xs md:text-sm
                 hover:gap-3 hover:border-b-2 hover:border-[#fe9a00]
                 transition-all duration-300"
            >
              <span>Van Dimensions</span>
              <IoIosArrowForward className="text-lg" />
            </button>
          </div>

          {/* Book Button */}
          <button
            id="gtm-sidebar-Book-now"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="px-5 py-3 bg-[#fe9a00] hover:bg-[#ff8800] flex gap-1 text-sm items-center text-black font-bold rounded-xl shadow-md transition-colors  duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0"
          >
            Book Now
            <IoIosArrowForward className="text-base text-black" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryDetailsModal({
  category,
  onClose,
}: {
  category: Category;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"dimensions" | "purpose">(
    "dimensions",
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 md:backdrop-blur-sm z-9999 transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-0 flex items-center justify-center p-4 z-9999">
        <div className="bg-linear-to-br from-[#0f172b] to-[#1e293b] rounded-2xl border border-white/10 max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-in z-9999 zoom-in duration-300">
          {/* Content */}
          <div className="p-7  w-full z-50">
            {/* Tabs */}
            <div className="flex justify-between items- w-full gap-3 border-b border-white/10 mb-1 overflow-hidden">
              <button
                onClick={() => setActiveTab("dimensions")}
                className={`px-4 py-3 font-semibold rounded-lg w-full transition-all relative ${
                  activeTab === "dimensions"
                    ? "text-gray-100 bg-[#fe9a00] hover:text-white"
                    : "text-white bg-black/50"
                }`}
              >
                Dimensions
              </button>
              <button
                onClick={() => setActiveTab("purpose")}
                className={`px-4 py-3 font-semibold w-full rounded-lg transition-all relative ${
                  activeTab === "purpose"
                    ? "text-gray-100 bg-[#fe9a00] hover:text-white"
                    : "text-white bg-black/50"
                }`}
              >
                Purpose
              </button>
            </div>

            {/* Dimensions Tab */}
            {activeTab === "dimensions" && (
              <div className="space-y-1 mb-1 grid grid-cols-2 gap-2">
                {category.properties && category.properties.length > 0 ? (
                  category.properties.map((prop, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2 bg-linear-to-r from-white/5 to-white/0 rounded-lg border border-white/10 hover:border-[#fe9a00]/50 hover:bg-linear-to-r hover:from-[#fe9a00]/10 hover:to-white/0 transition-all group"
                    >
                      <span className="text-gray-300 text-xs font-semibold group-hover:text-white transition-colors">
                        {prop.key}
                      </span>
                      <span className="text-[#fe9a00] text-[12px] font-bold text-right">
                        {prop.value}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    No dimensions available
                  </p>
                )}
              </div>
            )}

            {/* Purpose Tab */}
            {activeTab === "purpose" && (
              <div className="space-y-4">
                {category.purpose ? (
                  <div className="p-5 bg-linear-to-br from-[#fe9a00]/15 to-[#fe9a00]/5 border border-[#fe9a00]/30 rounded-lg">
                    <p className="text-white whitespace-break-spaces leading-relaxed text-base">
                      {category.purpose}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    No purpose information available
                  </p>
                )}
              </div>
            )}

            {/* Action Button */}
            <div className="pt-4 border-t border-white/10">
              <button
                onClick={onClose}
                className="w-full py-3 px-4 bg-linear-to-r from-[#fe9a00] to-[#ff9f1c] hover:from-[#ff9f1c] hover:to-[#fe9a00] text-black font-bold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-[#fe9a00]/50 active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const SkeletonCard = () => (
  <div className="group relative h-120 rounded-3xl overflow-hidden bg-gray-800/30 animate-pulse">
    {/* Image/linear fallback + Overlay */}
    <div className="absolute inset-0">
      <div className="w-full h-full bg-linear-to-br rounded-3xl from-[#fe9a00]/20 via-[#fe9a00]/10 to-[#fe9a00]/5"></div>
      <div className="absolute inset-0 rounded-3xl bg-linear-to-b from-black/60 via-transparent/50 to-black/80"></div>
    </div>

    {/* Content */}
    <div className="relative h-full flex flex-col p-6 justify-between">
      <div>
        {/* Title */}
        <div className="h-7 bg-linear-to-r from-gray-600/70 to-gray-500/70 rounded-md w-64 mb-2"></div>
        {/* Expert */}
        <div className="h-5 bg-gray-600/50 rounded w-32 mb-6"></div>
        {/* Badges */}
        <div className="flex gap-1">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="px-2 py-1 rounded-full bg-white/10 md:backdrop-blur-sm border border-white/20 flex items-center gap-1.5 animate-pulse"
              >
                <div className="h-3 w-3 bg-[#fe9a00]/50 rounded-full"></div>
                <div className="h-3 bg-gray-500/50 rounded-full w-16"></div>
              </div>
            ))}
        </div>
      </div>

      <div className="space-y-3">
        {/* Dimensions button */}
        <div className="h-6 bg-gray-600/50 border-b-2 border-white/20 rounded-sm w-32"></div>
        {/* Price + Book button */}
        <div className="flex items-end justify-between gap-3">
          <div>
            {/* "from" */}
            {/* Price with strike + discounted + %OFF */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <div className="h-10 bg-linear-to-r from-gray-500 to-gray-400 rounded w-20"></div>{" "}
                {/* Main price */}
              </div>
            </div>
          </div>
          {/* Book Now button */}
          <div className="h-11 w-24 bg-gray-600/50 border-2 border-white/20 rounded-md"></div>
        </div>
      </div>
    </div>
  </div>
);
