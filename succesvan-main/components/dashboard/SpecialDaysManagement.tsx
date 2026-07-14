"use client";

import { useState } from "react";
import {
  FiX,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiCalendar,
  FiAlertTriangle,
} from "react-icons/fi";
import { showToast } from "@/lib/toast";
import useSWR from "swr";
import { Office, SpecialDay } from "@/types/type";
import CustomSelect from "@/components/ui/CustomSelect";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type SpecialDayFormData = {
  month: number;
  day: number;
  isOpen: boolean;
  pickupTime: {
    startTime: string;
    endTime: string;
  };
  returnTime: {
    startTime: string;
    endTime: string;
  };
  reason: string;
  extraPrice: number;
};

const getDefaultSpecialDayFormData = (): SpecialDayFormData => ({
  month: 1,
  day: 1,
  isOpen: true,
  pickupTime: {
    startTime: "09:00",
    endTime: "17:00",
  },
  returnTime: {
    startTime: "09:00",
    endTime: "17:00",
  },
  reason: "",
  extraPrice: 0,
});

type LegacySpecialDay = SpecialDay & {
  pickupExtension?: SpecialDay["pickupTime"];
  returnExtension?: SpecialDay["returnTime"];
};

function getSpecialDayPickupTime(day: SpecialDay) {
  const legacyDay = day as LegacySpecialDay;

  return {
    startTime:
      day.pickupTime?.startTime ||
      legacyDay.pickupExtension?.startTime ||
      day.startTime ||
      "09:00",
    endTime:
      day.pickupTime?.endTime ||
      legacyDay.pickupExtension?.endTime ||
      day.endTime ||
      "17:00",
  };
}

function getSpecialDayReturnTime(day: SpecialDay) {
  const legacyDay = day as LegacySpecialDay;

  return {
    startTime:
      day.returnTime?.startTime ||
      legacyDay.returnExtension?.startTime ||
      day.startTime ||
      "09:00",
    endTime:
      day.returnTime?.endTime ||
      legacyDay.returnExtension?.endTime ||
      day.endTime ||
      "17:00",
  };
}

export default function SpecialDaysManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    index: number | null;
  }>({
    open: false,
    index: null,
  });
  const [formData, setFormData] = useState<SpecialDayFormData>(
    getDefaultSpecialDayFormData,
  );

  const { data: offices, mutate: mutateOffices } = useSWR<{ data: Office[] }>(
    "/api/offices",
    fetcher,
  );

  const currentOffice = offices?.data?.find((o) => o._id === selectedOffice);

  const buildSpecialDayPayload = (): SpecialDay => {
    const pickupStartTime = formData.pickupTime.startTime.trim();
    const pickupEndTime = formData.pickupTime.endTime.trim();
    const returnStartTime = formData.returnTime.startTime.trim();
    const returnEndTime = formData.returnTime.endTime.trim();
    const payload: SpecialDay = {
      month: formData.month,
      day: formData.day,
      isOpen: formData.isOpen,
      reason: formData.reason.trim(),
      extraPrice: formData.extraPrice,
    };

    if (formData.isOpen && pickupStartTime && pickupEndTime) {
      payload.pickupTime = {
        startTime: pickupStartTime,
        endTime: pickupEndTime,
      };
    }

    if (formData.isOpen && returnStartTime && returnEndTime) {
      payload.returnTime = {
        startTime: returnStartTime,
        endTime: returnEndTime,
      };
    }

    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffice) {
      showToast.error("Please select an office");
      return;
    }

    const hasPickupStart = Boolean(formData.pickupTime.startTime);
    const hasPickupEnd = Boolean(formData.pickupTime.endTime);
    if (formData.isOpen && (!hasPickupStart || !hasPickupEnd)) {
      showToast.error("Please set both pickup start and pickup end times");
      return;
    }

    const hasReturnStart = Boolean(formData.returnTime.startTime);
    const hasReturnEnd = Boolean(formData.returnTime.endTime);
    if (formData.isOpen && (!hasReturnStart || !hasReturnEnd)) {
      showToast.error("Please set both return start and return end times");
      return;
    }

    setIsSubmitting(true);
    try {
      const specialDays = currentOffice?.specialDays || [];
      let updatedSpecialDays: SpecialDay[];
      const specialDayPayload = buildSpecialDayPayload();

      if (editingIndex !== null) {
        updatedSpecialDays = [...specialDays];
        updatedSpecialDays[editingIndex] = specialDayPayload;
      } else {
        updatedSpecialDays = [...specialDays, specialDayPayload];
      }

      const res = await fetch(`/api/offices/${selectedOffice}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialDays: updatedSpecialDays }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Operation failed");

      showToast.success(
        editingIndex !== null ? "Special day updated!" : "Special day created!",
      );
      setFormData(getDefaultSpecialDayFormData());
      setEditingIndex(null);
      setIsFormOpen(false);
      mutateOffices();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOffice || deleteConfirm.index === null) return;

    try {
      const specialDays = currentOffice?.specialDays || [];
      const updatedSpecialDays = specialDays.filter(
        (_, i) => i !== deleteConfirm.index,
      );

      const res = await fetch(`/api/offices/${selectedOffice}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialDays: updatedSpecialDays }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Delete failed");

      showToast.success("Special day deleted!");
      mutateOffices();
      setDeleteConfirm({ open: false, index: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Delete failed");
    }
  };

  const handleEdit = (day: SpecialDay, index: number) => {
    const pickupTime = getSpecialDayPickupTime(day);
    const returnTime = getSpecialDayReturnTime(day);

    setFormData({
      month: day.month,
      day: day.day,
      isOpen: day.isOpen,
      pickupTime,
      returnTime,
      reason: day.reason || "",
      extraPrice: day.extraPrice || 0,
    });
    setEditingIndex(index);
    setIsFormOpen(true);
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Select Office
          </label>
          <CustomSelect
            options={(offices?.data || []).map((o) => ({
              _id: o._id ?? "",
              name: o.name,
            }))}
            value={selectedOffice}
            onChange={(val) => {
              setSelectedOffice(val);
              setEditingIndex(null);
            }}
            placeholder="Choose an office"
          />
        </div>
        <button
          onClick={() => {
            setFormData(getDefaultSpecialDayFormData());
            setEditingIndex(null);
            setIsFormOpen(true);
          }}
          disabled={!selectedOffice}
          className="px-6 py-3 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <FiPlus /> Add Special Day
        </button>
      </div>

      {/* Special Days Grid or Empty State */}

      {selectedOffice ? (
        currentOffice?.specialDays && currentOffice.specialDays.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentOffice.specialDays.map((day, index) => {
              const pickupTime = getSpecialDayPickupTime(day);
              const returnTime = getSpecialDayReturnTime(day);

              return (
                <div
                  key={index}
                  className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-[#fe9a00]/30 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <FiCalendar className="text-[#fe9a00] text-xl" />
                        <p className="text-xl font-bold text-white">
                          {monthNames[day.month - 1]} {day.day}
                        </p>
                      </div>
                      {day.reason && (
                        <p className="text-gray-300 text-sm mt-1 italic">
                          {day.reason}
                        </p>
                      )}
                    </div>

                    <span
                      className={`px-4 py-2 rounded-full text-sm font-bold tracking-wide ${
                        day.isOpen
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {day.isOpen ? "OPEN" : "CLOSED"}
                    </span>
                  </div>

                  {day.isOpen && (
                    <>
                      <p className="text-gray-200 text-sm bg-white/5 rounded-lg px-4 py-2 mb-2">
                        Pickup Time: {pickupTime.startTime} -{" "}
                        {pickupTime.endTime}
                      </p>
                      <p className="text-blue-300 text-sm bg-blue-500/10 rounded-lg px-4 py-2 mb-2 font-semibold">
                        Return Time: {returnTime.startTime} -{" "}
                        {returnTime.endTime}
                      </p>
                      {day.extraPrice && day.extraPrice > 0 && (
                        <p className="text-[#fe9a00] text-sm bg-[#fe9a00]/10 rounded-lg px-4 py-2 mb-2 font-bold">
                          Extra Price: £{day.extraPrice}
                        </p>
                      )}
                    </>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(day, index)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl font-semibold transition-all"
                    >
                      <FiEdit2 />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ open: true, index })}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-semibold transition-all"
                    >
                      <FiTrash2 />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-white/5 rounded-2xl p-10 max-w-md mx-auto">
              <FiCalendar className="text-6xl text-gray-500 mx-auto mb-6" />
              <p className="text-xl font-semibold text-gray-300 mb-2">
                No special days yet
              </p>
              <p className="text-gray-500">
                Add holidays, closures, or custom opening hours for this office.
              </p>
            </div>
          </div>
        )
      ) : (
        <div className="text-center py-16">
          <div className="bg-white/5 rounded-2xl p-10 max-w-md mx-auto">
            <div className="w-24 h-24 bg-[#fe9a00]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCalendar className="text-5xl text-[#fe9a00]" />
            </div>
            <p className="text-2xl font-bold text-white mb-3">
              Manage Special Days
            </p>
            <p className="text-gray-400 text-lg">
              Select an office above to view and manage special opening/closing
              days.
            </p>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2847] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-2xl font-black text-white">
                {editingIndex !== null ? "Edit Special Day" : "Add Special Day"}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiX className="text-white text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Month
                  </label>
                  <CustomSelect
                    options={monthNames.map((m, i) => ({
                      _id: String(i + 1),
                      name: m,
                    }))}
                    value={String(formData.month)}
                    onChange={(val) =>
                      setFormData({
                        ...formData,
                        month: parseInt(val),
                      })
                    }
                    placeholder="Select Month"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.day}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        day: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#fe9a00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Reason
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="e.g., Christmas Holiday"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.isOpen}
                  onChange={(e) =>
                    setFormData({ ...formData, isOpen: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label className="text-sm font-semibold text-gray-300">
                  Open on this day
                </label>
              </div>

              {formData.isOpen && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Pickup Start Time
                      </label>
                      <input
                        type="time"
                        value={formData.pickupTime.startTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pickupTime: {
                              ...formData.pickupTime,
                              startTime: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#fe9a00]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Pickup End Time
                      </label>
                      <input
                        type="time"
                        value={formData.pickupTime.endTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pickupTime: {
                              ...formData.pickupTime,
                              endTime: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#fe9a00]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-300 mb-2">
                        Return Start Time
                      </label>
                      <input
                        type="time"
                        value={formData.returnTime.startTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            returnTime: {
                              ...formData.returnTime,
                              startTime: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-2 bg-blue-500/5 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-[#fe9a00]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-300 mb-2">
                        Return End Time
                      </label>
                      <input
                        type="time"
                        value={formData.returnTime.endTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            returnTime: {
                              ...formData.returnTime,
                              endTime: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-2 bg-blue-500/5 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-[#fe9a00]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Extra Price (£)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.extraPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          extraPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                    />
                    <p className="text-gray-500 text-xs mt-1">
                      Additional charge for this special day
                    </p>
                  </div>
                </>
              )}

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
                  {isSubmitting
                    ? "Saving..."
                    : editingIndex !== null
                      ? "Update"
                      : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* NEW: Delete Confirmation Modal */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2847] rounded-2xl max-w-sm w-full border border-red-500/30 shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiAlertTriangle className="text-red-400 text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Delete Special Day?
              </h3>
              <p className="text-gray-300 text-sm">
                This action cannot be undone. The special day will be
                permanently removed.
              </p>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setDeleteConfirm({ open: false, index: null })}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all shadow-lg"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
