"use client";

import React, { useMemo, useState } from "react";
import { MessageSquareQuote, Sparkles } from "lucide-react";
import { Markdown } from "@/components/markdown";
import type { LessonEssayQuestionCreate, Module } from "../../types";
import type { LessonEditorStep } from "./lesson-editor-stepper";
import type { EssayDraftPreview } from "../essay/lesson-essay-form-section";
import {
  EssayQuestionCard,
  type EssayQuestionItem,
} from "../essay/essay-question-card";

interface LessonPreviewPanelProps {
  name: string;
  description?: string;
  content: string;
  selectedModule?: Module;
  viewMode: "split" | "editor" | "preview";
  editorWidth: number;
  isDesktop: boolean;
  currentStep?: LessonEditorStep;
  essayQuestions?: LessonEssayQuestionCreate[];
  essayDraft?: EssayDraftPreview | null;
}

export function LessonPreviewPanel({
  name,
  description,
  content,
  selectedModule,
  viewMode,
  editorWidth,
  isDesktop,
  currentStep = 3,
  essayQuestions = [],
  essayDraft = null,
}: LessonPreviewPanelProps) {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(() => new Set());

  const previewEssayItems = useMemo<EssayQuestionItem[]>(() => {
    const base: EssayQuestionItem[] = essayQuestions.map((item, idx) => ({
      id: item.id || `preview-essay-${idx}`,
      question_md: item.question_md,
      answer_md: item.answer_md,
      order: idx,
    }));

    if (!essayDraft) return base;

    const hasDraftContent =
      essayDraft.question_md.trim().length > 0 ||
      essayDraft.answer_md.trim().length > 0;

    if (!hasDraftContent) return base;

    if (
      essayDraft.editingIndex !== null &&
      essayDraft.editingIndex >= 0 &&
      essayDraft.editingIndex < base.length
    ) {
      base[essayDraft.editingIndex] = {
        ...base[essayDraft.editingIndex],
        question_md: essayDraft.question_md || "_(Đang soạn câu hỏi...)_",
        answer_md: essayDraft.answer_md || "_(Đang soạn đáp án...)_",
      };
      return base;
    }

    return [
      ...base,
      {
        id: "preview-essay-draft",
        question_md: essayDraft.question_md || "_(Đang soạn câu hỏi...)_",
        answer_md: essayDraft.answer_md || "_(Đang soạn đáp án...)_",
        order: base.length,
      },
    ];
  }, [essayQuestions, essayDraft]);

  const toggleReveal = (id: string) => {
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

  if (viewMode !== "split" && viewMode !== "preview") {
    return null;
  }

  return (
    <div
      className={`overflow-y-auto p-6 md:p-10 custom-scrollbar bg-gray-50/40 dark:bg-navy-blue/20 ${
        viewMode === "preview"
          ? "flex-1 w-full max-w-4xl px-6 md:px-12 mx-auto"
          : "border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-white/10"
      }`}
      style={
        viewMode === "split" && isDesktop
          ? { width: `${100 - editorWidth}%`, flex: "none" }
          : undefined
      }
    >
      {currentStep === 4 ? (
        <div className="space-y-6 text-left">
          <div className="flex items-center justify-between border-b border-gray-200/50 dark:border-white/10 pb-4">
            <label className="text-xs font-black text-gray-navy opacity-60 uppercase tracking-[0.2em] flex items-center gap-2">
              <MessageSquareQuote className="size-4 text-primary" /> Xem trước Câu hỏi tự luận
            </label>
            <span className="px-3 py-1 rounded-xl bg-primary/10 text-primary font-bold text-xs">
              {previewEssayItems.length} câu hỏi
            </span>
          </div>

          {previewEssayItems.length === 0 ? (
            <div className="rounded-3xl bg-white dark:bg-navy-blue p-10 text-center border border-dashed border-gray-200 dark:border-white/10">
              <p className="text-sm font-medium text-gray-navy/50 dark:text-light-blue/40 italic">
                Chưa có câu hỏi tự luận nào để xem trước. Hãy bắt đầu soạn ở cột bên trái.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {previewEssayItems.map((item, idx) => (
                <EssayQuestionCard
                  key={item.id}
                  question={item}
                  index={idx}
                  isRevealed={revealedIds.has(item.id)}
                  onToggleReveal={() => toggleReveal(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200/50 dark:border-white/10 pb-4">
            <label className="text-xs font-black text-gray-navy opacity-50 uppercase tracking-[0.2em] flex items-center gap-2">
              <Sparkles className="size-4 text-primary animate-pulse" /> Xem trước bài học
            </label>
            {selectedModule && (
              <span className="px-3 py-1 rounded-xl bg-primary/10 text-primary font-bold text-xs">
                Chương {selectedModule.order}: {selectedModule.name}
              </span>
            )}
          </div>

          {/* Main Content Render */}
          <div className="rounded-3xl bg-white dark:bg-navy-blue p-8 md:p-12 space-y-6 shadow-sm border border-gray-200/50 dark:border-white/5 text-left">
            {/* Lesson Title */}
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-dark-blue dark:text-white leading-tight">
                {name || "(Chưa nhập tên bài học)"}
              </h1>
              {description && (
                <p className="text-sm text-gray-navy dark:text-light-blue/80 mt-2 font-medium leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            <div className="w-full h-px bg-gray-100 dark:bg-white/5" />

            {/* Markdown body */}
            {content.trim() ? (
              <Markdown
                content={content}
                className="text-base text-dark-blue dark:text-white leading-relaxed select-text"
              />
            ) : (
              <div className="py-12 text-center text-sm font-medium text-gray-navy/40 dark:text-light-blue/30 italic">
                Chưa có nội dung Markdown bài học...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
