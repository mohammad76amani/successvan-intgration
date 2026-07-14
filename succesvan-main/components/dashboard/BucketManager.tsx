"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import {
  FiAlertTriangle,
  FiClipboard,
  FiExternalLink,
  FiRefreshCw,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiImage,
  FiVideo,
  FiMusic,
  FiFile,
  FiLayers,
  FiCalendar,
  FiHardDrive,
} from "react-icons/fi";
import { showToast } from "@/lib/toast";

interface BucketObjectItem {
  key: string;
  url: string;
  size: number;
  lastModified: string | null;
  type: "image" | "video" | "audio" | "other";
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface FilterOptions {
  type: string;
  search: string;
  minSize: number;
  maxSize: number;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok || !result.success)
    throw new Error(result.error || "Failed to load");
  return result;
};

const BucketManager = () => {
  const [selectedForDelete, setSelectedForDelete] =
    useState<BucketObjectItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState<FilterOptions>({
    type: "",
    search: "",
    minSize: 0,
    maxSize: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  const buildQueryParams = useCallback(
    (page: number) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(filters.type && { type: filters.type }),
        ...(filters.search && { search: filters.search }),
        ...(filters.minSize > 0 && {
          minSize: filters.minSize.toString(),
        }),
        ...(filters.maxSize > 0 && {
          maxSize: filters.maxSize.toString(),
        }),
      });
      return params.toString();
    },
    [filters, itemsPerPage],
  );

  const { data, error, isLoading, mutate } = useSWR(
    `/api/upload/list?${buildQueryParams(currentPage)}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    },
  );

  const objects = data?.objects || [];
  const pagination = data?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  };

  if (error) {
    showToast.error(
      error instanceof Error ? error.message : "Unable to load bucket contents",
    );
  }

  const handleDelete = async () => {
    if (!selectedForDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/upload/delete?url=${encodeURIComponent(selectedForDelete.url)}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("Delete failed");
      showToast.success("Object deleted successfully");
      setSelectedForDelete(null);
      mutate();
    } catch (error) {
      showToast.error("Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast.success("URL copied to clipboard");
  };

  const TypeIcon = ({
    type,
    className,
  }: {
    type: string;
    className?: string;
  }) => {
    switch (type) {
      case "image":
        return <FiImage className={className} />;
      case "video":
        return <FiVideo className={className} />;
      case "audio":
        return <FiMusic className={className} />;
      default:
        return <FiFile className={className} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
            <FiHardDrive /> S3 Storage
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Media Assets
          </h1>
          <p className="text-slate-400 text-sm max-w-md">
            Manage your cloud storage files, monitor sizes, and handle
            deletions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              showFilters
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <FiFilter /> {showFilters ? "Hide Filters" : "Filters"}
          </button>
          <button
            onClick={() => mutate()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-all disabled:opacity-50"
          >
            <FiRefreshCw className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Modern Filters Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-slate-900/80 border border-slate-700/50 rounded-3xl animate-in slide-in-from-top-4 duration-300">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase ml-1">
              Search File
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="filename.jpg..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setCurrentPage(1);
                    mutate();
                  }
                }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase ml-1">
              File Category
            </label>
            <select
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
              value={filters.type}
              onChange={(e) => {
                const newFilters = { ...filters, type: e.target.value };
                setFilters(newFilters);
                setCurrentPage(1);
              }}
            >
              <option value="">All Formats</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="other">Docs/Other</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase ml-1">
              Size (Min KB)
            </label>
            <input
              type="number"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={filters.minSize || ""}
              onChange={(e) =>
                setFilters({ ...filters, minSize: Number(e.target.value) })
              }
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                setCurrentPage(1);
                mutate();
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl transition-all"
            >
              Apply
            </button>
            <button
              onClick={() => {
                const reset = { type: "", search: "", minSize: 0, maxSize: 0 };
                setFilters(reset);
                setCurrentPage(1);
              }}
              className="p-2.5 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
              title="Reset"
            >
              <FiRefreshCw />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {/* Table Header (Desktop) */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-800 bg-slate-900/30 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-1">Preview</div>
          <div className="col-span-4">File Details</div>
          <div className="col-span-2">Size</div>
          <div className="col-span-2">Modified</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        {/* List / Grid */}
        <div className="divide-y divide-slate-800">
          {isLoading ? (
            <div className="p-20 text-center">
              <div className="inline-block animate-spin mb-4">
                <FiRefreshCw size={32} className="text-blue-500" />
              </div>
              <p className="text-slate-400 animate-pulse">
                Fetching objects from S3...
              </p>
            </div>
          ) : objects.length === 0 ? (
            <div className="p-20 text-center space-y-4">
              <div className="flex justify-center">
                <FiLayers size={48} className="text-slate-700" />
              </div>
              <p className="text-slate-400">
                No assets found matching your criteria.
              </p>
            </div>
          ) : (
            objects.map((obj: BucketObjectItem) => (
              <div
                key={obj.key}
                className="group hover:bg-slate-800/30 transition-all p-4 md:px-6 md:py-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Preview Section */}
                  <div className="col-span-1 flex items-center justify-center md:justify-start">
                    <div className="relative h-14 w-14 rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center group-hover:border-blue-500/50 transition-colors">
                      {obj.type === "image" ? (
                        <img
                          src={obj.url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <TypeIcon
                          type={obj.type}
                          className="text-slate-500 text-xl"
                        />
                      )}
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="col-span-1 md:col-span-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium truncate block max-w-50 md:max-w-xs">
                        {obj.key}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${
                          obj.type === "image"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : obj.type === "video"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-slate-700 text-slate-400"
                        }`}
                      >
                        {obj.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 md:hidden">
                      <span className="flex items-center gap-1">
                        <FiHardDrive /> {formatFileSize(obj.size)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiCalendar />{" "}
                        {obj.lastModified
                          ? new Date(obj.lastModified).toLocaleDateString()
                          : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Size (Desktop Only) */}
                  <div className="hidden md:block col-span-2 text-sm text-slate-300 font-mono">
                    {formatFileSize(obj.size)}
                  </div>

                  {/* Date (Desktop Only) */}
                  <div className="hidden md:block col-span-2 text-sm text-slate-400">
                    {obj.lastModified
                      ? new Date(obj.lastModified).toLocaleDateString()
                      : "-"}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 md:col-span-3 flex items-center justify-end gap-2 mt-2 md:mt-0">
                    <a
                      href={obj.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-slate-800"
                      title="View External"
                    >
                      <FiExternalLink size={18} />
                    </a>
                    <button
                      onClick={() => handleCopy(obj.url)}
                      className="p-2.5 rounded-xl bg-slate-900 text-slate-400 hover:text-blue-400 hover:bg-slate-700 transition-all border border-slate-800"
                      title="Copy URL"
                    >
                      <FiClipboard size={18} />
                    </button>
                    <button
                      onClick={() => setSelectedForDelete(obj)}
                      className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                      title="Delete Asset"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Professional Pagination */}
        <div className="bg-slate-900/50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
          <div className="text-sm text-slate-400">
            Showing{" "}
            <span className="text-white font-medium">{objects.length}</span> of{" "}
            <span className="text-white font-medium">
              {pagination.totalItems}
            </span>{" "}
            assets
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={!pagination.hasPrevPage || isLoading}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-all"
            >
              <FiChevronLeft size={20} />
            </button>

            <div className="flex items-center px-4 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-sm font-medium text-slate-300">
              Page {pagination.currentPage} / {pagination.totalPages}
            </div>

            <button
              disabled={!pagination.hasNextPage || isLoading}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-all"
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Modern Deletion Modal */}
      {selectedForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setSelectedForDelete(null)}
          />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiAlertTriangle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Delete Asset?
              </h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                This action is permanent. The file{" "}
                <span className="text-slate-200 font-mono italic">
                  "{selectedForDelete.key}"
                </span>{" "}
                will be removed from S3.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting && <FiRefreshCw className="animate-spin" />}
                  {isDeleting ? "Deleting File..." : "Confirm Deletion"}
                </button>
                <button
                  onClick={() => setSelectedForDelete(null)}
                  className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BucketManager;
