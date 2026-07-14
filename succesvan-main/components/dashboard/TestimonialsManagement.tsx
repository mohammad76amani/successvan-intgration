"use client";

import { useState, useRef } from "react";
import { FiX } from "react-icons/fi";
import { showToast } from "@/lib/toast";
import DynamicTableView from "./DynamicTableView";

interface Testimonial {
  _id: string;
  name: string;
  email: string;
  message: string;
  rating: number;
  status: "pending" | "approved" | "rejected";
  link?: string;
  createdAt: Date;
}
type MutateFn = () => Promise<void>;

export default function TestimonialsManagement() {
  const mutateRef = useRef<MutateFn | null>(null);
  const [selectedTestimonial, setSelectedTestimonial] =
    useState<Testimonial | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLink, setEditingLink] = useState("");

  const handleViewDetails = (item: Testimonial) => {
    setSelectedTestimonial(item);
    setEditingLink(item.link || "");
    setIsDetailOpen(true);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTestimonial) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/testimonials/${selectedTestimonial._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Update failed");

      showToast.success("Status updated successfully!");
      setIsDetailOpen(false);
      if (mutateRef.current) mutateRef.current();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkSave = async () => {
    if (!selectedTestimonial) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/testimonials/${selectedTestimonial._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: editingLink }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Update failed");

      setSelectedTestimonial({ ...selectedTestimonial, link: editingLink });
      showToast.success("Link updated successfully!");
      if (mutateRef.current) mutateRef.current();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <DynamicTableView
        apiEndpoint="/api/testimonials"
        title="Testimonial"
        filters={[
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { _id: "", name: "all" },
              { _id: "pending", name: "Pending" },
              { _id: "approved", name: "Approved" },
              { _id: "rejected", name: "Rejected" },
            ],
          },
        ]}
        columns={[
          {
            key: "name" as keyof Testimonial,
            label: "Name",
          },
          {
            key: "email" as keyof Testimonial,
            label: "Email",
          },
          {
            key: "message" as keyof Testimonial,
            label: "Message",
            render: (value: string) =>
              value.length > 50 ? value.substring(0, 50) + "..." : value,
          },
          {
            key: "rating" as keyof Testimonial,
            label: "Rating",
            render: (value: number) => `⭐ ${value}/5`,
          },
          {
            key: "status" as keyof Testimonial,
            label: "Status",
            render: (value: string) => (
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  value === "approved"
                    ? "bg-green-500/20 text-green-400"
                    : value === "pending"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                }`}
              >
                {value}
              </span>
            ),
          },
        ]}
        onEdit={handleViewDetails}
        onMutate={(mutate) => (mutateRef.current = mutate)}
      />

      {isDetailOpen && selectedTestimonial && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2847] rounded-2xl max-w-2xl w-full border border-white/10">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b z-10 border-white/10 bg-[#1a2847]">
              <h2 className="text-2xl font-black text-white">
                Testimonial Details
              </h2>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiX className="text-white text-xl" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3">
                  Testimonial Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-sm">Name</label>
                    <p className="text-white font-semibold">
                      {selectedTestimonial.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Email</label>
                    <p className="text-white font-semibold">
                      {selectedTestimonial.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Rating</label>
                    <p className="text-white font-semibold">
                      ⭐ {selectedTestimonial.rating}/5
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3">Message</h3>
                <p className="text-gray-300">{selectedTestimonial.message}</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3">Link (Source)</h3>
                <div className="space-y-3">
                  <input
                    type="url"
                    placeholder="Enter the page or source URL where this testimonial came from"
                    value={editingLink}
                    onChange={(e) => setEditingLink(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] disabled:opacity-50"
                  />
                  {editingLink && (
                    <a
                      href={editingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[#fe9a00] hover:text-[#ff8c00] text-sm font-semibold transition-colors"
                    >
                      Visit Link →
                    </a>
                  )}
                  <button
                    onClick={handleLinkSave}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-[#fe9a00] hover:bg-[#ff8c00] text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Save Link"}
                  </button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3">Status</h3>
                <div className="flex gap-2">
                  {["pending", "approved", "rejected"].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={isSubmitting}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 ${
                        selectedTestimonial.status === status
                          ? "bg-[#fe9a00] text-white"
                          : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
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
    </div>
  );
}
