"use client";

import React from "react";
import { Eye, EyeOff, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EssayQuestionItem {
  id: string;
  question_md: string;
  answer_md: string;
  order?: number;
}

interface EssayQuestionCardProps {
  question: EssayQuestionItem;
  index: number;
  isRevealed: boolean;
  onToggleReveal: () => void;
}

export function EssayQuestionCard({
  question,
  index,
  isRevealed,
  onToggleReveal,
}: EssayQuestionCardProps) {
  const answerPanelId = `essay-answer-${question.id}`;

  return (
    <article
      className={cn(
        "rounded-3xl bg-white dark:bg-navy-blue/80 border transition-all duration-200 overflow-hidden shadow-sm",
        isRevealed
          ? "border-emerald-500/40 dark:border-emerald-500/30 shadow-md"
          : "border-gray-200/80 dark:border-white/10 hover:border-primary/40"
      )}
    >
      {/* Question Header & Markdown Prompt */}
      <div className="p-6 md:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center justify-center px-3 py-1 rounded-xl bg-primary/10 text-primary font-black text-xs tracking-wider uppercase shrink-0">
              Câu {index + 1}
            </span>
            <span className="text-xs font-semibold text-gray-500 dark:text-light-blue/60">
              Tự suy nghĩ trước khi đối chiếu đáp án
            </span>
          </div>

          <Button
            type="button"
            variant={isRevealed ? "outline" : "default"}
            size="sm"
            onClick={onToggleReveal}
            aria-expanded={isRevealed}
            aria-controls={answerPanelId}
            className={cn(
              "rounded-xl font-bold text-xs px-4 py-2 h-auto flex items-center gap-2 shrink-0 transition-all active:scale-95",
              isRevealed
                ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                : "bg-primary text-white hover:bg-primary/90 shadow-sm"
            )}
          >
            {isRevealed ? (
              <>
                <EyeOff className="size-3.5" />
                <span>Ẩn đáp án</span>
              </>
            ) : (
              <>
                <Eye className="size-3.5" />
                <span>Hiển thị đáp án</span>
              </>
            )}
          </Button>
        </div>

        <div className="min-w-0 overflow-x-auto text-base text-dark-blue dark:text-white leading-relaxed">
          <Markdown content={question.question_md} />
        </div>
      </div>

      {/* Expandable Reference Answer */}
      <AnimatePresence initial={false}>
        {isRevealed && (
          <motion.div
            id={answerPanelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden border-t border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20"
          >
            <div className="p-6 md:p-8 space-y-3 min-w-0">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <Lightbulb className="size-4 shrink-0" />
                <span>Đáp án tham khảo</span>
              </div>
              <div className="min-w-0 overflow-x-auto text-sm md:text-base text-slate-800 dark:text-slate-100 leading-relaxed">
                <Markdown content={question.answer_md} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
