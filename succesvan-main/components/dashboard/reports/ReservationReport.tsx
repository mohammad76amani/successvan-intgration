"use client";

import { useState, useEffect } from "react";
import { FiDownload, FiFilter, FiX } from "react-icons/fi";
import CustomSelect from "@/components/ui/CustomSelect";
import DatePicker from "@/components/dashboard/reports/DatePicker";
import { Pagination } from "@/types/type";

interface Office {
  _id: string;
  name: string;
}

interface Category {
  _id: string;
  name: string;
}

interface Reservation {
  _id: string;
  customerName: string | null;
  categoryName: string | null;
  vehicleTitle?: string;
  vehicleNumber?: string;
  officeName?: string;
  totalPrice: number;
  startDate: string;
  endDate: string;
  status: string;
  createdAt?: string;
}

interface Summary {
  totalRevenue: number;
  totalReservations: number;
  avgPrice: number;
  topReservation: Reservation | null;
  topCustomers: Array<{
    customerName: string;
    reservations: number;
    totalSpent: number;
  }>;
}

export default function ReservationReport() {
  const [data, setData] = useState<Reservation[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 15,
    pages: 1,
  });
  const [offices, setOffices] = useState<Office[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("");
  const [officeId, setOfficeId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const statusOptions = [
    { _id: "pending", name: "Pending" },
    { _id: "confirmed", name: "Confirmed" },
    { _id: "completed", name: "Completed" },
    { _id: "canceled", name: "Canceled" },
    { _id: "delivered", name: "Collected" },
  ];

  useEffect(() => {
    fetchOffices();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchData(1);
  }, [startDate, endDate, status, officeId, categoryId]);

  const fetchOffices = async () => {
    try {
      const res = await fetch("/api/offices?limit=100");
      const json = await res.json();
      setOffices(json.data || []);
    } catch (err) {
      console.log("Failed to load offices");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories?limit=100");
      const json = await res.json();
      setCategories(json.data?.data || json.data || []);
    } catch (err) {
      console.log("Failed to load categories");
    }
  };

  const fetchData = async (page: number = pagination.page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (status) params.append("status", status);
      if (officeId) params.append("office", officeId);
      if (categoryId) params.append("category", categoryId);

      const res = await fetch(`/api/reports/reservations?${params}`);
      const result = await res.json();

      if (result.success) {
        setData(result.data || []);
        setSummary(result.summary);
        setPagination(result.pagination);
      } else {
        console.log("API error:", result.error);
      }
    } catch (err) {
      console.log("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
    fetchData(newPage);
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setStatus("");
    setOfficeId("");
    setCategoryId("");
  };

  const exportToCSV = () => {
    const headers = [
      "Customer",
      "Category",
      "Vehicle",
      "Office",
      "Price ($)",
      "Start Date",
      "End Date",
      "Status",
    ];

    const rows = data.map((r) => [
      r.customerName || "Unknown",
      r.categoryName || "-",
      r.vehicleTitle ? `${r.vehicleTitle} (${r.vehicleNumber})` : "-",
      r.officeName || "-",
      r.totalPrice.toLocaleString(),
      new Date(r.startDate).toLocaleDateString(),
      new Date(r.endDate).toLocaleDateString(),
      r.status,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reservations-report-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-12 h-12 border-4 border-[#fe9a00]/30 border-t-[#fe9a00] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-white">Reservation Report</h2>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg transition-colors font-semibold"
        >
          <FiDownload /> Export CSV
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <FiFilter className="text-[#fe9a00]" />
          <h3 className="text-white font-semibold">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            label="Start Date"
            placeholder="Select start date"
          />
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            label="End Date"
            placeholder="Select end date"
          />
          <div>
            <label className="text-gray-300 text-sm font-semibold mb-2 block">
              Status
            </label>
            <CustomSelect
              options={statusOptions}
              value={status}
              onChange={setStatus}
              placeholder="All Statuses"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm font-semibold mb-2 block">
              Office
            </label>
            <CustomSelect
              options={offices}
              value={officeId}
              onChange={setOfficeId}
              placeholder="All Offices"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm font-semibold mb-2 block">
              Category
            </label>
            <CustomSelect
              options={categories}
              value={categoryId}
              onChange={setCategoryId}
              placeholder="All Categories"
            />
          </div>
        </div>

        {(startDate || endDate || status || officeId || categoryId) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            <FiX className="text-sm" />
            Clear Filters
          </button>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <p className="text-gray-400 text-sm">Total Revenue</p>
            <p className="text-3xl font-bold text-[#fe9a00] mt-2">
              ${summary.totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <p className="text-gray-400 text-sm">Total Reservations</p>
            <p className="text-3xl font-bold text-white mt-2">
              {summary.totalReservations}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <p className="text-gray-400 text-sm">Average Price</p>
            <p className="text-3xl font-bold text-white mt-2">
              ${summary.avgPrice.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <p className="text-gray-400 text-sm">Top Reservation</p>
            <p className="text-3xl font-bold text-[#fe9a00] mt-2">
              ${summary.topReservation?.totalPrice.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <p className="text-gray-400 text-sm">Active Filters</p>
            <p className="text-3xl font-bold text-white mt-2">
              {pagination.total}
            </p>
          </div>
        </div>
      )}

      {summary?.topCustomers && summary.topCustomers.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">
            Top 10 Customers by Spending
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.topCustomers.map((cust, idx) => (
              <div
                key={cust.customerName}
                className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-white font-semibold">
                    {idx + 1}. {cust.customerName}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {cust.reservations} reservation
                    {cust.reservations > 1 ? "s" : ""}
                  </p>
                </div>
                <p className="text-xl font-bold text-[#fe9a00]">
                  ${cust.totalSpent.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-white font-bold">#</th>
              <th className="px-6 py-4 text-left text-white font-bold">
                Customer
              </th>
              <th className="px-6 py-4 text-left text-white font-bold">
                Vehicle
              </th>
              <th className="px-6 py-4 text-left text-white font-bold">
                Category
              </th>
              <th className="px-6 py-4 text-left text-white font-bold">
                Office
              </th>
              <th className="px-6 py-4 text-left text-white font-bold">
                Price
              </th>
              <th className="px-6 py-4 text-left text-white font-bold">
                Dates
              </th>
              <th className="px-6 py-4 text-left text-white font-bold">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((res, idx) => (
              <tr
                key={res._id}
                className="border-b border-white/10 hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4 text-gray-300">
                  {(pagination.page - 1) * pagination.limit + idx + 1}
                </td>
                <td className="px-6 py-4 text-white font-medium">
                  {res.customerName || "Unknown"}
                </td>
                <td className="px-6 py-4 text-gray-300">
                  {res.vehicleTitle
                    ? `${res.vehicleTitle} (${res.vehicleNumber})`
                    : "-"}
                </td>
                <td className="px-6 py-4 text-gray-300">
                  {res.categoryName || "-"}
                </td>
                <td className="px-6 py-4 text-gray-300">
                  {res.officeName || "-"}
                </td>
                <td className="px-6 py-4 text-[#fe9a00] font-bold">
                  ${res.totalPrice.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-gray-300 text-sm">
                  {new Date(res.startDate).toLocaleDateString()} →{" "}
                  {new Date(res.endDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      res.status === "completed"
                        ? "bg-green-500/20 text-green-400"
                        : res.status === "confirmed"
                        ? "bg-blue-500/20 text-blue-400"
                        : res.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {res.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No reservations found with the current filters.
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-400">
            Showing {data.length} of {pagination.total} reservations
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 rounded bg-white/5 disabled:opacity-50 hover:bg-white/10 transition"
            >
              Previous
            </button>
            <span className="text-white">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 rounded bg-white/5 disabled:opacity-50 hover:bg-white/10 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
