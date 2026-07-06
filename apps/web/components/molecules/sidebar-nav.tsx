"use client";

import React from "react";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  History,
  Rocket,
  Settings,
  UserCircle,
  ShieldCheck,
  PlusCircle,
  BarChart2,
  LogOut,
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";

const STUDENT_NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Tổng quan", href: "/dashboard" },
  { icon: BookOpen, label: "Học tập", href: "/lessons" },
  { icon: GraduationCap, label: "Đề thi", href: "/exams" },
  { icon: Award, label: "Hackathons", href: "/hackathons" },
  { icon: History, label: "Lịch sử làm bài", href: "/history" },
];

const TEACHER_NAV_ITEMS = [
  { icon: ShieldCheck, label: "Quản lý Đề thi", href: "/teacher/exams" },
  { icon: PlusCircle, label: "Quản lý Bài học", href: "/teacher/lessons" },
  { icon: Award, label: "Quản lý Hackathon", href: "/teacher/hackathons" },
  { icon: BarChart2, label: "Thống kê kết quả", href: "/teacher/stats" },
];

export const SidebarNav = ({ onCloseMobile }: { onCloseMobile?: () => void }) => {
  const pathname = usePathname();
  const { user, logout, canManage } = useAuth();
  console.log(user)

  const isTeacher = canManage

  return (
    <div className="flex flex-col h-full w-72 py-8 px-4 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-3 px-4 mb-10">
        <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
          <Rocket className="size-6" />
        </div>
        <div className="leading-none">
          <p className="text-xs font-black text-primary tracking-[0.2em] uppercase">DUT AI</p>
          <p className="text-lg font-bold text-dark-blue dark:text-white uppercase tracking-tighter">Quiz Master</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Student Section */}
        <div>
          <p className="px-4 text-[10px] font-black text-gray-navy/40 uppercase tracking-[0.2em] mb-4">Sinh viên</p>
          <nav className="space-y-1">
            {STUDENT_NAV_ITEMS.map((item, idx) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 group",
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-gray-navy dark:text-light-blue hover:bg-primary/5 hover:text-primary"
                  )}
                >
                  <item.icon className={cn(
                    "size-5 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-white" : "opacity-60"
                  )} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Teacher Section (Conditional) */}
        {isTeacher && (
          <div className="pt-4 border-t border-gray-100 dark:border-white/5">
            <p className="px-4 text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Giảng viên / Admin</p>
            <nav className="space-y-1">
              {TEACHER_NAV_ITEMS.map((item, idx) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={idx}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 group",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-navy dark:text-light-blue hover:bg-primary/5 hover:text-primary"
                    )}
                  >
                    <item.icon className={cn(
                      "size-5 transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-primary" : "opacity-60"
                    )} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User Info Bottom */}
      <div className="mt-auto pt-10 px-2">
        <div className="p-4 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle className="size-6 text-primary" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold text-dark-blue dark:text-white truncate">{user?.name || "Người dùng"}</p>
              <p className="text-[10px] text-gray-navy dark:text-light-blue opacity-60 uppercase">{user?.quiz_role || "Guest"}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red/10 text-red text-xs font-bold hover:bg-red hover:text-white transition-all transform active:scale-95"
          >
            <LogOut className="size-4" />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};
