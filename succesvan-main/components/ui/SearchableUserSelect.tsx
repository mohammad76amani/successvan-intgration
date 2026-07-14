import { useState, useRef, useEffect } from "react";
import { FiSearch, FiX, FiUser, FiMail, FiPhone } from "react-icons/fi";

interface User {
  _id: string;
  name: string;
  lastName?: string;
  emaildata?: { emailAddress: string };
  emailData?: { emailAddress: string };
  phoneData?: { phoneNumber: string };
  phoneNumber?: string;
}

interface SearchableUserSelectProps {
  onSelect: (user: User) => void;
  placeholder?: string;
}

export default function SearchableUserSelect({
  onSelect,
  placeholder = "Search by phone number...",
}: SearchableUserSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
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

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 3) {
        setUsers([]);
        return;
      }

      setIsLoading(true);
      try {
        const phoneQuery = searchQuery.replace(/\D/g, "");
        const phoneWithCode = phoneQuery.startsWith("44")
          ? `+${phoneQuery}`
          : `+44${phoneQuery}`;
        
        const res = await fetch(
          `/api/users?phone=${encodeURIComponent(phoneWithCode)}&limit=10`
        );
        const data = await res.json();
        
        if (data.success && data.data) {
          setUsers(Array.isArray(data.data) ? data.data : []);
        } else {
          setUsers([]);
        }
      } catch (error) {
        console.log("Search error:", error);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSelect = (user: User) => {
    setSelectedUser(user);
    setSearchQuery("");
    setIsOpen(false);
    onSelect(user);
  };

  const handleClear = () => {
    setSelectedUser(null);
    setSearchQuery("");
    setUsers([]);
  };

  const getPhone = (user: User) => {
    return user.phoneData?.phoneNumber || user.phoneNumber || "";
  };

  const getEmail = (user: User) => {
    return user.emaildata?.emailAddress || user.emailData?.emailAddress || "";
  };

  if (selectedUser) {
    return (
      <div className="bg-white/5 border border-[#fe9a00]/30 rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-[#fe9a00]/20 flex items-center justify-center">
                <FiUser className="text-[#fe9a00]" />
              </div>
              <div>
                <h4 className="text-white font-bold">
                  {selectedUser.name} {selectedUser.lastName || ""}
                </h4>
                <p className="text-gray-400 text-xs">Selected Customer</p>
              </div>
            </div>
            <div className="space-y-1 ml-12">
              {getEmail(selectedUser) && (
                <div className="flex items-center gap-2 text-sm">
                  <FiMail className="text-gray-500 text-xs" />
                  <span className="text-gray-300">{getEmail(selectedUser)}</span>
                </div>
              )}
              {getPhone(selectedUser) && (
                <div className="flex items-center gap-2 text-sm">
                  <FiPhone className="text-gray-500 text-xs" />
                  <span className="text-gray-300">{getPhone(selectedUser)}</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleClear}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <FiX className="text-gray-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] transition-colors"
        />
      </div>

      {isOpen && (searchQuery.length >= 3 || isLoading) && (
        <div className="absolute z-50 w-full mt-2 bg-[#1a2847] border border-white/20 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="w-6 h-6 border-2 border-[#fe9a00]/30 border-t-[#fe9a00] rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-400 text-sm">Searching...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-gray-400 text-sm">
                {searchQuery.length < 3
                  ? "Type at least 3 digits to search"
                  : "No customers found"}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {users.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleSelect(user)}
                  className="w-full px-4 py-3 hover:bg-white/10 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#fe9a00]/20 flex items-center justify-center shrink-0">
                      <FiUser className="text-[#fe9a00]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">
                        {user.name} {user.lastName || ""}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {getPhone(user) && (
                          <span className="text-gray-400 text-xs truncate">
                            {getPhone(user)}
                          </span>
                        )}
                        {getEmail(user) && (
                          <span className="text-gray-500 text-xs truncate">
                            {getEmail(user)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
