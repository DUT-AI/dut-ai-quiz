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
  isSubAdmin: boolean;
  isMentor: boolean;
  isEducator: boolean;
  isProjectDeveloper: boolean;
  isTeammate: boolean;
  isGuest: boolean;
  canManage: boolean;
  canManageLessons: boolean;
  canManageExams: boolean;
  canManageHomeworks: boolean;
  canManageHackathons: boolean;
  canManageStats: boolean;
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

  const rawRoles: string[] = Array.isArray(user?.role_names)
    ? user.role_names.map((r: string) => String(r).trim().toUpperCase())
    : [];
  const quizRole = String(user?.quiz_role || "").trim().toUpperCase();

  const isAdmin = rawRoles.includes("ADMIN") || quizRole === "ADMIN";
  const isSubAdmin = rawRoles.includes("SUB_ADMIN");
  const isProjectDeveloper = rawRoles.includes("PROJECT_DEVELOPER");
  const isEducator = rawRoles.includes("EDUCATOR") || rawRoles.includes("MENTOR") || quizRole === "MENTOR";
  const isMentor = isEducator;
  const isTeammate = rawRoles.includes("TEAMMATE") || rawRoles.includes("STUDENT") || quizRole === "TEAMMATE";
  const isGuest = !isAdmin && !isSubAdmin && !isProjectDeveloper && !isEducator && !isTeammate;

  // Granular capability flags
  const canManageLessons = isAdmin || isSubAdmin || isEducator;
  const canManageExams = isAdmin || isSubAdmin || isEducator;
  const canManageHomeworks = isAdmin || isSubAdmin || isEducator;
  const canManageHackathons = isAdmin || isSubAdmin || isProjectDeveloper;
  const canManageStats = isAdmin || isSubAdmin || isEducator;
  const canManage = canManageLessons || canManageHackathons || canManageExams;

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
        isSubAdmin,
        isMentor,
        isEducator,
        isProjectDeveloper,
        isTeammate,
        isGuest,
        canManage,
        canManageLessons,
        canManageExams,
        canManageHomeworks,
        canManageHackathons,
        canManageStats,
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
