"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiChevronDown, FiSearch, FiShield, FiUser } from "react-icons/fi";
import { clientAuthHeaders } from "@/lib/client-auth";

export type StaffOption = {
  _id: string;
  name: string;
  lastName?: string;
  role: "admin" | "owner";
  emaildata?: { emailAddress?: string };
};

export default function SearchableStaffSelect({
  value,
  selectedName,
  onChange,
  disabled = false,
  placeholder = "Select staff member",
}: {
  value: string;
  selectedName?: string;
  onChange: (staff: StaffOption) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<StaffOption | null>(null);

  useEffect(() => {
    if (!value || (selected && selected._id !== value)) {
      setSelected(null);
    }
  }, [selected, value]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const loadStaff = useCallback(async (search: string, signal: AbortSignal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        roles: "admin,owner",
        limit: "50",
        sortBy: "name",
        sortOrder: "asc",
      });
      if (search.trim()) params.set("search", search.trim());
      const response = await fetch(`/api/users?${params}`, {
        headers: clientAuthHeaders(),
        cache: "no-store",
        signal,
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Could not load staff");
      }
      setStaff(Array.isArray(payload.data) ? payload.data : []);
    } catch (error) {
      if ((error as Error).name !== "AbortError") setStaff([]);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(
      () => void loadStaff(query, controller.signal),
      query.trim() ? 250 : 0,
    );
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadStaff, open, query]);

  const displayName = selected
    ? `${selected.name} ${selected.lastName || ""}`.trim()
    : selectedName;

  return (
    <div ref={rootRef} className="relative mt-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left text-sm text-white transition focus:border-[#fe9a00] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={displayName ? "truncate" : "truncate text-gray-500"}>
          {displayName || placeholder}
        </span>
        <FiChevronDown
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-[80] mt-1 w-full overflow-hidden rounded-xl border border-white/15 bg-[#111b33] shadow-2xl shadow-black/50">
          <div className="relative border-b border-white/10 p-2">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search admin or owner..."
              className="w-full rounded-lg border border-white/10 bg-black/20 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#fe9a00]"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1.5">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-4 text-sm text-gray-400">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#fe9a00]/30 border-t-[#fe9a00]" />
                Loading staff…
              </div>
            ) : staff.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">
                No admin or owner found
              </p>
            ) : (
              staff.map((option) => {
                const name = `${option.name} ${option.lastName || ""}`.trim();
                return (
                  <button
                    key={option._id}
                    type="button"
                    onClick={() => {
                      setSelected(option);
                      onChange(option);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-white/10 ${value === option._id ? "bg-[#fe9a00]/15" : ""}`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fe9a00]/15 text-[#fe9a00]">
                      {option.role === "owner" ? <FiShield /> : <FiUser />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-white">
                        {name}
                      </span>
                      <span className="block truncate text-[11px] capitalize text-gray-500">
                        {option.role}
                        {option.emaildata?.emailAddress
                          ? ` · ${option.emaildata.emailAddress}`
                          : ""}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
