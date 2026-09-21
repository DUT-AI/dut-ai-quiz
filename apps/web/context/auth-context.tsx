"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPostJson } from "@/lib/api";

import { AppRole, getUserNormalizedRoles, hasAnyRole, normalizeRole } from "@/lib/permissions";

export interface UserContextType {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  roles: string[];
  isAdmin: boolean;
  isSubAdmin: boolean;
  isMentor: boolean;
  isTrainer: boolean;
  isEducator: boolean;
  isProjectDeveloper: boolean;
  isLeader: boolean;
  isTeammate: boolean;
  isHR: boolean;
  isGuest: boolean;
  canManage: boolean;
  canManageLessons: boolean;
  canManageExams: boolean;
  canManageHomeworks: boolean;
  canManageQuestions: boolean;
  canManageHackathons: boolean;
  canManageStats: boolean;
  hasRole: (role: AppRole | string) => boolean;
  hasAnyRole: (roles: (AppRole | string)[]) => boolean;
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

  const roles = getUserNormalizedRoles(user);

  const isAdmin = roles.includes(AppRole.ADMIN);
  const isSubAdmin = roles.includes(AppRole.SUB_ADMIN);
  const isEducator = roles.includes(AppRole.EDUCATOR);
  const isProjectDeveloper = roles.includes(AppRole.PROJECT_DEVELOPER);
  const isLeader = roles.includes(AppRole.LEADER);
  const isMentor = roles.includes(AppRole.MENTOR);
  const isTrainer = roles.includes(AppRole.TRAINER);
  const isHR = roles.includes(AppRole.HR);
  const isTeammate =
    roles.includes(AppRole.TEAMMATE) ||
    roles.includes(AppRole.STUDENT) ||
    isLeader ||
    isMentor ||
    isTrainer;

  const isGuest = !isAdmin && !isSubAdmin && !isProjectDeveloper && !isEducator && !isTeammate && !isHR;

  // Granular capability flags based on Use Case Diagram & verified requirements:
  // 1. LMS Management (Lessons, Homeworks, Questions): Admin & Educator ONLY
  const canManageLessons = isAdmin || isEducator;
  const canManageHomeworks = isAdmin || isEducator;
  const canManageQuestions = isAdmin || isEducator;

  // 2. Exam Management: Admin & Sub-Admin ONLY
  const canManageExams = isAdmin || isSubAdmin;

  // 3. Hackathon Management: Admin & Project Developer ONLY
  const canManageHackathons = isAdmin || isProjectDeveloper;

  // 4. Stats: Admin, Sub-Admin, Educator
  const canManageStats = isAdmin || isSubAdmin || isEducator;

  // 5. General Teacher Portal Entry
  const canManage = canManageLessons || canManageExams || canManageHackathons || canManageStats;

  const checkHasRole = (role: AppRole | string) => {
    return hasAnyRole(user, [role]);
  };

  const checkHasAnyRole = (allowedRoles: (AppRole | string)[]) => {
    return hasAnyRole(user, allowedRoles);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refresh: fetchUser,
        roles,
        isAdmin,
        isSubAdmin,
        isMentor,
        isTrainer,
        isEducator,
        isProjectDeveloper,
        isLeader,
        isTeammate,
        isHR,
        isGuest,
        canManage,
        canManageLessons,
        canManageExams,
        canManageHomeworks,
        canManageQuestions,
        canManageHackathons,
        canManageStats,
        hasRole: checkHasRole,
        hasAnyRole: checkHasAnyRole,
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
