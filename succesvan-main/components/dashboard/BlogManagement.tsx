"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FiSearch,
  FiEdit3,
  FiTrash2,
  FiEye,
  FiMoreVertical,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiExternalLink,
  FiCheckCircle,
  FiClock,
  FiArchive,
  FiAlertTriangle,
  FiX,
  FiGlobe,
  FiCalendar,
} from "react-icons/fi";
import { showToast } from "@/lib/toast";
import CustomSelect from "@/components/ui/CustomSelect";

interface Blog {
  _id: string;
  slug: string;
  status: "draft" | "published" | "archived" | "scheduled";
  scheduledPublishDate: string | null;
  views: number;
  readingTime: number;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  content: {
    topic: string;
    seoTitle?: string;
    featuredImage?: string;
  };
  seo: {
    seoTitle?: string;
    publishDate: string | number | Date;
    canonicalUrl: string;
  };
  media: {
    featuredImage?: string;
  };
  generationProgress: {
    currentStep: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// Delete Modal Component
function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  blogTitle,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  blogTitle: string;
  isDeleting: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl z-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <FiAlertTriangle size={24} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Delete Blog</h3>
            <p className="text-sm text-slate-400">
              This action cannot be undone
            </p>
          </div>
        </div>

        <p className="text-slate-300 mb-6">
          Are you sure you want to delete{" "}
          <span className="font-medium text-white">{blogTitle}</span>? All
          content and data associated with this blog will be permanently
          removed.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <FiTrash2 size={14} />
                Delete Blog
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Status Change Modal Component
function StatusModal({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  blogTitle,
  isUpdating,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentStatus: string;
  blogTitle: string;
  isUpdating: boolean;
}) {
  if (!isOpen) return null;

  const isPublishing =
    currentStatus === "draft" || currentStatus === "archived";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0f172b]/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-[#1e293b] border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <FiX size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border ${
              isPublishing
                ? "bg-green-500/10 border-green-500/20 text-green-500"
                : "bg-[#fe9a00]/10 border-[#fe9a00]/20 text-[#fe9a00]"
            }`}
          >
            {isPublishing ? <FiGlobe size={28} /> : <FiArchive size={28} />}
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            {isPublishing ? "Publish Blog Post" : "Unpublish Blog Post"}
          </h3>
          <p className="text-slate-400 mb-6">
            You are about to change the status of{" "}
            <span className="text-white font-medium">{blogTitle}</span> to
            <span
              className={`font-bold ${isPublishing ? " text-green-400" : " text-[#fe9a00]"}`}
            >
              {isPublishing ? " Published" : " Draft"}
            </span>
            .
            {isPublishing
              ? " It will be visible to all visitors."
              : " It will be hidden from the public site."}
          </p>

          <div className="flex w-full gap-3">
            <button
              onClick={onClose}
              disabled={isUpdating}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isUpdating}
              className={`flex-1 px-4 py-3 text-white rounded-xl font-medium transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${
                isPublishing
                  ? "bg-green-600 hover:bg-green-700 shadow-green-900/20"
                  : "bg-[#fe9a00] hover:bg-orange-600 shadow-orange-900/20"
              }`}
            >
              {isUpdating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isPublishing ? (
                "Confirm Publish"
              ) : (
                "Revert to Draft"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BlogManagement() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [blogForStatus, setBlogForStatus] = useState<Blog | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Schedule modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [blogToSchedule, setBlogToSchedule] = useState<Blog | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  // Get auth token
  const getAuthToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || localStorage.getItem("authToken");
    }
    return null;
  }, []);

  // Fetch blogs with pagination and filters
  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const token = getAuthToken();

      const response = await fetch(`/api/blog?${params}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch blogs");
      }

      const data = await response.json();
      setBlogs(data.blogs);
      setPagination((prev) => ({
        ...prev,
        total: data.total,
        totalPages: data.pages,
        hasMore: data.page < data.pages,
      }));
    } catch (error) {
      console.log("Fetch blogs error:", error);
      showToast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, getAuthToken]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  // Auto-publish polling: check for due scheduled blogs every 60s
  useEffect(() => {
    const checkScheduledBlogs = async () => {
      try {
        const res = await fetch("/api/cron/publish-blogs");
        const data = await res.json();
        if (data.published > 0) {
          showToast.success(
            `Auto-published ${data.published} scheduled blog(s)`,
          );
          fetchBlogs(); // Refresh the list
        }
      } catch {
        // Silent fail — this is a background check
      }
    };

    // Run immediately on mount
    checkScheduledBlogs();

    // Then every 60 seconds
    const interval = setInterval(checkScheduledBlogs, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination((prev) => ({ ...prev, page: 1 }));
      } else {
        fetchBlogs();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  // Open status modal
  const openStatusModal = (blog: Blog) => {
    setBlogForStatus(blog);
    setStatusModalOpen(true);
    setActiveMenu(null);
  };

  // Handle publish/unpublish
  const handleTogglePublish = async () => {
    if (!blogForStatus) return;

    try {
      setUpdatingStatus(true);
      const newStatus =
        blogForStatus.status === "published" ? "draft" : "published";
      const token = getAuthToken();

      const response = await fetch(`/api/blog`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          id: blogForStatus._id,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update blog status");
      }

      showToast.success(
        `Blog ${newStatus === "published" ? "published" : "unpublished"} successfully`,
      );
      setStatusModalOpen(false);
      setBlogForStatus(null);
      fetchBlogs();
    } catch (error: any) {
      console.log("Toggle publish error:", error);
      showToast.error(error.message || "Failed to update blog status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Open schedule modal
  const openScheduleModal = (blog: Blog) => {
    setBlogToSchedule(blog);
    // Default to tomorrow at 09:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduleDate(tomorrow.toISOString().split("T")[0]);
    setScheduleTime("09:00");
    setScheduleModalOpen(true);
    setActiveMenu(null);
  };

  // Handle schedule submit
  const handleSchedule = async () => {
    if (!blogToSchedule || !scheduleDate || !scheduleTime) return;

    try {
      setIsScheduling(true);
      const scheduledPublishDate = new Date(
        `${scheduleDate}T${scheduleTime}:00`,
      ).toISOString();
      const token = getAuthToken();

      const response = await fetch("/api/blog/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          blogId: blogToSchedule._id,
          scheduledPublishDate,
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to schedule blog");

      showToast.success(
        `Blog scheduled for ${new Date(scheduledPublishDate).toLocaleString()}`,
      );
      setScheduleModalOpen(false);
      setBlogToSchedule(null);
      fetchBlogs();
    } catch (error: any) {
      console.log("Schedule error:", error);
      showToast.error(error.message || "Failed to schedule blog");
    } finally {
      setIsScheduling(false);
    }
  };

  // Handle cancel schedule
  const handleCancelSchedule = async (blog: Blog) => {
    try {
      const token = getAuthToken();

      const response = await fetch("/api/blog/schedule", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ blogId: blog._id }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to cancel schedule");

      showToast.success("Schedule cancelled, blog reverted to draft");
      setActiveMenu(null);
      fetchBlogs();
    } catch (error: any) {
      console.log("Cancel schedule error:", error);
      showToast.error(error.message || "Failed to cancel schedule");
    }
  };

  // Open delete modal
  const openDeleteModal = (blog: Blog) => {
    setBlogToDelete({
      id: blog._id,
      title: blog.seo.seoTitle || blog.content.topic || "Untitled Blog",
    });
    setDeleteModalOpen(true);
    setActiveMenu(null);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!blogToDelete) return;

    try {
      setDeletingId(blogToDelete.id);
      const token = getAuthToken();

      const response = await fetch(`/api/blog`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          id: blogToDelete.id,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete blog");
      }

      showToast.success("Blog deleted successfully");
      setDeleteModalOpen(false);
      setBlogToDelete(null);
      fetchBlogs();
    } catch (error: any) {
      console.log("Delete blog error:", error);
      showToast.error(error.message || "Failed to delete blog");
    } finally {
      setDeletingId(null);
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            <FiCheckCircle size={10} />
            Published
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            <FiClock size={10} />
            Draft
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400 border border-slate-500/30">
            <FiArchive size={10} />
            Archived
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <FiCalendar size={10} />
            Scheduled
          </span>
        );
      default:
        return null;
    }
  };

  // Get generation step label
  const getStepLabel = (step: string) => {
    const steps: Record<string, string> = {
      headings: "Structure",
      images: "Images",
      content: "Content",
      summary: "Summary",
      conclusion: "Conclusion",
      faq: "FAQs",
      seo: "SEO",
      completed: "Complete",
    };
    return steps[step] || step;
  };

  // Status filter options for CustomSelect
  const statusOptions = [
    { _id: "", name: "All Status" },
    { _id: "published", name: "Published" },
    { _id: "draft", name: "Draft" },
    { _id: "scheduled", name: "Scheduled" },
    { _id: "archived", name: "Archived" },
  ];

  return (
    <div className="space-y-4">
      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        blogTitle={blogToDelete?.title || ""}
        isDeleting={deletingId !== null}
      />

      {/* Status Change Modal */}
      <StatusModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={handleTogglePublish}
        currentStatus={blogForStatus?.status || "draft"}
        blogTitle={
          blogForStatus?.seo.seoTitle ||
          blogForStatus?.content.topic ||
          "Untitled Blog"
        }
        isUpdating={updatingStatus}
      />

      {/* Schedule Modal */}
      {scheduleModalOpen && blogToSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#0f172b]/80 backdrop-blur-sm"
            onClick={() => setScheduleModalOpen(false)}
          />
          <div className="relative bg-[#1e293b] border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <button
              onClick={() => setScheduleModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <FiX size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 border bg-purple-500/10 border-purple-500/20 text-purple-400">
                <FiCalendar size={28} />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                Schedule Blog
              </h3>
              <p className="text-slate-400 mb-6">
                Set a date and time to automatically publish{" "}
                <span className="text-white font-medium">
                  {blogToSchedule.seo?.seoTitle ||
                    blogToSchedule.content?.topic ||
                    "this blog"}
                </span>
              </p>

              <div className="w-full space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5 text-left">
                    Publish Date
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors scheme-dark"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5 text-left">
                    Publish Time
                  </label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors scheme-dark"
                  />
                </div>
                {scheduleDate && scheduleTime && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                    <p className="text-sm text-purple-300">
                      Will publish on{" "}
                      <span className="font-bold text-purple-200">
                        {new Date(
                          `${scheduleDate}T${scheduleTime}:00`,
                        ).toLocaleString("en-GB", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex w-full gap-3">
                <button
                  onClick={() => setScheduleModalOpen(false)}
                  disabled={isScheduling}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSchedule}
                  disabled={isScheduling || !scheduleDate || !scheduleTime}
                  className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isScheduling ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiCalendar size={16} />
                      Schedule
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Blog Management</h2>
          <p className="text-sm text-slate-400">Manage all your blogs</p>
        </div>

        <button
          onClick={fetchBlogs}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
        >
          <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:grid sm:grid-cols-12 gap-4">
        {/* Search */}
        <div className="relative  sm:col-span-10">
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search blogs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#fe9a00]"
          />
        </div>

        {/* Status Filter using CustomSelect */}
        <div className="sm:col-span-2">
          <CustomSelect
            options={statusOptions}
            value={statusFilter}
            onChange={handleStatusFilterChange}
            placeholder="All Status"
          />
        </div>
      </div>

      {/* Blog Table */}
      <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            Loading blogs...
            <div className="w-8 h-8 border-2 ml-4 border-[#fe9a00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FiEye size={48} className="text-slate-600 mb-4" />
            <p className="text-slate-400 mb-2">No blogs found</p>
            <p className="text-sm text-slate-500">
              {search || statusFilter
                ? "Try adjusting your search or filters"
                : "Create your first blog to get started"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-4 py-12 text-xs font-bold text-slate-200 uppercase tracking-wider">
                    #
                  </th>
                  <th className="text-left px-4 py-12 text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Blog
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-200 uppercase tracking-wider hidden md:table-cell">
                    Progress
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-200 uppercase tracking-wider hidden lg:table-cell">
                    Words
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-200 uppercase tracking-wider hidden lg:table-cell">
                    Publish
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {blogs.map((blog, idx) => (
                  <tr
                    key={blog._id}
                    className="hover:bg-slate-700/20 transition-colors"
                  >
                    <td className="px-3 py-2 text-gray-300 font-semibold">
                      {(pagination.page - 1) * pagination.limit + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {blog.media.featuredImage ? (
                          <img
                            src={blog.media.featuredImage}
                            alt={blog.seo.seoTitle || "Featured Image"}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                            <FiEye size={16} className="text-slate-500" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate max-w-50 sm:max-w-62.5">
                            {blog.seo.seoTitle || "Untitled Blog"}
                          </p>
                          <p className="text-xs text-slate-400 truncate max-w-50 sm:max-w-62.5">
                            /blog{blog.seo.canonicalUrl}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        {getStatusBadge(blog.status)}
                        {blog.status === "scheduled" &&
                          blog.scheduledPublishDate && (
                            <p className="text-[10px] text-purple-400 mt-1">
                              {new Date(
                                blog.scheduledPublishDate,
                              ).toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-slate-400">
                        {getStepLabel(
                          blog.generationProgress?.currentStep || "headings",
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-slate-400">
                        {blog.wordCount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {blog.status === "published" ? (
                        <span className="text-xs text-slate-400">
                          {blog.seo.publishDate
                            ? new Date(
                                blog.seo.publishDate,
                              ).toLocaleDateString()
                            : "-"}
                        </span>
                      ) : blog.status === "scheduled" &&
                        blog.scheduledPublishDate ? (
                        <span className="text-xs text-purple-400">
                          {new Date(blog.scheduledPublishDate).toLocaleString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-500">
                          {blog.status === "archived"
                            ? "Archived"
                            : "Not published"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Link */}
                        {blog.status === "published" && (
                          <a
                            href={`/blog${blog.seo.canonicalUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-slate-700 rounded-lg tooltip text-blue-400 hover:text-white transition-colors"
                            title="View Blog"
                            data-tooltip="View Blog"
                          >
                            <FiExternalLink size={14} />
                          </a>
                        )}

                        {/* Edit Button */}
                        <a
                          href={`/dashboard/blog/edit/${blog._id}`}
                          className="p-2 hover:bg-slate-700 rounded-lg tooltip text-yellow-400 hover:text-white transition-colors"
                          title="Edit Blog"
                          data-tooltip="Edit Blog"
                        >
                          <FiEdit3 size={14} />
                        </a>

                        {/* More Menu */}
                        <div className="relative ">
                          <button
                            onClick={() =>
                              setActiveMenu(
                                activeMenu === blog._id ? null : blog._id,
                              )
                            }
                            data-tooltip="more"
                            className="p-2 hover:bg-slate-700 tooltip rounded-lg text-slate-400 hover:text-white transition-colors"
                          >
                            <FiMoreVertical size={14} />
                          </button>

                          {activeMenu === blog._id && (
                            <div className="absolute right-0  bottom-0 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 py-4">
                              <button
                                onClick={() => {
                                  openStatusModal(blog);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                              >
                                <FiCheckCircle size={14} />
                                {blog.status === "published"
                                  ? "Unpublish"
                                  : "Publish"}
                              </button>
                              {blog.status === "scheduled" ? (
                                <button
                                  onClick={() => handleCancelSchedule(blog)}
                                  className="w-full px-4 py-2 text-left text-sm text-purple-400 hover:bg-slate-700 flex items-center gap-2"
                                >
                                  <FiX size={14} />
                                  Cancel Schedule
                                </button>
                              ) : (
                                <button
                                  onClick={() => openScheduleModal(blog)}
                                  className="w-full px-4 py-2 text-left text-sm text-purple-400 hover:bg-slate-700 flex items-center gap-2"
                                >
                                  <FiCalendar size={14} />
                                  Schedule Publish
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  openDeleteModal(blog);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"
                              >
                                <FiTrash2 size={14} />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && blogs.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} blogs
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronLeft size={16} />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        pagination.page === pageNum
                          ? "bg-[#fe9a00] text-white"
                          : "bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                },
              )}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasMore}
              className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}
