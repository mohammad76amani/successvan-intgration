"use client";

import { useState, useRef, useEffect } from "react";
import { FiX, FiPlus, FiRefreshCw } from "react-icons/fi";
import { showToast } from "@/lib/toast";
import DynamicTableView from "./DynamicTableView";
import CustomSelect from "@/components/ui/CustomSelect";
import { DateRange, Range } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

interface Discount {
  _id?: string;
  code: string;
  percentage: number;
  categories: string[];
  validFrom: string;
  validTo: string;
  usageLimit: number | null;
  usageCount: number;
  status: "active" | "inactive" | "expired";
  createdAt?:Date;
}

interface Category {
  _id: string;
  name: string;
}

export default function DiscountManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const mutateRef = useRef<(() => Promise<any>) | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    percentage: "",
    categories: [] as string[],
    validFrom: "",
    validTo: "",
    usageLimit: "",
    status: "inactive" as "active" | "inactive" | "expired",
  });

  const [dateRange, setDateRange] = useState<Range[]>([
    {
      startDate: new Date(),
      endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      key: "selection",
    },
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data.data || data.data);
      }
    } catch (error) {
      console.log("Failed to fetch categories:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    setFormData({
      code: "",
      percentage: "",
      categories: [],
      validFrom: today.toISOString().split("T")[0],
      validTo: nextWeek.toISOString().split("T")[0],
      usageLimit: "",
      status: "inactive",
    });
    setDateRange([
      {
        startDate: today,
        endDate: nextWeek,
        key: "selection",
      },
    ]);
    setEditingId(null);
  };

  const handleEdit = (item: Discount) => {
    const validFrom = new Date(item.validFrom);
    const validTo = new Date(item.validTo);
    setFormData({
      code: item.code,
      percentage: String(item.percentage),
      categories: item.categories.map((c: any) => c._id || c),
      validFrom: item.validFrom.split("T")[0],
      validTo: item.validTo.split("T")[0],
      usageLimit: item.usageLimit ? String(item.usageLimit) : "",
      status: item.status,
    });
    setDateRange([
      {
        startDate: validFrom,
        endDate: validTo,
        key: "selection",
      },
    ]);
    setEditingId(item._id || null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId
        ? `/api/discounts?id=${editingId}`
        : "/api/discounts";

      const payload = {
        code: formData.code,
        percentage: parseFloat(formData.percentage),
        categories: formData.categories,
        validFrom: new Date(formData.validFrom),
        validTo: new Date(formData.validTo),
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
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
        `Discount ${editingId ? "updated" : "created"} successfully!`
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

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, code }));
  };

  const handleStatusToggle = async (item: any) => {
    try {
      if (!item._id) {
        console.log("No discount ID found:", item);
        throw new Error("Discount ID is missing");
      }

      console.log(
        "Toggling status for discount:",
        item._id,
        "Current status:",
        item.status
      );
      const currentStatus = item.status || "inactive";
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      console.log("New status will be:", newStatus);

      const res = await fetch(`/api/discounts?id=${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      console.log("API response status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.log("API error response:", errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      console.log("API response data:", data);

      if (!data.success) throw new Error(data.error || "Update failed");

      showToast.success(`Discount status updated to ${newStatus}`);
      if (mutateRef.current) {
        console.log("Refreshing table data...");
        mutateRef.current();
      } else {
        console.warn("mutateRef.current is not available");
      }
    } catch (error) {
      console.log("Status toggle error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Update failed");
    }
  };

  function toggleCategory(_id: string): void {
    setFormData((prev) => {
      const isSelected = prev.categories.includes(_id);
      if (isSelected) {
        return {
          ...prev,
          categories: prev.categories.filter((id) => id !== _id),
        };
      } else {
        return {
          ...prev,
          categories: [...prev.categories, _id],
        };
      }
    });
  }

  const getStatusClass = (value: string) => {
    if (value === "active") return "bg-green-500/20 text-xs text-green-400";
    if (value === "inactive") return "bg-red-500/20 text-[10px] text-red-400";
    return "bg-yellow-500/20 text-[10px] text-yellow-400";
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
        <FiPlus /> Add Discount
      </button>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2847] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-white/10 bg-[#1a2847]">
              <h2 className="text-2xl font-black text-white">
                {editingId ? "Edit Discount" : "Create Discount"}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiX className="text-white text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="code"
                    placeholder="SUMMER2024"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] uppercase"
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white transition-colors"
                    title="Generate Code"
                  >
                    <FiRefreshCw className="text-lg" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Percentage
                </label>
                <input
                  type="number"
                  name="percentage"
                  placeholder="10"
                  value={formData.percentage}
                  onChange={handleInputChange}
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Categories
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-white/5 border border-white/10 rounded-lg">
                  {categories.map((cat) => (
                    <label
                      key={cat._id}
                      className="flex items-center gap-2 text-white cursor-pointer hover:bg-white/5 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(cat._id)}
                        onChange={() => toggleCategory(cat._id)}
                        className="w-4 h-4 accent-[#fe9a00]"
                      />
                      <span className="text-sm">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Valid Period
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-left focus:outline-none focus:border-[#fe9a00] transition-colors"
                  >
                    {dateRange[0].startDate && dateRange[0].endDate
                      ? `${dateRange[0].startDate.toLocaleDateString()} - ${dateRange[0].endDate.toLocaleDateString()}`
                      : "Select dates"}
                  </button>
                  {showDatePicker && (
                    <div className="absolute z-50 mt-2 bg-slate-800 border border-white/20 rounded-xl p-4 shadow-2xl">
                      <DateRange
                        ranges={dateRange}
                        onChange={(item) => {
                          setDateRange([item.selection]);
                          setFormData((prev) => ({
                            ...prev,
                            validFrom: item.selection.startDate
                              ? item.selection.startDate
                                  .toISOString()
                                  .split("T")[0]
                              : "",
                            validTo: item.selection.endDate
                              ? item.selection.endDate
                                  .toISOString()
                                  .split("T")[0]
                              : "",
                          }));
                        }}
                        minDate={new Date()}
                        rangeColors={["#fe9a00"]}
                      />
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(false)}
                        className="w-full mt-3 px-4 py-2 bg-[#fe9a00] text-white font-semibold rounded-lg hover:bg-[#e68a00] transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Usage Limit (optional)
                </label>
                <input
                  type="number"
                  name="usageLimit"
                  placeholder="Leave empty for unlimited"
                  value={formData.usageLimit}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Status
                </label>
                <CustomSelect
                  options={[
                    { _id: "active", name: "Active" },
                    { _id: "inactive", name: "Inactive" },
                    { _id: "expired", name: "Expired" },
                  ]}
                  value={formData.status}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: val as "active" | "inactive" | "expired",
                    }))
                  }
                  placeholder="Select Status"
                />
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

      <DynamicTableView<Discount>
        apiEndpoint="/api/discounts"
        filters={[
          { key: "code", label: "Code", type: "text" },
          { key: "status", label: "Status", type: "text" },
          { key: "validFrom", label: "Valid From", type: "date" },
          { key: "validTo", label: "valid To", type: "date" },
        ]}
        title="Discount"
        hideDelete={true}
        onStatusToggle={handleStatusToggle}
        columns={[
          { key: "code", label: "Code" },
          {
            key: "percentage",
            label: "Percentage",
            render: (val) => `${val}%`,
          },
          {
            key: "categories" as keyof Discount,
            label: "Categories",
            render: (_, item) =>
              (item?.categories as any)
                ?.map((c: any) => c.name || c)
                .join(", ") || "-",
          },
          {
            key: "validFrom",
            label: "Valid From",
            render: (val) => new Date(val as string).toLocaleDateString(),
          },
          {
            key: "validTo",
            label: "Valid To",
            render: (val) => new Date(val as string).toLocaleDateString(),
          },
          {
            key: "usageCount",
            label: "Usage",
            render: (_, item) =>
              `${item?.usageCount || 0}${
                item?.usageLimit ? `/${item.usageLimit}` : ""
              }`,
          },
          {
            key: "status",
            label: "Status",
            render: (value: string) => (
              <span className={`px-2 py-1 rounded-full font-semibold ${getStatusClass(value)}`}>
                {value}
              </span>
            ),
          },
          {
            key: "code",
            label: "Share Link",
            render: (_, item) => (
              <button
                onClick={() => {
                  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
                  const reservationUrl = `${baseUrl}/reservation?discount=${item?.code}`;
                  navigator.clipboard.writeText(reservationUrl);
                  showToast.success("Reservation link copied!");
                }}
                className="px-3 py-1.5 bg-[#fe9a00] hover:bg-[#e68a00] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
              >
                Copy Link
              </button>
            ),
          },
          {
            key: "createdAt",
            label: "Created At",
            render: (value: string) =>
              value ? new Date(value).toLocaleDateString("en-GB") : "-",
          },
        ]}
        onEdit={handleEdit}
        onMutate={(mutate) => (mutateRef.current = mutate)}
        hiddenColumns={["categories"]}
      />
    </div>
  );
}
