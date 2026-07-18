"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FiX,
  FiMapPin,
  FiCalendar,
  FiUser,
  FiPhone,
  FiMail,
  FiCheckCircle,
  FiPackage,
  FiUsers,
  FiAlertCircle,
  FiArrowLeft,
  FiClock,
  FiShield,
  FiTag,
} from "react-icons/fi";

import AddOnsModal from "./AddOnsModal";
import VanCard from "./VanCard";
import { usePriceCalculation } from "@/hooks/usePriceCalculation";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/lib/toast";
import Image from "next/image";
import { BsFuelPump } from "react-icons/bs";
import { WorkingTime } from "@/types/type";
import { MdDoorSliding } from "react-icons/md";
import SearchableSelect from "../ui/SearchableSelect";
import CategoryRulesModal from "./CategoryRulesModal";
import {
  calculateOfficeExtensionPrices,
  getWorkingDayWindow,
} from "@/lib/specialDaySchedule";
import { formatDateInputInLondon, formatTimeInLondon } from "@/lib/englandTime";
import { useRouter } from "next/navigation";

interface Office {
  _id: string;
  name: string;
  vehicles: any[];
}

interface Category {
  _id: string;
  name: string;
  image: string;
  pricingTiers: { minDays: number; maxDays: number; pricePerDay: number }[];
  extrahoursRate: number;
  deposit: number;
  seats: number;
  doors: number;
  fuel: string;
  expert: string;
  selloffer?: number;
  gear: {
    availableTypes: ("manual" | "automatic")[];
    automaticExtraCost?: number;
  };
}

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
}

interface ReservationModalProps {
  onClose: () => void;
  isAdminMode?: boolean;
}

const isDateInputValue = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const getStoredDateInputValue = (
  storedDate: unknown,
  fallbackDate: Date | null,
) => {
  if (isDateInputValue(storedDate)) return storedDate;
  return fallbackDate ? formatDateInputInLondon(fallbackDate) : "";
};

export default function ReservationModal({
  onClose,
  isAdminMode = false,
}: ReservationModalProps) {
  const { user: authUser } = useAuth();
  const user = isAdminMode ? null : authUser;
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [offices, setOffices] = useState<Office[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [reservedSlots, setReservedSlots] = useState<
    { startTime: string; endTime: string }[]
  >([]);
  const [officeHours, setOfficeHours] = useState<{
    startTime: string;
    endTime: string;
  } | null>(null);
  const [selectedOfficeData, setSelectedOfficeData] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [useExistingCustomer, setUseExistingCustomer] = useState(false);

  const [formData, setFormData] = useState({
    office: "",
    type: { name: "", _id: "" },
    startDate: "",
    startTime: "10:00",
    endDate: "",
    endTime: "10:00",
    driverAge: "" as any,
    category: "",
    gearType: "manual" as "manual" | "automatic",
    phone: "",
    code: "",
    name: "",
    lastName: "",
    email: "",
    acceptTerms: false,
  });

  const [authStep, setAuthStep] = useState<"phone" | "code" | "register">(
    "phone",
  );
  const [selectedAddOns, setSelectedAddOns] = useState<
    { addOn: string; quantity: number; selectedTierIndex?: number }[]
  >([]);
  const router = useRouter();

  const [showAddOnsModal, setShowAddOnsModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [discountError, setDiscountError] = useState("");
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [customerUserId, setCustomerUserId] = useState<string>("");
  const [licenseFront, setLicenseFront] = useState<string>("");
  const [licenseBack, setLicenseBack] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [postalCode, setPostalCode] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [storedExtensionCost, setStoredExtensionCost] = useState<number>(0);
  const [storedPickupExtensionPrice, setStoredPickupExtensionPrice] =
    useState<number>(0);
  const [storedReturnExtensionPrice, setStoredReturnExtensionPrice] =
    useState<number>(0);
  const [
    hasStoredSeparatedExtensionPrices,
    setHasStoredSeparatedExtensionPrices,
  ] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState({
    front: false,
    back: false,
  });
  const [isManualPrice, setIsManualPrice] = useState(false);
  const [manualPricePerDay, setManualPricePerDay] = useState<string>("");
  const [manualPriceNote, setManualPriceNote] = useState<string>("");
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [customerMessage, setCustomerMessage] = useState<string>("");

  const selectedCategory = categories.find((c) => c._id === formData.category);

  const extensionPrices = useMemo(() => {
    if (
      selectedOfficeData &&
      formData.startDate &&
      formData.startTime &&
      formData.endDate &&
      formData.endTime
    ) {
      const startDate = new Date(`${formData.startDate}T00:00`);
      const endDate = new Date(`${formData.endDate}T00:00`);

      return calculateOfficeExtensionPrices({
        office: selectedOfficeData,
        pickupDate: startDate,
        pickupTime: formData.startTime,
        returnDate: endDate,
        returnTime: formData.endTime,
      });
    }

    return { pickupExtension: 0, returnExtension: 0 };
  }, [
    selectedOfficeData,
    formData.startDate,
    formData.startTime,
    formData.endDate,
    formData.endTime,
  ]);
  const canCalculateExtensionPrices = Boolean(
    selectedOfficeData &&
    formData.startDate &&
    formData.startTime &&
    formData.endDate &&
    formData.endTime,
  );

  const rentalDays = useMemo(() => {
    if (
      !formData.startDate ||
      !formData.endDate ||
      !formData.startTime ||
      !formData.endTime
    )
      return 0;
    const start = new Date(`${formData.startDate}T${formData.startTime}`);
    const end = new Date(`${formData.endDate}T${formData.endTime}`);
    const diffTime = end.getTime() - start.getTime();
    const totalMinutes = diffTime / (1000 * 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const billableHours = remainingMinutes > 15 ? totalHours + 1 : totalHours;

    if (billableHours <= 0) return 0;
    let totalDays: number;
    let extraHours: number;
    if (billableHours < 24) {
      totalDays = 1;
      extraHours = 0;
    } else {
      totalDays = Math.floor(billableHours / 24);
      extraHours = billableHours % 24;
      if (extraHours > 6) {
        totalDays += 1;
        extraHours = 0;
      }
    }
    return totalDays;
  }, [
    formData.startDate,
    formData.startTime,
    formData.endDate,
    formData.endTime,
  ]);

  const addOnsPrice = useMemo(() => {
    return selectedAddOns.reduce((sum, item) => {
      const addon = addOns.find((a) => a._id === item.addOn);
      if (!addon) return sum;
      if (addon.pricingType === "flat") {
        const amount = addon.flatPrice?.amount || 0;
        const isPerDay = addon.flatPrice?.isPerDay || false;
        return sum + (isPerDay ? amount * rentalDays : amount) * item.quantity;
      }
      if (
        item.selectedTierIndex !== undefined &&
        addon.tieredPrice?.tiers?.[item.selectedTierIndex]
      ) {
        const tier = addon.tieredPrice.tiers[item.selectedTierIndex];
        const isPerDay = addon.tieredPrice.isPerDay || false;
        return (
          sum +
          (isPerDay ? tier.price * rentalDays : tier.price) * item.quantity
        );
      }
      return sum;
    }, 0);
  }, [selectedAddOns, addOns, rentalDays]);

  const calculateCategoryPrice = (cat: Category) => {
    if (!formData.startDate || !formData.endDate) return null;
    const start = formData.startDate
      ? `${formData.startDate}T${formData.startTime}`
      : "";
    const end = formData.endDate
      ? `${formData.endDate}T${formData.endTime}`
      : "";
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return null;
    }

    const diffTime = endDate.getTime() - startDate.getTime();
    const totalMinutes = diffTime / (1000 * 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const billableHours = remainingMinutes > 15 ? totalHours + 1 : totalHours;
    if (!Number.isFinite(billableHours) || billableHours <= 0) return null;

    let totalDays: number;
    let extraHours: number;
    if (billableHours < 24) {
      totalDays = 1;
      extraHours = 0;
    } else {
      totalDays = Math.floor(billableHours / 24);
      extraHours = billableHours % 24;
      if (extraHours > 6) {
        totalDays += 1;
        extraHours = 0;
      }
    }

    const tier =
      cat.pricingTiers.find(
        (t) => totalDays >= t.minDays && totalDays <= t.maxDays,
      ) || cat.pricingTiers[cat.pricingTiers.length - 1];
    if (!tier || !Number.isFinite(tier.pricePerDay)) return null;
    const originalPricePerDay = tier.pricePerDay;
    let pricePerDay = tier.pricePerDay;
    if (cat.selloffer && cat.selloffer > 0) {
      pricePerDay = pricePerDay * (1 - cat.selloffer / 100);
    }
    const originalDaysPrice = totalDays * originalPricePerDay;
    const daysPrice = totalDays * pricePerDay;
    const extraHoursPrice = extraHours * (cat.extrahoursRate || 0);
    const originalTotalPrice = originalDaysPrice + extraHoursPrice;
    let totalPrice = daysPrice + extraHoursPrice;

    const extensionPrice =
      extensionPrices.pickupExtension + extensionPrices.returnExtension;

    totalPrice += extensionPrice;

    let breakdown = "";
    if (totalDays > 0 && extraHours > 0) {
      breakdown = `${totalDays} day${totalDays > 1 ? "s" : ""} × £${pricePerDay.toFixed(2)} + ${extraHours}h × £${(cat.extrahoursRate || 0).toFixed(2)}`;
    } else if (totalDays > 0) {
      breakdown = `${totalDays} day${totalDays > 1 ? "s" : ""} × £${pricePerDay.toFixed(2)}`;
    } else {
      breakdown = `${extraHours}h × £${(cat.extrahoursRate || 0).toFixed(2)}`;
    }

    if (extensionPrice > 0) {
      breakdown += ` + £${extensionPrice.toFixed(2)} extensions - either out of working time or weekend time`;
    }

    return {
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      originalTotalPrice: parseFloat(originalTotalPrice.toFixed(2)),
      breakdown,
      specialDaysPrice: 0,
    };
  };

  const priceCalc = usePriceCalculation(
    formData.startDate ? `${formData.startDate}T${formData.startTime}` : "",
    formData.endDate ? `${formData.endDate}T${formData.endTime}` : "",
    selectedCategory?.pricingTiers || [],
    (selectedCategory as any)?.extrahoursRate || 0,
    canCalculateExtensionPrices
      ? extensionPrices.pickupExtension
      : hasStoredSeparatedExtensionPrices
        ? storedPickupExtensionPrice
        : storedExtensionCost,
    canCalculateExtensionPrices
      ? extensionPrices.returnExtension
      : hasStoredSeparatedExtensionPrices
        ? storedReturnExtensionPrice
        : 0,
    formData.gearType === "automatic" &&
      (selectedCategory as any)?.gear?.availableTypes?.includes("automatic") &&
      (selectedCategory as any)?.gear?.availableTypes?.includes("manual")
      ? (selectedCategory as any)?.gear?.automaticExtraCost || 0
      : 0,
    addOnsPrice,
    0,
    [],
  );

  const manualDailyPriceValue = parseFloat(manualPricePerDay);
  const hasManualDailyPrice =
    isAdminMode &&
    isManualPrice &&
    !isNaN(manualDailyPriceValue) &&
    manualDailyPriceValue > 0;
  const displayedDailyRate = priceCalc
    ? hasManualDailyPrice
      ? manualDailyPriceValue
      : priceCalc.pricePerDay
    : 0;
  const displayedExtraHoursRate = priceCalc?.extraHoursRate || 0;
  const displayedRentalCharge = priceCalc
    ? priceCalc.totalDays * displayedDailyRate +
      priceCalc.extraHours * displayedExtraHoursRate
    : 0;
  const displayedPickupExtensionPrice =
    priceCalc?.pickupExtensionPrice || 0;
  const displayedReturnExtensionPrice =
    priceCalc?.returnExtensionPrice || 0;
  const displayedGearExtraCostPerDay =
    formData.gearType === "automatic" &&
    (selectedCategory as any)?.gear?.availableTypes?.includes("automatic") &&
    (selectedCategory as any)?.gear?.availableTypes?.includes("manual")
      ? (selectedCategory as any)?.gear?.automaticExtraCost || 0
      : 0;
  const displayedGearCharge = priceCalc
    ? displayedGearExtraCostPerDay * priceCalc.totalDays
    : 0;

  const finalPrice = useMemo(() => {
    if (!priceCalc) return null;

    // If admin enabled manual pricing, calculate with manual price
    if (isAdminMode && isManualPrice && manualPricePerDay) {
      const manualPrice = parseFloat(manualPricePerDay);
      if (!isNaN(manualPrice) && manualPrice > 0) {
        const daysPrice = priceCalc.totalDays * manualPrice;
        const extraHoursPrice =
          priceCalc.extraHours * (selectedCategory?.extrahoursRate || 0);
        let total = daysPrice + extraHoursPrice;

        // Add extensions
        total +=
          extensionPrices.pickupExtension + extensionPrices.returnExtension;

        // Add gear cost
        if (
          formData.gearType === "automatic" &&
          selectedCategory?.gear?.automaticExtraCost
        ) {
          total +=
            selectedCategory.gear.automaticExtraCost * priceCalc.totalDays;
        }

        // Add add-ons
        total += addOnsPrice;

        // Add special days
        if (priceCalc.specialDaysPrice) {
          total += priceCalc.specialDaysPrice;
        }

        // Apply discount if any
        if (appliedDiscount) {
          const discountAmount = (total * appliedDiscount.percentage) / 100;
          total -= discountAmount;
        }

        return parseFloat(total.toFixed(2));
      }
    }

    // Normal automatic calculation
    if (!appliedDiscount) return priceCalc.totalPrice;
    const discountAmount =
      (priceCalc.totalPrice * appliedDiscount.percentage) / 100;
    return parseFloat((priceCalc.totalPrice - discountAmount).toFixed(2));
  }, [
    priceCalc,
    appliedDiscount,
    isAdminMode,
    isManualPrice,
    manualPricePerDay,
    extensionPrices,
    formData.gearType,
    selectedCategory,
    addOnsPrice,
  ]);

  // Fetch offices and types
  useEffect(() => {
    Promise.all([
      fetch("/api/offices").then((res) => res.json()),
      fetch("/api/types").then((res) => res.json()),
    ])
      .then(([officeData, typeData]) => {
        setOffices(officeData.data || []);
        setTypes(typeData.data || []);
      })
      .catch((err) => console.log(err));
  }, []);

  // Fetch and filter categories when office and type selected
  useEffect(() => {
    if (formData.office && formData.type) {
      const typeId =
        typeof formData.type === "string" ? formData.type : formData.type._id;
      fetch(`/api/offices/${formData.office}`)
        .then((res) => res.json())
        .then((data) => {
          const office = data.data;
          setSelectedOfficeData(office);
          if (office?.categories && office.categories.length > 0) {
            const filtered = office.categories.filter((cat: any) => {
              const catTypeId =
                typeof cat.type === "string" ? cat.type : cat.type?._id;
              return catTypeId === typeId && cat.status === "active";
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

  // Fetch add-ons
  useEffect(() => {
    fetch("/api/addons?status=active")
      .then((res) => res.json())
      .then((data) => {
        console.log("Add-ons response:", data);
        const addonsData = data.data?.data || data.data || [];
        setAddOns(Array.isArray(addonsData) ? addonsData : []);
      })
      .catch((err) => console.log(err));
  }, []);

  console.log(priceCalc, "priceCalc");
  console.log(addOns, "addOns");

  // Fetch office hours and reserved slots
  useEffect(() => {
    if (formData.office && formData.startDate) {
      Promise.all([
        fetch(`/api/offices/${formData.office}`).then((r) => r.json()),
        fetch(
          `/api/reservations/by-office?office=${formData.office}&startDate=${formData.startDate}`,
        ).then((r) => r.json()),
      ])
        .then(([officeData, reservationData]) => {
          const office = officeData.data;
          const date = new Date(formData.startDate);
          const dayName = date
            .toLocaleDateString("en-US", { weekday: "long" })
            .toLowerCase();
          const workingDay = office?.workingTime?.find(
            (wt: WorkingTime) => wt.day === dayName && wt.isOpen,
          );

          if (workingDay) {
            const pickupWindow = getWorkingDayWindow(workingDay, "pickup");
            setOfficeHours({
              startTime: pickupWindow.startTime,
              endTime: pickupWindow.endTime,
            });
          }
          setReservedSlots(reservationData.data?.reservedSlots || []);
        })
        .catch((err) => console.log(err));
    }
  }, [formData.office, formData.startDate]);

 

  // Load data from sessionStorage and user context
  useEffect(() => {
    const stored = sessionStorage.getItem("rentalDetails");
    let hasRentalData = false;

    if (stored) {
      const details = JSON.parse(stored);
      const pickupDate = details.pickupDate
        ? new Date(details.pickupDate)
        : null;
      const returnDate = details.returnDate
        ? new Date(details.returnDate)
        : null;

      setStoredExtensionCost(
        typeof details.extensionCost === "number" ? details.extensionCost : 0,
      );
      const hasSeparatedExtensionPrices =
        typeof details.pickupExtensionPrice === "number" ||
        typeof details.returnExtensionPrice === "number";
      setHasStoredSeparatedExtensionPrices(hasSeparatedExtensionPrices);
      setStoredPickupExtensionPrice(
        typeof details.pickupExtensionPrice === "number"
          ? details.pickupExtensionPrice
          : 0,
      );
      setStoredReturnExtensionPrice(
        typeof details.returnExtensionPrice === "number"
          ? details.returnExtensionPrice
          : 0,
      );

      const typeObj =
        typeof details.type === "string"
          ? types.find((t) => t._id === details.type) || { name: "" }
          : details.type || { name: "" };
      setFormData((prev) => ({
        ...prev,
        office: details.office || "",
        type: typeObj,
        category: details.category || "",
        startDate: getStoredDateInputValue(
          details.startDateDisplay,
          pickupDate,
        ),
        startTime:
          details.pickupTime ||
          (pickupDate ? formatTimeInLondon(pickupDate) : "10:00"),
        endDate: getStoredDateInputValue(details.endDateDisplay, returnDate),
        endTime:
          details.returnTime ||
          (returnDate ? formatTimeInLondon(returnDate) : "10:00"),
        driverAge: details.driverAge || 25,
      }));
      hasRentalData = !!(
        details.office &&
        details.pickupDate &&
        details.returnDate &&
        details.category &&
        details.type
      );
    }

    if (isAdminMode) {
      if (hasRentalData) {
        setStep(2);
      } else {
        setStep(1);
      }
    } else {
      if (user) {
        setFormData((prev) => ({
          ...prev,
          name: user.name || "",
          lastName: user.lastName || "",
          email: user.emailData?.emailAddress || "",
          phone: user.phoneNumber?.replace("+44", "") || "",
        }));
        if (hasRentalData) {
          setStep(3);
        } else {
          setStep(1);
        }
      } else {
        if (hasRentalData) {
          setStep(2);
        } else {
          setStep(1);
        }
      }
    }
  }, [types, isAdminMode, user]);

  const displayUser = useMemo(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        return {
          name: parsed.name || "",
          lastName: parsed.lastName || "",
          email:
            parsed.emaildata?.emailAddress ||
            parsed.emailData?.emailAddress ||
            "",
          phone:
            parsed.phoneData?.phoneNumber?.replace("+44", "") ||
            parsed.phoneNumber?.replace("+44", "") ||
            "",
          address: parsed.address || "",
        };
      } catch (e) {
        console.log("Failed to parse user from localStorage");
      }
    }
    return {
      name: formData.name,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      address: address || "",
    };
  }, [
    formData.name,
    formData.lastName,
    formData.email,
    formData.phone,
    address,
  ]);

  const handleSelectUser = (userId: string, user: any) => {
    setSelectedUserId(userId);
    setCustomerUserId(user._id);
    setFormData((prev) => ({
      ...prev,
      name: user.name || "",
      lastName: user.lastName || "",
      email: user.emaildata?.emailAddress || user.emailData?.emailAddress || "",
      phone:
        user.phoneData?.phoneNumber?.replace("+44", "") ||
        user.phoneNumber?.replace("+44", "") ||
        "",
    }));
  };

  const handleSendCode = async () => {
    if (!formData.phone.trim()) {
      setErrors({ phone: "Phone required" });
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
        if (!isAdminMode) {
          localStorage.setItem("token", data.data.token);
          localStorage.setItem("user", JSON.stringify(data.data.user));
        }
        setCustomerUserId(data.data.user._id);
        setFormData((prev) => ({
          ...prev,
          name: data.data.user.name,
          lastName: data.data.user.lastName,
          email: data.data.user.emaildata?.emailAddress || "",
          phone:
            data.data.user.phoneData?.phoneNumber?.replace("+44", "") ||
            formData.phone,
        }));
        setStep(3);
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

  const handleLicenseUpload = async (file: File, side: "front" | "back") => {
    setUploadingLicense({ ...uploadingLicense, [side]: true });
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (uploadData.error) throw new Error(uploadData.error);

      if (side === "front") {
        setLicenseFront(uploadData.url);
      } else {
        setLicenseBack(uploadData.url);
      }
      showToast.success(`License ${side} uploaded!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Upload failed");
    } finally {
      setUploadingLicense({ ...uploadingLicense, [side]: false });
    }
  };

  const handleRegister = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name required";
    if (!formData.email.trim()) newErrors.email = "Email required";
    if (!address.trim()) newErrors.address = "Address required";
    if (!postalCode.trim()) newErrors.postalCode = "Postal code required";
    if (!city.trim()) newErrors.city = "City required";
    if (isAdminMode) {
      if (!licenseFront) newErrors.licenseFront = "licences front required";
      if (!licenseBack) newErrors.licenseBack = "licences back required";
    }
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
          address: address,
          postalCode: postalCode,
          city: city,
          isAdminMode: isAdminMode,
          ...(isAdminMode && {
            licenceAttached: { front: licenseFront, back: licenseBack },
          }),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      if (!isAdminMode) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
      }
      setCustomerUserId(data.data.user._id);
      setIsNewUser(true);
      setStep(3);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setErrors({ submit: message });
    } finally {
      setIsSubmitting(false);
    }
  };

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
      if (discount.categories?.length > 0 && formData.category) {
        const categoryIds = discount.categories.map((c: any) => c._id || c);
        if (!categoryIds.includes(formData.category))
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

  const handleSubmit = async () => {
    if (!formData.acceptTerms) {
      setErrors({ acceptTerms: "You must accept the terms and conditions" });
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      let userId = customerUserId;

      if (!isAdminMode) {
        const user = localStorage.getItem("user")
          ? JSON.parse(localStorage.getItem("user")!)
          : null;
        if (!token || !user) {
          setErrors({ submit: "Please login first" });
          setStep(2);
          return;
        }
        userId = user._id;
      } else {
        if (!customerUserId) {
          setErrors({ submit: "Customer verification required" });
          setStep(2);
          return;
        }
      }

      const addOnsCost = selectedAddOns.reduce((total, item) => {
        const addon = addOns.find((a) => a._id === item.addOn);
        if (!addon || !priceCalc) return total;

        if (addon.pricingType === "flat") {
          const amount = addon.flatPrice?.amount || 0;
          const isPerDay = addon.flatPrice?.isPerDay || false;
          const multiplier = isPerDay ? priceCalc.totalDays : 1;
          return total + amount * multiplier * item.quantity;
        } else {
          const tierIndex = item.selectedTierIndex ?? 0;
          const price = addon.tieredPrice?.tiers?.[tierIndex]?.price || 0;
          const isPerDay = addon.tieredPrice?.isPerDay || false;
          const multiplier = isPerDay ? priceCalc.totalDays : 1;
          return total + price * multiplier * item.quantity;
        }
      }, 0);

      const payload = {
        userData: {
          userId: userId,
          name: formData.name,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phone,
        },
        reservationData: {
          office: formData.office,
          category: formData.category,
          startDate: new Date(`${formData.startDate}T${formData.startTime}`),
          endDate: new Date(`${formData.endDate}T${formData.endTime}`),
          startDateDisplay: formData.startDate,
          endDateDisplay: formData.endDate,
          pickupTime: formData.startTime,
          returnTime: formData.endTime,
          totalPrice: finalPrice || priceCalc?.totalPrice || 0,
          driverAge: formData.driverAge,
          messege: customerMessage.trim() || "",
          status: "pending",
          addOns: selectedAddOns,
          discountCode: appliedDiscount?.code || null,
          selectedGear: formData.gearType,
          pickupExtensionPrice: canCalculateExtensionPrices
            ? extensionPrices.pickupExtension
            : hasStoredSeparatedExtensionPrices
              ? storedPickupExtensionPrice
              : storedExtensionCost || 0,
          returnExtensionPrice: canCalculateExtensionPrices
            ? extensionPrices.returnExtension
            : hasStoredSeparatedExtensionPrices
              ? storedReturnExtensionPrice
              : 0,
          reservationType: isAdminMode ? "Office" : "Website",
          ...(isAdminMode &&
            isManualPrice &&
            manualPricePerDay && {
              isManualPrice: true,
              manualPricePerDay: parseFloat(manualPricePerDay),
              manualPriceNote: manualPriceNote || "Admin custom pricing",
            }),
        },
      };

      if (appliedDiscount) {
        await fetch(`/api/discounts?id=${appliedDiscount._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addUserToUsedBy: user?._id }),
        });
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
      if (!data.success) throw new Error(data.error || "Reservation failed");
      setIsSuccess(true);
      if (isAdminMode) {
        setTimeout(() => onClose(), 2000);
      } else if (isNewUser) {
        const userRole = user?.role || "user";
        const dashboardUrl =
          userRole === "admin" ? "/dashboard" : "/customerDashboard";
        setTimeout(() => {
          router.push(`${dashboardUrl}?uploadLicense=true`);
        }, 2000);
      } else {
        const userRole = user?.role || "user";
        const dashboardUrl =
          userRole === "admin" ? "/dashboard" : "/customerDashboard";
        setTimeout(() => {
          router.replace(dashboardUrl);
        }, 2000);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setErrors({ submit: message || "Failed to create reservation" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Helper: format date nicely ───
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // ─── Step labels ───
  const stepLabels = ["Vehicle", "Verify", "Add-ons", "Review"];

  if (isSuccess) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-9999"
          onClick={onClose}
        />
        <div className="fixed inset-0 z-10000 flex items-center justify-center p-4">
          <div className="bg-linear-to-br from-[#0f172b] to-[#1a2744] rounded-3xl p-10 text-center max-w-md w-full shadow-2xl border border-white/10">
            <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-8 ring-4 ring-green-500/10">
              <FiCheckCircle className="text-6xl text-green-400" />
            </div>
            <h3 className="text-3xl font-black text-white mb-4">
              Booking Confirmed!
            </h3>
            <p className="text-gray-400 text-base leading-relaxed">
              {isNewUser
                ? "Your reservation is pending. You can view or edit it in your dashboard, and upload your licences when you're ready."
                : "We'll send you a confirmation email shortly."}
            </p>
          </div>
        </div>
      </>
    );
  }
  // Add this computed value (before the return statement, alongside other calculations)
  const addOnsTotalPrice = selectedAddOns.reduce((total, item) => {
    const addon = addOns.find((a) => a._id === item.addOn);
    if (!addon) return total;
    let price = 0;
    if (addon.pricingType === "flat") {
      const amount = addon.flatPrice?.amount || 0;
      const isPerDay = addon.flatPrice?.isPerDay || false;
      price = (isPerDay ? amount * rentalDays : amount) * item.quantity;
    } else if (
      item.selectedTierIndex !== undefined &&
      addon.tieredPrice?.tiers?.[item.selectedTierIndex]
    ) {
      const tier = addon.tieredPrice.tiers[item.selectedTierIndex];
      const isPerDay = addon.tieredPrice.isPerDay || false;
      price = (isPerDay ? tier.price * rentalDays : tier.price) * item.quantity;
    }
    return total + price;
  }, 0);
  const hasCompletedCustomerAuth =
    !isAdminMode && Boolean(user || customerUserId);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-9999"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-10000 flex items-stretch sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
<div className="relative bg-linear-to-br from-[#0f172b] to-[#1a2744] rounded-none sm:rounded-3xl w-full sm:max-w-5xl h-[100dvh] sm:h-[calc(100dvh-2rem)] sm:max-h-[920px] overflow-hidden border border-white/10 shadow-2xl flex flex-col">          {/* ── Header ── */}
          <div className="shrink-0 bg-linear-to-r from-[#0f172b] to-[#162038] border-b border-white/10 px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-3">
                {step > 1 && (
                  <button
                    onClick={() => {
                      setStep((prev) =>
                        prev === 3 && hasCompletedCustomerAuth
                          ? 1
                          : (Math.max(1, prev - 1) as 1 | 2 | 3 | 4),
                      );
                      // Scroll to top when going back
                      setTimeout(() => {
                        const modalBody =
                          document.querySelector(".modal-body-scroll");
                        if (modalBody) {
                          modalBody.scrollTop = 0;
                        }
                      }, 0);
                    }}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <FiArrowLeft className="text-white text-lg" />
                  </button>
                )}
                <div>
                  <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                    Book Your Van
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    {stepLabels[step - 1]} — Step {step} of 4
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                id="gtm-modal-close"
                className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"
              >
                <FiX className="text-white text-xl" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex-1 flex items-center gap-1.5">
                  <div
                    className={`h-1.5 sm:h-2 rounded-full flex-1 transition-all duration-500 ${
                      s < step
                        ? "bg-green-500"
                        : s === step
                          ? "bg-[#fe9a00]"
                          : "bg-white/10"
                    }`}
                  />
                  {s < 4 && (
                    <div
                      className={`w-1 h-1 rounded-full hidden sm:block ${
                        s < step ? "bg-green-500" : "bg-white/10"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="hidden sm:flex justify-between mt-1.5">
              {stepLabels.map((label, i) => (
                <span
                  key={label}
                  className={`text-[10px] font-semibold tracking-wider uppercase ${
                    i + 1 <= step ? "text-[#fe9a00]" : "text-gray-600"
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain modal-body-scroll">
<div className="p-3 sm:p-6 pb-6">              {/* ═══════ Step 1: Category Selection ═══════ */}
              {step === 1 && (
                <div className="relative min-h-[60vh] md:min-h-[65vh]">
                  {categories.length > 0 ? (
                    <>
                      {/* Desktop Grid */}
                      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                        {categories
                          .map((cat) => ({
                            category: cat,
                            price: calculateCategoryPrice(cat),
                          }))
                          .sort((a, b) => {
                            // Sort by price (lowest first)
                            const priceA = a.price?.totalPrice ?? Infinity;
                            const priceB = b.price?.totalPrice ?? Infinity;
                            return priceA - priceB;
                          })
                          .map(({ category: cat, price: catPrice }) => {
                            const isSelected = formData.category === cat._id;
                            return (
                              <div
                                key={`${cat._id}-${formData.category}`}
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    category: cat._id,
                                  }));
                                  // Open rules modal automatically
                                  setShowRulesModal(true);
                                }}
                                className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
                                  isSelected
                                    ? "ring-2 ring-[#fe9a00] shadow-lg shadow-[#fe9a00]/20 scale-[1.01]"
                                    : "ring-1 ring-white/10 hover:ring-white/25 hover:shadow-lg"
                                }`}
                              >
                                {/* Image */}
                                <div className="relative h-48 overflow-hidden">
                                  <Image
                                    key={cat.image}
                                    src={cat.image}
                                    alt={cat.name}
                                    fill
                                    priority
                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                    unoptimized
                                  />
                                  <div className="absolute inset-0 bg-linear-to-t from-[#0f172b] via-transparent to-black/30" />

                                  {/* Selected badge */}
                                  {isSelected && (
                                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#fe9a00] flex items-center justify-center shadow-lg">
                                      <FiCheckCircle className="text-white text-lg" />
                                    </div>
                                  )}

                                  {/* Sale badge */}
                                  {(cat as any).selloffer &&
                                    (cat as any).selloffer > 0 && (
                                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-red-500/90 backdrop-blur-sm">
                                        <span className="text-white text-xs font-black">
                                          {(cat as any).selloffer}% OFF
                                        </span>
                                      </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-4 bg-[#0f172b]/80 backdrop-blur-sm">
                                  <h4 className="text-white font-bold text-base mb-0.5 line-clamp-1">
                                    {cat.name}
                                  </h4>
                                  <p className="text-gray-400 text-xs mb-3 line-clamp-1">
                                    {cat.expert}
                                  </p>

                                  {/* Specs */}
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10">
                                      <FiUsers className="text-[#fe9a00] text-xs" />
                                      <span className="text-white text-[11px] font-medium">
                                        {cat.seats}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10">
                                      <BsFuelPump className="text-[#fe9a00] text-xs" />
                                      <span className="text-white text-[11px] font-medium">
                                        {cat.fuel}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10">
                                      <MdDoorSliding className="text-[#fe9a00] text-xs" />
                                      <span className="text-white text-[11px] font-medium">
                                        {cat.doors}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Price */}
                                  <div className="pt-3 border-t border-white/10">
                                    {catPrice ? (
                                      <div>
                                        {(cat as any).selloffer &&
                                        (cat as any).selloffer > 0 ? (
                                          <div className="flex items-end gap-2">
                                            <span className="text-2xl font-black text-[#37cf6f]">
                                              £{catPrice.totalPrice}
                                            </span>
                                            <span className="text-sm font-bold text-gray-500 line-through mb-0.5">
                                              £{catPrice.originalTotalPrice}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-2xl font-black text-[#37cf6f]">
                                            £{catPrice.totalPrice}
                                          </span>
                                        )}
                                        <p className="text-gray-500 text-[11px] mt-1">
                                          {catPrice.breakdown}
                                        </p>
                                        {catPrice.specialDaysPrice > 0 && (
                                          <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                            <span className="text-blue-300 font-semibold">
                                              +£{catPrice.specialDaysPrice}{" "}
                                              special days
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div>
                                        <div className="flex items-baseline gap-1">
                                          <span className="text-gray-500 text-xs">
                                            from
                                          </span>
                                          <span className="text-2xl font-black text-[#37cf6f]">
                                            £{cat.pricingTiers[0]?.pricePerDay}
                                          </span>
                                          <span className="text-gray-400 text-sm font-medium">
                                            /day
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      {/* Mobile: VanCard Layout */}
                      <div className="md:hidden space-y-3 pb-20">
                        {categories
                          .map((cat) => ({
                            category: cat,
                            price: calculateCategoryPrice(cat),
                          }))
                          .sort((a, b) => {
                            // Sort by price (lowest first)
                            const priceA = a.price?.totalPrice ?? Infinity;
                            const priceB = b.price?.totalPrice ?? Infinity;
                            return priceA - priceB;
                          })
                          .map(({ category: cat, price: catPrice }) => {
                            return (
                              <VanCard
                                key={`${cat._id}-${formData.category}`}
                                van={cat}
                                isSelected={formData.category === cat._id}
                                onSelect={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    category: cat._id,
                                  }));
                                  // Open rules modal automatically
                                  setShowRulesModal(true);
                                }}
                                calculatedPrice={catPrice?.totalPrice}
                                originalPrice={catPrice?.originalTotalPrice}
                                breakdown={catPrice?.breakdown}
                                specialDaysPrice={catPrice?.specialDaysPrice}
                              />
                            );
                          })}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] md:min-h-[65vh] py-12">
                      <div className="w-16 h-16 border-4 border-[#fe9a00]/30 border-t-[#fe9a00] rounded-full animate-spin mb-6" />
                      <p className="text-white text-lg font-bold animate-pulse">
                        Loading vehicles...
                      </p>
                      <p className="text-gray-500 text-sm mt-2">
                        Finding the best options for you
                      </p>

                      {/* Skeleton Cards Preview */}
                      <div className="mt-8 w-full max-w-4xl px-4">
                        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden animate-pulse"
                            >
                              <div className="h-48 bg-white/10" />
                              <div className="p-4 space-y-3">
                                <div className="h-4 bg-white/10 rounded w-3/4" />
                                <div className="h-3 bg-white/10 rounded w-1/2" />
                                <div className="flex gap-2">
                                  <div className="h-8 bg-white/10 rounded flex-1" />
                                  <div className="h-8 bg-white/10 rounded flex-1" />
                                </div>
                                <div className="h-6 bg-white/10 rounded w-1/3" />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="md:hidden space-y-3">
                          {[1, 2].map((i) => (
                            <div
                              key={i}
                              className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-pulse"
                            >
                              <div className="flex gap-4">
                                <div className="w-24 h-24 bg-white/10 rounded-xl shrink-0" />
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 bg-white/10 rounded w-3/4" />
                                  <div className="h-3 bg-white/10 rounded w-1/2" />
                                  <div className="h-6 bg-white/10 rounded w-1/3 mt-2" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

              
                </div>
              )}

              {/* ═══════ Step 2: Authentication ═══════ */}
              {step === 2 && (
                <div className="max-w-lg mx-auto space-y-5 py-2 sm:py-4">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-[#fe9a00]/10 flex items-center justify-center mx-auto mb-4">
                      <FiUser className="text-[#fe9a00] text-3xl" />
                    </div>
                    <h3 className="text-white font-black text-xl sm:text-2xl">
                      Customer Information
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                      {isAdminMode
                        ? "Select or register a customer"
                        : "Verify your identity to continue"}
                    </p>
                  </div>

                  {isAdminMode && authStep === "phone" && (
                    <div className="bg-white/5 rounded-xl p-1 flex gap-1 border border-white/10">
                      <button
                        onClick={() => setUseExistingCustomer(false)}
                        className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                          !useExistingCustomer
                            ? "bg-[#fe9a00] text-white shadow-lg"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        New Customer
                      </button>
                      <button
                        onClick={() => setUseExistingCustomer(true)}
                        className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                          useExistingCustomer
                            ? "bg-[#fe9a00] text-white shadow-lg"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Existing Customer
                      </button>
                    </div>
                  )}

                  {isAdminMode && useExistingCustomer ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Search Customer
                        </label>
                        <SearchableSelect
                          value={selectedUserId}
                          onChange={handleSelectUser}
                          placeholder="Search by phone or name..."
                        />
                      </div>
                      {selectedUserId && (
                        <button
                          onClick={() => setStep(3)}
                          className="w-full py-3.5 bg-[#fe9a00] hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-[#fe9a00]/20"
                        >
                          Continue with Selected Customer
                        </button>
                      )}
                    </div>
                  ) : (
                    authStep === "phone" && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-gray-300 text-sm font-semibold mb-2 flex items-center gap-2">
                            <FiPhone className="text-[#fe9a00]" />
                            Phone Number
                          </label>
                          <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">
                              +44
                            </div>
                            <input
                              type="tel"
                              id="gtm-phone-input"
                              value={formData.phone}
                              onChange={(e) => {
                                const digits = e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 10);
                                setFormData((prev) => ({
                                  ...prev,
                                  phone: digits,
                                }));
                              }}
                              className="w-full bg-white/5 border border-white/15 rounded-xl pl-14 pr-4 py-3.5 text-white text-base focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all placeholder:text-gray-600"
                              placeholder="7400123456"
                              maxLength={10}
                            />
                          </div>
                          {errors.phone && (
                            <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                              <FiAlertCircle className="text-sm" />
                              {errors.phone}
                            </p>
                          )}
                        </div>
                        <button
                          id="gtm-send-code"
                          onClick={
                            isAdminMode
                              ? () => setAuthStep("register")
                              : handleSendCode
                          }
                          disabled={isSubmitting}
                          className="w-full bg-[#fe9a00] text-white font-bold py-3.5 rounded-xl hover:bg-orange-500 transition-all disabled:opacity-50 shadow-lg shadow-[#fe9a00]/20 text-base"
                        >
                          {isSubmitting
                            ? "Sending..."
                            : isAdminMode
                              ? "Continue"
                              : "Send Verification Code"}
                        </button>
                      </div>
                    )
                  )}

                  {authStep === "code" && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">
                          Code sent to{" "}
                          <span className="text-white font-semibold">
                            +44{formData.phone}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label className="text-gray-300 text-sm font-semibold mb-2 block text-center">
                          Enter 6-digit Code
                        </label>
                        <input
                          type="text"
                          id="gtm-verification-code"
                          value={formData.code}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              code: e.target.value,
                            }))
                          }
                          maxLength={6}
                          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-4 text-white text-center text-3xl tracking-[0.5em] font-mono focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all placeholder:text-gray-700"
                          placeholder="••••••"
                        />
                        {errors.code && (
                          <p className="text-red-400 text-xs mt-2 text-center flex items-center justify-center gap-1">
                            <FiAlertCircle className="text-sm" />
                            {errors.code}
                          </p>
                        )}
                      </div>
                      <button
                        id="gtm-verify-code"
                        onClick={handleVerifyCode}
                        disabled={isSubmitting}
                        className="w-full bg-[#fe9a00] text-white font-bold py-3.5 rounded-xl hover:bg-orange-500 transition-all disabled:opacity-50 shadow-lg shadow-[#fe9a00]/20"
                      >
                        {isSubmitting ? "Verifying..." : "Verify Code"}
                      </button>
                      <button
                        onClick={() => setAuthStep("phone")}
                        className="w-full text-gray-400 hover:text-[#fe9a00] text-sm transition-colors"
                      >
                        ← Change phone number
                      </button>
                    </div>
                  )}

                  {authStep === "register" && (
                    <div className="space-y-4">
                      <div className="text-center mb-2">
                        <p className="text-gray-400 text-sm">
                          Complete your profile to continue
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-gray-300 text-sm font-semibold mb-2 flex items-center gap-2">
                            <FiUser className="text-[#fe9a00]" />
                            First Name
                          </label>
                          <input
                            type="text"
                            id="gtm-first-name"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all placeholder:text-gray-600"
                            placeholder="John"
                          />
                          {errors.name && (
                            <p className="text-red-400 text-xs mt-1">
                              {errors.name}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-gray-300 text-sm font-semibold mb-2 flex items-center gap-2">
                            <FiUser className="text-[#fe9a00]" />
                            Last Name
                          </label>
                          <input
                            type="text"
                            id="gtm-last-name"
                            value={formData.lastName}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                lastName: e.target.value,
                              }))
                            }
                            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all placeholder:text-gray-600"
                            placeholder="Doe"
                          />
                          {errors.lastName && (
                            <p className="text-red-400 text-xs mt-1">
                              {errors.lastName}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-gray-300 text-sm font-semibold mb-2 flex items-center gap-2">
                          <FiMail className="text-[#fe9a00]" />
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="gtm-email"
                          value={formData.email}
                          required
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all placeholder:text-gray-600"
                          placeholder="john@example.com"
                        />
                        {errors.email && (
                          <p className="text-red-400 text-xs mt-1">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-gray-300 text-sm font-semibold mb-2 flex items-center gap-2">
                          <FiMapPin className="text-[#fe9a00]" />
                          Address
                        </label>
                        <input
                          type="text"
                          id="gtm-address"
                          value={address}
                          required
                          onChange={(e) => {
                            setAddress(e.target.value);
                            setErrors({ ...errors, address: "" });
                          }}
                          className={`w-full bg-white/5 border ${
                            errors.address
                              ? "border-red-500/50"
                              : "border-white/15"
                          } rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all`}
                          placeholder="123 Main Street"
                        />
                        {errors.address && (
                          <p className="text-red-400 text-xs mt-1">
                            {errors.address}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-gray-300 text-sm font-semibold mb-2 block">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            id="gtm-postal-code"
                            value={postalCode}
                            required
                            onChange={(e) => {
                              setPostalCode(e.target.value);
                              setErrors({ ...errors, postalCode: "" });
                            }}
                            className={`w-full bg-white/5 border ${
                              errors.postalCode
                                ? "border-red-500/50"
                                : "border-white/15"
                            } rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all`}
                            placeholder="SW1A 1AA"
                          />
                          {errors.postalCode && (
                            <p className="text-red-400 text-xs mt-1">
                              {errors.postalCode}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-gray-300 text-sm font-semibold mb-2 block">
                            City
                          </label>
                          <input
                            type="text"
                            id="gtm-city"
                            value={city}
                            onChange={(e) => {
                              setCity(e.target.value);
                              setErrors({ ...errors, city: "" });
                            }}
                            className={`w-full bg-white/5 border ${
                              errors.city
                                ? "border-red-500/50"
                                : "border-white/15"
                            } rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all`}
                            placeholder="London"
                          />
                          {errors.city && (
                            <p className="text-red-400 text-xs mt-1">
                              {errors.city}
                            </p>
                          )}
                        </div>
                      </div>

                      {isAdminMode && (
                        <div className="space-y-4 pt-2">
                          <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                            <FiShield className="text-[#fe9a00]" />
                            Licence Upload
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-gray-400 text-xs font-medium mb-1.5 block">
                                Front Side
                              </label>
                              {licenseFront ? (
                                <div className="relative rounded-xl overflow-hidden border border-white/10">
                                  <img
                                    src={licenseFront}
                                    alt="Licence Front"
                                    className="w-full h-28 object-cover"
                                  />
                                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                                    <span className="text-white text-xs font-semibold bg-[#fe9a00] px-3 py-1.5 rounded-lg">
                                      {uploadingLicense.front
                                        ? "Uploading..."
                                        : "Change"}
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) =>
                                        e.target.files?.[0] &&
                                        handleLicenseUpload(
                                          e.target.files[0],
                                          "front",
                                        )
                                      }
                                      disabled={uploadingLicense.front}
                                    />
                                  </label>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-white/15 rounded-xl cursor-pointer hover:border-[#fe9a00]/50 hover:bg-[#fe9a00]/5 transition-all">
                                  <span className="text-gray-500 text-xs font-medium">
                                    {uploadingLicense.front
                                      ? "Uploading..."
                                      : "+ Upload Front"}
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) =>
                                      e.target.files?.[0] &&
                                      handleLicenseUpload(
                                        e.target.files[0],
                                        "front",
                                      )
                                    }
                                    disabled={uploadingLicense.front}
                                  />
                                </label>
                              )}
                              {errors.licenseFront && (
                                <p className="text-red-400 text-xs mt-1">
                                  {errors.licenseFront}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="text-gray-400 text-xs font-medium mb-1.5 block">
                                Back Side
                              </label>
                              {licenseBack ? (
                                <div className="relative rounded-xl overflow-hidden border border-white/10">
                                  <img
                                    src={licenseBack}
                                    alt="Licence Back"
                                    className="w-full h-28 object-cover"
                                  />
                                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                                    <span className="text-white text-xs font-semibold bg-[#fe9a00] px-3 py-1.5 rounded-lg">
                                      {uploadingLicense.back
                                        ? "Uploading..."
                                        : "Change"}
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) =>
                                        e.target.files?.[0] &&
                                        handleLicenseUpload(
                                          e.target.files[0],
                                          "back",
                                        )
                                      }
                                      disabled={uploadingLicense.back}
                                    />
                                  </label>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-white/15 rounded-xl cursor-pointer hover:border-[#fe9a00]/50 hover:bg-[#fe9a00]/5 transition-all">
                                  <span className="text-gray-500 text-xs font-medium">
                                    {uploadingLicense.back
                                      ? "Uploading..."
                                      : "+ Upload Back"}
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) =>
                                      e.target.files?.[0] &&
                                      handleLicenseUpload(
                                        e.target.files[0],
                                        "back",
                                      )
                                    }
                                    disabled={uploadingLicense.back}
                                  />
                                </label>
                              )}
                              {errors.licenseBack && (
                                <p className="text-red-400 text-xs mt-1">
                                  {errors.licenseBack}
                                </p>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="text-gray-300 text-sm font-semibold mb-2 block">
                              Full Address
                            </label>
                            <textarea
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              rows={2}
                              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 resize-none transition-all placeholder:text-gray-600"
                              placeholder="Full address"
                            />
                            {errors.address && (
                              <p className="text-red-400 text-xs mt-1">
                                {errors.address}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {errors.submit && (
                        <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                          {errors.submit}
                        </p>
                      )}

                      <button
                        id="gtm-register"
                        onClick={handleRegister}
                        disabled={isSubmitting}
                        className="w-full bg-[#fe9a00] text-white font-bold py-3.5 rounded-xl hover:bg-orange-500 transition-all disabled:opacity-50 shadow-lg shadow-[#fe9a00]/20 text-base mt-2"
                      >
                        {isSubmitting
                          ? "Creating Account..."
                          : "Complete Registration"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ═══════ Step 3: Add-ons & Gear ═══════ */}
              {step === 3 && (
                <div className="space-y-5">
                  {/* Vehicle Summary */}
                  {selectedCategory && priceCalc && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
                      <div className="flex gap-4">
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0">
                          <Image
                            src={selectedCategory.image}
                            alt={selectedCategory.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-bold text-base sm:text-lg truncate">
                            {selectedCategory.name}
                          </h4>
                          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                            {selectedCategory.expert}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <FiClock className="text-gray-500 text-xs" />
                            <span className="text-gray-400 text-xs">
                              {priceCalc.totalDays} day
                              {priceCalc.totalDays > 1 ? "s" : ""}
                              {priceCalc.totalHours % 24 > 0 &&
                                `, ${priceCalc.totalHours % 24}h`}
                            </span>
                          </div>
                          <p className="text-[#fe9a00] font-black text-xl sm:text-2xl mt-1">
                            £{priceCalc.totalPrice}
                          </p>
                        </div>
                      </div>

                      {/* Gear Selection */}
                      {selectedCategory?.gear?.availableTypes?.length > 1 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <h5 className="text-gray-300 text-sm font-semibold mb-3">
                            Select Gearbox
                          </h5>
                          <div className="grid grid-cols-2 gap-3">
                            {selectedCategory.gear.availableTypes.includes(
                              "manual",
                            ) && (
                              <button
                                type="button"
                                id="gtm-gear-manual"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    gearType: "manual",
                                  }))
                                }
                                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border ${
                                  formData.gearType === "manual"
                                    ? "bg-[#fe9a00]/15 border-[#fe9a00] text-[#fe9a00]"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:border-white/25"
                                }`}
                              >
                                ⚙️ Manual
                              </button>
                            )}
                            {selectedCategory.gear.availableTypes.includes(
                              "automatic",
                            ) && (
                              <button
                                type="button"
                                id="gtm-gear-automatic"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    gearType: "automatic",
                                  }))
                                }
                                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border ${
                                  formData.gearType === "automatic"
                                    ? "bg-[#fe9a00]/15 border-[#fe9a00] text-[#fe9a00]"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:border-white/25"
                                }`}
                              >
                                🅰️ Automatic
                                {(selectedCategory.gear as any)
                                  ?.automaticExtraCost > 0 && (
                                  <span className="block text-[10px] font-normal mt-0.5 opacity-80">
                                    +£
                                    {
                                      (selectedCategory.gear as any)
                                        .automaticExtraCost
                                    }
                                    /day
                                  </span>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add-ons */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <FiPackage className="text-[#fe9a00] text-lg" />
                      <h4 className="text-white font-bold text-base sm:text-lg">
                        Available Add-ons
                      </h4>
                      {selectedAddOns.length > 0 && (
                        <span className="ml-auto text-xs font-bold text-[#fe9a00] bg-[#fe9a00]/10 px-2.5 py-1 rounded-full">
                          {selectedAddOns.length} selected
                        </span>
                      )}
                    </div>

                    {!Array.isArray(addOns) || addOns.length === 0 ? (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                        <FiAlertCircle className="text-gray-500 text-3xl mx-auto mb-3" />
                        <p className="text-gray-400 text-sm font-medium">
                          No add-ons available
                        </p>
                      </div>
                    ) : !priceCalc ? (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                        <div className="w-10 h-10 border-3 border-[#fe9a00]/30 border-t-[#fe9a00] rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">
                          Loading pricing...
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-min overflow-y-auto pr-1">
                        {/* Desktop Grid */}
                        <div className="hidden md:grid grid-cols-4 gap-1">
                          {addOns
                            .filter((addon) => {
                              const rawCatId = (addon as any).categoryId;
                              const addonCategoryId = rawCatId?._id
                                ? String(rawCatId._id)
                                : rawCatId && typeof rawCatId === "string" && rawCatId.length > 0
                                ? rawCatId
                                : null;
                              if (addonCategoryId) {
                                if (!formData.category || addonCategoryId !== String(formData.category)) return false;
                              }
                              return (
                                addon.pricingType === "flat" ||
                                addon.tieredPrice?.tiers?.some(
                                  (tier) =>
                                    priceCalc.totalDays >= tier.minDays &&
                                    priceCalc.totalDays <= tier.maxDays,
                                )
                              );
                            })
                            .sort((a, b) => {
                              const typeA = (a as any).type || "";
                              const typeB = (b as any).type || "";
                              if (typeA === typeB) return 0;
                              if (!typeA) return 1;
                              if (!typeB) return -1;
                              return typeA.localeCompare(typeB);
                            })
                            .map((addon) => {
                              const selected = selectedAddOns.find(
                                (s) => s.addOn === addon._id,
                              );
                              const rentalDays = priceCalc.totalDays;

                              const addonType = (addon as any).type;
                              const isTypeDisabled =
                                addonType &&
                                selectedAddOns.some((s) => {
                                  const selectedAddon = addOns.find(
                                    (a) => a._id === s.addOn,
                                  );
                                  return (
                                    selectedAddon &&
                                    (selectedAddon as any).type === addonType &&
                                    selectedAddon._id !== addon._id
                                  );
                                });

                              const isActive = !!selected;
                              const canSelect = !isTypeDisabled && !isActive;

                              return (
                                <div
                                  key={addon._id}
                                  title={addon.name}
                                  onClick={() => {
                                    if (!canSelect) return;
                                    let defaultTierIndex = undefined;
                                    if (
                                      addon.pricingType === "tiered" &&
                                      addon.tieredPrice?.tiers
                                    ) {
                                      const matchingTierIndex =
                                        addon.tieredPrice.tiers.findIndex(
                                          (tier) =>
                                            rentalDays >= tier.minDays &&
                                            rentalDays <= tier.maxDays,
                                        );
                                      defaultTierIndex =
                                        matchingTierIndex !== -1
                                          ? matchingTierIndex
                                          : 0;
                                    }
                                    setSelectedAddOns((prev) => [
                                      ...prev,
                                      {
                                        addOn: addon._id,
                                        quantity: 1,
                                        selectedTierIndex: defaultTierIndex,
                                      },
                                    ]);
                                  }}
                                  className={`rounded-xl p-4 transition-all border cursor-pointer ${
                                    isActive
                                      ? "bg-[#fe9a00]/10 border-[#fe9a00]/40"
                                      : isTypeDisabled
                                        ? "bg-white/2 border-white/5 opacity-40 cursor-not-allowed"
                                        : "bg-white/5 border-white/10 hover:border-[#fe9a00]/30 hover:bg-white/10"
                                  }`}
                                >
                                  <div className="flex flex-col items-center gap-3">
                                    {/* Icon */}
                                    <div className="w-30 h-30      flex items-center justify-center shrink-0">
                                      {(addon as any).icon ? (
                                        <img
                                          src={(addon as any).icon}
                                          alt={addon.name}
                                          className="w-full h-full rounded-xl object-cover"
                                        />
                                      ) : (
                                        <FiPackage className="text-white/30 text-xl" />
                                      )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <h5 className="text-white font-semibold text-xs truncate">
                                          {addon.name}
                                        </h5>
                                        {isActive && (
                                          <FiCheckCircle className="text-[#fe9a00] text-sm shrink-0" />
                                        )}
                                      </div>
                                      {/* {addon.description && (
                                        <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                                          {addon.description}
                                        </p>
                                      )} */}
                                      {isTypeDisabled && (
                                        <p className="text-red-400/80 text-[11px] mt-1 font-medium">
                                          Another option of this type is
                                          selected
                                        </p>
                                      )}

                                      {/* Price display */}
                                      <div className="mt-2">
                                        {addon.pricingType === "flat" ? (
                                          <p className="text-[#fe9a00] text-sm font-bold">
                                            £{addon.flatPrice?.amount || 0}
                                            {addon.flatPrice?.isPerDay && (
                                              <span className="text-gray-500 text-xs font-normal ml-1.5">
                                                × {rentalDays} day
                                                {rentalDays > 1 ? "s" : ""} = £
                                                {(
                                                  (addon.flatPrice?.amount ||
                                                    0) * rentalDays
                                                ).toFixed(2)}
                                              </span>
                                            )}
                                          </p>
                                        ) : (
                                          <div>
                                            {addon.tieredPrice?.tiers
                                              ?.filter(
                                                (tier) =>
                                                  rentalDays >= tier.minDays &&
                                                  rentalDays <= tier.maxDays,
                                              )
                                              .map((tier) => {
                                                const originalIdx =
                                                  addon.tieredPrice?.tiers?.indexOf(
                                                    tier,
                                                  ) || 0;
                                                const totalPrice = addon
                                                  .tieredPrice?.isPerDay
                                                  ? tier.price * rentalDays
                                                  : tier.price;
                                                return (
                                                  <p
                                                    key={originalIdx}
                                                    className="text-[#fe9a00] text-sm font-bold"
                                                  >
                                                    £{tier.price}
                                                    {addon.tieredPrice
                                                      ?.isPerDay && (
                                                      <span className="text-gray-500 text-xs font-normal ml-1.5">
                                                        × {rentalDays} day
                                                        {rentalDays > 1
                                                          ? "s"
                                                          : ""}{" "}
                                                        = £
                                                        {totalPrice.toFixed(2)}
                                                      </span>
                                                    )}
                                                  </p>
                                                );
                                              })}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Remove button for selected addons */}
                                    {isActive && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedAddOns((prev) =>
                                            prev.filter(
                                              (s) => s.addOn !== addon._id,
                                            ),
                                          );
                                        }}
                                        className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center transition-colors shrink-0"
                                      >
                                        <FiX className="text-xs" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>

                        {/* Mobile List */}
                        <div className="md:hidden space-y-2">
                          {addOns
                            .filter((addon) => {
                              const rawCatId = (addon as any).categoryId;
                              const addonCategoryId = rawCatId?._id
                                ? String(rawCatId._id)
                                : rawCatId && typeof rawCatId === "string" && rawCatId.length > 0
                                ? rawCatId
                                : null;
                              if (addonCategoryId) {
                                if (!formData.category || addonCategoryId !== String(formData.category)) return false;
                              }
                              return (
                                addon.pricingType === "flat" ||
                                addon.tieredPrice?.tiers?.some(
                                  (tier) =>
                                    priceCalc.totalDays >= tier.minDays &&
                                    priceCalc.totalDays <= tier.maxDays,
                                )
                              );
                            })
                            .sort((a, b) => {
                              const typeA = (a as any).type || "";
                              const typeB = (b as any).type || "";
                              if (typeA === typeB) return 0;
                              if (!typeA) return 1;
                              if (!typeB) return -1;
                              return typeA.localeCompare(typeB);
                            })
                            .map((addon) => {
                              const selected = selectedAddOns.find(
                                (s) => s.addOn === addon._id,
                              );
                              const rentalDays = priceCalc.totalDays;

                              const addonType = (addon as any).type;
                              const isTypeDisabled =
                                addonType &&
                                selectedAddOns.some((s) => {
                                  const selectedAddon = addOns.find(
                                    (a) => a._id === s.addOn,
                                  );
                                  return (
                                    selectedAddon &&
                                    (selectedAddon as any).type === addonType &&
                                    selectedAddon._id !== addon._id
                                  );
                                });

                              const isActive = !!selected;
                              const canSelect = !isTypeDisabled && !isActive;

                              return (
                                <div
                                  key={addon._id}
                                  onClick={() => {
                                    if (!canSelect) return;
                                    let defaultTierIndex = undefined;
                                    if (
                                      addon.pricingType === "tiered" &&
                                      addon.tieredPrice?.tiers
                                    ) {
                                      const matchingTierIndex =
                                        addon.tieredPrice.tiers.findIndex(
                                          (tier) =>
                                            rentalDays >= tier.minDays &&
                                            rentalDays <= tier.maxDays,
                                        );
                                      defaultTierIndex =
                                        matchingTierIndex !== -1
                                          ? matchingTierIndex
                                          : 0;
                                    }
                                    setSelectedAddOns((prev) => [
                                      ...prev,
                                      {
                                        addOn: addon._id,
                                        quantity: 1,
                                        selectedTierIndex: defaultTierIndex,
                                      },
                                    ]);
                                  }}
                                  className={`rounded-xl p-1 transition-all border ${
                                    isActive
                                      ? "bg-[#fe9a00]/10 border-[#fe9a00]/40"
                                      : isTypeDisabled
                                        ? "bg-white/2 border-white/5 opacity-40 cursor-not-allowed"
                                        : "bg-white/5 border-white/10 hover:border-[#fe9a00]/30 hover:bg-white/10"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {/* Icon */}
                                    <div className="w-20 h-20    flex items-center justify-center shrink-0">
                                      {(addon as any).icon ? (
                                        <img
                                          src={(addon as any).icon}
                                          alt={addon.name}
                                          className="w-20 h-20 rounded-xl object-contain"
                                        />
                                      ) : (
                                        <FiPackage className="text-white/30 text-lg" />
                                      )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <h5 className="text-white font-semibold text-xs truncate">
                                          {addon.name}
                                        </h5>
                                        {isActive && (
                                          <FiCheckCircle className="text-[#fe9a00] text-sm shrink-0" />
                                        )}
                                      </div>
                                      {/* {addon.description && (
                                        <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                                          {addon.description}
                                        </p>
                                      )} */}
                                      {isTypeDisabled && (
                                        <p className="text-red-400/80 text-[11px] mt-1 font-medium">
                                          Another option of this type is
                                          selected
                                        </p>
                                      )}

                                      {/* Price display */}
                                      <div className="mt-2">
                                        {addon.pricingType === "flat" ? (
                                          <p className="text-[#fe9a00] text-sm font-bold">
                                            £{addon.flatPrice?.amount || 0}
                                            {addon.flatPrice?.isPerDay && (
                                              <span className="text-gray-500 text-xs font-normal ml-1.5">
                                                × {rentalDays} day
                                                {rentalDays > 1 ? "s" : ""} = £
                                                {(
                                                  (addon.flatPrice?.amount ||
                                                    0) * rentalDays
                                                ).toFixed(2)}
                                              </span>
                                            )}
                                          </p>
                                        ) : (
                                          <div>
                                            {addon.tieredPrice?.tiers
                                              ?.filter(
                                                (tier) =>
                                                  rentalDays >= tier.minDays &&
                                                  rentalDays <= tier.maxDays,
                                              )
                                              .map((tier) => {
                                                const originalIdx =
                                                  addon.tieredPrice?.tiers?.indexOf(
                                                    tier,
                                                  ) || 0;
                                                const totalPrice = addon
                                                  .tieredPrice?.isPerDay
                                                  ? tier.price * rentalDays
                                                  : tier.price;
                                                return (
                                                  <p
                                                    key={originalIdx}
                                                    className="text-[#fe9a00] text-sm font-bold"
                                                  >
                                                    £{tier.price}
                                                    {addon.tieredPrice
                                                      ?.isPerDay && (
                                                      <span className="text-gray-500 text-xs font-normal ml-1.5">
                                                        × {rentalDays} day
                                                        {rentalDays > 1
                                                          ? "s"
                                                          : ""}{" "}
                                                        = £
                                                        {totalPrice.toFixed(2)}
                                                      </span>
                                                    )}
                                                  </p>
                                                );
                                              })}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Remove button for selected addons */}
                                    {isActive && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedAddOns((prev) =>
                                            prev.filter(
                                              (s) => s.addOn !== addon._id,
                                            ),
                                          );
                                        }}
                                        className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center transition-colors shrink-0"
                                      >
                                        <FiX className="text-xs" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>

                
                </div>
              )}

               {/* ═══════ Step 4: Final Review & Confirm ═══════ */}
              {step === 4 && (
                <div className="space-y-3 pb-0">
                  {/* Two Column Layout on Desktop */}
                  <div className="grid grid-cols-1 gap-3">
                    {/* Left Column */}
                    <div className="space-y-3">
                      {/* Vehicle Card - Compact */}
                      {selectedCategory && (
                        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                          <div className="flex gap-3 p-3">
                            <div className="relative w-24 h-20 sm:w-28 sm:h-24 rounded-lg overflow-hidden shrink-0">
                              <Image
                                src={selectedCategory.image}
                                alt={selectedCategory.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-black text-sm sm:text-base leading-tight truncate">
                                {selectedCategory.name}
                              </h4>
                              <p className="text-gray-500 text-[10px] mt-0.5">
                                {selectedCategory.expert} or similar
                              </p>
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                                  <FiUsers className="text-[#fe9a00] text-[9px]" />
                                  <span className="text-white text-[9px] font-medium">
                                    {selectedCategory.seats}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                                  <BsFuelPump className="text-[#fe9a00] text-[9px]" />
                                  <span className="text-white text-[9px] font-medium">
                                    {selectedCategory.fuel}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                                  <MdDoorSliding className="text-[#fe9a00] text-[9px]" />
                                  <span className="text-white text-[9px] font-medium">
                                    {selectedCategory.doors}
                                  </span>
                                </div>
                                {formData.gearType &&
                                  selectedCategory?.gear?.availableTypes &&
                                  selectedCategory.gear.availableTypes.length >
                                    1 && (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#fe9a00]/10 border border-[#fe9a00]/30">
                                      <span className="text-[#fe9a00] text-[9px] font-bold capitalize">
                                        {formData.gearType === "automatic"
                                          ? "🅰️"
                                          : "⚙️"}{" "}
                                        {formData.gearType}
                                      </span>
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Rental Period - Compact inline */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <FiCalendar className="text-[#fe9a00] text-sm" />
                          <h4 className="text-white font-bold text-xs">
                            Rental Period
                          </h4>
                          {priceCalc && (
                            <span className="ml-auto text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                              {priceCalc.totalDays} day
                              {priceCalc.totalDays > 1 ? "s" : ""}
                              {priceCalc.totalHours % 24 > 0 &&
                                ` ${priceCalc.totalHours % 24}h`}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                            <p className="text-gray-500 text-[9px] uppercase tracking-wider font-semibold leading-none mb-0.5">
                              Pickup
                            </p>
                            <p className="text-white font-bold text-[11px] leading-tight">
                              {formatDate(formData.startDate)}
                            </p>
                            <p className="text-[#fe9a00] font-semibold text-[11px]">
                              {formData.startTime}
                            </p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                            <p className="text-gray-500 text-[9px] uppercase tracking-wider font-semibold leading-none mb-0.5">
                              Return
                            </p>
                            <p className="text-white font-bold text-[11px] leading-tight">
                              {formatDate(formData.endDate)}
                            </p>
                            <p className="text-[#fe9a00] font-semibold text-[11px]">
                              {formData.endTime}
                            </p>
                          </div>
                        </div>
                        {/* Location inline */}
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/5">
                          <FiMapPin className="text-[#fe9a00] text-xs shrink-0" />
                          <span className="text-gray-500 text-[10px]">
                            Pickup:
                          </span>
                          <span className="text-white font-semibold text-[11px] truncate">
                            {
                              offices.find((o) => o._id === formData.office)
                                ?.name
                            }
                          </span>
                        </div>
                      </div>

                      {/* Customer Details - Compact */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <FiUser className="text-[#fe9a00] text-sm" />
                          <h4 className="text-white font-bold text-xs">
                            Customer
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <div className="flex items-center justify-between col-span-2 sm:col-span-1">
                            <span className="text-gray-500 text-[11px]">
                              Name
                            </span>
                            <span className="text-white font-semibold text-[11px]">
                              {formData.name} {formData.lastName}
                            </span>
                          </div>
                          <div className="flex items-center justify-between col-span-2 sm:col-span-1">
                            <span className="text-gray-500 text-[11px]">
                              Phone
                            </span>
                            <span className="text-white font-semibold text-[11px]">
                              {displayUser.phone
                                ? `+44 ${displayUser.phone}`
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between col-span-2 sm:col-span-1">
                            <span className="text-gray-500 text-[11px]">
                              Email
                            </span>
                            <span className="text-white font-semibold text-[11px] truncate max-w-[140px]">
                              {displayUser.email || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between col-span-2 sm:col-span-1">
                            <span className="text-gray-500 text-[11px]">
                              Age
                            </span>
                            <span className="text-white font-semibold text-[11px]">
                              {formData.driverAge} yrs
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-3">
                      {/* Customer Message - Compact */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                        <label className="text-gray-300 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                          <FiAlertCircle className="text-[#fe9a00] text-xs" />
                          Special Requests (Optional)
                        </label>
                        <textarea
                          value={customerMessage}
                          onChange={(e) => setCustomerMessage(e.target.value)}
                          rows={2}
                          maxLength={500}
                          placeholder="Any special requests or notes..."
                          className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-base placeholder:text-xs focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 resize-none transition-all placeholder:text-gray-600"
                        />
                        <p className="text-gray-600 text-[9px] mt-1 text-right">
                          {customerMessage.length}/500
                        </p>
                      </div>
                      {/* Add-ons Summary */}
                      {selectedAddOns.length > 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <FiPackage className="text-[#fe9a00] text-sm" />
                            <h4 className="text-white font-bold text-xs">
                              Add-ons
                            </h4>
                            <span className="ml-auto text-[10px] font-bold text-[#fe9a00] bg-[#fe9a00]/10 px-1.5 py-0.5 rounded-full">
                              {selectedAddOns.length}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {selectedAddOns.map((item) => {
                              const addon = addOns.find(
                                (a) => a._id === item.addOn,
                              );
                              if (!addon) return null;
                              let price = 0;
                              if (addon.pricingType === "flat") {
                                const amount = addon.flatPrice?.amount || 0;
                                const isPerDay =
                                  addon.flatPrice?.isPerDay || false;
                                price =
                                  (isPerDay ? amount * rentalDays : amount) *
                                  item.quantity;
                              } else if (
                                item.selectedTierIndex !== undefined &&
                                addon.tieredPrice?.tiers?.[
                                  item.selectedTierIndex
                                ]
                              ) {
                                const tier =
                                  addon.tieredPrice.tiers[
                                    item.selectedTierIndex
                                  ];
                                const isPerDay =
                                  addon.tieredPrice.isPerDay || false;
                                price =
                                  (isPerDay
                                    ? tier.price * rentalDays
                                    : tier.price) * item.quantity;
                              }
                              return (
                                <div
                                  key={item.addOn}
                                  className="flex items-center justify-between bg-white/5 rounded-md px-2 py-1.5 border border-white/5"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="w-1 h-1 rounded-full bg-[#fe9a00] shrink-0" />
                                    <span className="text-gray-300 text-[11px] truncate">
                                      {addon.name}
                                    </span>
                                    {item.quantity > 1 && (
                                      <span className="text-gray-500 text-[10px] shrink-0">
                                        ×{item.quantity}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-white font-bold text-[11px] shrink-0 ml-2">
                                    £{price.toFixed(2)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Price Breakdown */}
                      {priceCalc && (
                        <div className="bg-white/5 border border-[#fe9a00]/25 rounded-xl p-3 shadow-inner shadow-black/20">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <h4 className="text-white font-black text-sm">
                              Price Summary
                            </h4>
                            <span className="text-[#fe9a00] text-[10px] font-bold uppercase tracking-wide bg-[#fe9a00]/10 border border-[#fe9a00]/20 rounded-full px-2 py-0.5">
                              Breakdown
                            </span>
                          </div>

                          {/* Admin Manual Price Toggle */}
                          {isAdminMode && (
                            <div className="mb-3 p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                              <label className="flex items-center gap-2 cursor-pointer group mb-2">
                                <input
                                  type="checkbox"
                                  checked={isManualPrice}
                                  onChange={(e) => {
                                    setIsManualPrice(e.target.checked);
                                    if (!e.target.checked) {
                                      setManualPricePerDay("");
                                      setManualPriceNote("");
                                    }
                                  }}
                                  className="w-3.5 h-3.5 rounded border-purple-500/50 bg-purple-500/20 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
                                />
                                <span className="text-purple-300 text-xs font-semibold">
                                  💰 Manual Pricing (Admin)
                                </span>
                              </label>

                              {isManualPrice && (
                                <div className="space-y-2 mt-2 pl-5.5">
                                  <div>
                                    <label className="text-purple-200 text-[10px] font-semibold mb-1 block">
                                      Price Per Day (£)
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={manualPricePerDay}
                                      onChange={(e) =>
                                        setManualPricePerDay(e.target.value)
                                      }
                                      placeholder={`Default: £${priceCalc.pricePerDay.toFixed(2)}`}
                                      className="w-full bg-purple-500/10 border border-purple-500/30 rounded-md px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 placeholder:text-purple-300/50"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-purple-200 text-[10px] font-semibold mb-1 block">
                                      Note (Optional)
                                    </label>
                                    <input
                                      type="text"
                                      value={manualPriceNote}
                                      onChange={(e) =>
                                        setManualPriceNote(e.target.value)
                                      }
                                      placeholder="e.g., Special discount for loyal customer"
                                      className="w-full bg-purple-500/10 border border-purple-500/30 rounded-md px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 placeholder:text-purple-300/50"
                                    />
                                  </div>
                                  {manualPricePerDay &&
                                    !isNaN(parseFloat(manualPricePerDay)) &&
                                    parseFloat(manualPricePerDay) > 0 && (
                                      <div className="bg-purple-500/20 border border-purple-500/40 rounded-md p-1.5 text-[10px]">
                                        <p className="text-purple-200">
                                          📊 {priceCalc.totalDays}d × £
                                          {parseFloat(
                                            manualPricePerDay,
                                          ).toFixed(2)}{" "}
                                          = £
                                          {(
                                            priceCalc.totalDays *
                                            parseFloat(manualPricePerDay)
                                          ).toFixed(2)}
                                        </p>
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="overflow-hidden rounded-lg border border-white/10 bg-black/20 divide-y divide-white/10 text-xs">
                            <div className="px-3 py-2 flex justify-between items-start gap-3">
                              <div>
                                <span className="text-gray-400">
                                  Rental charges
                                </span>
                                <div className="text-gray-500 text-[10px] mt-0.5">
                                  {priceCalc.totalDays} days x £
                                  {displayedDailyRate.toFixed(2)}
                                  {hasManualDailyPrice && " manual"}
                                  {priceCalc.extraHours > 0 &&
                                    ` + ${priceCalc.extraHours}h x £${displayedExtraHoursRate.toFixed(2)}`}
                                </div>
                              </div>
                              <span className="text-white font-semibold shrink-0">
                                £{displayedRentalCharge.toFixed(2)}
                              </span>
                            </div>

                            {displayedGearCharge > 0 && (
                              <div className="px-3 py-2 flex justify-between items-start gap-3">
                                <div>
                                  <span className="text-gray-400">
                                    Automatic gear
                                  </span>
                                  <div className="text-gray-500 text-[10px] mt-0.5">
                                    {priceCalc.totalDays} days x £
                                    {displayedGearExtraCostPerDay.toFixed(2)}
                                  </div>
                                </div>
                                <span className="text-white font-semibold shrink-0">
                                  £{displayedGearCharge.toFixed(2)}
                                </span>
                              </div>
                            )}

                            {displayedPickupExtensionPrice > 0 && (
                              <div className="px-3 py-2 flex justify-between items-center gap-3">
                                <span className="text-gray-400">
                                  Pickup Extension (either out of working time
                                  or weekend time)
                                </span>
                                <span className="text-white font-semibold shrink-0">
                                  £{displayedPickupExtensionPrice.toFixed(2)}
                                </span>
                              </div>
                            )}

                            {displayedReturnExtensionPrice > 0 && (
                              <div className="px-3 py-2 flex justify-between items-center gap-3">
                                <span className="text-gray-400">
                                  Return Extension (either out of working time
                                  or weekend time)
                                </span>
                                <span className="text-white font-semibold shrink-0">
                                  £{displayedReturnExtensionPrice.toFixed(2)}
                                </span>
                              </div>
                            )}

                            {selectedAddOns.length > 0 &&
                              addOnsTotalPrice > 0 && (
                                <div className="px-3 py-2 flex items-center justify-between gap-3">
                                  <span className="text-gray-400">
                                    Total Add-ons
                                  </span>
                                  <span className="text-white font-semibold shrink-0">
                                    £{addOnsTotalPrice.toFixed(2)}
                                  </span>
                                </div>
                              )}

                            {priceCalc.specialDaysPrice !== undefined &&
                              priceCalc.specialDaysPrice > 0 &&
                              priceCalc.specialDaysInfo &&
                              priceCalc.specialDaysInfo.length > 0 && (
                                <div className="px-3 py-2 bg-blue-500/10">
                                  <div className="flex items-center justify-between gap-3 mb-1">
                                    <p className="text-blue-300 font-semibold text-[11px] flex items-center gap-1">
                                      <FiCalendar className="text-[10px]" />
                                      Special Days
                                    </p>
                                    <span className="text-blue-100 font-bold text-[11px]">
                                      £{priceCalc.specialDaysPrice.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="space-y-0.5">
                                    {priceCalc.specialDaysInfo.map(
                                      (info, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center justify-between text-[10px]"
                                        >
                                          <div className="flex items-center gap-1 min-w-0">
                                            <div className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                                            <span className="text-blue-200 truncate">
                                              {info.date}
                                            </span>
                                            {info.reason && (
                                              <span className="text-blue-300/70 truncate">
                                                - {info.reason}
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-blue-100 font-bold shrink-0 ml-1">
                                            +£{info.price}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      )}

                      {/* Discount Code */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <FiTag className="text-[#fe9a00] text-sm" />
                          <h4 className="text-white font-bold text-xs">
                            Discount Code
                          </h4>
                        </div>
                        {!appliedDiscount ? (
                          <div className="space-y-1.5">
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                id="gtm-discount-input"
                                value={discountCode}
                                onChange={(e) => {
                                  setDiscountCode(e.target.value.toUpperCase());
                                  setDiscountError("");
                                }}
                                placeholder="Enter code"
                                className="flex-1 bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#fe9a00] uppercase placeholder:text-xs text-base font-mono tracking-wider"
                              />
                              <button
                                id="gtm-apply-discount"
                                onClick={handleApplyDiscount}
                                disabled={
                                  isApplyingDiscount || !discountCode.trim()
                                }
                                className="px-3.5 py-2 bg-[#fe9a00] hover:bg-orange-500 text-white font-bold rounded-lg transition-all disabled:opacity-40 text-xs"
                              >
                                {isApplyingDiscount ? "..." : "Apply"}
                              </button>
                            </div>
                            {discountError && (
                              <p className="text-red-400 text-[10px] flex items-center gap-1">
                                <FiAlertCircle className="text-xs" />
                                {discountError}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-green-500/10 border border-green-500/25 rounded-lg p-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <FiCheckCircle className="text-green-400 text-sm" />
                                <div>
                                  <p className="text-green-400 font-bold text-xs font-mono">
                                    {appliedDiscount.code}
                                  </p>
                                  <p className="text-green-400/70 text-[10px]">
                                    {appliedDiscount.percentage}% off
                                  </p>
                                </div>
                              </div>
                              <button
                                id="gtm-remove-discount"
                                onClick={handleRemoveDiscount}
                                className="text-red-400 hover:text-red-300 text-[10px] font-semibold px-1.5 py-0.5 rounded hover:bg-red-500/10 transition-all"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Terms */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <div className="relative shrink-0">
                            <input
                              type="checkbox"
                              id="gtm-accept-terms"
                              checked={formData.acceptTerms}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  acceptTerms: e.target.checked,
                                }))
                              }
                              className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#fe9a00] focus:ring-[#fe9a00] focus:ring-offset-0 cursor-pointer"
                            />
                          </div>
                          <span className="text-gray-400 text-[11px] leading-relaxed group-hover:text-gray-300 transition-colors">
                            I agree to the{" "}
                            <a
                              href="/terms-and-conditions"
                              target="_blank"
                              className="text-[#fe9a00] hover:underline font-semibold"
                            >
                              Terms & Conditions
                            </a>
                          </span>
                        </label>
                        {errors.acceptTerms && (
                          <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1 ml-6.5">
                            <FiAlertCircle />
                            {errors.acceptTerms}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {errors.submit && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
                      <p className="text-red-400 text-xs flex items-center justify-center gap-1">
                        <FiAlertCircle />
                        {errors.submit}
                      </p>
                    </div>
                  )}

                 
                </div>
              )}
            </div>
          </div>
            {/* ── Fixed Modal Footer ── */}
          {(step === 1 || step === 3 || step === 4) && (
            <div className="shrink-0 border-t border-white/10 bg-[#0f172b]/95 backdrop-blur-md px-3 sm:px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] sm:pb-4">
              {step === 1 && formData.category && (
                <button
                  id="gtm-category-continue"
                  onClick={() => {
                    const stored = sessionStorage.getItem("rentalDetails");

                    if (stored) {
                      const details = JSON.parse(stored);
                      details.category = formData.category;
                      sessionStorage.setItem(
                        "rentalDetails",
                        JSON.stringify(details),
                      );
                    }

                    setStep(hasCompletedCustomerAuth ? 3 : 2);

                    const modalBody =
                      document.querySelector(".modal-body-scroll");
                    if (modalBody) {
                      modalBody.scrollTop = 0;
                    }
                  }}
                  className="w-full min-h-12 sm:min-h-13 bg-[#fe9a00] hover:bg-orange-500 active:scale-[0.98] text-white font-black px-4 py-3 sm:py-3.5 rounded-xl transition-all duration-200 shadow-xl shadow-[#fe9a00]/25 text-sm sm:text-base"
                >
                  {hasCompletedCustomerAuth
                    ? "Continue to Add-ons"
                    : "Continue to Login"}
                </button>
              )}

              {step === 3 && (
                <div className="flex gap-2.5 sm:gap-3">
                  <button
                    id="gtm-step3-back"
                    onClick={() => {
                      setStep(hasCompletedCustomerAuth ? 1 : 2);

                      const modalBody =
                        document.querySelector(".modal-body-scroll");
                      if (modalBody) {
                        modalBody.scrollTop = 0;
                      }
                    }}
                    className="flex-1 min-h-12 sm:min-h-13 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-3 py-3 sm:py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                  >
                    <FiArrowLeft className="text-xs sm:text-sm" />
                    Back
                  </button>

                  <button
                    id="gtm-continue-review"
                    onClick={() => {
                      setStep(4);

                      const modalBody =
                        document.querySelector(".modal-body-scroll");
                      if (modalBody) {
                        modalBody.scrollTop = 0;
                      }
                    }}
                    className="flex-[2] min-h-12 sm:min-h-13 bg-[#fe9a00] hover:bg-orange-500 active:scale-[0.98] text-white font-black px-3 py-3 sm:py-3.5 rounded-xl transition-all shadow-lg shadow-[#fe9a00]/20 text-sm sm:text-base"
                  >
                    Continue to Review
                  </button>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-2.5">
                  {priceCalc && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-2 sm:p-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="text-gray-200 text-sm sm:text-base font-extrabold block leading-none">
                            Total Price :
                          </span>

                          {isAdminMode &&
                            isManualPrice &&
                            manualPricePerDay && (
                              <span className="text-purple-300 text-[9px] sm:text-[10px] font-semibold">
                                💰 Manual
                              </span>
                            )}
                        </div>

                        <span className="text-[#37cf6f] text-xl sm:text-2xl font-black shrink-0">
                          £{finalPrice || priceCalc.totalPrice}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    id="gtm-confirm-reservation"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !formData.acceptTerms}
                    className="w-full min-h-12 sm:min-h-13 bg-[#fe9a00] hover:bg-orange-500 active:scale-[0.98] text-white font-black px-4 py-3 sm:py-3.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-[#fe9a00]/25 text-sm sm:text-base flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <FiCheckCircle className="text-base" />
                        Confirm Reservation
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddOnsModal && priceCalc && addOns.length > 0 && (
        <AddOnsModal
          addOns={addOns}
          selectedAddOns={selectedAddOns}
          onSave={setSelectedAddOns}
          onClose={() => setShowAddOnsModal(false)}
          rentalDays={Math.ceil(priceCalc.totalHours / 24)}
          selectedCategoryId={formData.category}
        />
      )}

      {showRulesModal && formData.category && (
        <CategoryRulesModal
          categoryId={formData.category}
          showLoadingImmediately
          onClose={() => setShowRulesModal(false)}
        />
      )}
    </>
  );
}
