"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Eye, EyeOff, MessageSquareQuote } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Lesson } from "../../types";
import { EssayQuestionCard } from "./essay-question-card";

interface LessonEssayTabProps {
  lesson: Lesson;
  slug: string;
}

export function LessonEssayTab({ lesson, slug }: LessonEssayTabProps) {
  const questions = useMemo(
    () =>
      [...(lesson.essay_questions || [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      ),
    [lesson.essay_questions]
  );

  // Ephemeral per-session reveal state; 100% hidden by default on mount / lesson change
  const [revealedIds, setRevealedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setRevealedIds(new Set());
  }, [lesson.id]);

  const revealedCount = useMemo(
    () => questions.filter((q) => revealedIds.has(q.id)).length,
    [questions, revealedIds]
  );

  const allRevealed = questions.length > 0 && revealedCount === questions.length;
  const anyRevealed = revealedCount > 0;

  const handleToggleOne = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRevealAll = () => {
    setRevealedIds(new Set(questions.map((q) => q.id)));
  };

  const handleHideAll = () => {
    setRevealedIds(new Set());
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] p-8 md:p-12 text-center rounded-3xl border border-dashed border-gray-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.02]">
        <div className="size-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-5 shadow-sm">
          <MessageSquareQuote className="size-8" />
        </div>
        <h3 className="text-xl font-black text-dark-blue dark:text-white mb-2">
          Chưa có câu hỏi tự luận cho bài học này
        </h3>
        <p className="text-sm font-medium text-gray-500 dark:text-white/60 max-w-md leading-relaxed mb-6">
          Giảng viên chưa thêm câu hỏi tự luận tư duy cho bài học này. Bạn có thể quay lại xem lý thuyết hoặc chuyển sang phần luyện tập.
        </p>
        <Link href={`/lessons/${slug}`}>
          <Button
            variant="outline"
            className="rounded-2xl font-bold flex items-center gap-2"
          >
            <BookOpen className="size-4" />
            Đọc lý thuyết bài học
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Summary Header & Bulk Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 md:p-6 rounded-3xl bg-white dark:bg-navy-blue/60 border border-gray-200/70 dark:border-white/10">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <MessageSquareQuote className="size-5 text-primary shrink-0" />
            <h2 className="text-lg font-black text-dark-blue dark:text-white">
              Câu hỏi tự luận ({questions.length})
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              Đã xem {revealedCount}/{questions.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-light-blue/60 font-medium">
            Đọc kỹ câu hỏi, tự phân tích hướng giải trong đầu rồi nhấn &ldquo;Hiển thị đáp án&rdquo; để đối chiếu.
          </p>
        </div>

        {questions.length >= 2 && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={allRevealed}
              onClick={handleRevealAll}
              className="rounded-xl font-bold text-xs flex items-center gap-1.5"
            >
              <Eye className="size-3.5" />
              Hiện tất cả đáp án
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!anyRevealed}
              onClick={handleHideAll}
              className="rounded-xl font-bold text-xs flex items-center gap-1.5 text-gray-600 dark:text-light-blue/80"
            >
              <EyeOff className="size-3.5" />
              Ẩn tất cả đáp án
            </Button>
          </div>
        )}
      </div>

      {/* Ordered Essay Questions */}
      <div className="space-y-5">
        {questions.map((question, index) => (
          <EssayQuestionCard
            key={question.id}
            question={question}
            index={index}
            isRevealed={revealedIds.has(question.id)}
            onToggleReveal={() => handleToggleOne(question.id)}
          />
        ))}
      </div>
    </div>
  );
}
