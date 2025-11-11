import { createContext, useEffect, useMemo, useState, ReactNode } from "react";
import api from "../api/axios";
import { AuthResponse, UserProfile } from "../types/auth";

type AuthStatus = "idle" | "pending" | "authenticated" | "unauthenticated";

type AuthContextType = {
  user: UserProfile | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (payload: RegisterPayload) => Promise<UserProfile>;
  logout: () => void;
};

export interface RegisterPayload {
  fullName: string;
  companyName?: string;
  officialEmail: string;
  contactNumber?: string;
  password: string;
  role: "ADMIN" | "MANAGER" | "USER";
  warehouseLocationCode?: string;
  warehouseLocationName?: string;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "smartshelfx.token";
const USER_KEY = "smartshelfx.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as UserProfile) : null;
  });
  const [status, setStatus] = useState<AuthStatus>(user ? "authenticated" : "unauthenticated");

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setStatus("authenticated");
    } else {
      localStorage.removeItem(USER_KEY);
      const token = localStorage.getItem(TOKEN_KEY);
      setStatus(token ? "pending" : "unauthenticated");
    }
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return;
    }
    if (user) {
      return;
    }
    const fetchProfile = async () => {
      try {
        const response = await api.get<UserProfile>("/auth/me");
        setUser(response.data);
      } catch (err) {
        localStorage.removeItem(TOKEN_KEY);
        setStatus("unauthenticated");
      }
    };
    fetchProfile().catch(() => {
      /* swallowed */
    });
  }, [user]);

  const login = async (email: string, password: string) => {
    setStatus("pending");
    try {
      const response = await api.post<AuthResponse>("/auth/login", { email, password });
      localStorage.setItem(TOKEN_KEY, response.data.accessToken);
      setUser(response.data.user);
      setStatus("authenticated");
      return response.data.user;
    } catch (error) {
      setStatus("unauthenticated");
      throw error;
    }
  };

  const register = async (payload: RegisterPayload) => {
    setStatus("pending");
    try {
      const response = await api.post<UserProfile>("/auth/register", payload);
      setStatus("unauthenticated");
      return response.data;
    } catch (error) {
      setStatus("unauthenticated");
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setStatus("unauthenticated");
  };

  const value = useMemo(
    () => ({ user, status, login, logout, register }),
    [user, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
