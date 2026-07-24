"use client";

import React, { useMemo } from "react";
import { Table, CheckCircle2, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestionOut } from "@/features/questions/types";

interface LessonItem {
  id: string;
  name: string;
}

interface QuestionStatsMatrixProps {
  allQuestions: QuestionOut[];
  selectedQuestions: QuestionOut[];
  lessons: LessonItem[];
  activeLessonId: string;
  onSelectLesson: (id: string) => void;
  viewMode: "selected" | "bank";
  onViewModeChange: (mode: "selected" | "bank") => void;
}

export default function QuestionStatsMatrix({
  allQuestions,
  selectedQuestions,
  lessons,
  activeLessonId,
  onSelectLesson,
  viewMode,
  onViewModeChange,
}: QuestionStatsMatrixProps) {
  // Select dataset based on current view mode
  const currentQuestions = viewMode === "selected" ? selectedQuestions : allQuestions;

  // Build matrix stats
  const stats = useMemo(() => {
    // Collect lesson map
    const lessonMap: Record<string, { EASY: number; MEDIUM: number; HARD: number; TOTAL: number }> = {};

    // Initialize map for known lessons
    lessons.forEach((l) => {
      lessonMap[l.id] = { EASY: 0, MEDIUM: 0, HARD: 0, TOTAL: 0 };
    });

    // Unassigned lesson bucket
    let unassigned = { EASY: 0, MEDIUM: 0, HARD: 0, TOTAL: 0 };
    let hasUnassigned = false;

    // Totals across all lessons
    const overall = { EASY: 0, MEDIUM: 0, HARD: 0, TOTAL: 0 };

    currentQuestions.forEach((q) => {
      const diffKey = (q.difficulty?.toUpperCase() || "MEDIUM") as "EASY" | "MEDIUM" | "HARD";
      const validDiff = ["EASY", "MEDIUM", "HARD"].includes(diffKey) ? diffKey : "MEDIUM";

      if (q.lesson_id && lessonMap[q.lesson_id]) {
        lessonMap[q.lesson_id][validDiff]++;
        lessonMap[q.lesson_id].TOTAL++;
      } else {
        hasUnassigned = true;
        unassigned[validDiff]++;
        unassigned.TOTAL++;
      }

      overall[validDiff]++;
      overall.TOTAL++;
    });

    return { lessonMap, unassigned, hasUnassigned, overall };
  }, [currentQuestions, lessons]);

  // Only filter lessons that have at least 1 question (> 0)
  const activeLessons = useMemo(() => {
    return lessons.filter((l) => (stats.lessonMap[l.id]?.TOTAL || 0) > 0);
  }, [lessons, stats.lessonMap]);

  return (
    <div className="bg-white dark:bg-navy-blue/80 border border-gray-100 dark:border-white/10 rounded-[2rem] p-5 shadow-sm space-y-4">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Table className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-dark-blue dark:text-white uppercase tracking-wider">
              Ma trận Cấu trúc Đề thi & Ngân hàng
            </h3>
            <p className="text-xs text-gray-navy opacity-60">
              Thống kê bài học có câu hỏi ({activeLessons.length}/{lessons.length} bài)
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center p-1 rounded-2xl bg-gray-100 dark:bg-white/5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onViewModeChange("selected")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
              viewMode === "selected"
                ? "bg-white dark:bg-navy-blue text-primary shadow-sm"
                : "text-gray-navy opacity-60 hover:opacity-100"
            )}
          >
            <CheckCircle2 className="size-3.5" />
            <span>Đã chọn trong đề ({selectedQuestions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("bank")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
              viewMode === "bank"
                ? "bg-white dark:bg-navy-blue text-primary shadow-sm"
                : "text-gray-navy opacity-60 hover:opacity-100"
            )}
          >
            <Library className="size-3.5" />
            <span>Tất cả ngân hàng ({allQuestions.length})</span>
          </button>
        </div>
      </div>

      {/* Transposed Matrix Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/5 text-gray-navy font-black uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4 min-w-[180px]">Tên Bài học</th>
              <th className="py-3 px-3 text-center text-emerald-600 dark:text-emerald-400 min-w-[80px]">
                Dễ
              </th>
              <th className="py-3 px-3 text-center text-amber-600 dark:text-amber-400 min-w-[90px]">
                Trung bình
              </th>
              <th className="py-3 px-3 text-center text-rose-600 dark:text-rose-400 min-w-[80px]">
                Khó
              </th>
              <th className="py-3 px-4 text-center bg-gray-50/70 dark:bg-white/5 font-black text-dark-blue dark:text-white min-w-[90px]">
                Tổng cộng
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium">
            {/* ROW: Tất cả bài */}
            <tr
              onClick={() => onSelectLesson("")}
              className={cn(
                "cursor-pointer hover:bg-primary/5 transition-colors",
                activeLessonId === "" && "bg-primary/10 font-bold"
              )}
            >
              <td className="py-2.5 px-4 font-bold text-primary flex items-center gap-2">
                <span className="size-2 rounded-full bg-primary" />
                Tất cả bài học
              </td>
              <td className="py-2.5 px-3 text-center font-bold text-emerald-600">
                {stats.overall.EASY}
              </td>
              <td className="py-2.5 px-3 text-center font-bold text-amber-600">
                {stats.overall.MEDIUM}
              </td>
              <td className="py-2.5 px-3 text-center font-bold text-rose-600">
                {stats.overall.HARD}
              </td>
              <td className="py-2.5 px-4 text-center bg-gray-50/70 dark:bg-white/5 font-black text-primary">
                {stats.overall.TOTAL}
              </td>
            </tr>

            {/* ROWS: Only active lessons with TOTAL > 0 */}
            {activeLessons.map((lesson) => {
              const lStat = stats.lessonMap[lesson.id] || { EASY: 0, MEDIUM: 0, HARD: 0, TOTAL: 0 };
              const isSelected = activeLessonId === lesson.id;

              return (
                <tr
                  key={lesson.id}
                  onClick={() => onSelectLesson(lesson.id)}
                  className={cn(
                    "cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors",
                    isSelected && "bg-indigo-50/80 dark:bg-indigo-500/10 font-bold"
                  )}
                >
                  <td className="py-2.5 px-4 font-semibold text-dark-blue dark:text-white truncate max-w-[220px]" title={lesson.name}>
                    {lesson.name}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-lg",
                        lStat.EASY > 0
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 font-bold"
                          : "opacity-30"
                      )}
                    >
                      {lStat.EASY}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-lg",
                        lStat.MEDIUM > 0
                          ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 font-bold"
                          : "opacity-30"
                      )}
                    >
                      {lStat.MEDIUM}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-lg",
                        lStat.HARD > 0
                          ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 font-bold"
                          : "opacity-30"
                      )}
                    >
                      {lStat.HARD}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center bg-gray-50/70 dark:bg-white/5 font-bold text-dark-blue dark:text-white">
                    {lStat.TOTAL}
                  </td>
                </tr>
              );
            })}

            {/* UNASSIGNED LESSON ROW (only if has unassigned questions > 0) */}
            {stats.hasUnassigned && stats.unassigned.TOTAL > 0 && (
              <tr
                className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-gray-400"
              >
                <td className="py-2.5 px-4 font-semibold italic">
                  Chưa phân bài
                </td>
                <td className="py-2.5 px-3 text-center opacity-60">
                  {stats.unassigned.EASY}
                </td>
                <td className="py-2.5 px-3 text-center opacity-60">
                  {stats.unassigned.MEDIUM}
                </td>
                <td className="py-2.5 px-3 text-center opacity-60">
                  {stats.unassigned.HARD}
                </td>
                <td className="py-2.5 px-4 text-center bg-gray-50/70 dark:bg-white/5 font-bold opacity-60">
                  {stats.unassigned.TOTAL}
                </td>
              </tr>
            )}

            {/* TOTAL FOOTER ROW */}
            <tr className="bg-gray-50/80 dark:bg-white/5 font-black text-dark-blue dark:text-white">
              <td className="py-3 px-4 uppercase tracking-wider text-[10px]">
                Tổng cộng toàn bộ
              </td>
              <td className="py-3 px-3 text-center text-emerald-600 dark:text-emerald-400 text-sm font-black">
                {stats.overall.EASY}
              </td>
              <td className="py-3 px-3 text-center text-amber-600 dark:text-amber-400 text-sm font-black">
                {stats.overall.MEDIUM}
              </td>
              <td className="py-3 px-3 text-center text-rose-600 dark:text-rose-400 text-sm font-black">
                {stats.overall.HARD}
              </td>
              <td className="py-3 px-4 text-center bg-primary text-white text-sm font-black rounded-br-2xl">
                {stats.overall.TOTAL}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
