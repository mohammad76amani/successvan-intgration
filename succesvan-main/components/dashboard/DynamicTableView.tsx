"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Image from "next/image";
import { format } from "date-fns";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FiTrash2,
  FiEye,
  FiX,
  FiEdit2,
  FiCopy,
  FiInbox,
  FiAlertCircle,
  FiFilter,
  FiPower,
  FiSearch,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import "./tooltip.css";
import "./datepicker.css";
import CustomSelect from "@/components/ui/CustomSelect";
import {
  AddOn,
  Category,
  DynamicTableViewProps,
  WorkingTime,
} from "@/types/type";
import { showToast } from "@/lib/toast";
import { getWorkingDayWindow } from "@/lib/specialDaySchedule";

const fetcher = (url: string) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  }).then((res) => res.json());
};

export default function DynamicTableView<
  T extends { _id?: string; id?: string },
>({
  apiEndpoint,
  title,
  columns,
  onEdit,
  editButtonClass = "",
  onDuplicate,
  onStatusToggle,
  onMutate,
  itemsPerPage = 15,
  hideDelete = false,
  hideViewBtn = false,
  hiddenColumns = [],
  filters = [],
  defaultFilters = {},
}: DynamicTableViewProps<T>) {
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<T | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [togglingIds, setTogglingIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [tempDateRanges, setTempDateRanges] = useState<
    Record<string, [Date | null, Date | null]>
  >({});
  const [datePickerAnchorMonths, setDatePickerAnchorMonths] = useState<
    Record<string, Date>
  >({});
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const startToggling = (id: string) =>
    setTogglingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const stopToggling = (id: string) =>
    setTogglingIds((prev) => prev.filter((x) => x !== id));
  const isTogglingId = (id: string) => togglingIds.includes(id);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [dateRanges, setDateRanges] = useState<
    Record<string, [Date | null, Date | null]>
  >({});
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>(
    {},
  );

  const item = viewingItem as Record<string, any>;

  const buildUrl = () => {
    const params = new URLSearchParams();
    params.append("page", currentPage.toString());
    params.append("limit", itemsPerPage.toString());

    Object.entries(defaultFilters).forEach(([key, value]) => {
      if (value && !appliedFilters[key.replace("_ne", "")]) {
        params.append(key, value);
      }
    });

    // ✅ Sort params اضافه شد
    if (sortField) {
      params.append("sortBy", sortField);
      params.append("sortOrder", sortOrder);
    }

    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value) {
        if (key.endsWith("Min")) {
          const baseKey = key.slice(0, -3);
          params.append(`${baseKey}Min`, value);
        } else if (key.endsWith("Max")) {
          const baseKey = key.slice(0, -3);
          params.append(`${baseKey}Max`, value);
        } else {
          params.append(key, value);
        }
      }
    });

    // اصلاح Date Ranges - بدون timezone issue
    Object.entries(dateRanges).forEach(([key, [start, end]]) => {
      if (start) {
        const year = start.getFullYear();
        const month = String(start.getMonth() + 1).padStart(2, "0");
        const day = String(start.getDate()).padStart(2, "0");
        params.append(`${key}Start`, `${year}-${month}-${day}`);
      }
      if (end) {
        const year = end.getFullYear();
        const month = String(end.getMonth() + 1).padStart(2, "0");
        const day = String(end.getDate()).padStart(2, "0");
        params.append(`${key}End`, `${year}-${month}-${day}`);
      }
    });

    const separator = apiEndpoint.includes("?") ? "&" : "?";
    return `${apiEndpoint}${separator}${params.toString()}`;
  };

  const { data, error, isLoading, mutate } = useSWR(buildUrl(), fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  useEffect(() => {
    if (onMutate && mutate) {
      onMutate(mutate);
    }
  }, [mutate, onMutate]);
  // Add this after other useEffect hooks
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!activeFilter) return;
      const target = e.target as Element;
      // اگه کلیک داخل modal موبایل یا dropdown دسکتاپ بود، نبند
      if (
        target.closest(".filter-dropdown") ||
        target.closest(".filter-modal") ||
        target.closest(".react-datepicker") ||
        target.closest(".react-datepicker__portal") ||
        target.closest('[class*="custom-select"]')
      ) {
        return;
      }
      // فقط در دسکتاپ: اگه خارج از relative کلیک شد، ببند
      if (!target.closest(".relative")) {
        setActiveFilter(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeFilter]);

  const getActiveDateRange = (key: string): [Date | null, Date | null] => {
    // خیلی مهم:
    // اگر tempDateRanges برای این فیلتر وجود دارد، حتی اگر end آن null باشد
    // باید همان temp استفاده شود و نباید از dateRanges قبلی fallback بگیریم.
    if (Object.prototype.hasOwnProperty.call(tempDateRanges, key)) {
      return tempDateRanges[key] || [null, null];
    }

    return dateRanges[key] || [null, null];
  };

  const isSameDay = (a: Date | null, b: Date | null) => {
    if (!a || !b) return false;

    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const isBetweenDays = (day: Date, start: Date | null, end: Date | null) => {
    if (!start || !end) return false;

    const d = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
    ).getTime();
    const s = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
    ).getTime();
    const e = new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate(),
    ).getTime();

    return d > Math.min(s, e) && d < Math.max(s, e);
  };
  const getDatesBetween = (start: Date | null, end: Date | null) => {
    if (!start || !end) return [];

    const dates: Date[] = [];

    const startTime = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
    ).getTime();

    const endTime = new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate(),
    ).getTime();

    const from = Math.min(startTime, endTime);
    const to = Math.max(startTime, endTime);

    const current = new Date(from);
    current.setDate(current.getDate() + 1);

    while (current.getTime() < to) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };
  const formatRangeLabel = (range?: [Date | null, Date | null]) => {
    const [start, end] = range || [null, null];

    if (!start && !end) return "";
    if (start && !end)
      return `${format(start, "dd/MM/yyyy")} → Select end date`;
    if (!start && end)
      return `Select start date → ${format(end, "dd/MM/yyyy")}`;

    return `${format(start!, "dd/MM/yyyy")} → ${format(end!, "dd/MM/yyyy")}`;
  };

  const renderDateRangePicker = (f: any, monthsShown = 2) => {
    const [startDate, endDate] = getActiveDateRange(f.key);
    const anchorMonth = getDatePickerAnchorMonth(f.key, startDate);

    const highlightedRange: Array<Record<string, Date[]>> = [];

    if (startDate) {
      highlightedRange.push({
        "svh-range-start": [startDate],
      });
    }

    if (endDate) {
      highlightedRange.push({
        "svh-range-end": [endDate],
      });
    }

    const middleDates = getDatesBetween(startDate, endDate);

    if (middleDates.length > 0) {
      highlightedRange.push({
        "svh-range-middle": middleDates,
      });
    }

    return (
      <div className="svh-date-filter flex flex-col gap-2">
        <DatePicker
          selectsRange
          startDate={startDate}
          endDate={endDate}
          onCalendarOpen={() => {
            setDatePickerAnchorMonths((prev) => ({
              ...prev,
              [f.key]: getMonthStart(startDate || new Date()),
            }));
          }}
          onMonthChange={(date: Date) => {
            setDatePickerAnchorMonths((prev) => ({
              ...prev,
              [f.key]: getMonthStart(date),
            }));
          }}
          onChange={(update: [Date | null, Date | null]) => {
            const [nextStart, nextEnd] = update;

            setTempDateRanges((prev) => ({
              ...prev,
              [f.key]: update,
            }));

            // وقتی کاربر start جدید انتخاب می‌کند، تقویم را روی ماه start نگه دار
            if (nextStart && !nextEnd) {
              setDatePickerAnchorMonths((prev) => ({
                ...prev,
                [f.key]: getMonthStart(nextStart),
              }));
            }

            // وقتی end انتخاب شد، anchor را عوض نکن
            // چون اگر عوض شود ماه دوم می‌پرد جای ماه اول
          }}
          placeholderText="Select date range"
          dateFormat="dd/MM/yyyy"
          monthsShown={monthsShown}
          focusSelectedMonth={false}
          disabledKeyboardNavigation
          isClearable
          shouldCloseOnSelect={true}
          openToDate={anchorMonth}
          highlightDates={highlightedRange}
          calendarClassName="svh-datepicker-calendar"
          wrapperClassName="w-full"
          className="w-full px-3 py-2 text-xs bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] focus:ring-2 focus:ring-[#fe9a00]/20 transition-all"
          dayClassName={(date) => {
            const classes: string[] = [];

            if (isSameDay(date, startDate)) classes.push("svh-range-start");
            if (isSameDay(date, endDate)) classes.push("svh-range-end");
            if (isBetweenDays(date, startDate, endDate)) {
              classes.push("svh-range-middle");
            }

            return classes.join(" ");
          }}
        />

        {(startDate || endDate) && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-[#fe9a00]/25 bg-[#fe9a00]/10 px-3 py-2">
            <span className="text-[11px] font-semibold text-[#fe9a00]">
              {formatRangeLabel([startDate, endDate])}
            </span>

            {!endDate && startDate && (
              <span className="shrink-0 rounded-full bg-orange-400/15 px-2 py-0.5 text-[10px] font-bold text-orange-300">
                Pick end
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const getMonthStart = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const getDatePickerAnchorMonth = (key: string, startDate: Date | null) => {
    return (
      datePickerAnchorMonths[key] || getMonthStart(startDate || new Date())
    );
  };

  // در handleFilterApply
  const handleFilterApply = () => {
    let hasIncompleteDateFilter = false;
    const nextDateRanges = { ...dateRanges };

    filters.forEach((f) => {
      if (f.type !== "date") return;

      const [start, end] = getActiveDateRange(f.key);

      if ((start && !end) || (!start && end)) {
        hasIncompleteDateFilter = true;
        showToast.error(
          `Please select both start and end dates for ${f.label}`,
        );
        return;
      }

      if (start && end) {
        nextDateRanges[f.key] = [start, end];
      }
    });

    if (hasIncompleteDateFilter) return;

    setDateRanges(nextDateRanges);
    setAppliedFilters(filterValues);
    setCurrentPage(1);
    setActiveFilter(null);
  };

  const handleFilterReset = () => {
    setFilterValues({});
    setTempDateRanges({}); // این خط را اضافه کنید

    setDateRanges({});
    setAppliedFilters({});
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    if (sortField === key) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else {
        // سومین کلیک: حذف sort
        setSortField(null);
        setSortOrder("asc");
      }
    } else {
      setSortField(key);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const items = Array.isArray(data?.data) ? data.data : [];
  const totalPages = data?.pagination?.pages || 1;
  const totalItems = data?.pagination?.total ?? items.length;
  const hasFilters =
    Object.values(appliedFilters).some((v) => v) ||
    Object.values(dateRanges).some(([start, end]) => start || end);
  const isEmptyAfterFilter =
    !isLoading && !error && items.length === 0 && hasFilters;

  const visibleColumns = columns.filter(
    (col) => !hiddenColumns.includes(col.key),
  );

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${apiEndpoint}/${deletingId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Delete failed");

      showToast.success("Deleted successfully!");
      setIsDeleteOpen(false);
      setDeletingId(null);
      if (typeof mutate === "function") mutate(undefined, { revalidate: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete failed";
      showToast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortField !== columnKey) {
      return (
        <span className="inline-flex flex-col ml-1 opacity-30 group-hover:opacity-60 transition-opacity">
          <FiChevronUp className="text-[8px] -mb-1" />
          <FiChevronDown className="text-[8px]" />
        </span>
      );
    }
    return sortOrder === "asc" ? (
      <FiArrowUp className="inline ml-1 text-[#fe9a00] text-xs" />
    ) : (
      <FiArrowDown className="inline ml-1 text-[#fe9a00] text-xs" />
    );
  };
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  };

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 border-4 border-[#fe9a00]/30 border-t-[#fe9a00] rounded-full animate-spin mb-4"></div>
        <p className="text-gray-300 text-lg font-semibold">
          Loading {title}...
        </p>
        <p className="text-gray-500 text-sm mt-2">Please wait</p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
          <FiAlertCircle className="text-red-400 text-3xl" />
        </div>
        <p className="text-red-400 text-lg font-semibold">
          Failed to load data
        </p>
        <p className="text-gray-400 text-sm mt-2">Please try again later</p>
      </div>
    );

  if (isEmptyAfterFilter)
    return (
      <div className="space-y-4">
        {/* Filter Bar - Mobile Optimized */}
        {filters.length > 0 && (
          <div className="bg-white/2 border border-white/10 rounded-xl p-3">
            {/* Compact Filter Pills Row */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 pr-2 border-r border-white/10">
                <FiFilter className="text-[#fe9a00] text-sm" />
                <span className="text-xs font-bold text-white">Filters:</span>
              </div>

              {filters.map((f) => {
                const hasValue =
                  f.type === "range"
                    ? filterValues[`${f.key}Min`] || filterValues[`${f.key}Max`]
                    : f.type === "date"
                      ? dateRanges[f.key]?.[0] && dateRanges[f.key]?.[1] // فقط وقتی هر دو تاریخ set شده‌اند
                      : filterValues[f.key];

                return (
                  <div key={f.key} className="relative">
                    {/* Filter Pill Button */}
                    <button
                      onClick={() =>
                        setActiveFilter(activeFilter === f.key ? null : f.key)
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        hasValue
                          ? "bg-[#fe9a00] text-slate-900"
                          : activeFilter === f.key
                            ? "bg-white/20 text-white"
                            : "bg-white/10 text-gray-300 hover:bg-white/15"
                      }`}
                    >
                      {f.label}
                      {hasValue && (
                        <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
                      )}
                      <FiChevronDown
                        className={`text-xs transition-transform ${
                          activeFilter === f.key ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown Filter Input */}
                    {activeFilter === f.key && (
                      <>
                        {/* ===== MOBILE: Modal وسط صفحه ===== */}
                        <div
                          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                          onMouseDown={(e) => {
                            if (e.target === e.currentTarget)
                              setActiveFilter(null);
                          }}
                        >
                          <div className="filter-modal bg-[#1a2847] border border-white/20 rounded-xl shadow-2xl p-4 w-full max-w-sm">
                            <div className="bg-[#1a2847] border border-white/20 rounded-xl shadow-2xl p-4 w-full max-w-sm">
                              {/* Header Modal */}
                              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                                <label className="text-sm font-bold text-white">
                                  {f.label}
                                </label>
                                <button
                                  onClick={() => setActiveFilter(null)}
                                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                  <FiX className="text-gray-400 text-lg" />
                                </button>
                              </div>

                              <div className="flex flex-col gap-2">
                                {/* همه محتوای داخل div قبلی رو اینجا کپی کن - از text input تا action buttons */}

                                {f.type === "text" && (
                                  <input
                                    type="text"
                                    placeholder={`Enter ${f.label.toLowerCase()}...`}
                                    value={filterValues[f.key] || ""}
                                    onChange={(e) =>
                                      setFilterValues((p) => ({
                                        ...p,
                                        [f.key]: e.target.value,
                                      }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleFilterApply();
                                        setActiveFilter(null);
                                      }
                                    }}
                                    autoFocus
                                    className="px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] w-full"
                                  />
                                )}

                                {f.type === "select" && (
                                  <CustomSelect
                                    compact
                                    options={f.options || []}
                                    value={filterValues[f.key] || ""}
                                    onChange={(val) => {
                                      setFilterValues((p) => ({
                                        ...p,
                                        [f.key]: val,
                                      }));
                                      // ✅ دیگه بسته نمیشه - کاربر باید Apply بزنه
                                    }}
                                    placeholder={`Select ${f.label}`}
                                  />
                                )}

                                {f.type === "date" &&
                                  renderDateRangePicker(f, 1)}

                                {f.type === "range" && (
                                  <div className="flex gap-2">
                                    <input
                                      type={
                                        f.rangeType === "number"
                                          ? "number"
                                          : "text"
                                      }
                                      placeholder="Min"
                                      value={filterValues[`${f.key}Min`] || ""}
                                      onChange={(e) =>
                                        setFilterValues((p) => ({
                                          ...p,
                                          [`${f.key}Min`]: e.target.value,
                                        }))
                                      }
                                      className="flex-1 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                                      min={
                                        f.rangeType === "number"
                                          ? "0"
                                          : undefined
                                      }
                                      step={
                                        f.rangeType === "number"
                                          ? "0.01"
                                          : undefined
                                      }
                                    />
                                    <input
                                      type={
                                        f.rangeType === "number"
                                          ? "number"
                                          : "text"
                                      }
                                      placeholder="Max"
                                      value={filterValues[`${f.key}Max`] || ""}
                                      onChange={(e) =>
                                        setFilterValues((p) => ({
                                          ...p,
                                          [`${f.key}Max`]: e.target.value,
                                        }))
                                      }
                                      className="flex-1 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                                      min={
                                        f.rangeType === "number"
                                          ? "0"
                                          : undefined
                                      }
                                      step={
                                        f.rangeType === "number"
                                          ? "0.01"
                                          : undefined
                                      }
                                    />
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2 border-t border-white/10">
                                  <button
                                    onClick={() => {
                                      if (f.type === "range") {
                                        setFilterValues((p) => ({
                                          ...p,
                                          [`${f.key}Min`]: "",
                                          [`${f.key}Max`]: "",
                                        }));
                                      } else if (f.type === "date") {
                                        setTempDateRanges((p) => ({
                                          ...p,
                                          [f.key]: [null, null],
                                        }));
                                        setDatePickerAnchorMonths((p) => {
                                          const next = { ...p };
                                          delete next[f.key];
                                          return next;
                                        });
                                        setDateRanges((p) => ({
                                          ...p,
                                          [f.key]: [null, null],
                                        }));
                                      } else {
                                        setFilterValues((p) => ({
                                          ...p,
                                          [f.key]: "",
                                        }));
                                      }
                                      setActiveFilter(null);
                                    }}
                                    className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg transition-colors"
                                  >
                                    Clear
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleFilterApply();
                                      setActiveFilter(null);
                                    }}
                                    className="flex-1 px-3 py-2 bg-[#fe9a00] hover:bg-[#fe9a00]/90 text-slate-900 text-sm font-bold rounded-lg transition-colors"
                                  >
                                    Apply
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ===== DESKTOP: Dropdown معمولی ===== */}
                        <div className="hidden md:block absolute top-full left-0 mt-2 bg-[#1a2847] border border-white/20 rounded-lg shadow-xl p-3 z-50 min-w-70">
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-semibold text-gray-400 uppercase">
                              {f.label}
                            </label>

                            {/* همون محتوای قبلی رو اینجا هم بذار */}
                            {f.type === "text" && (
                              <input
                                type="text"
                                placeholder={`Enter ${f.label.toLowerCase()}...`}
                                value={filterValues[f.key] || ""}
                                onChange={(e) =>
                                  setFilterValues((p) => ({
                                    ...p,
                                    [f.key]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleFilterApply();
                                    setActiveFilter(null);
                                  }
                                }}
                                autoFocus
                                className="px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] w-full"
                              />
                            )}
                            {f.type === "select" && (
                              <CustomSelect
                                compact
                                options={f.options || []}
                                value={filterValues[f.key] || ""}
                                onChange={(val) => {
                                  setFilterValues((p) => ({
                                    ...p,
                                    [f.key]: val,
                                  }));
                                  // ✅ دیگه بسته نمیشه - کاربر باید Apply بزنه
                                }}
                                placeholder={`Select ${f.label}`}
                              />
                            )}

                            {f.type === "date" && renderDateRangePicker(f, 2)}

                            {f.type === "range" && (
                              <div className="flex gap-2">
                                <input
                                  type={
                                    f.rangeType === "number" ? "number" : "text"
                                  }
                                  placeholder="Min"
                                  value={filterValues[`${f.key}Min`] || ""}
                                  onChange={(e) =>
                                    setFilterValues((p) => ({
                                      ...p,
                                      [`${f.key}Min`]: e.target.value,
                                    }))
                                  }
                                  className="flex-1 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                                />
                                <input
                                  type={
                                    f.rangeType === "number" ? "number" : "text"
                                  }
                                  placeholder="Max"
                                  value={filterValues[`${f.key}Max`] || ""}
                                  onChange={(e) =>
                                    setFilterValues((p) => ({
                                      ...p,
                                      [`${f.key}Max`]: e.target.value,
                                    }))
                                  }
                                  className="flex-1 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                                />
                              </div>
                            )}

                            <div className="flex gap-2 pt-2 border-t border-white/10">
                              <button
                                onClick={() => {
                                  if (f.type === "range") {
                                    setFilterValues((p) => ({
                                      ...p,
                                      [`${f.key}Min`]: "",
                                      [`${f.key}Max`]: "",
                                    }));
                                  } else if (f.type === "date") {
                                    setTempDateRanges((p) => ({
                                      ...p,
                                      [f.key]: [null, null],
                                    }));
                                    setDatePickerAnchorMonths((p) => {
                                      const next = { ...p };
                                      delete next[f.key];
                                      return next;
                                    });
                                    setDateRanges((p) => ({
                                      ...p,
                                      [f.key]: [null, null],
                                    }));
                                  } else {
                                    setFilterValues((p) => ({
                                      ...p,
                                      [f.key]: "",
                                    }));
                                  }
                                  setActiveFilter(null);
                                }}
                                className="flex-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors"
                              >
                                Clear
                              </button>
                              <button
                                onClick={() => {
                                  handleFilterApply();
                                  setActiveFilter(null);
                                }}
                                className="flex-1 px-3 py-1.5 bg-[#fe9a00] hover:bg-[#fe9a00]/90 text-slate-900 text-xs font-bold rounded-lg transition-colors"
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-auto pl-2 border-l border-white/10">
                {/* <button
                  onClick={handleFilterApply}
                  className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 bg-[#fe9a00] hover:bg-[#fe9a00]/90 text-slate-900 text-xs md:text-sm font-bold rounded-lg transition-all shadow-lg shadow-[#fe9a00]/20"
                >
                  <FiSearch className="text-xs md:text-sm" />
                  <span className="hidden sm:inline">Apply</span>
                  <span className="sm:hidden">Apply</span>
                </button> */}
                {hasFilters && (
                  <button
                    onClick={handleFilterReset}
                    className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs md:text-sm font-semibold rounded-lg transition-all border border-red-500/20"
                  >
                    <FiRefreshCw className="text-xs md:text-sm" />
                    <span className="hidden sm:inline">Reset</span>
                    <span className="sm:hidden">Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Filter Tags (if any) */}
            {hasFilters && (
              <>
                <div className="w-full h-px bg-white/5 mt-3" />
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {filters.map((filter) => {
                    if (filter.type === "range") {
                      const minValue = appliedFilters[`${filter.key}Min`];
                      const maxValue = appliedFilters[`${filter.key}Max`];
                      if (!minValue && !maxValue) return null;
                      return (
                        <span
                          key={filter.key}
                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#fe9a00]/15 text-[#fe9a00] border border-[#fe9a00]/25 rounded-full text-xs font-medium"
                        >
                          {filter.label}: {minValue || "0"} – {maxValue || "∞"}
                          <button
                            onClick={() => {
                              setAppliedFilters((prev) => ({
                                ...prev,
                                [`${filter.key}Min`]: "",
                                [`${filter.key}Max`]: "",
                              }));
                              setFilterValues((prev) => ({
                                ...prev,
                                [`${filter.key}Min`]: "",
                                [`${filter.key}Max`]: "",
                              }));
                            }}
                            className="hover:text-white transition-colors"
                          >
                            <FiX className="text-xs" />
                          </button>
                        </span>
                      );
                    }
                    if (filter.type === "date") {
                      const range = dateRanges[filter.key];
                      const [start, end] = range || [null, null];

                      if (!start && !end) return null;

                      return (
                        <span
                          key={filter.key}
                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#fe9a00]/15 text-[#fe9a00] border border-[#fe9a00]/25 rounded-full text-xs font-medium"
                        >
                          {filter.label}: {formatRangeLabel(range)}
                          <button
                            onClick={() => {
                              setDateRanges((prev) => ({
                                ...prev,
                                [filter.key]: [null, null],
                              }));
                              setTempDateRanges((prev) => ({
                                ...prev,
                                [filter.key]: [null, null],
                              }));
                            }}
                            className="hover:text-white transition-colors"
                          >
                            <FiX className="text-xs" />
                          </button>
                        </span>
                      );
                    }
                    if (!appliedFilters[filter.key]) return null;
                    return (
                      <span
                        key={filter.key}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#fe9a00]/15 text-[#fe9a00] border border-[#fe9a00]/25 rounded-full text-xs font-medium"
                      >
                        {filter.label}: {appliedFilters[filter.key]}
                        <button
                          onClick={() => {
                            setAppliedFilters((prev) => ({
                              ...prev,
                              [filter.key]: "",
                            }));
                            setFilterValues((prev) => ({
                              ...prev,
                              [filter.key]: "",
                            }));
                          }}
                          className="hover:text-white transition-colors"
                        >
                          <FiX className="text-xs" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-[#fe9a00]/20 rounded-full flex items-center justify-center mb-4">
            <FiInbox className="text-[#fe9a00] text-3xl" />
          </div>
          <p className="text-gray-300 text-lg font-semibold">
            No {title.toLowerCase()} found
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Try adjusting your filters
          </p>
          <button
            onClick={handleFilterReset}
            className="mt-4 px-4 py-2 bg-[#fe9a00]/20 hover:bg-[#fe9a00]/30 text-[#fe9a00] rounded-lg transition-colors font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>
    );

  if (items.length === 0)
    return (
      <div className="space-y-4">
        {/* Filter Bar - Mobile Optimized */}
        {filters.length > 0 && (
          <div className="bg-white/2 border border-white/10 rounded-xl p-3 md:p-4">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FiFilter className="text-[#fe9a00] text-sm" />
                <span className="text-xs md:text-sm font-bold text-white">
                  Filters
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleFilterApply}
                  className="flex items-center gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 bg-[#fe9a00] hover:bg-[#fe9a00]/90 text-slate-900 text-xs md:text-sm font-bold rounded-lg transition-all"
                >
                  <FiSearch className="text-xs md:text-sm" />
                  <span className="hidden sm:inline">Apply</span>
                </button>
                {hasFilters && (
                  <button
                    onClick={handleFilterReset}
                    className="flex items-center gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs md:text-sm font-semibold rounded-lg transition-all border border-red-500/20"
                  >
                    <FiRefreshCw className="text-xs md:text-sm" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Inputs Grid - 2 columns on mobile, 3-4 on larger screens */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filters.map((f) => (
                <div key={f.key} className="flex flex-col gap-1">
                  <label className="text-[9px] md:text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                    {f.label}
                  </label>

                  {f.type === "text" && (
                    <input
                      type="text"
                      placeholder={f.label}
                      value={filterValues[f.key] || ""}
                      onChange={(e) =>
                        setFilterValues((p) => ({
                          ...p,
                          [f.key]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleFilterApply()
                      }
                      className="px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm bg-white/5 border border-white/15 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#fe9a00] focus:bg-white/10 transition-all w-full"
                    />
                  )}

                  {f.type === "select" && (
                    <CustomSelect
                      compact
                      options={f.options || []}
                      value={filterValues[f.key] || ""}
                      onChange={(val) => {
                        setFilterValues((p) => ({ ...p, [f.key]: val }));
                        // ✅ دیگه بسته نمیشه - کاربر باید Apply بزنه
                      }}
                      placeholder={`Select ${f.label}`}
                    />
                  )}

                  {f.type === "date" && renderDateRangePicker(f, 2)}

                  {f.type === "range" && (
                    <div className="flex items-center gap-1">
                      <input
                        type={f.rangeType === "number" ? "number" : "text"}
                        placeholder="Min"
                        value={filterValues[`${f.key}Min`] || ""}
                        onChange={(e) =>
                          setFilterValues((p) => ({
                            ...p,
                            [`${f.key}Min`]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleFilterApply()
                        }
                        className="flex-1 px-1.5 md:px-2 py-1.5 md:py-2 text-[10px] md:text-xs bg-white/5 border border-white/15 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#fe9a00] w-full"
                        min={f.rangeType === "number" ? "0" : undefined}
                        step={f.rangeType === "number" ? "0.01" : undefined}
                      />
                      <span className="text-gray-600 text-[10px]">–</span>
                      <input
                        type={f.rangeType === "number" ? "number" : "text"}
                        placeholder="Max"
                        value={filterValues[`${f.key}Max`] || ""}
                        onChange={(e) =>
                          setFilterValues((p) => ({
                            ...p,
                            [`${f.key}Max`]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleFilterApply()
                        }
                        className="flex-1 px-1.5 md:px-2 py-1.5 md:py-2 text-[10px] md:text-xs bg-white/5 border border-white/15 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#fe9a00] w-full"
                        min={f.rangeType === "number" ? "0" : undefined}
                        step={f.rangeType === "number" ? "0.01" : undefined}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Active Filter Tags */}
            {hasFilters && (
              <>
                <div className="w-full h-px bg-white/5 mt-3" />
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {filters.map((filter) => {
                    if (filter.type === "range") {
                      const minValue = appliedFilters[`${filter.key}Min`];
                      const maxValue = appliedFilters[`${filter.key}Max`];
                      if (!minValue && !maxValue) return null;
                      return (
                        <span
                          key={filter.key}
                          className="inline-flex items-center gap-1.5 px-2 md:px-3 py-0.5 md:py-1 bg-[#fe9a00]/15 text-[#fe9a00] border border-[#fe9a00]/25 rounded-full text-[10px] md:text-xs font-medium"
                        >
                          <span className="truncate max-w-25 md:max-w-none">
                            {filter.label}: {minValue || "0"} –{" "}
                            {maxValue || "∞"}
                          </span>
                          <button
                            onClick={() => {
                              setAppliedFilters((prev) => ({
                                ...prev,
                                [`${filter.key}Min`]: "",
                                [`${filter.key}Max`]: "",
                              }));
                              setFilterValues((prev) => ({
                                ...prev,
                                [`${filter.key}Min`]: "",
                                [`${filter.key}Max`]: "",
                              }));
                            }}
                            className="hover:text-white transition-colors shrink-0"
                          >
                            <FiX className="text-[10px] md:text-xs" />
                          </button>
                        </span>
                      );
                    }
                    if (!appliedFilters[filter.key]) return null;
                    return (
                      <span
                        key={filter.key}
                        className="inline-flex items-center gap-1.5 px-2 md:px-3 py-0.5 md:py-1 bg-[#fe9a00]/15 text-[#fe9a00] border border-[#fe9a00]/25 rounded-full text-[10px] md:text-xs font-medium"
                      >
                        <span className="truncate max-w-25 md:max-w-none">
                          {filter.label}: {appliedFilters[filter.key]}
                        </span>
                        <button
                          onClick={() => {
                            setAppliedFilters((prev) => ({
                              ...prev,
                              [filter.key]: "",
                            }));
                            setFilterValues((prev) => ({
                              ...prev,
                              [filter.key]: "",
                            }));
                          }}
                          className="hover:text-white transition-colors shrink-0"
                        >
                          <FiX className="text-[10px] md:text-xs" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-[#fe9a00]/20 rounded-full flex items-center justify-center mb-4">
            <FiInbox className="text-[#fe9a00] text-3xl" />
          </div>
          <p className="text-gray-300 text-lg font-semibold">
            No {title.toLowerCase()} yet
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Start by creating your first {title.toLowerCase()}
          </p>
        </div>
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Filter Bar - Mobile Optimized */}
      {filters.length > 0 && (
        <div className="bg-white/2 border border-white/10 rounded-xl p-3">
          {/* Compact Filter Pills Row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 pr-2 border-r border-white/10">
              <FiFilter className="text-[#fe9a00] text-sm" />
              <span className="text-xs font-bold text-white">Filters:</span>
            </div>

            {filters.map((f) => {
              const hasValue =
                f.type === "range"
                  ? filterValues[`${f.key}Min`] || filterValues[`${f.key}Max`]
                  : f.type === "date"
                    ? dateRanges[f.key]?.[0] || dateRanges[f.key]?.[1]
                    : filterValues[f.key];

              return (
                <div key={f.key} className="relative">
                  {/* Filter Pill Button */}
                  <button
                    onClick={() =>
                      setActiveFilter(activeFilter === f.key ? null : f.key)
                    }
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      hasValue
                        ? "bg-[#fe9a00] text-slate-900"
                        : activeFilter === f.key
                          ? "bg-white/20 text-white"
                          : "bg-white/10 text-gray-300 hover:bg-white/15"
                    }`}
                  >
                    {f.label}
                    {hasValue && (
                      <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
                    )}
                    <FiChevronDown
                      className={`text-xs transition-transform ${
                        activeFilter === f.key ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Filter Input */}
                  {activeFilter === f.key && (
                    <>
                      {/* ===== MOBILE: Modal وسط صفحه ===== */}
                      <div
                        className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onMouseDown={(e) => {
                          if (e.target === e.currentTarget)
                            setActiveFilter(null);
                        }}
                      >
                        <div className="bg-[#1a2847] border border-white/20 rounded-xl shadow-2xl p-4 w-full max-w-sm">
                          {/* Header Modal */}
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                            <label className="text-sm font-bold text-white">
                              {f.label}
                            </label>
                            <button
                              onClick={() => setActiveFilter(null)}
                              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <FiX className="text-gray-400 text-lg" />
                            </button>
                          </div>

                          <div className="flex flex-col gap-2">
                            {/* همه محتوای داخل div قبلی رو اینجا کپی کن - از text input تا action buttons */}

                            {f.type === "text" && (
                              <input
                                type="text"
                                placeholder={`Enter ${f.label.toLowerCase()}...`}
                                value={filterValues[f.key] || ""}
                                onChange={(e) =>
                                  setFilterValues((p) => ({
                                    ...p,
                                    [f.key]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleFilterApply();
                                    setActiveFilter(null);
                                  }
                                }}
                                autoFocus
                                className="px-3 py-2 text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] w-full"
                              />
                            )}
                            {f.type === "select" && (
                              <CustomSelect
                                compact
                                options={f.options || []}
                                value={filterValues[f.key] || ""}
                                onChange={(val) => {
                                  setFilterValues((p) => ({
                                    ...p,
                                    [f.key]: val,
                                  }));
                                  // ✅ دیگه بسته نمیشه - کاربر باید Apply بزنه
                                }}
                                placeholder={`Select ${f.label}`}
                              />
                            )}

                            {f.type === "date" && renderDateRangePicker(f, 1)}

                            {f.type === "range" && (
                              <div className="grid grid-cols-2 gap-2 ">
                                <input
                                  type={
                                    f.rangeType === "number" ? "number" : "text"
                                  }
                                  placeholder="Min"
                                  value={filterValues[`${f.key}Min`] || ""}
                                  onChange={(e) =>
                                    setFilterValues((p) => ({
                                      ...p,
                                      [`${f.key}Min`]: e.target.value,
                                    }))
                                  }
                                  className=" px-3 py-2 text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                                  min={
                                    f.rangeType === "number" ? "0" : undefined
                                  }
                                  step={
                                    f.rangeType === "number"
                                      ? "0.01"
                                      : undefined
                                  }
                                />
                                <input
                                  type={
                                    f.rangeType === "number" ? "number" : "text"
                                  }
                                  placeholder="Max"
                                  value={filterValues[`${f.key}Max`] || ""}
                                  onChange={(e) =>
                                    setFilterValues((p) => ({
                                      ...p,
                                      [`${f.key}Max`]: e.target.value,
                                    }))
                                  }
                                  className=" px-3 py-2 text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                                  min={
                                    f.rangeType === "number" ? "0" : undefined
                                  }
                                  step={
                                    f.rangeType === "number"
                                      ? "0.01"
                                      : undefined
                                  }
                                />
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2 border-t border-white/10">
                              <button
                                onClick={() => {
                                  if (f.type === "range") {
                                    setFilterValues((p) => ({
                                      ...p,
                                      [`${f.key}Min`]: "",
                                      [`${f.key}Max`]: "",
                                    }));
                                  } else if (f.type === "date") {
                                    setTempDateRanges((p) => ({
                                      ...p,
                                      [f.key]: [null, null],
                                    }));
                                    setDatePickerAnchorMonths((p) => {
                                      const next = { ...p };
                                      delete next[f.key];
                                      return next;
                                    });
                                    setDateRanges((p) => ({
                                      ...p,
                                      [f.key]: [null, null],
                                    }));
                                  } else {
                                    setFilterValues((p) => ({
                                      ...p,
                                      [f.key]: "",
                                    }));
                                  }
                                  setActiveFilter(null);
                                }}
                                className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg transition-colors"
                              >
                                Clear
                              </button>
                              <button
                                onClick={() => {
                                  handleFilterApply();
                                  setActiveFilter(null);
                                }}
                                className="flex-1 px-3 py-2 bg-[#fe9a00] hover:bg-[#fe9a00]/90 text-slate-900 text-sm font-bold rounded-lg transition-colors"
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ===== DESKTOP: Dropdown معمولی ===== */}
                      <div className="hidden md:block absolute top-full -left-28 mt-2 bg-[#1a2847] border border-white/20 rounded-lg shadow-xl p-3 z-50 min-w-70">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-semibold text-gray-400 uppercase">
                            {f.label}
                          </label>

                          {/* همون محتوای قبلی رو اینجا هم بذار */}
                          {f.type === "text" && (
                            <input
                              type="text"
                              placeholder={`Enter ${f.label.toLowerCase()}...`}
                              value={filterValues[f.key] || ""}
                              onChange={(e) =>
                                setFilterValues((p) => ({
                                  ...p,
                                  [f.key]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleFilterApply();
                                  setActiveFilter(null);
                                }
                              }}
                              autoFocus
                              className="px-3 py-2 text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] w-full"
                            />
                          )}

                          {f.type === "select" && (
                            <CustomSelect
                              compact
                              options={f.options || []}
                              value={filterValues[f.key] || ""}
                              onChange={(val) => {
                                setFilterValues((p) => ({
                                  ...p,
                                  [f.key]: val,
                                }));
                                // ✅ دیگه بسته نمیشه - کاربر باید Apply بزنه
                              }}
                              placeholder={`Select ${f.label}`}
                            />
                          )}
                          {f.type === "date" && renderDateRangePicker(f, 2)}

                          {f.type === "range" && (
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type={
                                  f.rangeType === "number" ? "number" : "text"
                                }
                                placeholder="Min"
                                value={filterValues[`${f.key}Min`] || ""}
                                onChange={(e) =>
                                  setFilterValues((p) => ({
                                    ...p,
                                    [`${f.key}Min`]: e.target.value,
                                  }))
                                }
                                className=" px-3 py-2 text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                              />
                              <input
                                type={
                                  f.rangeType === "number" ? "number" : "text"
                                }
                                placeholder="Max"
                                value={filterValues[`${f.key}Max`] || ""}
                                onChange={(e) =>
                                  setFilterValues((p) => ({
                                    ...p,
                                    [`${f.key}Max`]: e.target.value,
                                  }))
                                }
                                className=" px-3 py-2 text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                              />
                            </div>
                          )}

                          <div className="flex gap-2 pt-2 border-t border-white/10">
                            <button
                              onClick={() => {
                                if (f.type === "range") {
                                  setFilterValues((p) => ({
                                    ...p,
                                    [`${f.key}Min`]: "",
                                    [`${f.key}Max`]: "",
                                  }));
                                } else if (f.type === "date") {
                                  setTempDateRanges((p) => ({
                                    ...p,
                                    [f.key]: [null, null],
                                  }));
                                  setDatePickerAnchorMonths((p) => {
                                    const next = { ...p };
                                    delete next[f.key];
                                    return next;
                                  });
                                  setDateRanges((p) => ({
                                    ...p,
                                    [f.key]: [null, null],
                                  }));
                                } else {
                                  setFilterValues((p) => ({
                                    ...p,
                                    [f.key]: "",
                                  }));
                                }
                                setActiveFilter(null);
                              }}
                              className="flex-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => {
                                handleFilterApply();
                                setActiveFilter(null);
                              }}
                              className="flex-1 px-3 py-1.5 bg-[#fe9a00] hover:bg-[#fe9a00]/90 text-slate-900 text-xs font-bold rounded-lg transition-colors"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-auto pl-2 border-l border-white/10">
              {hasFilters && (
                <button
                  onClick={handleFilterReset}
                  className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs md:text-sm font-semibold rounded-lg transition-all border border-red-500/20"
                >
                  <FiRefreshCw className="text-xs md:text-sm" />
                  <span className="hidden sm:inline">Reset</span>
                  <span className="sm:hidden">Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Tags (if any) */}
          {hasFilters && (
            <>
              <div className="w-full h-px bg-white/5 mt-3" />
              <div className="flex flex-wrap gap-1.5 mt-3">
                {filters.map((filter) => {
                  if (filter.type === "range") {
                    const minValue = appliedFilters[`${filter.key}Min`];
                    const maxValue = appliedFilters[`${filter.key}Max`];
                    if (!minValue && !maxValue) return null;
                    return (
                      <span
                        key={filter.key}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#fe9a00]/15 text-[#fe9a00] border border-[#fe9a00]/25 rounded-full text-xs font-medium"
                      >
                        {filter.label}: {minValue || "0"} – {maxValue || "∞"}
                        <button
                          onClick={() => {
                            setAppliedFilters((prev) => ({
                              ...prev,
                              [`${filter.key}Min`]: "",
                              [`${filter.key}Max`]: "",
                            }));
                            setFilterValues((prev) => ({
                              ...prev,
                              [`${filter.key}Min`]: "",
                              [`${filter.key}Max`]: "",
                            }));
                          }}
                          className="hover:text-white transition-colors"
                        >
                          <FiX className="text-xs" />
                        </button>
                      </span>
                    );
                  }
                  if (!appliedFilters[filter.key]) return null;
                  return (
                    <span
                      key={filter.key}
                      className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#fe9a00]/15 text-[#fe9a00] border border-[#fe9a00]/25 rounded-full text-xs font-medium"
                    >
                      {filter.label}: {appliedFilters[filter.key]}
                      <button
                        onClick={() => {
                          setAppliedFilters((prev) => ({
                            ...prev,
                            [filter.key]: "",
                          }));
                          setFilterValues((prev) => ({
                            ...prev,
                            [filter.key]: "",
                          }));
                        }}
                        className="hover:text-white transition-colors"
                      >
                        <FiX className="text-xs" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
      <div className="flex items-center justify-start">
        <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <span className="text-xs text-gray-400">Total:</span>
          <span className="text-sm font-bold text-[#fe9a00]">
            {totalItems.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        {sortField && (
          <div className="flex items-center gap-2 px-3 py-2 bg-white/3 border border-white/10 rounded-lg">
            <span className="text-xs text-gray-400">Sorted by:</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#fe9a00]/15 text-[#fe9a00] border border-[#fe9a00]/25 rounded-full text-xs font-medium">
              {columns.find((c) => String(c.key) === sortField)?.label ||
                sortField}
              {sortOrder === "asc" ? (
                <FiArrowUp className="text-xs" />
              ) : (
                <FiArrowDown className="text-xs" />
              )}
              <button
                onClick={() => {
                  setSortField(null);
                  setSortOrder("asc");
                }}
                className="hover:text-white transition-colors ml-0.5"
              >
                <FiX className="text-xs" />
              </button>
            </span>
          </div>
        )}
        <table className="w-full text-nowrap text-center">
          <thead className="border-b border-white/70">
            <tr>
              <th className="px-2 py-2 text-center text-white w-10 text-xs">#</th>
              {visibleColumns.map((col, colIdx) => {
                const isSortable = col.sortable !== false; // default: true
                const isActive = sortField === String(col.key);

                return (
                  <th
                    key={`${colIdx}-${String(col.key)}`}
                    className={`px-2 py-2 text-xs text-center text-white group ${
                      isSortable
                        ? "cursor-pointer select-none hover:bg-white/5 transition-colors"
                        : ""
                    } ${isActive ? "bg-white/5" : ""}`}
                    onClick={() => {
                      if (isSortable) handleSort(String(col.key));
                    }}
                  >
                    <span className="inline-flex items-center gap-0.5">
                      {col.label}
                      {isSortable && <SortIcon columnKey={String(col.key)} />}
                    </span>
                  </th>
                );
              })}
              <th className="px-2 py-2 text-center text-white font-bold text-xs">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: T, idx: number) => {
              const itemId =
                (item as any)._id || (item as any).id || String(idx);
              return (
                <tr
                  key={idx}
                  className="border-b border-white/10 hover:bg-white/10 transition-colors"
                >
                  <td className="px-2 py-1.5 text-gray-300 font-semibold text-xs">
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </td>
                  {visibleColumns.map((col, colIdx) => {
                    const cellValue = item[col.key];
                    let displayContent;

                    if (col.render) {
                      displayContent = col.render(
                        cellValue,
                        item,
                        idx,
                        data?.pagination,
                      );
                    } else if (
                      typeof cellValue === "object" &&
                      cellValue !== null
                    ) {
                      displayContent = JSON.stringify(cellValue);
                    } else {
                      displayContent = String(cellValue || "-");
                    }

                    return (
                      <td
                        key={`${colIdx}-${String(col.key)}`}
                        className="px-2 py-1.5 text-gray-300 text-xs"
                      >
                        {displayContent}
                      </td>
                    );
                  })}
                  <td className="px-2 py-1.5 justify-center items-center flex gap-1">
                    {!hideViewBtn && (
                      <button
                        data-tooltip="View"
                        onClick={() => {
                          setViewingItem(item);
                          setIsViewOpen(true);
                        }}
                        className="p-2 hover:bg-green-500/20 cursor-pointer rounded transition-colors tooltip"
                      >
                        <FiEye className="text-yellow-400" />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className={`p-2 hover:bg-blue-500/20 rounded cursor-pointer transition-colors tooltip ${editButtonClass}`}
                        data-tooltip="Edit"
                      >
                        <FiEdit2 className="text-blue-400" />
                      </button>
                    )}
                    {onDuplicate && (
                      <button
                        onClick={() => onDuplicate(item)}
                        className="p-2 hover:bg-purple-500/20 rounded cursor-pointer transition-colors tooltip"
                        data-tooltip="Duplicate"
                      >
                        <FiCopy className="text-purple-400" />
                      </button>
                    )}
                    {onStatusToggle && (
                      <button
                        onClick={async () => {
                          if (isTogglingId(itemId)) return;
                          startToggling(itemId);
                          try {
                            await Promise.resolve(onStatusToggle(item));
                          } catch (err) {
                            console.log("Status toggle failed:", err);
                          } finally {
                            stopToggling(itemId);
                          }
                        }}
                        className={`p-2 rounded cursor-pointer transition-colors tooltip ${
                          isTogglingId(itemId)
                            ? "opacity-60 cursor-not-allowed"
                            : "hover:bg-orange-500/20"
                        }`}
                        data-tooltip="Toggle Status"
                        disabled={isTogglingId(itemId)}
                      >
                        {isTogglingId(itemId) ? (
                          <span className="w-4 h-4 inline-block border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <FiPower
                            className={
                              (item as Record<string, unknown>).status ===
                              "active"
                                ? "text-green-400"
                                : "text-orange-400"
                            }
                          />
                        )}
                      </button>
                    )}
                    {!hideDelete && (
                      <button
                        onClick={() =>
                          handleDeleteClick(item._id || item.id || "")
                        }
                        className="p-2 hover:bg-red-500/20 mt-1.5 rounded cursor-pointer transition-colors tooltip"
                        data-tooltip="Delete"
                      >
                        <FiTrash2 className="text-red-400" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modals remain unchanged... I'll skip them for brevity but they stay the same */}

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <span className="text-xs text-gray-400">
            Page <span className="text-[#fe9a00] font-bold">{currentPage}</span>{" "}
            of <span className="text-white font-bold">{totalPages}</span>
          </span>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              First
            </button>

            {getPageNumbers().map((page, index) =>
              page === "..." ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 py-1 text-gray-500 text-sm"
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-9 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currentPage === page
                      ? "bg-[#fe9a00] text-slate-900 shadow-lg shadow-[#fe9a00]/20"
                      : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {page}
                </button>
              ),
            )}

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Last
            </button>
          </div>
        </div>
      )}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm min-h-screen z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2847] rounded-2xl max-w-sm w-full border border-white/10 shadow-2xl">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center shrink-0">
                  <FiAlertCircle className="text-red-400 text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">
                    Delete {title}?
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsDeleteOpen(false);
                    setDeletingId(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/30"
                >
                  {isDeleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewOpen && viewingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm min-h-screen z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2847] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-white/10 bg-[#1a2847]">
              <h2 className="text-2xl font-black text-white">View {title}</h2>
              <button
                onClick={() => setIsViewOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiX className="text-white text-xl" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {item.image && (
                <div>
                  <label className="text-sm font-semibold text-gray-400">
                    Image
                  </label>
                  <div className="mt-2 w-1/2 h-1/2">
                    <Image
                      src={item.image}
                      alt={title}
                      width={300}
                      height={200}
                      className="rounded-lg object-contain w-full"
                      unoptimized
                    />
                  </div>
                </div>
              )}
              {columns.map((col, colIdx) => {
                const isHidden = hiddenColumns.includes(col.key);
                const value = item[col.key as string];
                let displayValue;

                if (col.render) {
                  displayValue = col.render(value, viewingItem);
                } else if (typeof value === "object" && value !== null) {
                  displayValue = JSON.stringify(value);
                } else {
                  displayValue = String(value || "-");
                }

                return (
                  <div key={`${colIdx}-${String(col.key)}`}>
                    <label className="text-sm font-semibold text-gray-400">
                      {col.label}
                      {isHidden && (
                        <span className="text-xs text-gray-500 ml-2">
                          (Hidden in table)
                        </span>
                      )}
                    </label>
                    <div className="text-white mt-1">{displayValue}</div>
                  </div>
                );
              })}

              {item.category && (
                <div>
                  <label className="text-sm font-semibold text-gray-400">
                    Category
                  </label>
                  <div className="text-white mt-1">
                    <p className="mb-2">{item.category.name}</p>
                    {item.category?.image && (
                      <div className="mt-2">
                        <Image
                          src={item.category.image}
                          alt="Category"
                          width={200}
                          height={150}
                          className="rounded-lg object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {item.office && (
                <div>
                  <label className="text-sm font-semibold text-gray-400">
                    Office
                  </label>
                  <p className="text-white mt-1">{item.office.name}</p>
                </div>
              )}

              {item.categories && item.categories.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-400">
                    Categories
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.categories.map((cat: Category, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-[#fe9a00]/20 text-[#fe9a00] rounded-full text-sm"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {item.workingTime && item.workingTime.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-400">
                    Working Hours
                  </label>
                  <div className="mt-2 space-y-2">
                    {item.workingTime.map((wt: WorkingTime, idx: number) => (
                      <div
                        key={idx}
                        className="text-white text-sm bg-white/5 p-2 rounded"
                      >
                        <span className="font-semibold capitalize">
                          {wt.day}:
                        </span>{" "}
                        {wt.isOpen
                          ? (() => {
                              const pickupWindow = getWorkingDayWindow(
                                wt,
                                "pickup",
                              );
                              const returnWindow = getWorkingDayWindow(
                                wt,
                                "return",
                              );

                              return `Pickup ${
                                pickupWindow.isOpen
                                  ? `${pickupWindow.startTime} - ${pickupWindow.endTime}`
                                  : "Closed"
                              }, Return ${
                                returnWindow.isOpen
                                  ? `${returnWindow.startTime} - ${returnWindow.endTime}`
                                  : "Closed"
                              }`;
                            })()
                          : "Closed"}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {item.addOns && item.addOns.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-400">
                    Add-ons
                  </label>
                  <div className="mt-2 space-y-2">
                    {item.addOns.map(
                      (
                        addOnItem: {
                          addOn?: AddOn;
                          quantity: number;
                          selectedTierIndex?: number;
                        },
                        idx: number,
                      ) => {
                        const addon = addOnItem.addOn;
                        let price = 0;
                        let tierInfo = "";

                        if (addon?.pricingType === "flat") {
                          // Handle both old format (number) and new format (object)
                          if (
                            typeof addon.flatPrice === "object" &&
                            addon.flatPrice !== null
                          ) {
                            price = (addon.flatPrice as any).amount || 0;
                          } else {
                            price = addon.flatPrice || 0;
                          }
                        } else if (addon?.pricingType === "tiered") {
                          const tierIndex = addOnItem.selectedTierIndex ?? 0;
                          const tier = addon.tiers?.[tierIndex];
                          if (tier) {
                            price = tier.price;
                            tierInfo = ` (${tier.minDays}-${tier.maxDays} days)`;
                          }
                        }

                        return (
                          <div
                            key={idx}
                            className="text-white text-sm bg-white/5 p-3 rounded flex justify-between items-center"
                          >
                            <div className="flex flex-col">
                              <span className="font-semibold">
                                {addon?.name || "Unknown"}
                              </span>
                              {addon?.description && (
                                <span className="text-gray-400 text-xs mt-1">
                                  {addon.description}
                                </span>
                              )}
                              {tierInfo && (
                                <span className="text-[#fe9a00] text-xs mt-1">
                                  {tierInfo}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-gray-400">
                                Qty: {addOnItem.quantity}
                              </span>
                              <span className="font-semibold">£{price}</span>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}

              {item.servicesPeriod && (
                <div>
                  <label className="text-sm font-semibold text-gray-400">
                    Service Period (Days)
                  </label>
                  <div className="mt-2 space-y-2">
                    {Object.entries(item.servicesPeriod).map(
                      ([key, value]: [string, any]) => (
                        <div
                          key={key}
                          className="text-white text-sm bg-white/5 p-2 rounded"
                        >
                          <span className="font-semibold capitalize">
                            {key}:
                          </span>{" "}
                          {value}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {item.serviceHistory && (
                <div>
                  <label className="text-sm font-semibold text-gray-400">
                    Service History
                  </label>
                  <div className="mt-2 space-y-2">
                    {Object.entries(item.serviceHistory).map(
                      ([key, value]: [string, any]) => (
                        <div
                          key={key}
                          className="text-white text-sm bg-white/5 p-2 rounded"
                        >
                          <span className="font-semibold capitalize">
                            {key}:
                          </span>{" "}
                          {format(new Date(value), "dd/MM/yyyy")}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {item.images && item.images.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-400">
                    Images
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {item.images
                      .filter((img: string) => img && img.trim())
                      .map((img: string, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => window.open(img, "_blank")}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <Image
                            src={img}
                            alt={`Image ${idx + 1}`}
                            width={150}
                            height={120}
                            className="rounded-lg object-cover"
                            unoptimized
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {item.licenceAttached &&
                (item.licenceAttached.front || item.licenceAttached.back) && (
                  <div>
                    <label className="text-sm font-semibold text-gray-400">
                      Licence
                    </label>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      {item.licenceAttached.front && (
                        <div
                          onClick={() =>
                            window.open(item.licenceAttached.front, "_blank")
                          }
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <p className="text-xs text-gray-400 mb-2">Front</p>
                          <Image
                            src={item.licenceAttached.front}
                            alt="licences Front"
                            width={150}
                            height={100}
                            className="rounded-lg object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      {item.licenceAttached.back && (
                        <div
                          onClick={() =>
                            window.open(item.licenceAttached.back, "_blank")
                          }
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <p className="text-xs text-gray-400 mb-2">Back</p>
                          <Image
                            src={item.licenceAttached.back}
                            alt="licences Back"
                            width={150}
                            height={100}
                            className="rounded-lg object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
