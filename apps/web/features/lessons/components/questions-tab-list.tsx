"use client";

import React from "react";
import { BookOpen } from "lucide-react";
import type { QuestionOut } from "@/lib/types";
import { QuestionCard } from "../../questions/components/question-card";

interface QuestionsTabListProps {
  isLoading: boolean;
  questions: QuestionOut[];
  activePoolType: "PRACTICE" | "EXAM" | "GAME";
  isTeacher: boolean;
  onExplain: (q: QuestionOut) => void;
  onEdit?: (q: QuestionOut) => void;
  onDelete?: (q: QuestionOut) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export function QuestionsTabList({
  isLoading,
  questions,
  activePoolType,
  isTeacher,
  onExplain,
  onEdit,
  onDelete,
  searchQuery = "",
  onClearSearch,
}: QuestionsTabListProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-8 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl w-full space-y-6 shadow-sm animate-pulse"
          >
            <div className="flex items-center gap-4">
              <div className="size-12 bg-slate-200 dark:bg-zinc-800 rounded-2xl shrink-0" />
              <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded-full w-24" />
            </div>
            <div className="space-y-3">
              <div className="h-5 bg-slate-200 dark:bg-zinc-800 rounded-full w-3/4" />
              <div className="h-5 bg-slate-200 dark:bg-zinc-800 rounded-full w-1/2" />
            </div>
            <div className="grid grid-cols-1 gap-3 pt-4">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-14 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-800" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    const isSearching = !!searchQuery.trim();

    return (
      <div className="flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-zinc-900 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl shadow-sm animate-in fade-in duration-300">
        <div className="size-16 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-4 border border-slate-100 dark:border-zinc-800">
          <BookOpen className="size-8" />
        </div>
        <h3 className="font-bold text-lg text-slate-700 dark:text-zinc-200">
          {isSearching ? "Không tìm thấy kết quả" : "Chưa có câu hỏi nào"}
        </h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mt-1 px-4">
          {isSearching ? (
            <>
              Không tìm thấy câu hỏi nào phù hợp với từ khóa{" "}
              <span className="font-semibold text-primary">"{searchQuery}"</span>.
            </>
          ) : (
            <>
              {activePoolType === "PRACTICE" && "Bài học này chưa cập nhật câu hỏi ôn tập. Hãy thêm câu hỏi mới hoặc nhập từ file."}
              {activePoolType === "EXAM" && "Bài học này chưa cập nhật câu hỏi kiểm tra. Hãy thêm câu hỏi mới hoặc nhập từ file."}
              {activePoolType === "GAME" && "Bài học này chưa cập nhật câu hỏi trò chơi. Hãy thêm câu hỏi mới hoặc nhập từ file."}
            </>
          )}
        </p>
        {isSearching && onClearSearch && (
          <button
            onClick={onClearSearch}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold text-sm rounded-xl transition-all cursor-pointer"
          >
            Xóa bộ lọc tìm kiếm
          </button>
        )}
      </div>
    );
  }


  return (
    <div className="grid gap-6">
      {questions.map((q, idx) => (
        <QuestionCard
          key={q.id}
          q={q}
          idx={idx}
          onExplain={onExplain}
          onEdit={isTeacher ? onEdit : undefined}
          onDelete={isTeacher ? onDelete : undefined}
        />
      ))}
    </div>
  );
}
