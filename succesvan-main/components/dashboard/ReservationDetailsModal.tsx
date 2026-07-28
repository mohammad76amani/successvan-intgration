"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FiX,
  FiEdit3,
  FiClock,
  FiCalendar,
  FiTruck,
  FiSettings,
  FiStar,
  FiPackage,
  FiPrinter,
} from "react-icons/fi";
import { Reservation } from "@/types/type";
import { usePriceCalculation } from "@/hooks/usePriceCalculation";
import {
  printReservationReceipt,
} from "@/lib/printReservation";

const formatCurrency = (value: unknown) => {
  const amount = Number(value);
  return `£${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"}`;
};

interface ReservationDetailsModalProps {
  reservation: Reservation | null;
  isOpen: boolean;
  onClose: () => void;
  layerClassName?: string;
}

export default function ReservationDetailsModal({
  reservation,
  isOpen,
  onClose,
  layerClassName = "z-50",
}: ReservationDetailsModalProps) {
  const [addOns, setAddOns] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const categoryData = useMemo(() => {
    return reservation?.category as any;
  }, [reservation?.category]);

  const startDateTimeString = reservation?.startDate
    ? new Date(reservation.startDate).toISOString()
    : "";
  const endDateTimeString = reservation?.endDate
    ? new Date(reservation.endDate).toISOString()
    : "";

  const gearExtraCost = useMemo(() => {
    if (
      (reservation as any)?.selectedGear === "automatic" &&
      categoryData?.gear?.automaticExtraCost
    ) {
      return categoryData.gear.automaticExtraCost;
    }
    return 0;
  }, [categoryData, reservation]);

  const pickupExtensionPrice = Number(
    (reservation as any)?.pickupExtensionPrice || 0,
  );
  const returnExtensionPrice = Number(
    (reservation as any)?.returnExtensionPrice || 0,
  );

  const priceCalc = usePriceCalculation(
    startDateTimeString,
    endDateTimeString,
    categoryData?.pricingTiers || [],
    categoryData?.extrahoursRate || 0,
    pickupExtensionPrice,
    returnExtensionPrice,
    gearExtraCost,
    0,
    categoryData?.selloffer || 0,
    [],
  );

  const isManualPrice = (reservation as any)?.isManualPrice;
  const manualPricePerDay = (reservation as any)?.manualPricePerDay || 0;
  const manualPriceNote = (reservation as any)?.manualPriceNote;
  const manualDailyRate = Number(manualPricePerDay || 0);
  const isManualDailyPrice = Boolean(isManualPrice && manualDailyRate > 0);
  const isManualTotalOverride = Boolean(isManualPrice && !isManualDailyPrice);
  const currentDailyRate = priceCalc
    ? isManualDailyPrice
      ? manualDailyRate
      : priceCalc.pricePerDay
    : 0;
  const baseRentalPrice = priceCalc
    ? priceCalc.totalDays * currentDailyRate
    : 0;
  const extraHoursPrice = priceCalc
    ? priceCalc.extraHours * priceCalc.extraHoursRate
    : 0;
  const gearTotalPrice = priceCalc ? gearExtraCost * priceCalc.totalDays : 0;
  const specialDaysPrice = Number(priceCalc?.specialDaysPrice || 0);
  const reservationTotalPrice = Number((reservation as any)?.totalPrice || 0);
  const isPerInvoice = Boolean((reservation as any)?.perInvoice);
  const isPerInvoicePending = isPerInvoice && reservationTotalPrice <= 0;

  useEffect(() => {
    Promise.all([
      fetch("/api/addons?status=active").then((res) => res.json()),
      fetch("/api/categories").then((res) => res.json()),
    ])
      .then(([addOnsData, categoriesData]) => {
        const addonsArray = addOnsData.data?.data || addOnsData.data || [];
        setAddOns(Array.isArray(addonsArray) ? addonsArray : []);
        setCategories(categoriesData.data || []);
      })
      .catch((err) => console.log(err));
  }, []);

  const getAddOnPrice = (item: any) => {
    const storedTotal = Number(item.totalPrice);
    if (Number.isFinite(storedTotal) && storedTotal > 0) {
      return storedTotal;
    }

    const addon = item.addOn || addOns.find((a) => a._id === item.addOn);
    if (!addon) return 0;

    const quantity = Number(item.quantity || 1);
    const rentalDays = priceCalc?.totalDays || 1;

    if (addon.pricingType === "flat") {
      const amount =
        typeof addon.flatPrice === "object"
          ? Number(addon.flatPrice?.amount || 0)
          : Number(addon.flatPrice || 0);
      const isPerDay =
        typeof addon.flatPrice === "object" && addon.flatPrice?.isPerDay;

      return (isPerDay ? amount * rentalDays : amount) * quantity;
    }

    if (addon.pricingType === "tiered") {
      const tierIndex = item.selectedTierIndex ?? 0;
      const tier = addon.tieredPrice?.tiers?.[tierIndex];
      const amount = Number(tier?.price || 0);
      const isPerDay = Boolean(addon.tieredPrice?.isPerDay);

      return (isPerDay ? amount * rentalDays : amount) * quantity;
    }

    return 0;
  };

  const totalAddOnsPrice =
    reservation?.addOns?.reduce((sum, item: any) => {
      return sum + getAddOnPrice(item);
    }, 0) || 0;

  const priceSummaryText = (() => {
    if (!priceCalc) return "";

    if (isManualTotalOverride) {
      return `Admin total override: ${formatCurrency(reservationTotalPrice)}`;
    }

    const parts: string[] = [
      `${priceCalc.totalDays} day${
        priceCalc.totalDays !== 1 ? "s" : ""
      } × ${formatCurrency(currentDailyRate)}/day`,
    ];

    if (priceCalc.extraHours > 0) {
      parts.push(
        `${priceCalc.extraHours}h × ${formatCurrency(
          priceCalc.extraHoursRate,
        )}/hr`,
      );
    }

    if (pickupExtensionPrice > 0) {
      parts.push(
        `pickup extension ${formatCurrency(pickupExtensionPrice)} - either out of working time or weekend time`,
      );
    }

    if (returnExtensionPrice > 0) {
      parts.push(
        `return extension ${formatCurrency(returnExtensionPrice)} - either out of working time or weekend time`,
      );
    }

    if (gearExtraCost > 0) {
      parts.push(
        `${priceCalc.totalDays} day${
          priceCalc.totalDays !== 1 ? "s" : ""
        } × ${formatCurrency(gearExtraCost)} gear`,
      );
    }

    if (totalAddOnsPrice > 0) {
      parts.push(`add-ons ${formatCurrency(totalAddOnsPrice)}`);
    }

    if (specialDaysPrice > 0) {
      parts.push(`special days ${formatCurrency(specialDaysPrice)}`);
    }

    return `${parts.join(" + ")}${
      isManualDailyPrice ? " (Manual daily price)" : ""
    }`;
  })();

  if (!isOpen || !reservation) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm ${layerClassName}`}
        onClick={onClose}
      />
      <div className={`fixed inset-0 ${layerClassName} flex items-center justify-center p-2 sm:p-3`}>
        <div className="bg-[#1a2847] rounded-xl w-full max-w-5xl max-h-[96vh] overflow-y-auto border border-white/10 shadow-2xl scrollbar-thin">
          {/* Header - Compact */}
          <div className="sticky top-0 flex items-center justify-between px-4 py-2.5 sm:px-5 sm:py-3 border-b border-white/10 bg-[#1a2847]/95 backdrop-blur-sm z-10">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                Reservation Details
              </h2>
              <p className="text-[#fe9a00] text-[11px] sm:text-sm font-bold leading-tight">
                Order {reservation.reservationCode || reservation._id}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 ml-2">
           
    
              <button
                onClick={() => printReservationReceipt(reservation)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fe9a00]/20 hover:bg-[#fe9a00]/30 text-[#fe9a00] rounded-lg transition-colors text-xs font-bold"
              >
                <FiPrinter className="text-sm" />
                Print
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiX className="text-white text-lg" />
              </button>
            </div>
          </div>

          {/* Content - Dense layout */}
          <div className="p-3 sm:p-4 space-y-3">
            {/* Top Row: Customer + Rental Info side by side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Customer Information */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <h3 className="text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 mb-2.5">
                  <span className="w-0.5 h-4 bg-[#fe9a00] rounded-full"></span>
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  <div>
                    <p className="text-gray-500 text-[10px] leading-none">
                      Name
                    </p>
                    <p className="text-white font-medium text-xs truncate">
                      {reservation.user?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] leading-none">
                      Phone
                    </p>
                    <p className="text-white font-medium text-xs truncate">
                      {reservation.user?.phoneData?.phoneNumber || "-"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 text-[10px] leading-none">
                      Email
                    </p>
                    <p className="text-white font-medium text-xs truncate">
                      {reservation.user?.emaildata?.emailAddress || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] leading-none">
                      Age
                    </p>
                    <p className="text-white font-medium text-xs">
                      {reservation.driverAge}y
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] leading-none">
                      City
                    </p>
                    <p className="text-white font-medium text-xs truncate">
                      {(reservation.user as any)?.city || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] leading-none">
                      Address
                    </p>
                    <p className="text-white font-medium text-xs truncate">
                      {(reservation.user as any)?.address || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] leading-none">
                      Postal
                    </p>
                    <p className="text-white font-medium text-xs truncate">
                      {(reservation.user as any)?.postalCode || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rental Information */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <h3 className="text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 mb-2.5">
                  <span className="w-0.5 h-4 bg-[#fe9a00] rounded-full"></span>
                  Rental Information
                </h3>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  <div>
                    <p className="text-gray-500 text-[10px] leading-none">
                      Office
                    </p>
                    <p className="text-white font-medium text-xs truncate">
                      {reservation.office?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] leading-none">
                      Category
                    </p>
                    <p className="text-white font-medium text-xs truncate">
                      {(reservation.category as any)?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] leading-none">
                      Vehicle
                    </p>
                    <p className="text-white font-medium text-xs truncate">
                      {(reservation.vehicle as any)?.title || "-"}
                      {(reservation.vehicle as any)?.keyNumber
                        ? ` (Key: ${(reservation.vehicle as any).keyNumber})`
                        : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] leading-none">
                      Gear
                    </p>
                    <p className="text-white font-medium text-xs capitalize">
                      {(reservation as any).selectedGear || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] leading-none">
                      Type
                    </p>
                    <p className="text-white font-medium text-xs capitalize">
                      {(reservation as any).reservationType || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] leading-none">
                      Status
                    </p>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        reservation.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : reservation.status === "confirmed"
                            ? "bg-blue-500/20 text-blue-400"
                            : reservation.status === "delivered"
                              ? "bg-purple-500/20 text-purple-400"
                              : reservation.status === "completed"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : reservation.status === "canceled"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {reservation.status === "delivered"
                        ? "Collected"
                        : reservation.status}
                    </span>
                  </div>
                  {reservation.status === "canceled" &&
                    reservation.cancelReason && (
                      <div className="col-span-2 rounded border border-red-400/20 bg-red-500/10 p-2">
                        <p className="text-red-200 text-[10px] font-bold leading-none">
                          Cancel reason
                        </p>
                        <p className="mt-1 text-red-100 text-xs leading-relaxed whitespace-pre-wrap">
                          {reservation.cancelReason}
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Middle Row: Dates + License side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Dates & Times - Compact */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <h3 className="text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 mb-2.5">
                  <span className="w-0.5 h-4 bg-[#fe9a00] rounded-full"></span>
                  Rental Period
                </h3>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  <div>
                    <p className="text-gray-500 text-[10px] leading-none">
                      Pickup
                    </p>
                    <p className="text-white font-medium text-xs">
                      {reservation.startDateDisplay && reservation.pickupTime
                        ? `${reservation.startDateDisplay} ${reservation.pickupTime}`
                        : new Date(reservation.startDate).toLocaleString("en-GB", {
                            timeZone: "Europe/London",
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] leading-none">
                      Return
                    </p>
                    <p className="text-white font-medium text-xs">
                      {reservation.endDateDisplay && reservation.returnTime
                        ? `${reservation.endDateDisplay} ${reservation.returnTime}`
                        : new Date(reservation.endDate).toLocaleString("en-GB", {
                            timeZone: "Europe/London",
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] leading-none">
                      Duration
                    </p>
                    <p className="text-white font-medium text-xs">
                      {priceCalc?.totalDays || 0}d{" "}
                      {priceCalc?.extraHours || 0 > 0
                        ? `+ ${priceCalc?.extraHours || 0}h`
                        : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] leading-none">
                      Total Hours
                    </p>
                    <p className="text-white font-medium text-xs">
                      {priceCalc?.totalHours || 0}h
                    </p>
                  </div>
                </div>
              </div>

              {/* License Information - Compact */}
              {reservation.user?.licenceAttached?.front ||
              reservation.user?.licenceAttached?.back ? (
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <h3 className="text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 mb-2.5">
                    <span className="w-0.5 h-4 bg-[#fe9a00] rounded-full"></span>
                    Driver Licence
                    <span
                      className={`ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                        reservation.user?.licenceAttached?.front &&
                        reservation.user?.licenceAttached?.back
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {reservation.user?.licenceAttached?.front &&
                      reservation.user?.licenceAttached?.back
                        ? "Complete"
                        : "Partial"}
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {reservation.user?.licenceAttached?.front && (
                      <a
                        href={reservation.user.licenceAttached.front}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block"
                      >
                        <img
                          src={reservation.user.licenceAttached.front}
                          alt="Licence Front"
                          className="w-full h-20 sm:h-24 object-cover rounded border border-white/10 group-hover:border-[#fe9a00]/50 transition-colors"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="text-white text-[10px] font-medium">
                            View
                          </span>
                        </div>
                        <p className="text-gray-500 text-[9px] text-center mt-0.5">
                          Front
                        </p>
                      </a>
                    )}
                    {reservation.user?.licenceAttached?.back && (
                      <a
                        href={reservation.user.licenceAttached.back}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block"
                      >
                        <img
                          src={reservation.user.licenceAttached.back}
                          alt="Licence Back"
                          className="w-full h-20 sm:h-24 object-cover rounded border border-white/10 group-hover:border-[#fe9a00]/50 transition-colors"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="text-white text-[10px] font-medium">
                            View
                          </span>
                        </div>
                        <p className="text-gray-500 text-[9px] text-center mt-0.5">
                          Back
                        </p>
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                /* Message - placed here if no license to fill the grid slot */
                reservation.messege && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <h3 className="text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 mb-2">
                      <span className="w-0.5 h-4 bg-[#fe9a00] rounded-full"></span>
                      Customer Message
                    </h3>
                    <p className="text-gray-300 text-xs leading-relaxed bg-black/30 p-2 rounded">
                      {reservation.messege}
                    </p>
                  </div>
                )
              )}
            </div>

            {/* Price Breakdown - Full width */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-white font-bold text-xs sm:text-sm flex items-center gap-1.5">
                  <span className="w-0.5 h-4 bg-[#fe9a00] rounded-full"></span>
                  Price Breakdown
                </h3>
                {(isManualDailyPrice || isManualTotalOverride) && (
                  <span className="inline-flex items-center rounded-full border border-purple-400/30 bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-200">
                    {isManualTotalOverride ? "Total override" : "Manual daily"}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3">
                <div className="space-y-2">
                  {priceCalc && (
                    <>
                      <div
                        className={`rounded-lg border p-3 ${
                          isManualDailyPrice
                            ? "bg-blue-500/10 border-blue-400/20"
                            : "bg-black/20 border-white/10"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div
                              className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                                isManualDailyPrice
                                  ? "bg-blue-500/20"
                                  : "bg-[#fe9a00]/20"
                              }`}
                            >
                              {isManualDailyPrice ? (
                                <FiEdit3 className="text-sm text-blue-300" />
                              ) : (
                                <FiCalendar className="text-sm text-[#fe9a00]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-white font-semibold text-xs leading-tight">
                                  Base Rental
                                </p>
                                {isManualDailyPrice && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-500/20 text-blue-200 border border-blue-400/30">
                                    Manual
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-400 text-[11px] leading-snug mt-0.5">
                                {priceCalc.totalDays} day
                                {priceCalc.totalDays !== 1 ? "s" : ""} ×{" "}
                                {formatCurrency(currentDailyRate)}/day
                                {isManualDailyPrice && (
                                  <span className="text-blue-300/70 ml-1">
                                    standard {formatCurrency(priceCalc.pricePerDay)}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <span className="text-white font-bold text-sm shrink-0">
                            {formatCurrency(baseRentalPrice)}
                          </span>
                        </div>
                      </div>

                      {priceCalc.extraHours > 0 && (
                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <div className="shrink-0 w-8 h-8 rounded-lg bg-[#fe9a00]/20 flex items-center justify-center">
                                <FiClock className="text-sm text-[#fe9a00]" />
                              </div>
                              <div>
                                <p className="text-white font-semibold text-xs leading-tight">
                                  Extra Hours
                                </p>
                                <p className="text-gray-400 text-[11px] leading-snug mt-0.5">
                                  {priceCalc.extraHours}h ×{" "}
                                  {formatCurrency(priceCalc.extraHoursRate)}/hr
                                </p>
                              </div>
                            </div>
                            <span className="text-white font-bold text-sm shrink-0">
                              {formatCurrency(extraHoursPrice)}
                            </span>
                          </div>
                        </div>
                      )}

                      {gearExtraCost > 0 && (
                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <div className="shrink-0 w-8 h-8 rounded-lg bg-[#fe9a00]/20 flex items-center justify-center">
                                <FiSettings className="text-sm text-[#fe9a00]" />
                              </div>
                              <div>
                                <p className="text-white font-semibold text-xs leading-tight">
                                  Auto Gear
                                </p>
                                <p className="text-gray-400 text-[11px] leading-snug mt-0.5">
                                  {priceCalc.totalDays} day
                                  {priceCalc.totalDays !== 1 ? "s" : ""} ×{" "}
                                  {formatCurrency(gearExtraCost)}
                                </p>
                              </div>
                            </div>
                            <span className="text-white font-bold text-sm shrink-0">
                              {formatCurrency(gearTotalPrice)}
                            </span>
                          </div>
                        </div>
                      )}

                      {(pickupExtensionPrice > 0 ||
                        returnExtensionPrice > 0) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {pickupExtensionPrice > 0 && (
                            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2.5">
                                  <div className="shrink-0 w-8 h-8 rounded-lg bg-[#fe9a00]/20 flex items-center justify-center">
                                    <FiTruck className="text-sm text-[#fe9a00]" />
                                  </div>
                                  <div>
                                    <p className="text-white font-semibold text-xs leading-tight">
                                      Pickup Extension
                                    </p>
                                    <p className="text-gray-400 text-[11px] leading-snug mt-0.5">
                                      Either out of working time or weekend time
                                    </p>
                                  </div>
                                </div>
                                <span className="text-white font-bold text-sm shrink-0">
                                  {formatCurrency(pickupExtensionPrice)}
                                </span>
                              </div>
                            </div>
                          )}

                          {returnExtensionPrice > 0 && (
                            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2.5">
                                  <div className="shrink-0 w-8 h-8 rounded-lg bg-[#fe9a00]/20 flex items-center justify-center">
                                    <FiTruck className="text-sm text-[#fe9a00]" />
                                  </div>
                                  <div>
                                    <p className="text-white font-semibold text-xs leading-tight">
                                      Return Extension
                                    </p>
                                    <p className="text-gray-400 text-[11px] leading-snug mt-0.5">
                                      Either out of working time or weekend time
                                    </p>
                                  </div>
                                </div>
                                <span className="text-white font-bold text-sm shrink-0">
                                  {formatCurrency(returnExtensionPrice)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {specialDaysPrice > 0 &&
                        priceCalc.specialDaysInfo &&
                        priceCalc.specialDaysInfo.length > 0 && (
                          <div className="rounded-lg bg-purple-500/5 border border-purple-400/15 overflow-hidden">
                            <div className="flex items-center justify-between gap-3 p-3">
                              <div className="flex items-start gap-2.5">
                                <div className="shrink-0 w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                  <FiStar className="text-sm text-purple-300" />
                                </div>
                                <div>
                                  <p className="text-white font-semibold text-xs leading-tight">
                                    Special Days
                                  </p>
                                  <p className="text-gray-400 text-[11px] leading-snug mt-0.5">
                                    {priceCalc.specialDaysInfo.length} day
                                    {priceCalc.specialDaysInfo.length !== 1
                                      ? "s"
                                      : ""}
                                  </p>
                                </div>
                              </div>
                              <span className="text-white font-bold text-sm shrink-0">
                                {formatCurrency(specialDaysPrice)}
                              </span>
                            </div>
                            <div className="border-t border-purple-400/10 px-3 py-2 space-y-1">
                              {priceCalc.specialDaysInfo.map(
                                (info: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between items-center gap-3 text-[10px] pl-10"
                                  >
                                    <span className="text-purple-200/75 truncate">
                                      {info.date}
                                      {info.reason && (
                                        <span className="text-purple-300/50">
                                          {" "}
                                          - {info.reason}
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-purple-100 font-semibold shrink-0">
                                      +{formatCurrency(info.price)}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {reservation.addOns && reservation.addOns.length > 0 && (
                        <div className="rounded-lg bg-emerald-500/5 border border-emerald-400/15 overflow-hidden">
                          <div className="flex items-center justify-between gap-3 p-3">
                            <div className="flex items-start gap-2.5">
                              <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <FiPackage className="text-sm text-emerald-300" />
                              </div>
                              <div>
                                <p className="text-white font-semibold text-xs leading-tight">
                                  Add-ons
                                </p>
                                <p className="text-gray-400 text-[11px] leading-snug mt-0.5">
                                  {reservation.addOns.length} item
                                  {reservation.addOns.length !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <span className="text-white font-bold text-sm shrink-0">
                              {formatCurrency(totalAddOnsPrice)}
                            </span>
                          </div>
                          <div className="border-t border-emerald-400/10 px-3 py-2 space-y-1">
                            {reservation.addOns.map((item: any, idx: number) => {
                              const addon = item.addOn;
                              const price = getAddOnPrice(item);
                              return (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center gap-3 text-[10px] pl-10"
                                >
                                  <span className="text-emerald-200/75 truncate">
                                    {addon?.name || "Unknown"}{" "}
                                    <span className="text-emerald-300/50">
                                      ×{item.quantity}
                                    </span>
                                  </span>
                                  <span className="text-emerald-100 font-semibold shrink-0">
                                    {formatCurrency(price)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="bg-[#fe9a00]/10 border border-[#fe9a00]/30 rounded-lg p-3 self-start">
                  <p className="text-white text-sm font-semibold mb-1 flex items-center gap-2">
                    Total Price
                    {isPerInvoice && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-sky-500/20 text-sky-300 border border-sky-400/30">
                        Per Invoice
                      </span>
                    )}
                  </p>
                  <p className="text-[#fe9a00] text-2xl font-black">
                    {isPerInvoicePending
                      ? "Pending invoice"
                      : formatCurrency(reservationTotalPrice)}
                  </p>
                  {priceSummaryText && (
                    <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                      {priceSummaryText}
                    </p>
                  )}
                  {(isManualDailyPrice || isManualTotalOverride) && (
                    <p className="text-purple-300 text-xs font-semibold mt-2">
                      {isManualTotalOverride
                        ? "Total override active"
                        : "Manual daily price active"}
                    </p>
                  )}
                  {manualPriceNote && (
                    <p className="text-purple-200/70 text-xs mt-1 leading-relaxed">
                      {manualPriceNote}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Row: Add-ons Detail + Message side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Add-ons Detail */}
              {reservation.addOns && reservation.addOns.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <h3 className="text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 mb-2">
                    <span className="w-0.5 h-4 bg-[#fe9a00] rounded-full"></span>
                    Selected Add-ons
                  </h3>
                  <div className="space-y-1.5">
                    {reservation.addOns.map((item: any, idx: number) => {
                      const addon = item.addOn;
                      const price = getAddOnPrice(item);

                      return (
                        <div
                          key={idx}
                          className="flex justify-between items-center py-1.5 px-2.5 bg-black/30 rounded border border-white/5"
                        >
                          <div className="min-w-0">
                            <p className="text-white font-medium text-xs truncate">
                              {addon?.name || "Unknown"}
                            </p>
                            {addon?.description && (
                              <p className="text-gray-500 text-[9px] truncate">
                                {addon.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right ml-3 shrink-0">
                            <span className="text-gray-500 text-[9px]">
                              ×{item.quantity}
                            </span>
                            <p className="text-white font-semibold text-xs">
                              £{price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Message - show here if license exists (otherwise it was shown above) */}
              {reservation.messege &&
                (reservation.user?.licenceAttached?.front ||
                  reservation.user?.licenceAttached?.back) && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <h3 className="text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 mb-2">
                      <span className="w-0.5 h-4 bg-[#fe9a00] rounded-full"></span>
                      Customer Message
                    </h3>
                    <p className="text-gray-300 text-xs leading-relaxed bg-black/30 p-2 rounded">
                      {reservation.messege}
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
