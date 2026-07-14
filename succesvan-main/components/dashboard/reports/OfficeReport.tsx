"use client";

import { useState, useEffect } from "react";
import { FiDownload, FiFilter, FiX } from "react-icons/fi";
import CustomSelect from "@/components/ui/CustomSelect";
import DatePicker from "@/components/dashboard/reports/DatePicker";
import { Pagination } from "@/types/type";

interface OfficeReport {
  officeId: string;
  officeName: string;
  count: number;
  totalPrice: number;
  avgPrice: number;
}

interface ReportSummary {
  mostUsed: OfficeReport | null;
  leastUsed: OfficeReport | null;
  totalRevenue: number;
  totalReservations: number;
  officesCount: number;
}
 

export default function OfficeReportComponent() {
  const [data, setData] = useState<OfficeReport[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("");

  const statusOptions = [
    { _id: "pending", name: "Pending" },
    { _id: "confirmed", name: "Confirmed" },
    { _id: "completed", name: "Completed" },
    { _id: "canceled", name: "Canceled" },
  ];

  useEffect(() => {
    fetchData(1);
  }, [startDate, endDate, status]);

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

      const res = await fetch(`/api/reports/offices?${params}`);
      const result = await res.json();

      if (result.success) {
        setData(result.data || []);
        setSummary(result.summary);
        setPagination(result.pagination || pagination);
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
  };

  const exportToCSV = () => {
    const headers = [
      "Office Name",
      "Reservations Count",
      "Total Revenue ($)",
      "Average Price ($)",
    ];

    const rows = data.map((office) => [
      office.officeName,
      office.count,
      office.totalPrice.toFixed(2),
      office.avgPrice.toFixed(2),
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
    a.download = `office-report-${new Date().toISOString().split("T")[0]}.csv`;
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
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-white">
          Office Performance Report
        </h2>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg transition-colors font-semibold"
        >
          <FiDownload /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <FiFilter className="text-[#fe9a00]" />
          <h3 className="text-white font-semibold">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>

        {/* Clear Filters Button */}
        {(startDate || endDate || status) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            <FiX className="text-sm" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <p className="text-gray-400 text-sm">Total Revenue</p>
            <p className="text-3xl font-bold text-[#fe9a00] mt-2">
              $
              {summary.totalRevenue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <p className="text-gray-400 text-sm">Total Reservations</p>
            <p className="text-3xl font-bold text-white mt-2">
              {summary.totalReservations.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <p className="text-gray-400 text-sm">Active Offices</p>
            <p className="text-3xl font-bold text-white mt-2">
              {summary.officesCount}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <p className="text-gray-400 text-sm">Avg Revenue per Office</p>
            <p className="text-3xl font-bold text-white mt-2">
              $
              {summary.officesCount > 0
                ? (summary.totalRevenue / summary.officesCount).toLocaleString(
                    undefined,
                    { maximumFractionDigits: 0 }
                  )
                : 0}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <p className="text-gray-400 text-sm">Filtered Results</p>
            <p className="text-3xl font-bold text-white mt-2">
              {pagination.total}
            </p>
          </div>
        </div>
      )}

      {/* Most & Least Used Offices */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {summary.mostUsed && (
            <div className="bg-linear-to-br from-green-600/10 to-green-500/5 border border-green-500/30 rounded-xl p-6">
              <h3 className="text-green-400 font-bold text-lg mb-4">
                Most Active Office
              </h3>
              <p className="text-2xl font-bold text-white mb-3">
                {summary.mostUsed.officeName}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Reservations</p>
                  <p className="text-xl font-semibold text-white">
                    {summary.mostUsed.count.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Revenue</p>
                  <p className="text-xl font-semibold text-[#fe9a00]">
                    ${summary.mostUsed.totalPrice.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {summary.leastUsed && (
            <div className="bg-linear-to-br from-red-600/10 to-red-500/5 border border-red-500/30 rounded-xl p-6">
              <h3 className="text-red-400 font-bold text-lg mb-4">
                Least Active Office
              </h3>
              <p className="text-2xl font-bold text-white mb-3">
                {summary.leastUsed.officeName}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Reservations</p>
                  <p className="text-xl font-semibold text-white">
                    {summary.leastUsed.count.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Revenue</p>
                  <p className="text-xl font-semibold text-[#fe9a00]">
                    ${summary.leastUsed.totalPrice.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Offices Table */}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-white font-bold">#</th>
              <th className="px-6 py-4 text-left text-white font-bold">
                Office
              </th>
              <th className="px-6 py-4 text-left text-white font-bold">
                Reservations
              </th>
              <th className="px-6 py-4 text-left text-white font-bold">
                Total Revenue
              </th>
              <th className="px-6 py-4 text-left text-white font-bold">
                Average Price
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((office, idx) => (
              <tr
                key={office.officeId}
                className="border-b border-white/10 hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4 text-gray-300">
                  {(pagination.page - 1) * pagination.limit + idx + 1}
                </td>
                <td className="px-6 py-4 text-white font-medium">
                  {office.officeName}
                </td>
                <td className="px-6 py-4 text-center text-gray-300">
                  <span className="px-3 py-1 bg-[#fe9a00]/20 text-[#fe9a00] rounded-full text-sm font-semibold">
                    {office.count}
                  </span>
                </td>
                <td className="px-6 py-4 text-[#fe9a00] font-semibold">
                  ${office.totalPrice.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-gray-300">
                  ${office.avgPrice.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No office data found for the selected filters.
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-400">
            Showing {data.length} of {pagination.total} offices
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 rounded bg-white/5 disabled:opacity-50 hover:bg-white/10 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-white">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 rounded bg-white/5 disabled:opacity-50 hover:bg-white/10 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
