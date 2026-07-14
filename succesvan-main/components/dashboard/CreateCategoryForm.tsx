"use client";

import { useState, useEffect, useRef } from "react";
import { FiX, FiPlus } from "react-icons/fi";
import { showToast } from "@/lib/toast";
import { Category, Type } from "@/types/type";
import DynamicTableView from "./DynamicTableView";
import CustomSelect from "@/components/ui/CustomSelect";
type MutateFn = () => Promise<void>;

export default function CategoriesContent() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const mutateRef = useRef<MutateFn | null>(null);
  const [types, setTypes] = useState<Type[]>([]);
   const [uploading, setUploading] = useState({ image: false, video: false });
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    purpose: "",
    expert: "",
    image: "",
    video: "",
    type: "",
    showPrice: "",
    selloffer: "",
    properties: [{ key: "", value: "" }],
    rules: [{ key: "", value: "" }],
    requiredLicense: "",
    pricingTiers: [{ minDays: "", maxDays: "", pricePerDay: "" }],
    extrahoursRate: "",
    fuel: "",
    gear: {
      availableTypes: [] as string[],
      automaticExtraCost: "",
    },
    seats: "",
    doors: "",
    servicesPeriod: {
      tyre: "",
      oil: "",
      coolant: "",
      breakes: "",
      service: "",
      adBlue: "",
    },
    offices: [] as string[],
    status: "active",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, officesRes] = await Promise.all([
          fetch("/api/types"),
          fetch("/api/offices?limit=100"),
        ]);
        const typesData = await typesRes.json();
        const officesData = await officesRes.json();
        if (typesData.success) setTypes(typesData.data);
       } catch (error) {
        console.log("Failed to fetch data", error);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name !== "type") {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleServiceChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      servicesPeriod: { ...prev.servicesPeriod, [field]: value },
    }));
  };

  const handleFileUpload = async (file: File, type: "image" | "video") => {
    setUploading({ ...uploading, [type]: true });
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFormData((prev) => ({ ...prev, [type]: data.url }));
      showToast.success(`${type} uploaded!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Upload failed");
    } finally {
      setUploading({ ...uploading, [type]: false });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      purpose: "",
      expert: "",
      image: "",
      video: "",
      type: "",
      showPrice: "",
      selloffer: "",
      properties: [{ key: "", value: "" }],
      rules: [{ key: "", value: "" }],
      requiredLicense: "",
      pricingTiers: [{ minDays: "", maxDays: "", pricePerDay: "" }],
      extrahoursRate: "",
      fuel: "",
      gear: {
        availableTypes: [] as string[],
        automaticExtraCost: "",
      },
      seats: "",
      doors: "",
      servicesPeriod: {
        tyre: "",
        oil: "",
        coolant: "",
        breakes: "",
        service: "",
        adBlue: "",
      },
      offices: [] as string[],
      status: "active",
    });
    setEditingId(null);
  };

  const handleEdit = (item: Category) => {
    const typeId =
      typeof item.type === "string" ? item.type : item.type._id || "";
    setFormData({
      name: item.name,
      description: item.description || "",
      purpose: (item as any).purpose || "",
      expert: (item as any).expert || "",
      image: item.image || "",
      video: (item as any).video || "",
      type: typeId,
      showPrice: String((item as any).showPrice || ""),
      selloffer: String((item as any).selloffer || ""),
      properties: (item as any).properties?.map((p: any) => ({
        key: p.key || "",
        value: p.value || "",
      })) || [{ key: "", value: "" }],
      rules: (item as any).rules?.map((r: any) => ({
        key: r.key || "",
        value: r.value || "",
      })) || [{ key: "", value: "" }],
      requiredLicense: (item as any).requiredLicense || "",
      pricingTiers: (item as any).pricingTiers?.map((t: any) => ({
        minDays: String(t.minDays || ""),
        maxDays: String(t.maxDays || ""),
        pricePerDay: String(t.pricePerDay || ""),
      })) || [{ minDays: "", maxDays: "", pricePerDay: "" }],
      extrahoursRate: String((item as any).extrahoursRate || ""),
      fuel: item.fuel || "",
      gear: {
        availableTypes: (item.gear as any)?.availableTypes || [],
        automaticExtraCost: String(
          (item.gear as any)?.automaticExtraCost || ""
        ),
      },
      seats: String(item.seats || ""),
      doors: String(item.doors || ""),
      servicesPeriod: {
        tyre: String(item.servicesPeriod?.tyre || ""),
        oil: String(item.servicesPeriod?.oil || ""),
        coolant: String(item.servicesPeriod?.coolant || ""),
        breakes: String(item.servicesPeriod?.breakes || ""),
        service: String(item.servicesPeriod?.service || ""),
        adBlue: String(item.servicesPeriod?.adBlue || ""),
      },
      offices: [],
      status: (item as any).status || "active",
    });
    setEditingId(item._id || null);
    setIsFormOpen(true);
  };

  const handleDuplicate = async (item: Category) => {
    try {
      const typeId =
        typeof item.type === "string" ? item.type : item.type._id || "";
      const payload = {
        name: `${item.name} (Copy)`,
        description: item.description,
        purpose: (item as any).purpose,
        expert: (item as any).expert,
        image: item.image,
        video: (item as any).video,
        type: typeId,
        showPrice: (item as any).showPrice,
        selloffer: (item as any).selloffer,
        properties: (item as any).properties || [],
        rules: (item as any).rules || [],
        requiredLicense: (item as any).requiredLicense,
        pricingTiers: (item as any).pricingTiers || [],
        extrahoursRate: (item as any).extrahoursRate,
        fuel: item.fuel,
        gear: item.gear,
        seats: item.seats,
        doors: item.doors,
        servicesPeriod: item.servicesPeriod,
      };

      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Duplicate failed");

      showToast.success("Category duplicated successfully!");
      if (mutateRef.current) mutateRef.current();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Duplicate failed");
    }
  };

  const handleStatusToggle = async (item: any) => {
    try {
      if (!item._id) {
        console.log("No category ID found:", item);
        throw new Error("Category ID is missing");
      }

      console.log(
        "Toggling status for category:",
        item._id,
        "Current status:",
        item.status
      );
      const currentStatus = item.status || "active";
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      console.log("New status will be:", newStatus);

      const res = await fetch(`/api/categories/${item._id}`, {
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

      showToast.success(`Category status updated to ${newStatus}`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId
        ? `/api/categories/${editingId}`
        : "/api/categories";

      const payload = {
        name: formData.name,
        description: formData.description,
        purpose: formData.purpose,
        expert: formData.expert,
        image: formData.image,
        video: formData.video,
        type: formData.type,
        showPrice: parseFloat(formData.showPrice),
        selloffer: formData.selloffer
          ? parseFloat(formData.selloffer)
          : undefined,
        properties: formData.properties.map((p) => ({
          key: p.key,
          value: p.value,
        })),
        rules: formData.rules.map((r) => ({
          key: r.key,
          value: r.value,
        })),
        requiredLicense: formData.requiredLicense,
        pricingTiers: formData.pricingTiers.map((t) => ({
          minDays: parseFloat(t.minDays),
          maxDays: parseFloat(t.maxDays),
          pricePerDay: parseFloat(t.pricePerDay),
        })),
        extrahoursRate: parseFloat(formData.extrahoursRate),
        fuel: formData.fuel,
        gear: {
          availableTypes: formData.gear.availableTypes,
          automaticExtraCost: parseFloat(formData.gear.automaticExtraCost) || 0,
        },
        seats: parseInt(formData.seats),
        doors: parseInt(formData.doors),
        servicesPeriod: {
          tyre: parseInt(formData.servicesPeriod.tyre),
          oil: parseInt(formData.servicesPeriod.oil),
          coolant: parseInt(formData.servicesPeriod.coolant),
          breakes: parseInt(formData.servicesPeriod.breakes),
          service: parseInt(formData.servicesPeriod.service),
          adBlue: parseInt(formData.servicesPeriod.adBlue),
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

      if (formData.offices.length > 0) {
        await Promise.all(
          formData.offices.map((officeId) =>
            fetch(`/api/offices/${officeId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                $addToSet: { categories: data.data._id },
              }),
            })
          )
        );
      }

      showToast.success(
        `Category ${editingId ? "updated" : "created"} successfully!`
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
        <FiPlus /> Add Category
      </button>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2847] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b z-10 border-white/10 bg-[#1a2847]">
              <h2 className="text-2xl font-black text-white">
                {editingId ? "Edit Category" : "Create Category"}
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
                  Category Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Category Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Description
                </label>
                <textarea
                  name="description"
                  placeholder="Description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Best for (What is this van suitable for?)
                </label>
                <textarea
                  name="purpose"
                  placeholder="e.g., Perfect for moving house, transporting goods, business deliveries, etc."
                  value={formData.purpose}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Image
                </label>

                {formData.image ? (
                  <div className="relative group">
                    <img
                      src={formData.image}
                      alt="Category preview"
                      className="w-full h-64 object-cover rounded-xl shadow-lg transition-opacity duration-300"
                    />

                    <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      {uploading.image ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <p className="text-white text-sm font-medium">
                            Uploading...
                          </p>
                        </div>
                      ) : (
                        <label className="px-6 py-3 bg-[#fe9a00] hover:bg-[#e68a00] text-white font-bold rounded-lg cursor-pointer shadow-lg transition-all">
                          Change Image
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                            className="hidden"
                            onChange={(e) =>
                              e.target.files?.[0] &&
                              handleFileUpload(e.target.files[0], "image")
                            }
                            disabled={uploading.image}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ) : (
                  <label
                    className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden ${
                      uploading.image
                        ? "border-[#fe9a00] bg-[#fe9a00]/10"
                        : "border-white/20 hover:border-[#fe9a00] hover:bg-white/5"
                    }`}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith("image/")) {
                        handleFileUpload(file, "image");
                      }
                    }}
                  >
                    {uploading.image ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-[#fe9a00]/30 border-t-[#fe9a00] rounded-full animate-spin"></div>
                        <p className="text-[#fe9a00] font-semibold">
                          Uploading Image...
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-[#fe9a00]/20 rounded-full flex items-center justify-center mb-4">
                          <FiPlus className="text-[#fe9a00] text-3xl" />
                        </div>
                        <p className="text-gray-300 font-medium">
                          Drag & drop or click to upload image
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          JPG, PNG, WebP, GIF, AVIF
                        </p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        handleFileUpload(e.target.files[0], "image")
                      }
                      disabled={uploading.image}
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Video (Optional)
                </label>

                {formData.video ? (
                  <div className="relative group">
                    <video
                      src={formData.video}
                      className="w-full h-64 object-cover rounded-xl shadow-lg transition-opacity duration-300"
                      controls
                      poster={formData.image || undefined}
                    />

                    <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      {uploading.video ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <p className="text-white text-sm font-medium">
                            Uploading Video...
                          </p>
                        </div>
                      ) : (
                        <label className="px-6 py-3 bg-[#fe9a00] hover:bg-[#e68a00] text-white font-bold rounded-lg cursor-pointer shadow-lg transition-all">
                          Change Video
                          <input
                            type="file"
                            accept="video/mp4,video/quicktime,video/webm"
                            className="hidden"
                            onChange={(e) =>
                              e.target.files?.[0] &&
                              handleFileUpload(e.target.files[0], "video")
                            }
                            disabled={uploading.video}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ) : (
                  <label
                    className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden ${
                      uploading.video
                        ? "border-[#fe9a00] bg-[#fe9a00]/10"
                        : "border-white/20 hover:border-[#fe9a00] hover:bg-white/5"
                    }`}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith("video/")) {
                        handleFileUpload(file, "video");
                      }
                    }}
                  >
                    {uploading.video ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-[#fe9a00]/30 border-t-[#fe9a00] rounded-full animate-spin"></div>
                        <p className="text-[#fe9a00] font-semibold">
                          Uploading Video...
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-[#fe9a00]/20 rounded-full flex items-center justify-center mb-4">
                          <FiPlus className="text-[#fe9a00] text-3xl" />
                        </div>
                        <p className="text-gray-300 font-medium">
                          Drag & drop or click to upload video
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          MP4, MOV, WebM
                        </p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        handleFileUpload(e.target.files[0], "video")
                      }
                      disabled={uploading.video}
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Expert
                </label>
                <input
                  type="text"
                  name="expert"
                  placeholder="Ford Transit Custom or Similar"
                  value={formData.expert}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">Type</label>
                <CustomSelect
                  options={types.map(t => ({ _id: t._id ?? '', name: t.name }))}
                  value={formData.type}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, type: val }))
                  }
                  placeholder="Select Type"
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
                  ]}
                  value={formData.status}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, status: val }))
                  }
                  placeholder="Select Status"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">Pricing Tiers</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        pricingTiers: [
                          ...prev.pricingTiers,
                          { minDays: "", maxDays: "", pricePerDay: "" },
                        ],
                      }))
                    }
                    className="text-[#fe9a00] hover:text-[#e68a00] text-sm font-semibold"
                  >
                    + Add Tier
                  </button>
                </div>
                {formData.pricingTiers.map((tier, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="Min Days"
                      value={tier.minDays}
                      onChange={(e) => {
                        const newTiers = [...formData.pricingTiers];
                        newTiers[index].minDays = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          pricingTiers: newTiers,
                        }));
                      }}
                      required
                      min="1"
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max Days"
                      value={tier.maxDays}
                      onChange={(e) => {
                        const newTiers = [...formData.pricingTiers];
                        newTiers[index].maxDays = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          pricingTiers: newTiers,
                        }));
                      }}
                      required
                      min="1"
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] text-sm"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Price/Day"
                        value={tier.pricePerDay}
                        onChange={(e) => {
                          const newTiers = [...formData.pricingTiers];
                          newTiers[index].pricePerDay = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            pricingTiers: newTiers,
                          }));
                        }}
                        required
                        step="0.01"
                        min="0"
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] text-sm"
                      />
                      {formData.pricingTiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              pricingTiers: prev.pricingTiers.filter(
                                (_, i) => i !== index
                              ),
                            }))
                          }
                          className="px-2 text-red-400 hover:text-red-300"
                        >
                          <FiX />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    Show Price
                  </label>
                  <input
                    type="number"
                    name="showPrice"
                    placeholder="Show Price"
                    value={formData.showPrice}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    Sell Offer (Optional)
                  </label>
                  <input
                    type="number"
                    name="selloffer"
                    placeholder="Sell Offer"
                    value={formData.selloffer}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">Properties</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        properties: [
                          ...prev.properties,
                          { key: "", value: "" },
                        ],
                      }))
                    }
                    className="text-[#fe9a00] hover:text-[#e68a00] text-sm font-semibold"
                  >
                    + Add Property
                  </button>
                </div>
                {formData.properties.map((prop, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Key (e.g. Carry Weight)"
                      value={prop.key}
                      onChange={(e) => {
                        const newProps = [...formData.properties];
                        newProps[index].key = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          properties: newProps,
                        }));
                      }}
                      required
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] text-sm"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Value (e.g. 1000kg)"
                        value={prop.value}
                        onChange={(e) => {
                          const newProps = [...formData.properties];
                          newProps[index].value = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            properties: newProps,
                          }));
                        }}
                        required
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] text-sm"
                      />
                      {formData.properties.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              properties: prev.properties.filter(
                                (_, i) => i !== index
                              ),
                            }))
                          }
                          className="px-2 text-red-400 hover:text-red-300"
                        >
                          <FiX />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">Rules</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        rules: [
                          ...prev.rules,
                          { key: "", value: "" },
                        ],
                      }))
                    }
                    className="text-[#fe9a00] hover:text-[#e68a00] text-sm font-semibold"
                  >
                    + Add Rule
                  </button>
                </div>
                {formData.rules.map((rule, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Key (e.g. Smoking)"
                      value={rule.key}
                      onChange={(e) => {
                        const newRules = [...formData.rules];
                        newRules[index].key = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          rules: newRules,
                        }));
                      }}
                      required
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] text-sm"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Value (e.g. Not Allowed)"
                        value={rule.value}
                        onChange={(e) => {
                          const newRules = [...formData.rules];
                          newRules[index].value = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            rules: newRules,
                          }));
                        }}
                        required
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] text-sm"
                      />
                      {formData.rules.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              rules: prev.rules.filter(
                                (_, i) => i !== index
                              ),
                            }))
                          }
                          className="px-2 text-red-400 hover:text-red-300"
                        >
                          <FiX />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Required Licences
                </label>
                <input
                  type="text"
                  name="requiredLicence"
                  placeholder="Required Licences"
                  value={formData.requiredLicense}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Extra Hours Rate (GBP/hour)
                </label>
                <input
                  type="number"
                  name="extrahoursRate"
                  placeholder="Extra Hours Rate (GBP/hour)"
                  value={formData.extrahoursRate}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Fuel Type
                </label>
                <CustomSelect
                  options={[
                    { _id: "gas", name: "Gas" },
                    { _id: "diesel", name: "Diesel" },
                    { _id: "electric", name: "Electric" },
                    { _id: "hybrid", name: "Hybrid" },
                  ]}
                  value={formData.fuel}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, fuel: val }))
                  }
                  placeholder="Select Fuel"
                />
              </div>

              <div className="space-y-3">
                <label className="text-gray-400 text-sm block">Gearbox</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.gear.availableTypes.includes("manual")}
                      onChange={(e) => {
                        const types = e.target.checked
                          ? [...formData.gear.availableTypes, "manual"]
                          : formData.gear.availableTypes.filter(
                              (t) => t !== "manual"
                            );
                        setFormData((prev) => ({
                          ...prev,
                          gear: { ...prev.gear, availableTypes: types },
                        }));
                      }}
                      className="w-4 h-4 accent-[#fe9a00]"
                    />
                    Manual
                  </label>
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.gear.availableTypes.includes(
                        "automatic"
                      )}
                      onChange={(e) => {
                        const types = e.target.checked
                          ? [...formData.gear.availableTypes, "automatic"]
                          : formData.gear.availableTypes.filter(
                              (t) => t !== "automatic"
                            );
                        setFormData((prev) => ({
                          ...prev,
                          gear: { ...prev.gear, availableTypes: types },
                        }));
                      }}
                      className="w-4 h-4 accent-[#fe9a00]"
                    />
                    Automatic
                  </label>
                </div>
                {formData.gear.availableTypes.includes("automatic") &&
                  formData.gear.availableTypes.includes("manual") && (
                    <div>
                      <label className="text-gray-400 text-sm mb-2 block">
                        Automatic Extra Cost (per day)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={formData.gear.automaticExtraCost}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            gear: {
                              ...prev.gear,
                              automaticExtraCost: e.target.value,
                            },
                          }))
                        }
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                      />
                    </div>
                  )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    Seats
                  </label>
                  <input
                    type="number"
                    name="seats"
                    placeholder="Seats"
                    value={formData.seats}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    Doors
                  </label>
                  <input
                    type="number"
                    name="doors"
                    placeholder="Doors"
                    value={formData.doors}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-white font-semibold">
                  Service Period{" "}
                  <span className="text-white text-sm font-normal">
                    (enter each service period in days)
                  </span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">
                      Tyre Service Period (days)
                    </label>
                    <input
                      type="number"
                      placeholder="Tyre"
                      value={formData.servicesPeriod.tyre}
                      onChange={(e) =>
                        handleServiceChange("tyre", e.target.value)
                      }
                      required
                      min="1"
                      className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] w-full"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">
                      Oil Service Period (days)
                    </label>
                    <input
                      type="number"
                      placeholder="Oil"
                      value={formData.servicesPeriod.oil}
                      onChange={(e) => handleServiceChange("oil", e.target.value)}
                      required
                      min="1"
                      className="px-4 py-3 w-full bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">
                      Coolant Service Period (days)
                    </label>
                    <input
                      type="number"
                      placeholder="Coolant"
                      value={formData.servicesPeriod.coolant}
                      onChange={(e) =>
                        handleServiceChange("coolant", e.target.value)
                      }
                      required
                      min="1"
                      className="px-4 py-3 w-full bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">
                      Brakes Service Period (days)
                    </label>
                    <input
                      type="number"
                      placeholder="Breakes"
                      value={formData.servicesPeriod.breakes}
                      onChange={(e) => handleServiceChange("breakes", e.target.value)}
                      required
                      min="1"
                      className="px-4 py-3 w-full bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">
                      General Service Period (days)
                    </label>
                    <input
                      type="number"
                      placeholder="Service"
                      value={formData.servicesPeriod.service}
                      onChange={(e) =>
                        handleServiceChange("service", e.target.value)
                      }
                      required
                      min="1"
                      className="px-4 py-3 w-full bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">
                      AdBlue Service Period (days)
                    </label>
                    <input
                      type="number"
                      placeholder="AdBlue"
                      value={formData.servicesPeriod.adBlue}
                      onChange={(e) =>
                        handleServiceChange("adBlue", e.target.value)
                      }
                      required
                      min="1"
                      className="px-4 py-3 w-full bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                    />
                  </div>
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

      <DynamicTableView<Category>
        apiEndpoint="/api/categories"
        filters={[
          { key: "name", label: "Category Name", type: "text" },
          {
            key: "type",
            label: "Type",
            type: "select",
            options: types.filter((t) => t._id) as {
              _id: string;
              name: string;
            }[],
          },
        ]}
        title="Category"
        onDuplicate={handleDuplicate}
        onStatusToggle={handleStatusToggle}
        columns={[
          { key: "name", label: "Name" },
          { key: "purpose", label: "Best for" },
          {
            key: "type",
            label: "Type",
            render: (value: any) => {
              if (!value) return "-";
              if (typeof value === "object" && value.name) return value.name;
              const typeObj = types.find((t) => t._id === value);
              return typeObj?.name || String(value);
            },
          },
          { key: "expert", label: "Expert" },
          {
            key: "showPrice" as keyof Category,
            label: "Show Price",
            render: (value: any) => (value ? `£${value}` : "-"),
          },
          {
            key: "properties" as keyof Category,
            label: "Properties",
            render: (value: any) =>
              Array.isArray(value) && value.length > 0 ? (
                <table className="text-xs">
                  <tbody>
                    {value.map((p: any, i: number) => (
                      <tr key={i}>
                        <td className="pr-2 font-semibold">{p.key}:</td>
                        <td>{p.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                "-"
              ),
          },
          {
            key: "rules" as keyof Category,
            label: "Rules",
            render: (value: any) =>
              Array.isArray(value) && value.length > 0 ? (
                <table className="text-xs">
                  <tbody>
                    {value.map((r: any, i: number) => (
                      <tr key={i}>
                        <td className="pr-2 font-semibold">{r.key}:</td>
                        <td>{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                "-"
              ),
          },
          {
            key: "pricingTiers" as keyof Category,
            label: "Pricing Tiers",
            render: (value: any) =>
              Array.isArray(value) && value.length > 0 ? (
                <table className="text-xs">
                  <tbody>
                    {value.map((t: any, i: number) => (
                      <tr key={i}>
                        <td className="pr-2">
                          {t.minDays}-{t.maxDays} days:
                        </td>
                        <td className="font-semibold">£{t.pricePerDay}/day</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                "-"
              ),
          },
          {
            key: "extrahoursRate" as keyof Category,
            label: "Extra Hours Rate",
            render: (value: any) => (value ? `£${value}/hr` : "-"),
          },
          {
            key: "requiredLicense" as keyof Category,
            label: "licences",
          },
          { key: "fuel", label: "Fuel" },
          {
            key: "gear",
            label: "Gear",
            render: (value: any) => {
              const types = value?.availableTypes?.join(", ") || "-";
              const extra =
                value?.automaticExtraCost > 0
                  ? ` (+£${value.automaticExtraCost}/day auto)`
                  : "";
              return types + extra;
            },
          },
          { key: "seats", label: "Seats" },
          { key: "doors", label: "Doors" },
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
        onMutate={(mutate) => (mutateRef.current = mutate)}
        hiddenColumns={
          [
            "properties",
            "rules",
            "pricingTiers",
            "expert",
            "requiredLicences",
            "purpose",
            "fuel",
            "showPrice",
            "doors",
          ] as (keyof Category)[]
        }
        hideDelete={true}
      />
    </div>
  );
}
