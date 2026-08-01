"use client";

import { useState, useEffect, useRef } from "react";
import { FiX, FiPlus, FiCalendar } from "react-icons/fi";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";
import { showToast } from "@/lib/toast";
import { Category, Office, Vehicle } from "@/types/type";
import DynamicTableView from "./DynamicTableView";
import CustomSelect from "@/components/ui/CustomSelect";
import { datePickerStyles } from "../global/DatePickerStyles";
import { clientAuthHeaders } from "@/lib/client-auth";
type MutateFn = () => Promise<void>;

type DashboardVehicleRecord = Omit<Vehicle, "category" | "gear" | "number"> & {
  category: string | { _id?: string; name?: string };
  office?: string | { _id?: string; name?: string };
  reservation?: string | { _id?: string };
  number: string | number;
  gear: {
    availableTypes: Array<
      "automatic" | "manual" | { gearType: "automatic" | "manual" }
    >;
  };
};

export default function VehiclesContent() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<
    { _id?: string; name: string }[]
  >([]);
  const [offices, setOffices] = useState<{ _id?: string; name: string }[]>([]);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingOffices, setLoadingOffices] = useState(true);
  const [availabilityBusyId, setAvailabilityBusyId] = useState<string | null>(
    null
  );
  const [showServiceDatePicker, setShowServiceDatePicker] = useState<
    string | null
  >(null);
  const mutateRef = useRef<MutateFn | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    number: "",
    color: "",
    keyNumber: "",
    category: "",
    office: "",
    reservation: "",
    available: true, // ← New field
    gear: { availableTypes: [] as string[] },
    properties: [{ name: "", value: "" }],
    needsService: false,
    serviceHistory: {
      tyre: new Date(),
      oil: new Date(),
      coolant: new Date(),
      breakes: new Date(),
      service: new Date(),
      adBlue: new Date(),
    },
    status: "active",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, offRes] = await Promise.all([
          fetch("/api/categories?limit=100&status=active"),
          fetch("/api/offices?limit=100&status=active"),
        ]);
        const catData = await catRes.json();
        const offData = await offRes.json();

        const categoriesData = (catData.data || []).map((cat: Category) => ({
          _id: cat._id,
          name: cat.name,
        }));
        const officesData = (offData.data || []).map((off: Office) => ({
          _id: off._id,
          name: off.name,
        }));

        setCategories(categoriesData);
        setOffices(officesData);
      } catch (error) {
        console.log("Failed to fetch data:", error);
      } finally {
        setLoadingCategories(false);
        setLoadingOffices(false);
        // setLoadingReservations(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePropertyChange = (
    index: number,
    field: string,
    value: string
  ) => {
    setFormData((prev) => {
      const updated = [...prev.properties];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, properties: updated };
    });
  };

  const addProperty = () => {
    setFormData((prev) => ({
      ...prev,
      properties: [...prev.properties, { name: "", value: "" }],
    }));
  };

  const removeProperty = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      properties: prev.properties.filter((_, i) => i !== index),
    }));
  };

  const handleServiceDateChange = (field: string, date: Date) => {
    setFormData((prev) => ({
      ...prev,
      serviceHistory: { ...prev.serviceHistory, [field]: date },
    }));
    setShowServiceDatePicker(null);
  };

  const handleGearChange = (type: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      gear: {
        availableTypes: checked
          ? [...prev.gear.availableTypes, type]
          : prev.gear.availableTypes.filter((t) => t !== type),
      },
    }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      number: "",
      color: "",
      keyNumber: "",
      category: "",
      office: "",
      reservation: "",
      available: true,
      gear: { availableTypes: [] },
      properties: [{ name: "", value: "" }],
      needsService: false,
      serviceHistory: {
        tyre: new Date(),
        oil: new Date(),
        coolant: new Date(),
        breakes: new Date(),
        service: new Date(),
        adBlue: new Date(),
      },
      status: "active",
    });
    setEditingId(null);
  };

  const handleEdit = (item: DashboardVehicleRecord) => {
    const categoryId =
      typeof item.category === "string"
        ? item.category
        : item.category?._id || "";
    const officeId =
      typeof item.office === "string"
        ? item.office
        : item.office?._id || "";
    const reservationId =
      typeof item.reservation === "string"
        ? item.reservation
        : item.reservation?._id || "";

    setFormData({
      title: item.title,
      description: item.description,
      number: String(item.number || ""),
      color: item.color || "",
      keyNumber: item.keyNumber || "",
      category: categoryId,
      office: officeId,
      reservation: reservationId,
      properties: item.properties || [{ name: "", value: "" }],
      needsService: item.needsService,
      available: item.available ?? true, // ← Handle available field
      gear: {
        availableTypes: (item.gear?.availableTypes || [])
          .map((type) => (typeof type === "string" ? type : type.gearType))
          .filter(Boolean),
      },
      serviceHistory: {
        tyre: item.serviceHistory?.tyre ? new Date(item.serviceHistory.tyre) : new Date(),
        oil: item.serviceHistory?.oil ? new Date(item.serviceHistory.oil) : new Date(),
        coolant: item.serviceHistory?.coolant ? new Date(item.serviceHistory.coolant) : new Date(),
        breakes: item.serviceHistory?.breakes ? new Date(item.serviceHistory.breakes) : new Date(),
        service: item.serviceHistory?.service ? new Date(item.serviceHistory.service) : new Date(),
        adBlue: item.serviceHistory?.adBlue ? new Date(item.serviceHistory.adBlue) : new Date(),
      },
      status: item.status || "active",
    });
    setEditingId(item._id || null);
    setIsFormOpen(true);
  };

  const handleStatusToggle = async (item: DashboardVehicleRecord) => {
    try {
      if (!item._id) {
        throw new Error("Vehicle ID is missing");
      }

      const currentStatus = item.status || "active";
      const newStatus = currentStatus === "active" ? "inactive" : "active";

      const res = await fetch(`/api/vehicles/${item._id}`, {
        method: "PATCH",
        headers: clientAuthHeaders(true),
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();

      if (!data.success) throw new Error(data.error || "Update failed");

      showToast.success(`Vehicle status updated to ${newStatus}`);
      if (mutateRef.current) {
        console.log("Refreshing table data...");
        mutateRef.current();
      } else {
        console.warn("mutateRef.current is not available");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Update failed");
    }
  };

  const handleAvailabilityToggle = async (item: DashboardVehicleRecord) => {
    try {
      if (!item._id) {
        throw new Error("Vehicle ID is missing");
      }

      const nextAvailable = !(item.available ?? true);
      setAvailabilityBusyId(item._id);

      const res = await fetch(`/api/vehicles/${item._id}`, {
        method: "PATCH",
        headers: clientAuthHeaders(true),
        body: JSON.stringify({ available: nextAvailable }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Update failed");

      showToast.success(
        nextAvailable
          ? "Vehicle marked as available"
          : "Vehicle marked as unavailable"
      );
      await mutateRef.current?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Availability update failed");
    } finally {
      setAvailabilityBusyId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/vehicles/${editingId}` : "/api/vehicles";

      const payload = {
        title: formData.title,
        description: formData.description,
        number: formData.number,
        color: formData.color.trim(),
        keyNumber: formData.keyNumber,
        category: formData.category,
        office: formData.office,
        ...(formData.reservation && { reservation: formData.reservation }),
        properties: formData.properties.filter((p) => p.name && p.value),
        needsService: formData.needsService,
        available: formData.available,
        gear: {
          availableTypes: formData.gear.availableTypes.map((type) => ({
            gearType: type,
          })),
        },
        serviceHistory: {
          tyre: formData.serviceHistory.tyre,
          oil: formData.serviceHistory.oil,
          coolant: formData.serviceHistory.coolant,
          breakes: formData.serviceHistory.breakes,
          service: formData.serviceHistory.service,
          adBlue: formData.serviceHistory.adBlue,
        },
        status: formData.status,
      };

      const res = await fetch(url, {
        method,
        headers: clientAuthHeaders(true),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Operation failed");

      showToast.success(
        `Vehicle ${editingId ? "updated" : "created"} successfully!`
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
        <FiPlus /> Add Vehicle
      </button>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2847] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b z-10 border-white/10 bg-[#1a2847]">
              <h2 className="text-2xl font-black text-white">
                {editingId ? "Edit Vehicle" : "Create Vehicle"}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiX className="text-white text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <label className="text-gray-400 text-sm mb-2 block">
                Brand
              </label>
              <input
                type="text"
                name="title"
                placeholder="Brand"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
              />
              <label className="text-gray-400 text-sm mb-2 block">
                Vehicle description
              </label>
              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
              />

              <label className="text-gray-400 text-sm mb-2 block">
                Vehicle number
              </label>
              <input
                type="text"
                name="number"
                placeholder="Vehicle Number"
                value={formData.number}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
              />

              <label className="text-gray-400 text-sm mb-2 block">
                Vehicle color
              </label>
              <input
                type="text"
                name="color"
                placeholder="e.g. White"
                value={formData.color}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
              />

              <label className="text-gray-400 text-sm mb-2 block">
                Key number
              </label>
              <input
                type="text"
                name="keyNumber"
                placeholder="Key Number"
                value={formData.keyNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
              />
              <label className="text-gray-400 text-sm mb-2 block">office</label>
              <CustomSelect
                options={offices.map(o => ({ _id: o._id ?? '', name: o.name }))}
                value={formData.office}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, office: val }))
                }
                placeholder={
                  loadingOffices ? "Loading offices..." : "Select Office"
                }
              />
              <label className="text-gray-400 text-sm mb-2 block">
                category
              </label>
              <CustomSelect
                options={categories.map(c => ({ _id: c._id ?? '', name: c.name }))}
                value={formData.category}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, category: val }))
                }
                placeholder={
                  loadingCategories
                    ? "Loading categories..."
                    : "Select Category"
                }
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
              <label className="text-gray-400 text-sm mb-2 block">
                Gearbox
              </label>
              <div className="space-y-2">
                {["automatic", "manual"].map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      required={formData.gear.availableTypes.length === 0}
                      checked={formData.gear.availableTypes.includes(type)}
                      onChange={(e) => handleGearChange(type, e.target.checked)}
                      className="w-5 h-5 text-[#fe9a00] rounded focus:ring-[#fe9a00]"
                    />
                    <span className="text-white font-medium capitalize">
                      {type}
                    </span>
                  </label>
                ))}
              </div>
              {/* New: Available Checkbox */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="available"
                  checked={formData.available}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-[#fe9a00] rounded focus:ring-[#fe9a00]"
                />
                <span className="text-white font-medium">
                  Available for Booking
                </span>
              </label>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">Properties</h3>
                  <button
                    type="button"
                    onClick={addProperty}
                    className="px-3 py-1 bg-[#fe9a00]/20 hover:bg-[#fe9a00]/30 text-[#fe9a00] rounded text-sm font-semibold"
                  >
                    + Add
                  </button>
                </div>
                {formData.properties.map((prop, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Property Name"
                      value={prop.name}
                      onChange={(e) =>
                        handlePropertyChange(idx, "name", e.target.value)
                      }
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Property Value"
                      value={prop.value}
                      onChange={(e) =>
                        handlePropertyChange(idx, "value", e.target.value)
                      }
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] text-sm"
                    />
                    {formData.properties.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProperty(idx)}
                        className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="needsService"
                  checked={formData.needsService}
                  onChange={handleInputChange}
                  className="w-4 h-4"
                />
                <span className="text-white text-sm">Needs Service</span>
              </label>

              <div className="space-y-3">
                <h3 className="text-white font-semibold">Service History</h3>
                <div className="grid grid-cols-2 gap-3">
                  {["tyre", "oil", "coolant", "breakes", "service", "adBlue"].map((field) => (
                    <div key={field} className="relative">
                      <label className="text-xs text-gray-400 capitalize">
                        {field} Service
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setShowServiceDatePicker(
                            showServiceDatePicker === field ? null : field
                          )
                        }
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm text-left focus:outline-none focus:border-[#fe9a00] flex items-center gap-2"
                      >
                        <FiCalendar className="text-[#fe9a00]" />
                        {(() => {
                          const date = formData.serviceHistory[
                            field as keyof typeof formData.serviceHistory
                          ];
                          try {
                            return format(new Date(date), "dd/MM/yyyy");
                          } catch {
                            return "Invalid Date";
                          }
                        })()}
                      </button>
                      {showServiceDatePicker === field && (
                        <div className="absolute top-full mt-2 z-50 bg-slate-800 backdrop-blur-xl border border-white/20 rounded-lg p-3">
                          <DateRange
                            ranges={[
                              {
                                startDate:
                                  formData.serviceHistory[
                                    field as keyof typeof formData.serviceHistory
                                  ],
                                endDate:
                                  formData.serviceHistory[
                                    field as keyof typeof formData.serviceHistory
                                  ],
                                key: "selection",
                              },
                            ]}
                            onChange={(item) => {
                              handleServiceDateChange(
                                field,
                                item.selection.startDate || new Date()
                              );
                            }}
                            maxDate={new Date()}
                            rangeColors={["#fe9a00"]}
                          />
                          <button
                            type="button"
                            onClick={() => setShowServiceDatePicker(null)}
                            className="w-full mt-2 px-3 py-1.5 bg-[#fe9a00] text-slate-900 font-semibold rounded text-xs hover:bg-[#e68a00]"
                          >
                            Done
                          </button>
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

      <DynamicTableView<DashboardVehicleRecord>
        apiEndpoint="/api/vehicles"
        hideDelete={true}
        filters={[
          { key: "title", label: "Brand", type: "text" },
          { key: "number", label: "Number", type: "text" },
          { key: "keyNumber", label: "Key Number", type: "text" },
          {
            key: "office",
            label: "Office",
            type: "select",
            options: offices.filter((o) => o._id) as {
              _id: string;
              name: string;
            }[],
          },
        ]}
        title="Vehicle"
        columns={[
          { key: "title", label: "Brand" },
          { key: "number", label: "Number" },
          {
            key: "color",
            label: "Color",
            render: (value) => value || "-",
          },
          {
            key: "keyNumber",
            label: "Key Number",
            render: (value) => value || "-",
          },
          {
            key: "office",
            label: "Office",
            render: (value) => {
              const office = value as DashboardVehicleRecord["office"];
              return typeof office === "string" ? office : office?.name || "-";
            },
          },
          {
            key: "category",
            label: "category",
            render: (value) => {
              const category = value as DashboardVehicleRecord["category"];
              return typeof category === "string"
                ? category
                : category?.name || "-";
            },
          },
          {
            key: "gear",
            label: "Gearbox",
            render: (value) => {
              const gear = value as DashboardVehicleRecord["gear"];
              return (
                gear?.availableTypes
                  ?.map((type) =>
                    typeof type === "string" ? type : type.gearType,
                  )
                  .join(", ") || "-"
              );
            },
          },
          {
            key: "needsService",
            label: "Needs Service",
            render: (value) => (value ? "Yes" : "No"),
          },
          {
            key: "available",
            label: "Available",
            render: (value: boolean, item?: DashboardVehicleRecord) => {
              const isAvailable = value ?? true;
              const isBusy = Boolean(item?._id && availabilityBusyId === item._id);

              return (
                <div className="flex flex-col gap-2">
                  <span
                    className={`w-fit px-2 py-1 rounded-full text-xs font-semibold ${
                      isAvailable
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {isAvailable ? "Available" : "Unavailable"}
                  </span>
                  {item?._id && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleAvailabilityToggle(item)}
                      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors disabled:opacity-50 ${
                        isAvailable
                          ? "bg-red-500/15 text-red-300 hover:bg-red-500/25"
                          : "bg-green-500/15 text-green-300 hover:bg-green-500/25"
                      }`}
                    >
                      {isBusy
                        ? "Updating..."
                        : isAvailable
                          ? "Mark unavailable"
                          : "Make available"}
                    </button>
                  )}
                </div>
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
        hiddenColumns={["needsService"]}
        onEdit={handleEdit}
        onStatusToggle={handleStatusToggle}
        onMutate={(mutate) => (mutateRef.current = mutate)}
      />

      <style jsx global>
        {datePickerStyles}
      </style>
    </div>
  );
}
