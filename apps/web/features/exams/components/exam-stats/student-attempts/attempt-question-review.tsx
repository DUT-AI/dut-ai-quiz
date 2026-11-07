"use client";

import React from "react";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";
import type { StudentAttemptQuestionDetail } from "@/features/exams/types";

interface AttemptQuestionReviewProps {
  questions: StudentAttemptQuestionDetail[];
}

export function AttemptQuestionReview({ questions }: AttemptQuestionReviewProps) {
  if (questions.length === 0) {
    return (
      <div className="p-12 text-center rounded-[2.5rem] bg-gray-50 dark:bg-white/5 text-gray-navy opacity-60 font-bold">
        Không có dữ liệu câu hỏi cho lượt làm bài này.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {questions.map((q, idx) => {
        const isAnswered = q.selected_option_id !== null && q.selected_option_id !== undefined;
        const isCorrect = q.is_correct === true;

        return (
          <div
            key={q.id}
            className="p-8 rounded-[2.5rem] bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 shadow-sm space-y-6 transition-all hover:shadow-md"
          >
            {/* Header: Question Number & Status Indicator */}
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <span className="size-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-sm font-black shrink-0">
                  {idx + 1}
                </span>
                <span className="font-black text-xs uppercase tracking-wider text-gray-navy opacity-60">
                  Câu hỏi {idx + 1}
                </span>
              </div>

              {isCorrect ? (
                <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-green-500/15 text-green-600 text-xs font-black">
                  <CheckCircle2 className="size-4" />
                  Đúng
                </span>
              ) : isAnswered ? (
                <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red/15 text-red text-xs font-black">
                  <XCircle className="size-4" />
                  Sai
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/15 text-amber-600 text-xs font-black">
                  <AlertTriangle className="size-4" />
                  Chưa trả lời
                </span>
              )}
            </div>

            {/* Question Markdown Content */}
            <div className="text-base md:text-lg font-bold text-dark-blue dark:text-white leading-relaxed">
              <Markdown
                content={q.content}
                className="prose dark:prose-invert max-w-none font-bold text-dark-blue dark:text-white text-base md:text-lg"
              />
            </div>

            {/* Options in Responsive 2-column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {q.options.map((opt) => {
                const isSelected = isAnswered && String(opt.id) === String(q.selected_option_id);
                const isCorrectOpt = Boolean(opt.is_correct);

                let borderColor = "border-gray-100 dark:border-white/10";
                let bgColor = "bg-gray-50/60 dark:bg-white/5";
                let badge = null;
                let statusIcon = null;

                if (isSelected && isCorrectOpt) {
                  borderColor = "border-green-500/50";
                  bgColor = "bg-green-500/10";
                  badge = (
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-green-500 text-white shadow-sm">
                      ✨ Học sinh chọn đúng
                    </span>
                  );
                  statusIcon = <CheckCircle2 className="size-5 text-green-600 shrink-0" />;
                } else if (isSelected && !isCorrectOpt) {
                  borderColor = "border-red/50";
                  bgColor = "bg-red/10";
                  badge = (
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-red text-white shadow-sm">
                      ✗ Học sinh đã chọn
                    </span>
                  );
                  statusIcon = <XCircle className="size-5 text-red shrink-0" />;
                } else if (isCorrectOpt) {
                  borderColor = "border-green-500/40 border-dashed";
                  bgColor = "bg-green-500/5";
                  badge = (
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-green-500/20 text-green-700 dark:text-green-300">
                      ✓ Đáp án đúng
                    </span>
                  );
                  statusIcon = <CheckCircle2 className="size-5 text-green-500 shrink-0" />;
                }

                return (
                  <div
                    key={opt.id}
                    className={cn(
                      "relative p-5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3",
                      borderColor,
                      bgColor,
                      isSelected && "ring-2 ring-primary/20 shadow-sm"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="prose prose-sm dark:prose-invert font-semibold text-dark-blue dark:text-white flex-1 max-w-none">
                        <Markdown content={opt.content} />
                      </div>
                      {statusIcon}
                    </div>

                    {badge && <div className="pt-1">{badge}</div>}
                  </div>
                );
              })}
            </div>

            {/* Unanswered Notice if applicable */}
            {!isAnswered && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-amber-700 dark:text-amber-400 text-xs font-bold">
                <AlertTriangle className="size-4 shrink-0" />
                Học sinh không tích chọn bất kỳ đáp án nào cho câu hỏi này trước khi nộp bài.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
