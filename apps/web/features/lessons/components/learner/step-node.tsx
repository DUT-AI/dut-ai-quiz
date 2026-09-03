"use client";

import React from "react";
import { GitBranch, Layers, HelpCircle, Compass } from "lucide-react";
import { LessonNodeCard } from "./lesson-node-card";
import type { Lesson } from "@/features/lessons/types";

interface Props {
  order: number;
  lessons: Lesson[];
  isLast: boolean;
  moduleId: string;
}

export function StepNode({ order, lessons, isLast, moduleId }: Props) {
  const isParallel = lessons.length > 1;

  return (
    <div className="flex gap-4 sm:gap-6 md:gap-8 w-full text-left">
      {/* Timeline Column */}
      <div className="flex flex-col items-center shrink-0">
        <div 
          title={isParallel ? "Mốc bài học song song" : undefined}
          className={`size-10 sm:size-12 rounded-2xl flex items-center justify-center border font-black text-sm transition-all duration-300 shadow-md
            ${isParallel 
              ? "bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/30 dark:border-indigo-500/50 text-indigo-650 dark:text-indigo-400"
              : "bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/50 text-primary dark:text-primary-focus"
            }`}
        >
          {isParallel ? (
            <GitBranch className="size-5 sm:size-5.5 animate-pulse" />
          ) : (
            <span className="text-[13px] sm:text-sm font-extrabold">{order}</span>
          )}
        </div>

        {/* Connecting Line to next node */}
        {!isLast && (
          <div className="w-0.5 flex-1 my-3 bg-gradient-to-b from-slate-200 to-slate-200 dark:from-white/10 dark:to-white/10 rounded-full min-h-[50px] relative">
            {/* Animated active/progress line effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/30 to-transparent dark:from-primary/25 rounded-full w-full h-full origin-top" />
          </div>
        )}
      </div>

      {/* Content Column */}
      <div className="flex-1 pb-10 w-full min-w-0">
        {isParallel ? (
          /* Parallel Lessons Group */
          <div className="w-full p-5 sm:p-6 rounded-2xl bg-gray-50/50 dark:bg-black/25 border-2 border-dashed border-gray-200 dark:border-white/10 transition-all duration-300 hover:border-indigo-500/30 dark:hover:border-indigo-500/40">
            {/* Parallel Section Title Row */}
            <div className="flex items-center justify-between gap-4 mb-5 border-b border-gray-200/50 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/25 border border-indigo-500/20 text-indigo-650 dark:text-indigo-400">
                  <Layers className="size-4" />
                </div>
                <div>
                  <span className="text-[11px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest block">
                    Bước {order} • Nhóm song song
                  </span>
                  <span className="text-xs text-gray-navy/80 dark:text-light-blue/70 font-semibold block mt-0.5">
                    Các bài học này có thể học đồng thời, không bắt buộc theo thứ tự.
                  </span>
                </div>
              </div>
              
              <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                {lessons.length} bài song song
              </span>
            </div>

            {/* Grid of lessons inside group */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {lessons.map((lesson, idx) => (
                <LessonNodeCard 
                  key={lesson.id} 
                  lesson={lesson} 
                  index={idx} 
                />
              ))}
            </div>
          </div>
        ) : (
          /* Single Sequential Lesson */
          <div className="max-w-3xl">
            <div className="text-[10px] font-black text-primary/80 dark:text-primary-focus uppercase tracking-widest mb-2.5 pl-1 block">
              Bước {order} • Bài tuần tự
            </div>
            <LessonNodeCard 
              lesson={lessons[0]} 
              index={0} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
