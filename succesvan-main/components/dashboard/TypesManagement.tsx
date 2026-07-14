"use client";

import { useState, useRef, useEffect } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import { showToast } from "@/lib/toast";
import DynamicTableView from "./DynamicTableView";
import { Type, Office } from "@/types/type";
import CustomSelect from "@/components/ui/CustomSelect";
type MutateFn = () => Promise<void>;

export default function TypesManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<Type | null>(null);
  const [formData, setFormData] = useState<Type>({
    name: "",
    description: "",
    offices: [],
    status: "active",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offices, setOffices] = useState<Office[]>([]);
  const mutateRef = useRef<MutateFn | null>(null);

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const res = await fetch("/api/offices?limit=100");
        const data = await res.json();
        if (data.success) {
          setOffices(data.data);
        }
      } catch (error) {
        console.log("Failed to fetch offices", error);
      }
    };
    fetchOffices();
  }, []);

  const handleOpenForm = (type?: Type) => {
    if (type) {
      setEditingType(type);
      // Extract office IDs from populated office objects
      const officeIds = type.offices
        ? type.offices
            .map((office) =>
              typeof office === "string" ? office : office._id!
            )
            .filter(Boolean)
        : [];

      setFormData({
        ...type,
        offices: officeIds,
        status: type.status || "active",
      });
    } else {
      setEditingType(null);
      setFormData({ name: "", description: "", offices: [], status: "active" });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingType(null);
    setFormData({ name: "", description: "", offices: [], status: "active" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast.error("Name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingType ? `/api/types/${editingType._id}` : "/api/types";
      const method = editingType ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Operation failed");

      showToast.success(
        editingType
          ? "Type updated successfully!"
          : "Type created successfully!"
      );
      handleCloseForm();
      if (mutateRef.current) mutateRef.current();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async (item: Type) => {
    try {
      if (!item._id) {
        console.log("No type ID found:", item);
        throw new Error("Type ID is missing");
      }

      console.log(
        "Toggling status for type:",
        item._id,
        "Current status:",
        item.status
      );
      const currentStatus = item.status || "active";
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      console.log("New status will be:", newStatus);

      const res = await fetch(`/api/types/${item._id}`, {
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

      showToast.success(`Type status updated to ${newStatus}`);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-6 py-3 bg-[#fe9a00] hover:bg-[#e68a00] text-white font-bold rounded-lg transition-colors"
        >
          <FiPlus /> Add Type
        </button>
      </div>

      <DynamicTableView<Type>
        apiEndpoint="/api/types"
        filters={[
          { key: "name", label: "Name", type: "text" },
          { key: "createdAt", label: "Created Date", type: "date" },
        ]}
        title="Type"
        columns={[
          { key: "name", label: "Name" },
          { key: "description", label: "Description" },

          {
            key: "offices",
            label: "Offices",
            render: (value: any) => {
              if (!value || value.length === 0) return "-";

              // Handle populated offices (objects with name property)
              if (value[0] && typeof value[0] === "object" && value[0].name) {
                return value.map((office: any) => office.name).join(", ");
              }

              // Handle office IDs (fallback)
              const officeNames = value.map((officeId: string) => {
                const office = offices.find((o) => o._id === officeId);
                return office?.name || officeId;
              });
              return officeNames.join(", ");
            },
          },
          {
            key: "createdAt",
            label: "Created",
            render: (value) =>
              value ? new Date(value).toLocaleDateString() : "-",
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
        onEdit={handleOpenForm}
        onStatusToggle={handleStatusToggle}
        onMutate={(mutate) => (mutateRef.current = mutate)}
        hideDelete={true}
      />

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a2847] rounded-2xl max-w-md w-full border border-white/10">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-2xl font-black text-white">
                {editingType ? "Edit Type" : "Add Type"}
              </h2>
              <button
                onClick={handleCloseForm}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiX className="text-white text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter type name"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter description"
                  rows={4}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Status
                </label>
                <CustomSelect
                  options={[
                    { _id: "active", name: "Active" },
                    { _id: "inactive", name: "Inactive" },
                  ]}
                  value={formData.status}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: val as "active" | "inactive",
                    }))
                  }
                  placeholder="Select Status"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Offices
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto p-3 bg-white/10 border border-white/20 rounded-lg">
                  {offices.map((office) => (
                    <label
                      key={office._id}
                      className="flex items-center gap-2 text-white cursor-pointer hover:bg-white/5 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={(
                          formData.offices as string[] | undefined
                        )?.includes(office._id!)}
                        onChange={(e) => {
                          const currentOffices = (formData.offices ||
                            []) as string[];
                          const selected: string[] = e.target.checked
                            ? [...currentOffices, office._id!]
                            : currentOffices.filter((id) => id !== office._id);
                          setFormData({ ...formData, offices: selected });
                        }}
                        className="w-4 h-4 accent-[#fe9a00]"
                        disabled={isSubmitting}
                      />
                      {office.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-[#fe9a00] hover:bg-[#fe9a00]/80 text-white rounded-lg transition-colors font-semibold disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingType
                    ? "Update"
                    : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
