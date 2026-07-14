"use client";

import { useState, useEffect } from "react";
import { FiMessageSquare, FiPlus } from "react-icons/fi";
import { showToast } from "@/lib/toast";
import CustomSelect from "@/components/ui/CustomSelect";

interface Message {
  sender: string;
  content: string;
  timestamp: string;
}

interface Ticket {
  _id: string;
  subject: string;
  status: string;
  priority: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export default function SupportContent() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [newTicket, setNewTicket] = useState({
    subject: "",
    message: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        setCurrentUser(parsedUser._id);
      } catch (e) {
        console.log("Error parsing user", e);
      }
    }
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/tickets", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data.data);
      } else {
        showToast.error("Failed to fetch tickets");
      }
    } catch (error) {
      console.log("Error fetching tickets:", error);
      showToast.error("Error fetching tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      showToast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          subject: newTicket.subject,
          message: newTicket.message,
          priority: newTicket.priority,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTickets([data.data, ...tickets]);
        setNewTicket({ subject: "", message: "", priority: "medium" });
        setIsCreateOpen(false);
        showToast.success("Ticket created successfully");
      } else {
        showToast.error("Failed to create ticket");
      }
    } catch (error) {
      console.log("Error creating ticket:", error);
      showToast.error("Error creating ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDetailOpen(true);
  };

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
        setTickets(
          tickets.map((t) => (t._id === data.data._id ? data.data : t)),
        );
        setReplyMessage("");
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fe9a00]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
          <FiMessageSquare className="text-[#fe9a00]" />
          Support Tickets
        </h2>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 md:px-4 md:py-2 p-1 bg-[#fe9a00] text-black rounded-lg hover:bg-[#e8890b] transition-colors font-medium"
        >
          <FiPlus size={18} />
          New Ticket
        </button>
      </div>

      <div className="grid gap-4">
        {tickets.map((ticket) => (
          <div
            key={ticket._id}
            className="bg-gray-800 rounded-lg md:p-6 p-4 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div
              className="flex items-start justify-between cursor-pointer"
              onClick={() => handleViewTicket(ticket)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">
                    {ticket.subject}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      ticket.status,
                    )}`}
                  >
                    {ticket.status}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                      ticket.priority,
                    )}`}
                  >
                    {ticket.priority}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mb-3">
                  {ticket.messages.length > 0
                    ? ticket.messages[ticket.messages.length - 1].content
                    : "No messages yet"}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>
                    Created: {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                  <span>
                    Updated: {new Date(ticket.updatedAt).toLocaleDateString()}
                  </span>
                  <span>{ticket.messages.length} messages</span>
                </div>
              </div>
              {/* <button
                onClick={() => handleViewTicket(ticket)}
                className="px-3 py-1 bg-[#fe9a00] text-black rounded-md hover:bg-[#e8890b] transition-colors text-sm font-medium"
              >
                View
              </button> */}
            </div>
          </div>
        ))}
      </div>

      {tickets.length === 0 && (
        <div className="text-center py-12">
          <FiMessageSquare className="mx-auto h-12 w-12 text-gray-600 mb-4" />
          <p className="text-gray-400 mb-4">No support tickets yet</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-6 py-2 bg-[#fe9a00] text-black rounded-lg hover:bg-[#e8890b] transition-colors font-medium"
          >
            Create Your First Ticket
          </button>
        </div>
      )}

      {/* Create Ticket Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md  flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  Create New Ticket
                </h3>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, subject: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#fe9a00]"
                  placeholder="Brief description of your issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priority
                </label>
                <CustomSelect
                  value={newTicket.priority}
                  onChange={(value) =>
                    setNewTicket({ ...newTicket, priority: value as any })
                  }
                  options={[
                    { _id: "low", name: "Low" },
                    { _id: "medium", name: "Medium" },
                    { _id: "high", name: "High" },
                    { _id: "urgent", name: "Urgent" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={newTicket.message}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, message: e.target.value })
                  }
                  rows={6}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#fe9a00] resize-none"
                  placeholder="Describe your issue in detail..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setIsCreateOpen(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                disabled={
                  isSubmitting ||
                  !newTicket.subject.trim() ||
                  !newTicket.message.trim()
                }
                className="px-6 py-2 bg-[#fe9a00] text-black rounded-lg hover:bg-[#e8890b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSubmitting ? "Creating..." : "Create Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {isDetailOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md  flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  {selectedTicket.subject}
                </h3>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    selectedTicket.status,
                  )}`}
                >
                  {selectedTicket.status}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(
                    selectedTicket.priority,
                  )}`}
                >
                  {selectedTicket.priority}
                </span>
              </div>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {selectedTicket.messages.map((message, index) => {
                  const isOwnMessage = message.sender === currentUser;

                  return (
                    <div
                      key={index}
                      className={`flex ${
                        isOwnMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwnMessage
                            ? "bg-[#fe9a00] text-black"
                            : "bg-gray-700 text-white"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedTicket.status !== "closed" &&
              selectedTicket.status !== "resolved" && (
                <div className="p-6 border-t border-gray-700">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply..."
                      className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#fe9a00]"
                      onKeyPress={(e) => e.key === "Enter" && handleSendReply()}
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!replyMessage.trim() || isSubmitting}
                      className="px-6 py-2 bg-[#fe9a00] text-black rounded-lg hover:bg-[#e8890b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {isSubmitting ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
              )}

            {(selectedTicket.status === "closed" ||
              selectedTicket.status === "resolved") && (
              <div className="p-6 border-t border-gray-700">
                <div className="text-center text-gray-400">
                  <p className="text-sm">
                    This ticket is {selectedTicket.status}. You cannot send new
                    messages.
                  </p>
                  <p className="text-xs mt-1">
                    If you need further assistance, please create a new ticket.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
