"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useLessons, useModules } from "@/lib/queries";
import { SearchBar } from "@/components/ui/search-bar";
import { 
  Search, 
  Map, 
  Layers, 
  ListOrdered, 
  BookOpen, 
  Folder, 
  HelpCircle,
  Menu,
  Compass
} from "lucide-react";
import { ModuleTrack } from "./module-track";
import { LessonNodeCard } from "./lesson-node-card";

export function LearningPath() {
  const { data: lessons = [], isLoading: isLoadingLessons, error: lessonsError } = useLessons();
  const { data: modules = [], isLoading: isLoadingModules } = useModules();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModuleId, setActiveModuleId] = useState<string>("");

  const isLoading = isLoadingLessons || isLoadingModules;

  // Scrollspy effect using IntersectionObserver to auto-update the active module track on scroll
  useEffect(() => {
    if (searchQuery || isLoading || lessons.length === 0) return;

    const observerOptions = {
      root: null, // use viewport
      rootMargin: "-20% 0px -60% 0px", // focus active element in the upper middle
      threshold: 0,
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const cleanId = entry.target.id.replace("module-", "");
          setActiveModuleId(cleanId);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    // Observe modules
    modules.forEach((mod) => {
      const element = document.getElementById(`module-${mod.id}`);
      if (element) observer.observe(element);
    });

    // Observe unassigned lessons track if it is visible
    const unassignedElement = document.getElementById("module-unassigned-lessons-track");
    if (unassignedElement) observer.observe(unassignedElement);

    return () => {
      observer.disconnect();
    };
  }, [modules, lessons, searchQuery, isLoading]);

  // Filter lessons for search mode
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    return lessons.filter((lesson) =>
      lesson.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [lessons, searchQuery]);

  // Sort modules by order ascending
  const sortedModules = useMemo(() => {
    return [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [modules]);

  // Lessons that do not belong to any module
  const unassignedLessons = useMemo(() => {
    return lessons.filter((l) => !l.module_id);
  }, [lessons]);

  // Statistics calculation for the header dashboard
  const stats = useMemo(() => {
    const totalChapters = modules.length;
    const totalLessons = lessons.length;
    
    // Calculate total parallel steps across all modules
    let parallelGroupsCount = 0;
    let sequentialStepsCount = 0;
    
    modules.forEach((mod) => {
      const modLessons = lessons.filter((l) => l.module_id === mod.id);
      const orders = new Set(modLessons.map((l) => l.order || 1));
      
      orders.forEach((ord) => {
        const orderLessons = modLessons.filter((l) => (l.order || 1) === ord);
        if (orderLessons.length > 1) {
          parallelGroupsCount++;
        } else {
          sequentialStepsCount++;
        }
      });
    });

    return {
      totalChapters,
      totalLessons,
      parallelGroups: parallelGroupsCount,
      sequentialSteps: sequentialStepsCount + unassignedLessons.length,
    };
  }, [modules, lessons, unassignedLessons]);

  // Handle scrolling to a specific module (quick jump)
  const scrollToModule = (id: string) => {
    const element = document.getElementById(`module-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="w-full space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-2">
        <div className="text-left space-y-2">
          <h1 className="text-4xl md:text-5xl font-black text-dark-blue dark:text-white tracking-tight">
            Lộ trình <span className="text-primary">Học tập</span>
          </h1>
          <p className="text-gray-navy dark:text-light-blue font-semibold text-sm max-w-xl">
            Hệ thống bài học được sắp xếp khoa học theo sơ đồ phát triển năng lực, giúp bạn chinh phục kiến thức từ cơ bản đến nâng cao.
          </p>
        </div>
        <div className="w-full lg:w-96 shrink-0">
          <SearchBar
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery("")}
            placeholder="Tìm kiếm bài học hoặc chủ đề..."
          />
        </div>
      </div>

      {/* Top Level Metric Dashboard */}
      {!searchQuery && !isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {/* Chapters Metric */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/5 shadow-md flex items-center justify-between text-left transition-all hover:scale-[1.01]">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-navy/70 dark:text-light-blue/60">Chương học</span>
              <p className="text-xl sm:text-2xl font-black text-dark-blue dark:text-white">{stats.totalChapters} Chương</p>
            </div>
            <div className="size-10 sm:size-11 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Folder className="size-5" />
            </div>
          </div>

          {/* Lessons Metric */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/5 shadow-md flex items-center justify-between text-left transition-all hover:scale-[1.01]">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-navy/70 dark:text-light-blue/60">Tổng bài học</span>
              <p className="text-xl sm:text-2xl font-black text-dark-blue dark:text-white">{stats.totalLessons} Bài</p>
            </div>
            <div className="size-10 sm:size-11 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <BookOpen className="size-5" />
            </div>
          </div>

          {/* Sequential Steps Metric */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/5 shadow-md flex items-center justify-between text-left transition-all hover:scale-[1.01]">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-navy/70 dark:text-light-blue/60">Bước tuần tự</span>
              <p className="text-xl sm:text-2xl font-black text-dark-blue dark:text-white">{stats.sequentialSteps} Bước</p>
            </div>
            <div className="size-10 sm:size-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <ListOrdered className="size-5" />
            </div>
          </div>

          {/* Parallel Tracks Metric */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/5 shadow-md flex items-center justify-between text-left transition-all hover:scale-[1.01]">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-navy/70 dark:text-light-blue/60">Nhóm song song</span>
              <p className="text-xl sm:text-2xl font-black text-dark-blue dark:text-white">{stats.parallelGroups} Nhóm</p>
            </div>
            <div className="size-10 sm:size-11 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Layers className="size-5" />
            </div>
          </div>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="w-full">
        {isLoading ? (
          /* Loading State */
          <div className="flex flex-col items-center justify-center py-28 opacity-40">
            <div className="size-12 border-4 border-primary border-t-transparent animate-spin rounded-full mb-4" />
            <p className="font-extrabold text-sm text-gray-navy dark:text-light-blue">Đang thiết lập sơ đồ lộ trình...</p>
          </div>
        ) : lessonsError ? (
          /* Error State */
          <div className="text-center py-16 bg-rose-50/50 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-950/30 rounded-2xl p-8 max-w-2xl mx-auto">
            <HelpCircle className="size-10 text-rose-500 mx-auto mb-3" />
            <p className="font-bold text-slate-800 dark:text-zinc-150">Đã xảy ra lỗi khi tải lộ trình học</p>
            <p className="text-xs text-rose-500 dark:text-rose-400 mt-1 opacity-90">Vui lòng thử lại sau.</p>
          </div>
        ) : searchQuery ? (
          /* Search Results Page */
          <div className="space-y-4">
            <div className="flex items-center justify-between pl-1">
              <p className="text-sm font-extrabold text-gray-navy dark:text-light-blue">
                Tìm thấy {searchResults.length} bài học phù hợp với từ khoá &quot;{searchQuery}&quot;
              </p>
              <button 
                onClick={() => setSearchQuery("")}
                className="text-xs font-black text-primary hover:underline"
              >
                Trở lại lộ trình
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="text-center py-20 bg-slate-50/40 dark:bg-navy-blue/15 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl">
                <Search className="size-10 text-gray-navy/40 mx-auto mb-3" />
                <h4 className="font-bold text-dark-blue dark:text-white">Không tìm thấy bài học phù hợp</h4>
                <p className="text-xs text-gray-navy/60 dark:text-light-blue/50 mt-1">Vui lòng kiểm tra lại từ khóa tìm kiếm.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {searchResults.map((lesson, index) => {
                  const belongingModule = modules.find((m) => m.id === lesson.module_id);
                  return (
                    <div key={lesson.id} className="flex flex-col gap-2.5">
                      <LessonNodeCard lesson={lesson} index={index} />
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-navy/60 dark:text-light-blue/40 px-4">
                        Thuộc chương: {belongingModule?.name || "Bài học bổ sung"}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Structured Roadmap View */
          <div className="flex flex-col lg:flex-row gap-8 relative items-start">
            
            {/* Quick Navigation Sidebar - Desktop Only */}
            {sortedModules.length > 1 && (
              <aside className="hidden xl:block w-64 shrink-0 sticky top-24 bg-white/60 dark:bg-navy-blue/35 border border-slate-200/60 dark:border-white/5 backdrop-blur-md rounded-2xl p-5 text-left max-h-[calc(100vh-10rem)] overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary/95 mb-4 pl-1">
                  <Map className="size-4" />
                  Mục lục các module
                </div>
                
                <nav className="flex flex-col gap-2">
                  {sortedModules.map((mod, idx) => {
                    const isActive = activeModuleId === mod.id;
                    return (
                      <button
                        key={`nav-${mod.id}`}
                        onClick={() => scrollToModule(mod.id)}
                        className={`group w-full text-left p-3 rounded-xl text-xs font-bold transition-all flex gap-3 min-w-0 border ${
                          isActive
                            ? "bg-primary/10 border-primary/40 text-primary scale-[1.02] shadow-sm"
                            : "border-transparent text-dark-blue dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/5 hover:border-slate-200/50 dark:hover:border-white/10"
                        }`}
                      >
                        <span className={`size-6 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? "bg-primary text-white dark:text-navy-blue"
                            : "bg-slate-100 dark:bg-white/10 text-gray-navy/80 dark:text-light-blue group-hover:bg-primary group-hover:text-white dark:group-hover:text-navy-blue"
                        }`}>
                          {idx + 1}
                        </span>
                        <span className={`truncate pr-1 mt-0.5 transition-colors ${
                          isActive ? "text-primary font-black" : "text-dark-blue dark:text-zinc-200 group-hover:text-primary"
                        }`}>
                          {mod.name}
                        </span>
                      </button>
                    );
                  })}
                  
                  {unassignedLessons.length > 0 && (() => {
                    const isActive = activeModuleId === "unassigned-lessons-track";
                    return (
                      <button
                        onClick={() => scrollToModule("unassigned-lessons-track")}
                        className={`group w-full text-left p-3 rounded-xl text-xs font-bold transition-all flex gap-3 border ${
                          isActive
                            ? "bg-primary/10 border-primary/40 text-primary scale-[1.02] shadow-sm"
                            : "border-transparent text-gray-navy dark:text-light-blue/70 hover:bg-slate-100 dark:hover:bg-white/5 hover:border-slate-200/50 dark:hover:border-white/10"
                        }`}
                      >
                        <span className={`size-6 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? "bg-primary text-white dark:text-navy-blue"
                            : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white dark:group-hover:text-navy-blue"
                        }`}>
                          *
                        </span>
                        <span className={`truncate mt-0.5 transition-colors ${
                          isActive ? "text-primary font-black" : "group-hover:text-primary"
                        }`}>
                          Bài học bổ sung
                        </span>
                      </button>
                    );
                  })()}
                </nav>
              </aside>
            )}

            {/* Modules List Roadmap Flow */}
            <div className="flex-1 w-full space-y-10">
              {sortedModules.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-navy-blue/45 border border-slate-200/80 dark:border-white/5 rounded-2xl">
                  <Compass className="size-12 text-primary/40 mx-auto mb-3 animate-bounce" />
                  <h3 className="text-lg font-extrabold text-dark-blue dark:text-white">Lộ trình học đang được xây dựng</h3>
                  <p className="text-sm text-gray-navy/70 dark:text-light-blue/60 mt-1 max-w-sm mx-auto">
                    Giảng viên chưa thiết lập chương học nào. Vui lòng quay lại sau!
                  </p>
                </div>
              ) : (
                sortedModules.map((module, index) => {
                  const moduleLessons = lessons.filter((l) => l.module_id === module.id);
                  return (
                    <ModuleTrack
                      key={module.id}
                      module={module}
                      lessons={moduleLessons}
                      index={index}
                    />
                  );
                })
              )}

              {/* Unassigned / Additional Lessons Section */}
              {unassignedLessons.length > 0 && (
                <div 
                  id="module-unassigned-lessons-track"
                  className="w-full bg-white dark:bg-navy-blue border border-slate-200/80 dark:border-white/5 rounded-2xl p-6 sm:p-8 shadow-lg border-l-4 border-l-slate-400 text-left"
                >
                  <div className="flex items-center gap-3.5 mb-6">
                    <div className="size-11 sm:size-12 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-655 dark:text-zinc-400 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                      <Compass className="size-5.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-gray-navy/80 dark:text-light-blue/70 border border-slate-200/50 dark:border-white/5">
                        Bổ sung
                      </span>
                      <h3 className="font-extrabold text-dark-blue dark:text-white text-lg sm:text-xl mt-1.5">
                        Bài học bổ sung
                      </h3>
                      <p className="text-xs text-gray-navy/70 dark:text-light-blue/50 font-medium mt-1">
                        Những tài nguyên kiến thức ngoài lề hữu ích, có thể tham khảo độc lập.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {unassignedLessons.map((lesson, idx) => (
                      <LessonNodeCard 
                        key={lesson.id}
                        lesson={lesson}
                        index={idx}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
