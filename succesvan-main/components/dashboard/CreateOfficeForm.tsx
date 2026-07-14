"use client";

import { useRef, useState, useEffect } from "react";
import { FiX, FiPlus } from "react-icons/fi";
import { showToast } from "@/lib/toast";
import { Office, Category } from "@/types/type";
import DynamicTableView from "./DynamicTableView";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./datepicker.css";
import CustomSelect from "@/components/ui/CustomSelect";
type MutateFn = () => Promise<void>;
type OfficeCategoryRef = string | { _id?: string };
type OfficeWithStatus = Office & { status?: "active" | "inactive" };
const weekDayDefaults = [
  { day: "monday", isOpen: true },
  { day: "tuesday", isOpen: true },
  { day: "wednesday", isOpen: true },
  { day: "thursday", isOpen: true },
  { day: "friday", isOpen: true },
  { day: "saturday", isOpen: false },
  { day: "sunday", isOpen: false },
] as const;

const createDefaultWorkingTime = () =>
  weekDayDefaults.map(({ day, isOpen }) => ({
    day,
    isOpen,
    startTime: "",
    endTime: "",
    pickupTime: { isOpen, startTime: "", endTime: "" },
    returnTime: { isOpen, startTime: "", endTime: "" },
    pickupExtension: createDefaultExtension(),
    returnExtension: createDefaultExtension(),
  }));

const createDefaultExtension = () => ({
  startTime: "",
  endTime: "",
  hoursBefore: 0,
  hoursAfter: 0,
  flatPrice: 0,
});

const timeToMinutes = (time?: string) => {
  const [hours, minutes] = (time || "").split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return undefined;
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60,
  ).padStart(2, "0")}`;

const createWorkingWindow = (
  window: Office["workingTime"][number]["pickupTime"] | undefined,
  fallback: Pick<Office["workingTime"][number], "isOpen" | "startTime" | "endTime">,
) => ({
  isOpen: window ? window.isOpen ?? fallback.isOpen : fallback.isOpen,
  startTime: window ? window.startTime || "" : fallback.startTime || "",
  endTime: window ? window.endTime || "" : fallback.endTime || "",
});

const createWorkingExtension = (
  extension: Office["workingTime"][number]["pickupExtension"] | undefined,
  window: ReturnType<typeof createWorkingWindow>,
) => {
  const defaultExtension = createDefaultExtension();
  if (!extension) return defaultExtension;

  if (extension.startTime || extension.endTime) {
    return {
      ...defaultExtension,
      ...extension,
      startTime: extension.startTime || "",
      endTime: extension.endTime || "",
      flatPrice: extension.flatPrice || 0,
    };
  }

  const startMinutes = timeToMinutes(window.startTime);
  const endMinutes = timeToMinutes(window.endTime);
  const hoursBefore = extension.hoursBefore || 0;
  const hoursAfter = extension.hoursAfter || 0;

  if (
    startMinutes === undefined ||
    endMinutes === undefined ||
    (hoursBefore === 0 && hoursAfter === 0)
  ) {
    return {
      ...defaultExtension,
      flatPrice: extension.flatPrice || 0,
    };
  }

  const legacyStart =
    hoursBefore > 0 ? Math.max(0, startMinutes - hoursBefore * 60) : endMinutes;
  const legacyEnd =
    hoursAfter > 0 ? Math.min(1439, endMinutes + hoursAfter * 60) : startMinutes;

  return {
    ...defaultExtension,
    startTime: minutesToTime(Math.min(legacyStart, legacyEnd)),
    endTime: minutesToTime(Math.max(legacyStart, legacyEnd)),
    flatPrice: extension.flatPrice || 0,
  };
};

export default function OfficesContent() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const mutateRef = useRef<MutateFn | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    categories: [] as string[],
    location: {
      latitude: "",
      longitude: "",
    },
    status: "active",
    specialDays: [] as Office["specialDays"],
    workingTime: createDefaultWorkingTime(),
  });

  useEffect(() => {
    fetch("/api/categories?status=active")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("Categories API response:", data);
        // Handle double-nested data structure
        const categories = data?.data?.data || data?.data || [];
        if (Array.isArray(categories) && categories.length > 0) {
          console.log("Setting categories:", categories.length);
          setCategories(categories);
        }
      })
      .catch((err) => console.log("Failed to fetch categories:", err));
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name.includes("location.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        location: { ...prev.location, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleWorkingTimeChange = <
    Field extends keyof (typeof formData.workingTime)[number],
  >(
    index: number,
    field: Field,
    value: (typeof formData.workingTime)[number][Field]
  ) => {
    setFormData((prev) => {
      const updated = [...prev.workingTime];
      const nextDay = { ...updated[index], [field]: value };

      if (field === "isOpen") {
        const isOpen = Boolean(value);
        nextDay.pickupTime = {
          ...(nextDay.pickupTime || {
            startTime: nextDay.startTime,
            endTime: nextDay.endTime,
          }),
          isOpen,
        };
        nextDay.returnTime = {
          ...(nextDay.returnTime || {
            startTime: nextDay.startTime,
            endTime: nextDay.endTime,
          }),
          isOpen,
        };
      }

      updated[index] = nextDay;
      return { ...prev, workingTime: updated };
    });
  };

  const handleWorkingWindowChange = (
    index: number,
    windowKey: "pickupTime" | "returnTime",
    field: "isOpen" | "startTime" | "endTime",
    value: boolean | string
  ) => {
    setFormData((prev) => {
      const updated = [...prev.workingTime];
      const currentDay = updated[index];
      const currentWindow = currentDay[windowKey] || {
        isOpen: currentDay.isOpen,
        startTime: currentDay.startTime,
        endTime: currentDay.endTime,
      };
      const nextWindow = { ...currentWindow, [field]: value };

      updated[index] = {
        ...currentDay,
        [windowKey]: nextWindow,
      };

      return { ...prev, workingTime: updated };
    });
  };

  const handleWorkingExtensionChange = (
    index: number,
    extensionKey: "pickupExtension" | "returnExtension",
    field: "startTime" | "endTime" | "flatPrice",
    value: string | number
  ) => {
    setFormData((prev) => {
      const updated = [...prev.workingTime];
      const currentDay = updated[index];
      const currentExtension =
        currentDay[extensionKey] || createDefaultExtension();

      updated[index] = {
        ...currentDay,
        [extensionKey]: {
          ...currentExtension,
          [field]: value,
          hoursBefore: 0,
          hoursAfter: 0,
        },
      };

      return { ...prev, workingTime: updated };
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      phone: "",
      categories: [],
      location: {
        latitude: "",
        longitude: "",
      },
      status: "active",
      specialDays: [],
      workingTime: createDefaultWorkingTime(),
    });
    setEditingId(null);
  };

  const handleEdit = (item: Office) => {
    setFormData({
      name: item.name,
      address: item.address,
      phone: item.phone,
      categories: ((item.categories || []) as OfficeCategoryRef[])
        .map((cat) => (typeof cat === "string" ? cat : cat._id))
        .filter((id): id is string => Boolean(id)),
      location: {
        latitude: String(item.location.latitude),
        longitude: String(item.location.longitude),
      },
      status: (item as OfficeWithStatus).status || "active",
      specialDays: item.specialDays || [],
      workingTime: item.workingTime.map((wt) => {
        const pickupTime = createWorkingWindow(wt.pickupTime, wt);
        const returnTime = createWorkingWindow(wt.returnTime, wt);

        return {
          day: wt.day,
          isOpen: wt.isOpen,
          startTime: wt.startTime || "",
          endTime: wt.endTime || "",
          pickupTime,
          returnTime,
          pickupExtension: createWorkingExtension(
            wt.pickupExtension,
            pickupTime,
          ),
          returnExtension: createWorkingExtension(
            wt.returnExtension,
            returnTime,
          ),
        };
      }),
    });
    setEditingId(item._id || null);
    setIsFormOpen(true);
  };

  const handleStatusToggle = async (item: OfficeWithStatus) => {
    try {
      if (!item._id) {
        console.log("No office ID found:", item);
        throw new Error("Office ID is missing");
      }

      const currentStatus = item.status || "active";
      const newStatus = currentStatus === "active" ? "inactive" : "active";

      const res = await fetch(`/api/offices/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Update failed");

      showToast.success(`Office status updated to ${newStatus}`);
      if (mutateRef.current) mutateRef.current();
    } catch (error) {
      console.log("Status toggle error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Update failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? `/api/offices/${editingId}` : "/api/offices";

      const invalidWorkingDay = formData.workingTime.find((day) => {
        if (!day.isOpen) return false;
        const pickupIsOpen = day.pickupTime?.isOpen ?? day.isOpen;
        const returnIsOpen = day.returnTime?.isOpen ?? day.isOpen;
        const pickupMissing =
          pickupIsOpen &&
          (!day.pickupTime?.startTime || !day.pickupTime?.endTime);
        const returnMissing =
          returnIsOpen &&
          (!day.returnTime?.startTime || !day.returnTime?.endTime);
        const pickupExtensionPartial = Boolean(
          (day.pickupExtension?.startTime && !day.pickupExtension?.endTime) ||
            (!day.pickupExtension?.startTime && day.pickupExtension?.endTime),
        );
        const returnExtensionPartial = Boolean(
          (day.returnExtension?.startTime && !day.returnExtension?.endTime) ||
            (!day.returnExtension?.startTime && day.returnExtension?.endTime),
        );

        return (
          pickupMissing ||
          returnMissing ||
          pickupExtensionPartial ||
          returnExtensionPartial
        );
      });

      if (invalidWorkingDay) {
        throw new Error(
          `Please complete pickup/return and extension start/end times for ${invalidWorkingDay.day}.`
        );
      }

      const payload = {
        ...formData,
        workingTime: formData.workingTime.map((day) => {
          const pickupTime = {
            isOpen: day.pickupTime?.isOpen ?? day.isOpen,
            startTime: day.pickupTime?.startTime || "",
            endTime: day.pickupTime?.endTime || "",
          };
          const returnTime = {
            isOpen: day.returnTime?.isOpen ?? day.isOpen,
            startTime: day.returnTime?.startTime || "",
            endTime: day.returnTime?.endTime || "",
          };
          const pickupExtension = {
            startTime: day.pickupExtension?.startTime || undefined,
            endTime: day.pickupExtension?.endTime || undefined,
            hoursBefore: 0,
            hoursAfter: 0,
            flatPrice: day.pickupExtension?.flatPrice || 0,
          };
          const returnExtension = {
            startTime: day.returnExtension?.startTime || undefined,
            endTime: day.returnExtension?.endTime || undefined,
            hoursBefore: 0,
            hoursAfter: 0,
            flatPrice: day.returnExtension?.flatPrice || 0,
          };

          return {
            ...day,
            pickupTime,
            returnTime,
            pickupExtension,
            returnExtension,
            startTime: pickupTime.startTime,
            endTime: pickupTime.endTime,
          };
        }),
        location: {
          latitude: parseFloat(formData.location.latitude),
          longitude: parseFloat(formData.location.longitude),
        },
        status: formData.status,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Operation failed");

      showToast.success(
        `Office ${editingId ? "updated" : "created"} successfully!`
      );
      resetForm();
      setIsFormOpen(false);
      if (mutateRef.current) mutateRef.current();
    } catch {
      showToast.error("Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => {
          resetForm();
          setIsFormOpen(true);
        }}
        className="flex items-center gap-2 px-6 py-3 bg-[#fe9a00] hover:bg-[#e68a00] text-white font-bold rounded-lg transition-colors"
      >
        <FiPlus /> Add Office
      </button>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2847] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b z-10 border-white/10 bg-[#1a2847]">
              <h2 className="text-2xl font-black text-white">
                {editingId ? "Edit Office" : "Create Office"}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiX className="text-white text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <label className="text-gray-400 text-sm mb-2 block">name</label>
              <input
                type="text"
                name="name"
                placeholder="Office Name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
              />
              <label className="text-gray-400 text-sm mb-2 block">
                address
              </label>
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
              />
              <label className="text-gray-400 text-sm mb-2 block">phone</label>

              <input
                type="text"
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
              />

              <div className="space-y-2">
                <label className="text-white font-semibold">Categories</label>
                {categories.length === 0 && (
                  <p className="text-gray-400 text-sm">Loading categories...</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <label
                      key={cat._id}
                      className="flex items-center gap-2 p-2 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10"
                    >
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(cat._id!)}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            categories: e.target.checked
                              ? [...prev.categories, cat._id!]
                              : prev.categories.filter((id) => id !== cat._id),
                          }));
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-300">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <label className="text-gray-400 text-sm mb-2 block">Status</label>
                <CustomSelect
                  options={[
                    { _id: "active", name: "Active" },
                    { _id: "inactive", name: "Inactive" },
                  ]}
                  value={formData.status}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, status: val }))
                  }
                  placeholder="Select Status"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  name="location.latitude"
                  placeholder="Latitude"
                  value={formData.location.latitude}
                  onChange={handleInputChange}
                  required
                  step="0.000001"
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                />
                <input
                  type="number"
                  name="location.longitude"
                  placeholder="Longitude"
                  value={formData.location.longitude}
                  onChange={handleInputChange}
                  required
                  step="0.000001"
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-white font-semibold">Working Hours</h3>
                <div className="space-y-3">
                  {formData.workingTime.map((day, idx) => (
                    <div
                      key={day.day}
                      className="space-y-2 p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-gray-200 font-bold">
                          {day.day.charAt(0).toUpperCase() + day.day.slice(1)}
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={day.isOpen}
                            onChange={(e) =>
                              handleWorkingTimeChange(
                                idx,
                                "isOpen",
                                e.target.checked
                              )
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-xs text-gray-400">Open</span>
                        </label>
                      </div>
                      {day.isOpen && (
                        <div className="space-y-2">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs text-[#fe9a00] font-semibold">
                                Pickup Working Hours
                              </label>
                              <label className="flex items-center gap-2 text-xs text-gray-400">
                                <input
                                  type="checkbox"
                                  checked={day.pickupTime?.isOpen ?? day.isOpen}
                                  onChange={(e) =>
                                    handleWorkingWindowChange(
                                      idx,
                                      "pickupTime",
                                      "isOpen",
                                      e.target.checked
                                    )
                                  }
                                  className="w-4 h-4"
                                />
                                Open
                              </label>
                            </div>
                            {(day.pickupTime?.isOpen ?? day.isOpen) && (
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-xs text-gray-400 mb-1 block">
                                    Pickup Start
                                  </label>
                                  <DatePicker
                                    selected={day.pickupTime?.startTime ? new Date(`1970-01-01T${day.pickupTime.startTime}:00`) : null}
                                    onChange={(date) => {
                                      const timeString = date ? date.toTimeString().slice(0, 5) : "";
                                      handleWorkingWindowChange(idx, "pickupTime", "startTime", timeString);
                                    }}
                                    showTimeSelect
                                    showTimeSelectOnly
                                    timeIntervals={15}
                                    timeCaption="Time"
                                    dateFormat="HH:mm"
                                    timeFormat="HH:mm"
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-[#fe9a00] text-sm"
                                    placeholderText="Select time"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-400 mb-1 block">
                                    Pickup End
                                  </label>
                                  <DatePicker
                                    selected={day.pickupTime?.endTime ? new Date(`1970-01-01T${day.pickupTime.endTime}:00`) : null}
                                    onChange={(date) => {
                                      const timeString = date ? date.toTimeString().slice(0, 5) : "";
                                      handleWorkingWindowChange(idx, "pickupTime", "endTime", timeString);
                                    }}
                                    showTimeSelect
                                    showTimeSelectOnly
                                    timeIntervals={15}
                                    timeCaption="Time"
                                    dateFormat="HH:mm"
                                    timeFormat="HH:mm"
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-[#fe9a00] text-sm"
                                    placeholderText="Select time"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs text-[#fe9a00] font-semibold">
                                Return Working Hours
                              </label>
                              <label className="flex items-center gap-2 text-xs text-gray-400">
                                <input
                                  type="checkbox"
                                  checked={day.returnTime?.isOpen ?? day.isOpen}
                                  onChange={(e) =>
                                    handleWorkingWindowChange(
                                      idx,
                                      "returnTime",
                                      "isOpen",
                                      e.target.checked
                                    )
                                  }
                                  className="w-4 h-4"
                                />
                                Open
                              </label>
                            </div>
                            {(day.returnTime?.isOpen ?? day.isOpen) && (
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-xs text-gray-400 mb-1 block">
                                    Return Start
                                  </label>
                                  <DatePicker
                                    selected={day.returnTime?.startTime ? new Date(`1970-01-01T${day.returnTime.startTime}:00`) : null}
                                    onChange={(date) => {
                                      const timeString = date ? date.toTimeString().slice(0, 5) : "";
                                      handleWorkingWindowChange(idx, "returnTime", "startTime", timeString);
                                    }}
                                    showTimeSelect
                                    showTimeSelectOnly
                                    timeIntervals={15}
                                    timeCaption="Time"
                                    dateFormat="HH:mm"
                                    timeFormat="HH:mm"
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-[#fe9a00] text-sm"
                                    placeholderText="Select time"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-400 mb-1 block">
                                    Return End
                                  </label>
                                  <DatePicker
                                    selected={day.returnTime?.endTime ? new Date(`1970-01-01T${day.returnTime.endTime}:00`) : null}
                                    onChange={(date) => {
                                      const timeString = date ? date.toTimeString().slice(0, 5) : "";
                                      handleWorkingWindowChange(idx, "returnTime", "endTime", timeString);
                                    }}
                                    showTimeSelect
                                    showTimeSelectOnly
                                    timeIntervals={15}
                                    timeCaption="Time"
                                    dateFormat="HH:mm"
                                    timeFormat="HH:mm"
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-[#fe9a00] text-sm"
                                    placeholderText="Select time"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-[#fe9a00] font-semibold">
                              Pickup Extension
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-xs text-gray-400 mb-1 block">
                                  Ext Start
                                </label>
                                <DatePicker
                                  selected={
                                    day.pickupExtension?.startTime
                                      ? new Date(`1970-01-01T${day.pickupExtension.startTime}:00`)
                                      : null
                                  }
                                  onChange={(date) => {
                                    const timeString = date
                                      ? date.toTimeString().slice(0, 5)
                                      : "";
                                    handleWorkingExtensionChange(
                                      idx,
                                      "pickupExtension",
                                      "startTime",
                                      timeString
                                    );
                                  }}
                                  showTimeSelect
                                  showTimeSelectOnly
                                  timeIntervals={15}
                                  timeCaption="Time"
                                  dateFormat="HH:mm"
                                  timeFormat="HH:mm"
                                  className="w-full px-2 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-[#fe9a00] text-xs"
                                  placeholderText="Start"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-400 mb-1 block">
                                  Ext End
                                </label>
                                <DatePicker
                                  selected={
                                    day.pickupExtension?.endTime
                                      ? new Date(`1970-01-01T${day.pickupExtension.endTime}:00`)
                                      : null
                                  }
                                  onChange={(date) => {
                                    const timeString = date
                                      ? date.toTimeString().slice(0, 5)
                                      : "";
                                    handleWorkingExtensionChange(
                                      idx,
                                      "pickupExtension",
                                      "endTime",
                                      timeString
                                    );
                                  }}
                                  showTimeSelect
                                  showTimeSelectOnly
                                  timeIntervals={15}
                                  timeCaption="Time"
                                  dateFormat="HH:mm"
                                  timeFormat="HH:mm"
                                  className="w-full px-2 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-[#fe9a00] text-xs"
                                  placeholderText="End"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-400 mb-1 block">
                                  Flat Price (£)
                                </label>
                                <input
                                  type="number"
                                  value={day.pickupExtension?.flatPrice || 0}
                                  onChange={(e) =>
                                    handleWorkingExtensionChange(
                                      idx,
                                      "pickupExtension",
                                      "flatPrice",
                                      Number(e.target.value)
                                    )
                                  }
                                  min="0"
                                  className="w-full px-2 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-[#fe9a00] text-xs"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-[#fe9a00] font-semibold">
                              Return Extension
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-xs text-gray-400 mb-1 block">
                                  Ext Start
                                </label>
                                <DatePicker
                                  selected={
                                    day.returnExtension?.startTime
                                      ? new Date(`1970-01-01T${day.returnExtension.startTime}:00`)
                                      : null
                                  }
                                  onChange={(date) => {
                                    const timeString = date
                                      ? date.toTimeString().slice(0, 5)
                                      : "";
                                    handleWorkingExtensionChange(
                                      idx,
                                      "returnExtension",
                                      "startTime",
                                      timeString
                                    );
                                  }}
                                  showTimeSelect
                                  showTimeSelectOnly
                                  timeIntervals={15}
                                  timeCaption="Time"
                                  dateFormat="HH:mm"
                                  timeFormat="HH:mm"
                                  className="w-full px-2 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-[#fe9a00] text-xs"
                                  placeholderText="Start"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-400 mb-1 block">
                                  Ext End
                                </label>
                                <DatePicker
                                  selected={
                                    day.returnExtension?.endTime
                                      ? new Date(`1970-01-01T${day.returnExtension.endTime}:00`)
                                      : null
                                  }
                                  onChange={(date) => {
                                    const timeString = date
                                      ? date.toTimeString().slice(0, 5)
                                      : "";
                                    handleWorkingExtensionChange(
                                      idx,
                                      "returnExtension",
                                      "endTime",
                                      timeString
                                    );
                                  }}
                                  showTimeSelect
                                  showTimeSelectOnly
                                  timeIntervals={15}
                                  timeCaption="Time"
                                  dateFormat="HH:mm"
                                  timeFormat="HH:mm"
                                  className="w-full px-2 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-[#fe9a00] text-xs"
                                  placeholderText="End"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-400 mb-1 block">
                                  Flat Price (£)
                                </label>
                                <input
                                  type="number"
                                  value={day.returnExtension?.flatPrice || 0}
                                  onChange={(e) =>
                                    handleWorkingExtensionChange(
                                      idx,
                                      "returnExtension",
                                      "flatPrice",
                                      Number(e.target.value)
                                    )
                                  }
                                  min="0"
                                  className="w-full px-2 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-[#fe9a00] text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg transition-colors font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DynamicTableView<Office>
        apiEndpoint="/api/offices"
        hideDelete={true}
        filters={[
          { key: "name", label: "Name", type: "text" },
          { key: "phone", label: "Phone", type: "text" },
        ]}
        title="Office"
        columns={[
          { key: "name", label: "Name" },
          { key: "address", label: "Address" },
          { key: "phone", label: "Phone" },
          {
            key: "specialDays",
            label: "Special Days",
            render: (value) => (Array.isArray(value) ? value.length : 0),
          },
        ]}
        onEdit={handleEdit}
          onStatusToggle={handleStatusToggle}
        onMutate={(mutate) => (mutateRef.current = mutate)}
      />
    </div>
  );
}
