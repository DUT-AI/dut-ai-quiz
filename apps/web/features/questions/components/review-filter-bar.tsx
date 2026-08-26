"use client";

import React from "react";
import { Filter, BookOpen, Gauge, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewFilterBarProps {
  lessonId: string;
  setLessonId: (val: string) => void;
  difficulty: string;
  setDifficulty: (val: string) => void;
  poolType: string;
  setPoolType: (val: string) => void;
  relatedQuestionsOnly: boolean;
  setRelatedQuestionsOnly: (val: boolean) => void;
  lessons: any[];
  onReset: () => void;
}

export function ReviewFilterBar({
  lessonId,
  setLessonId,
  difficulty,
  setDifficulty,
  poolType,
  setPoolType,
  relatedQuestionsOnly,
  setRelatedQuestionsOnly,
  lessons,
  onReset,
}: ReviewFilterBarProps) {
  return (
    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 p-6 rounded-3xl shadow-md transition-colors duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 items-end">
        {/* Lesson */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="size-3.5 text-slate-400" />
            Bài học
          </label>
          <select
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800/50 px-4 py-3 text-sm outline-none text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200 cursor-pointer"
          >
            <option value="">— Tất cả bài học —</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.order > 0 ? `${l.order}. ` : ""}{l.name}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="size-3.5 text-slate-400" />
            Độ khó
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800/50 px-4 py-3 text-sm outline-none text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200 cursor-pointer"
          >
            <option value="">— Tất cả độ khó —</option>
            <option value="EASY">Dễ</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HARD">Khó</option>
          </select>
        </div>

        {/* Pool Type */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="size-3.5 text-slate-400" />
            Dạng câu hỏi
          </label>
          <select
            value={poolType}
            onChange={(e) => setPoolType(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800/50 px-4 py-3 text-sm outline-none text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200 cursor-pointer"
          >
            <option value="">— Tất cả dạng —</option>
            <option value="PRACTICE">Luyện tập</option>
            <option value="EXAM">Thi cử/Kiểm tra</option>
            <option value="GAME">Giải đấu</option>
          </select>
        </div>

        {/* Duplicate Risk */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="size-3.5 text-slate-400" />
            Trùng lặp
          </label>
          <select
            value={relatedQuestionsOnly ? "true" : "false"}
            onChange={(e) => setRelatedQuestionsOnly(e.target.value === "true")}
            className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800/50 px-4 py-3 text-sm outline-none text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200 cursor-pointer"
          >
            <option value="false">— Tất cả —</option>
            <option value="true">Có nguy cơ trùng lặp</option>
          </select>
        </div>

        {/* Reset button */}
        <Button
          onClick={onReset}
          variant="outline"
          className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-primary dark:hover:text-primary font-bold text-sm transition-colors duration-200 shadow-sm"
        >
          <Filter className="size-4" /> Reset bộ lọc
        </Button>
      </div>
    </div>
  );
}
