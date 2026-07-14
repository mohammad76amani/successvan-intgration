"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  FiMessageSquare,
  FiX,
  FiSend,
  FiClock,
  FiUser,
  FiMail,
  FiAlertCircle,
  FiCheckCircle,
  FiLoader,
  FiInbox,
  FiFilter,
  FiChevronRight,
  FiSearch,
  FiArchive,
  FiChevronDown,
  FiRefreshCw,
  FiCalendar,
  FiCheck,
} from "react-icons/fi";
import { HiOutlineTicket } from "react-icons/hi";
import { showToast } from "@/lib/toast";
import { createPortal } from "react-dom";

interface Message {
  sender: string;
  content: string;
  timestamp: string;
}

interface Ticket {
  _id: string;
  userId: {
    _id: string;
    name: string;
    lastName: string;
    email: string;
  };
  subject: string;
  status: string;
  priority: string;
  messages: Message[];
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

  return (
    <div
      className={`group relative flex flex-col rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-black/20 cursor-pointer ${
        isClosed
          ? "bg-white/2 border border-white/5 hover:border-white/10 opacity-70 hover:opacity-100"
          : "bg-[#111827] border border-white/5 hover:border-white/15"
      }`}
      onClick={() => onView(ticket)}
    >
      {/* Priority top accent */}
      <div
        className={`h-0.5 rounded-t-xl ${priorityConfig.bg} ${
          priorityConfig.pulse ? "animate-pulse" : ""
        }`}
      />

      <div className="flex flex-col flex-1 p-4">
        {/* Row 1: Badges */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text} border`}
            >
              {statusConfig.icon}
              {statusConfig.label}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${priorityConfig.bg} ${priorityConfig.border} ${priorityConfig.text} border`}
            >
              {priorityConfig.label}
            </span>
          </div>
          <span className="text-[10px] text-white/25 shrink-0">
            updated : {timeAgo(ticket.updatedAt)}
          </span>
        </div>

        {/* Row 2: Subject */}
        <h3
          className={`text-sm font-semibold mb-2 line-clamp-2 leading-snug ${
            isClosed
              ? "text-white/40"
              : "text-white group-hover:text-[#fe9a00] transition-colors"
          }`}
        >
          {ticket.subject}
        </h3>

        {/* Row 3: User */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <FiUser className="w-3 h-3 text-[#fe9a00]/60 shrink-0" />
          <span className="text-white/45 text-xs truncate">
            {ticket?.userId?.name} {ticket?.userId?.lastName}
          </span>
        </div>

        {/* Row 4: Last message preview */}
        {lastMessage && (
          <div className="p-2.5 rounded-lg bg-white/3 border border-white/4 mb-3">
            <p className="text-white/35 text-xs line-clamp-2 leading-relaxed">
              {lastMessage.content}
            </p>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Row 5: Meta + Actions */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-white/4">
          <div className="flex items-center gap-2 text-[10px] text-white/25">
            <span className="flex items-center gap-1">
              <FiMessageSquare className="w-2.5 h-2.5" />
              {ticket.messages.length}
            </span>
            <span className="flex items-center gap-1">
              <FiCalendar className="w-2.5 h-2.5" />
              {new Date(ticket.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>

          <div className="min-w-25" onClick={(e) => e.stopPropagation()}>
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
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
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
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0 sm:p-4">
            <div className="relative flex flex-col w-full h-full sm:max-w-3xl sm:max-h-[90vh] sm:h-auto sm:min-h-[70vh] sm:rounded-2xl overflow-hidden bg-[#111827] border-0 sm:border border-white/10 shadow-2xl">
              {/* Header */}
              <div className="shrink-0 p-4 sm:p-5 border-b border-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fe9a00] to-orange-600 flex items-center justify-center shrink-0">
                        <HiOutlineTicket className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white truncate">
                        {selectedTicket.subject}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          getStatusConfig(selectedTicket.status).bg
                        } ${getStatusConfig(selectedTicket.status).border} ${
                          getStatusConfig(selectedTicket.status).text
                        } border`}
                      >
                        {getStatusConfig(selectedTicket.status).icon}
                        {getStatusConfig(selectedTicket.status).label}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          getPriorityConfig(selectedTicket.priority).bg
                        } ${
                          getPriorityConfig(selectedTicket.priority).border
                        } ${
                          getPriorityConfig(selectedTicket.priority).text
                        } border`}
                      >
                        {getPriorityConfig(selectedTicket.priority).label}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/[0.03] text-white/40 text-[10px]">
                        <FiUser className="w-2.5 h-2.5" />
                        {selectedTicket?.userId?.name}{" "}
                        {selectedTicket?.userId?.lastName}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="shrink-0 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all hover:rotate-90"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick status */}
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/[0.04]">
                  <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider mr-1">
                    Status:
                  </span>
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
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
                            isActive
                              ? `${config.bg} ${config.border} ${config.text}`
                              : "bg-transparent border-white/[0.04] text-white/20 hover:text-white/40 hover:border-white/10"
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

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                {selectedTicket.messages.length === 0 && (
                  <div className="text-center py-10">
                    <FiMessageSquare className="w-7 h-7 text-white/10 mx-auto mb-2" />
                    <p className="text-white/25 text-sm">No messages yet</p>
                  </div>
                )}

                {selectedTicket.messages.map((message, index) => {
                  const isUser = message.sender === selectedTicket?.userId?._id;
                  return (
                    <div
                      key={index}
                      className={`flex ${
                        isUser ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div className="relative max-w-[85%] sm:max-w-[75%]">
                        <div
                          className={`p-3 sm:p-3.5 rounded-2xl ${
                            isUser
                              ? "bg-white/[0.04] border border-white/[0.06] rounded-bl-sm"
                              : "bg-gradient-to-br from-[#fe9a00] to-orange-600 rounded-br-sm shadow-lg shadow-[#fe9a00]/15"
                          }`}
                        >
                          <div
                            className={`text-[10px] font-semibold mb-1 ${
                              isUser ? "text-[#fe9a00]/70" : "text-white/70"
                            }`}
                          >
                            {isUser ? "Customer" : "Support Team"}
                          </div>
                          <p
                            className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
                              isUser ? "text-white/70" : "text-white"
                            }`}
                          >
                            {message.content}
                          </p>
                          <div
                            className={`flex items-center gap-1 mt-1.5 text-[9px] ${
                              isUser ? "text-white/25" : "text-white/45"
                            }`}
                          >
                            <FiClock className="w-2 h-2" />
                            {new Date(message.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply */}
              <div className="shrink-0 p-4 sm:p-5 border-t border-white/5">
                {selectedTicket.status === "closed" ? (
                  <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-white/25 text-sm">
                    <FiArchive className="w-3.5 h-3.5" />
                    Ticket closed. Reopen to reply.
                  </div>
                ) : (
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={textareaRef}
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply..."
                      rows={1}
                      className="flex-1 px-4 py-3 bg-white/[0.03] border border-white/5 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#fe9a00]/40 resize-none transition-all"
                      style={{ minHeight: "48px", maxHeight: "110px" }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                      onInput={(e) => {
                        const t = e.target as HTMLTextAreaElement;
                        t.style.height = "48px";
                        t.style.height = `${Math.min(t.scrollHeight, 110)}px`;
                      }}
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!replyMessage.trim() || isSubmitting}
                      className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-r from-[#fe9a00] to-orange-600 text-white shadow-lg shadow-[#fe9a00]/20 hover:shadow-[#fe9a00]/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-35 disabled:hover:scale-100 flex items-center justify-center"
                    >
                      {isSubmitting ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                      ) : (
                        <FiSend className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
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
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 240,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((opt) => opt._id === value);

  useEffect(() => {
    setMounted(true);
  }, []);

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
