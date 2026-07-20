"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import {
  FiMenu,
  FiX,
  FiClipboard,
  FiUser,
  FiTag,
  FiExternalLink,
  FiLogOut,
  FiAlertCircle,
  FiMessageSquare,
  FiCalendar,
  FiClock,
  FiPrinter,
  FiDownload,
  FiFileText,
} from "react-icons/fi";
import ProfileContent from "./ProfileContent";
import DynamicTableView from "../dashboard/DynamicTableView";
import { Reservation } from "@/types/type";
import { showToast } from "@/lib/toast";
import { clientAuthHeaders } from "@/lib/client-auth";
import { Range, DateRange } from "react-date-range";
import { usePriceCalculation } from "@/hooks/usePriceCalculation";
import { generateTimeSlots } from "@/utils/timeSlots";
import ReservationDetailsModal from "@/components/dashboard/ReservationDetailsModal";
import AddOnsModal from "@/components/global/AddOnsModal";
import TimeSelect from "@/components/ui/TimeSelect";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import SupportContent from "./SupportContent";
import {
  findSpecialDayForDate,
  getSpecialDayPickupWindow,
  getSpecialDayReturnWindow,
  isSameCalendarDate,
} from "@/lib/specialDaySchedule";
import {
  printReservationReceipt,
} from "@/lib/printReservation";
import ReservesContentPanel from "./ReservesContent";
import ContractsContent from "./ContractsContent";

const menuItems = [
  {
    id: "reserves",
    label: "My Reservations",
    icon: <FiClipboard />,
  },
  {
    id: "contracts",
    label: "My Agreements",
    icon: <FiFileText />,
  },
  {
    id: "profile",
    label: "Profile",
    icon: <FiUser />,
  },
  {
    id: "support",
    label: "Support",
    icon: <FiMessageSquare />,
  },
  {
    id: "discounts",
    label: "Discounts",
    icon: <FiTag />,
  },
];

type UserWithLicence = {
  licenceAttached?: {
    front?: unknown;
    back?: unknown;
  };
};

const hasCompleteLicence = (userData: unknown) => {
  if (!userData || typeof userData !== "object") return false;
  const { licenceAttached } = userData as UserWithLicence;
  return Boolean(licenceAttached?.front && licenceAttached?.back);
};

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState("reserves");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [hasLicense, setHasLicense] = useState(true);
  const [hasAddress, setHasAddress] = useState(true);
  const [scrollToSection, setScrollToSection] = useState<
    "license" | "address" | null
  >(null);

  const checkLicenseStatus = () => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData && typeof userData === "object") {
          const hasLicenseUploaded = hasCompleteLicence(userData);
          setHasLicense(hasLicenseUploaded);
          const hasAddressData = Boolean(
            userData.address?.trim() &&
              userData.city?.trim() &&
              userData.postalCode?.trim(),
          );
          setHasAddress(hasAddressData);
        }
      } catch (error) {
        console.log("Failed to parse user data:", error);
      }
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash && menuItems.some((item) => item.id === hash)) {
        setActiveTab(hash);
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    checkLicenseStatus();
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData && typeof userData === "object") {
          const hasLicenseUploaded = hasCompleteLicence(userData);

          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get("uploadLicense") === "true") {
            setActiveTab("reserves");
            if (!hasLicenseUploaded) {
              showToast.error(
                "Your reservation is pending. You can view and edit it here, but please upload your licences to confirm your booking.",
              );
            }
            window.history.replaceState(
              {},
              "",
              `${window.location.pathname}#reserves`,
            );
          }
        }
      } catch (error) {
        console.log("Failed to parse user data:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sidebarOpen]);

  const handleTabChange = (tabId: string, section?: "license" | "address") => {
    setActiveTab(tabId);
    window.location.hash = tabId;
    setSidebarOpen(false);
    if (section) {
      setScrollToSection(section);
      setTimeout(() => setScrollToSection(null), 500);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#0f172b]">
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-[#1a2847] border-r border-white/10 z-50 transition-transform duration-300 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-black text-white">
            Success<span className="text-[#fe9a00]">Van</span>
          </h1>
        </div>

        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center cursor-pointer gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 ${
                activeTab === item.id
                  ? "bg-[#fe9a00] text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 space-y-2 border-t border-white/10">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg transition-colors font-semibold"
          >
            <FiExternalLink className="text-lg" />
            <span>Back to Site</span>
          </Link>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center cursor-pointer gap-2 px-4 py-3 border border-red-500 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors font-semibold"
          >
            <FiLogOut className="text-lg" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="lg:ml-64">
        <div className="sticky top-0 bg-[#1a2847] border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
          <h2 className="text-lg md:text-2xl font-black text-white">
            {menuItems.find((item) => item.id === activeTab)?.label}
          </h2>
          <div>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 p-1.5 md:px-4 md:py-3 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg transition-colors font-semibold"
            >
              <FiExternalLink className="text-lg" />
              <span>Back to Site</span>
            </Link>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {!hasLicense && (
            <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
              <FiAlertCircle className="text-yellow-500 text-xl mt-0.5 shrink-0" />
              <div>
                <h3 className="text-yellow-500 font-bold mb-1">
                  licences Required
                </h3>
                <p className="text-gray-300 text-sm">
                  Your reservations are pending. Please upload your driver's
                  licences in the Profile section to confirm your bookings.
                </p>
                <button
                  onClick={() => handleTabChange("profile", "license")}
                  className="mt-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg transition-colors font-semibold text-sm"
                >
                  Upload licences Now
                </button>
              </div>
            </div>
          )}
          {!hasAddress && (
            <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
              <FiAlertCircle className="text-blue-500 text-xl mt-0.5 shrink-0" />
              <div>
                <h3 className="text-blue-500 font-bold mb-1">
                  Address Required
                </h3>
                <p className="text-gray-300 text-sm">
                  Please add your address in the Profile section to complete
                  your profile.
                </p>
                <button
                  onClick={() => handleTabChange("profile", "address")}
                  className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-semibold text-sm"
                >
                  Add Address Now
                </button>
              </div>
            </div>
          )}

          {activeTab === "reserves" && <ReservesContentPanel />}
          {activeTab === "contracts" && <ContractsContent />}
          {activeTab === "profile" && (
            <ProfileContent
              onLicenseUpdate={checkLicenseStatus}
              scrollToSection={scrollToSection}
            />
          )}
          {activeTab === "support" && <SupportContent />}
          {activeTab === "discounts" && <DiscountsContent />}
        </div>
      </main>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2847] rounded-2xl border border-white/10 max-w-sm w-full p-6">
            <h3 className="text-xl font-black text-white mb-2">Logout</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to logout?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReservesContent() {
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditDatesOpen, setIsEditDatesOpen] = useState(false);
  const [offices, setOffices] = useState<any[]>([]);
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
  const [pickupExtensionPrice, setPickupExtensionPrice] = useState(0);
  const [returnExtensionPrice, setReturnExtensionPrice] = useState(0);
  const [addOnsCost, setAddOnsCost] = useState(0);
  const [startDateReservedSlots, setStartDateReservedSlots] = useState<any[]>(
    [],
  );
  const [endDateReservedSlots, setEndDateReservedSlots] = useState<any[]>([]);
  const [showAddOnsModal, setShowAddOnsModal] = useState(false);
  const [addOns, setAddOns] = useState<any[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<
    { addOn: string; quantity: number; selectedTierIndex?: number }[]
  >([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedGear, setSelectedGear] = useState<"manual" | "automatic" | "">(
    "",
  );
  const [gearExtraCost, setGearExtraCost] = useState(0);

  const selectedCategory = useMemo(() => {
    return (selectedReservation as any)?.category;
  }, [selectedReservation]);

  const selectedCategoryFromList = useMemo(() => {
    return categories.find((c) => c._id === selectedCategory?._id);
  }, [selectedCategory, categories]);

  const hasBothGearTypes = useMemo(() => {
    return (
      selectedCategoryFromList?.gear?.availableTypes?.length === 2 ||
      (selectedCategoryFromList?.gear?.availableTypes?.includes("manual") &&
        selectedCategoryFromList?.gear?.availableTypes?.includes("automatic"))
    );
  }, [selectedCategoryFromList]);

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

        if (start === end) {
          if (
            !workingDay.pickupExtension ||
            (workingDay.pickupExtension.hoursBefore === 0 &&
              workingDay.pickupExtension.hoursAfter === 0)
          ) {
            return [];
          }
          const [startHour, startMin] = start.split(":").map(Number);
          const extendedStartMinutes = Math.max(
            0,
            startHour * 60 +
              startMin -
              workingDay.pickupExtension.hoursBefore * 60,
          );
          const extendedEndMinutes = Math.min(
            1439,
            startHour * 60 +
              startMin +
              workingDay.pickupExtension.hoursAfter * 60,
          );
          start = `${String(Math.floor(extendedStartMinutes / 60)).padStart(2, "0")}:${String(extendedStartMinutes % 60).padStart(2, "0")}`;
          end = `${String(Math.floor(extendedEndMinutes / 60)).padStart(2, "0")}:${String(extendedEndMinutes % 60).padStart(2, "0")}`;
        } else if (workingDay.pickupExtension) {
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
          start = `${String(Math.floor(extendedStartMinutes / 60)).padStart(2, "0")}:${String(extendedStartMinutes % 60).padStart(2, "0")}`;
          end = `${String(Math.floor(extendedEndMinutes / 60)).padStart(2, "0")}:${String(extendedEndMinutes % 60).padStart(2, "0")}`;
        }
      }
    }

    return generateTimeSlots(start, end, 15);
  }, [selectedReservation, editDateRange, offices]);

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
          start = `${String(Math.floor(extendedStartMinutes / 60)).padStart(2, "0")}:${String(extendedStartMinutes % 60).padStart(2, "0")}`;
          end = `${String(Math.floor(extendedEndMinutes / 60)).padStart(2, "0")}:${String(extendedEndMinutes % 60).padStart(2, "0")}`;
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
          start = `${String(Math.floor(extendedStartMinutes / 60)).padStart(2, "0")}:${String(extendedStartMinutes % 60).padStart(2, "0")}`;
          end = `${String(Math.floor(extendedEndMinutes / 60)).padStart(2, "0")}:${String(extendedEndMinutes % 60).padStart(2, "0")}`;
        }
      }
    }

    return generateTimeSlots(start, end, 15);
  }, [selectedReservation, editDateRange, offices]);

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
      if (specialDay && !specialDay.isOpen) return true;
      const workingDay = office.workingTime?.find(
        (w: any) => w.day === dayName,
      );
      if (workingDay && !workingDay.isOpen) return true;
      return false;
    };
  }, [selectedReservation, offices]);

  const priceCalc = usePriceCalculation(
    editDateRange[0].startDate && editTimes.startTime
      ? `${editDateRange[0].startDate.toISOString().split("T")[0]}T${editTimes.startTime}:00`
      : "",
    editDateRange[0].endDate && editTimes.endTime
      ? `${editDateRange[0].endDate.toISOString().split("T")[0]}T${editTimes.endTime}:00`
      : "",
    selectedCategory?.pricingTiers || [],
    selectedCategory?.extrahoursRate || 0,
    pickupExtensionPrice,
    returnExtensionPrice,
    gearExtraCost,
    addOnsCost,
    selectedCategory?.selloffer || 0,
    [],
  );

  useEffect(() => {
    if (selectedGear === "automatic" && selectedCategoryFromList) {
      setGearExtraCost(
        (selectedCategoryFromList.gear?.automaticExtraCost || 0) *
          (priceCalc?.totalDays || 1),
      );
    } else {
      setGearExtraCost(0);
    }
  }, [selectedGear, selectedCategoryFromList, priceCalc?.totalDays]);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData && typeof userData === "object" && userData._id) {
          setUserId(userData._id);
        }
      } catch (error) {
        console.log("Failed to parse user data:", error);
      }
    }
  }, []);

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
      } catch (error) {
        console.log("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

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

  useEffect(() => {
    if (
      !selectedReservation?.office ||
      !editDateRange[0].startDate ||
      !editTimes.startTime
    ) {
      setPickupExtensionPrice(0);
      return;
    }
    const office = offices.find(
      (o) => o._id === (selectedReservation.office as any)?._id,
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
  }, [selectedReservation, editTimes.startTime, editDateRange, offices]);

  useEffect(() => {
    if (
      !selectedReservation?.office ||
      !editDateRange[0].endDate ||
      !editTimes.endTime
    ) {
      setReturnExtensionPrice(0);
      return;
    }
    const office = offices.find(
      (o) => o._id === (selectedReservation.office as any)?._id,
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
  }, [selectedReservation, editTimes.endTime, editDateRange, offices]);

  useEffect(() => {
    if (selectedReservation?.office && editDateRange[0].startDate) {
      const date = editDateRange[0].startDate;
      const startDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      fetch(
        `/api/reservations/by-office?office=${(selectedReservation.office as any)._id}&startDate=${startDate}&type=start&excludeReservation=${selectedReservation._id}`,
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
      const endDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      fetch(
        `/api/reservations/by-office?office=${(selectedReservation.office as any)._id}&endDate=${endDate}&type=end&excludeReservation=${selectedReservation._id}`,
      )
        .then((res) => res.json())
        .then((data) => setEndDateReservedSlots(data.data?.reservedSlots || []))
        .catch((err) => console.log(err));
    }
  }, [selectedReservation, editDateRange]);

  const handleViewDetails = (item: Reservation) => {
    setSelectedReservation(item);
    setEditDateRange([
      {
        startDate: new Date(item.startDate),
        endDate: new Date(item.endDate),
        key: "selection",
      },
    ]);
    const startDate = new Date(item.startDate);
    const endDate = new Date(item.endDate);
    setEditTimes({
      startTime: `${String(startDate.getHours()).padStart(2, "0")}:${String(
        startDate.getMinutes(),
      ).padStart(2, "0")}`,
      endTime: `${String(endDate.getHours()).padStart(2, "0")}:${String(
        endDate.getMinutes(),
      ).padStart(2, "0")}`,
    });
    setSelectedGear((item as any).selectedGear || "manual");
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

  const handleCancelReservation = async () => {
    if (!selectedReservation) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/reservations/${selectedReservation._id}`, {
        method: "PATCH",
        headers: clientAuthHeaders(true),
        body: JSON.stringify({ status: "canceled" }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Cancel failed");

      showToast.success("Reservation canceled successfully!");
      setIsDetailOpen(false);
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Cancel failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDatesUpdate = async () => {
    if (
      !selectedReservation ||
      !editDateRange[0].startDate ||
      !editDateRange[0].endDate
    )
      return;
    setIsSubmitting(true);

    try {
      const startDate = new Date(editDateRange[0].startDate);
      const [startHour, startMin] = editTimes.startTime.split(":").map(Number);
      startDate.setHours(startHour, startMin, 0, 0);

      const endDate = new Date(editDateRange[0].endDate);
      const [endHour, endMin] = editTimes.endTime.split(":").map(Number);
      endDate.setHours(endHour, endMin, 0, 0);

      const res = await fetch(`/api/reservations/${selectedReservation._id}`, {
        method: "PATCH",
        headers: clientAuthHeaders(true),
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          category: (selectedReservation as any).category?._id,
          totalPrice: priceCalc?.totalPrice || selectedReservation.totalPrice,
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
      setIsEditDatesOpen(false);
      setIsDetailOpen(false);
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userId) {
    return <div className="text-gray-400">Loading reservations...</div>;
  }

  return (
    <>
      <DynamicTableView<Reservation>
        apiEndpoint={`/api/reservations?userId=${userId}`}
        title="Reservation"
        hideDelete
        hideViewBtn
        hiddenColumns={[]}
        onEdit={handleViewDetails}
        columns={[
          {
            key: "office" as keyof Reservation,
            label: "Office",
            render: (value: any) => {
              if (typeof value === "object" && value?.name) {
                return value.name;
              }
              return value || "-";
            },
          },
          {
            key: "startDate" as keyof Reservation,
            label: "Start Date",
            render: (value: string) =>
              new Date(value).toLocaleDateString() || "-",
          },
          {
            key: "endDate" as keyof Reservation,
            label: "End Date",
            render: (value: string) =>
              new Date(value).toLocaleDateString() || "-",
          },
          {
            key: "totalPrice" as keyof Reservation,
            label: "Total Price",
            render: (value: any) => {
              if (
                typeof value === "object" &&
                value !== null &&
                value?.amount !== undefined
              ) {
                return <span>£{value.amount}</span>;
              }
              if (typeof value === "number") {
                return <span>£{value}</span>;
              }
              return <span>£0</span>;
            },
          },
          {
            key: "status" as keyof Reservation,
            label: "Status",
            render: (value: string) => (
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  value === "confirmed"
                    ? "bg-green-500/20 text-green-400"
                    : value === "pending"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : value === "canceled"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-blue-500/20 text-blue-400"
                }`}
              >
                {value === "confirmed"
                  ? "Confirmed"
                  : value === "pending"
                    ? "Pending"
                    : value === "canceled"
                      ? "Canceled"
                      : value === "delivered"
                        ? "collected"
                        : "Unknown"}
              </span>
            ),
          },
        ]}
      />

      {isDetailOpen && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2847] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b z-10 border-white/10 bg-[#1a2847]">
              <h2 className="text-2xl font-black text-white">
                Reservation Details
              </h2>
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
                    <p className="text-gray-400">Gear Type</p>
                    <p className="text-white font-semibold">
                      {(selectedReservation as any).selectedGear || "Manual"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Start Date & Time</p>
                    <p className="text-white font-semibold">
                      {(selectedReservation as any).startDateDisplay &&
                      (selectedReservation as any).pickupTime
                        ? `${(selectedReservation as any).startDateDisplay} ${(selectedReservation as any).pickupTime}`
                        : new Date(selectedReservation.startDate).toLocaleString(
                            "en-GB",
                            { timeZone: "Europe/London" },
                          )}
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
                    <p className="text-gray-400">Gear Type</p>
                    <p className="text-white font-semibold">
                      {(selectedReservation as any).selectedGear || "Manual"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Status</p>
                    <p
                      className={`font-semibold ${
                        selectedReservation.status === "confirmed"
                          ? "text-green-400"
                          : selectedReservation.status === "pending"
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {selectedReservation.status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Add-ons */}
              {selectedReservation.addOns &&
                selectedReservation.addOns.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h3 className="text-white font-semibold mb-3">Add-ons</h3>
                    <div className="space-y-2">
                      {selectedAddOns.map((item: any, idx: number) => {
                        const addon =
                          addOns.find((a) => a._id === item.addOn) ||
                          item.addOn;
                        return (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-sm"
                          >
                            <span className="text-white font-semibold">
                              {addon?.name || "Unknown"}
                            </span>
                            <span className="text-gray-400">
                              Qty: {item.quantity}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Edit Section */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3">
                  Edit Reservation
                </h3>
                <button
                  onClick={() => setIsEditDatesOpen(!isEditDatesOpen)}
                  className="w-full px-4 py-2 bg-[#fe9a00]/20 text-[#fe9a00] rounded-lg hover:bg-[#fe9a00]/30 transition-colors font-semibold text-sm"
                >
                  Edit Dates, Times & Add-ons
                </button>

                {isEditDatesOpen && (
                  <div className="mt-4 space-y-3">
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
                            const workingDay = office?.workingTime?.find(
                              (w: any) => w.day === dayName && w.isOpen,
                            );
                            const specialDay = office
                              ? findSpecialDayForDate(office.specialDays, date)
                              : undefined;
                            const specialDayInfo =
                              specialDay && specialDay.isOpen
                                ? {
                                    reason:
                                      specialDay.reason || "Special Day",
                                    price: specialDay.extraPrice || 0,
                                  }
                                : undefined;
                            const extensionTimes =
                              !specialDayInfo && workingDay?.pickupExtension
                                ? {
                                    start: pickupTimeSlots[0],
                                    end: pickupTimeSlots[
                                      pickupTimeSlots.length - 1
                                    ],
                                    normalStart:
                                      workingDay.startTime || "00:00",
                                    normalEnd:
                                      workingDay.endTime || "23:59",
                                    price: workingDay.pickupExtension.flatPrice,
                                  }
                                : undefined;
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
                            const workingDay = office?.workingTime?.find(
                              (w: any) => w.day === dayName && w.isOpen,
                            );
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
                            const specialDayInfo =
                              specialDay && specialDay.isOpen
                                ? {
                                    reason:
                                      specialDay.reason || "Special Day",
                                    price: isSamePricedSpecialDay
                                      ? 0
                                      : specialDay.extraPrice || 0,
                                    alreadyCharged: isSamePricedSpecialDay,
                                  }
                                : undefined;
                            const extensionTimes =
                              !specialDayInfo && workingDay?.returnExtension
                                ? {
                                    start: returnTimeSlots[0],
                                    end: returnTimeSlots[
                                      returnTimeSlots.length - 1
                                    ],
                                    normalStart:
                                      workingDay.startTime || "00:00",
                                    normalEnd:
                                      workingDay.endTime || "23:59",
                                    price: workingDay.returnExtension.flatPrice,
                                  }
                                : undefined;
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
                            {selectedCategoryFromList?.gear?.automaticExtraCost >
                              0 &&
                              ` (+£${selectedCategoryFromList.gear.automaticExtraCost}/day)`}
                          </option>
                        </select>
                      ) : (
                        <div className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-400 text-sm">
                          {selectedGear === "automatic" ? "Automatic" : "Manual"}
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

                    {priceCalc && (
                      <div className="bg-[#fe9a00]/10 border border-[#fe9a00]/30 rounded-lg p-3">
                        <p className="text-white text-sm font-semibold mb-1">
                          New Total Price
                        </p>
                        <p className="text-[#fe9a00] text-2xl font-black">
                          £{priceCalc.totalPrice}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {priceCalc.breakdown}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleDatesUpdate}
                      disabled={isSubmitting}
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
                />
              )}

              {/* Cancel Button */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCancelReservation}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors font-semibold disabled:opacity-50"
                >
                  Cancel Reservation
                </button>
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

      <ReservationDetailsModal
        reservation={selectedReservation}
        isOpen={false}
        onClose={() => setIsDetailOpen(false)}
      />
    </>
  );
}
function DiscountsContent() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const res = await fetch("/api/discounts?status=active");
      const data = await res.json();
      if (data.success) {
        const activeDiscounts = (data.data.data || data.data).filter(
          (d: any) => {
            const now = new Date();
            const validFrom = new Date(d.validFrom);
            const validTo = new Date(d.validTo);
            return (
              d.status === "active" &&
              now >= validFrom &&
              now <= validTo &&
              (!d.usageLimit || d.usageCount < d.usageLimit)
            );
          },
        );
        setDiscounts(activeDiscounts);
      }
    } catch (error) {
      console.log("Failed to fetch discounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast.success("Code copied to clipboard!");
  };

  if (loading) {
    return <div className="text-gray-400">Loading discounts...</div>;
  }

  if (discounts.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <FiTag className="text-gray-500 text-5xl mx-auto mb-4" />
        <h3 className="text-xl font-black text-white mb-2">
          No Active Discounts
        </h3>
        <p className="text-gray-400">
          Check back later for new discount codes!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {discounts.map((discount) => (
          <div
            key={discount._id}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#fe9a00]/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-white">{discount.code}</h3>
              <span className="text-2xl font-black text-[#fe9a00]">
                {discount.percentage}%
              </span>
            </div>
            {discount.categories?.length > 0 && (
              <p className="text-gray-400 text-sm mb-2">
                Valid for:{" "}
                {discount.categories.map((c: any) => c.name).join(", ")}
              </p>
            )}
            <p className="text-gray-500 text-xs mb-4">
              Valid until {new Date(discount.validTo).toLocaleDateString()}
              {discount.usageLimit && (
                <span className="ml-2">
                  • {discount.usageLimit - discount.usageCount} uses left
                </span>
              )}
            </p>
            <button
              onClick={() => copyCode(discount.code)}
              className="w-full px-4 py-2 bg-[#fe9a00]/20 text-[#fe9a00] rounded-lg hover:bg-[#fe9a00]/30 transition-colors font-semibold text-sm"
            >
              Copy Code
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
