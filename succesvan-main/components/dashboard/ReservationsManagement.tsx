"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  FiX,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiClock,
  FiEye,
  FiGlobe,
  FiPlus,
  FiPrinter,
} from "react-icons/fi";
import { showToast } from "@/lib/toast";
import DynamicTableView from "./DynamicTableView";
import ReservationDetailsModal from "./ReservationDetailsModal";
import { Reservation } from "@/types/type";
import CustomSelect from "@/components/ui/CustomSelect";
import { DateRange, Range } from "react-date-range";
import { usePriceCalculation } from "@/hooks/usePriceCalculation";
import TimeSelect from "@/components/ui/TimeSelect";
import { generateTimeSlots } from "@/utils/timeSlots";
import AddOnsModal from "@/components/global/AddOnsModal";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "./datepicker.css";
import AdminCreateReservationModal from "./AdminCreateReservationModal";
import ReservationOperationsPanel from "./ReservationOperationsPanel";
import {
  calculateOfficeExtensionPrices,
  findSpecialDayForDate,
  getSpecialDayPickupWindow,
  getSpecialDayReturnWindow,
  getWorkingDayTimeSlots,
  getWorkingDayWindow,
  isSameCalendarDate,
} from "@/lib/specialDaySchedule";
import { printReservationReceipt } from "@/lib/printReservation";
import { clientAuthHeaders } from "@/lib/client-auth";
import {
  ADMIN_STATUS_OPTIONS,
  DEPOSIT_OPTION_LABELS,
  statusBadgeClasses,
  statusLabel,
} from "@/lib/reservation-status";
import {
  createLondonDateTime,
  formatDateForStorage,
  formatDateInputInLondon,
  parseStorageDate,
} from "@/lib/englandTime";

type MutateFn = () => Promise<void>;

const formatLondonDate = (value: string) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        timeZone: "Europe/London",
      })
    : "-";

const formatLondonTime = (value: string | Date) =>
  value
    ? new Date(value).toLocaleTimeString("en-GB", {
        timeZone: "Europe/London",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "-";

const getReservationDateForEdit = (
  reservation: Reservation,
  type: "start" | "end",
) => {
  const storedDate = parseStorageDate(
    type === "start"
      ? reservation.startDateDisplay
      : reservation.endDateDisplay,
  );

  if (storedDate) return storedDate;

  const sourceDate =
    type === "start" ? reservation.startDate : reservation.endDate;
  const londonDate = parseStorageDate(formatDateInputInLondon(sourceDate));

  return londonDate || new Date(sourceDate);
};

export default function ReservationsManagement() {
  const mutateRef = useRef<MutateFn | null>(null);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEditDatesOpen, setIsEditDatesOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [depositTransactionRef, setDepositTransactionRef] = useState("");
  const [depositFailureReason, setDepositFailureReason] = useState("");
  const [depositBusy, setDepositBusy] = useState(false);
  const [newVehicle, setNewVehicle] = useState("");
  const [vehicles, setVehicles] = useState<
    {
      _id: string;
      name: string;
      keyNumber: string;
      category: string;
      gear: string;
      available: boolean;
    }[]
  >([]);
  const [users, setUsers] = useState<{ _id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<
    {
      _id: string;
      name: string;
      pricingTiers?: any[];
      extrahoursRate?: number;
      selloffer?: number;
      gear?: any;
    }[]
  >([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [showDateRange, setShowDateRange] = useState(false);
  const [editDateRange, setEditDateRange] = useState<Range[]>([
    {
      startDate: new Date(),
      endDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
      key: "selection",
    },
  ]);
  const [editTimes, setEditTimes] = useState({
    startTime: "10:00",
    endTime: "10:00",
  });
  const [editCategory, setEditCategory] = useState("");
  const [pickupExtensionPrice, setPickupExtensionPrice] = useState(0);
  const [returnExtensionPrice, setReturnExtensionPrice] = useState(0);
  const [isManualExtension, setIsManualExtension] = useState(false);
  const [addOnsCost, setAddOnsCost] = useState(0);
  const [startDateReservedSlots, setStartDateReservedSlots] = useState<any[]>(
    [],
  );
  const [showCreateReservation, setShowCreateReservation] = useState(false);
  const [endDateReservedSlots, setEndDateReservedSlots] = useState<any[]>([]);
  const [showAddOnsModal, setShowAddOnsModal] = useState(false);
  const [addOns, setAddOns] = useState<any[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<
    { addOn: string; quantity: number; selectedTierIndex?: number }[]
  >([]);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedReservationForDetails, setSelectedReservationForDetails] =
    useState<Reservation | null>(null);
  const [selectedGear, setSelectedGear] = useState<"manual" | "automatic" | "">(
    "",
  );
  const [gearExtraCost, setGearExtraCost] = useState(0);
  const [isManualPrice, setIsManualPrice] = useState(false);
  const [manualPricePerDay, setManualPricePerDay] = useState("");
  const [manualPriceNote, setManualPriceNote] = useState("");
  const [isTotalPriceOverride, setIsTotalPriceOverride] = useState(false);
  const [manualTotalPrice, setManualTotalPrice] = useState("");
  // Per-invoice: reservation has no price until it is completed.
  const [editPerInvoice, setEditPerInvoice] = useState(false);
  const [isPerInvoicePriceOpen, setIsPerInvoicePriceOpen] = useState(false);
  const [perInvoicePrice, setPerInvoicePrice] = useState("");

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c._id === editCategory);
  }, [editCategory, categories]);

  const hasBothGearTypes = useMemo(() => {
    return (
      selectedCategory?.gear?.availableTypes?.length === 2 ||
      (selectedCategory?.gear?.availableTypes?.includes("manual") &&
        selectedCategory?.gear?.availableTypes?.includes("automatic"))
    );
  }, [selectedCategory]);

  const filteredVehicles = useMemo(() => {
    const inCategory = editCategory
      ? vehicles.filter((v) => v.category === editCategory)
      : vehicles;
    // Don't hard-filter out unavailable vehicles: that left the dropdown
    // silently empty whenever a category's vehicles were all in use. Instead
    // list available ones first and disable the rest so the reason is visible.
    return [...inCategory]
      .sort((a, b) => Number(b.available) - Number(a.available))
      .map((v) => ({
        ...v,
        name: v.available ? v.name : `${v.name} — in use`,
        disabled: !v.available,
      }));
  }, [vehicles, editCategory]);

  const pickupTimeSlots = useMemo(() => {
    if (!selectedReservation?.office || !editDateRange[0].startDate) return [];
    const office = offices.find(
      (o) => o._id === (selectedReservation.office as any)?._id,
    );
    if (!office) return [];

    const date = editDateRange[0].startDate;
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

    // Admin can pick up at any time from 06:00 to 23:45 regardless of office
    // working hours; extension is charged manually.
    slots = generateTimeSlots("06:00", "23:45", 15);

    if (
      editDateRange[0].endDate &&
      editDateRange[0].startDate.toDateString() ===
        editDateRange[0].endDate.toDateString() &&
      editTimes.endTime
    ) {
      const [returnHour, returnMin] = editTimes.endTime.split(":").map(Number);
      const maxPickupMinutes = returnHour * 60 + returnMin - 6 * 60;
      slots =
        maxPickupMinutes < 0
          ? []
          : slots.filter((slot) => {
              const [hour, min] = slot.split(":").map(Number);
              return hour * 60 + min <= maxPickupMinutes;
            });
    }

    return slots;
  }, [selectedReservation, editDateRange, offices, editTimes.endTime]);

  const returnTimeSlots = useMemo(() => {
    if (!selectedReservation?.office || !editDateRange[0].endDate) return [];
    const office = offices.find(
      (o) => o._id === (selectedReservation.office as any)?._id,
    );
    if (!office) return [];

    const date = editDateRange[0].endDate;
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

    // Admin can return at any time from 06:00 to 23:45 regardless of office
    // working hours; extension is charged manually.
    slots = generateTimeSlots("06:00", "23:45", 15);

    if (
      editDateRange[0].startDate &&
      editDateRange[0].startDate.toDateString() ===
        editDateRange[0].endDate.toDateString() &&
      editTimes.startTime
    ) {
      const [pickupHour, pickupMin] = editTimes.startTime
        .split(":")
        .map(Number);
      const minReturnMinutes = pickupHour * 60 + pickupMin + 6 * 60;
      slots =
        minReturnMinutes > 1439
          ? []
          : slots.filter((slot) => {
              const [hour, min] = slot.split(":").map(Number);
              return hour * 60 + min >= minReturnMinutes;
            });
    }

    return slots;
  }, [selectedReservation, editDateRange, offices, editTimes.startTime]);

  const isDateDisabled = useMemo(() => {
    return (date: Date): boolean => {
      if (!selectedReservation?.office) return false;
      const office = offices.find(
        (o) => o._id === (selectedReservation.office as any)?._id,
      );
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
      if (specialDay) return !specialDay.isOpen;
      const workingDay = office.workingTime?.find(
        (w: any) => w.day === dayName,
      );
      if (workingDay && !workingDay.isOpen) return true;
      return false;
    };
  }, [selectedReservation, offices]);

  const priceCalc = usePriceCalculation(
    editDateRange[0].startDate && editTimes.startTime
      ? createLondonDateTime(editDateRange[0].startDate, editTimes.startTime)
      : "",
    editDateRange[0].endDate && editTimes.endTime
      ? createLondonDateTime(editDateRange[0].endDate, editTimes.endTime)
      : "",
    selectedCategory?.pricingTiers || [],
    selectedCategory?.extrahoursRate || 0,
    pickupExtensionPrice,
    returnExtensionPrice,
    gearExtraCost,
    addOnsCost,
    selectedCategory?.selloffer || 0,
  );

  const editFinalPrice = useMemo(() => {
    if (!priceCalc) return null;

    if (isTotalPriceOverride) {
      const overridePrice = parseFloat(manualTotalPrice);
      if (!isNaN(overridePrice) && overridePrice >= 0) {
        return parseFloat(overridePrice.toFixed(2));
      }
    }

    if (isManualPrice) {
      const manualDailyPrice = parseFloat(manualPricePerDay);
      if (!isNaN(manualDailyPrice) && manualDailyPrice > 0) {
        const daysPrice = priceCalc.totalDays * manualDailyPrice;
        const extraHoursPrice =
          priceCalc.extraHours * (selectedCategory?.extrahoursRate || 0);
        const automaticGearPrice =
          selectedGear === "automatic" && hasBothGearTypes
            ? (selectedCategory?.gear?.automaticExtraCost || 0) *
              priceCalc.totalDays
            : 0;

        const total =
          daysPrice +
          extraHoursPrice +
          pickupExtensionPrice +
          returnExtensionPrice +
          automaticGearPrice +
          addOnsCost;

        return parseFloat(total.toFixed(2));
      }
    }

    return priceCalc.totalPrice;
  }, [
    priceCalc,
    isTotalPriceOverride,
    manualTotalPrice,
    isManualPrice,
    manualPricePerDay,
    selectedCategory,
    selectedGear,
    hasBothGearTypes,
    pickupExtensionPrice,
    returnExtensionPrice,
    addOnsCost,
  ]);

  const editPriceBreakdown = useMemo(() => {
    if (!priceCalc) return "";

    if (isTotalPriceOverride) {
      const overridePrice = parseFloat(manualTotalPrice);
      if (!isNaN(overridePrice) && overridePrice >= 0) {
        return `Admin total override: £${overridePrice.toFixed(2)}`;
      }
    }

    if (isManualPrice) {
      const manualDailyPrice = parseFloat(manualPricePerDay);
      if (!isNaN(manualDailyPrice) && manualDailyPrice > 0) {
        const parts = [
          `${priceCalc.totalDays} day${
            priceCalc.totalDays > 1 ? "s" : ""
          } × £${manualDailyPrice.toFixed(2)}/day`,
        ];

        if (priceCalc.extraHours > 0) {
          parts.push(
            `${priceCalc.extraHours}h × £${(
              selectedCategory?.extrahoursRate || 0
            ).toFixed(2)}/hr`,
          );
        }

        if (pickupExtensionPrice > 0) {
          parts.push(
            `pickup extension £${pickupExtensionPrice.toFixed(2)} - either out of working time or weekend time`,
          );
        }

        if (returnExtensionPrice > 0) {
          parts.push(
            `return extension £${returnExtensionPrice.toFixed(2)} - either out of working time or weekend time`,
          );
        }

        if (
          selectedGear === "automatic" &&
          hasBothGearTypes &&
          selectedCategory?.gear?.automaticExtraCost
        ) {
          const automaticExtraCost = Number(
            selectedCategory.gear.automaticExtraCost,
          );
          parts.push(
            `${priceCalc.totalDays} day${
              priceCalc.totalDays > 1 ? "s" : ""
            } × £${automaticExtraCost.toFixed(2)} gear`,
          );
        }

        if (addOnsCost > 0) {
          parts.push(`add-ons £${addOnsCost.toFixed(2)}`);
        }

        return `${parts.join(" + ")} (Manual daily price)`;
      }
    }

    return priceCalc.breakdown;
  }, [
    priceCalc,
    isTotalPriceOverride,
    manualTotalPrice,
    isManualPrice,
    manualPricePerDay,
    selectedCategory,
    selectedGear,
    hasBothGearTypes,
    pickupExtensionPrice,
    returnExtensionPrice,
    addOnsCost,
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesRes, usersRes, categoriesRes, officesRes, addOnsRes] =
          await Promise.all([
            fetch("/api/vehicles?status=active&limit=1000"),
            fetch("/api/users?limit=100"),
            fetch("/api/categories?status=active"),
            fetch("/api/offices"),
            fetch("/api/addons?status=active"),
          ]);
        const vehiclesData = await vehiclesRes.json();
        const usersData = await usersRes.json();
        const categoriesData = await categoriesRes.json();
        const officesData = await officesRes.json();
        const addOnsData = await addOnsRes.json();

        setVehicles(
          (vehiclesData.data || []).map((vehicle: any) => {
            const gearTypes =
              vehicle.gear?.availableTypes
                ?.map((g: any) => g.gearType)
                .join("/") || "";
            return {
              _id: vehicle._id,
              name: `${vehicle.number || "Unknown"}${
                vehicle.keyNumber ? ` (Key: ${vehicle.keyNumber})` : ""
              } - ${gearTypes || "N/A"}`,
              keyNumber: vehicle.keyNumber || "",
              category:
                typeof vehicle.category === "string"
                  ? vehicle.category
                  : vehicle.category?._id || "",
              gear: gearTypes,
              available: vehicle.available !== false,
            };
          }),
        );
        setUsers(
          (usersData.data || []).map((user: any) => ({
            _id: user._id,
            name: `${user.name} ${user.lastName || ""}`.trim(),
          })),
        );
        setCategories(
          (categoriesData.data?.data || categoriesData.data || []).map(
            (cat: any) => ({
              _id: cat._id,
              name: cat.name,
              pricingTiers: cat.pricingTiers,
              extrahoursRate: cat.extrahoursRate,
              selloffer: cat.selloffer,
              gear: cat.gear,
            }),
          ),
        );
        setOffices(officesData.data?.data || officesData.data || []);
        setAddOns(addOnsData.data?.data || addOnsData.data || []);
      } catch (error) {
        console.log("Failed to fetch data:", error);
      } finally {
        setLoadingVehicles(false);
      }
    };
    fetchData();
  }, []);

  const handleViewDetails = (item: Reservation) => {
    setSelectedReservation(item);
    setNewVehicle(
      typeof item.vehicle === "string" ? item.vehicle : item.vehicle?._id || "",
    );
    setEditCategory((item as any).category?._id || "");
    const startDate = getReservationDateForEdit(item, "start");
    const endDate = getReservationDateForEdit(item, "end");

    setEditDateRange([
      {
        startDate,
        endDate,
        key: "selection",
      },
    ]);
    setEditTimes({
      startTime: item.pickupTime || formatLondonTime(item.startDate),
      endTime: item.returnTime || formatLondonTime(item.endDate),
    });
    setSelectedGear((item as any).selectedGear || "manual");
    setNewStatus("");
    setCancelReason(item.cancelReason || "");
    const hasManualDailyPrice =
      item.isManualPrice &&
      item.manualPricePerDay !== undefined &&
      item.manualPricePerDay !== null;
    setIsManualPrice(Boolean(hasManualDailyPrice));
    setManualPricePerDay(
      hasManualDailyPrice ? String(item.manualPricePerDay) : "",
    );
    setIsTotalPriceOverride(
      Boolean(item.isManualPrice && !hasManualDailyPrice),
    );
    setManualTotalPrice(
      item.isManualPrice && !hasManualDailyPrice
        ? String(item.totalPrice ?? "")
        : "",
    );
    setManualPriceNote(item.manualPriceNote || "");
    setIsManualExtension(false);
    setEditPerInvoice(Boolean((item as any).perInvoice));
    // Load existing add-ons
    if (item.addOns && item.addOns.length > 0) {
      setSelectedAddOns(
        item.addOns.map((addon: any) => ({
          addOn:
            typeof addon.addOn === "string" ? addon.addOn : addon.addOn?._id,
          quantity: addon.quantity,
          selectedTierIndex: addon.selectedTierIndex,
        })),
      );
    } else {
      setSelectedAddOns([]);
    }
    setIsDetailOpen(true);
  };

  // Calculate gear extra cost
  useEffect(() => {
    if (selectedGear === "automatic" && selectedCategory) {
      setGearExtraCost(
        (selectedCategory.gear?.automaticExtraCost || 0) *
          (priceCalc?.totalDays || 1),
      );
    } else {
      setGearExtraCost(0);
    }
  }, [selectedGear, selectedCategory, priceCalc?.totalDays]);

  // Calculate add-ons cost
  useEffect(() => {
    const cost = selectedAddOns.reduce((total: number, item: any) => {
      const addon = addOns.find((a) => a._id === item.addOn);
      if (!addon) return total;
      if (addon.pricingType === "flat") {
        const amount = addon.flatPrice?.amount || 0;
        const isPerDay = addon.flatPrice?.isPerDay || false;
        return (
          total +
          (isPerDay ? amount * (priceCalc?.totalDays || 1) : amount) *
            item.quantity
        );
      } else {
        const tier = addon.tieredPrice?.tiers?.[item.selectedTierIndex ?? 0];
        if (tier) {
          const isPerDay = addon.tieredPrice?.isPerDay || false;
          return (
            total +
            (isPerDay ? tier.price * (priceCalc?.totalDays || 1) : tier.price) *
              item.quantity
          );
        }
      }
      return total;
    }, 0);
    setAddOnsCost(cost);
  }, [selectedAddOns, priceCalc, addOns]);

  // Calculate extension prices
  useEffect(() => {
    // Admin is overriding the extension prices manually; don't recompute.
    if (isManualExtension) return;

    if (!selectedReservation?.office) {
      setPickupExtensionPrice(0);
      setReturnExtensionPrice(0);
      return;
    }

    const office = offices.find(
      (o) => o._id === (selectedReservation.office as any)?._id,
    );
    if (!office) {
      setPickupExtensionPrice(0);
      setReturnExtensionPrice(0);
      return;
    }

    const extensionPrices = calculateOfficeExtensionPrices({
      office,
      pickupDate: editDateRange[0].startDate,
      pickupTime: editTimes.startTime,
      returnDate: editDateRange[0].endDate,
      returnTime: editTimes.endTime,
    });

    setPickupExtensionPrice(extensionPrices.pickupExtension);
    setReturnExtensionPrice(extensionPrices.returnExtension);
  }, [
    selectedReservation,
    editTimes.startTime,
    editTimes.endTime,
    editDateRange,
    offices,
    isManualExtension,
  ]);

  // Fetch reserved slots
  useEffect(() => {
    if (selectedReservation?.office && editDateRange[0].startDate) {
      const date = editDateRange[0].startDate;
      const startDate = formatDateForStorage(date);
      fetch(
        `/api/reservations/by-office?office=${
          (selectedReservation.office as any)._id
        }&startDate=${startDate}&type=start`,
      )
        .then((res) => res.json())
        .then((data) =>
          setStartDateReservedSlots(data.data?.reservedSlots || []),
        )
        .catch((err) => console.log(err));
    }
  }, [selectedReservation, editDateRange]);

  useEffect(() => {
    if (selectedReservation?.office && editDateRange[0].endDate) {
      const date = editDateRange[0].endDate;
      const endDate = formatDateForStorage(date);
      fetch(
        `/api/reservations/by-office?office=${
          (selectedReservation.office as any)._id
        }&endDate=${endDate}&type=end`,
      )
        .then((res) => res.json())
        .then((data) => setEndDateReservedSlots(data.data?.reservedSlots || []))
        .catch((err) => console.log(err));
    }
  }, [selectedReservation, editDateRange]);

  const handleStatusChange = async (options?: { totalPrice?: number }) => {
    if (!selectedReservation || !newStatus) return;

    // Per-invoice reservations need a final price before they can be completed.
    // Honor both the saved flag and the live edit toggle.
    const isPerInvoiceReservation =
      Boolean((selectedReservation as any).perInvoice) || editPerInvoice;
    if (
      newStatus === "completed" &&
      isPerInvoiceReservation &&
      options?.totalPrice === undefined
    ) {
      setPerInvoicePrice(
        selectedReservation.totalPrice
          ? String(selectedReservation.totalPrice)
          : "",
      );
      setIsPerInvoicePriceOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: any = { status: newStatus };

      if (options?.totalPrice !== undefined) {
        updateData.totalPrice = options.totalPrice;
      }

      if (newStatus === "canceled") {
        updateData.cancelReason = cancelReason.trim();
      }

      // If status is completed or canceled, unassign the vehicle
      if (newStatus === "completed" || newStatus === "canceled") {
        updateData.vehicle = null;
      }

      const res = await fetch(`/api/reservations/${selectedReservation._id}`, {
        method: "PATCH",
        headers: clientAuthHeaders(true),
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Update failed");

      // If unassigning vehicle, set it to available
      if (
        (newStatus === "completed" || newStatus === "canceled") &&
        selectedReservation.vehicle
      ) {
        const vehicleId =
          typeof selectedReservation.vehicle === "string"
            ? selectedReservation.vehicle
            : selectedReservation.vehicle._id;
        const vehicleRes = await fetch(`/api/vehicles/${vehicleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ available: true }),
        });
        const vehicleData = await vehicleRes.json();
        if (!vehicleData.success)
          throw new Error(vehicleData.error || "Vehicle update failed");
      }

      showToast.success("Status updated successfully!");
      setIsStatusOpen(false);
      setNewStatus("");
      setCancelReason("");
      setIsPerInvoicePriceOpen(false);
      setPerInvoicePrice("");
      if (mutateRef.current) mutateRef.current();
      setIsDetailOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPerInvoicePrice = async () => {
    const price = parseFloat(perInvoicePrice);
    if (isNaN(price) || price < 0) {
      showToast.error("Enter a valid total price");
      return;
    }
    setIsPerInvoicePriceOpen(false);
    await handleStatusChange({ totalPrice: price });
  };

  const handleDepositVerification = async (action: "approve" | "reject") => {
    if (!selectedReservation?._id) return;
    if (action === "reject" && !depositFailureReason.trim()) {
      showToast.error("Add a reason for rejecting the receipt");
      return;
    }

    setDepositBusy(true);
    try {
      const res = await fetch(
        `/api/reservations/${selectedReservation._id}/deposit`,
        {
          method: "PATCH",
          headers: clientAuthHeaders(true),
          body: JSON.stringify({
            action,
            transactionRef: depositTransactionRef,
            failureReason: depositFailureReason,
          }),
        },
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Verification failed");

      setSelectedReservation(data.data);
      setDepositTransactionRef("");
      setDepositFailureReason("");
      await mutateRef.current?.();
      showToast.success(
        action === "approve" ? "Deposit verified" : "Deposit receipt rejected",
      );
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Verification failed",
      );
    } finally {
      setDepositBusy(false);
    }
  };

  const handleDatesUpdate = async () => {
    if (
      !selectedReservation ||
      !editDateRange[0].startDate ||
      !editDateRange[0].endDate ||
      !editCategory
    )
      return;

    const manualDailyPrice = parseFloat(manualPricePerDay);
    const manualDailyPriceActive =
      isManualPrice && !isNaN(manualDailyPrice) && manualDailyPrice > 0;
    const totalOverridePrice = parseFloat(manualTotalPrice);
    const totalOverrideActive =
      isTotalPriceOverride &&
      !isNaN(totalOverridePrice) &&
      totalOverridePrice >= 0;

    if (isManualPrice && !manualDailyPriceActive) {
      showToast.error("Enter a valid manual price per day");
      return;
    }

    if (isTotalPriceOverride && !totalOverrideActive) {
      showToast.error("Enter a valid total price");
      return;
    }

    setIsSubmitting(true);

    try {
      const startDate = editDateRange[0].startDate;
      const endDate = editDateRange[0].endDate;

      const res = await fetch(`/api/reservations/${selectedReservation._id}`, {
        method: "PATCH",
        headers: clientAuthHeaders(true),
        body: JSON.stringify({
          startDate: createLondonDateTime(startDate, editTimes.startTime),
          endDate: createLondonDateTime(endDate, editTimes.endTime),
          startDateDisplay: formatDateForStorage(startDate),
          endDateDisplay: formatDateForStorage(endDate),
          pickupTime: editTimes.startTime,
          returnTime: editTimes.endTime,
          category: editCategory,
          totalPrice: editPerInvoice
            ? 0
            : (editFinalPrice ??
              priceCalc?.totalPrice ??
              selectedReservation.totalPrice),
          perInvoice: editPerInvoice,
          addOns: selectedAddOns,
          selectedGear: selectedGear,
          pickupExtensionPrice,
          returnExtensionPrice,
          isManualPrice:
            !editPerInvoice && (manualDailyPriceActive || totalOverrideActive),
          manualPricePerDay: manualDailyPriceActive ? manualDailyPrice : null,
          manualPriceNote: manualDailyPriceActive
            ? manualPriceNote || "Admin custom daily pricing"
            : totalOverrideActive
              ? manualPriceNote || "Admin total price override"
              : "",
          adminEdited: true,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Update failed");

      showToast.success("Reservation updated successfully!");
      setIsEditDatesOpen(false);
      if (mutateRef.current) mutateRef.current();
      setIsDetailOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">Quick Actions</h3>
        <button
          onClick={() => setShowCreateReservation(true)}
          className="flex items-center gap-2 px-5 py-3 bg-linear-to-r from-[#fe9a00] to-[#ff8800] hover:from-[#e68a00] hover:to-[#e67700] text-white font-bold rounded-lg transition-all text-sm shadow-lg hover:shadow-2xl hover:scale-105"
        >
          <FiPlus className="text-lg" />
          Create Reservation
        </button>
      </div>
      <AdminCreateReservationModal
        isOpen={showCreateReservation}
        onClose={() => setShowCreateReservation(false)}
      />
      <DynamicTableView<Reservation>
        apiEndpoint="/api/reservations"
        defaultFilters={{ status_ne: "completed" }}
        editButtonClass="mt-2"
        filters={[
          { key: "reservationCode", label: "Order ID", type: "text" },
          { key: "phone", label: "Phone Number", type: "text" },
          {
            key: "category",
            label: "Category",
            type: "select",
            options: categories,
          },
       
          {
            key: "isManualPrice",
            label: "Manual Price",
            type: "select",
            options: [
              { _id: "true", name: "Yes" },
              { _id: "false", name: "No" },
            ],
          },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ADMIN_STATUS_OPTIONS,
          },
          {
            key: "office",
            label: "Office",
            type: "select",
            options: offices.map((office) => ({
              _id: office._id,
              name: office.name,
            })),
          },
          {
            key: "totalPrice",
            label: "Total Price Range",
            type: "range",
            rangeType: "number",
          },
          { key: "startDate", label: "Start Date", type: "date" },
          { key: "endDate", label: "End Date", type: "date" },
          { key: "createdAt", label: "Created At", type: "date" },
        ]}
        title="Reservation"
        columns={[
          {
            key: "reservationCode",
            label: "order Id",
            render: (
              value: any,
              row: any,
              index?: number,
              pagination?: any,
            ) => {
              // Prefer the stored unique order code; fall back to a reverse
              // index for legacy reservations created before codes existed.
              if (row?.reservationCode) {
                return (
                  <span className="text-xs text-[#fe9a00]">
                    {row.reservationCode}
                  </span>
                );
              }
              const globalIndex =
                ((pagination?.page || 1) - 1) * (pagination?.limit || 10) +
                (index || 0) +
                1;
              const displayNumber = pagination?.total
                ? pagination.total - globalIndex + 1
                : (index ?? 0) + 1;
              return <span className="text-xs">#{displayNumber || 0}</span>;
            },
          },
          {
            key: "user",
            label: "Customer",
            render: (value: any) => value?.name || "-",
          },
          {
            key: "user",
            label: "Phone",
            render: (value: any) => value?.phoneData?.phoneNumber || "-",
          },
          {
            key: "category",
            label: "Category",
            render: (value: any) => value?.name || "-",
          },
          {
            key: "createdAt",
            label: "Created At",
            render: (value: string) =>
              value ? new Date(value).toLocaleDateString("en-GB") : "-",
          },
          // {
          //   key: "office",
          //   label: "Office",
          //   render: (value: any) => value?.name.slice(0, 10) || "-",
          // },
          {
            key: "totalPrice",
            label: "Price",
            render: (value: number, record: Reservation | undefined) =>
              (record as any)?.perInvoice && !value ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-400">
                  Per Invoice
                </span>
              ) : value ? (
                `£${value.toFixed(2)}`
              ) : (
                "-"
              ),
          },
          {
            key: "startDate",
            label: "Pickup",
            render: (value: string, record: Reservation | undefined) => (
              <div className="leading-tight whitespace-nowrap">
                <div className="text-xs">
                  {record?.startDateDisplay || formatLondonDate(value)}
                </div>
                <div className="text-[11px] text-gray-400">
                  {record?.pickupTime || formatLondonTime(value)}
                </div>
              </div>
            ),
          },
          {
            key: "endDate",
            label: "Return",
            render: (value: string, record: Reservation | undefined) => (
              <div className="leading-tight whitespace-nowrap">
                <div className="text-xs">
                  {record?.endDateDisplay || formatLondonDate(value)}
                </div>
                <div className="text-[11px] text-gray-400">
                  {record?.returnTime || formatLondonTime(value)}
                </div>
              </div>
            ),
          },
          {
            key: "reservationType",
            label: "Type",
            render: (value: any) => {
              if (value === "Website") {
                return (
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30"
                    title="Website"
                  >
                    <FiGlobe className="text-sm" />
                  </span>
                );
              }

              if (value === "Office") {
                return (
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    title="Office"
                  >
                    <FiBriefcase className="text-sm" />
                  </span>
                );
              }

              return "-";
            },
          },
          {
            key: "user",
            label: "licence",
            render: (value: any) => {
              const hasFront = value?.licenceAttached?.front;
              const hasBack = value?.licenceAttached?.back;

              if (hasFront && hasBack) {
                return (
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400 border border-green-500/30"
                    title="Complete"
                  >
                    <FiCheck className="text-sm" />
                  </span>
                );
              }

              if (hasFront || hasBack) {
                return (
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    title="Partial"
                  >
                    <FiCheck className="text-sm" />
                  </span>
                );
              }

              return (
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 text-red-400 border border-red-500/30"
                  title="Missing"
                >
                  <FiX className="text-sm" />
                </span>
              );
            },
          },
          { key: "driverAge", label: "Driver Age" },
          
          {
            key: "status",
            label: "Status",
            render: (value: string) => (
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadgeClasses(value)}`}
              >
                {statusLabel(value, true)}
              </span>
            ),
          },
          {
            key: "_id",
            label: "view",
            render: (value: any, row: any) => (
              <button
                onClick={() => {
                  setSelectedReservationForDetails(row);
                  setDetailsModalOpen(true);
                }}
                className="p-1.5 tooltip hover:bg-[#fe9a00]/20 rounded-lg transition-colors text-[#fe9a00] hover:text-[#fe9a00]"
                title="View Details"
                data-tooltip="View Details"
              >
                <FiEye className="text-base" />
              </button>
            ),
          },
        ]}
        onEdit={handleViewDetails}
        onMutate={(mutate) => (mutateRef.current = mutate)}
        hideViewBtn={true}
        hiddenColumns={["driverAge"] as (keyof Reservation)[]}
      />
      {/* <DynamicTableView<Reservation>
        hideDelete={true}
        apiEndpoint="/api/reservations"
        filters={[
          { key: "name", label: "User", type: "select", options: users },
          { key: "category", label: "Category", type: "select", options: categories },
          { key: "startDate", label: "Start Date", type: "date" },
          { key: "endDate", label: "End Date", type: "date" },
          { key: "totalPrice", label: "Total Price", type: "text" },
        ]}
        title="Reservation"
        columns={[
          {
            key: "user",
            label: "User",
            render: (value: any) => value?.name || "-",
          },
          {
            key: "office",
            label: "Office",
            render: (value: any) => value?.name || "-",
          },
          {
            key: "category",
            label: "Category",
            render: (value: any) => value?.name || "-",
          },
          {
            key: "startDate",
            label: "Start Date",
            render: (value: string, record: any) =>
              record.startDateDisplay && record.pickupTime
                ? `${record.startDateDisplay} ${record.pickupTime}`
                : new Date(value).toLocaleString("en-GB", {
                    timeZone: "Europe/London",
                  }) || "-",
          },
          {
            key: "endDate",
            label: "End Date",
            render: (value: string, record: any) =>
              record.endDateDisplay && record.returnTime
                ? `${record.endDateDisplay} ${record.returnTime}`
                : new Date(value).toLocaleString("en-GB", {
                    timeZone: "Europe/London",
                  }) || "-",
          },
          { key: "totalPrice", label: "Total Price" },
          {
            key: "status",
            label: "Status",
            render: (value: string) => (
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClasses(value)}`}
              >
                {statusLabel(value, true)}
              </span>
            ),
          },
          { key: "driverAge", label: "Driver Age" },
        ]}
        onEdit={handleViewDetails}
        onMutate={(mutate) => (mutateRef.current = mutate)}
        hiddenColumns={["driverAge"] as (keyof Reservation)[]}
      /> */}

      {isDetailOpen && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2847] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b z-10 border-white/10 bg-[#1a2847]">
              <div className="min-w-0">
                <h2 className="text-2xl font-black text-white">
                  Reservation Details
                </h2>
                <p className="text-[#fe9a00] text-sm font-bold">
                  Order{" "}
                  {selectedReservation.reservationCode ||
                    selectedReservation._id}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printReservationReceipt(selectedReservation)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-[#fe9a00]/20 hover:bg-[#fe9a00]/30 text-[#fe9a00] rounded-lg transition-colors text-sm font-bold"
                >
                  <FiPrinter className="text-base" />
                  Print
                </button>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FiX className="text-white text-xl" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* User Information */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3">
                  User Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Name</p>
                    <p className="text-white font-semibold">
                      {selectedReservation.user?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Email</p>
                    <p className="text-white font-semibold">
                      {selectedReservation.user?.emaildata?.emailAddress || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Phone</p>
                    <p className="text-white font-semibold">
                      {selectedReservation.user?.phoneData?.phoneNumber || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Driver Age</p>
                    <p className="text-white font-semibold">
                      {selectedReservation.driverAge}
                    </p>
                  </div>
                </div>
              </div>

              {/* License Information */}
              {(selectedReservation.user?.licenceAttached?.front ||
                selectedReservation.user?.licenceAttached?.back) && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-3">
                    Driver licences
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedReservation.user?.licenceAttached?.front && (
                      <div>
                        <p className="text-gray-400 text-sm mb-2">Front Side</p>
                        <div className="relative">
                          <a
                            href={
                              selectedReservation.user.licenceAttached.front
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img
                              src={
                                selectedReservation.user.licenceAttached.front
                              }
                              alt="licences Front"
                              className="w-full h-32 object-cover rounded-lg border border-white/10 cursor-pointer hover:border-[#fe9a00]/50 transition-colors"
                            />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 hover:opacity-100">
                              <span className="text-white text-sm font-medium">
                                Click to view full size
                              </span>
                            </div>
                          </a>
                        </div>
                      </div>
                    )}
                    {selectedReservation.user?.licenceAttached?.back && (
                      <div>
                        <p className="text-gray-400 text-sm mb-2">Back Side</p>
                        <div className="relative">
                          <a
                            href={selectedReservation.user.licenceAttached.back}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img
                              src={
                                selectedReservation.user.licenceAttached.back
                              }
                              alt="licences Back"
                              className="w-full h-32 object-cover rounded-lg border border-white/10 cursor-pointer hover:border-[#fe9a00]/50 transition-colors"
                            />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 hover:opacity-100">
                              <span className="text-white text-sm font-medium">
                                Click to view full size
                              </span>
                            </div>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        selectedReservation.user?.licenceAttached?.front &&
                        selectedReservation.user?.licenceAttached?.back
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          selectedReservation.user?.licenceAttached?.front &&
                          selectedReservation.user?.licenceAttached?.back
                            ? "bg-green-400"
                            : "bg-yellow-400"
                        }`}
                      ></span>
                      {selectedReservation.user?.licenceAttached?.front &&
                      selectedReservation.user?.licenceAttached?.back
                        ? "Complete licences"
                        : "Partial licences"}
                    </span>
                  </div>
                </div>
              )}

              {/* Reservation Details */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3">
                  Reservation Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Office</p>
                    <p className="text-white font-semibold">
                      {selectedReservation.office?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Category</p>
                    <p className="text-white font-semibold">
                      {(selectedReservation as any).category?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Gear option</p>
                    <p className="text-white font-semibold">
                      {(selectedReservation as any).selectedGear || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Vehicle</p>
                    <p className="text-white font-semibold">
                      {(selectedReservation as any).vehicle?.title || "-"}
                      {(selectedReservation as any).vehicle?.keyNumber
                        ? ` (Key: ${(selectedReservation as any).vehicle.keyNumber})`
                        : ""}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">Start Date & Time</p>
                    <p className="text-white font-semibold">
                      {(selectedReservation as any).startDateDisplay &&
                      (selectedReservation as any).pickupTime
                        ? `${(selectedReservation as any).startDateDisplay} ${(selectedReservation as any).pickupTime}`
                        : new Date(
                            selectedReservation.startDate,
                          ).toLocaleString("en-GB", {
                            timeZone: "Europe/London",
                          })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">End Date & Time</p>
                    <p className="text-white font-semibold">
                      {(selectedReservation as any).endDateDisplay &&
                      (selectedReservation as any).returnTime
                        ? `${(selectedReservation as any).endDateDisplay} ${(selectedReservation as any).returnTime}`
                        : new Date(selectedReservation.endDate).toLocaleString(
                            "en-GB",
                            { timeZone: "Europe/London" },
                          )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total Price</p>
                    <p className="text-white font-semibold">
                      £{selectedReservation.totalPrice}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Duration</p>
                    <p className="text-white font-semibold">
                      {Math.ceil(
                        (new Date(selectedReservation.endDate).getTime() -
                          new Date(selectedReservation.startDate).getTime()) /
                          (1000 * 60 * 60),
                      )}{" "}
                      hours
                    </p>
                  </div>
                </div>
              </div>

              {/* Add-ons */}
              {selectedReservation.addOns &&
                selectedReservation.addOns.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold">Add-ons</h3>
                      <button
                        onClick={() => setShowAddOnsModal(true)}
                        className="text-[#fe9a00] text-xs hover:underline"
                      >
                        Edit Add-ons
                      </button>
                    </div>
                    <div className="space-y-2">
                      {selectedAddOns.map((item: any, idx: number) => {
                        const addon =
                          addOns.find((a) => a._id === item.addOn) ||
                          item.addOn;
                        let price = 0;
                        let tierInfo = "";

                        if (addon?.pricingType === "flat") {
                          price =
                            typeof addon.flatPrice === "object"
                              ? addon.flatPrice?.amount || 0
                              : addon.flatPrice || 0;
                        } else if (addon?.pricingType === "tiered") {
                          const tierIndex = item.selectedTierIndex ?? 0;
                          const tier = addon.tieredPrice?.tiers?.[tierIndex];
                          if (tier) {
                            price = tier.price;
                            tierInfo = ` (${tier.minDays}-${tier.maxDays} days)`;
                          }
                        }

                        return (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-sm"
                          >
                            <div className="flex flex-col">
                              <span className="text-white font-semibold">
                                {addon?.name || "Unknown"}
                              </span>
                              {addon?.description && (
                                <span className="text-gray-400 text-xs">
                                  {addon.description}
                                </span>
                              )}
                              {tierInfo && (
                                <span className="text-[#fe9a00] text-xs">
                                  {tierInfo}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-gray-400">
                                Qty: {item.quantity}
                              </span>
                              <span className="text-white font-semibold">
                                £{price}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Message */}
              {selectedReservation.messege && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-2">Message</h3>
                  <p className="text-gray-300 text-sm">
                    {selectedReservation.messege}
                  </p>
                </div>
              )}

              {/* Edit Dates */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3">
                  Edit Reservation
                </h3>
                <button
                  onClick={() => setIsEditDatesOpen(!isEditDatesOpen)}
                  className="w-full px-4 py-2 bg-[#fe9a00]/20 text-[#fe9a00] rounded-lg hover:bg-[#fe9a00]/30 transition-colors font-semibold text-sm"
                >
                  Edit Category, Dates & Times
                </button>

                {isEditDatesOpen && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="text-white text-sm font-semibold mb-2 block">
                        Category
                      </label>
                      <CustomSelect
                        options={categories}
                        value={editCategory}
                        onChange={setEditCategory}
                        placeholder="Select Category"
                      />
                    </div>

                    <div>
                      <label className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                        <FiCalendar className="text-[#fe9a00]" /> Dates
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowDateRange(!showDateRange)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm text-left focus:outline-none focus:border-[#fe9a00]"
                      >
                        {editDateRange[0].startDate && editDateRange[0].endDate
                          ? `${editDateRange[0].startDate.toLocaleDateString("en-GB")} - ${editDateRange[0].endDate.toLocaleDateString("en-GB")}`
                          : "Select Dates"}
                      </button>
                      {showDateRange && (
                        <div
                          className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center"
                          onClick={() => setShowDateRange(false)}
                        >
                          <div
                            className="bg-slate-800 backdrop-blur-xl border border-white/20 rounded-lg p-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DateRange
                              ranges={editDateRange}
                              onChange={(item) => {
                                const { startDate, endDate } = item.selection;
                                setEditDateRange([
                                  {
                                    startDate: startDate || new Date(),
                                    endDate: endDate || new Date(),
                                    key: "selection",
                                  },
                                ]);
                              }}
                              minDate={new Date()}
                              rangeColors={["#fbbf24"]}
                              disabledDates={
                                selectedReservation?.office
                                  ? (Array.from({ length: 365 }, (_, i) => {
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
                              className="w-full mt-3 px-4 py-2 bg-[#fe9a00] text-slate-900 font-semibold rounded-lg hover:bg-[#e68a00] transition-colors text-sm"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                          <FiClock className="text-[#fe9a00]" /> Start Time
                        </label>
                        {editDateRange[0].startDate &&
                          (() => {
                            const office = offices.find(
                              (o) =>
                                o._id ===
                                (selectedReservation.office as any)?._id,
                            );
                            const date = editDateRange[0].startDate;
                            const dayName = [
                              "sunday",
                              "monday",
                              "tuesday",
                              "wednesday",
                              "thursday",
                              "friday",
                              "saturday",
                            ][date.getDay()];
                            const specialDay = office
                              ? findSpecialDayForDate(office.specialDays, date)
                              : undefined;
                            let specialDayInfo = undefined;
                            let extensionTimes = undefined;

                            if (specialDay?.isOpen) {
                              specialDayInfo = {
                                reason: specialDay.reason || "Special Day",
                                price: specialDay.extraPrice || 0,
                              };
                            } else {
                              const workingDay = office?.workingTime?.find(
                                (w: any) => w.day === dayName && w.isOpen,
                              );
                              const pickupWindow = workingDay
                                ? getWorkingDayWindow(workingDay, "pickup")
                                : undefined;
                              extensionTimes = workingDay?.pickupExtension
                                ? {
                                    start: pickupTimeSlots[0],
                                    end: pickupTimeSlots[
                                      pickupTimeSlots.length - 1
                                    ],
                                    normalStart:
                                      pickupWindow?.startTime || "00:00",
                                    normalEnd:
                                      pickupWindow?.endTime || "23:59",
                                    price: workingDay.pickupExtension.flatPrice,
                                  }
                                : undefined;
                            }

                            return (
                              <TimeSelect
                                value={editTimes.startTime}
                                onChange={(time) =>
                                  setEditTimes((prev) => ({
                                    ...prev,
                                    startTime: time,
                                  }))
                                }
                                slots={pickupTimeSlots}
                                reservedSlots={startDateReservedSlots}
                                selectedDate={editDateRange[0].startDate}
                                isStartTime={true}
                                specialDayInfo={specialDayInfo}
                                extensionTimes={extensionTimes}
                              />
                            );
                          })()}
                      </div>
                      <div>
                        <label className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                          <FiClock className="text-[#fe9a00]" /> End Time
                        </label>
                        {editDateRange[0].endDate &&
                          (() => {
                            const office = offices.find(
                              (o) =>
                                o._id ===
                                (selectedReservation.office as any)?._id,
                            );
                            const date = editDateRange[0].endDate;
                            const dayName = [
                              "sunday",
                              "monday",
                              "tuesday",
                              "wednesday",
                              "thursday",
                              "friday",
                              "saturday",
                            ][date.getDay()];
                            const specialDay = office
                              ? findSpecialDayForDate(office.specialDays, date)
                              : undefined;
                            const pickupSpecialDay =
                              office && editDateRange[0].startDate
                                ? findSpecialDayForDate(
                                    office.specialDays,
                                    editDateRange[0].startDate,
                                  )
                                : undefined;
                            const isSamePricedSpecialDay = Boolean(
                              editDateRange[0].startDate &&
                              pickupSpecialDay?.isOpen &&
                              specialDay?.isOpen &&
                              pickupSpecialDay.month === specialDay.month &&
                              pickupSpecialDay.day === specialDay.day &&
                              isSameCalendarDate(
                                editDateRange[0].startDate,
                                date,
                              ),
                            );
                            let specialDayInfo = undefined;
                            let extensionTimes = undefined;

                            if (specialDay?.isOpen) {
                              specialDayInfo = {
                                reason: specialDay.reason || "Special Day",
                                price: isSamePricedSpecialDay
                                  ? 0
                                  : specialDay.extraPrice || 0,
                                alreadyCharged: isSamePricedSpecialDay,
                              };
                            } else {
                              const workingDay = office?.workingTime?.find(
                                (w: any) => w.day === dayName && w.isOpen,
                              );
                              const returnWindow = workingDay
                                ? getWorkingDayWindow(workingDay, "return")
                                : undefined;
                              extensionTimes = workingDay?.returnExtension
                                ? {
                                    start: returnTimeSlots[0],
                                    end: returnTimeSlots[
                                      returnTimeSlots.length - 1
                                    ],
                                    normalStart:
                                      returnWindow?.startTime || "00:00",
                                    normalEnd:
                                      returnWindow?.endTime || "23:59",
                                    price: workingDay.returnExtension.flatPrice,
                                  }
                                : undefined;
                            }

                            return (
                              <TimeSelect
                                value={editTimes.endTime}
                                onChange={(time) =>
                                  setEditTimes((prev) => ({
                                    ...prev,
                                    endTime: time,
                                  }))
                                }
                                slots={returnTimeSlots}
                                reservedSlots={endDateReservedSlots}
                                selectedDate={editDateRange[0].endDate}
                                isStartTime={false}
                                specialDayInfo={specialDayInfo}
                                extensionTimes={extensionTimes}
                              />
                            );
                          })()}
                      </div>
                    </div>

                    <div className="bg-amber-500/5 border border-amber-400/30 rounded-lg p-3 space-y-3">
                      <label className="flex items-center gap-2 text-amber-300 text-sm font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isManualExtension}
                          onChange={(e) =>
                            setIsManualExtension(e.target.checked)
                          }
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
                              value={pickupExtensionPrice}
                              onChange={(e) =>
                                setPickupExtensionPrice(
                                  parseFloat(e.target.value) || 0,
                                )
                              }
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
                              value={returnExtensionPrice}
                              onChange={(e) =>
                                setReturnExtensionPrice(
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-full bg-white/10 border border-white/20 rounded-lg text-white px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-white text-sm font-semibold mb-2 block">
                        Gear Type
                      </label>
                      {hasBothGearTypes ? (
                        <select
                          value={selectedGear}
                          onChange={(e) =>
                            setSelectedGear(
                              e.target.value as "manual" | "automatic",
                            )
                          }
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#fe9a00]"
                        >
                          <option value="manual">Manual</option>
                          <option value="automatic">
                            Automatic
                            {selectedCategory?.gear?.automaticExtraCost > 0 &&
                              ` (+£${selectedCategory?.gear.automaticExtraCost}/day)`}
                          </option>
                        </select>
                      ) : (
                        <div className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-400 text-sm">
                          {selectedGear === "automatic"
                            ? "Automatic"
                            : "Manual"}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-white text-sm font-semibold mb-2 block">
                        Add-ons
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddOnsModal(true)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm hover:bg-white/20 transition-colors"
                      >
                        {selectedAddOns.length > 0
                          ? `${selectedAddOns.length} add-on(s) selected`
                          : "Select Add-ons"}
                      </button>
                      {selectedAddOns.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {selectedAddOns.map((item: any, idx: number) => {
                            const addon = addOns.find(
                              (a) => a._id === item.addOn,
                            );
                            return (
                              <div
                                key={idx}
                                className="text-xs text-gray-400 flex justify-between"
                              >
                                <span>{addon?.name || "Unknown"}</span>
                                <span>x{item.quantity}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editPerInvoice}
                          onChange={(e) => setEditPerInvoice(e.target.checked)}
                          className="w-4 h-4 rounded border-sky-500/50 bg-sky-500/20 text-sky-500 focus:ring-sky-500 focus:ring-offset-0"
                        />
                        <span className="text-sky-200 text-sm font-semibold">
                          🧾 Per Invoice (no price now)
                        </span>
                      </label>
                      {editPerInvoice && (
                        <p className="text-sky-200/70 text-xs mt-1.5 leading-relaxed">
                          Total is saved as £0. The final price is entered when
                          you mark this reservation as completed.
                        </p>
                      )}
                    </div>

                    {!editPerInvoice && priceCalc && (
                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-purple-200 text-sm font-semibold">
                              Admin Pricing
                            </p>
                            <p className="text-purple-200/60 text-xs">
                              Change daily rate or override the final total
                            </p>
                          </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isManualPrice}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setIsManualPrice(checked);
                              if (checked) {
                                setIsTotalPriceOverride(false);
                                setManualTotalPrice("");
                              } else {
                                setManualPricePerDay("");
                                if (!isTotalPriceOverride)
                                  setManualPriceNote("");
                              }
                            }}
                            className="w-4 h-4 rounded border-purple-500/50 bg-purple-500/20 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                          />
                          <span className="text-white text-sm font-semibold">
                            Manual daily price
                          </span>
                        </label>

                        {isManualPrice && (
                          <div className="space-y-2">
                            <label className="text-purple-200 text-xs font-semibold block">
                              Price Per Day (£)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={manualPricePerDay}
                              onChange={(e) =>
                                setManualPricePerDay(e.target.value)
                              }
                              placeholder={`Default: £${priceCalc.pricePerDay.toFixed(2)}`}
                              className="w-full px-3 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400 placeholder:text-purple-200/40"
                            />
                          </div>
                        )}

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isTotalPriceOverride}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setIsTotalPriceOverride(checked);
                              if (checked) {
                                setIsManualPrice(false);
                                setManualPricePerDay("");
                                setManualTotalPrice(
                                  String(
                                    editFinalPrice ??
                                      priceCalc.totalPrice ??
                                      selectedReservation.totalPrice ??
                                      "",
                                  ),
                                );
                              } else {
                                setManualTotalPrice("");
                                if (!isManualPrice) setManualPriceNote("");
                              }
                            }}
                            className="w-4 h-4 rounded border-purple-500/50 bg-purple-500/20 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                          />
                          <span className="text-white text-sm font-semibold">
                            Override total price
                          </span>
                        </label>

                        {isTotalPriceOverride && (
                          <div className="space-y-2">
                            <label className="text-purple-200 text-xs font-semibold block">
                              Total Price (£)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={manualTotalPrice}
                              onChange={(e) =>
                                setManualTotalPrice(e.target.value)
                              }
                              placeholder={`Calculated: £${priceCalc.totalPrice.toFixed(2)}`}
                              className="w-full px-3 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400 placeholder:text-purple-200/40"
                            />
                          </div>
                        )}

                        {(isManualPrice || isTotalPriceOverride) && (
                          <div className="space-y-2">
                            <label className="text-purple-200 text-xs font-semibold block">
                              Note
                            </label>
                            <input
                              type="text"
                              value={manualPriceNote}
                              onChange={(e) =>
                                setManualPriceNote(e.target.value)
                              }
                              placeholder="Optional admin note"
                              className="w-full px-3 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400 placeholder:text-purple-200/40"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {editPerInvoice ? (
                      <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-3">
                        <p className="text-white text-sm font-semibold mb-1">
                          New Total Price
                        </p>
                        <p className="text-sky-300 text-2xl font-black">£0</p>
                        <p className="text-sky-200/70 text-xs mt-1">
                          Per Invoice — price entered on completion
                        </p>
                      </div>
                    ) : (
                      priceCalc && (
                        <div className="bg-[#fe9a00]/10 border border-[#fe9a00]/30 rounded-lg p-3">
                          <p className="text-white text-sm font-semibold mb-1">
                            New Total Price
                          </p>
                          <p className="text-[#fe9a00] text-2xl font-black">
                            £{editFinalPrice ?? priceCalc.totalPrice}
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            {editPriceBreakdown}
                          </p>
                          {(isManualPrice || isTotalPriceOverride) && (
                            <p className="text-purple-300 text-xs font-semibold mt-2">
                              {isTotalPriceOverride
                                ? "Total override active"
                                : "Manual daily price active"}
                            </p>
                          )}
                        </div>
                      )
                    )}

                    <button
                      onClick={handleDatesUpdate}
                      disabled={isSubmitting || !editCategory}
                      className="w-full px-4 py-2 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg transition-colors font-semibold text-sm disabled:opacity-50"
                    >
                      {isSubmitting ? "Updating..." : "Update Reservation"}
                    </button>
                  </div>
                )}
              </div>

              {/* Add-ons Modal */}
              {showAddOnsModal && (
                <AddOnsModal
                  addOns={addOns}
                  selectedAddOns={selectedAddOns}
                  onSave={setSelectedAddOns}
                  onClose={() => setShowAddOnsModal(false)}
                  rentalDays={priceCalc?.totalDays || 1}
                  selectedCategoryId={editCategory}
                />
              )}

              {/* Vehicle Assignment */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3">
                  Assign Vehicle
                </h3>
                <button
                  onClick={() => setIsEditOpen(!isEditOpen)}
                  className="w-full px-4 py-2 bg-[#fe9a00]/20 text-[#fe9a00] rounded-lg hover:bg-[#fe9a00]/30 transition-colors font-semibold text-sm"
                >
                  Edit Vehicle
                </button>

                {isEditOpen && (
                  <div className="mt-3 space-y-2">
                    <CustomSelect
                      options={filteredVehicles}
                      value={newVehicle}
                      onChange={setNewVehicle}
                      placeholder={
                        loadingVehicles
                          ? "Loading vehicles..."
                          : "Select Vehicle"
                      }
                    />
                    {!loadingVehicles && filteredVehicles.length === 0 && (
                      <p className="text-xs text-yellow-400">
                        No vehicles found for this category. Pick a different
                        category in &quot;Edit Reservation&quot; above, or add a
                        vehicle to this category.
                      </p>
                    )}
                    <button
                      onClick={async () => {
                        if (!newVehicle) return;
                        setIsSubmitting(true);
                        try {
                          // Update vehicle and status together
                          const res = await fetch(
                            `/api/reservations/${selectedReservation._id}`,
                            {
                              method: "PATCH",
                              headers: clientAuthHeaders(true),
                              body: JSON.stringify({
                                vehicle: newVehicle,
                                status: "delivered",
                              }),
                            },
                          );
                          const data = await res.json();
                          if (!data.success)
                            throw new Error(data.error || "Update failed");

                          // Set the assigned vehicle to unavailable
                          const vehicleRes = await fetch(
                            `/api/vehicles/${newVehicle}`,
                            {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ available: false }),
                            },
                          );
                          const vehicleData = await vehicleRes.json();
                          if (!vehicleData.success)
                            throw new Error(
                              vehicleData.error || "Vehicle update failed",
                            );

                          showToast.success("Vehicle assigned and collected!");
                          setIsEditOpen(false);
                          if (mutateRef.current) mutateRef.current();
                          setIsDetailOpen(false);
                        } catch (error) {
                          const message =
                            error instanceof Error
                              ? error.message
                              : "Unknown error";
                          showToast.error(message || "Update failed");
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      disabled={isSubmitting || !newVehicle}
                      className="w-full px-4 py-2 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg transition-colors font-semibold text-sm disabled:opacity-50"
                    >
                      {isSubmitting ? "Updating..." : "Assign & Collected"}
                    </button>
                  </div>
                )}
              </div>

              <ReservationOperationsPanel
                reservation={selectedReservation}
                onUpdated={(updated) => {
                  setSelectedReservation(updated);
                  void mutateRef.current?.();
                }}
              />

              {selectedReservation.deposit && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-white font-semibold">Deposit</h3>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-gray-200 capitalize">
                      {selectedReservation.deposit.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Option</p>
                      <p className="text-white font-semibold">
                        {selectedReservation.deposit.option
                          ? DEPOSIT_OPTION_LABELS[selectedReservation.deposit.option]
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Amount</p>
                      <p className="text-white font-semibold">
                        £{selectedReservation.deposit.amount ?? 0}
                      </p>
                    </div>
                  </div>
                  {selectedReservation.deposit.receiptUrl && (
                    <a
                      href={selectedReservation.deposit.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex text-sm font-semibold text-[#fe9a00] hover:underline"
                    >
                      View uploaded receipt
                    </a>
                  )}
                  {selectedReservation.deposit.failureReason && (
                    <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-200">
                      {selectedReservation.deposit.failureReason}
                    </p>
                  )}
                  {selectedReservation.deposit.status === "pending" && (
                    <div className="space-y-2 border-t border-white/10 pt-3">
                      <input
                        value={depositTransactionRef}
                        onChange={(event) =>
                          setDepositTransactionRef(event.target.value)
                        }
                        placeholder="Transaction reference (optional)"
                        className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[#fe9a00] focus:outline-none"
                      />
                      <textarea
                        value={depositFailureReason}
                        onChange={(event) =>
                          setDepositFailureReason(event.target.value)
                        }
                        placeholder="Rejection reason (required only when rejecting)"
                        rows={2}
                        className="w-full resize-none rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[#fe9a00] focus:outline-none"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={depositBusy}
                          onClick={() => handleDepositVerification("reject")}
                          className="rounded-lg bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/25 disabled:opacity-50"
                        >
                          Reject receipt
                        </button>
                        <button
                          type="button"
                          disabled={depositBusy}
                          onClick={() => handleDepositVerification("approve")}
                          className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
                        >
                          Verify payment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status Management */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">Current Status</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClasses(selectedReservation.status)}`}
                  >
                    {statusLabel(selectedReservation.status, true)}
                  </span>
                </div>
                {selectedReservation.status === "canceled" &&
                  selectedReservation.cancelReason && (
                    <div className="mb-3 rounded-lg border border-red-400/20 bg-red-500/10 p-3">
                      <p className="text-xs font-semibold text-red-200">
                        Cancel reason
                      </p>
                      <p className="mt-1 text-sm text-red-100 whitespace-pre-wrap">
                        {selectedReservation.cancelReason}
                      </p>
                    </div>
                  )}
                <button
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  className="w-full px-4 py-2 bg-[#fe9a00]/20 text-[#fe9a00] rounded-lg hover:bg-[#fe9a00]/30 transition-colors font-semibold text-sm"
                >
                  Change Status
                </button>

                {isStatusOpen && (
                  <div className="mt-3 space-y-2">
                    <CustomSelect
                      options={ADMIN_STATUS_OPTIONS}
                      value={newStatus}
                      onChange={setNewStatus}
                      placeholder="Select new status"
                    />
                    {newStatus === "canceled" && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                          Cancel reason
                        </label>
                        <textarea
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          rows={3}
                          placeholder="Add the reason for canceling this reservation"
                          className="w-full resize-none rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[#fe9a00] focus:outline-none"
                        />
                      </div>
                    )}
                    <button
                      onClick={() => handleStatusChange()}
                      disabled={isSubmitting || !newStatus}
                      className="w-full px-4 py-2 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg transition-colors font-semibold text-sm disabled:opacity-50"
                    >
                      {isSubmitting ? "Updating..." : "Update Status"}
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Per-Invoice final price modal (shown when completing a per-invoice reserve) */}
      {isPerInvoicePriceOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-[#1a2847] rounded-2xl max-w-md w-full border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                Enter final total price
              </h3>
              <button
                onClick={() => {
                  setIsPerInvoicePriceOpen(false);
                  setPerInvoicePrice("");
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiX className="text-white text-xl" />
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              This is a per-invoice reservation. Enter the final total before
              marking it as completed.
            </p>
            <label className="text-white text-sm font-semibold mb-2 block">
              Total Price (£)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              autoFocus
              value={perInvoicePrice}
              onChange={(e) => setPerInvoicePrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-white/10 border border-white/20 rounded-lg text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#fe9a00] mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsPerInvoicePriceOpen(false);
                  setPerInvoicePrice("");
                }}
                className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPerInvoicePrice}
                disabled={isSubmitting || !perInvoicePrice}
                className="flex-1 px-4 py-2.5 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg transition-colors font-semibold text-sm disabled:opacity-50"
              >
                {isSubmitting ? "Completing..." : "Save & Complete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Details Modal */}
      <ReservationDetailsModal
        reservation={selectedReservationForDetails}
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedReservationForDetails(null);
        }}
      />
    </div>
  );
}
