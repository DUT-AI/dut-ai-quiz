"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { SidebarNav } from "@/components/molecules/sidebar-nav";
import { useAuth } from "@/context/auth-context";
import SwitchTheme from "@/components/atoms/switch-theme";
import { cn } from "@/lib/utils";
import { Menu, Rocket } from "lucide-react";

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  const { isLoading } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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

  const isPracticeGame = pathname && pathname.includes("/game") && pathname !== "/lessons/game";

  if (isPracticeGame) {
    return (
      <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950">
        {children}
      </div>
    );
  }

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setIsCollapsed(!isCollapsed);
    } else {
      setIsMobileOpen(!isMobileOpen);
    }
  };

  // 2. Authenticated State (Middleware ensures authentication for (root) group)
  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-zinc-950 overflow-hidden text-slate-900 dark:text-zinc-50">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Invisible Hover Trigger Zone at the Left Edge (Desktop only) */}
      {isCollapsed && (
        <div
          className="hidden lg:block fixed left-0 top-0 bottom-0 w-3 z-40 bg-transparent"
          onMouseEnter={() => setIsCollapsed(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        onMouseLeave={() => setIsCollapsed(true)}
        className={cn(
          "h-full flex-shrink-0 bg-white dark:bg-navy-blue border-r border-gray-100 dark:border-white/5 transition-all duration-300 ease-in-out z-50 overflow-hidden w-72",
          // Mobile Drawer
          "fixed lg:static inset-y-0 left-0 lg:h-full transform transition-transform lg:transform-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // Desktop Collapsible (using margin-left transition instead of width collapse for super smooth sliding and high performance)
          isCollapsed
            ? "lg:-ml-72 lg:opacity-0 lg:pointer-events-none lg:border-r-0"
            : "lg:ml-0 lg:opacity-100"
        )}
      >
        <SidebarNav onCloseMobile={() => setIsMobileOpen(false)} />
      </aside>

      {/* Right Column - Topbar + Main Content */}
      <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-300 ease-in-out">
        {/* Top Management Bar - Fixed at top */}
        <header className="h-16 bg-white dark:bg-navy-blue flex-shrink-0 flex items-center justify-between px-6 text-dark-blue dark:text-white 
          w-full border-b border-gray-100 dark:border-white/5 z-30 transition-all duration-300 ease-in-out">
          <div className="flex items-center gap-4">
            {/* Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-navy dark:text-light-blue transition-colors focus:outline-none"
              aria-label="Toggle Navigation"
            >
              <Menu className="size-5" />
            </button>

            {/* Brand Logo & Text in Header when Sidebar is collapsed (Desktop) */}
            <div
              className={cn(
                "hidden lg:flex items-center gap-3 transition-all duration-300 ease-in-out transform origin-left overflow-hidden",
                isCollapsed ? "w-48 opacity-100 translate-x-0 scale-100" : "w-0 opacity-0 -translate-x-4 scale-95 pointer-events-none"
              )}
            >
              <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 flex-shrink-0">
                <Rocket className="size-6" />
              </div>
              <div className="leading-none whitespace-nowrap">
                <p className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">DUT AI</p>
                <p className="text-base font-bold text-dark-blue dark:text-white uppercase tracking-tighter">Quiz Master</p>
              </div>
            </div>

            {/* Brand Logo & Text in Header on Mobile (Always visible since sidebar is drawer) */}
            <div className="flex lg:hidden items-center gap-3">
              <div className="size-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/30 flex-shrink-0">
                <Rocket className="size-5" />
              </div>
              <div className="leading-none whitespace-nowrap">
                <p className="text-[9px] font-black text-primary tracking-[0.2em] uppercase">DUT AI</p>
                <p className="text-sm font-bold text-dark-blue dark:text-white uppercase tracking-tighter">Quiz Master</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <SwitchTheme />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar relative transition-all duration-300 ease-in-out">
          <div className="p-4 sm:p-5 md:p-6 xl:p-8 w-full max-w-7xl mx-auto transition-all duration-300 ease-in-out">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default RootLayout;
