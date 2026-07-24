"use client";

import React, { useState, useMemo } from "react";
import { useLessons, useQuestions } from "@/lib/queries";
import {
  Search,
  Filter,
  Plus,
  Minus,
  GripVertical,
  BookOpen,
  Sparkles,
  ChevronDown,
  X,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/markdown";
import QuestionStatsMatrix from "./QuestionStatsMatrix";
import { QuestionCard } from "@/features/questions/components/question-card";
import type { QuestionOut } from "@/features/questions/types";

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

const POOL_TYPES = [
  { id: "", label: "Tất cả" },
  { id: "EXAM", label: "Kiểm tra" },
  { id: "PRACTICE", label: "Luyện tập" },
  { id: "GAME", label: "Trò chơi" },
];

export default function StepQuestions({ selectedIds, onChange }: Props) {
  const { data: lessons = [] } = useLessons();

  const [activeLessonId, setActiveLessonId] = useState<string>("");
  const [activePoolType, setActivePoolType] = useState<string>("");
  const [search, setSearch] = useState("");
  const [matrixViewMode, setMatrixViewMode] = useState<"selected" | "bank">("selected");
  const [previewQuestion, setPreviewQuestion] = useState<QuestionOut | null>(null);

  // Fetch questions based on active pool_type
  const { data: allQuestions = [], isLoading: loadingQuestions } = useQuestions({
    pool_type: activePoolType || undefined,
    limit: 1000,
  });

  // Filter available questions (not selected + match lesson + match search)
  const availableQuestions = useMemo(() => {
    return allQuestions.filter(
      (q) =>
        (!activeLessonId || q.lesson_id === activeLessonId) &&
        !selectedIds.includes(q.id) &&
        q.content.toLowerCase().includes(search.toLowerCase())
    );
  }, [allQuestions, activeLessonId, selectedIds, search]);

  // Selected question objects
  const selectedQuestions = useMemo(() => {
    return selectedIds
      .map((id) => allQuestions.find((q) => q.id === id))
      .filter(Boolean) as QuestionOut[];
  }, [allQuestions, selectedIds]);

  const addQuestion = (id: string) => onChange([...selectedIds, id]);
  const removeQuestion = (id: string) => onChange(selectedIds.filter((i) => i !== id));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Question Statistics Matrix */}
      <QuestionStatsMatrix
        allQuestions={allQuestions}
        selectedQuestions={selectedQuestions}
        lessons={lessons}
        activeLessonId={activeLessonId}
        onSelectLesson={setActiveLessonId}
        viewMode={matrixViewMode}
        onViewModeChange={setMatrixViewMode}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Question Bank */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-navy opacity-40" />
              <input
                type="text"
                placeholder="Tìm nội dung câu hỏi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-6 py-3.5 rounded-3xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm"
              />
            </div>

            {/* Lesson Select Dropdown */}
            <div className="relative min-w-[200px]">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-navy opacity-40">
                <BookOpen className="size-4" />
              </div>
              <select
                value={activeLessonId}
                onChange={(e) => setActiveLessonId(e.target.value)}
                className="w-full pl-11 pr-10 py-3.5 rounded-3xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-xs text-dark-blue dark:text-white cursor-pointer appearance-none"
              >
                <option value="" className="bg-white dark:bg-navy-blue text-dark-blue dark:text-white">
                  Tất cả bài học ({lessons.length} bài)
                </option>
                {lessons.map((lesson) => (
                  <option
                    key={lesson.id}
                    value={lesson.id}
                    className="bg-white dark:bg-navy-blue text-dark-blue dark:text-white"
                  >
                    {lesson.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-navy opacity-40">
                <ChevronDown className="size-4" />
              </div>
            </div>

            {/* 3 PoolTypes + ALL Filters */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-gray-50 dark:bg-white/5">
              {POOL_TYPES.map((pt) => (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => setActivePoolType(pt.id)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    activePoolType === pt.id
                      ? "bg-white dark:bg-navy-blue shadow-sm text-primary"
                      : "text-gray-navy opacity-50 hover:opacity-100"
                  )}
                >
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Questions Scrollable List */}
          <div className="h-[450px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {loadingQuestions ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-3xl bg-gray-50 dark:bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : availableQuestions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-20">
                <Filter className="size-12 mb-4" />
                <p className="font-bold">Không có câu hỏi nào phù hợp bộ lọc</p>
              </div>
            ) : (
              availableQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  onClick={() => setPreviewQuestion(q)}
                  className="group flex gap-4 p-5 rounded-[2rem] bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 hover:border-primary/30 transition-all hover:translate-x-1 cursor-pointer"
                >
                  <div className="size-10 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-navy font-bold text-xs shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Markdown
                      content={q.content.substring(0, 150) + (q.content.length > 150 ? "..." : "")}
                      className="text-sm font-medium leading-relaxed line-clamp-2 break-words"
                    />
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {/* Difficulty Badge */}
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider",
                          q.difficulty === "EASY"
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600"
                            : q.difficulty === "HARD"
                            ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600"
                            : "bg-amber-50 dark:bg-amber-500/10 text-amber-600"
                        )}
                      >
                        {q.difficulty === "EASY"
                          ? "Dễ"
                          : q.difficulty === "HARD"
                          ? "Khó"
                          : "Trung bình"}
                      </span>

                      {/* Pool Type Badge */}
                      {q.pool_type && (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider",
                            q.pool_type === "EXAM"
                              ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500"
                              : q.pool_type === "GAME"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-blue-50 dark:bg-blue-500/10 text-blue-500"
                          )}
                        >
                          {q.pool_type === "EXAM"
                            ? "Kiểm tra"
                            : q.pool_type === "GAME"
                            ? "Trò chơi"
                            : "Luyện tập"}
                        </span>
                      )}

                      {/* Tags */}
                      {q.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 text-[9px] font-bold text-gray-navy opacity-60"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addQuestion(q.id);
                    }}
                    className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shrink-0"
                    title="Thêm vào đề thi"
                  >
                    <Plus className="size-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Selected Questions & Ordering */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          <div className="p-6 rounded-[2.5rem] bg-primary text-white shadow-xl shadow-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black uppercase tracking-[0.2em] text-[10px] opacity-80">
                Đề thi hiện tại
              </h3>
              <Sparkles className="size-4 opacity-60" />
            </div>
            <p className="text-4xl font-black mb-1">{selectedIds.length}</p>
            <p className="text-xs font-bold opacity-60">Câu hỏi đã được chọn</p>
          </div>

          <div className="flex-1 bg-gray-50 dark:bg-white/5 rounded-[2.5rem] p-4 flex flex-col h-[400px]">
            <div className="flex items-center justify-between px-2 mb-4">
              <span className="text-[10px] font-black text-gray-navy opacity-40 uppercase tracking-widest italic">
                Sắp xếp đề
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[10px] font-bold text-red hover:underline"
              >
                Xóa hết
              </button>
            </div>

            <Reorder.Group
              axis="y"
              values={selectedIds}
              onReorder={onChange}
              className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar"
            >
              {selectedQuestions.map((q) => (
                <Reorder.Item
                  key={q.id}
                  value={q.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-navy-blue shadow-sm border border-black/5 cursor-grab active:cursor-grabbing group"
                >
                  <GripVertical className="size-4 text-gray-navy opacity-20 group-hover:opacity-100 transition-opacity" />
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setPreviewQuestion(q)}
                  >
                    <p className="text-[11px] font-bold truncate hover:text-primary transition-colors">
                      {q.content}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] font-bold opacity-50">
                        {q.difficulty === "EASY"
                          ? "Dễ"
                          : q.difficulty === "HARD"
                          ? "Khó"
                          : "Trung bình"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeQuestion(q.id);
                    }}
                    className="size-6 rounded-lg hover:bg-red/10 text-red opacity-30 hover:opacity-100 transition-all flex items-center justify-center shrink-0"
                    title="Bỏ khỏi đề thi"
                  >
                    <Minus className="size-3" />
                  </button>
                </Reorder.Item>
              ))}
              {selectedIds.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-10 text-center">
                  <BookOpen className="size-10 mb-2" />
                  <p className="text-[10px] font-black uppercase">Chưa có câu hỏi nào</p>
                </div>
              )}
            </Reorder.Group>
          </div>
        </div>
      </div>

      {/* Question Card Preview Modal - Full Width with Light Side Margins */}
      <AnimatePresence>
        {previewQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewQuestion(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Container: Full Width with Light Margins */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="relative w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-3rem)] max-w-[1400px] max-h-[92vh] overflow-y-auto custom-scrollbar bg-white dark:bg-navy-blue rounded-[2.5rem] shadow-2xl p-6 sm:p-8 md:p-10 space-y-6 z-10 border border-white/10"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Eye className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-dark-blue dark:text-white uppercase tracking-wider">
                      Xem chi tiết câu hỏi
                    </h3>
                    <p className="text-xs text-gray-navy opacity-60">
                      Xem cấu trúc đáp án & hướng dẫn giải chi tiết
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewQuestion(null)}
                  className="size-11 rounded-2xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-all flex items-center justify-center text-gray-navy dark:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* QuestionCard preview */}
              <QuestionCard
                q={previewQuestion}
                idx={0}
                onExplain={() => {}}
              />

              {/* Footer action */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setPreviewQuestion(null)}
                  className="px-6 py-3 rounded-2xl font-bold text-xs text-gray-navy hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                >
                  Đóng
                </button>

                {selectedIds.includes(previewQuestion.id) ? (
                  <button
                    type="button"
                    onClick={() => {
                      removeQuestion(previewQuestion.id);
                      setPreviewQuestion(null);
                    }}
                    className="px-6 py-3 rounded-2xl bg-red/10 text-red hover:bg-red hover:text-white font-bold text-xs transition-all flex items-center gap-2"
                  >
                    <Minus className="size-4" />
                    Bỏ khỏi đề thi
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      addQuestion(previewQuestion.id);
                      setPreviewQuestion(null);
                    }}
                    className="px-6 py-3 rounded-2xl bg-primary text-white hover:bg-primary/90 font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-primary/30"
                  >
                    <Plus className="size-4" />
                    Thêm vào đề thi
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
