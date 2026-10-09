"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronDown, Check, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLessons, useModules } from "@/lib/queries";
import type { Lesson } from "@/features/lessons/types";
import { cn } from "@/lib/utils";

interface LessonNavBarProps {
  currentLesson: Partial<Lesson>;
}

export function LessonNavBar({ currentLesson }: LessonNavBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";

  const { data: lessons = [], isLoading: isLoadingLessons } = useLessons();
  const { data: modules = [], isLoading: isLoadingModules } = useModules();

  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLAnchorElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Scroll active item into view inside dropdown when opened
  useEffect(() => {
    if (isOpen && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isOpen]);

  // Construct sequentially ordered lessons based on module roadmap
  const orderedLessons = useMemo(() => {
    const sortedMods = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));
    const result: { lesson: Lesson; moduleName?: string; moduleOrder?: number }[] = [];

    // Group lessons by module
    sortedMods.forEach((mod) => {
      const modLessons = lessons
        .filter((l) => l.module_id === mod.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      modLessons.forEach((l) => {
        result.push({ lesson: l, moduleName: mod.name, moduleOrder: mod.order });
      });
    });

    // Unassigned lessons at the end
    const unassigned = lessons
      .filter((l) => !l.module_id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    unassigned.forEach((l) => {
      result.push({ lesson: l, moduleName: "Bài học bổ sung" });
    });

    return result;
  }, [lessons, modules]);

  // Determine current lesson index, previous and next
  const currentIndex = useMemo(() => {
    if (!currentLesson) return -1;
    return orderedLessons.findIndex(
      (item) =>
        item.lesson.id === currentLesson.id ||
        (!!currentLesson.slug && item.lesson.slug === currentLesson.slug)
    );
  }, [orderedLessons, currentLesson]);

  const prevItem = currentIndex > 0 ? orderedLessons[currentIndex - 1] : null;
  const nextItem =
    currentIndex >= 0 && currentIndex < orderedLessons.length - 1
      ? orderedLessons[currentIndex + 1]
      : null;

  // Preserve current subtab (/practice, /arena, /homework) if active
  const subRoute = useMemo(() => {
    if (pathname.includes("/practice")) return "/practice";
    if (pathname.includes("/arena")) return "/arena";
    if (pathname.includes("/homework")) return "/homework";
    return "";
  }, [pathname]);

  const buildLessonUrl = (targetLesson: Lesson) => {
    const query = isPreview ? "?preview=true" : "";
    return `/lessons/${targetLesson.slug || targetLesson.id}${subRoute}${query}`;
  };

  // Filter lessons in dropdown
  const filteredDropdownLessons = useMemo(() => {
    if (!filterText.trim()) return orderedLessons;
    const query = filterText.toLowerCase();
    return orderedLessons.filter(
      (item) =>
        item.lesson.name.toLowerCase().includes(query) ||
        (item.moduleName && item.moduleName.toLowerCase().includes(query)) ||
        `bài ${item.lesson.order}`.includes(query)
    );
  }, [orderedLessons, filterText]);

  if (isLoadingLessons || isLoadingModules || orderedLessons.length === 0) {
    return null;
  }

  const currentDisplayTitle = currentLesson.name || "Chọn bài học";
  const currentOrder = currentLesson.order ?? (currentIndex >= 0 ? currentIndex + 1 : 1);

  return (
    <div
      ref={dropdownRef}
      className={cn("relative inline-flex items-center transition-all", isOpen ? "z-[100]" : "z-20")}
    >
      {/* 3 Connected Buttons Container */}
      <div className="inline-flex items-stretch rounded-xl sm:rounded-2xl border border-primary/25 bg-slate-100/90 dark:bg-navy-blue/80 p-1 shadow-md gap-1 backdrop-blur-md">

        {/* 1. Left Button: Previous Lesson */}
        {prevItem ? (
          <Link
            href={buildLessonUrl(prevItem.lesson)}
            title={`Bài trước: ${prevItem.lesson.name}`}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-primary text-white hover:bg-primary/90 active:scale-[0.98] transition-all text-xs sm:text-sm font-bold shadow-sm"
          >
            <ChevronLeft className="size-4 shrink-0" />
            <span className="hidden md:inline truncate max-w-[140px] lg:max-w-[180px]">
              {prevItem.lesson.name}
            </span>
            <span className="md:hidden whitespace-nowrap">Bài trước</span>
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-primary/40 text-white/60 cursor-not-allowed text-xs sm:text-sm font-bold opacity-60"
          >
            <ChevronLeft className="size-4 shrink-0" />
            <span className="hidden md:inline">Bài trước</span>
            <span className="md:hidden">Trước</span>
          </button>
        )}

        {/* 2. Middle Button: Current Lesson with Dropdown trigger */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "flex items-center gap-2 px-3.5 sm:px-5 py-2 rounded-lg sm:rounded-xl text-white transition-all text-xs sm:text-sm font-bold shadow-sm cursor-pointer select-none",
            isOpen
              ? "bg-primary-focus ring-2 ring-primary/40 bg-primary/95"
              : "bg-primary hover:bg-primary/90"
          )}
          title={`Bài ${currentOrder}: ${currentDisplayTitle} (Nhấn để xem toàn bộ danh sách bài học)`}
        >
          <span className="truncate max-w-[130px] sm:max-w-[200px] lg:max-w-[260px]">
            Bài {currentOrder}: {currentDisplayTitle}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {/* 3. Right Button: Next Lesson */}
        {nextItem ? (
          <Link
            href={buildLessonUrl(nextItem.lesson)}
            title={`Bài tiếp: ${nextItem.lesson.name}`}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-primary text-white hover:bg-primary/90 active:scale-[0.98] transition-all text-xs sm:text-sm font-bold shadow-sm"
          >
            <span className="hidden md:inline truncate max-w-[140px] lg:max-w-[180px]">
              {nextItem.lesson.name}
            </span>
            <span className="md:hidden whitespace-nowrap">Bài tiếp</span>
            <ChevronRight className="size-4 shrink-0" />
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-primary/40 text-white/60 cursor-not-allowed text-xs sm:text-sm font-bold opacity-60"
          >
            <span className="hidden md:inline">Bài tiếp</span>
            <span className="md:hidden">Tiếp</span>
            <ChevronRight className="size-4 shrink-0" />
          </button>
        )}
      </div>

      {/* Floating Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 sm:right-0 sm:left-auto max-sm:left-1/2 max-sm:-translate-x-1/2 top-full mt-2 w-72 sm:w-84 md:w-96 max-w-[calc(100vw-2rem)] rounded-2xl bg-white/95 dark:bg-[#121A2E]/95 border border-slate-200 dark:border-white/10 shadow-2xl backdrop-blur-2xl p-3 z-[9999] text-left flex flex-col gap-2"
          >
            {/* Header info */}
            <div className="flex items-center justify-between px-2 pt-1 pb-1.5 border-b border-slate-150/60 dark:border-white/10">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-navy/70 dark:text-light-blue/70">
                Danh sách bài học ({orderedLessons.length})
              </span>
              <span className="text-[10px] font-bold text-primary">
                Đang học Bài {currentOrder}
              </span>
            </div>

            {/* Quick Search filter if more than 6 lessons */}
            {orderedLessons.length > 6 && (
              <div className="relative px-1">
                <Search className="size-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-navy/50 dark:text-light-blue/50" />
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Lọc bài học theo tên..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-dark-blue dark:text-white placeholder:text-gray-navy/40 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* Scrollable Lesson Items */}
            <div className="max-h-72 sm:max-h-80 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
              {filteredDropdownLessons.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-navy/60 dark:text-light-blue/50">
                  Không tìm thấy bài học nào phù hợp.
                </div>
              ) : (
                filteredDropdownLessons.map((item) => {
                  const isCurrent =
                    item.lesson.id === currentLesson.id ||
                    (!!currentLesson.slug && item.lesson.slug === currentLesson.slug);

                  return (
                    <Link
                      key={item.lesson.id}
                      ref={isCurrent ? activeItemRef : undefined}
                      href={buildLessonUrl(item.lesson)}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs transition-all",
                        isCurrent
                          ? "bg-primary/10 dark:bg-primary/20 text-primary font-black border border-primary/30"
                          : "text-dark-blue dark:text-zinc-200 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-primary font-medium"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Checkmark indicator for current active lesson */}
                        <div
                          className={cn(
                            "size-5 rounded-md flex items-center justify-center shrink-0 text-xs",
                            isCurrent
                              ? "bg-primary text-white"
                              : "text-transparent group-hover:text-gray-navy/20"
                          )}
                        >
                          <Check className="size-3.5" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate leading-snug">
                            Bài {item.lesson.order || 1}: {item.lesson.name}
                          </p>
                          {item.moduleName && (
                            <p className="text-[10px] text-gray-navy/60 dark:text-light-blue/50 truncate font-normal">
                              {item.moduleName}
                            </p>
                          )}
                        </div>
                      </div>

                      {isCurrent && (
                        <span className="text-[9px] font-black uppercase tracking-wider text-primary px-1.5 py-0.5 rounded bg-primary/15 shrink-0">
                          Hiện tại
                        </span>
                      )}
                    </Link>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
