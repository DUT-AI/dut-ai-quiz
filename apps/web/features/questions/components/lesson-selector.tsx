"use client";

import React, { useState, useMemo } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  BookOpen,
  Search,
  Check,
  ChevronDown,
  Loader2,
  FolderOpen,
  Layers,
  X,
} from "lucide-react";
import { useModules, useLessons } from "@/features/lessons/queries";
import { useThemeStore } from "@/store/theme-store";
import { cn } from "@/lib/utils";

interface LessonSelectorProps {
  value?: string | null;
  onChange: (lessonId: string) => void;
  disabled?: boolean;
}

export function LessonSelector({ value, onChange, disabled }: LessonSelectorProps) {
  const { darkMode } = useThemeStore();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: modules = [], isLoading: isLoadingModules } = useModules();
  const { data: allLessons = [], isLoading: isLoadingLessons } = useLessons();

  const isLoading = isLoadingModules || isLoadingLessons;

  // Selected lesson information
  const selectedLesson = useMemo(() => {
    if (!value) return null;
    return allLessons.find((l) => l.id === value) ?? null;
  }, [value, allLessons]);

  // Group lessons by module and apply search filtering
  const groupedModules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // Map module id to module
    const moduleMap = new Map<string, { id: string; name: string; order: number; lessons: typeof allLessons }>();
    
    // Unassigned lessons bucket
    const unassignedLessons: typeof allLessons = [];

    // Initialize with fetched modules
    modules.forEach((mod) => {
      moduleMap.set(mod.id, {
        id: mod.id,
        name: mod.name,
        order: mod.order,
        lessons: [],
      });
    });

    // Distribute lessons into their modules
    allLessons.forEach((lesson) => {
      const matchesSearch =
        !query ||
        lesson.name.toLowerCase().includes(query) ||
        (lesson.description && lesson.description.toLowerCase().includes(query));

      if (!matchesSearch) return;

      if (lesson.module_id && moduleMap.has(lesson.module_id)) {
        moduleMap.get(lesson.module_id)!.lessons.push(lesson);
      } else {
        unassignedLessons.push(lesson);
      }
    });

    // Sort modules by order and sort lessons in each module by order
    const result = Array.from(moduleMap.values())
      .map((mod) => ({
        ...mod,
        lessons: mod.lessons.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      }))
      .filter((mod) => mod.lessons.length > 0)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (unassignedLessons.length > 0) {
      result.push({
        id: "unassigned",
        name: "Bài học chưa phân chương",
        order: 9999,
        lessons: unassignedLessons.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      });
    }

    return result;
  }, [modules, allLessons, searchQuery]);

  const totalFilteredCount = useMemo(() => {
    return groupedModules.reduce((acc, m) => acc + m.lessons.length, 0);
  }, [groupedModules]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild disabled={disabled}>
        <button
          type="button"
          aria-label="Chọn bài học cho câu hỏi"
          className={cn(
            "group flex items-center gap-2.5 px-3 py-2 rounded-2xl border text-left transition-all duration-200 outline-none max-w-[280px] sm:max-w-[340px]",
            darkMode
              ? "bg-white/5 border-white/10 hover:border-primary/50 hover:bg-white/[0.08]"
              : "bg-gray-50/80 border-gray-200 hover:border-primary/50 hover:bg-white shadow-xs",
            open && (darkMode ? "border-primary/60 bg-white/10" : "border-primary bg-white shadow-sm"),
            disabled && "opacity-60 cursor-not-allowed"
          )}
        >
          <div className="size-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
            <BookOpen className="size-3.5" />
          </div>

          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-gray-navy uppercase tracking-wider block opacity-70 leading-none mb-0.5">
              Bài học
            </span>
            <span className="text-xs font-bold text-dark-blue dark:text-white truncate block">
              {isLoading ? (
                "Đang tải..."
              ) : selectedLesson ? (
                selectedLesson.name
              ) : (
                <span className="text-gray-navy italic font-normal">Chưa chọn bài học</span>
              )}
            </span>
          </div>

          <ChevronDown
            className={cn(
              "size-4 text-gray-navy shrink-0 transition-transform duration-200",
              open && "rotate-180 text-primary"
            )}
          />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className={cn(
            "z-[150] w-[320px] sm:w-[380px] p-3 rounded-3xl outline-none shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-150",
            darkMode
              ? "dark bg-[#1E2A3A] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.6)] text-white"
              : "bg-white border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.12)] text-dark-blue"
          )}
        >
          <div className="space-y-3">
            {/* Search Header */}
            <div className="relative flex items-center border-b border-gray-100 dark:border-white/5 pb-2.5">
              <Search className="absolute left-2.5 size-4 text-gray-navy/40 dark:text-light-blue/40" />
              <input
                type="text"
                placeholder="Tìm kiếm bài học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-xl bg-gray-50/60 dark:bg-white/5 border border-transparent focus:border-primary/40 outline-none text-dark-blue dark:text-white placeholder:text-gray-navy/50 dark:placeholder:text-light-blue/40 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 p-0.5 rounded-lg text-gray-navy/40 hover:text-red transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Modules and Lessons List */}
            <div className="max-h-72 overflow-y-auto space-y-3 custom-scrollbar pr-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-xs text-gray-navy/50 gap-2">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span>Đang tải danh sách bài học...</span>
                </div>
              ) : totalFilteredCount === 0 ? (
                <div className="py-8 text-center text-xs text-gray-navy/50">
                  <Layers className="size-6 mx-auto mb-2 opacity-30" />
                  <p>Không tìm thấy bài học nào phù hợp</p>
                </div>
              ) : (
                groupedModules.map((mod) => (
                  <div key={mod.id} className="space-y-1">
                    {/* Module Title Header */}
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-black uppercase tracking-wider text-gray-navy/70 dark:text-light-blue/60 bg-gray-50/50 dark:bg-white/[0.02] rounded-lg">
                      <FolderOpen className="size-3 text-primary/70 shrink-0" />
                      <span className="truncate">{mod.name}</span>
                      <span className="ml-auto text-[10px] opacity-60 font-semibold lowercase">
                        {mod.lessons.length} bài
                      </span>
                    </div>

                    {/* Lessons under this Module */}
                    <div className="space-y-0.5 pl-1">
                      {mod.lessons.map((lesson) => {
                        const isSelected = lesson.id === value;
                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={() => {
                              onChange(lesson.id);
                              setOpen(false);
                              setSearchQuery("");
                            }}
                            className={cn(
                              "w-full text-left flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all group",
                              isSelected
                                ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light"
                                : "text-gray-navy dark:text-light-blue/90 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-dark-blue dark:hover:text-white"
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0 mr-2">
                              <div
                                className={cn(
                                  "size-4 rounded-md flex items-center justify-center border transition-all shrink-0",
                                  isSelected
                                    ? "bg-primary border-primary text-white"
                                    : "border-gray-200 dark:border-white/10 group-hover:border-primary/40"
                                )}
                              >
                                {isSelected && <Check className="size-3 stroke-[3]" />}
                              </div>
                              <span className="truncate">{lesson.name}</span>
                            </div>

                            {lesson.order != null && (
                              <span className="text-[10px] font-mono opacity-40 shrink-0">
                                #{lesson.order}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
