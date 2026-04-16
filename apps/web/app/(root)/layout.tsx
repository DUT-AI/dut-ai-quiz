"use client";

import React from "react";
import { SidebarNav } from "@/components/molecules/sidebar-nav";
import { useAuth } from "@/context/auth-context";
import SwitchTheme from "@/components/atoms/switch-theme";
import { MotionDiv } from "@/components/animated/motion-div";
import Link from "next/link";
import MaxWidthWrapper from "@/components/atoms/max-width-wrapper";

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // 1. Loading state
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F8FAFC] dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-purple border-t-transparent animate-spin rounded-full" />
          <p className="font-bold text-purple animate-pulse">Portal đang khởi động...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State: Show Landing Page (Full View)
  if (!isAuthenticated) {
    return (
      <div className="bg-white dark:bg-black w-full min-h-screen relative overflow-y-auto">
        <MaxWidthWrapper className="flex flex-col items-center justify-center min-h-screen text-center px-6">
          <MotionDiv
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl space-y-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-dark-blue dark:text-white leading-tight font-serif">
              Welcome to the <br />
              <span className="text-purple">DUT AI Quiz Portal</span>
            </h1>
            <p className="text-xl text-gray-navy dark:text-light-blue max-w-lg mx-auto opacity-70">
              Hệ thống quản lý học tập và đánh giá năng lực tích hợp trí tuệ nhân tạo.
            </p>
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="px-10 py-5 bg-purple hover:bg-purple/90 text-white rounded-2xl text-xl font-bold shadow-xl transition transform hover:scale-105 inline-block"
              >
                Đăng nhập Portal
              </Link>
            </div>
          </MotionDiv>
        </MaxWidthWrapper>
      </div>
    );
  }

  // 3. Authenticated State: Sidebar Fixed, Content Scrollable
  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] dark:bg-black overflow-hidden">
      {/* Sidebar - Fixed/Sticky on the left, full height */}
      <div className="h-full flex-shrink-0">
        <SidebarNav />
      </div>

      {/* Right Column - Topbar + Main Content */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Top Management Bar - Fixed at top */}
        <header className="h-16 bg-[#1E293B] dark:bg-black/90 flex-shrink-0 flex items-center justify-between px-8 text-white w-full backdrop-blur-md border-b border-white/5 z-50">
          <div>

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
