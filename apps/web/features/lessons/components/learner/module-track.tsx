"use client";

import React, { useState, useMemo } from "react";
import { Folder, ChevronRight, BookOpen, Layers, Milestone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StepNode } from "./step-node";
import type { Module, Lesson } from "@/features/lessons/types";

interface Props {
  module: Module;
  lessons: Lesson[];
  index: number;
}

// Predefined gradient themes to color modules dynamically
const DYNAMIC_THEMES = [
  {
    name: "indigo",
    badge: "bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border-indigo-500/20",
    iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 border-indigo-500/25",
    accentBorder: "border-l-indigo-500",
    gradient: "from-indigo-500/5 to-transparent",
    glow: "shadow-indigo-500/5",
  },
  {
    name: "emerald",
    badge: "bg-emerald-500/10 text-emerald-660 dark:text-emerald-400 border-emerald-500/20",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-660 dark:text-emerald-400 border-emerald-500/25",
    accentBorder: "border-l-emerald-500",
    gradient: "from-emerald-500/5 to-transparent",
    glow: "shadow-emerald-500/5",
  },
  {
    name: "rose",
    badge: "bg-rose-500/10 text-rose-650 dark:text-rose-400 border-rose-500/20",
    iconBg: "bg-rose-500/10 dark:bg-rose-500/20 text-rose-650 dark:text-rose-400 border-rose-500/25",
    accentBorder: "border-l-rose-500",
    gradient: "from-rose-500/5 to-transparent",
    glow: "shadow-rose-500/5",
  },
  {
    name: "amber",
    badge: "bg-amber-500/10 text-amber-650 dark:text-amber-400 border-amber-500/20",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/20 text-amber-650 dark:text-amber-400 border-amber-500/25",
    accentBorder: "border-l-amber-500",
    gradient: "from-amber-500/5 to-transparent",
    glow: "shadow-amber-500/5",
  },
  {
    name: "sky",
    badge: "bg-sky-500/10 text-sky-650 dark:text-sky-400 border-sky-500/20",
    iconBg: "bg-sky-500/10 dark:bg-sky-500/20 text-sky-650 dark:text-sky-400 border-sky-500/25",
    accentBorder: "border-l-sky-500",
    gradient: "from-sky-500/5 to-transparent",
    glow: "shadow-sky-500/5",
  },
];

export function ModuleTrack({ module, lessons, index }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const theme = DYNAMIC_THEMES[index % DYNAMIC_THEMES.length];

  // Group lessons by order value
  const lessonsByOrder = useMemo(() => {
    return lessons.reduce((acc, lesson) => {
      const order = lesson.order || 1;
      if (!acc[order]) acc[order] = [];
      acc[order].push(lesson);
      return acc;
    }, {} as Record<number, Lesson[]>);
  }, [lessons]);

  // Sort unique orders ascending
  const sortedOrders = useMemo(() => {
    return Object.keys(lessonsByOrder).map(Number).sort((a, b) => a - b);
  }, [lessonsByOrder]);

  const totalSteps = sortedOrders.length;
  
  // Calculate if there are parallel lessons in this module
  const hasParallelLessons = useMemo(() => {
    return Object.values(lessonsByOrder).some(group => group.length > 1);
  }, [lessonsByOrder]);

  return (
    <div 
      id={`module-${module.id}`}
      className={`w-full bg-white dark:bg-navy-blue border border-slate-200/80 dark:border-white/5 rounded-2xl shadow-lg transition-all duration-300 overflow-hidden border-l-4 ${theme.accentBorder} ${theme.glow}`}
    >
      {/* Module Header Container */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all bg-gradient-to-r ${theme.gradient}`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Chapter Icon */}
          <div className={`size-11 sm:size-12 rounded-xl flex items-center justify-center border shrink-0 ${theme.iconBg}`}>
            <Folder className="size-5 sm:size-5.5" />
          </div>

          <div className="min-w-0 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${theme.badge}`}>
                Chương {module.order || index + 1}
              </span>
              
              {hasParallelLessons && (
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/25 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10">
                  Học song song
                </span>
              )}
            </div>
            
            <h3 className="font-extrabold text-dark-blue dark:text-white text-lg sm:text-xl mt-1.5 truncate group-hover:text-primary transition-colors">
              {module.name}
            </h3>
            

          </div>
        </div>

        {/* Stats & Toggle */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-4 text-xs font-bold text-gray-navy/80 dark:text-light-blue/70">
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-4 text-primary" />
              {lessons.length} bài học
            </span>
            <span className="flex items-center gap-1.5">
              <Milestone className="size-4 text-indigo-500" />
              {totalSteps} bước lộ trình
            </span>
          </div>

          <button className="p-2 text-gray-navy/60 hover:text-gray-navy dark:text-light-blue/60 dark:hover:text-light-blue hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all">
            <ChevronRight className={`size-5 transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`} />
          </button>
        </div>
      </div>

      {/* Module Description (expanded view on desktop) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="border-t border-slate-150/50 dark:border-white/5 p-6 bg-slate-50/20 dark:bg-navy-blue/10">
              {/* Description Block */}
              {module.description && (
                <div className="mb-6 text-left">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-navy/60 dark:text-light-blue/50 mb-1">
                    Mô tả chương trình học
                  </p>
                  <p className="text-xs text-dark-blue dark:text-zinc-300 leading-relaxed font-semibold whitespace-pre-wrap">
                    {module.description}
                  </p>
                </div>
              )}

              {/* Timeline Sequence */}
              {totalSteps === 0 ? (
                <div className="text-center py-10 text-sm text-gray-navy/60 dark:text-light-blue/50 border-2 border-dashed border-slate-250 dark:border-white/5 rounded-xl bg-slate-50/20 dark:bg-navy-blue/5">
                  Chưa có bài học nào được cấu hình trong chương này.
                </div>
              ) : (
                <div className="flex flex-col pt-2 max-w-4xl mx-auto">
                  {sortedOrders.map((order, idx) => (
                    <StepNode 
                      key={`step-${module.id}-${order}`}
                      order={order}
                      moduleId={module.id}
                      lessons={lessonsByOrder[order]}
                      isLast={idx === totalSteps - 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
