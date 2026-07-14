"use client";

import { useState, useEffect } from "react";
import { FiDownload, FiFilter, FiX } from "react-icons/fi";
import { showToast } from "@/lib/toast";
import { Office, Pagination } from "@/types/type";
import CustomSelect from "@/components/ui/CustomSelect";
import DatePicker from "@/components/dashboard/reports/DatePicker";

interface VehicleReport {
  _id: string;
  title: string;
  number: string;
  keyNumber?: string;
  category: { name: string };
  office: { _id: string; name: string };
  reservationCount: number;
  totalRevenue?: number;
  needsService: boolean;
  images: string[];
  reservations: Array<{
    _id: string;
    startDate: string;
    endDate: string;
    userName?: string;
    status: string;
    totalPrice?: number;
  }>;
}

 

export default function VehicleReservationReport() {
  const [data, setData] = useState<VehicleReport[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);

  const [filterOffice, setFilterOffice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [offices, setOffices] = useState<Office[]>([]);

  useEffect(() => {
    fetchOffices();
  }, []);

  useEffect(() => {
    fetchData(1);
  }, [filterOffice, startDate, endDate]);

  const fetchOffices = async () => {
    try {
      const res = await fetch("/api/offices?limit=10");
      const json = await res.json();
      setOffices(json.data || []);
    } catch (error) {
      console.log("Failed to fetch offices:", error);
    }
  };

  const fetchData = async (page: number = pagination.page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filterOffice) params.append("office", filterOffice);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/reports/vehicles?${params}`);
      const result = await res.json();

      if (result.success) {
        setData(result.data || []);
        setPagination(result.pagination || pagination);
      } else {
        showToast.error(result.error || "Failed to load report");
      }
    } catch (error) {
      showToast.error("Server connection error");
      console.log("Fetch report error:", error);
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
    setFilterOffice("");
  };

  const exportToCSV = () => {
    const headers = [
      "Vehicle Title",
      "Plate Number",
      "Key Number",
      "Category",
      "Office",
      "Total Reservations",
      "Needs Service",
      "Total Revenue (USD)",
    ];

    const rows = data.map((v) => [
      v.title,
      v.number,
      v.keyNumber || "-",
      v.category?.name || "-",
      v.office?.name || "-",
      v.reservationCount,
      v.needsService ? "Yes" : "No",
      v.totalRevenue?.toLocaleString() || "0",
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
    a.download = `vehicle-report-${new Date().toISOString().split("T")[0]}.csv`;
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg transition-colors font-semibold"
        >
          <FiDownload />
          Export CSV
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <FiFilter className="text-[#fe9a00]" />
          <h3 className="text-white font-semibold">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-gray-300 text-sm font-semibold mb-2 block">
              Office
            </label>
            <CustomSelect
              options={offices.map(o => ({ _id: o._id ?? '', name: o.name }))}
              value={filterOffice}
              onChange={setFilterOffice}
              placeholder="All Offices"
            />
          </div>
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
        </div>

        {(startDate || endDate || filterOffice) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            <FiX className="text-sm" />
            Clear Filters
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-white font-bold">#</th>
              <th className="px-4 py-3 text-left text-white font-bold">
                Title
              </th>
              <th className="px-4 py-3 text-left text-white font-bold">
                Number
              </th>
              <th className="px-4 py-3 text-left text-white font-bold">
                Key Number
              </th>
              <th className="px-4 py-3 text-left text-white font-bold">
                Category
              </th>
              <th className="px-4 py-3 text-left text-white font-bold">
                Office
              </th>
              <th className="px-4 py-3 text-left text-white font-bold">
                Reservations
              </th>
              <th className="px-4 py-3 text-left text-white font-bold">
                Revenue
              </th>
              <th className="px-4 py-3 text-left text-white font-bold">
                Service
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((vehicle, idx) => (
              <tr
                key={vehicle._id}
                className="border-b border-white/10 hover:bg-white/5 transition-colors"
              >
                <td className="px-4 py-3 text-gray-300">
                  {(pagination.page - 1) * pagination.limit + idx + 1}
                </td>
                <td className="px-4 py-3 text-white font-semibold">
                  {vehicle.title}
                </td>
                <td className="px-4 py-3 text-gray-300">{vehicle.number}</td>
                <td className="px-4 py-3 text-gray-300">
                  {vehicle.keyNumber || "-"}
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {vehicle.category?.name || "-"}
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {vehicle.office?.name || "-"}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="px-3 py-1 bg-[#fe9a00]/20 text-[#fe9a00] rounded-full text-sm font-semibold">
                    {vehicle.reservationCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-300 text-right">
                  ${vehicle.totalRevenue?.toLocaleString() || "0"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      vehicle.needsService
                        ? "bg-red-500/20 text-red-400"
                        : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {vehicle.needsService ? "Needed" : "No"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-sm">
          Page {pagination.page} of {pagination.pages} (Total:{" "}
          {pagination.total})
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
