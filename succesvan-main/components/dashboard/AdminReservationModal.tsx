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

import AddOnsModal from "../global/AddOnsModal";
import VanCard from "../global/VanCard";
import { usePriceCalculation } from "@/hooks/usePriceCalculation";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/lib/toast";
import Image from "next/image";
import { BsFuelPump } from "react-icons/bs";
import { WorkingTime } from "@/types/type";
import { MdDoorSliding } from "react-icons/md";
import SearchableSelect from "../ui/SearchableSelect";
import CategoryRulesModal from "../global/CategoryRulesModal";
import {
  calculateOfficeExtensionPrices,
  getWorkingDayWindow,
} from "@/lib/specialDaySchedule";
import { formatDateInputInLondon, formatTimeInLondon } from "@/lib/englandTime";

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

interface AdminReservationModalProps {
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

export default function AdminReservationModal({
  onClose,
  isAdminMode = false,
}: AdminReservationModalProps) {
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
  const [adminPhoneMatchedUser, setAdminPhoneMatchedUser] = useState<
    any | null
  >(null);
  const [adminCustomerLookupStatus, setAdminCustomerLookupStatus] = useState<
    "idle" | "found" | "new"
  >("idle");
  const [adminCustomerLookupMessage, setAdminCustomerLookupMessage] =
    useState("");

  const [formData, setFormData] = useState({
    office: "",
    type: { name: "", _id: "" },
    startDate: "",
    startTime: "10:00",
    endDate: "",
    endTime: "10:00",
    driverAge: 25,
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
  const [storedIsManualExtension, setStoredIsManualExtension] =
    useState(false);
  const [uploadingLicense, setUploadingLicense] = useState({
    front: false,
    back: false,
  });
  const [isManualPrice, setIsManualPrice] = useState(false);
  const [manualPricePerDay, setManualPricePerDay] = useState<string>("");
  const [manualPriceNote, setManualPriceNote] = useState<string>("");
  // Per-invoice: book now with no price; total is entered on completion.
  const [perInvoice, setPerInvoice] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [customerMessage, setCustomerMessage] = useState<string>("");

  const selectedCategory = categories.find((c) => c._id === formData.category);

  const extensionPrices = useMemo(() => {
    // Admin set the extension manually in the previous step (create form);
    // use those values verbatim instead of recomputing from office hours.
    if (storedIsManualExtension) {
      return {
        pickupExtension: storedPickupExtensionPrice,
        returnExtension: storedReturnExtensionPrice,
      };
    }

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
    storedIsManualExtension,
    storedPickupExtensionPrice,
    storedReturnExtensionPrice,
  ]);
  const canCalculateExtensionPrices = Boolean(
    storedIsManualExtension ||
      (selectedOfficeData &&
        formData.startDate &&
        formData.startTime &&
        formData.endDate &&
        formData.endTime),
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

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

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
      setStoredIsManualExtension(details.isManualExtension === true);

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
        setStep(3);
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
    const storedUser = isAdminMode ? null : localStorage.getItem("user");
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
    isAdminMode,
    formData.name,
    formData.lastName,
    formData.email,
    formData.phone,
    address,
  ]);

  const normalizePhoneDigits = (phone?: string) =>
    (phone || "").replace(/\D/g, "");

  const formatUkLocalPhoneInput = (value: string) => {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("44")) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = digits.slice(1);
    return digits.slice(0, 10);
  };

  const getUsersFromResponse = (data: any) => {
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.data)) return data.data.data;
    if (Array.isArray(data?.data?.users)) return data.data.users;
    return [];
  };

  const clearAdminCustomerSelection = () => {
    setSelectedUserId("");
    setCustomerUserId("");
    setAdminPhoneMatchedUser(null);
    setAdminCustomerLookupStatus("idle");
    setAdminCustomerLookupMessage("");
  };

  const handleSelectUser = (userId: string, user: any) => {
    setSelectedUserId(userId);
    setCustomerUserId(user._id);
    setAuthStep("phone");
    setAdminPhoneMatchedUser(null);
    setAdminCustomerLookupStatus("found");
    setAdminCustomerLookupMessage("Existing customer selected.");
    setErrors({});
    setFormData((prev) => ({
      ...prev,
      name: user.name || "",
      lastName: user.lastName || "",
      email: user.emaildata?.emailAddress || user.emailData?.emailAddress || "",
      phone: formatUkLocalPhoneInput(
        user.phoneData?.phoneNumber || user.phoneNumber || "",
      ),
    }));
    setAddress(user.address || "");
    setPostalCode(user.postalCode || "");
    setCity(user.city || "");
  };

  const handleAdminPhoneLookup = async () => {
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      setErrors({ phone: "Enter a valid UK mobile number" });
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setSelectedUserId("");
    setCustomerUserId("");
    setAdminPhoneMatchedUser(null);
    setAdminCustomerLookupMessage("");

    try {
      const phoneNumber = `+44${formData.phone}`;
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        phone: phoneNumber,
        limit: "1",
      });
      const res = await fetch(`/api/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || "Customer lookup failed");

      const users = getUsersFromResponse(data);
      const expectedPhone = normalizePhoneDigits(phoneNumber);
      const matchedUser =
        users.find(
          (foundUser: any) =>
            normalizePhoneDigits(
              foundUser.phoneData?.phoneNumber || foundUser.phoneNumber,
            ) === expectedPhone,
        ) || null;

      if (matchedUser) {
        setAuthStep("phone");
        setAdminPhoneMatchedUser(matchedUser);
        setAdminCustomerLookupStatus("found");
        setAdminCustomerLookupMessage(
          "Customer found. Select this customer to attach the reservation.",
        );
        return;
      }

      setSelectedUserId("");
      setCustomerUserId("");
      setAuthStep("register");
      setAdminCustomerLookupStatus("new");
      setAdminCustomerLookupMessage(
        "No customer found for this number. Create the customer below.",
      );
      setFormData((prev) => ({
        ...prev,
        name: "",
        lastName: "",
        email: "",
      }));
      setAddress("");
      setPostalCode("");
      setCity("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setErrors({ phone: message });
    } finally {
      setIsSubmitting(false);
    }
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
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Enter a valid UK mobile number";
    }
    if (!formData.name.trim()) newErrors.name = "Name required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name required";
    if (!isAdminMode && !formData.email.trim()) {
      newErrors.email = "Email required";
    }
    if (!isAdminMode) {
      if (!address.trim()) newErrors.address = "Address required";
      if (!postalCode.trim()) newErrors.postalCode = "Postal code required";
      if (!city.trim()) newErrors.city = "City required";
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
          ...(isAdminMode &&
            (licenseFront || licenseBack) && {
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
      setSelectedUserId(data.data.user._id);
      if (isAdminMode) {
        setAuthStep("phone");
        setAdminCustomerLookupStatus("found");
        setAdminCustomerLookupMessage("New customer created and selected.");
      }
      setIsNewUser(true);
      setStep(isAdminMode ? 4 : 3);
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
      const usePerInvoice = isAdminMode && perInvoice;
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
          setErrors({ submit: "Select or create a customer first" });
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
          totalPrice: usePerInvoice ? 0 : finalPrice || priceCalc?.totalPrice || 0,
          perInvoice: usePerInvoice,
          driverAge: formData.driverAge,
          messege: customerMessage.trim() || "",
          // Staff have already reviewed bookings created in the admin panel.
          status: isAdminMode ? "confirmed" : "pending",
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
            !usePerInvoice &&
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
        setTimeout(() => {
          window.location.href = "/customerDashboard#profile";
        }, 2000);
      } else {
        setTimeout(() => onClose(), 2000);
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
  const progressSteps = isAdminMode
    ? [
        { step: 1, label: "Vehicle" },
        { step: 3, label: "Add-ons" },
        { step: 4, label: "Review" },
      ]
    : [
        { step: 1, label: "Vehicle" },
        { step: 2, label: "Verify" },
        { step: 3, label: "Add-ons" },
        { step: 4, label: "Review" },
      ];
  const currentProgressIndex = Math.max(
    0,
    progressSteps.findIndex((item) => item.step === step),
  );
  const currentProgressStep = progressSteps[currentProgressIndex];

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
                ? "Please upload your licences in the dashboard."
                : "We'll send you a confirmation email shortly."}
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-9999"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-10000 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <div className="relative bg-linear-to-br from-[#0f172b] to-[#1a2744] rounded-2xl sm:rounded-3xl max-w-5xl w-full max-h-[98vh] overflow-hidden border border-white/10 shadow-2xl flex flex-col">
          {/* ── Header ── */}
          <div className="shrink-0 bg-linear-to-r from-[#0f172b] to-[#162038] border-b border-white/10 px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-3">
                {currentProgressIndex > 0 && (
                  <button
                    onClick={() => {
                      const previousStep =
                        progressSteps[currentProgressIndex - 1]?.step || 1;
                      setStep(previousStep as 1 | 2 | 3 | 4);
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
                    {currentProgressStep.label} — Step{" "}
                    {currentProgressIndex + 1} of {progressSteps.length}
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
              {progressSteps.map((item, i) => (
                <div
                  key={item.step}
                  className="flex-1 flex items-center gap-1.5"
                >
                  <div
                    className={`h-1.5 sm:h-2 rounded-full flex-1 transition-all duration-500 ${
                      i < currentProgressIndex
                        ? "bg-green-500"
                        : i === currentProgressIndex
                          ? "bg-[#fe9a00]"
                          : "bg-white/10"
                    }`}
                  />
                  {i < progressSteps.length - 1 && (
                    <div
                      className={`w-1 h-1 rounded-full hidden sm:block ${
                        i < currentProgressIndex
                          ? "bg-green-500"
                          : "bg-white/10"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="hidden sm:flex justify-between mt-1.5">
              {progressSteps.map((item, i) => (
                <span
                  key={item.step}
                  className={`text-[10px] font-semibold tracking-wider uppercase ${
                    i <= currentProgressIndex
                      ? "text-[#fe9a00]"
                      : "text-gray-600"
                  }`}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto overscroll-contain modal-body-scroll">
            <div className="p-3 sm:p-6">
              {/* ═══════ Step 1: Category Selection ═══════ */}
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
                                  // Scroll to top of modal body
                                  const modalBody =
                                    document.querySelector(
                                      ".modal-body-scroll",
                                    );
                                  if (modalBody) {
                                    modalBody.scrollTop = 0;
                                  }
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
                                  // Scroll to top of modal body
                                  const modalBody =
                                    document.querySelector(
                                      ".modal-body-scroll",
                                    );
                                  if (modalBody) {
                                    modalBody.scrollTop = 0;
                                  }
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

                  {/* Sticky CTA */}
                  {formData.category && (
                    <div className="sticky bottom-0 left-0 right-0 p-4 bg-linear-to-t from-[#0f172b] via-[#0f172b]/95 to-transparent z-20 -mx-3 sm:-mx-6 px-3 sm:px-6">
                      <button
                        id="gtm-category-continue"
                        onClick={() => {
                          const stored =
                            sessionStorage.getItem("rentalDetails");
                          if (stored) {
                            const details = JSON.parse(stored);
                            details.category = formData.category;
                            sessionStorage.setItem(
                              "rentalDetails",
                              JSON.stringify(details),
                            );
                          }
                          setStep(isAdminMode || user ? 3 : 2);
                          // Scroll to top when changing step
                          const modalBody =
                            document.querySelector(".modal-body-scroll");
                          if (modalBody) {
                            modalBody.scrollTop = 0;
                          }
                        }}
                        className="w-full bg-[#fe9a00] hover:bg-orange-500 active:scale-[0.98] text-white font-bold py-4 rounded-xl transition-all duration-200 shadow-xl shadow-[#fe9a00]/25 text-base"
                      >
                        {isAdminMode
                          ? "Continue to Add-ons"
                          : user
                            ? "Continue to Add-ons"
                            : "Continue to Login"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ═══════ Step 2: Authentication ═══════ */}
              {step === 2 && !isAdminMode && (
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
                        ? "Find an existing customer or create one from a phone number"
                        : "Verify your identity to continue"}
                    </p>
                  </div>

                  {isAdminMode ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Search Existing Customer
                        </label>
                        <SearchableSelect
                          value={selectedUserId}
                          onChange={handleSelectUser}
                          placeholder="Search by phone or name..."
                        />
                      </div>

                      <div className="relative py-1">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-[#0f172b] px-3 text-xs font-semibold text-gray-500">
                            or check by phone
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-gray-300 text-sm font-semibold mb-2 flex items-center gap-2">
                          <FiPhone className="text-[#fe9a00]" />
                          Customer Phone Number
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">
                              +44
                            </div>
                            <input
                              type="tel"
                              id="gtm-admin-phone-input"
                              value={formData.phone}
                              onChange={(e) => {
                                const digits = formatUkLocalPhoneInput(
                                  e.target.value,
                                );
                                setFormData((prev) => ({
                                  ...prev,
                                  phone: digits,
                                }));
                                clearAdminCustomerSelection();
                                setAuthStep("phone");
                                setErrors((prev) => ({
                                  ...prev,
                                  phone: "",
                                  submit: "",
                                }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAdminPhoneLookup();
                                }
                              }}
                              className="w-full bg-white/5 border border-white/15 rounded-xl pl-14 pr-4 py-3.5 text-white text-base focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all placeholder:text-gray-600"
                              placeholder="7400123456"
                              maxLength={10}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleAdminPhoneLookup}
                            disabled={
                              isSubmitting || formData.phone.length < 10
                            }
                            className="px-4 bg-[#fe9a00] text-white font-bold rounded-xl hover:bg-orange-500 transition-all disabled:opacity-50 shadow-lg shadow-[#fe9a00]/20 text-sm"
                          >
                            {isSubmitting ? "Checking..." : "Check"}
                          </button>
                        </div>
                        {errors.phone && (
                          <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                            <FiAlertCircle className="text-sm" />
                            {errors.phone}
                          </p>
                        )}
                      </div>

                      {adminCustomerLookupMessage && (
                        <div
                          className={`rounded-xl border p-3 text-sm ${
                            adminCustomerLookupStatus === "new"
                              ? "bg-yellow-500/10 border-yellow-500/25 text-yellow-200"
                              : "bg-green-500/10 border-green-500/25 text-green-200"
                          }`}
                        >
                          {adminCustomerLookupMessage}
                        </div>
                      )}

                      {customerUserId &&
                        adminCustomerLookupStatus === "found" && (
                          <div className="bg-white/5 border border-[#fe9a00]/25 rounded-xl p-4">
                            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">
                              Selected customer
                            </p>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-white font-bold">
                                  {formData.name} {formData.lastName}
                                </p>
                                <p className="text-gray-400 text-sm">
                                  {formData.email || "No email saved"}
                                </p>
                                <p className="text-gray-400 text-sm">
                                  +44{formData.phone}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  clearAdminCustomerSelection();
                                  setFormData((prev) => ({
                                    ...prev,
                                    name: "",
                                    lastName: "",
                                    email: "",
                                  }));
                                }}
                                className="text-gray-400 hover:text-white text-sm"
                              >
                                Change
                              </button>
                            </div>
                          </div>
                        )}

                      {customerUserId && (
                        <button
                          onClick={() => setStep(3)}
                          className="w-full py-3.5 bg-[#fe9a00] hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-[#fe9a00]/20"
                        >
                          Continue to Add-ons
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
                          {isAdminMode
                            ? "Create a customer with this phone number"
                            : "Complete your profile to continue"}
                        </p>
                      </div>

                      {isAdminMode && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">
                            Phone number
                          </p>
                          <p className="text-white font-bold">
                            +44{formData.phone}
                          </p>
                          {errors.phone && (
                            <p className="text-red-400 text-xs mt-1">
                              {errors.phone}
                            </p>
                          )}
                        </div>
                      )}

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
                          {isAdminMode && (
                            <span className="text-gray-500 text-xs">
                              (Optional)
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          id="gtm-address"
                          value={address}
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
                            {isAdminMode && (
                              <span className="text-gray-500 text-xs ml-1">
                                (Optional)
                              </span>
                            )}
                          </label>
                          <input
                            type="text"
                            id="gtm-postal-code"
                            value={postalCode}
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
                            {isAdminMode && (
                              <span className="text-gray-500 text-xs ml-1">
                                (Optional)
                              </span>
                            )}
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
                            <span className="text-gray-500 text-xs">
                              (Optional)
                            </span>
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-gray-400 text-xs font-medium mb-1.5 block">
                                Front Side
                                <span className="text-gray-500 ml-1">
                                  (Optional)
                                </span>
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
                                <span className="text-gray-500 ml-1">
                                  (Optional)
                                </span>
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
                    <div className="flex items-center gap-2 mb-3">
                      <FiPackage className="text-[#fe9a00] text-base" />
                      <h4 className="text-white font-bold text-sm sm:text-base">
                        Available Add-ons
                      </h4>
                      {selectedAddOns.length > 0 && (
                        <span className="ml-auto text-[10px] font-bold text-[#fe9a00] bg-[#fe9a00]/10 px-2 py-0.5 rounded-full">
                          {selectedAddOns.length} selected
                        </span>
                      )}
                    </div>

                    {!Array.isArray(addOns) || addOns.length === 0 ? (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                        <FiAlertCircle className="text-gray-500 text-2xl mx-auto mb-2" />
                        <p className="text-gray-400 text-xs font-medium">
                          No add-ons available
                        </p>
                      </div>
                    ) : !priceCalc ? (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                        <div className="w-8 h-8 border-2 border-[#fe9a00]/30 border-t-[#fe9a00] rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-gray-400 text-xs">
                          Loading pricing...
                        </p>
                      </div>
                    ) : (
                      <div className="  space-y-0">
                        {/* Unified Grid - 2 cols mobile, 3 cols desktop */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                                  className={`relative rounded-xl p-1 transition-all border cursor-pointer flex flex-col gap-2 ${
                                    isActive
                                      ? "bg-[#fe9a00]/10 border-[#fe9a00]/50 shadow-sm shadow-[#fe9a00]/10"
                                      : isTypeDisabled
                                        ? "bg-white/2 border-white/5 opacity-35 cursor-not-allowed"
                                        : "bg-white/5 border-white/10 hover:border-[#fe9a00]/30 hover:bg-white/8"
                                  }`}
                                >
                                  {/* Selected checkmark badge */}
                                  {isActive && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedAddOns((prev) =>
                                            prev.filter(
                                              (s) => s.addOn !== addon._id,
                                            ),
                                          );
                                        }}
                                        className="w-5 h-5 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 flex items-center justify-center transition-colors"
                                      >
                                        <FiX className="text-[9px]" />
                                      </button>
                                    </div>
                                  )}

                                  {/* Icon - Square full-width on top */}
                                  <div
                                    className={`w-full rounded-lg overflow-hidden flex items-center justify-center ${
                                      (addon as any).icon
                                        ? "h-40 sm:h-full"
                                        : "h-12 sm:h-14    "
                                    }`}
                                  >
                                    {(addon as any).icon ? (
                                      <img
                                        src={(addon as any).icon}
                                        alt={addon.name}
                                        className="w-full h-full object-cover rounded-lg"
                                      />
                                    ) : (
                                      <FiPackage className="text-white/20 text-2xl sm:text-3xl" />
                                    )}
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-1">
                                      <h5
                                        className={`font-bold text-[10px] sm:text-[11px] leading-tight truncate ${
                                          isActive
                                            ? "text-white"
                                            : "text-gray-200"
                                        }`}
                                      >
                                        {addon.name}
                                      </h5>
                                      {isActive && (
                                        <FiCheckCircle className="text-[#fe9a00] text-[10px] shrink-0 mt-0.5" />
                                      )}
                                    </div>

                                    {/* {addon.description && (
                                      <p className="text-gray-500 text-[9px] mt-0.5 line-clamp-1">
                                        {addon.description}
                                      </p>
                                    )} */}

                                    {isTypeDisabled && (
                                      <p className="text-red-400/80 text-[9px] mt-0.5 font-medium leading-tight">
                                        Type already selected
                                      </p>
                                    )}

                                    {/* Price */}
                                    <div className="mt-1.5">
                                      {addon.pricingType === "flat" ? (
                                        <div>
                                          <span className="text-[#fe9a00] text-xs sm:text-sm font-black">
                                            £{addon.flatPrice?.amount || 0}
                                          </span>
                                          {addon.flatPrice?.isPerDay && (
                                            <span className="text-gray-500 text-[8px] font-normal ml-1">
                                              ×{rentalDays}d = £
                                              {(
                                                (addon.flatPrice?.amount || 0) *
                                                rentalDays
                                              ).toFixed(0)}
                                            </span>
                                          )}
                                        </div>
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
                                                <div key={originalIdx}>
                                                  <span className="text-[#fe9a00] text-xs sm:text-sm font-black">
                                                    £{tier.price}
                                                  </span>
                                                  {addon.tieredPrice
                                                    ?.isPerDay && (
                                                    <span className="text-gray-500 text-[8px] font-normal ml-1">
                                                      ×{rentalDays}d = £
                                                      {totalPrice.toFixed(0)}
                                                    </span>
                                                  )}
                                                </div>
                                              );
                                            })}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Add / Active indicator at bottom */}
                                  <div
                                    className={`w-full py-1 rounded-lg text-center text-[9px] sm:text-[10px] font-bold transition-all ${
                                      isActive
                                        ? "bg-[#fe9a00]/20 text-[#fe9a00]"
                                        : isTypeDisabled
                                          ? "bg-white/5 text-gray-600"
                                          : "bg-white/5 text-gray-400 group-hover:bg-[#fe9a00]/10 group-hover:text-[#fe9a00]"
                                    }`}
                                  >
                                    {isActive
                                      ? "✓ Added"
                                      : isTypeDisabled
                                        ? "Unavailable"
                                        : "+ Add"}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="flex gap-3 pt-2">
                    <button
                      id="gtm-step3-back"
                      onClick={() => {
                        setStep(isAdminMode || user ? 1 : 2);
                        // Scroll to top
                        const modalBody =
                          document.querySelector(".modal-body-scroll");
                        if (modalBody) {
                          modalBody.scrollTop = 0;
                        }
                      }}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <FiArrowLeft className="text-sm" />
                      Back
                    </button>
                    <button
                      id="gtm-continue-review"
                      onClick={() => {
                        setStep(4);
                        // Scroll to top
                        const modalBody =
                          document.querySelector(".modal-body-scroll");
                        if (modalBody) {
                          modalBody.scrollTop = 0;
                        }
                      }}
                      className="flex-2 bg-[#fe9a00] hover:bg-orange-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#fe9a00]/20"
                    >
                      Continue to Review
                    </button>
                  </div>
                </div>
              )}

              {/* ═══════ Step 4: Final Review & Confirm ═══════ */}
              {step === 4 && (
                <div className="space-y-3 pb-0">
                  {/* Admin Customer Selection */}
                  {isAdminMode && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <FiUser className="text-[#fe9a00] text-sm" />
                        <h4 className="text-white font-bold text-xs sm:text-sm">
                          Select or Create Customer
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] sm:text-xs font-semibold text-gray-300 mb-1.5">
                            Existing Customer
                          </label>
                          <SearchableSelect
                            value={selectedUserId}
                            onChange={handleSelectUser}
                            placeholder="Search by phone or name..."
                          />
                        </div>

                        <div>
                          <label className="text-[10px] sm:text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
                            <FiPhone className="text-[#fe9a00] text-[10px]" />
                            Phone Lookup
                          </label>
                          <div className="flex gap-1.5">
                            <div className="relative flex-1">
                              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-[10px]">
                                +44
                              </div>
                              <input
                                type="tel"
                                id="gtm-admin-final-phone-input"
                                value={formData.phone}
                                onChange={(e) => {
                                  const digits = formatUkLocalPhoneInput(
                                    e.target.value,
                                  );
                                  setFormData((prev) => ({
                                    ...prev,
                                    phone: digits,
                                  }));
                                  clearAdminCustomerSelection();
                                  setAuthStep("phone");
                                  setErrors((prev) => ({
                                    ...prev,
                                    phone: "",
                                    submit: "",
                                  }));
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAdminPhoneLookup();
                                  }
                                }}
                                className="w-full bg-white/5 border border-white/15 rounded-lg pl-10 pr-2 py-2 text-white text-xs focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all placeholder:text-gray-600"
                                placeholder="7400123456"
                                maxLength={10}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleAdminPhoneLookup}
                              disabled={
                                isSubmitting || formData.phone.length < 10
                              }
                              className="px-3 bg-[#fe9a00] text-white font-bold rounded-lg hover:bg-orange-500 transition-all disabled:opacity-50 text-[10px] sm:text-xs shrink-0"
                            >
                              {isSubmitting ? "..." : "Check"}
                            </button>
                          </div>
                          {errors.phone && (
                            <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1">
                              <FiAlertCircle className="text-[10px]" />
                              {errors.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      {adminCustomerLookupMessage && (
                        <div
                          className={`rounded-lg border p-2 text-[10px] sm:text-xs ${
                            adminCustomerLookupStatus === "new"
                              ? "bg-yellow-500/10 border-yellow-500/25 text-yellow-200"
                              : "bg-green-500/10 border-green-500/25 text-green-200"
                          }`}
                        >
                          {adminCustomerLookupMessage}
                        </div>
                      )}

                      {adminPhoneMatchedUser && !customerUserId && (
                        <div className="bg-white/5 border border-green-500/25 rounded-lg p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-gray-400 text-[9px] font-semibold uppercase tracking-wide">
                                Found customer
                              </p>
                              <p className="text-white font-bold text-xs mt-0.5 truncate">
                                {adminPhoneMatchedUser.name}{" "}
                                {adminPhoneMatchedUser.lastName || ""}
                              </p>
                              <p className="text-gray-400 text-[10px] truncate">
                                {adminPhoneMatchedUser.emaildata
                                  ?.emailAddress ||
                                  adminPhoneMatchedUser.emailData
                                    ?.emailAddress ||
                                  "No email"}{" "}
                                ·{" "}
                                {adminPhoneMatchedUser.phoneData?.phoneNumber ||
                                  adminPhoneMatchedUser.phoneNumber ||
                                  `+44${formData.phone}`}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleSelectUser(
                                  adminPhoneMatchedUser._id,
                                  adminPhoneMatchedUser,
                                )
                              }
                              className="shrink-0 px-2.5 py-1.5 bg-[#fe9a00] hover:bg-orange-500 text-white font-bold rounded-lg transition-colors text-[10px] sm:text-xs"
                            >
                              Select
                            </button>
                          </div>
                        </div>
                      )}

                      {customerUserId &&
                        adminCustomerLookupStatus === "found" && (
                          <div className="bg-[#fe9a00]/10 border border-[#fe9a00]/25 rounded-lg p-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-gray-400 text-[9px] font-semibold uppercase tracking-wide">
                                  Selected customer
                                </p>
                                <p className="text-white font-bold text-xs mt-0.5">
                                  {formData.name} {formData.lastName}
                                </p>
                                <p className="text-gray-400 text-[10px]">
                                  {formData.email || "No email"} · +44
                                  {formData.phone}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  clearAdminCustomerSelection();
                                  setAuthStep("phone");
                                  setFormData((prev) => ({
                                    ...prev,
                                    name: "",
                                    lastName: "",
                                    email: "",
                                  }));
                                }}
                                className="text-gray-400 hover:text-white text-[10px] shrink-0"
                              >
                                Change
                              </button>
                            </div>
                          </div>
                        )}

                      {authStep === "register" && (
                        <div className="space-y-2.5 border-t border-white/10 pt-3">
                          <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                            <p className="text-gray-500 text-[9px] font-semibold uppercase tracking-wide">
                              New customer
                            </p>
                            <p className="text-white font-bold text-xs">
                              +44{formData.phone}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-gray-300 text-[10px] font-semibold mb-1 block">
                                First Name
                              </label>
                              <input
                                type="text"
                                value={formData.name}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                  }))
                                }
                                className="w-full bg-white/5 border border-white/15 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all placeholder:text-gray-600"
                                placeholder="John"
                              />
                              {errors.name && (
                                <p className="text-red-400 text-[9px] mt-0.5">
                                  {errors.name}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="text-gray-300 text-[10px] font-semibold mb-1 block">
                                Last Name
                              </label>
                              <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    lastName: e.target.value,
                                  }))
                                }
                                className="w-full bg-white/5 border border-white/15 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all placeholder:text-gray-600"
                                placeholder="Doe"
                              />
                              {errors.lastName && (
                                <p className="text-red-400 text-[9px] mt-0.5">
                                  {errors.lastName}
                                </p>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="text-gray-300 text-[10px] font-semibold mb-1 block">
                              Email{" "}
                              <span className="text-gray-500">(Optional)</span>
                            </label>
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  email: e.target.value,
                                }))
                              }
                              className="w-full bg-white/5 border border-white/15 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all placeholder:text-gray-600"
                              placeholder="john@example.com"
                            />
                            {errors.email && (
                              <p className="text-red-400 text-[9px] mt-0.5">
                                {errors.email}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-gray-300 text-[10px] font-semibold mb-1 block">
                                Address{" "}
                                <span className="text-gray-600 hidden sm:inline">
                                  (Opt)
                                </span>
                              </label>
                              <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full bg-white/5 border border-white/15 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all placeholder:text-gray-600"
                                placeholder="Street"
                              />
                            </div>
                            <div>
                              <label className="text-gray-300 text-[10px] font-semibold mb-1 block">
                                Postcode
                              </label>
                              <input
                                type="text"
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value)}
                                className="w-full bg-white/5 border border-white/15 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all placeholder:text-gray-600"
                                placeholder="SW1A"
                              />
                            </div>
                            <div>
                              <label className="text-gray-300 text-[10px] font-semibold mb-1 block">
                                City
                              </label>
                              <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full bg-white/5 border border-white/15 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all placeholder:text-gray-600"
                                placeholder="London"
                              />
                            </div>
                          </div>

                          <div>
                            <p className="text-gray-300 text-[10px] font-semibold mb-1.5">
                              Licence{" "}
                              <span className="text-gray-500">(Optional)</span>
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <label className="flex items-center justify-center h-16 border-2 border-dashed border-white/15 rounded-lg cursor-pointer hover:border-[#fe9a00]/50 hover:bg-[#fe9a00]/5 transition-all">
                                <span className="text-gray-400 text-[10px] font-medium">
                                  {uploadingLicense.front
                                    ? "Uploading..."
                                    : licenseFront
                                      ? "✓ Front"
                                      : "+ Front"}
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
                              <label className="flex items-center justify-center h-16 border-2 border-dashed border-white/15 rounded-lg cursor-pointer hover:border-[#fe9a00]/50 hover:bg-[#fe9a00]/5 transition-all">
                                <span className="text-gray-400 text-[10px] font-medium">
                                  {uploadingLicense.back
                                    ? "Uploading..."
                                    : licenseBack
                                      ? "✓ Back"
                                      : "+ Back"}
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
                          </div>

                          <button
                            type="button"
                            onClick={handleRegister}
                            disabled={isSubmitting}
                            className="w-full bg-[#fe9a00] text-white font-bold py-2 rounded-lg hover:bg-orange-500 transition-all disabled:opacity-50 text-xs"
                          >
                            {isSubmitting ? "Creating..." : "Create Customer"}
                          </button>
                          {errors.submit && (
                            <p className="text-red-400 text-[10px] text-center bg-red-500/10 border border-red-500/20 rounded-lg p-1.5">
                              {errors.submit}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Main Content Grid */}
                  <div className="grid grid-cols-1 gap-3">
                    {/* Left Column */}
                    <div className="space-y-2.5">
                      {/* Vehicle - Compact horizontal card */}
                      {selectedCategory && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                          <div className="flex gap-2.5">
                            <div className="relative w-20 h-16 sm:w-24 sm:h-20 rounded-lg overflow-hidden shrink-0">
                              <Image
                                src={selectedCategory.image}
                                alt={selectedCategory.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-black text-xs sm:text-sm leading-tight truncate">
                                {selectedCategory.name}
                              </h4>
                              <p className="text-gray-500 text-[9px] mt-0.5 truncate">
                                {selectedCategory.expert} or similar
                              </p>
                              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                <span className="text-white text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                                  <FiUsers className="inline text-[#fe9a00] mr-0.5" />
                                  {selectedCategory.seats}
                                </span>
                                <span className="text-white text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                                  <BsFuelPump className="inline text-[#fe9a00] mr-0.5" />
                                  {selectedCategory.fuel}
                                </span>
                                <span className="text-white text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                                  <MdDoorSliding className="inline text-[#fe9a00] mr-0.5" />
                                  {selectedCategory.doors}
                                </span>
                                {formData.gearType &&
                                  selectedCategory?.gear?.availableTypes &&
                                  selectedCategory.gear.availableTypes.length >
                                    1 && (
                                    <span className="text-[#fe9a00] text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded bg-[#fe9a00]/10 border border-[#fe9a00]/30 font-bold capitalize">
                                      {formData.gearType === "automatic"
                                        ? "🅰️"
                                        : "⚙️"}{" "}
                                      {formData.gearType}
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>
                          {/* Location inline */}
                          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/5">
                            <FiMapPin className="text-[#fe9a00] text-[10px] shrink-0" />
                            <span className="text-gray-500 text-[9px]">
                              Pickup:
                            </span>
                            <span className="text-white font-semibold text-[10px] sm:text-[11px] truncate">
                              {
                                offices.find((o) => o._id === formData.office)
                                  ?.name
                              }
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Dates + Duration - Compact */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <FiCalendar className="text-[#fe9a00] text-xs" />
                            <h4 className="text-white font-bold text-[10px] sm:text-xs">
                              Rental Period
                            </h4>
                          </div>
                          {priceCalc && (
                            <span className="text-[9px] font-bold text-gray-400 bg-white/5 px-1.5 py-0.5 rounded-full border border-white/5">
                              {priceCalc.totalDays}d
                              {priceCalc.totalHours % 24 > 0 &&
                                ` ${priceCalc.totalHours % 24}h`}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="bg-white/5 rounded-md p-1.5 border border-white/5">
                            <p className="text-gray-500 text-[8px] uppercase tracking-wider font-semibold leading-none">
                              Pickup
                            </p>
                            <p className="text-white font-bold text-[10px] sm:text-[11px] leading-tight mt-0.5">
                              {formatDate(formData.startDate)}
                            </p>
                            <p className="text-[#fe9a00] font-semibold text-[10px]">
                              {formData.startTime}
                            </p>
                          </div>
                          <div className="bg-white/5 rounded-md p-1.5 border border-white/5">
                            <p className="text-gray-500 text-[8px] uppercase tracking-wider font-semibold leading-none">
                              Return
                            </p>
                            <p className="text-white font-bold text-[10px] sm:text-[11px] leading-tight mt-0.5">
                              {formatDate(formData.endDate)}
                            </p>
                            <p className="text-[#fe9a00] font-semibold text-[10px]">
                              {formData.endTime}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Customer - Inline compact */}
                      {!isAdminMode && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                          <div className="flex items-center gap-1.5 mb-2">
                            <FiUser className="text-[#fe9a00] text-xs" />
                            <h4 className="text-white font-bold text-[10px] sm:text-xs">
                              Customer
                            </h4>
                          </div>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500 text-[10px]">
                                Name
                              </span>
                              <span className="text-white font-semibold text-[10px]">
                                {formData.name} {formData.lastName}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500 text-[10px]">
                                Age
                              </span>
                              <span className="text-white font-semibold text-[10px]">
                                {formData.driverAge}y
                              </span>
                            </div>
                            <div className="flex justify-between items-center col-span-2 sm:col-span-1">
                              <span className="text-gray-500 text-[10px]">
                                Phone
                              </span>
                              <span className="text-white font-semibold text-[10px]">
                                {displayUser.phone
                                  ? `+44 ${displayUser.phone}`
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center col-span-2 sm:col-span-1">
                              <span className="text-gray-500 text-[10px]">
                                Email
                              </span>
                              <span className="text-white font-semibold text-[10px] truncate max-w-[120px]">
                                {displayUser.email || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Message - Compact */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                        <label className="text-gray-300 text-[10px] sm:text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                          <FiAlertCircle className="text-[#fe9a00] text-[10px]" />
                          Notes
                          <span className="text-gray-500 font-normal">
                            (Optional)
                          </span>
                        </label>
                        <textarea
                          value={customerMessage}
                          onChange={(e) => setCustomerMessage(e.target.value)}
                          rows={2}
                          maxLength={500}
                          placeholder="Any special requests..."
                          className="w-full bg-white/5 border border-white/15 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 resize-none transition-all placeholder:text-gray-600"
                        />
                        <p className="text-gray-600 text-[8px] mt-0.5 text-right">
                          {customerMessage.length}/500
                        </p>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-2.5">
                      {/* Add-ons */}
                      {selectedAddOns.length > 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                          <div className="flex items-center gap-1.5 mb-2">
                            <FiPackage className="text-[#fe9a00] text-xs" />
                            <h4 className="text-white font-bold text-[10px] sm:text-xs">
                              Add-ons
                            </h4>
                            <span className="ml-auto text-[9px] font-bold text-[#fe9a00] bg-[#fe9a00]/10 px-1.5 py-0.5 rounded-full">
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
                                  className="flex items-center justify-between bg-white/5 rounded px-2 py-1 border border-white/5"
                                >
                                  <div className="flex items-center gap-1 min-w-0">
                                    <div className="w-1 h-1 rounded-full bg-[#fe9a00] shrink-0" />
                                    <span className="text-gray-300 text-[10px] sm:text-[11px] truncate">
                                      {addon.name}
                                    </span>
                                    {item.quantity > 1 && (
                                      <span className="text-gray-500 text-[9px] shrink-0">
                                        ×{item.quantity}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-white font-bold text-[10px] sm:text-[11px] shrink-0 ml-1.5">
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
                        <div className="bg-white/5 border border-[#fe9a00]/25 rounded-xl p-2.5 sm:p-3 shadow-inner shadow-black/20">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <h4 className="text-white font-black text-xs sm:text-sm">
                              Price Summary
                            </h4>
                            <span className="text-[#fe9a00] text-[9px] font-bold uppercase tracking-wide bg-[#fe9a00]/10 border border-[#fe9a00]/20 rounded-full px-2 py-0.5">
                              Breakdown
                            </span>
                          </div>

                          {/* Admin Per-Invoice */}
                          {isAdminMode && (
                            <div className="mb-2.5 p-2 bg-sky-500/10 border border-sky-500/30 rounded-lg">
                              <label className="flex items-center gap-1.5 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={perInvoice}
                                  onChange={(e) => {
                                    setPerInvoice(e.target.checked);
                                    if (e.target.checked) {
                                      setIsManualPrice(false);
                                      setManualPricePerDay("");
                                      setManualPriceNote("");
                                    }
                                  }}
                                  className="w-3 h-3 rounded border-sky-500/50 bg-sky-500/20 text-sky-500 focus:ring-sky-500 focus:ring-offset-0 cursor-pointer"
                                />
                                <span className="text-sky-300 text-base font-semibold">
                                  🧾 Per Invoice (no price now)
                                </span>
                              </label>
                              {perInvoice && (
                                <p className="text-sky-200/80 text-[9px] mt-1.5 pl-4.5 leading-relaxed">
                                  Total stays £0. The final price is entered when
                                  you mark this reservation as completed.
                                </p>
                              )}
                            </div>
                          )}

                          {/* Admin Manual Price */}
                          {isAdminMode && !perInvoice && (
                            <div className="mb-2.5 p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                              <label className="flex items-center gap-1.5 cursor-pointer group">
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
                                  className="w-3 h-3 rounded border-purple-500/50 bg-purple-500/20 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
                                />
                                <span className="text-purple-300 text-base font-semibold">
                                  💰 Manual Pricing
                                </span>
                              </label>

                              {isManualPrice && (
                                <div className="space-y-1.5 mt-2 pl-4.5">
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <div>
                                      <label className="text-purple-200 text-[9px] font-semibold mb-0.5 block">
                                        £/Day
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={manualPricePerDay}
                                        onChange={(e) =>
                                          setManualPricePerDay(e.target.value)
                                        }
                                        placeholder={`${priceCalc.pricePerDay.toFixed(2)}`}
                                        className="w-full bg-purple-500/10 border border-purple-500/30 rounded px-2 py-1 text-white text-[10px] focus:outline-none focus:border-purple-500 placeholder:text-purple-300/50"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-purple-200 text-[9px] font-semibold mb-0.5 block">
                                        Note
                                      </label>
                                      <input
                                        type="text"
                                        value={manualPriceNote}
                                        onChange={(e) =>
                                          setManualPriceNote(e.target.value)
                                        }
                                        placeholder="Optional"
                                        className="w-full bg-purple-500/10 border border-purple-500/30 rounded px-2 py-1 text-white text-[10px] focus:outline-none focus:border-purple-500 placeholder:text-purple-300/50"
                                      />
                                    </div>
                                  </div>
                                  {manualPricePerDay &&
                                    !isNaN(parseFloat(manualPricePerDay)) &&
                                    parseFloat(manualPricePerDay) > 0 && (
                                      <p className="text-purple-200 text-[9px] bg-purple-500/20 border border-purple-500/40 rounded px-1.5 py-1">
                                        📊 {priceCalc.totalDays}d × £
                                        {parseFloat(manualPricePerDay).toFixed(
                                          2,
                                        )}{" "}
                                        = £
                                        {(
                                          priceCalc.totalDays *
                                          parseFloat(manualPricePerDay)
                                        ).toFixed(2)}
                                      </p>
                                    )}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="overflow-hidden rounded-lg border border-white/10 bg-black/20 divide-y divide-white/10 text-[10px] sm:text-[11px]">
                            <div className="px-2.5 py-2 flex justify-between items-start gap-2">
                              <div>
                                <span className="text-gray-400">
                                  Rental charges
                                </span>
                                <div className="text-gray-500 text-[9px] mt-0.5">
                                  {priceCalc.totalDays} days x £
                                  {displayedDailyRate.toFixed(2)}
                                  {hasManualDailyPrice && " manual"}
                                  {priceCalc.extraHours > 0 &&
                                    ` + ${priceCalc.extraHours}h x £${displayedExtraHoursRate.toFixed(2)}`}
                                </div>
                              </div>
                              <span className="text-white font-semibold shrink-0 ml-2">
                                £{displayedRentalCharge.toFixed(2)}
                              </span>
                            </div>

                            {displayedGearCharge > 0 && (
                              <div className="px-2.5 py-2 flex justify-between items-start gap-2">
                                <div>
                                  <span className="text-gray-400">
                                    Automatic gear
                                  </span>
                                  <div className="text-gray-500 text-[9px] mt-0.5">
                                    {priceCalc.totalDays} days x £
                                    {displayedGearExtraCostPerDay.toFixed(2)}
                                  </div>
                                </div>
                                <span className="text-white font-semibold shrink-0 ml-2">
                                  £{displayedGearCharge.toFixed(2)}
                                </span>
                              </div>
                            )}

                            {displayedPickupExtensionPrice > 0 && (
                              <div className="px-2.5 py-2 flex justify-between items-center gap-2">
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
                              <div className="px-2.5 py-2 flex justify-between items-center gap-2">
                                <span className="text-gray-400">
                                  Return Extension (either out of working time
                                  or weekend time)
                                </span>
                                <span className="text-white font-semibold shrink-0">
                                  £{displayedReturnExtensionPrice.toFixed(2)}
                                </span>
                              </div>
                            )}

                            {selectedAddOns.length > 0 && addOnsPrice > 0 && (
                              <div className="px-2.5 py-2 flex items-center justify-between gap-2">
                                <span className="text-gray-400">
                                  Total Add-ons
                                </span>
                                <span className="text-white font-semibold shrink-0">
                                  £{addOnsPrice.toFixed(2)}
                                </span>
                              </div>
                            )}

                            {priceCalc.specialDaysPrice !== undefined &&
                              priceCalc.specialDaysPrice > 0 &&
                              priceCalc.specialDaysInfo &&
                              priceCalc.specialDaysInfo.length > 0 && (
                                <div className="px-2.5 py-2 bg-blue-500/10">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <p className="text-blue-300 font-semibold text-[10px] flex items-center gap-1">
                                      <FiCalendar className="text-[9px]" />
                                      Special Days
                                    </p>
                                    <span className="text-blue-100 font-bold text-[10px]">
                                      £{priceCalc.specialDaysPrice.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="space-y-0.5">
                                    {priceCalc.specialDaysInfo.map(
                                      (info, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center justify-between text-[9px]"
                                        >
                                          <div className="flex items-center gap-1 min-w-0">
                                            <div className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                                            <span className="text-blue-200 truncate">
                                              {info.date}
                                            </span>
                                            {info.reason && (
                                              <span className="text-blue-300/70 truncate hidden sm:inline">
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
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <FiTag className="text-[#fe9a00] text-xs" />
                          <h4 className="text-white font-bold text-[10px] sm:text-xs">
                            Discount
                          </h4>
                        </div>
                        {!appliedDiscount ? (
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              id="gtm-discount-input"
                              value={discountCode}
                              onChange={(e) => {
                                setDiscountCode(e.target.value.toUpperCase());
                                setDiscountError("");
                              }}
                              placeholder="Code"
                              className="flex-1 bg-white/5 border border-white/15 rounded-lg px-2.5 py-1.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#fe9a00] uppercase text-[10px] font-mono tracking-wider"
                            />
                            <button
                              id="gtm-apply-discount"
                              onClick={handleApplyDiscount}
                              disabled={
                                isApplyingDiscount || !discountCode.trim()
                              }
                              className="px-3 py-1.5 bg-[#fe9a00] hover:bg-orange-500 text-white font-bold rounded-lg transition-all disabled:opacity-40 text-[10px]"
                            >
                              {isApplyingDiscount ? "..." : "Apply"}
                            </button>
                          </div>
                        ) : (
                          <div className="bg-green-500/10 border border-green-500/25 rounded-lg p-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <FiCheckCircle className="text-green-400 text-xs" />
                                <div>
                                  <p className="text-green-400 font-bold text-[10px] font-mono">
                                    {appliedDiscount.code}
                                  </p>
                                  <p className="text-green-400/70 text-[9px]">
                                    {appliedDiscount.percentage}% off
                                  </p>
                                </div>
                              </div>
                              <button
                                id="gtm-remove-discount"
                                onClick={handleRemoveDiscount}
                                className="text-red-400 hover:text-red-300 text-[9px] font-semibold"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )}
                        {discountError && (
                          <p className="text-red-400 text-[9px] flex items-center gap-1 mt-1">
                            <FiAlertCircle className="text-[9px]" />
                            {discountError}
                          </p>
                        )}
                      </div>

                      {/* Terms */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                        <label className="flex items-center gap-2 cursor-pointer group">
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
                            className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-[#fe9a00] focus:ring-[#fe9a00] focus:ring-offset-0 cursor-pointer shrink-0"
                          />
                          <span className="text-gray-400 text-[10px] leading-relaxed group-hover:text-gray-300 transition-colors">
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
                          <p className="text-red-400 text-[9px] mt-1 flex items-center gap-1 ml-5.5">
                            <FiAlertCircle className="text-[9px]" />
                            {errors.acceptTerms}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {errors.submit && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
                      <p className="text-red-400 text-[10px] flex items-center justify-center gap-1">
                        <FiAlertCircle className="text-xs" />
                        {errors.submit}
                      </p>
                    </div>
                  )}

                  {/* ── Sticky Bottom: Price + Confirm ── */}
                  <div className="sticky bottom-0 left-0 right-0 z-30 -mx-3 sm:-mx-6 px-3 sm:px-6 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+8px)] sm:pb-3 bg-linear-to-t from-[#0f172b] via-[#0f172b] to-[#0f172b]/80">
                    {/* Price summary bar */}
                    {priceCalc && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 mb-2">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <span className="text-gray-400 text-base font-extrabold block leading-none">
                              Total
                            </span>
                            {isAdminMode && perInvoice && (
                              <span className="text-sky-300 text-[8px] font-semibold">
                                🧾 Per Invoice
                              </span>
                            )}
                            {isAdminMode &&
                              !perInvoice &&
                              isManualPrice &&
                              manualPricePerDay && (
                                <span className="text-purple-300 text-[8px] font-semibold">
                                  💰 Manual
                                </span>
                              )}
                          </div>
                          <div className="flex items-center gap-2">
                            {appliedDiscount && (
                              <div className="text-right">
                                <span className="text-gray-500 line-through text-[10px] block leading-none">
                                  £{priceCalc.totalPrice}
                                </span>
                                <span className="text-green-400 text-[9px] font-bold">
                                  -{appliedDiscount.percentage}%
                                </span>
                              </div>
                            )}
                            <span className="text-[#fe9a00] font-black text-xl sm:text-2xl leading-none">
                              {isAdminMode && perInvoice
                                ? "£0"
                                : `£${finalPrice || priceCalc.totalPrice}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-2">
                      <button
                        id="gtm-step4-back"
                        onClick={() => {
                          setStep(3);
                          const modalBody =
                            document.querySelector(".modal-body-scroll");
                          if (modalBody) {
                            modalBody.scrollTop = 0;
                          }
                        }}
                        className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 text-[10px] sm:text-xs"
                      >
                        <FiArrowLeft className="text-[10px]" />
                        Back
                      </button>
                      <button
                        id="gtm-confirm-reservation"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !formData.acceptTerms}
                        className="flex-[2] bg-[#fe9a00] hover:bg-orange-500 active:scale-[0.98] text-white font-black py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-[#fe9a00]/25 text-xs sm:text-sm"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1.5">
                            <FiCheckCircle className="text-sm" />
                            Confirm Reservation
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
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
          onClose={() => setShowRulesModal(false)}
        />
      )}
    </>
  );
}
