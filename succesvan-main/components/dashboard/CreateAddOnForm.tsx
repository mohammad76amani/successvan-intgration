"use client";

import { useState, useRef } from "react";
import { FiX, FiPlus, FiUpload, FiImage } from "react-icons/fi";
import { showToast } from "@/lib/toast";
import DynamicTableView from "./DynamicTableView";
import { AddOn } from "@/types/type";
import CustomSelect from "@/components/ui/CustomSelect";
import { useEffect } from "react";
type MutateFn = () => Promise<void>;

export default function AddOnsContent() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const mutateRef = useRef<MutateFn | null>(null);

  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    icon: "",
    pricingType: "flat" as "flat" | "tiered",
    flatPrice: { amount: "", isPerDay: false },
    tieredPrice: {
      isPerDay: false,
      tiers: [{ minDays: "", maxDays: "", price: "" }],
    },
    status: "active",
    categoryId: "",
  });

  useEffect(() => {
    fetch("/api/categories?status=active")
      .then((r) => r.json())
      .then((d) => setCategories(d.data?.data || d.data || []))
      .catch(() => {});
  }, []);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTierChange = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.tieredPrice.tiers];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, tieredPrice: { ...prev.tieredPrice, tiers: updated } };
    });
  };

  const addTier = () => {
    setFormData((prev) => ({
      ...prev,
      tieredPrice: {
        ...prev.tieredPrice,
        tiers: [
          ...prev.tieredPrice.tiers,
          { minDays: "", maxDays: "", price: "" },
        ],
      },
    }));
  };

  const removeTier = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tieredPrice: {
        ...prev.tieredPrice,
        tiers: prev.tieredPrice.tiers.filter((_, i) => i !== index),
      },
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "",
      icon: "",
      pricingType: "flat",
      flatPrice: { amount: "", isPerDay: false },
      tieredPrice: {
        isPerDay: false,
        tiers: [{ minDays: "", maxDays: "", price: "" }],
      },
      status: "active",
      categoryId: "",
    });
    setEditingId(null);
  };
  const handleStatusToggle = async (item: AddOn) => {
    const id = item._id;
    const currentStatus = item.status;
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const res = await fetch(`/api/addons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || "Failed to update status");
      showToast.success(`AddOn status updated to ${newStatus}!`);
      if (mutateRef.current) mutateRef.current();
    } catch (error) {
      showToast.error("Failed to update status");
    }
  };

  const handleEdit = (item: AddOn) => {
    setFormData({
      name: item.name,
      description: item.description || "",
      type: (item as any).type || "",
      icon: (item as any).icon || "",
      pricingType: item.pricingType,
      flatPrice: {
        amount: String((item.flatPrice as any)?.amount || ""),
        isPerDay: (item.flatPrice as any)?.isPerDay || false,
      },
      tieredPrice: {
        isPerDay: (item as any).tieredPrice?.isPerDay || false,
        tiers: (
          (item as any).tieredPrice?.tiers || [
            { minDays: "", maxDays: "", price: "" },
          ]
        ).map((t: any) => ({
          minDays: String(t.minDays),
          maxDays: String(t.maxDays),
          price: String(t.price),
        })),
      },
      status: (item as any).status || "active",
      categoryId: (item as any).categoryId?._id || (item as any).categoryId || "",
    });
    setEditingId(item._id || null);
    setIsFormOpen(true);
  };

  const handleIconUpload = async (file: File) => {
    setUploadingIcon(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
      const uploadData = await uploadRes.json();

      if (uploadData.error) throw new Error(uploadData.error);

      setFormData((prev) => ({ ...prev, icon: uploadData.url }));
      showToast.success("Icon uploaded successfully!");
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Upload failed"
      );
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? `/api/addons?id=${editingId}` : "/api/addons";

      const payload: any = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        icon: formData.icon,
        pricingType: formData.pricingType,
        status: formData.status,
        categoryId: formData.categoryId || null,
      };

      if (formData.pricingType === "flat") {
        payload.flatPrice = {
          amount: parseFloat(formData.flatPrice.amount),
          isPerDay: formData.flatPrice.isPerDay,
        };
      } else {
        payload.tieredPrice = {
          isPerDay: formData.tieredPrice.isPerDay,
          tiers: formData.tieredPrice.tiers.map((t) => ({
            minDays: parseInt(t.minDays),
            maxDays: parseInt(t.maxDays),
            price: parseFloat(t.price),
          })),
        };
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Operation failed");

      showToast.success(
        `AddOn ${editingId ? "updated" : "created"} successfully!`
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
        <FiPlus /> Add AddOn
      </button>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2847] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b z-10 border-white/10 bg-[#1a2847]">
              <h2 className="text-2xl font-black text-white">
                {editingId ? "Edit AddOn" : "Create AddOn"}
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
                <label className="text-gray-400 text-sm mb-2 block">
                  Icon/Image
                </label>
                <div className="flex items-center gap-4">
                  {formData.icon ? (
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                        <img
                          src={formData.icon}
                          alt="Icon"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, icon: "" }))
                        }
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                      >
                        <FiX className="text-white text-xs" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-20 h-20 rounded-lg bg-white/5 border-2 border-dashed border-white/10 hover:border-[#fe9a00]/50 flex items-center justify-center cursor-pointer transition-all group">
                      {uploadingIcon ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-[#fe9a00] rounded-full animate-spin" />
                      ) : (
                        <FiUpload className="text-white/30 group-hover:text-[#fe9a00]/50 text-xl transition-colors" />
                      )}
                      <input
                        type="file"
                        accept="image/*,.svg"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handleIconUpload(e.target.files[0])
                        }
                        disabled={uploadingIcon}
                      />
                    </label>
                  )}
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium mb-1">
                      Upload Icon
                    </p>
                    <p className="text-gray-500 text-xs">
                      PNG, JPG, SVG up to 2MB
                    </p>
                  </div>
                </div>
              </div>

              <label className="text-gray-400 text-sm mb-2 block">Name</label>
              <input
                type="text"
                name="name"
                placeholder="AddOn Name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
              />
              <label className="text-gray-400 text-sm mb-2 block">
                description
              </label>
              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
              />
              <label className="text-gray-400 text-sm mb-2 block">
                Type
              </label>
              <input
                type="text"
                name="type"
                placeholder="AddOn Type (e.g., insurance, equipment)"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
              />
              <label className="text-gray-400 text-sm mb-2 block">
                Category (optional — leave empty for all categories)
              </label>
              <CustomSelect
                options={[
                  { _id: "", name: "All Categories (no restriction)" },
                  ...categories,
                ]}
                value={formData.categoryId}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, categoryId: val }))
                }
                placeholder="All Categories"
              />
              <label className="text-gray-400 text-sm mb-2 block">
                pricingType
              </label>
              <CustomSelect
                options={[
                  { _id: "flat", name: "Flat Price" },
                  { _id: "tiered", name: "Tiered Pricing" },
                ]}
                value={formData.pricingType}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    pricingType: val as "flat" | "tiered",
                  }))
                }
                placeholder="Select Pricing Type"
              />
              <label className="text-gray-400 text-sm mb-2 block">status</label>

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

              {formData.pricingType === "flat" ? (
                <div className="space-y-3">
                  <input
                    type="number"
                    name="flatPriceAmount"
                    placeholder="Price"
                    value={formData.flatPrice.amount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        flatPrice: {
                          ...prev.flatPrice,
                          amount: e.target.value,
                        },
                      }))
                    }
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                  />
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.flatPrice.isPerDay}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          flatPrice: {
                            ...prev.flatPrice,
                            isPerDay: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4 accent-[#fe9a00]"
                    />
                    <span>Price per day</span>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">Pricing Tiers</h3>
                    <button
                      type="button"
                      onClick={addTier}
                      className="px-3 py-1 bg-[#fe9a00]/20 hover:bg-[#fe9a00]/30 text-[#fe9a00] rounded text-sm font-semibold"
                    >
                      + Add Tier
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.tieredPrice.isPerDay}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tieredPrice: {
                            ...prev.tieredPrice,
                            isPerDay: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4 accent-[#fe9a00]"
                    />
                    <span>Price per day (applies to all tiers)</span>
                  </label>
                  {formData.tieredPrice.tiers.map((tier, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min Days"
                        value={tier.minDays}
                        onChange={(e) =>
                          handleTierChange(idx, "minDays", e.target.value)
                        }
                        required
                        min="1"
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Max Days"
                        value={tier.maxDays}
                        onChange={(e) =>
                          handleTierChange(idx, "maxDays", e.target.value)
                        }
                        required
                        min="1"
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={tier.price}
                        onChange={(e) =>
                          handleTierChange(idx, "price", e.target.value)
                        }
                        required
                        step="0.01"
                        min="0"
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] text-sm"
                      />
                      {formData.tieredPrice.tiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTier(idx)}
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm font-semibold"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
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
                  {isSubmitting ? "Saving..." : editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DynamicTableView<AddOn>
        apiEndpoint="/api/addons"
        hideDelete={true}
        filters={[
          { key: "name", label: "Name", type: "text" },
          { key: "createdAt", label: "Created Date", type: "date" },
        ]}
        title="AddOn"
        columns={[
          {
            key: "icon" as keyof AddOn,
            label: "Icon",
            render: (_, item) => {
              const icon = (item as any)?.icon;
              if (!icon) {
                return (
                  <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                    <FiImage className="text-white/20 text-sm" />
                  </div>
                );
              }
              return (
                <img
                  src={icon}
                  alt="icon"
                  className="w-8 h-8 object-contain"
                />
              );
            },
          },
          { key: "name", label: "Name" },
          { key: "description", label: "Description" },
          { key: "pricingType", label: "Type" },
          { key: "createdAt", label: "Create" },
          {
            key: "flatPrice" as keyof AddOn,
            label: "Price",
            render: (_, item) => {
              if (item?.pricingType === "flat") {
                const fp = item?.flatPrice as any;
                const amount = fp?.amount || 0;
                const perDay = fp?.isPerDay ? "/day" : "";
                return `£${amount}${perDay}`;
              }
              const tp = (item as any)?.tieredPrice;
              const perDay = tp?.isPerDay ? "/day" : "";
              return (
                tp?.tiers
                  ?.map(
                    (t: any) =>
                      `${t.minDays}-${t.maxDays}d: £${t.price}${perDay}`
                  )
                  .join(" | ") || "-"
              );
            },
          },
          {
            key: "status",
            label: "Status",
            render: (value: string) => (
              <span
                className={`px-2 py-1 rounded-full  font-semibold ${
                  value === "active"
                    ? "bg-green-500/20 text-xs  text-green-400"
                    : "bg-red-500/20 text-[10px] text-red-400"
                }`}
              >
                {value}
              </span>
            ),
          },
        ]}
        onEdit={handleEdit}
        onStatusToggle={handleStatusToggle}
        onMutate={(mutate) => (mutateRef.current = mutate)}
        hiddenColumns={["pricingType", "description"]}
      />
    </div>
  );
}
