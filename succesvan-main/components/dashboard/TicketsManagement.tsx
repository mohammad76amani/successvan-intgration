"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  FiMessageSquare,
  FiX,
  FiSend,
  FiMail,
  FiPhone,
  FiAlertCircle,
  FiCheckCircle,
  FiLoader,
  FiInbox,
  FiFilter,
  FiSearch,
  FiArchive,
  FiChevronDown,
  FiRefreshCw,
  FiCalendar,
  FiCheck,
  FiTruck,
  FiHash,
} from "react-icons/fi";
import { HiOutlineTicket } from "react-icons/hi";
import { showToast } from "@/lib/toast";
import { createPortal } from "react-dom";

interface Message {
  sender: string;
  content: string;
  timestamp: string;
}

interface TicketReservation {
  _id: string;
  reservationCode?: string;
  office?: {
    _id?: string;
    name?: string;
    address?: string;
  } | null;
  category?: {
    _id?: string;
    name?: string;
  } | null;
  vehicle?: {
    _id?: string;
    title?: string;
    number?: string;
    keyNumber?: string;
  } | null;
  startDate: string;
  endDate: string;
  startDateDisplay?: string;
  endDateDisplay?: string;
  pickupTime?: string;
  returnTime?: string;
  totalPrice?: number;
  status: string;
  selectedGear?: string;
  reservationType?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Ticket {
  _id: string;
  userId: {
    _id: string;
    name: string;
    lastName: string;
    email: string;
    emaildata?: {
      emailAddress?: string;
    };
    phoneData?: {
      phoneNumber?: string;
    };
  };
  subject: string;
  status: string;
  priority: string;
  messages: Message[];
  lastReservation?: TicketReservation | null;
  createdAt: string;
  updatedAt: string;
}

type SortField = "updatedAt" | "createdAt" | "priority" | "status";
type SortOrder = "asc" | "desc";

const STATUS_ORDER: Record<string, number> = {
  open: 0,
  "in-progress": 1,
  resolved: 2,
  closed: 3,
};

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "open":
      return {
        bg: "bg-red-500/20",
        border: "border-red-500/30",
        text: "text-red-400",
        icon: <FiAlertCircle className="w-3 h-3" />,
        glow: "shadow-red-500/20",
        label: "Open",
      };
    case "in-progress":
      return {
        bg: "bg-amber-500/20",
        border: "border-amber-500/30",
        text: "text-amber-400",
        icon: <FiLoader className="w-3 h-3 animate-spin" />,
        glow: "shadow-amber-500/20",
        label: "In Progress",
      };
    case "resolved":
      return {
        bg: "bg-emerald-500/20",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        icon: <FiCheckCircle className="w-3 h-3" />,
        glow: "shadow-emerald-500/20",
        label: "Resolved",
      };
    case "closed":
      return {
        bg: "bg-slate-500/20",
        border: "border-slate-500/30",
        text: "text-slate-400",
        icon: <FiArchive className="w-3 h-3" />,
        glow: "shadow-slate-500/20",
        label: "Closed",
      };
    default:
      return {
        bg: "bg-slate-500/20",
        border: "border-slate-500/30",
        text: "text-slate-400",
        icon: null,
        glow: "",
        label: status,
      };
  }
};

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case "urgent":
      return {
        bg: "bg-red-500/20",
        border: "border-red-500/30",
        text: "text-red-300",
        pulse: true,
        label: "Urgent",
      };
    case "high":
      return {
        bg: "bg-orange-500/20",
        border: "border-orange-500/30",
        text: "text-orange-300",
        pulse: false,
        label: "High",
      };
    case "medium":
      return {
        bg: "bg-yellow-500/20",
        border: "border-yellow-500/30",
        text: "text-yellow-300",
        pulse: false,
        label: "Medium",
      };
    case "low":
      return {
        bg: "bg-green-500/20",
        border: "border-green-500/30",
        text: "text-green-300",
        pulse: false,
        label: "Low",
      };
    default:
      return {
        bg: "bg-slate-500/20",
        border: "border-slate-500/30",
        text: "text-slate-400",
        pulse: false,
        label: priority,
      };
  }
};

const timeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

// ─── Compact Ticket Card (Grid-friendly) ─────────────────────────
const formatCurrency = (value: unknown) => {
  const amount = Number(value);
  return `GBP ${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"}`;
};

const formatReservationDateTime = (
  reservation: TicketReservation,
  type: "pickup" | "return",
) => {
  const displayDate =
    type === "pickup"
      ? reservation.startDateDisplay
      : reservation.endDateDisplay;
  const displayTime =
    type === "pickup" ? reservation.pickupTime : reservation.returnTime;

  if (displayDate && displayTime) return `${displayDate} ${displayTime}`;

  const dateValue =
    type === "pickup" ? reservation.startDate : reservation.endDate;
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleString("en-GB", {
    timeZone: "Europe/London",
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getReservationStatusClass = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-500/15 text-yellow-300 border-yellow-500/20";
    case "confirmed":
      return "bg-blue-500/15 text-blue-300 border-blue-500/20";
    case "delivered":
      return "bg-purple-500/15 text-purple-300 border-purple-500/20";
    case "completed":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/20";
    case "canceled":
      return "bg-red-500/15 text-red-300 border-red-500/20";
    default:
      return "bg-slate-500/15 text-slate-300 border-slate-500/20";
  }
};

const getReservationCode = (reservation: TicketReservation) =>
  reservation.reservationCode || reservation._id;

const getReservationStatusLabel = (status: string) =>
  status === "delivered" ? "collected" : status;

const getUserEmail = (ticket: Ticket) =>
  ticket.userId?.emaildata?.emailAddress || ticket.userId?.email || "";

const getUserPhone = (ticket: Ticket) =>
  ticket.userId?.phoneData?.phoneNumber || "";

const getCustomerName = (ticket: Ticket) =>
  `${ticket.userId?.name || ""} ${ticket.userId?.lastName || ""}`.trim() ||
  "Customer";

const getCustomerInitials = (ticket: Ticket) =>
  `${ticket.userId?.name?.[0] || ""}${ticket.userId?.lastName?.[0] || ""}`
    .trim()
    .toUpperCase() || "C";

const formatMessageTimestamp = (dateString: string) =>
  new Date(dateString).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const getVehicleLabel = (reservation?: TicketReservation | null) => {
  if (!reservation?.vehicle) return "-";
  const title = reservation.vehicle.title || "Vehicle";
  const number = reservation.vehicle.number
    ? ` (${reservation.vehicle.number})`
    : "";
  const keyNumber = reservation.vehicle.keyNumber
    ? ` - Key ${reservation.vehicle.keyNumber}`
    : "";
  return `${title}${number}${keyNumber}`;
};

function TicketCard({
  ticket,
  onView,
  onStatusChange,
  isClosed = false,
}: {
  ticket: Ticket;
  onView: (ticket: Ticket) => void;
  onStatusChange: (ticketId: string, status: string) => void;
  isClosed?: boolean;
}) {
  const statusConfig = getStatusConfig(ticket.status);
  const priorityConfig = getPriorityConfig(ticket.priority);
  const lastMessage =
    ticket.messages.length > 0
      ? ticket.messages[ticket.messages.length - 1]
      : null;
  const lastReservation = ticket.lastReservation;

  return (
    <div
      className={`group relative flex min-h-[280px] flex-col overflow-hidden rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/25 cursor-pointer ${
        isClosed
          ? "bg-white/[0.025] border border-white/[0.06] hover:border-white/12 opacity-75 hover:opacity-100"
          : "bg-[#111827] border border-white/[0.08] hover:border-[#fe9a00]/25"
      }`}
      onClick={() => onView(ticket)}
    >
      <div
        className={`h-1 ${priorityConfig.bg} ${
          priorityConfig.pulse ? "animate-pulse" : ""
        }`}
      />

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fe9a00]/12 text-xs font-bold text-[#fe9a00] ring-1 ring-[#fe9a00]/20">
              {getCustomerInitials(ticket)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white/80">
                {getCustomerName(ticket)}
              </p>
              <p className="truncate text-[11px] text-white/32">
                {getUserEmail(ticket) || getUserPhone(ticket) || "No contact"}
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-md bg-white/[0.035] px-2 py-1 text-[10px] text-white/35">
            {timeAgo(ticket.updatedAt)}
          </span>
        </div>

        <h3
          className={`mb-3 min-h-[40px] text-[15px] font-semibold leading-snug line-clamp-2 ${
            isClosed
              ? "text-white/45"
              : "text-white group-hover:text-[#fe9a00] transition-colors"
          }`}
        >
          {ticket.subject}
        </h3>

        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text} border`}
          >
            {statusConfig.icon}
            {statusConfig.label}
          </span>
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-medium ${priorityConfig.bg} ${priorityConfig.border} ${priorityConfig.text} border`}
          >
            {priorityConfig.label}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.035] px-2 py-1 text-[10px] text-white/35">
            <FiMessageSquare className="h-3 w-3" />
            {ticket.messages.length}
          </span>
        </div>

        {lastMessage && (
          <div className="mb-3 border-l-2 border-white/10 pl-3">
            <p className="line-clamp-2 text-xs leading-relaxed text-white/42">
              {lastMessage.content}
            </p>
            <p className="mt-1 text-[10px] text-white/22">
              {formatMessageTimestamp(lastMessage.timestamp)}
            </p>
          </div>
        )}

        <div className="mt-auto space-y-3">
          <div className="border-t border-white/[0.06] pt-3">
            {lastReservation ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-white/70">
                    <FiTruck className="h-3.5 w-3.5 shrink-0 text-[#fe9a00]/70" />
                    <span className="truncate">
                      {lastReservation.category?.name || "Reservation"}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-medium capitalize ${getReservationStatusClass(
                      lastReservation.status,
                    )}`}
                  >
                    {getReservationStatusLabel(lastReservation.status)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="min-w-0">
                    <p className="text-white/25">Pickup</p>
                    <p className="truncate text-white/52">
                      {formatReservationDateTime(lastReservation, "pickup")}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white/25">Return</p>
                    <p className="truncate text-white/52">
                      {formatReservationDateTime(lastReservation, "return")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 text-[10px] text-white/30">
                  <span className="inline-flex min-w-0 items-center gap-1 truncate">
                    <FiHash className="h-3 w-3 shrink-0" />
                    {getReservationCode(lastReservation)}
                  </span>
                  <span className="shrink-0">
                    {formatCurrency(lastReservation.totalPrice)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[11px] text-white/28">
                <FiCalendar className="h-3.5 w-3.5 shrink-0" />
                <span>No previous reservation</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
            <span className="flex items-center gap-1 text-[10px] text-white/28">
              <FiCalendar className="h-3 w-3" />
              {new Date(ticket.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>

            <div className="min-w-28" onClick={(e) => e.stopPropagation()}>
              <CustomSelect
                value={ticket.status}
                onChange={(value) => onStatusChange(ticket._id, value)}
                options={[
                  { _id: "open", name: "Open" },
                  { _id: "in-progress", name: "In Progress" },
                  { _id: "resolved", name: "Resolved" },
                  { _id: "closed", name: "Closed" },
                ]}
                placeholder="Status"
                compact
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────
export default function TicketsManagement() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField] = useState<SortField>("updatedAt");
  const [sortOrder] = useState<SortOrder>("desc");
  const [showClosedSection, setShowClosedSection] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (isDetailOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isDetailOpen]);

  useEffect(() => {
    if (isDetailOpen && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isDetailOpen, selectedTicket?.messages]);

  const fetchTickets = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/tickets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTickets(data.data);
      } else {
        const errorData = await response.json();
        showToast.error(errorData.error || "Failed to fetch tickets");
      }
    } catch (error) {
      console.log("Error fetching tickets:", error);
      showToast.error("Error fetching tickets");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleViewTicket = useCallback((ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDetailOpen(true);
    setReplyMessage("");
  }, []);

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tickets/${selectedTicket._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ message: replyMessage }),
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedTicket(data.data);
        setReplyMessage("");
        if (textareaRef.current) textareaRef.current.style.height = "52px";
        fetchTickets();
        showToast.success("Reply sent successfully");
      } else {
        showToast.error("Failed to send reply");
      }
    } catch (error) {
      console.log("Error sending reply:", error);
      showToast.error("Error sending reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        const data = await response.json();
        if (selectedTicket?._id === ticketId) setSelectedTicket(data.data);
        fetchTickets();
        showToast.success("Status updated");
      } else {
        showToast.error("Failed to update status");
      }
    } catch (error) {
      console.log("Error:", error);
      showToast.error("Error updating status");
    }
  };

  const { activeTickets, closedTickets } = useMemo(() => {
    let filtered = tickets.filter((ticket) => {
      const q = searchQuery.toLowerCase();
      if (!q) return true;
      return (
        ticket.subject.toLowerCase().includes(q) ||
        ticket?.userId?.name?.toLowerCase().includes(q) ||
        ticket?.userId?.lastName?.toLowerCase().includes(q) ||
        ticket?.userId?.email?.toLowerCase().includes(q) ||
        ticket?.userId?.emaildata?.emailAddress?.toLowerCase().includes(q) ||
        ticket?.lastReservation?.reservationCode?.toLowerCase().includes(q) ||
        ticket._id.toLowerCase().includes(q)
      );
    });

    if (filterPriority !== "all")
      filtered = filtered.filter((t) => t.priority === filterPriority);
    if (filterStatus !== "all")
      filtered = filtered.filter((t) => t.status === filterStatus);

    const sortFn = (a: Ticket, b: Ticket): number => {
      let cmp = 0;
      switch (sortField) {
        case "updatedAt":
          cmp =
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          break;
        case "createdAt":
          cmp =
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case "priority":
          cmp =
            (PRIORITY_ORDER[a.priority] ?? 99) -
            (PRIORITY_ORDER[b.priority] ?? 99);
          break;
        case "status":
          cmp = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
          break;
      }
      return sortOrder === "asc" ? -cmp : cmp;
    };

    const active = filtered
      .filter((t) => t.status !== "closed")
      .sort((a, b) => {
        const sd =
          (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
        if (sd !== 0) return sd;
        return sortFn(a, b);
      });

    const closed = filtered.filter((t) => t.status === "closed").sort(sortFn);
    return { activeTickets: active, closedTickets: closed };
  }, [
    tickets,
    searchQuery,
    filterStatus,
    filterPriority,
    sortField,
    sortOrder,
  ]);

  const ticketStats = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      inProgress: tickets.filter((t) => t.status === "in-progress").length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
      closed: tickets.filter((t) => t.status === "closed").length,
    }),
    [tickets],
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-3 border-[#fe9a00]/20 border-t-[#fe9a00] rounded-full animate-spin" />
        <p className="text-white/60 text-sm font-medium mt-4">
          Loading tickets...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* ─── Header: Compact ─────────────────────────────────── */}
      <div className="bg-[#111827] border border-white/5 rounded-2xl p-4 sm:p-5">
        {/* Row 1: Title + Refresh */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#fe9a00] to-orange-600 flex items-center justify-center shadow-lg shadow-[#fe9a00]/20">
              <HiOutlineTicket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Tickets
              </h2>
              <p className="text-white/30 text-xs">
                {ticketStats.total} total · {ticketStats.open} open
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchTickets(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white/50 hover:text-white text-xs font-medium transition-all disabled:opacity-50"
          >
            <FiRefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Row 2: Stats (compact pills) */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {[
            {
              label: "All",
              value: ticketStats.total,
              filter: "all",
              color: "text-blue-400",
              activeBg: "bg-blue-500/15",
            },
            {
              label: "Open",
              value: ticketStats.open,
              filter: "open",
              color: "text-red-400",
              activeBg: "bg-red-500/15",
            },
            {
              label: "Progress",
              value: ticketStats.inProgress,
              filter: "in-progress",
              color: "text-amber-400",
              activeBg: "bg-amber-500/15",
            },
            {
              label: "Resolved",
              value: ticketStats.resolved,
              filter: "resolved",
              color: "text-emerald-400",
              activeBg: "bg-emerald-500/15",
            },
            {
              label: "Closed",
              value: ticketStats.closed,
              filter: "closed",
              color: "text-slate-400",
              activeBg: "bg-slate-500/15",
            },
          ].map((s) => (
            <button
              key={s.filter}
              onClick={() => setFilterStatus(s.filter)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                filterStatus === s.filter
                  ? `${s.activeBg} ${s.color} border border-white/10`
                  : "bg-white/3 text-white/35 border border-transparent hover:text-white/50 hover:bg-white/5"
              }`}
            >
              {s.label}{" "}
              <span
                className={
                  filterStatus === s.filter ? s.color : "text-white/20"
                }
              >
                {s.value}
              </span>
            </button>
          ))}
        </div>

        {/* Row 3: Search + Priority filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tickets..."
              className="w-full pl-9 pr-8 py-2 bg-white/3 border border-white/5 rounded-lg text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#fe9a00]/40 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50"
              >
                <FiX className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white/3 border border-white/5">
              <FiFilter className="w-3 h-3 text-[#fe9a00]/60" />
              <span className="text-white/35 text-xs hidden sm:inline">
                Priority:
              </span>
            </div>
            <div className="min-w-25">
              <CustomSelect
                value={filterPriority}
                onChange={setFilterPriority}
                options={[
                  { _id: "all", name: "All" },
                  { _id: "urgent", name: "Urgent" },
                  { _id: "high", name: "High" },
                  { _id: "medium", name: "Medium" },
                  { _id: "low", name: "Low" },
                ]}
                compact
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Active Tickets Grid ─────────────────────────────── */}
      {filterStatus !== "closed" && activeTickets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 px-1 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#fe9a00] animate-pulse" />
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Active
            </span>
            <span className="text-[10px] text-white/20 bg-white/5 px-1.5 py-0.5 rounded">
              {activeTickets.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {activeTickets.map((ticket) => (
              <TicketCard
                key={ticket._id}
                ticket={ticket}
                onView={handleViewTicket}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── Closed Tickets ──────────────────────────────────── */}
      {closedTickets.length > 0 &&
        (filterStatus === "all" || filterStatus === "closed") && (
          <div>
            <button
              onClick={() => setShowClosedSection(!showClosedSection)}
              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white/2 border border-white/4 hover:border-white/10 transition-all"
            >
              <div className="flex items-center gap-2">
                <FiArchive className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Closed
                </span>
                <span className="text-[10px] text-white/20 bg-white/5 px-1.5 py-0.5 rounded">
                  {closedTickets.length}
                </span>
              </div>
              <FiChevronDown
                className={`w-3.5 h-3.5 text-white/25 transition-transform duration-200 ${
                  showClosedSection ? "rotate-180" : ""
                }`}
              />
            </button>

            {showClosedSection && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-3">
                {closedTickets.map((ticket) => (
                  <TicketCard
                    key={ticket._id}
                    ticket={ticket}
                    onView={handleViewTicket}
                    onStatusChange={handleStatusChange}
                    isClosed
                  />
                ))}
              </div>
            )}
          </div>
        )}

      {/* ─── Empty State ─────────────────────────────────────── */}
      {activeTickets.length === 0 && closedTickets.length === 0 && (
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-12 text-center">
          <FiInbox className="w-10 h-10 text-white/15 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white/60 mb-1">
            No tickets found
          </h3>
          <p className="text-white/30 text-sm max-w-sm mx-auto mb-4">
            {searchQuery
              ? `No results for "${searchQuery}"`
              : filterStatus === "all"
                ? "No support tickets at the moment."
                : `No "${filterStatus}" tickets.`}
          </p>
          {(searchQuery ||
            filterStatus !== "all" ||
            filterPriority !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterStatus("all");
                setFilterPriority("all");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white/50 text-xs font-medium transition-all"
            >
              <FiX className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ─── Detail Modal ────────────────────────────────────── */}
      {isDetailOpen && selectedTicket && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999]"
            onClick={() => setIsDetailOpen(false)}
          />
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0 lg:p-4">
            <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#0f172b] shadow-2xl lg:max-h-[92vh] lg:max-w-6xl lg:rounded-lg lg:border lg:border-white/10">
              <div className="shrink-0 border-b border-white/[0.06] bg-[#111827] px-4 py-3 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fe9a00] text-white shadow-lg shadow-[#fe9a00]/20">
                        <HiOutlineTicket className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-white sm:text-lg">
                          {selectedTicket.subject}
                        </h3>
                        <p className="text-[11px] text-white/32">
                          Updated {timeAgo(selectedTicket.updatedAt)} ·{" "}
                          {selectedTicket.messages.length} messages
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium ${
                          getStatusConfig(selectedTicket.status).bg
                        } ${getStatusConfig(selectedTicket.status).border} ${
                          getStatusConfig(selectedTicket.status).text
                        } border`}
                      >
                        {getStatusConfig(selectedTicket.status).icon}
                        {getStatusConfig(selectedTicket.status).label}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-medium ${
                          getPriorityConfig(selectedTicket.priority).bg
                        } ${
                          getPriorityConfig(selectedTicket.priority).border
                        } ${
                          getPriorityConfig(selectedTicket.priority).text
                        } border`}
                      >
                        {getPriorityConfig(selectedTicket.priority).label}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-white/55 transition-all hover:bg-white/[0.1] hover:text-white"
                    aria-label="Close ticket"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
                <aside className="max-h-[36vh] overflow-y-auto border-b border-white/[0.06] bg-[#111827] p-4 lg:max-h-none lg:border-b-0 lg:border-r lg:border-white/[0.06]">
                  <div className="mb-5">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                      Ticket status
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {["open", "in-progress", "resolved", "closed"].map(
                        (status) => {
                          const config = getStatusConfig(status);
                          const isActive = selectedTicket.status === status;
                          return (
                            <button
                              key={status}
                              onClick={() =>
                                handleStatusChange(selectedTicket._id, status)
                              }
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition-all ${
                                isActive
                                  ? `${config.bg} ${config.border} ${config.text}`
                                  : "border-white/[0.06] bg-white/[0.025] text-white/28 hover:border-white/15 hover:text-white/55"
                              }`}
                            >
                              {config.icon}
                              {config.label}
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] pt-4">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#fe9a00]/12 text-sm font-bold text-[#fe9a00] ring-1 ring-[#fe9a00]/20">
                        {getCustomerInitials(selectedTicket)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white/80">
                          {getCustomerName(selectedTicket)}
                        </p>
                        <p className="text-[11px] text-white/28">
                          Customer profile
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <p className="flex min-w-0 items-center gap-2 text-white/42">
                        <FiMail className="h-3.5 w-3.5 shrink-0 text-white/25" />
                        <span className="truncate">
                          {getUserEmail(selectedTicket) || "No email"}
                        </span>
                      </p>
                      <p className="flex min-w-0 items-center gap-2 text-white/42">
                        <FiPhone className="h-3.5 w-3.5 shrink-0 text-white/25" />
                        <span className="truncate">
                          {getUserPhone(selectedTicket) || "No phone"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-white/[0.06] pt-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#fe9a00]/80">
                        Last reservation
                      </p>
                      {selectedTicket.lastReservation && (
                        <span
                          className={`rounded-md border px-1.5 py-0.5 text-[9px] font-medium capitalize ${getReservationStatusClass(
                            selectedTicket.lastReservation.status,
                          )}`}
                        >
                          {getReservationStatusLabel(
                            selectedTicket.lastReservation.status,
                          )}
                        </span>
                      )}
                    </div>

                    {selectedTicket.lastReservation ? (
                      <div className="space-y-3">
                        <div>
                          <p className="truncate text-sm font-semibold text-white/78">
                            {selectedTicket.lastReservation.category?.name ||
                              "Reservation"}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-white/32">
                            <FiHash className="h-3 w-3" />
                            {getReservationCode(selectedTicket.lastReservation)}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
                          <div className="min-w-0">
                            <p className="text-white/25">Office</p>
                            <p className="truncate text-white/55">
                              {selectedTicket.lastReservation.office?.name ||
                                "-"}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white/25">Gear</p>
                            <p className="truncate capitalize text-white/55">
                              {selectedTicket.lastReservation.selectedGear ||
                                "-"}
                            </p>
                          </div>
                          <div className="col-span-2 min-w-0">
                            <p className="text-white/25">Vehicle</p>
                            <p className="truncate text-white/55">
                              {getVehicleLabel(selectedTicket.lastReservation)}
                            </p>
                          </div>
                          <div className="col-span-2 min-w-0">
                            <p className="text-white/25">Pickup</p>
                            <p className="truncate text-white/55">
                              {formatReservationDateTime(
                                selectedTicket.lastReservation,
                                "pickup",
                              )}
                            </p>
                          </div>
                          <div className="col-span-2 min-w-0">
                            <p className="text-white/25">Return</p>
                            <p className="truncate text-white/55">
                              {formatReservationDateTime(
                                selectedTicket.lastReservation,
                                "return",
                              )}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white/25">Total</p>
                            <p className="truncate text-white/55">
                              {formatCurrency(
                                selectedTicket.lastReservation.totalPrice,
                              )}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white/25">Type</p>
                            <p className="truncate text-white/55">
                              {selectedTicket.lastReservation.reservationType ||
                                "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-white/30">
                        <FiCalendar className="h-3.5 w-3.5 shrink-0" />
                        <span>No previous reservation for this user</span>
                      </div>
                    )}
                  </div>
                </aside>

                <section className="flex min-h-0 flex-col bg-[#0b1220]">
                  <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
                    <div>
                      <p className="text-sm font-semibold text-white/75">
                        Conversation
                      </p>
                      <p className="text-[11px] text-white/30">
                        {selectedTicket.messages.length} messages in this ticket
                      </p>
                    </div>
                    <span className="hidden rounded-md bg-white/[0.035] px-2 py-1 text-[10px] text-white/32 sm:inline-flex">
                      Created{" "}
                      {new Date(selectedTicket.createdAt).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                        },
                      )}
                    </span>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                    {selectedTicket.messages.length === 0 && (
                      <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
                        <FiMessageSquare className="mb-3 h-8 w-8 text-white/12" />
                        <p className="text-sm text-white/30">No messages yet</p>
                      </div>
                    )}

                    <div className="space-y-5">
                      {selectedTicket.messages.map((message, index) => {
                        const isUser =
                          message.sender === selectedTicket?.userId?._id;
                        return (
                          <div
                            key={index}
                            className={`flex gap-2.5 ${
                              isUser ? "justify-start" : "justify-end"
                            }`}
                          >
                            {isUser && (
                              <div className="mt-6 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.045] text-[10px] font-bold text-[#fe9a00] ring-1 ring-white/[0.06]">
                                {getCustomerInitials(selectedTicket)}
                              </div>
                            )}
                            <div
                              className={`max-w-[min(78%,680px)] ${
                                isUser ? "items-start" : "items-end"
                              } flex flex-col`}
                            >
                              <div
                                className={`mb-1 flex items-center gap-1.5 text-[10px] font-medium ${
                                  isUser ? "text-[#fe9a00]/75" : "text-white/45"
                                }`}
                              >
                                <span>
                                  {isUser ? "Customer" : "Support team"}
                                </span>
                                <span className="text-white/18">·</span>
                                <span className="text-white/28">
                                  {formatMessageTimestamp(message.timestamp)}
                                </span>
                              </div>
                              <div
                                className={`rounded-lg px-4 py-3 text-sm leading-relaxed shadow-lg ${
                                  isUser
                                    ? "border border-white/[0.08] bg-[#111827] text-white/72"
                                    : "bg-[#fe9a00] text-white shadow-[#fe9a00]/15"
                                }`}
                              >
                                <p className="whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="shrink-0 border-t border-white/[0.06] bg-[#111827] p-3 sm:p-4">
                    {selectedTicket.status === "closed" ? (
                      <div className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-sm text-white/30">
                        <FiArchive className="h-3.5 w-3.5" />
                        Ticket closed. Reopen to reply.
                      </div>
                    ) : (
                      <div className="flex items-end gap-2">
                        <textarea
                          ref={textareaRef}
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Write a clear reply to the customer..."
                          rows={2}
                          className="min-h-[60px] flex-1 resize-none rounded-lg border border-white/[0.08] bg-[#0b1220] px-4 py-3 text-sm text-white placeholder-white/22 transition-all focus:border-[#fe9a00]/45 focus:outline-none"
                          style={{ maxHeight: "150px" }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendReply();
                            }
                          }}
                          onInput={(e) => {
                            const t = e.target as HTMLTextAreaElement;
                            t.style.height = "60px";
                            t.style.height = `${Math.min(
                              t.scrollHeight,
                              150,
                            )}px`;
                          }}
                        />
                        <button
                          onClick={handleSendReply}
                          disabled={!replyMessage.trim() || isSubmitting}
                          className="flex h-[60px] w-12 shrink-0 items-center justify-center rounded-lg bg-[#fe9a00] text-white shadow-lg shadow-[#fe9a00]/20 transition-all hover:bg-orange-500 active:scale-95 disabled:opacity-35"
                          aria-label="Send reply"
                        >
                          {isSubmitting ? (
                            <span className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          ) : (
                            <FiSend className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Portal Custom Select ────────────────────────────────────────
interface Option {
  _id: string;
  name: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  compact?: boolean;
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  compact = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const mounted = typeof document !== "undefined";
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 240,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((opt) => opt._id === value);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const preferred = 240;
    const openUp = spaceBelow < 200 && spaceAbove > spaceBelow;
    const maxH = openUp
      ? Math.min(preferred, spaceAbove - 12)
      : Math.min(preferred, window.innerHeight - rect.bottom - 12);
    const top = openUp ? Math.max(8, rect.top - maxH - 6) : rect.bottom + 6;
    setPosition({
      top,
      left: rect.left,
      width: Math.max(rect.width, 140),
      maxHeight: maxH,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      )
        setOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full rounded-lg bg-white/[0.03] border border-white/5 text-white text-left flex items-center justify-between gap-1 hover:border-white/15 focus:outline-none transition-all ${
          compact ? "px-2.5 py-1.5 text-[11px]" : "px-3.5 py-2.5 text-sm"
        }`}
      >
        <span className="truncate text-white/60">
          {selectedOption?.name || placeholder}
        </span>
        <FiChevronDown
          className={`w-3 h-3 text-white/30 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed rounded-xl border border-white/10 bg-[#111827] backdrop-blur-xl shadow-2xl overflow-hidden"
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
              zIndex: 999999,
            }}
          >
            <div
              className="overflow-y-auto p-1"
              style={{ maxHeight: position.maxHeight }}
            >
              {options.map((option) => {
                const isSelected = option._id === value;
                return (
                  <button
                    key={option._id}
                    type="button"
                    onClick={() => {
                      onChange(option._id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs transition-all text-left ${
                      isSelected
                        ? "bg-[#fe9a00]/15 text-[#fe9a00]"
                        : "text-white/70 hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{option.name}</span>
                    {isSelected && <FiCheck className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
