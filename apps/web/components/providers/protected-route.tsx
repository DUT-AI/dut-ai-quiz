"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // 1. Loading state with premium spin animation
  if (isLoading) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="size-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-gray-navy/60 dark:text-light-blue/60 animate-pulse">
          Đang xác thực quyền truy cập...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated state
  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // 3. Unauthorized state: check access across all roles
  const userRoles = [
    ...(Array.isArray(user?.role_names) ? user.role_names : []),
    user?.quiz_role || "",
  ].map((r: string) => String(r).trim().toUpperCase());

  const allowedSet = (allowedRoles || []).map((r) => r.trim().toUpperCase());

  const hasAccess =
    allowedSet.length === 0 ||
    userRoles.some((r) => allowedSet.includes(r)) ||
    userRoles.includes("ADMIN");

  if (!hasAccess) {
    return (
      <div className="min-h-[70vh] w-full flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-lg bg-white/70 dark:bg-zinc-900/50 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-white/5 p-8 md:p-12 text-center shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col items-center"
        >
          {/* Lock Icon Wrapper with bounce micro-animation */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: [0.8, 1.1, 1] }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="size-20 rounded-3xl bg-red/10 dark:bg-red/5 flex items-center justify-center text-red mb-8 border border-red/10"
          >
            <ShieldAlert className="size-10" />
          </motion.div>

          <h1 className="text-2xl font-black text-dark-blue dark:text-white uppercase tracking-tight mb-4">
            Từ chối truy cập
          </h1>
          
          <p className="text-sm text-gray-navy dark:text-light-blue opacity-80 max-w-sm mb-10 leading-relaxed">
            Tài khoản của bạn với vai trò <span className="font-bold text-red uppercase">{(user?.quiz_role || "Guest")}</span> không có quyền truy cập vào khu vực quản trị này.
          </p>

          {/* Action buttons with hover effects */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/dashboard")}
            className="w-full py-4 px-6 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="size-4" />
            Quay lại trang chính
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // 4. Authorized state: render contents
  return <>{children}</>;
}
