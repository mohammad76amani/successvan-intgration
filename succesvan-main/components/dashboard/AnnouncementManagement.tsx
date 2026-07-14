"use client";

import { useState } from "react";
import useSWR from "swr";
import { FiPlus, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import { showToast } from "@/lib/toast";

interface Announcement {
  _id: string;
  text: string;
  link: string;
  textColor: string;
  backgroundColor: string;
  isActive: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AnnouncementManagement() {
  const { data, mutate } = useSWR("/api/announcements", fetcher);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    text: "",
    link: "",
    textColor: "#ffffff",
    backgroundColor: "#fe9a00",
    isActive: true,
  });

  const announcements = data?.data || [];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleActiveToggle = async (id: string, currentStatus: boolean) => {
    if (currentStatus) {
      await fetch(`/api/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });
    } else {
      await fetch(`/api/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      const activeAnnouncements = announcements.filter(
        (a: Announcement) => a.isActive && a._id !== id
      );
      for (const ann of activeAnnouncements) {
        await fetch(`/api/announcements/${ann._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: false }),
        });
      }
    }
    mutate();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.text.trim()) {
      showToast.error("Text is required");
      return;
    }

    try {
      if (formData.isActive) {
        const activeAnnouncements = announcements.filter(
          (a: Announcement) => a.isActive && a._id !== editingId
        );
        for (const ann of activeAnnouncements) {
          await fetch(`/api/announcements/${ann._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: false }),
          });
        }
      }

      const method = editingId ? "PATCH" : "POST";
      const url = editingId
        ? `/api/announcements/${editingId}`
        : "/api/announcements";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (result.success) {
        showToast.success(
          editingId ? "Announcement updated" : "Announcement created"
        );
        mutate();
        setIsOpen(false);
        setEditingId(null);
        setFormData({
          text: "",
          link: "",
          textColor: "#ffffff",
          backgroundColor: "#fe9a00",
          isActive: true,
        });
      } else {
        showToast.error(result.error || "Operation failed");
      }
    } catch (error) {
      showToast.error("Failed to save announcement");
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setFormData({
      text: announcement.text,
      link: announcement.link,
      textColor: announcement.textColor,
      backgroundColor: announcement.backgroundColor,
      isActive: announcement.isActive,
    });
    setEditingId(announcement._id);
    setIsOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await fetch(`/api/announcements/${deleteId}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (result.success) {
        showToast.success("Announcement deleted");
        mutate();
      } else {
        showToast.error("Failed to delete");
      }
    } catch (error) {
      showToast.error("Failed to delete announcement");
    } finally {
      setDeleteId(null);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData({
      text: "",
      link: "",
      textColor: "#ffffff",
      backgroundColor: "#fe9a00",
      isActive: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Announcements</h2>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#fe9a00] text-white rounded-lg hover:bg-[#fe9a00]/90 transition-colors"
        >
          <FiPlus /> New Announcement
        </button>
      </div>

      <div className="grid gap-4">
        {announcements.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No announcements yet
          </div>
        ) : (
          announcements.map((announcement: Announcement) => (
            <div
              key={announcement._id}
              className="p-4 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
              style={{ backgroundColor: announcement.backgroundColor + "20" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p
                    className="font-semibold mb-2"
                    style={{ color: announcement.textColor }}
                  >
                    {announcement.text}
                  </p>
                  {announcement.link && (
                    <p className="text-sm text-gray-400">{announcement.link}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleActiveToggle(announcement._id, announcement.isActive)
                      }
                      className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                        announcement.isActive
                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                      }`}
                    >
                      {announcement.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(announcement)}
                    className="p-2 hover:bg-blue-500/20 rounded transition-colors"
                  >
                    <FiEdit2 className="text-blue-400" />
                  </button>
                  <button
                    onClick={() => setDeleteId(announcement._id)}
                    className="p-2 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <FiTrash2 className="text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2847] rounded-2xl max-w-md w-full border border-white/10">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">
                {editingId ? "Edit" : "New"} Announcement
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white/10 rounded transition-colors"
              >
                <FiX className="text-white text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Announcement Text *
                </label>
                <textarea
                  name="text"
                  value={formData.text}
                  onChange={handleChange}
                  placeholder="Enter announcement text"
                  className="w-full px-3 py-2 bg-[#0f172b] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Link (Optional)
                </label>
                <input
                  type="text"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 bg-[#0f172b] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Text Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="textColor"
                      value={formData.textColor}
                      onChange={handleChange}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <span className="text-sm text-gray-400">
                      {formData.textColor}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="backgroundColor"
                      value={formData.backgroundColor}
                      onChange={handleChange}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <span className="text-sm text-gray-400">
                      {formData.backgroundColor}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <label className="text-sm font-semibold text-gray-300">
                  Active (only one can be active)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#fe9a00] text-white rounded-lg hover:bg-[#fe9a00]/90 transition-colors font-semibold"
                >
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm min-h-screen z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2847]/50 rounded-2xl max-w-sm w-full border border-white/10">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-2">
                Delete Announcement?
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
