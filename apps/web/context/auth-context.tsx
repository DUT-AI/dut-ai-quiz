"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPostJson } from "@/lib/api";

export interface UserContextType {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  isAdmin: boolean;
  isMentor: boolean;
  isTeammate: boolean;
  isGuest: boolean;
  canManage: boolean;
}

const AuthContext = createContext<UserContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const res = await apiGet<any>("/api/v1/me");
      if (res.is_success && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await apiPostJson<any>("/api/v1/auth/login", { email, password });
      if (res.is_success) {
        await fetchUser();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiPostJson<any>("/api/v1/auth/logout", {});
    } finally {
      if (typeof window !== "undefined") {
        try {
          // Clear practice progress from sessionStorage
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith("practice_progress_")) {
              sessionStorage.removeItem(key);
              i--;
            }
          }
          // Clear practice progress from localStorage
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("practice_progress_")) {
              localStorage.removeItem(key);
              i--;
            }
          }
        } catch (e) {
          console.error("Failed to clear practice progress on logout", e);
        }
      }
      setUser(null);
      router.push("/login");
    }
  };

  const role = user?.quiz_role;
  const isAdmin = role === "admin";
  const isMentor = role === "MENTOR";
  const isTeammate = role === "teammate";
  const isGuest = !isAdmin && !isMentor && !isTeammate;
  const canManage = isAdmin || isMentor;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refresh: fetchUser,
        isAdmin,
        isMentor,
        isTeammate,
        isGuest,
        canManage,
      }}
    >
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
