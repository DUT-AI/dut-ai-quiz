"use client";

import React from "react";
import { SidebarNav } from "@/components/molecules/sidebar-nav";
import { useAuth } from "@/context/auth-context";
import SwitchTheme from "@/components/atoms/switch-theme";

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  const { isLoading } = useAuth();

  // 1. Loading state during hydration/auth validation
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary border-t-transparent animate-spin rounded-full" />
          <p className="font-bold text-primary animate-pulse">Portal đang khởi động...</p>
        </div>
      </div>
    );
  }

  // 2. Authenticated State (Middleware ensures authentication for (root) group)
  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-zinc-950 overflow-hidden text-slate-900 dark:text-zinc-50">
      {/* Sidebar - Fixed/Sticky on the left, full height */}
      <div className="h-full flex-shrink-0">
        <SidebarNav />
      </div>

      {/* Right Column - Topbar + Main Content */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Top Management Bar - Fixed at top */}
        <header className="h-16 bg-slate-900 dark:bg-zinc-900 flex-shrink-0 flex items-center justify-between px-8 text-white w-full backdrop-blur-md border-b border-white/5 z-50">
          <div>
            {/* Header Content Placeholder */}
          </div>
          <div className="flex items-center gap-4">
            <SwitchTheme />
          </div>
        </header>

        {/* This is the ONLY area that scrolls */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="p-6 md:p-10 xl:p-14 w-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default RootLayout;
