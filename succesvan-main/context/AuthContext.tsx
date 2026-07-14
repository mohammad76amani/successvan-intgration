"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

interface User {
  _id: string;
  name: string;
  lastName?: string;
  emaildata?: {
    emailAddress: string;
    isVerified?: boolean;
  };
  emailData?: {
    emailAddress: string;
  };
  phoneData?: {
    phoneNumber: string;
    isVerified?: boolean;
  };
  phoneNumber?: string;
  role?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  avatar?: string;
  licenceAttached?: {
    front?: string;
    back?: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistUser = useCallback((nextUser: User | null) => {
    setUserState(nextUser);
    if (nextUser) {
      localStorage.setItem("user", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("user");
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.success) {
          persistUser(data.data);
        } else {
          localStorage.removeItem("token");
          persistUser(null);
        }
      } catch {
        localStorage.removeItem("token");
        persistUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [persistUser]);

  const logout = () => {
    localStorage.removeItem("token");
    persistUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser: persistUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
