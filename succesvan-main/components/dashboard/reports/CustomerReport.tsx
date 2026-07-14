"use client";

import { useState, useEffect } from "react";
import { FiDownload, FiFilter, FiX } from "react-icons/fi";
import CustomSelect from "@/components/ui/CustomSelect";
import DatePicker from "@/components/dashboard/reports/DatePicker";
import { Pagination } from "@/types/type";

interface Customer {
  _id: string;
  name: string;
  reservationCount: number;
  totalSpent: number;
  createdAt: string;
}

interface Summary {
  totalCustomers: number;
  totalRevenue: number;
  avgReservationsPerCustomer: number;
  newUsersThisMonth: number;
  activeUsersThisMonth: number;
  mostActive: { name: string; reservationCount: number; totalSpent: number } | null;
  leastActive: { name: string; reservationCount: number; totalSpent: number } | null;
}

 

export default function CustomerReport() {
  const [data, setData] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 15,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);

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

      const res = await fetch(`/api/reports/customers?${params}`);
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
    const headers = ["Customer Name", "Reservations", "Total Spent ($)", "Joined Date"];

    const rows = data.map((c) => [
      c.name,
      c.reservationCount,
      c.totalSpent.toFixed(2),
      new Date(c.createdAt).toLocaleDateString(),
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
    a.download = `customer-report-${new Date().toISOString().split("T")[0]}.csv`;
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
        <h2 className="text-2xl font-black text-white">Customer Analytics Report</h2>
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
       
        </div>

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

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <p className="text-gray-400 text-sm">Total Customers</p>
            <p className="text-3xl font-bold text-white mt-2">{summary.totalCustomers.toLocaleString()}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <p className="text-gray-400 text-sm">Total Revenue</p>
            <p className="text-3xl font-bold text-[#fe9a00] mt-2">
              ${summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <p className="text-gray-400 text-sm">Avg Reservations</p>
            <p className="text-3xl font-bold text-white mt-2">{summary.avgReservationsPerCustomer.toFixed(1)}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <p className="text-gray-400 text-sm">New Users (Period)</p>
            <p className="text-3xl font-bold text-green-400 mt-2">{summary.newUsersThisMonth}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <p className="text-gray-400 text-sm">Active Users (Period)</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">{summary.activeUsersThisMonth}</p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-white font-bold">#</th>
              <th className="px-6 py-4 text-left text-white font-bold">Customer</th>
              <th className="px-6 py-4 text-left text-white font-bold">Reservations</th>
              <th className="px-6 py-4 text-left text-white font-bold">Total Spent</th>
              <th className="px-6 py-4 text-left text-white font-bold">Joined Date</th>
            </tr>
          </thead>
          <tbody>
            {data.map((customer, idx) => (
              <tr key={customer._id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-gray-300">{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                <td className="px-6 py-4 text-white font-medium">{customer.name}</td>
                <td className="px-6 py-4 text-center">
                  <span className="px-3 py-1 bg-[#fe9a00]/20 text-[#fe9a00] rounded-full text-sm font-semibold">
                    {customer.reservationCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-[#fe9a00] font-semibold">${customer.totalSpent.toLocaleString()}</td>
                <td className="px-6 py-4 text-gray-300">{new Date(customer.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-400">Showing {data.length} of {pagination.total} customers</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 rounded bg-white/5 disabled:opacity-50 hover:bg-white/10 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-white">Page {pagination.page} of {pagination.pages}</span>
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
