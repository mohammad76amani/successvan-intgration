"use client";

import Link from "next/link";
import Image from "next/image";

import { useState, useEffect, useMemo } from "react";
import {
  FiHome,
  FiMapPin,
  FiTruck,
  FiCalendar,
  FiClipboard,
  FiMenu,
  FiX,
  FiExternalLink,
  FiChevronRight,
  FiLogOut,
  FiMessageSquare,
  FiBarChart2,
  FiGrid,
  FiMessageCircle,
  FiPackage,
  FiPercent,
  FiPlusCircle,
  FiSun,
  FiVolume2,
  FiUsers,
  FiBook,
  FiDatabase,
  FiArrowUpRight,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiAlertTriangle,
  FiChevronDown,
  FiActivity,
  FiZap,
  FiUser,
  FiArchive,
  FiShield,
} from "react-icons/fi";
import { clientAuthHeaders } from "@/lib/client-auth";
import { HiOutlineSparkles } from "react-icons/hi2";
import { useStats } from "../../hooks/useStats";
import { useRecentReservations } from "../../hooks/useRecentReservations";
import { useFleetStatus } from "../../hooks/useFleetStatus";
import { useOpenTicketsCount } from "../../hooks/useOpenTicketsCount";
import { useAvailableVehicles } from "../../hooks/useAvailableVehicles";
import OfficesContent from "./CreateOfficeForm";
import VehiclesContent from "./CreateVehicleForm";
import CategoriesContent from "./CreateCategoryForm";
import TypesManagement from "./TypesManagement";
import SpecialDaysManagement from "./SpecialDaysManagement";
import AddOnsContent from "./CreateAddOnForm";
import ReservationsManagement from "./ReservationsManagement";
import TestimonialsManagement from "./TestimonialsManagement";
import ContactsManagement from "./ContactsManagement";
import AnnouncementManagement from "./AnnouncementManagement";
import ReportsManagement from "./ReportsManagement";
import { MenuItem } from "../../types/type";
import DiscountManagement from "./DiscountManagement";
import CustomSelect from "../ui/CustomSelect";
import { showToast } from "../../lib/toast";
import AddPostBlog from "./addBlog";
import BlogManagement from "./BlogManagement";
import BucketManager from "./BucketManager";
import TicketsManagement from "./TicketsManagement";
import ContractsManagement from "./ContractsManagement";
import ReservationHistory from "./ReservationHistory";
import TrafficViolationsManagement from "./TrafficViolationsManagement";
import { useDueRefunds } from "@/hooks/useDueRefunds";
import { FiFileText, FiFile } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import AdminProfile from "./AdminProfile";
import {
  ADMIN_DASHBOARD_TAB_IDS,
  hasFullDashboardAccess,
  normalizeRole,
} from "@/lib/roles";

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <FiHome />,
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "type",
    label: "Types",
    icon: <FiPackage />,
    color: "from-purple-500 to-blue-600",
  },
  {
    id: "offices",
    label: "Offices",
    icon: <FiMapPin />,
    color: "from-green-500 to-green-600",
  },
  {
    id: "categories",
    label: "Categories",
    icon: <FiGrid />,
    color: "from-pink-500 to-pink-600",
  },
  {
    id: "vehicles",
    label: "Vehicles",
    icon: <FiTruck />,
    color: "from-orange-500 to-orange-600",
  },
  {
    id: "holidays",
    label: "Holidays",
    icon: <FiSun />,
    color: "from-purple-500 to-purple-600",
  },
  {
    id: "addons",
    label: "AddOns",
    icon: <FiPlusCircle />,
    color: "from-teal-500 to-teal-600",
  },
  {
    id: "discounts",
    label: "Discounts",
    icon: <FiPercent />,
    color: "from-yellow-500 to-yellow-600",
  },
  {
    id: "reserves",
    label: "Reserves",
    icon: <FiClipboard />,
    color: "from-indigo-500 to-indigo-600",
  },
  {
    id: "traffic-violations",
    label: "Traffic Violations",
    icon: <FiShield />,
    color: "from-red-500 to-orange-600",
  },
  {
    id: "reservation-history",
    label: "Reservation History",
    icon: <FiArchive />,
    color: "from-slate-500 to-slate-700",
  },
  {
    id: "contracts",
    label: "Contracts",
    icon: <FiFile />,
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "Testimonial",
    label: "Testimonials",
    icon: <FiMessageCircle />,
    color: "from-cyan-500 to-cyan-600",
  },
  {
    id: "contacts",
    label: "Users",
    icon: <FiUsers />,
    color: "from-cyan-500 to-cyan-600",
  },
  {
    id: "announcements",
    label: "Announcements",
    icon: <FiVolume2 />,
    color: "from-rose-500 to-rose-600",
  },
  {
    id: "reports",
    label: "Reports",
    icon: <FiBarChart2 />,
    color: "from-cyan-500 to-cyan-600",
  },
  {
    id: "tickets",
    label: "Tickets",
    icon: <FiMessageSquare />,
    color: "from-emerald-500 to-emerald-600",
  },
  {
    id: "blogs",
    label: "Add Blog",
    icon: <FiFileText />,
    color: "from-violet-500 to-violet-600",
  },
  {
    id: "manage-blogs",
    label: "Manage Blogs",
    icon: <FiBook />,
    color: "from-indigo-500 to-indigo-600",
  },
  {
    id: "bucket",
    label: "Media Bucket",
    icon: <FiDatabase />,
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: "profile",
    label: "Profile",
    icon: <FiUser />,
    color: "from-blue-500 to-indigo-600",
  },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { pendingCount } = useRecentReservations();
  const { openTicketsCount } = useOpenTicketsCount();
  const { user } = useAuth();

  // Expanded while the mobile drawer is open or the cursor is over the
  // sidebar; expansion overlays the page instead of pushing content.
  const sidebarExpanded = sidebarOpen || sidebarHovered;

  const visibleMenuItems = useMemo(() => {
    if (hasFullDashboardAccess(user?.role)) return menuItems;
    if (normalizeRole(user?.role) === "admin") {
      return menuItems.filter((item) =>
        (ADMIN_DASHBOARD_TAB_IDS as readonly string[]).includes(item.id),
      );
    }
    return [];
  }, [user?.role]);

  const visibleTabIds = useMemo(
    () => visibleMenuItems.map((item) => item.id),
    [visibleMenuItems],
  );
  const fallbackTab = visibleTabIds[0] || "";
  const displayedActiveTab = visibleTabIds.includes(activeTab)
    ? activeTab
    : fallbackTab;

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

  useEffect(() => {
    const handleHashChange = () => {
      if (!visibleTabIds.length) return;
      const hash = window.location.hash.slice(1);
      if (hash && visibleTabIds.includes(hash)) {
        setActiveTab(hash);
        return;
      }
      setActiveTab(
        hasFullDashboardAccess(user?.role) ? "dashboard" : fallbackTab,
      );
    };
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, [fallbackTab, user?.role, visibleTabIds]);

  const handleTabChange = (tabId: string) => {
    if (!visibleTabIds.includes(tabId)) return;
    setActiveTab(tabId);
    window.history.pushState(null, "", `#${tabId}`);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0a101f]">
      {/* Sidebar */}
      <aside
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        className={`fixed left-0 top-0 h-screen bg-[#111827] border-r border-white/5 z-50 transition-all duration-300 flex flex-col
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${sidebarExpanded ? "w-56 shadow-2xl shadow-black/50" : "w-18"}`}
      >
        <div
          className={`h-17.25 flex items-center border-b border-white/5 ${
            !sidebarExpanded ? "justify-center px-2" : "px-4"
          }`}
        >
          {!sidebarExpanded ? (
            <Image
              src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/newww.png"
              alt="SuccessVan"
              width={50}
              height={28}
              className="object-contain mr-3 mt-2"
            />
          ) : (
            <div className="flex items-center justify-center ml-8 mt-4">
              <Image
                src="https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/newww.png"
                alt="SuccessVan"
                width={120}
                height={36}
                className="object-cover"
              />
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {visibleMenuItems.map((item) => (
            <div key={item.id} className="relative group">
              <button
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center cursor-pointer gap-3 px-3 py-2 rounded-lg transition-all duration-200 mb-1
                  ${
                    displayedActiveTab === item.id
                      ? "bg-[#fe9a00] text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }
                  ${!sidebarExpanded ? "justify-center" : ""}`}
              >
                <span
                  className={`text-base shrink-0 ${
                    displayedActiveTab === item.id
                      ? "text-white"
                      : "text-[#fe9a00]"
                  }`}
                >
                  {item.icon}
                </span>
                {sidebarExpanded && (
                  <span
                    className={`${
                      displayedActiveTab === item.id
                        ? "font-bold"
                        : "font-medium"
                    } text-sm truncate flex items-center gap-2`}
                  >
                    {item.label}
                    {item.id === "reserves" && pendingCount > 0 && (
                      <span className="bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
                        {pendingCount}
                      </span>
                    )}
                    {item.id === "tickets" && openTicketsCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
                        {openTicketsCount}
                      </span>
                    )}
                  </span>
                )}
                {!sidebarExpanded && (
                  <>
                    {item.id === "reserves" && pendingCount > 0 && (
                      <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#111827]" />
                    )}
                    {item.id === "tickets" && openTicketsCount > 0 && (
                      <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#111827]" />
                    )}
                  </>
                )}
              </button>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content — margin matches the collapsed sidebar; hover expansion
          overlays the page instead of pushing it. */}
      <main className="lg:ml-18">
        <div className="sticky top-0 bg-[#111827]/95 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between z-40">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors shrink-0"
            >
              {sidebarOpen ? <FiX size={18} /> : <FiMenu size={18} />}
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="truncate">
                  {visibleMenuItems.find(
                    (item) => item.id === displayedActiveTab,
                  )?.label || "Dashboard"}
                </span>
                <span className="hidden md:flex items-center gap-1 text-xs text-gray-400 font-medium shrink-0">
                  <FiCalendar className="text-[#fe9a00] text-sm" />
                  {new Date().toLocaleDateString("en-GB", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </h2>
              <span className="text-xs text-gray-500 hidden sm:block truncate">
                Welcome back, {user?.name || "Admin"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 bg-[#fe9a00] hover:bg-[#e68a00] text-white font-semibold rounded-lg transition-colors text-sm"
            >
              <span>Visit Site</span>
              <FiExternalLink size={14} />
            </Link>
            <div className="flex items-center gap-3 md:bg-white/5 rounded-lg md:px-3 py-1">
              <div className="flex flex-col text-right mr-2 min-w-0">
                <span className="text-white text-xs md:text-sm font-semibold truncate">
                  {user?.name}
                </span>
                <span className="text-gray-400 text-[10px] md:text-xs truncate">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                title="Logout"
                className="p-2 rounded-md hover:bg-white/10 transition"
              >
                <FiLogOut className="text-red-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {displayedActiveTab === "dashboard" && (
            <DashboardContent handleTabChange={handleTabChange} />
          )}
          {displayedActiveTab === "type" && <TypesManagement />}
          {displayedActiveTab === "offices" && <OfficesContent />}
          {displayedActiveTab === "vehicles" && <VehiclesContent />}
          {displayedActiveTab === "holidays" && <SpecialDaysManagement />}
          {displayedActiveTab === "categories" && <CategoriesContent />}
          {displayedActiveTab === "addons" && <AddOnsContent />}
          {displayedActiveTab === "discounts" && <DiscountManagement />}
          {displayedActiveTab === "reserves" && <ReservationsManagement />}
          {displayedActiveTab === "traffic-violations" && (
            <TrafficViolationsManagement />
          )}
          {displayedActiveTab === "reservation-history" && (
            <ReservationHistory />
          )}
          {displayedActiveTab === "contracts" && <ContractsManagement />}
          {displayedActiveTab === "Testimonial" && <TestimonialsManagement />}
          {displayedActiveTab === "contacts" && <ContactsManagement />}
          {displayedActiveTab === "announcements" && <AnnouncementManagement />}
          {displayedActiveTab === "reports" && <ReportsManagement />}
          {displayedActiveTab === "tickets" && <TicketsManagement />}
          {displayedActiveTab === "blogs" && <AddPostBlog />}
          {displayedActiveTab === "manage-blogs" && <BlogManagement />}
          {displayedActiveTab === "bucket" && <BucketManager />}
          {displayedActiveTab === "profile" && <AdminProfile />}
        </div>
      </main>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] rounded-xl border border-white/10 w-full max-w-sm p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">
              Confirm Logout
            </h3>
            <span className="text-sm text-gray-400 block mb-4">
              Are you sure you want to log out?
            </span>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  handleLogout();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
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

// ─── Types ──────────────────────────────────────────────────────
interface DashboardContentProps {
  handleTabChange: (tabId: string) => void;
}

interface Reservation {
  _id: string;
  category: { _id: string; name: string };
  selectedGear?: "manual" | "automatic";
  startDate: string;
  endDate?: string;
  createdAt?: string;
  totalPrice: number;
  vehicle?: {
    _id: string;
    title: string;
    number: string | number;
    keyNumber?: string;
  };
  status: string;
}

interface VehicleGear {
  gearType: "manual" | "automatic";
}
interface DashboardVehicle {
  _id: string;
  title?: string;
  number?: string | number;
  keyNumber?: string;
  available?: boolean;
  category?: string | { _id?: string };
  gear?: { availableTypes?: VehicleGear[] };
  office?: { name?: string };
}

function getVehicleCategoryId(vehicle: DashboardVehicle) {
  return typeof vehicle.category === "string"
    ? vehicle.category
    : vehicle.category?._id;
}

// ─── Inline Skeleton (span, not div — fixes hydration) ──────────
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block bg-white/5 rounded animate-pulse ${className}`}
    />
  );
}

// ─── Dashboard Content ──────────────────────────────────────────
function DashboardContent({ handleTabChange }: DashboardContentProps) {
  const { stats, isLoading: statsLoading } = useStats();
  const {
    reservations,
    pendingCount,
    isLoading: reservationsLoading,
  } = useRecentReservations();

  const { todayActivity, isLoading: fleetLoading } = useFleetStatus();
  const activity = todayActivity as unknown as {
    pickups: Reservation[];
    returns: Reservation[];
  };

  const { openTicketsCount } = useOpenTicketsCount();
  const {
    dueRefunds,
    dueRefundsCount,
    dueRefundsTotal,
    isLoading: dueRefundsLoading,
    error: dueRefundsError,
  } = useDueRefunds();
  const { availableVehicles, isLoading: vehiclesLoading } =
    useAvailableVehicles() as {
      availableVehicles: DashboardVehicle[];
      isLoading: boolean;
    };

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<
    string | null
  >(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [activityExpanded, setActivityExpanded] = useState(true);
  const [reservesExpanded, setReservesExpanded] = useState(true);

  // ── Computed (no fetch) ───────────────────────────────────────
  const availableCount = useMemo(
    () => availableVehicles.filter((v) => v.available).length,
    [availableVehicles],
  );

  const unassignedPickups = useMemo(
    () => (activity.pickups || []).filter((r: Reservation) => !r.vehicle),
    [activity.pickups],
  );

  const noVehiclePickups = useMemo(
    () =>
      unassignedPickups.filter(
        (res: Reservation) =>
          !availableVehicles.some(
            (v) => v.available && getVehicleCategoryId(v) === res.category._id,
          ),
      ),
    [unassignedPickups, availableVehicles],
  );

  const gearMismatchPickups = useMemo(
    () =>
      unassignedPickups.filter((res: Reservation) => {
        const hasExact = availableVehicles.some(
          (v) =>
            v.available &&
            getVehicleCategoryId(v) === res.category._id &&
            res.selectedGear &&
            v.gear?.availableTypes?.some(
              (g) => g.gearType === res.selectedGear,
            ),
        );
        const hasAny = availableVehicles.some(
          (v) => v.available && getVehicleCategoryId(v) === res.category._id,
        );
        return !hasExact && hasAny;
      }),
    [unassignedPickups, availableVehicles],
  );

  const assignablePickups = useMemo(
    () =>
      unassignedPickups.filter((res: Reservation) =>
        availableVehicles.some(
          (v) =>
            v.available &&
            getVehicleCategoryId(v) === res.category._id &&
            res.selectedGear &&
            v.gear?.availableTypes?.some(
              (g) => g.gearType === res.selectedGear,
            ),
        ),
      ),
    [unassignedPickups, availableVehicles],
  );
  const actionableReturns = useMemo(
    () =>
      (activity.returns || []).filter(
        (res: Reservation) => res.status !== "completed",
      ),
    [activity.returns],
  );
  const totalAttentionItems = useMemo(() => {
    let count = 0;

    count += unassignedPickups.length;
    count += actionableReturns.length;
    count += dueRefundsCount;

    if (pendingCount > 0) count += 1;
    if (openTicketsCount > 0) count += 1;

    return count;
  }, [
    unassignedPickups.length,
    actionableReturns.length,
    dueRefundsCount,
    pendingCount,
    openTicketsCount,
  ]);

  const sortedPickups = useMemo(
    () =>
      [...(activity.pickups || [])].sort((a, b) => {
        if (!a.vehicle && b.vehicle) return -1;
        if (a.vehicle && !b.vehicle) return 1;
        return (
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
      }),
    [activity.pickups],
  );

  const sortedReturns = useMemo(
    () =>
      [...(activity.returns || [])].sort(
        (a, b) =>
          new Date(a.endDate || a.startDate).getTime() -
          new Date(b.endDate || b.startDate).getTime(),
      ),
    [activity.returns],
  );

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getHeroMessage = () => {
    if (fleetLoading) return "Loading today's overview...";
    if (totalAttentionItems === 0)
      return "Everything looks good — no urgent actions needed.";
    if (totalAttentionItems === 1) return "1 item needs your attention today.";
    return `${totalAttentionItems} items need your attention today.`;
  };

  // ── Handlers (unchanged) ──────────────────────────────────────
  const handleCompleteReservation = async (reservationId: string) => {
    if (!reservationId) {
      showToast.error("Invalid reservation");
      return;
    }
    try {
      const patchRes = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: clientAuthHeaders(true),
        body: JSON.stringify({ status: "completed" }),
      });
      if (!patchRes.ok) {
        const error = await patchRes.json();
        showToast.error(error.message || "Failed to complete reservation");
        return;
      }
      showToast.success("Reservation completed!");
      window.location.reload();
    } catch {
      showToast.error("Network error.");
    }
  };

  const openAssignModal = (reservationId: string) => {
    setSelectedReservationId(reservationId);
    setSelectedVehicleId("");
    setIsAssignModalOpen(true);
  };

  const assignVehicle = async () => {
    if (!selectedReservationId || !selectedVehicleId) {
      showToast.error("Please select a vehicle");
      return;
    }
    setAssigning(true);
    try {
      const vRes = await fetch(`/api/vehicles/${selectedVehicleId}`, {
        method: "PATCH",
        headers: clientAuthHeaders(true),
        body: JSON.stringify({ available: false }),
      });
      if (!vRes.ok) {
        showToast.error("Failed to update vehicle");
        setAssigning(false);
        return;
      }
      const rRes = await fetch(`/api/reservations/${selectedReservationId}`, {
        method: "PATCH",
        headers: clientAuthHeaders(true),
        body: JSON.stringify({
          vehicle: selectedVehicleId,
          status: "delivered",
        }),
      });
      if (!rRes.ok) {
        await fetch(`/api/vehicles/${selectedVehicleId}`, {
          method: "PATCH",
          headers: clientAuthHeaders(true),
          body: JSON.stringify({ available: true }),
        });
        showToast.error("Failed to assign vehicle");
        setAssigning(false);
        return;
      }
      showToast.success("Vehicle assigned!");
      setIsAssignModalOpen(false);
      setSelectedReservationId(null);
      setSelectedVehicleId("");
      window.location.reload();
    } catch {
      showToast.error("Network error.");
    } finally {
      setAssigning(false);
    }
  };

  // ── Status colors ─────────────────────────────────────────────
  const statusMap: Record<
    string,
    { bg: string; text: string; dot: string; label: string }
  > = {
    pending: {
      bg: "bg-yellow-500/10",
      text: "text-yellow-400",
      dot: "bg-yellow-400",
      label: "Pending",
    },
    confirmed: {
      bg: "bg-green-500/10",
      text: "text-green-400",
      dot: "bg-green-400",
      label: "Confirmed",
    },
    deposit_pending: {
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      dot: "bg-orange-400",
      label: "Deposit Payment",
    },
    deposit_paid: {
      bg: "bg-teal-500/10",
      text: "text-teal-400",
      dot: "bg-teal-400",
      label: "Deposit Paid",
    },
    contract_pending: {
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      dot: "bg-orange-400",
      label: "Contract Signing",
    },
    contract_signed: {
      bg: "bg-teal-500/10",
      text: "text-teal-400",
      dot: "bg-teal-400",
      label: "Contract Signed",
    },
    ready_for_collection: {
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      dot: "bg-cyan-400",
      label: "Ready for Collection",
    },
    handover_in_progress: {
      bg: "bg-purple-500/10",
      text: "text-purple-400",
      dot: "bg-purple-400",
      label: "Handover",
    },
    delivered: {
      bg: "bg-purple-500/10",
      text: "text-purple-400",
      dot: "bg-purple-400",
      label: "Collected",
    },
    vehicle_returned: {
      bg: "bg-sky-500/10",
      text: "text-sky-400",
      dot: "bg-sky-400",
      label: "Returned",
    },
    return_inspection: {
      bg: "bg-sky-500/10",
      text: "text-sky-400",
      dot: "bg-sky-400",
      label: "Inspection",
    },
    deposit_review: {
      bg: "bg-indigo-500/10",
      text: "text-indigo-400",
      dot: "bg-indigo-400",
      label: "Deposit Review",
    },
    refund_processing: {
      bg: "bg-indigo-500/10",
      text: "text-indigo-400",
      dot: "bg-indigo-400",
      label: "Refund Processing",
    },
    refund_completed: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
      label: "Refund Completed",
    },
    completed: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      dot: "bg-blue-400",
      label: "Completed",
    },
    canceled: {
      bg: "bg-red-500/10",
      text: "text-red-400",
      dot: "bg-red-400",
      label: "Canceled",
    },
    expired: {
      bg: "bg-gray-500/10",
      text: "text-gray-400",
      dot: "bg-gray-400",
      label: "Expired",
    },
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* ═══ 1. HERO ═══════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#fe9a00]/8 via-[#111827] to-[#111827] border border-white/5 p-5 sm:p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#fe9a00]/8 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              {getGreeting()}
              <HiOutlineSparkles className="w-5 h-5 text-[#fe9a00]" />
            </h1>
            <span className="text-sm text-white/40 block">
              {getHeroMessage()}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!fleetLoading && (activity.pickups?.length || 0) > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fe9a00]/10 border border-[#fe9a00]/15">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fe9a00] opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#fe9a00]" />
                </span>
                <span className="text-[#fe9a00] text-xs font-semibold">
                  {activity.pickups?.length || 0} pickup
                  {(activity.pickups?.length || 0) !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {!fleetLoading && (activity.returns?.length || 0) > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/15">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span className="text-emerald-400 text-xs font-semibold">
                  {activity.returns?.length || 0} return
                  {(activity.returns?.length || 0) !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {!fleetLoading &&
              (activity.pickups?.length || 0) === 0 &&
              (activity.returns?.length || 0) === 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <FiCheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-white/40 text-xs font-medium">
                    All clear today
                  </span>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* ═══ 2. SUMMARY BAR ════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {[
          {
            label: "Today Pickups",
            value: activity.pickups?.length || 0,
            icon: <FiTruck className="w-4 h-4" />,
            color: "text-[#fe9a00]",
            bg: "bg-[#fe9a00]/10",
            loading: fleetLoading,
          },
          {
            label: "Today Returns",
            value: activity.returns?.length || 0,
            icon: <FiCheckCircle className="w-4 h-4" />,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            loading: fleetLoading,
          },
          {
            label: "Pending Reserves",
            value: pendingCount,
            icon: <FiClock className="w-4 h-4" />,
            color: "text-yellow-400",
            bg: "bg-yellow-500/10",
            loading: false,
            onClick: () => handleTabChange("reserves"),
          },
          {
            label: "Open Tickets",
            value: openTicketsCount,
            icon: <FiMessageSquare className="w-4 h-4" />,
            color: "text-red-400",
            bg: "bg-red-500/10",
            loading: false,
            onClick: () => handleTabChange("tickets"),
          },
          {
            label: "Refunds due",
            value: dueRefundsCount,
            detail: `£${dueRefundsTotal.toFixed(2)}`,
            icon: <FiAlertCircle className="w-4 h-4" />,
            color: "text-red-400",
            bg: "bg-red-500/10",
            loading: dueRefundsLoading,
            onClick: () => handleTabChange("reserves"),
          },
        ].map((item, i) => (
          <button
            key={i}
            onClick={item.onClick}
            disabled={!item.onClick}
            className={`flex items-center gap-3 p-3.5 rounded-xl bg-[#111827] border border-white/5 transition-all duration-200 text-left ${
              item.onClick
                ? "hover:border-white/10 cursor-pointer"
                : "cursor-default"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center ${item.color} shrink-0`}
            >
              {item.icon}
            </div>
            <div className="min-w-0">
              <span className="text-lg font-bold text-white leading-none block">
                {item.loading ? <Skeleton className="w-6 h-5" /> : item.value}
              </span>
              <span className="text-[11px] text-white/35 font-medium mt-0.5 truncate block">
                {item.label}
              </span>
              {item.detail && (
                <span className="mt-0.5 block text-[10px] font-semibold text-red-300/80">
                  {item.detail}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* ═══ 3. NEEDS ATTENTION ════════════════════════════════ */}
      {!fleetLoading && totalAttentionItems > 0 && (
        <div className="rounded-2xl bg-linear-to-br from-red-500/5 via-[#111827] to-[#111827] border border-red-500/10 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2">
            <div className="relative">
              <FiAlertTriangle className="w-4 h-4 text-red-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            </div>
            <h3 className="text-sm font-bold text-white">Needs Attention</h3>
            <span className="text-[10px] font-bold text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full ml-1">
              {totalAttentionItems}
            </span>
          </div>
          <div className="p-4 space-y-2">
            {noVehiclePickups.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActivityExpanded(true);

                  requestAnimationFrame(() => {
                    document.getElementById("today-pickups")?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  });
                }}
                className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10 hover:border-red-500/25 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                    <FiAlertCircle className="w-4 h-4 text-red-400" />
                  </div>

                  <div className="text-left">
                    <span className="text-sm font-semibold text-white block">
                      {noVehiclePickups.length} pickup
                      {noVehiclePickups.length !== 1 ? "s" : ""} — no vehicle
                      available
                    </span>

                    <span className="text-[11px] text-white/30 block mt-0.5">
                      No matching vehicles in these categories
                    </span>
                  </div>
                </div>

                <FiChevronRight className="w-4 h-4 text-white/20 group-hover:text-red-400 transition-colors shrink-0" />
              </button>
            )}
            {gearMismatchPickups.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActivityExpanded(true);

                  requestAnimationFrame(() => {
                    document.getElementById("today-pickups")?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  });
                }}
                className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 hover:border-orange-500/25 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
                    <FiAlertTriangle className="w-4 h-4 text-orange-400" />
                  </div>

                  <div className="text-left">
                    <span className="text-sm font-semibold text-white block">
                      {gearMismatchPickups.length} pickup
                      {gearMismatchPickups.length !== 1 ? "s" : ""} — gearbox
                      mismatch
                    </span>

                    <span className="text-[11px] text-white/30 block mt-0.5">
                      Vehicles available but different gear type
                    </span>
                  </div>
                </div>

                <FiChevronRight className="w-4 h-4 text-white/20 group-hover:text-orange-400 transition-colors shrink-0" />
              </button>
            )}
            {assignablePickups.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActivityExpanded(true);

                  requestAnimationFrame(() => {
                    document.getElementById("today-pickups")?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  });
                }}
                className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-[#fe9a00]/5 border border-[#fe9a00]/10 hover:border-[#fe9a00]/25 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#fe9a00]/15 flex items-center justify-center shrink-0">
                    <FiZap className="w-4 h-4 text-[#fe9a00]" />
                  </div>

                  <div className="text-left">
                    <span className="text-sm font-semibold text-white block">
                      {assignablePickups.length} pickup
                      {assignablePickups.length !== 1 ? "s" : ""} ready to
                      assign
                    </span>

                    <span className="text-[11px] text-white/30 block mt-0.5">
                      Matching vehicles available — assign now
                    </span>
                  </div>
                </div>

                <FiChevronRight className="w-4 h-4 text-white/20 group-hover:text-[#fe9a00] transition-colors shrink-0" />
              </button>
            )}
            {actionableReturns.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActivityExpanded(true);

                  requestAnimationFrame(() => {
                    document.getElementById("today-returns")?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  });
                }}
                className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/25 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <FiCheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>

                  <div className="text-left">
                    <span className="text-sm font-semibold text-white block">
                      {actionableReturns.length} vehicle
                      {actionableReturns.length !== 1 ? "s" : ""} due for return
                      today
                    </span>

                    <span className="text-[11px] text-white/30 block mt-0.5">
                      Check returned vehicles and complete their reservations
                    </span>
                  </div>
                </div>

                <FiChevronRight className="w-4 h-4 text-white/20 group-hover:text-emerald-400 transition-colors shrink-0" />
              </button>
            )}
            {dueRefundsCount > 0 && (
              <button
                type="button"
                onClick={() => handleTabChange("reserves")}
                className="group flex w-full items-center justify-between gap-3 rounded-xl border border-red-500/15 bg-red-500/[0.06] p-3 transition-all hover:border-red-500/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
                    <FiAlertCircle className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="text-left">
                    <span className="block text-sm font-semibold text-white">
                      {dueRefundsCount} deposit refund
                      {dueRefundsCount !== 1 ? "s" : ""} due
                    </span>
                    <span className="mt-0.5 block text-[11px] text-white/30">
                      £{dueRefundsTotal.toFixed(2)} must be processed
                    </span>
                  </div>
                </div>
                <FiChevronRight className="h-4 w-4 shrink-0 text-white/20 transition-colors group-hover:text-red-400" />
              </button>
            )}
            {pendingCount > 0 && (
              <button
                onClick={() => handleTabChange("reserves")}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10 hover:border-yellow-500/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/15 flex items-center justify-center shrink-0">
                    <FiClock className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold text-white block">
                      {pendingCount} pending reservation
                      {pendingCount !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[11px] text-white/30 block mt-0.5">
                      Awaiting confirmation
                    </span>
                  </div>
                </div>
                <FiChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
              </button>
            )}
            {openTicketsCount > 0 && (
              <button
                onClick={() => handleTabChange("tickets")}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
                    <FiMessageSquare className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold text-white block">
                      {openTicketsCount} open ticket
                      {openTicketsCount !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[11px] text-white/30 block mt-0.5">
                      Require response
                    </span>
                  </div>
                </div>
                <FiChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Due deposit refunds use the same deadline as the customer countdown. */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111827]">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
              <FiAlertCircle className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-white">
                Deposits to refund
              </h3>
              <p className="mt-0.5 text-[11px] text-white/30">
                Approved refunds whose payment deadline has arrived
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {!dueRefundsLoading && (
              <div className="text-right">
                <span className="block text-sm font-bold text-white">
                  £{dueRefundsTotal.toFixed(2)}
                </span>
                <span className="block text-[10px] text-white/30">
                  {dueRefundsCount} due
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => handleTabChange("reserves")}
              className="rounded-lg border border-[#fe9a00]/20 bg-[#fe9a00]/10 px-3 py-1.5 text-xs font-bold text-[#fe9a00] transition-colors hover:bg-[#fe9a00]/15"
            >
              View reserves
            </button>
          </div>
        </div>

        <div className="p-4">
          {dueRefundsLoading ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {[1, 2].map((item) => (
                <Skeleton key={item} className="block h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : dueRefundsError ? (
            <div className="rounded-xl border border-red-500/10 bg-red-500/[0.04] px-4 py-3 text-sm text-red-300">
              Due refunds could not be loaded. The dashboard will retry
              automatically.
            </div>
          ) : dueRefunds.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] px-4 py-3">
              <FiCheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-white">
                  No deposit refunds are due
                </p>
                <p className="mt-0.5 text-[11px] text-white/30">
                  Approved refunds will appear here when their deadline arrives.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {dueRefunds.slice(0, 6).map((reservation) => {
                const customer =
                  [reservation.user?.name, reservation.user?.lastName]
                    .filter(Boolean)
                    .join(" ") || "Customer";
                const vehicle =
                  reservation.vehicle || reservation.vehicleSnapshot;
                const expectedBy = reservation.refund?.expectedBy
                  ? new Date(reservation.refund.expectedBy)
                  : null;
                const londonDay = new Intl.DateTimeFormat("en-CA", {
                  timeZone: "Europe/London",
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                });
                const dueToday =
                  expectedBy &&
                  londonDay.format(expectedBy) === londonDay.format(new Date());

                return (
                  <button
                    key={reservation._id}
                    type="button"
                    onClick={() => handleTabChange("reserves")}
                    className="group flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 text-left transition-all hover:border-[#fe9a00]/20 hover:bg-white/[0.04]"
                  >
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-bold text-white">
                          {reservation.reservationCode || reservation._id}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                            dueToday
                              ? "bg-orange-500/15 text-orange-300"
                              : "bg-red-500/15 text-red-300"
                          }`}
                        >
                          {dueToday ? "Due today" : "Overdue"}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-white/55">
                        {customer} · {vehicle?.title || "Vehicle not recorded"}
                        {vehicle?.number ? ` · ${vehicle.number}` : ""}
                      </p>
                      <p className="mt-1 text-[10px] text-white/25">
                        Expected{" "}
                        {expectedBy
                          ? expectedBy.toLocaleString("en-GB", {
                              timeZone: "Europe/London",
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-black text-[#fe9a00]">
                      £
                      {Number(reservation.refund?.refundAmount || 0).toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ 4. KPI CARDS ══════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Vehicles",
            value: stats.vehicles,
            sub: `${availableCount} available`,
            icon: <FiTruck className="w-5 h-5" />,
            gradient: "from-orange-500 to-amber-600",
            tabId: "vehicles",
          },
          {
            label: "Reservations",
            value: stats.reservations,
            sub: pendingCount > 0 ? `${pendingCount} pending` : "All handled",
            icon: <FiClipboard className="w-5 h-5" />,
            gradient: "from-indigo-500 to-purple-600",
            tabId: "reserves",
          },
          {
            label: "Offices",
            value: stats.offices,
            sub: "Locations active",
            icon: <FiMapPin className="w-5 h-5" />,
            gradient: "from-emerald-500 to-teal-600",
            tabId: "offices",
          },
          {
            label: "Categories",
            value: stats.categories,
            sub: "Vehicle groups",
            icon: <FiGrid className="w-5 h-5" />,
            gradient: "from-pink-500 to-rose-600",
            tabId: "categories",
          },
        ].map((stat, i) => (
          <button
            key={i}
            onClick={() => handleTabChange(stat.tabId)}
            className="group relative overflow-hidden bg-[#111827] border border-white/5 rounded-2xl p-4 sm:p-5 hover:border-white/10 transition-all duration-300 text-left"
          >
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-linear-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  {stat.icon}
                </div>
                <FiArrowUpRight className="w-4 h-4 text-white/15 group-hover:text-white/40 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-white mb-0.5 block">
                {statsLoading ? <Skeleton className="w-10 h-7" /> : stat.value}
              </span>
              <span className="text-white/35 text-xs font-medium block">
                {stat.label}
              </span>
              <span className="text-white/20 text-[10px] mt-1 block">
                {stat.sub}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* ═══ 5. FLEET STATUS ═══════════════════════════════════ */}
      <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <FiActivity className="w-4 h-4 text-[#fe9a00]" />
          <h3 className="text-sm font-bold text-white">Fleet Status</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Available",
              value: availableCount,
              total: (stats.vehicles as number) || 0,
              color: "bg-emerald-500",
              textColor: "text-emerald-400",
            },
            {
              label: "In Use",
              value: ((stats.vehicles as number) || 0) - availableCount,
              total: (stats.vehicles as number) || 0,
              color: "bg-[#fe9a00]",
              textColor: "text-[#fe9a00]",
            },
            {
              label: "Pickups Today",
              value: activity.pickups?.length || 0,
              total: Math.max(activity.pickups?.length || 0, 10),
              color: "bg-blue-500",
              textColor: "text-blue-400",
            },
            {
              label: "Returns Today",
              value: activity.returns?.length || 0,
              total: Math.max(activity.returns?.length || 0, 10),
              color: "bg-purple-500",
              textColor: "text-purple-400",
            },
          ].map((item, i) => {
            const pct =
              item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
            return (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-white/40 font-medium">
                    {item.label}
                  </span>
                  <span className={`text-sm font-bold ${item.textColor}`}>
                    {statsLoading || fleetLoading ? (
                      <Skeleton className="w-5 h-4" />
                    ) : (
                      item.value
                    )}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-700 ease-out`}
                    style={{
                      width:
                        statsLoading || fleetLoading
                          ? "0%"
                          : `${Math.min(pct, 100)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ 6. TODAY'S ACTIVITY ═══════════════════════════════ */}
      <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
        <button className="w-full px-5 py-4 border-b border-white/5 flex items-center justify-between hover:bg-white/2 transition-colors">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FiClock className="w-4 h-4 text-[#fe9a00]" />
            Today&apos;s Activity
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-white/25 font-medium hidden sm:inline">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
            <FiChevronDown
              className={`w-4 h-4 text-white/30 transition-transform duration-200 ${activityExpanded ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {activityExpanded && (
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
            {/* Pickups */}
            <div id="today-pickups" className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fe9a00] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#fe9a00]" />
                  </span>
                  Pickups
                </h4>
                <span className="text-xs text-gray-500 bg-white/5 px-2.5 py-1 rounded-full font-medium">
                  {activity.pickups?.length || 0}
                </span>
              </div>

              {fleetLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      className="h-20 w-full rounded-xl block"
                    />
                  ))}
                </div>
              ) : sortedPickups.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <FiTruck className="w-5 h-5 text-white/15" />
                  </div>
                  <span className="text-white/25 text-sm font-medium block">
                    No pickups scheduled
                  </span>
                  <span className="text-white/15 text-xs mt-1 block">
                    All clear for today
                  </span>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                  {sortedPickups.map((res) => {
                    const hasExact = availableVehicles.some(
                      (v) =>
                        v.available &&
                        getVehicleCategoryId(v) === res.category._id &&
                        res.selectedGear &&
                        v.gear?.availableTypes?.some(
                          (g) => g.gearType === res.selectedGear,
                        ),
                    );
                    const hasAny = availableVehicles.some(
                      (v) =>
                        v.available &&
                        getVehicleCategoryId(v) === res.category._id,
                    );
                    const isUnassigned = !res.vehicle;

                    return (
                      <div
                        key={res._id}
                        className={`group relative rounded-xl p-3.5 transition-all duration-200 ${
                          isUnassigned
                            ? "bg-red-500/3 border border-red-500/10 hover:border-red-500/20"
                            : "bg-white/3 border border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div
                          className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ${
                            isUnassigned
                              ? "bg-linear-to-b from-red-500 to-red-500/20"
                              : "bg-linear-to-b from-[#fe9a00] to-[#fe9a00]/20"
                          }`}
                        />
                        <div className="flex justify-between items-start gap-3 pl-2">
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-white text-sm truncate block">
                              {res.vehicle
                                ? `${res.vehicle.title} (${res.vehicle.number})${res.vehicle.keyNumber ? ` [Key: ${res.vehicle.keyNumber}]` : ""}`
                                : "No vehicle assigned"}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 text-[11px] text-white/35 bg-white/5 px-2 py-0.5 rounded-md">
                                <FiGrid className="w-2.5 h-2.5" />
                                {res.category.name}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] text-white/35 bg-white/5 px-2 py-0.5 rounded-md">
                                <FiClock className="w-2.5 h-2.5" />
                                {new Date(res.startDate).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>
                              {res.selectedGear && (
                                <span className="inline-flex items-center text-[11px] text-[#fe9a00] bg-[#fe9a00]/10 px-2 py-0.5 rounded-md font-medium uppercase">
                                  {res.selectedGear}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-bold text-[#fe9a00] mt-2 block">
                              £{res.totalPrice}
                            </span>
                          </div>
                          <div className="shrink-0">
                            {isUnassigned && hasExact && (
                              <button
                                onClick={() => openAssignModal(res._id)}
                                className="px-3.5 py-2 text-xs bg-linear-to-r from-[#fe9a00] to-amber-600 hover:from-[#e68a00] hover:to-amber-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-[#fe9a00]/20 hover:scale-[1.02] active:scale-[0.98]"
                              >
                                Assign
                              </button>
                            )}
                            {isUnassigned && !hasExact && hasAny && (
                              <div className="text-right max-w-30">
                                <div className="flex items-center justify-end gap-1">
                                  <FiAlertTriangle className="w-3 h-3 text-orange-400 shrink-0" />
                                  <span className="text-[11px] text-orange-400 font-medium">
                                    Gear mismatch
                                  </span>
                                </div>
                              </div>
                            )}
                            {isUnassigned && !hasAny && (
                              <div className="flex items-center gap-1 px-2 py-1.5 bg-red-500/10 border border-red-500/15 rounded-lg">
                                <FiAlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                                <span className="text-[11px] text-red-400 font-medium">
                                  No vehicle
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Returns */}
            <div id="today-returns" className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Returns
                </h4>
                <span className="text-xs text-gray-500 bg-white/5 px-2.5 py-1 rounded-full font-medium">
                  {activity.returns?.length || 0}
                </span>
              </div>

              {fleetLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      className="h-20 w-full rounded-xl block"
                    />
                  ))}
                </div>
              ) : sortedReturns.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <FiCheckCircle className="w-5 h-5 text-white/15" />
                  </div>
                  <span className="text-white/25 text-sm font-medium block">
                    No returns due
                  </span>
                  <span className="text-white/15 text-xs mt-1 block">
                    Everything on track
                  </span>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                  {sortedReturns.map((res) => (
                    <div
                      key={res._id}
                      className="group relative bg-white/3 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-xl p-3.5 transition-all duration-200"
                    >
                      <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-linear-to-b from-emerald-500 to-emerald-500/20" />
                      <div className="flex justify-between items-start gap-3 pl-2">
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-white text-sm truncate block">
                            {res.vehicle
                              ? `${res.vehicle.title} (${res.vehicle.number})${res.vehicle.keyNumber ? ` [Key: ${res.vehicle.keyNumber}]` : ""}`
                              : "No vehicle assigned"}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[11px] text-white/35 bg-white/5 px-2 py-0.5 rounded-md">
                              <FiGrid className="w-2.5 h-2.5" />
                              {res.category.name}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-white/35 bg-white/5 px-2 py-0.5 rounded-md">
                              <FiClock className="w-2.5 h-2.5" />
                              Due{" "}
                              {new Date(
                                res.endDate || res.startDate,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-emerald-400 mt-2 block">
                            £{res.totalPrice}
                          </span>
                        </div>
                        {res.status === "delivered" ? (
                          <button
                            onClick={() => handleCompleteReservation(res._id)}
                            className="px-3.5 py-2 text-xs bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-emerald-600/20 shrink-0"
                          >
                            Complete
                          </button>
                        ) : (
                          <span className="px-2.5 py-1.5 text-[11px] font-medium text-yellow-400 bg-yellow-500/10 border border-yellow-500/15 rounded-lg capitalize">
                            {res.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══ 7. RECENT RESERVES ════════════════════════════════ */}
      <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
        <button className="w-full px-5 py-4 border-b border-white/5 flex items-center justify-between hover:bg-white/2 transition-colors">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FiClipboard className="w-4 h-4 text-[#fe9a00]" />
            Recent Reserves
          </h3>
          <div className="flex items-center gap-3">
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleTabChange("reserves");
              }}
              className="text-xs font-semibold text-[#fe9a00] hover:text-orange-400 transition-colors flex items-center gap-1"
            >
              View All <FiArrowUpRight className="w-3 h-3" />
            </span>
            <FiChevronDown
              className={`w-4 h-4 text-white/30 transition-transform duration-200 ${reservesExpanded ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {reservesExpanded && (
          <div className="p-5">
            {reservationsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl block" />
                ))}
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <FiClipboard className="w-5 h-5 text-white/15" />
                </div>
                <span className="text-white/25 text-sm font-medium block">
                  No reservations yet
                </span>
                <span className="text-white/15 text-xs mt-1 block">
                  New bookings will appear here
                </span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {reservations.map((res) => {
                  const hasReceiptToVerify =
                    res.deposit?.status === "pending" &&
                    Boolean(res.deposit?.receiptUrl);
                  const sc = hasReceiptToVerify
                    ? {
                        bg: "bg-orange-500/10",
                        text: "text-orange-400",
                        dot: "bg-orange-400",
                        label: "Receipt uploaded",
                      }
                    : statusMap[res.status] || {
                        bg: "bg-gray-500/10",
                        text: "text-gray-400",
                        dot: "bg-gray-400",
                        label: res.status,
                      };
                  return (
                    <div
                      key={res._id}
                      className="group bg-white/3 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-white/70">•</span>
                          <span className="text-white/40 text-xs flex items-center gap-1">
                            <FiCalendar className="w-3 h-3" />
                            {new Date(
                              res.createdAt || res.startDate,
                            ).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${sc.bg} ${sc.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                          />
                          {sc.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <span className="text-white/20 text-[10px] font-medium uppercase tracking-wider block">
                            Total
                          </span>
                          <span className="text-[#fe9a00] font-bold text-sm mt-0.5 block">
                            £{res.totalPrice}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/20 text-[10px] font-medium uppercase tracking-wider block">
                            Pickup
                          </span>
                          <span className="text-white text-sm font-medium mt-0.5 block">
                            {new Date(res.startDate).toLocaleDateString(
                              "en-GB",
                              { day: "numeric", month: "short" },
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/20 text-[10px] font-medium uppercase tracking-wider block">
                            Return
                          </span>
                          <span className="text-white text-sm font-medium mt-0.5 block">
                            {new Date(
                              res.endDate || res.startDate,
                            ).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/20 text-[10px] font-medium uppercase tracking-wider block">
                            Category
                          </span>
                          <span className="text-white text-sm font-medium mt-0.5 truncate block">
                            {res.category.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ ASSIGN MODAL ══════════════════════════════════════ */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-999 flex items-center justify-center p-4">
          <div className="bg-[#111827] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FiTruck className="w-4 h-4 text-[#fe9a00]" />
                Assign Vehicle
              </h3>
              <button
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setSelectedReservationId(null);
                  setSelectedVehicleId("");
                }}
                disabled={assigning}
                className="p-1.5 hover:bg-white/10 rounded-lg transition"
              >
                <FiX className="text-gray-400 text-lg" />
              </button>
            </div>
            <div className="p-5">
              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                  Available Vehicles in Category
                </label>
                {(() => {
                  const cur = activity.pickups.find(
                    (reservation) => reservation._id === selectedReservationId,
                  );
                  if (!cur) return null;
                  const catVehicles = availableVehicles.filter(
                    (v) =>
                      v.available &&
                      getVehicleCategoryId(v) === cur.category._id,
                  );
                  const reqGear = cur.selectedGear;
                  return (
                    <>
                      {reqGear && (
                        <div className="mb-4 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                          <span className="text-sm text-white flex items-center gap-2">
                            <FiAlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                            Customer requested:{" "}
                            <strong className="text-[#fe9a00] uppercase">
                              {reqGear}
                            </strong>{" "}
                            gearbox
                          </span>
                        </div>
                      )}
                      <CustomSelect
                        options={catVehicles.map((v) => {
                          const gears = v.gear?.availableTypes || [];
                          const match = reqGear
                            ? gears.some((g) => g.gearType === reqGear)
                            : true;
                          return {
                            _id: v._id,
                            name: `${v.title || "Vehicle"} (${v.number || "N/A"})${v.keyNumber ? ` [Key: ${v.keyNumber}]` : ""} — ${v.office?.name || "No Office"}`,
                            suffix:
                              gears.length > 0
                                ? ` [${gears.map((g) => g.gearType.toUpperCase()).join("/")}]`
                                : " [No Gear Info]",
                            disabled: !match,
                          };
                        })}
                        value={selectedVehicleId}
                        onChange={setSelectedVehicleId}
                        placeholder={
                          catVehicles.length === 0
                            ? "No vehicles available"
                            : "Select a vehicle..."
                        }
                      />
                      {reqGear &&
                        catVehicles.length > 0 &&
                        !catVehicles.some((v) =>
                          v.gear?.availableTypes?.some(
                            (g) => g.gearType === reqGear,
                          ),
                        ) && (
                          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                            <span className="text-red-400 text-sm font-medium block">
                              ⚠️ No {reqGear} gearbox available
                            </span>
                            <span className="text-xs text-white/30 mt-1 block">
                              You can still assign a different one.
                            </span>
                          </div>
                        )}
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setSelectedReservationId(null);
                  setSelectedVehicleId("");
                }}
                disabled={assigning}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={assignVehicle}
                disabled={!selectedVehicleId || assigning}
                className="flex-1 py-2.5 bg-linear-to-r from-[#fe9a00] to-amber-600 hover:from-[#e68a00] hover:to-amber-700 text-white font-semibold rounded-xl transition text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#fe9a00]/20"
              >
                {assigning ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    Assigning...
                  </span>
                ) : (
                  "Assign & Deliver"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
