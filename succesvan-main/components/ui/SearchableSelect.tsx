import { useState, useRef, useEffect, useCallback } from "react";
import { FiChevronDown, FiSearch, FiUser, FiPhone, FiMail } from "react-icons/fi";

interface User {
  _id: string;
  name: string;
  lastName?: string;
  emaildata?: { emailAddress: string };
  emailData?: { emailAddress: string };
  phoneData?: { phoneNumber: string };
  phoneNumber?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (userId: string, user: User) => void;
  placeholder?: string;
}

export default function SearchableSelect({
  value,
  onChange,
  placeholder = "Select customer...",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUsers = useCallback(async (query = "", signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        limit: "25",
        sortBy: "createdAt",
      });
      const trimmedQuery = query.trim();
      if (trimmedQuery) params.set("search", trimmedQuery);

      const res = await fetch(`/api/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal,
      });
      const data = await res.json();
      
      if (data.success && data.data) {
        const userList = Array.isArray(data.data) 
          ? data.data 
          : (data.data.data || data.data.users || []);
        
        setUsers(userList);
      } else {
        setUsers([]);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.log("Failed to fetch users:", error);
      setUsers([]);
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    const debounce = setTimeout(
      () => fetchUsers(searchQuery, controller.signal),
      searchQuery.trim() ? 300 : 0,
    );

    return () => {
      clearTimeout(debounce);
      controller.abort();
    };
  }, [fetchUsers, isOpen, searchQuery]);

  const handleSelect = (user: User) => {
    setSelectedUser(user);
    onChange(user._id, user);
    setIsOpen(false);
    setSearchQuery("");
  };

  const getPhone = (user: User) => {
    return user.phoneData?.phoneNumber || user.phoneNumber || "";
  };

  const getEmail = (user: User) => {
    return user.emaildata?.emailAddress || user.emailData?.emailAddress || "";
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-left focus:outline-none focus:border-[#fe9a00] flex items-center justify-between"
      >
        <span className={selectedUser ? "text-white" : "text-gray-400"}>
          {selectedUser
            ? `${selectedUser.name} ${selectedUser.lastName || ""} - ${getPhone(selectedUser)}`
            : placeholder}
        </span>
        <FiChevronDown
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[#1a2847] border border-white/20 rounded-lg shadow-2xl">
          {/* Search Input */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by phone or name..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#fe9a00]"
                autoFocus
              />
            </div>
          </div>

          {/* User List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-[#fe9a00]/30 border-t-[#fe9a00] rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-400 text-sm">Loading customers...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-gray-400 text-sm">
                  {searchQuery ? "No customers found" : "No customers available"}
                </p>
              </div>
            ) : (
              users.map((user) => (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => handleSelect(user)}
                  className={`w-full text-left px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 ${
                    value === user._id ? "bg-[#fe9a00]/20" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#fe9a00]/20 flex items-center justify-center shrink-0">
                      <FiUser className="text-[#fe9a00]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">
                        {user.name} {user.lastName || ""}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {getPhone(user) && (
                          <span className="text-gray-400 text-xs flex items-center gap-1">
                            <FiPhone className="text-[10px]" />
                            {getPhone(user)}
                          </span>
                        )}
                        {getEmail(user) && (
                          <span className="text-gray-500 text-xs truncate flex items-center gap-1">
                            <FiMail className="text-[10px]" />
                            {getEmail(user)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
