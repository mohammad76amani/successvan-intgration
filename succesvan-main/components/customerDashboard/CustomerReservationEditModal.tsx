"use client";

import { useState, useEffect, useMemo } from "react";
import { DateRange, Range } from "react-date-range";
import {
  FiX,
  FiCalendar,
  FiClock,
  FiPrinter,
  FiAlertCircle,
  FiTruck,
  FiSettings,
  FiPackage,
} from "react-icons/fi";
import { Reservation } from "@/types/type";
import { showToast } from "@/lib/toast";
import { usePriceCalculation } from "@/hooks/usePriceCalculation";
import { generateTimeSlots } from "@/utils/timeSlots";
import TimeSelect from "@/components/ui/TimeSelect";
import AddOnsModal from "@/components/global/AddOnsModal";
import { printReservationReceipt } from "@/lib/printReservation";
import {
  findSpecialDayForDate,
  getSpecialDayPickupWindow,
  getSpecialDayReturnWindow,
  isSameCalendarDate,
} from "@/lib/specialDaySchedule";
import {
  createLondonDateTime,
  formatDateForStorage,
  formatDateInputInLondon,
  formatTimeInLondon,
  parseStorageDate,
} from "@/lib/englandTime";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

interface CustomerReservationEditModalProps {
  reservation: Reservation | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const formatCurrency = (value: number | null | undefined) =>
  `£${Number(value || 0).toFixed(2)}`;

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

const getReservationDateDisplay = (
  reservation: Reservation,
  type: "start" | "end",
) => {
  const storedDate =
    type === "start"
      ? reservation.startDateDisplay
      : reservation.endDateDisplay;

  if (storedDate) return storedDate;

  const sourceDate =
    type === "start" ? reservation.startDate : reservation.endDate;

  return formatDateInputInLondon(sourceDate) || "-";
};

const getReservationTimeDisplay = (
  reservation: Reservation,
  type: "start" | "end",
) => {
  const storedTime =
    type === "start" ? reservation.pickupTime : reservation.returnTime;

  if (storedTime) return storedTime;

  const sourceDate =
    type === "start" ? reservation.startDate : reservation.endDate;

  return formatTimeInLondon(sourceDate) || "-";
};

export default function CustomerReservationEditModal({
  reservation,
  isOpen,
  onClose,
  onUpdate,
}: CustomerReservationEditModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDateRange, setShowDateRange] = useState(false);
  const [showAddOnsModal, setShowAddOnsModal] = useState(false);

  // Edit states
  const [editDateRange, setEditDateRange] = useState<Range[]>([
    {
      startDate: new Date(),
      endDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
      key: "selection",
    },
  ]);
  const [editTimes, setEditTimes] = useState({ startTime: "10:00", endTime: "10:00" });
  const [selectedGear, setSelectedGear] = useState<"manual" | "automatic" | "">("");
  const [selectedAddOns, setSelectedAddOns] = useState<
    { addOn: string; quantity: number; selectedTierIndex?: number }[]
  >([]);
  const [pickupExtensionPrice, setPickupExtensionPrice] = useState(0);
  const [returnExtensionPrice, setReturnExtensionPrice] = useState(0);
  const [gearExtraCost, setGearExtraCost] = useState(0);
  const [addOnsCost, setAddOnsCost] = useState(0);

  // Data states
  const [offices, setOffices] = useState<any[]>([]);
  const [addOns, setAddOns] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [startDateReservedSlots, setStartDateReservedSlots] = useState<any[]>([]);
  const [endDateReservedSlots, setEndDateReservedSlots] = useState<any[]>([]);

  const canEditReservation = reservation?.status === "pending";

  const selectedCategoryFromList = useMemo(() => {
    if (!reservation?.category) return null;
    const catId = typeof reservation.category === "string" 
      ? reservation.category 
      : reservation.category._id;
    return (
      categories.find((c) => c._id === catId) ||
      (typeof reservation.category === "object" ? reservation.category : null)
    );
  }, [reservation?.category, categories]);

  const hasBothGearTypes = useMemo(() => {
    if (!selectedCategoryFromList?.gear?.availableTypes) return false;
    return selectedCategoryFromList.gear.availableTypes.length > 1;
  }, [selectedCategoryFromList]);

  const pickupTimeSlots = useMemo(() => {
    if (!reservation?.office || !editDateRange[0].startDate) return [];
    const office = offices?.find(
      (o) => o._id === (reservation.office as any)?._id,
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
    ][date.getDay()] as any;

    const specialDay = findSpecialDayForDate(office.specialDays, date);
    let start = "00:00",
      end = "23:59";

    if (specialDay && specialDay.isOpen) {
      const pickupWindow = getSpecialDayPickupWindow(specialDay);
      start = pickupWindow.startTime;
      end = pickupWindow.endTime;
    } else {
      const workingDay = office.workingTime?.find(
        (w: any) => w.day === dayName && w.isOpen,
      );
      if (workingDay) {
        start = workingDay.startTime || "00:00";
        end = workingDay.endTime || "23:59";

        if (workingDay.pickupExtension) {
          const [startHour, startMin] = start.split(":").map(Number);
          const [endHour, endMin] = end.split(":").map(Number);
          const extendedStartMinutes = Math.max(
            0,
            startHour * 60 +
              startMin -
              workingDay.pickupExtension.hoursBefore * 60,
          );
          const extendedEndMinutes = Math.min(
            1439,
            endHour * 60 + endMin + workingDay.pickupExtension.hoursAfter * 60,
          );
          start = `${String(Math.floor(extendedStartMinutes / 60)).padStart(
            2,
            "0",
          )}:${String(extendedStartMinutes % 60).padStart(2, "0")}`;
          end = `${String(Math.floor(extendedEndMinutes / 60)).padStart(
            2,
            "0",
          )}:${String(extendedEndMinutes % 60).padStart(2, "0")}`;
        }
      }
    }

    return generateTimeSlots(start, end, 15);
  }, [reservation, editDateRange, offices]);

  const returnTimeSlots = useMemo(() => {
    if (!reservation?.office || !editDateRange[0].endDate) return [];
    const office = offices?.find(
      (o) => o._id === (reservation.office as any)?._id,
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
    ][date.getDay()] as any;

    const specialDay = findSpecialDayForDate(office.specialDays, date);
    let start = "00:00",
      end = "23:59";

    if (specialDay && specialDay.isOpen) {
      const returnWindow = getSpecialDayReturnWindow(specialDay);
      start = returnWindow.startTime;
      end = returnWindow.endTime;
    } else {
      const workingDay = office.workingTime?.find(
        (w: any) => w.day === dayName && w.isOpen,
      );
      if (workingDay) {
        start = workingDay.startTime || "00:00";
        end = workingDay.endTime || "23:59";

        if (start === end) {
          if (
            !workingDay.returnExtension ||
            (workingDay.returnExtension.hoursBefore === 0 &&
              workingDay.returnExtension.hoursAfter === 0)
          ) {
            return [];
          }
          const [startHour, startMin] = start.split(":").map(Number);
          const extendedStartMinutes = Math.max(
            0,
            startHour * 60 +
              startMin -
              workingDay.returnExtension.hoursBefore * 60,
          );
          const extendedEndMinutes = Math.min(
            1439,
            startHour * 60 +
              startMin +
              workingDay.returnExtension.hoursAfter * 60,
          );
          start = `${String(Math.floor(extendedStartMinutes / 60)).padStart(
            2,
            "0",
          )}:${String(extendedStartMinutes % 60).padStart(2, "0")}`;
          end = `${String(Math.floor(extendedEndMinutes / 60)).padStart(
            2,
            "0",
          )}:${String(extendedEndMinutes % 60).padStart(2, "0")}`;
        } else if (workingDay.returnExtension) {
          const [startHour, startMin] = start.split(":").map(Number);
          const [endHour, endMin] = end.split(":").map(Number);
          const extendedStartMinutes = Math.max(
            0,
            startHour * 60 +
              startMin -
              workingDay.returnExtension.hoursBefore * 60,
          );
          const extendedEndMinutes = Math.min(
            1439,
            endHour * 60 + endMin + workingDay.returnExtension.hoursAfter * 60,
          );
          start = `${String(Math.floor(extendedStartMinutes / 60)).padStart(
            2,
            "0",
          )}:${String(extendedStartMinutes % 60).padStart(2, "0")}`;
          end = `${String(Math.floor(extendedEndMinutes / 60)).padStart(
            2,
            "0",
          )}:${String(extendedEndMinutes % 60).padStart(2, "0")}`;
        }
      }
    }

    return generateTimeSlots(start, end, 15);
  }, [reservation, editDateRange, offices]);

  const isDateDisabled = useMemo(() => {
    return (date: Date): boolean => {
      if (!reservation?.office) return false;
      const office = offices.find(
        (o) => o._id === (reservation.office as any)?._id,
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
      if (specialDay && !specialDay.isOpen) return true;
      const workingDay = office.workingTime?.find(
        (w: any) => w.day === dayName,
      );
      if (workingDay && !workingDay.isOpen) return true;
      return false;
    };
  }, [reservation, offices]);

  const priceCalc = usePriceCalculation(
    editDateRange[0].startDate && editTimes.startTime
      ? createLondonDateTime(editDateRange[0].startDate, editTimes.startTime)
      : "",
    editDateRange[0].endDate && editTimes.endTime
      ? createLondonDateTime(editDateRange[0].endDate, editTimes.endTime)
      : "",
    selectedCategoryFromList?.pricingTiers || [],
    selectedCategoryFromList?.extrahoursRate || 0,
    pickupExtensionPrice,
    returnExtensionPrice,
    gearExtraCost,
    addOnsCost,
    selectedCategoryFromList?.selloffer || 0,
    [],
  );

  const selectedAddOnPriceDetails = useMemo(() => {
    const rentalDays = priceCalc?.totalDays || 1;

    return selectedAddOns.map((item: any) => {
      const addOnId =
        typeof item.addOn === "string" ? item.addOn : item.addOn?._id;
      const reservationAddOn = reservation?.addOns?.find((entry: any) => {
        const entryId =
          typeof entry.addOn === "string" ? entry.addOn : entry.addOn?._id;
        return entryId === addOnId;
      });
      const addon =
        addOns.find((a) => a._id === addOnId) ||
        (typeof item.addOn === "object" ? item.addOn : null) ||
        (typeof reservationAddOn?.addOn === "object"
          ? reservationAddOn.addOn
          : null);
      const quantity = item.quantity || 1;
      let unitPrice = 0;
      let totalPrice = 0;
      let pricingLabel = `Qty ${quantity}`;

      if (addon?.pricingType === "flat") {
        const flatPrice = addon.flatPrice;
        const amount =
          typeof flatPrice === "object"
            ? flatPrice?.amount || 0
            : flatPrice || 0;
        const isPerDay =
          typeof flatPrice === "object" ? flatPrice?.isPerDay || false : false;
        unitPrice = amount;
        totalPrice = amount * quantity * (isPerDay ? rentalDays : 1);
        pricingLabel = isPerDay
          ? `${quantity} × ${rentalDays}d × ${formatCurrency(amount)}`
          : `${quantity} × ${formatCurrency(amount)}`;
      } else if (addon?.pricingType === "tiered") {
        const tierIndex = item.selectedTierIndex ?? 0;
        const tier = addon.tieredPrice?.tiers?.[tierIndex];
        const amount = tier?.price || 0;
        const isPerDay = addon.tieredPrice?.isPerDay || false;
        unitPrice = amount;
        totalPrice = amount * quantity * (isPerDay ? rentalDays : 1);
        pricingLabel = isPerDay
          ? `${quantity} × ${rentalDays}d × ${formatCurrency(amount)}`
          : `${quantity} × ${formatCurrency(amount)}`;
      }

      return {
        addon,
        quantity,
        unitPrice,
        totalPrice,
        pricingLabel,
      };
    });
  }, [selectedAddOns, addOns, reservation?.addOns, priceCalc?.totalDays]);

  const selectedAddOnsTotal = useMemo(
    () =>
      selectedAddOnPriceDetails.reduce(
        (total, item) => total + item.totalPrice,
        0,
      ),
    [selectedAddOnPriceDetails],
  );

  // Initialize edit mode
  useEffect(() => {
    if (isOpen && reservation) {
      const startDate = getReservationDateForEdit(reservation, "start");
      const endDate = getReservationDateForEdit(reservation, "end");

      setEditDateRange([
        {
          startDate,
          endDate,
          key: "selection",
        },
      ]);
      setEditTimes({
        startTime: getReservationTimeDisplay(reservation, "start"),
        endTime: getReservationTimeDisplay(reservation, "end"),
      });
      setSelectedGear((reservation as any).selectedGear || "manual");
      setPickupExtensionPrice(reservation.pickupExtensionPrice || 0);
      setReturnExtensionPrice(reservation.returnExtensionPrice || 0);
      if (reservation.addOns && reservation.addOns.length > 0) {
        setSelectedAddOns(
          reservation.addOns.map((addon: any) => ({
            addOn:
              typeof addon.addOn === "string" ? addon.addOn : addon.addOn?._id,
            quantity: addon.quantity,
            selectedTierIndex: addon.selectedTierIndex,
          })),
        );
      } else {
        setSelectedAddOns([]);
      }
      setIsEditing(false);
    }
  }, [isOpen, reservation]);

  // Fetch offices, add-ons, categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [officesRes, addOnsRes, categoriesRes] = await Promise.all([
          fetch("/api/offices"),
          fetch("/api/addons?status=active"),
          fetch("/api/categories?status=active"),
        ]);
        const officesData = await officesRes.json();
        const addOnsData = await addOnsRes.json();
        const categoriesData = await categoriesRes.json();
        setOffices(officesData.data?.data || officesData.data || []);
        setAddOns(addOnsData.data?.data || addOnsData.data || []);
        setCategories(categoriesData.data?.data || categoriesData.data || []);
      } catch (error) {
        console.log("Failed to fetch data:", error);
      }
    };
    if (isOpen) fetchData();
  }, [isOpen]);

  // Fetch reserved slots for start date
  useEffect(() => {
    if (reservation?.office && editDateRange[0].startDate) {
      const date = editDateRange[0].startDate;
      const startDate = formatDateForStorage(date);
      fetch(
        `/api/reservations/by-office?office=${
          (reservation.office as any)._id
        }&startDate=${startDate}&type=start&excludeReservation=${reservation._id}`,
      )
        .then((res) => res.json())
        .then((data) =>
          setStartDateReservedSlots(data.data?.reservedSlots || []),
        )
        .catch((err) => console.log(err));
    }
  }, [reservation, editDateRange]);

  // Fetch reserved slots for end date
  useEffect(() => {
    if (reservation?.office && editDateRange[0].endDate) {
      const date = editDateRange[0].endDate;
      const endDate = formatDateForStorage(date);
      fetch(
        `/api/reservations/by-office?office=${
          (reservation.office as any)._id
        }&endDate=${endDate}&type=end&excludeReservation=${reservation._id}`,
      )
        .then((res) => res.json())
        .then((data) =>
          setEndDateReservedSlots(data.data?.reservedSlots || []),
        )
        .catch((err) => console.log(err));
    }
  }, [reservation, editDateRange]);

  // Calculate gear extra cost
  useEffect(() => {
    if (selectedGear === "automatic" && selectedCategoryFromList) {
      setGearExtraCost(selectedCategoryFromList.gear?.automaticExtraCost || 0);
    } else {
      setGearExtraCost(0);
    }
  }, [selectedGear, selectedCategoryFromList]);

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
            (isPerDay
              ? tier.price * (priceCalc?.totalDays || 1)
              : tier.price) *
              item.quantity
          );
        }
      }
      return total;
    }, 0);
    setAddOnsCost(cost);
  }, [selectedAddOns, priceCalc, addOns]);

  // Calculate pickup extension price
  useEffect(() => {
    if (
      !reservation?.office ||
      !editDateRange[0].startDate ||
      !editTimes.startTime
    ) {
      setPickupExtensionPrice(0);
      return;
    }
    const office = offices.find(
      (o) => o._id === (reservation.office as any)?._id,
    );
    if (!office) {
      setPickupExtensionPrice(0);
      return;
    }
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
    const workingDay = office.workingTime?.find(
      (w: any) => w.day === dayName && w.isOpen,
    );
    const specialDay = findSpecialDayForDate(office.specialDays, date);

    if (specialDay?.isOpen) {
      setPickupExtensionPrice(specialDay.extraPrice || 0);
    } else if (workingDay?.pickupExtension) {
      const [pickupHour, pickupMin] = editTimes.startTime
        .split(":")
        .map(Number);
      const [startHour, startMin] = (workingDay.startTime || "00:00")
        .split(":")
        .map(Number);
      const [endHour, endMin] = (workingDay.endTime || "23:59")
        .split(":")
        .map(Number);
      const pickupMinutes = pickupHour * 60 + pickupMin;
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      if (pickupMinutes < startMinutes || pickupMinutes > endMinutes) {
        setPickupExtensionPrice(workingDay.pickupExtension.flatPrice || 0);
      } else {
        setPickupExtensionPrice(0);
      }
    } else {
      setPickupExtensionPrice(0);
    }
  }, [reservation, editTimes.startTime, editDateRange, offices]);

  // Calculate return extension price
  useEffect(() => {
    if (
      !reservation?.office ||
      !editDateRange[0].endDate ||
      !editTimes.endTime
    ) {
      setReturnExtensionPrice(0);
      return;
    }
    const office = offices.find(
      (o) => o._id === (reservation.office as any)?._id,
    );
    if (!office) {
      setReturnExtensionPrice(0);
      return;
    }
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
    const workingDay = office.workingTime?.find(
      (w: any) => w.day === dayName && w.isOpen,
    );
    const returnSpecialDay = findSpecialDayForDate(office.specialDays, date);
    const pickupDate = editDateRange[0].startDate;
    const pickupSpecialDay = pickupDate
      ? findSpecialDayForDate(office.specialDays, pickupDate)
      : undefined;
    const isSamePricedSpecialDay = Boolean(
      pickupDate &&
        pickupSpecialDay?.isOpen &&
        returnSpecialDay?.isOpen &&
        pickupSpecialDay.month === returnSpecialDay.month &&
        pickupSpecialDay.day === returnSpecialDay.day &&
        isSameCalendarDate(pickupDate, date),
    );

    if (returnSpecialDay?.isOpen) {
      setReturnExtensionPrice(
        isSamePricedSpecialDay ? 0 : returnSpecialDay.extraPrice || 0,
      );
    } else if (workingDay?.returnExtension) {
      const [returnHour, returnMin] = editTimes.endTime.split(":").map(Number);
      const [startHour, startMin] = (workingDay.startTime || "00:00")
        .split(":")
        .map(Number);
      const [endHour, endMin] = (workingDay.endTime || "23:59")
        .split(":")
        .map(Number);
      const returnMinutes = returnHour * 60 + returnMin;
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      if (returnMinutes < startMinutes || returnMinutes > endMinutes) {
        setReturnExtensionPrice(workingDay.returnExtension.flatPrice || 0);
      } else {
        setReturnExtensionPrice(0);
      }
    } else {
      setReturnExtensionPrice(0);
    }
  }, [reservation, editTimes.endTime, editDateRange, offices]);

  const handleCancelReservation = async () => {
    if (!reservation) return;
    if (!canEditReservation) {
      showToast.error("Only pending reservations can be canceled here.");
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/reservations/${reservation._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "canceled", userEdited: true }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Cancel failed");

      showToast.success("Reservation canceled successfully!");
      onClose();
      onUpdate?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Cancel failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateReservation = async () => {
    if (
      !reservation ||
      !editDateRange[0].startDate ||
      !editDateRange[0].endDate
    )
      return;
    if (!canEditReservation) {
      showToast.error("Only pending reservations can be edited here.");
      setIsEditing(false);
      return;
    }
    setIsSubmitting(true);

    try {
      const startDate = editDateRange[0].startDate;
      const endDate = editDateRange[0].endDate;

      const res = await fetch(`/api/reservations/${reservation._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: createLondonDateTime(startDate, editTimes.startTime),
          endDate: createLondonDateTime(endDate, editTimes.endTime),
          startDateDisplay: formatDateForStorage(startDate),
          endDateDisplay: formatDateForStorage(endDate),
          pickupTime: editTimes.startTime,
          returnTime: editTimes.endTime,
          totalPrice: priceCalc?.totalPrice || reservation.totalPrice,
          addOns: selectedAddOns,
          selectedGear: selectedGear,
          pickupExtensionPrice,
          returnExtensionPrice,
          userEdited: true,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Update failed");

      showToast.success("Reservation updated successfully!");
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !reservation) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3">
        <div className="bg-[#1a2847] rounded-xl w-full max-w-5xl max-h-[96vh] overflow-y-auto border border-white/10 shadow-2xl scrollbar-thin">
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between px-4 py-2.5 sm:px-5 sm:py-3 border-b border-white/10 bg-[#1a2847]/95 backdrop-blur-sm z-10">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                {isEditing ? "Edit Reservation" : "Reservation Details"}
              </h2>
              <p className="text-gray-500 text-[10px] sm:text-xs truncate">
                {reservation._id}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 ml-2">
              {!isEditing && (
                <button
                  onClick={() => printReservationReceipt(reservation)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fe9a00]/20 hover:bg-[#fe9a00]/30 text-[#fe9a00] rounded-lg transition-colors text-xs font-bold"
                >
                  <FiPrinter className="text-sm" />
                  Print
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiX className="text-white text-lg" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4 space-y-3">
            {!isEditing ? (
              <>
                {/* View Mode */}
                {/* Reservation Details */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <h3 className="text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 mb-2.5">
                    <span className="w-0.5 h-4 bg-[#fe9a00] rounded-full"></span>
                    Reservation Information
                  </h3>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    <div>
                      <p className="text-gray-500 text-[10px] leading-none">Office</p>
                      <p className="text-white font-medium text-xs truncate">
                        {reservation.office?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] leading-none">Category</p>
                      <p className="text-white font-medium text-xs truncate">
                        {(reservation as any).category?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] leading-none">Gear Type</p>
                      <p className="text-white font-medium text-xs">
                        {(reservation as any).selectedGear || "Manual"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] leading-none">Status</p>
                      <p
                        className={`font-semibold text-xs ${
                          reservation.status === "confirmed"
                            ? "text-green-400"
                            : reservation.status === "pending"
                              ? "text-yellow-400"
                              : "text-red-400"
                        }`}
                      >
                        {reservation.status}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dates & Times */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <h3 className="text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 mb-2.5">
                    <span className="w-0.5 h-4 bg-[#fe9a00] rounded-full"></span>
                    Rental Period
                  </h3>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    <div>
                      <p className="text-gray-500 text-[10px] leading-none">Start Date</p>
                      <p className="text-white font-medium">
                        {getReservationDateDisplay(reservation, "start")}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] leading-none">End Date</p>
                      <p className="text-white font-medium">
                        {getReservationDateDisplay(reservation, "end")}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] leading-none">Pickup Time</p>
                      <p className="text-white font-medium">
                        {getReservationTimeDisplay(reservation, "start")}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] leading-none">Return Time</p>
                      <p className="text-white font-medium">
                        {getReservationTimeDisplay(reservation, "end")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Add-ons */}
                {selectedAddOnPriceDetails.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <h3 className="text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 mb-2">
                      <span className="w-0.5 h-4 bg-[#fe9a00] rounded-full"></span>
                      Add-ons
                    </h3>
                    <div className="space-y-1.5">
                      {selectedAddOnPriceDetails.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="text-white font-medium truncate block">
                              {item.addon?.name || "Unknown"}
                            </span>
                            <span className="text-gray-500 text-[10px]">
                              {item.pricingLabel}
                            </span>
                          </div>
                          <span className="text-gray-300 shrink-0">
                            {formatCurrency(item.totalPrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="bg-linear-to-br from-[#fe9a00]/15 to-[#fe9a00]/5 border border-[#fe9a00]/25 rounded-lg p-3">
                  <h3 className="text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 mb-3">
                    <span className="w-0.5 h-4 bg-[#fe9a00] rounded-full"></span>
                    Price Breakdown
                  </h3>

                  <div className="space-y-1">
                    {priceCalc ? (
                      <>
                        <div className="flex items-center justify-between gap-3 rounded bg-white/5 px-3 py-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="shrink-0 w-6 h-6 rounded bg-[#fe9a00]/20 flex items-center justify-center">
                              <FiCalendar className="text-[10px] text-[#fe9a00]" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-white font-medium text-xs leading-tight">
                                Base Rental
                              </p>
                              <p className="text-gray-500 text-[10px] leading-tight">
                                {priceCalc.totalDays}d ×{" "}
                                {formatCurrency(priceCalc.pricePerDay)}
                              </p>
                            </div>
                          </div>
                          <span className="text-white font-bold text-xs shrink-0">
                            {formatCurrency(
                              priceCalc.totalDays * priceCalc.pricePerDay,
                            )}
                          </span>
                        </div>

                        {priceCalc.extraHours > 0 && (
                          <div className="flex items-center justify-between gap-3 rounded bg-white/5 px-3 py-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="shrink-0 w-6 h-6 rounded bg-[#fe9a00]/20 flex items-center justify-center">
                                <FiClock className="text-[10px] text-[#fe9a00]" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-white font-medium text-xs leading-tight">
                                  Extra Hours
                                </p>
                                <p className="text-gray-500 text-[10px] leading-tight">
                                  {priceCalc.extraHours}h ×{" "}
                                  {formatCurrency(priceCalc.extraHoursRate)}
                                </p>
                              </div>
                            </div>
                            <span className="text-white font-bold text-xs shrink-0">
                              {formatCurrency(
                                priceCalc.extraHours * priceCalc.extraHoursRate,
                              )}
                            </span>
                          </div>
                        )}

                        {gearExtraCost > 0 && (
                          <div className="flex items-center justify-between gap-3 rounded bg-white/5 px-3 py-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="shrink-0 w-6 h-6 rounded bg-[#fe9a00]/20 flex items-center justify-center">
                                <FiSettings className="text-[10px] text-[#fe9a00]" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-white font-medium text-xs leading-tight">
                                  Automatic Gear
                                </p>
                                <p className="text-gray-500 text-[10px] leading-tight">
                                  {priceCalc.totalDays}d ×{" "}
                                  {formatCurrency(gearExtraCost)}
                                </p>
                              </div>
                            </div>
                            <span className="text-white font-bold text-xs shrink-0">
                              {formatCurrency(
                                gearExtraCost * priceCalc.totalDays,
                              )}
                            </span>
                          </div>
                        )}

                        {pickupExtensionPrice > 0 && (
                          <div className="flex items-center justify-between gap-3 rounded bg-white/5 px-3 py-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="shrink-0 w-6 h-6 rounded bg-[#fe9a00]/20 flex items-center justify-center">
                                <FiTruck className="text-[10px] text-[#fe9a00]" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-white font-medium text-xs leading-tight">
                                  Pickup Extension
                                </p>
                                <p className="text-gray-500 text-[10px] leading-tight">
                                  Outside standard hours
                                </p>
                              </div>
                            </div>
                            <span className="text-white font-bold text-xs shrink-0">
                              {formatCurrency(pickupExtensionPrice)}
                            </span>
                          </div>
                        )}

                        {returnExtensionPrice > 0 && (
                          <div className="flex items-center justify-between gap-3 rounded bg-white/5 px-3 py-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="shrink-0 w-6 h-6 rounded bg-[#fe9a00]/20 flex items-center justify-center">
                                <FiTruck className="text-[10px] text-[#fe9a00]" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-white font-medium text-xs leading-tight">
                                  Return Extension
                                </p>
                                <p className="text-gray-500 text-[10px] leading-tight">
                                  Outside standard hours
                                </p>
                              </div>
                            </div>
                            <span className="text-white font-bold text-xs shrink-0">
                              {formatCurrency(returnExtensionPrice)}
                            </span>
                          </div>
                        )}

                        {selectedAddOnPriceDetails.length > 0 && (
                          <div className="rounded bg-white/5 overflow-hidden">
                            <div className="flex items-center justify-between gap-3 px-3 py-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="shrink-0 w-6 h-6 rounded bg-[#fe9a00]/20 flex items-center justify-center">
                                  <FiPackage className="text-[10px] text-[#fe9a00]" />
                                </span>
                                <div className="min-w-0">
                                  <p className="text-white font-medium text-xs leading-tight">
                                    Add-ons
                                  </p>
                                  <p className="text-gray-500 text-[10px] leading-tight">
                                    {selectedAddOnPriceDetails.length} item
                                    {selectedAddOnPriceDetails.length !== 1
                                      ? "s"
                                      : ""}
                                  </p>
                                </div>
                              </div>
                              <span className="text-white font-bold text-xs shrink-0">
                                {formatCurrency(selectedAddOnsTotal)}
                              </span>
                            </div>
                            <div className="border-t border-white/10 px-3 py-1 space-y-0.5">
                              {selectedAddOnPriceDetails.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between gap-2 pl-8 text-[10px]"
                                >
                                  <span className="text-gray-400 truncate">
                                    {item.addon?.name || "Unknown"} ×
                                    {item.quantity}
                                  </span>
                                  <span className="text-gray-300 font-medium shrink-0">
                                    {formatCurrency(item.totalPrice)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="rounded bg-white/5 px-3 py-2 text-xs text-gray-400">
                        Pricing details are loading. The saved total is shown
                        below.
                      </p>
                    )}

                    <div className="mt-3 pt-3 border-t border-[#fe9a00]/30 flex items-center justify-between gap-3">
                      <span className="text-white font-bold text-sm">
                        Saved Total
                      </span>
                      <span className="text-[#fe9a00] text-2xl font-black">
                        {formatCurrency(reservation.totalPrice)}
                      </span>
                    </div>

                    {priceCalc &&
                      Math.abs(priceCalc.totalPrice - reservation.totalPrice) >
                        0.01 && (
                        <p className="text-gray-500 text-[10px] leading-relaxed">
                          Saved total may include admin pricing, discounts, or
                          legacy adjustments.
                        </p>
                      )}
                  </div>
                </div>

                {/* Edit Button */}
                {canEditReservation ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full px-4 py-3 bg-[#fe9a00]/20 hover:bg-[#fe9a00]/30 text-[#fe9a00] rounded-lg transition-colors font-semibold text-sm"
                  >
                    Edit Dates, Times & Add-ons
                  </button>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-start gap-2">
                    <FiAlertCircle className="text-gray-400 text-sm shrink-0 mt-0.5" />
                    <p className="text-gray-400 text-xs">
                      This reservation is {reservation.status}, so it can only
                      be viewed from the customer dashboard.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Edit Mode */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
                  <FiAlertCircle className="text-yellow-500 text-sm shrink-0 mt-0.5" />
                  <p className="text-yellow-400 text-xs">
                    You can edit dates, times, and add-ons, but the vehicle category cannot be changed.
                  </p>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="text-white text-xs font-semibold mb-2 flex items-center gap-2">
                    <FiCalendar className="text-[#fe9a00]" /> Dates
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDateRange(!showDateRange)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs text-left focus:outline-none focus:border-[#fe9a00]"
                  >
                    {editDateRange[0].startDate && editDateRange[0].endDate
                      ? `${editDateRange[0].startDate.toLocaleDateString("en-GB")} - ${editDateRange[0].endDate.toLocaleDateString("en-GB")}`
                      : "Select Dates"}
                  </button>
                  {showDateRange && (
                    <div
                      className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4"
                      onClick={() => setShowDateRange(false)}
                    >
                      <div
                        className="bg-slate-800 backdrop-blur-xl border border-white/20 rounded-lg p-4 max-w-sm"
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
                            reservation?.office
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
                          className="w-full mt-3 px-4 py-2 bg-[#fe9a00] text-slate-900 font-semibold rounded-lg hover:bg-[#e68a00] transition-colors text-xs"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-white text-xs font-semibold mb-2 flex items-center gap-2">
                      <FiClock className="text-[#fe9a00]" /> Start Time
                    </label>
                    {editDateRange[0].startDate && (
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
                      />
                    )}
                  </div>
                  <div>
                    <label className="text-white text-xs font-semibold mb-2 flex items-center gap-2">
                      <FiClock className="text-[#fe9a00]" /> End Time
                    </label>
                    {editDateRange[0].endDate && (
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
                      />
                    )}
                  </div>
                </div>

                {/* Gear Selection */}
                <div>
                  <label className="text-white text-xs font-semibold mb-2 block">
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
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:outline-none focus:border-[#fe9a00]"
                    >
                      <option value="manual">Manual</option>
                      <option value="automatic">
                        Automatic
                        {selectedCategoryFromList?.gear?.automaticExtraCost >
                          0 &&
                          ` (+£${selectedCategoryFromList.gear.automaticExtraCost}/day)`}
                      </option>
                    </select>
                  ) : (
                    <div className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-400 text-xs">
                      {selectedGear === "automatic" ? "Automatic" : "Manual"}
                    </div>
                  )}
                </div>

                {/* Add-ons */}
                <div>
                  <label className="text-white text-xs font-semibold mb-2 block">
                    Add-ons
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddOnsModal(true)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs hover:bg-white/20 transition-colors"
                  >
                    {selectedAddOns.length > 0
                      ? `${selectedAddOns.length} add-on(s) selected`
                      : "Select Add-ons"}
                  </button>
                  {selectedAddOns.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {selectedAddOns.map((item: any, idx: number) => {
                        const addon = addOns.find((a) => a._id === item.addOn);
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

                {/* New Price Preview */}
                {priceCalc && (
                  <div className="bg-[#fe9a00]/10 border border-[#fe9a00]/30 rounded-lg p-3">
                    <p className="text-white text-xs font-semibold mb-1">
                      New Total Price
                    </p>
                    <p className="text-[#fe9a00] text-xl font-black">
                      £{priceCalc.totalPrice}
                    </p>
                    <p className="text-gray-400 text-[10px] mt-1">
                      {priceCalc.breakdown}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleUpdateReservation}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg transition-colors font-semibold text-xs disabled:opacity-50"
                  >
                    {isSubmitting ? "Updating..." : "Save Changes"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-semibold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* Cancel Reservation Button - Always show */}
            {!isEditing && canEditReservation && (
              <button
                onClick={handleCancelReservation}
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors font-semibold text-xs disabled:opacity-50 mt-4"
              >
                {isSubmitting ? "Canceling..." : "Cancel Reservation"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add-ons Modal */}
      {showAddOnsModal && (
        <AddOnsModal
          addOns={addOns}
          selectedAddOns={selectedAddOns}
          onSave={setSelectedAddOns}
          onClose={() => setShowAddOnsModal(false)}
          rentalDays={priceCalc?.totalDays || 1}
        />
      )}
    </>
  );
}
