"use client";

import React, { useState, useEffect, useRef } from "react";
import { Grid, LayoutDashboard, GraduationCap, CheckSquare, Sparkles } from "lucide-react";

interface AppItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  isActive?: boolean;
}

const APPS: AppItem[] = [
  {
    id: "manage",
    title: "Hệ thống Quản lý",
    description: "Bảng điều khiển quản trị trung tâm và dữ liệu",
    icon: LayoutDashboard,
    path: "/manage/dashboard",
  },
  {
    id: "lms",
    title: "Học tập & Trắc nghiệm",
    description: "Ngân hàng câu hỏi, bài tập và đề thi",
    icon: GraduationCap,
    path: "/lms/dashboard",
    isActive: true,
  },
  {
    id: "meetly",
    title: "Công việc Meetly",
    description: "Bảng việc Kanban, ghi chú và lịch trình",
    icon: CheckSquare,
    path: "/meetly/tasks",
  },
];

export function WaffleLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="DUT-AI Apps"
        title="Chuyển đổi ứng dụng DUT-AI"
        className={`p-2 rounded-xl transition-colors focus:outline-none ${
          isOpen
            ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
            : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-navy dark:text-light-blue"
        }`}
      >
        <Grid className="size-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 p-3 bg-white dark:bg-navy-blue border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1.5 mb-2 border-b border-gray-100 dark:border-white/5">
            <p className="text-[10px] font-black tracking-widest text-primary uppercase">
              DUT-AI WORKSPACE
            </p>
          </div>

          <div className="flex flex-col gap-1">
            {APPS.map((app) => {
              const Icon = app.icon;
              return (
                <a
                  key={app.id}
                  href={app.path}
                  className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                    app.isActive
                      ? "bg-primary/10 dark:bg-primary/20 border border-primary/20"
                      : "hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 shrink-0 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-dark-blue dark:text-white truncate">
                        {app.title}
                      </p>
                      {app.isActive && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary text-white">
                          Đang mở
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                      {app.description}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default WaffleLauncher;
