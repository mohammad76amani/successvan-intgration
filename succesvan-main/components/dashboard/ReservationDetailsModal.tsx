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
  FiFileText,
  FiCheckCircle,
  FiActivity,
  FiDownload,
} from "react-icons/fi";
import type {
  AddOn,
  Category,
  Reservation,
  User,
  Vehicle,
} from "@/types/type";
import { usePriceCalculation } from "@/hooks/usePriceCalculation";
import {
  printReservationReceipt,
} from "@/lib/printReservation";
import EvidenceThumbnail from "@/components/ui/EvidenceThumbnail";
import { clientAuthHeaders } from "@/lib/client-auth";
import type { SafeContractSummary } from "@/lib/docusign/types";

const formatCurrency = (value: unknown) => {
  const amount = Number(value);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const formatDateTime = (value: unknown) => {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-GB", {
    timeZone: "Europe/London",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Fact = ({ label, value, tone = "default" }: { label: string; value: React.ReactNode; tone?: "default" | "good" | "bad" | "warn" }) => (
  <div className="min-w-0">
    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
    <div className={`mt-1 break-words text-xs font-semibold ${tone === "bad" ? "text-red-300" : tone === "good" ? "text-emerald-300" : tone === "warn" ? "text-[#fe9a00]" : "text-slate-100"}`}>
      {value ?? "-"}
    </div>
  </div>
);

type InspectionField = NonNullable<
  NonNullable<Reservation["handover"]>["customFields"]
>[number];

const inspectionFieldKey = (field: InspectionField, index: number) =>
  field.templateFieldId ||
  field.label?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
  `field-${index}`;

function InspectionFieldValue({
  field,
  emptyLabel,
}: {
  field?: InspectionField;
  emptyLabel: string;
}) {
  if (!field) return <span className="text-xs text-slate-600">{emptyLabel}</span>;
  if (field.fieldType === "file") {
    return field.files?.length ? (
      <div className="flex flex-wrap gap-2">
        {field.files.map((url, index) => (
          <EvidenceThumbnail
            key={`${url}-${index}`}
            url={url}
            alt={field.label || "Inspection evidence"}
          />
        ))}
      </div>
    ) : (
      <span className="text-xs text-slate-600">No images</span>
    );
  }
  return <span className="text-xs font-semibold text-white">{field.value || "-"}</span>;
}

interface ReservationDetailsModalProps {
  reservation: Reservation | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (reservation: Reservation) => void;
  layerClassName?: string;
}

type ReservationAddOn = NonNullable<Reservation["addOns"]>[number] & {
  addOn?: AddOn | string;
  totalPrice?: number;
};

export default function ReservationDetailsModal({
  reservation,
  isOpen,
  onClose,
  onEdit,
  layerClassName = "z-50",
}: ReservationDetailsModalProps) {
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [contracts, setContracts] = useState<SafeContractSummary[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const customer = reservation?.user as User | undefined;
  const reservationAddOns = (reservation?.addOns || []) as ReservationAddOn[];

  const categoryData = useMemo(() => {
    return reservation?.category as Category | undefined;
  }, [reservation?.category]);

  const startDateTimeString = reservation?.startDate
    ? new Date(reservation.startDate).toISOString()
    : "";
  const endDateTimeString = reservation?.endDate
    ? new Date(reservation.endDate).toISOString()
    : "";

  const gearExtraCost = useMemo(() => {
    if (
      reservation?.selectedGear === "automatic" &&
      categoryData?.gear?.automaticExtraCost
    ) {
      return categoryData.gear.automaticExtraCost;
    }
    return 0;
  }, [categoryData, reservation]);

  const pickupExtensionPrice = Number(
    reservation?.pickupExtensionPrice || 0,
  );
  const returnExtensionPrice = Number(
    reservation?.returnExtensionPrice || 0,
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

  const isManualPrice = reservation?.isManualPrice;
  const manualPricePerDay = reservation?.manualPricePerDay || 0;
  const manualPriceNote = reservation?.manualPriceNote;
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
  const reservationTotalPrice = Number(reservation?.totalPrice || 0);
  const serviceCharge = Number(reservation?.serviceCharge ?? 1) || 0;
  const isPerInvoice = Boolean(reservation?.perInvoice);
  const isPerInvoicePending = isPerInvoice && reservationTotalPrice <= 0;

  useEffect(() => {
    Promise.all([fetch("/api/addons?status=active").then((res) => res.json())])
      .then(([addOnsData]) => {
        const addonsArray = addOnsData.data?.data || addOnsData.data || [];
        setAddOns(Array.isArray(addonsArray) ? addonsArray : []);
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    if (!isOpen || !reservation?._id) {
      setContracts([]);
      return;
    }

    const controller = new AbortController();
    const loadContracts = async () => {
      setContractsLoading(true);
      try {
        const params = new URLSearchParams({
          bookingId: reservation._id as string,
          limit: "100",
        });
        const response = await fetch(`/api/admin/contracts?${params}`, {
          headers: clientAuthHeaders(),
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "Could not load contracts");
        }
        setContracts(Array.isArray(payload.data) ? payload.data : []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setContracts([]);
      } finally {
        if (!controller.signal.aborted) setContractsLoading(false);
      }
    };

    void loadContracts();
    return () => controller.abort();
  }, [isOpen, reservation?._id, reservation?.status]);

  const resolveAddOn = (item: ReservationAddOn) =>
    typeof item.addOn === "object"
      ? item.addOn
      : addOns.find((addOn) => addOn._id === item.addOn);

  const getAddOnPrice = (item: ReservationAddOn) => {
    const storedTotal = Number(item.totalPrice);
    if (Number.isFinite(storedTotal) && storedTotal > 0) {
      return storedTotal;
    }

    const addon = resolveAddOn(item);
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
    reservationAddOns.reduce((sum, item) => {
      return sum + getAddOnPrice(item);
    }, 0) || 0;
  const extensions = reservation?.rentalExtensions || [];
  const extensionContracts = contracts.filter(
    (agreement) => agreement.contractType === "reservation_extension",
  );
  const extensionPriceRows = extensionContracts.length
    ? extensionContracts.map((agreement, index) => ({
        key: agreement._id,
        contractNumber: agreement.contractNumber || `Extension ${index + 1}`,
        newReturnDateTime: agreement.extension?.newReturnDateTime,
        price: Number(agreement.extension?.agreedPrice || 0),
        status: agreement.status,
      }))
    : extensions.map((extension, index) => ({
        key: `${extension.contractNumber || "extension"}-${index}`,
        contractNumber: extension.contractNumber || `Extension ${index + 1}`,
        newReturnDateTime: extension.newReturnDateTime,
        price: Number(extension.agreedPrice || 0),
        status: extension.signedAt ? "completed" : "pending",
      }));
  const extensionContractsTotal = extensionPriceRows.reduce(
    (total, extension) => total + extension.price,
    0,
  );

  const priceSummaryText = (() => {
    if (!priceCalc) return "";

    if (isManualTotalOverride) {
      return `Admin total override: ${formatCurrency(reservationTotalPrice)}${
        extensionContractsTotal > 0
          ? ` · extension contracts ${formatCurrency(extensionContractsTotal)} (pay at office)`
          : ""
      }`;
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

    if (extensionContractsTotal > 0) {
      parts.push(
        `extension contracts ${formatCurrency(extensionContractsTotal)} (pay at office)`,
      );
    }

    return `${parts.join(" + ")}${
      isManualDailyPrice ? " (Manual daily price)" : ""
    }`;
  })();

  const handover = reservation?.handover;
  const inspection = reservation?.inspection;
  const hasLicenceCard = Boolean(
    customer?.licenceAttached?.front || customer?.licenceAttached?.back,
  );
  const hasRentalPeriodCompanion = hasLicenceCard || Boolean(reservation?.messege);
  const liveVehicle = reservation?.vehicle as Partial<Vehicle> | undefined;
  const vehicleSnapshot = reservation?.vehicleSnapshot;
  const vehicle = liveVehicle || vehicleSnapshot;
  const showVehicleSnapshot = Boolean(
    liveVehicle &&
      vehicleSnapshot &&
      (String(liveVehicle._id || "") !== String(vehicleSnapshot.vehicleId || "") ||
        String(liveVehicle.number || "") !== String(vehicleSnapshot.number || "") ||
        String(liveVehicle.title || liveVehicle.make || "") !==
          String(vehicleSnapshot.title || vehicleSnapshot.make || "")),
  );
  const beforeInspectionFields = handover?.customFields || [];
  const afterInspectionFields = inspection?.customFields || [];
  const inspectionFieldKeys = Array.from(
    new Set([
      ...beforeInspectionFields.map(inspectionFieldKey),
      ...afterInspectionFields.map(inspectionFieldKey),
    ]),
  );
  const downloadContract = (
    selectedContract: SafeContractSummary,
    kind: "source" | "signed" | "certificate",
  ) => {
    const token = localStorage.getItem("token") || "";
    window.open(
      `/api/admin/contracts/${selectedContract._id}/document?type=${kind}&token=${encodeURIComponent(token)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

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
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(reservation)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/20"
                >
                  <FiEdit3 className="text-sm" /> Edit
                </button>
              )}
    
              <button
                onClick={() => printReservationReceipt(reservation, contracts)}
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
                      {[reservation.user?.name, reservation.user?.lastName].filter(Boolean).join(" ") || "-"}
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
                      {customer?.city || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] leading-none">
                      Address
                    </p>
                    <p className="text-white font-medium text-xs truncate">
                      {customer?.address || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] leading-none">
                      Postal
                    </p>
                    <p className="text-white font-medium text-xs truncate">
                      {customer?.postalCode || "-"}
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
                      {categoryData?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] leading-none">
                      Vehicle
                    </p>
                    <p className="text-white font-medium text-xs truncate">
                      {vehicle?.title || vehicle?.make || "-"}
                      {vehicle?.number ? ` · ${vehicle.number}` : ""}
                      {vehicle?.keyNumber
                        ? ` (Key: ${vehicle.keyNumber})`
                        : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] leading-none">
                      Gear
                    </p>
                    <p className="text-white font-medium text-xs capitalize">
                      {reservation.selectedGear || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] leading-none">
                      Type
                    </p>
                    <p className="text-white font-medium text-xs capitalize">
                      {reservation.reservationType || "-"}
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
                {showVehicleSnapshot && vehicleSnapshot && (
                  <div className="mt-3 rounded-lg border border-[#fe9a00]/15 bg-[#fe9a00]/[0.05] p-2.5">
                    <p className="text-[9px] font-black uppercase tracking-wide text-[#fe9a00]">Vehicle retained on this reservation</p>
                    <p className="mt-1 text-xs font-semibold text-white">
                      {vehicleSnapshot.title || vehicleSnapshot.make || "Vehicle"}
                      {vehicleSnapshot.number ? ` · ${vehicleSnapshot.number}` : ""}
                      {vehicleSnapshot.color ? ` · ${vehicleSnapshot.color}` : ""}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">Assigned {formatDateTime(vehicleSnapshot.assignedAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Middle Row: Dates + License side by side */}
            <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
              {/* Dates & Times - Compact */}
              <div className={`self-start rounded-lg border border-white/10 bg-white/5 p-3 ${hasRentalPeriodCompanion ? "" : "lg:col-span-2"}`}>
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
                {(extensionContracts.length > 0 || extensions.length > 0) && (
                  <div className="mt-3 border-t border-white/[0.08] pt-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-[10px] font-black uppercase tracking-wide text-[#fe9a00]">Rental extensions</p>
                      <span className="rounded-full border border-[#fe9a00]/20 bg-[#fe9a00]/10 px-2 py-0.5 text-[9px] font-bold text-[#fe9a00]">
                        {extensionContracts.length || extensions.length} contract{(extensionContracts.length || extensions.length) === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {extensionContracts.length > 0
                        ? extensionContracts.map((agreement, index) => (
                            <div key={agreement._id} className="grid gap-2 rounded-lg border border-white/[0.07] bg-black/15 p-2.5 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-center">
                              <span className="text-[10px] font-black text-white">#{index + 1}</span>
                              <Fact label="Previous return" value={formatDateTime(agreement.extension?.previousReturnDateTime)} />
                              <Fact label="Extended return" value={formatDateTime(agreement.extension?.newReturnDateTime)} tone="warn" />
                              <span className="justify-self-start rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-bold uppercase text-slate-400 sm:justify-self-end">{agreement.status.replace(/_/g, " ")}</span>
                            </div>
                          ))
                        : extensions.map((extension, index) => (
                            <div key={`${extension.contractNumber || "extension"}-${index}`} className="grid gap-2 rounded-lg border border-white/[0.07] bg-black/15 p-2.5 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-center">
                              <span className="text-[10px] font-black text-white">#{index + 1}</span>
                              <Fact label="Previous return" value={formatDateTime(extension.previousReturnDateTime)} />
                              <Fact label="Extended return" value={formatDateTime(extension.newReturnDateTime)} tone="warn" />
                              <span className="justify-self-start text-[10px] font-black text-[#fe9a00] sm:justify-self-end">{formatCurrency(extension.agreedPrice)}</span>
                            </div>
                          ))}
                    </div>
                  </div>
                )}
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
                  {customer?.licenceDetails && (
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/[0.07] pt-3 sm:grid-cols-3">
                      <Fact label="Licence name" value={customer.licenceDetails.fullName || [customer.licenceDetails.firstName, customer.licenceDetails.lastName].filter(Boolean).join(" ") || "-"} />
                      <Fact label="Licence number" value={customer.licenceDetails.licenceNumber || customer.licenceDetails.licenseNumber || "-"} />
                      <Fact label="Date of birth" value={customer.licenceDetails.dateOfBirth || "-"} />
                      <Fact label="Issue date" value={customer.licenceDetails.issueDate || "-"} />
                      <Fact label="Expiry date" value={customer.licenceDetails.expiryDate || customer.licenceDetails.expirationDate || "-"} />
                      <Fact label="Licence address" value={[customer.licenceDetails.address, customer.licenceDetails.postcode].filter(Boolean).join(", ") || "-"} />
                    </div>
                  )}
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

                      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-white">Service charge</p>
                            <p className="mt-0.5 text-[11px] text-gray-400">Applied to every priced reservation</p>
                          </div>
                          <span className="shrink-0 text-sm font-bold text-white">
                            {formatCurrency(serviceCharge)}
                          </span>
                        </div>
                      </div>

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
                                (info, idx) => (
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

                      {reservationAddOns.length > 0 && (
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
                                  {reservationAddOns.length} item
                                  {reservationAddOns.length !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <span className="text-white font-bold text-sm shrink-0">
                              {formatCurrency(totalAddOnsPrice)}
                            </span>
                          </div>
                          <div className="border-t border-emerald-400/10 px-3 py-2 space-y-1">
                            {reservationAddOns.map((item, idx) => {
                              const addon = resolveAddOn(item);
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
                  {extensionPriceRows.length > 0 && (
                    <div className="mt-3 overflow-hidden rounded-lg border border-[#fe9a00]/20 bg-black/15">
                      <div className="flex items-center justify-between gap-3 border-b border-[#fe9a00]/15 px-3 py-2">
                        <span className="text-[10px] font-black uppercase tracking-wide text-[#fe9a00]">Extension agreements</span>
                        <span className="rounded-full bg-[#fe9a00]/15 px-2 py-0.5 text-[9px] font-bold uppercase text-[#ffb84d]">Pay at office</span>
                      </div>
                      <div className="divide-y divide-white/[0.06]">
                        {extensionPriceRows.map((extension) => (
                          <div key={extension.key} className="grid gap-1 px-3 py-2 sm:grid-cols-[1fr_1.2fr_auto] sm:items-center sm:gap-3">
                            <div>
                              <p className="text-[11px] font-bold text-white">{extension.contractNumber}</p>
                              <p className="text-[9px] font-semibold uppercase text-slate-500">{extension.status.replace(/_/g, " ")}</p>
                            </div>
                            <p className="text-[10px] text-slate-400">Extended return: <span className="font-semibold text-slate-200">{formatDateTime(extension.newReturnDateTime)}</span></p>
                            <strong className="text-xs text-[#fe9a00]">+{formatCurrency(extension.price)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
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

            {/* Message is shown here when the licence card occupies the period row. */}
            {reservation.messege && hasLicenceCard && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white sm:text-sm">
                  <span className="h-4 w-0.5 rounded-full bg-[#fe9a00]"></span>
                  Customer Message
                </h3>
                <p className="rounded bg-black/30 p-2 text-xs leading-relaxed text-gray-300">
                  {reservation.messege}
                </p>
              </div>
            )}

            <div className="space-y-2">
              {(contractsLoading || contracts.length > 0 || extensions.length > 0 || reservation.additionalDriver || reservation.insuranceArrangement) && (
                <details className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/[0.04]">
                    <FiFileText className="text-[#fe9a00]" /> Contract & extensions
                    <span className="ml-auto text-xs text-slate-500">{contractsLoading ? "Loading…" : `${contracts.length} agreement${contracts.length === 1 ? "" : "s"}`}</span>
                  </summary>
                  <div className="grid gap-3 border-t border-white/10 p-4 sm:grid-cols-3">
                    <Fact label="Insurance" value={reservation.insuranceArrangement?.provider === "customer" ? "Customer arranged" : reservation.insuranceArrangement?.provider === "diba" ? "Diba Cooperation Ltd" : "-"} />
                    <Fact label="Other excess" value={reservation.insuranceArrangement?.otherExcess || "-"} />
                    <Fact label="Handover deposit" value={formatCurrency(reservation.handoverDepositAmount)} />
                    {reservation.additionalDriver && <><Fact label="Additional driver" value={reservation.additionalDriver.name || "-"} /><Fact label="Driver licence" value={reservation.additionalDriver.licenceNumber || "-"} /></>}
                    <div className="space-y-2 sm:col-span-3">
                      {contracts.map((agreement) => (
                        <div key={agreement._id} className="rounded-lg border border-white/10 bg-black/15 p-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <strong className="text-xs text-white">{agreement.contractNumber || "Contract pending"}</strong>
                              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{agreement.contractType === "reservation_extension" ? "Extension agreement" : "Rental agreement"} · {agreement.status.replace(/_/g, " ")}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {agreement.files.source && <button type="button" onClick={() => downloadContract(agreement, "source")} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[11px] font-bold text-slate-200 transition hover:border-[#fe9a00]/30 hover:text-[#fe9a00]"><FiDownload /> Original</button>}
                              {agreement.files.signed && <button type="button" onClick={() => downloadContract(agreement, "signed")} className="inline-flex items-center gap-1 rounded-md border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-bold text-emerald-200 transition hover:bg-emerald-500/15"><FiDownload /> Signed</button>}
                            </div>
                          </div>
                          {agreement.extension && <div className="mt-2 grid gap-2 border-t border-white/[0.06] pt-2 sm:grid-cols-3"><Fact label="Previous return" value={formatDateTime(agreement.extension.previousReturnDateTime)} /><Fact label="New return" value={formatDateTime(agreement.extension.newReturnDateTime)} /><Fact label="Agreed price" value={formatCurrency(agreement.extension.agreedPrice)} tone="warn" /></div>}
                        </div>
                      ))}
                      {!contractsLoading && contracts.length === 0 && extensions.map((extension, index) => (
                        <div key={`${extension.contractNumber || "extension"}-${index}`} className="rounded-lg border border-white/10 bg-black/15 p-3">
                          <div className="flex items-center justify-between gap-3"><strong className="text-xs text-white">Extension {index + 1} · {extension.contractNumber || "Contract pending"}</strong><span className="text-xs font-bold text-[#fe9a00]">{formatCurrency(extension.agreedPrice)}</span></div>
                          <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(extension.previousReturnDateTime)} → {formatDateTime(extension.newReturnDateTime)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              )}

              {(handover?.completedAt || inspection?.completedAt) && (
                <details className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/[0.04]">
                    <FiCheckCircle className="text-[#fe9a00]" /> Vehicle inspection
                    <span className="ml-auto text-xs text-slate-500">Before / after</span>
                  </summary>
                  <div className="border-t border-white/10 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-white/10 bg-black/15 p-3"><p className="mb-3 text-[10px] font-black uppercase tracking-wide text-emerald-300">Collection · before</p><div className="grid grid-cols-2 gap-3"><Fact label="Mileage" value={handover?.startMileage ?? "-"} /><Fact label="Fuel" value={handover?.startFuelLevel || "-"} /><Fact label="Staff" value={handover?.staff?.name || "-"} /><Fact label="Completed" value={formatDateTime(handover?.completedAt)} /></div></div>
                      <div className="rounded-lg border border-white/10 bg-black/15 p-3"><p className="mb-3 text-[10px] font-black uppercase tracking-wide text-[#fe9a00]">Return · after</p><div className="grid grid-cols-2 gap-3"><Fact label="Mileage" value={inspection?.returnMileage ?? "-"} /><Fact label="Fuel" value={inspection?.returnFuelLevel || "-"} /><Fact label="Staff" value={inspection?.staff?.name || "-"} /><Fact label="Completed" value={formatDateTime(inspection?.completedAt)} /></div></div>
                    </div>
                    {inspectionFieldKeys.length > 0 && (
                      <div className="mt-3 overflow-hidden rounded-lg border border-white/[0.08] bg-black/10">
                        <div className="hidden grid-cols-[1fr_1.2fr_1.2fr] gap-3 border-b border-white/[0.08] px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-500 sm:grid">
                          <span>Inspection item</span><span>Before</span><span>After</span>
                        </div>
                        <div className="divide-y divide-white/[0.06]">
                          {inspectionFieldKeys.map((key) => {
                            const beforeField = beforeInspectionFields.find((field, index) => inspectionFieldKey(field, index) === key);
                            const afterField = afterInspectionFields.find((field, index) => inspectionFieldKey(field, index) === key);
                            return (
                              <div key={key} className="grid gap-3 px-3 py-3 sm:grid-cols-[1fr_1.2fr_1.2fr] sm:items-start">
                                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{beforeField?.label || afterField?.label || "Inspection field"}</p>
                                <div><p className="mb-1 text-[9px] font-bold uppercase text-emerald-300 sm:hidden">Before</p><InspectionFieldValue field={beforeField} emptyLabel="Not recorded" /></div>
                                <div><p className="mb-1 text-[9px] font-bold uppercase text-[#fe9a00] sm:hidden">After</p><InspectionFieldValue field={afterField} emptyLabel="Awaiting return inspection" /></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {(reservation.statusHistory?.length || 0) > 0 && (
                <details className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/[0.04]"><FiActivity className="text-[#fe9a00]" /> Activity history<span className="ml-auto text-xs text-slate-500">{reservation.statusHistory?.length}</span></summary>
                  <div className="divide-y divide-white/[0.06] border-t border-white/10 px-4">{reservation.statusHistory?.slice().reverse().map((entry, index) => <div key={`${entry.status}-${String(entry.changedAt)}-${index}`} className="grid gap-1 py-3 sm:grid-cols-[150px_150px_1fr]"><span className="text-xs font-bold capitalize text-white">{entry.status.replace(/_/g, " ")}</span><span className="text-xs text-slate-500">{formatDateTime(entry.changedAt)}</span><span className="text-xs text-slate-400">{entry.note || entry.source || "Status updated"}</span></div>)}</div>
                </details>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
