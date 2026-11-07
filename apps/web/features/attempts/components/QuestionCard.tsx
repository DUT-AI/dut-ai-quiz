"use client";

import React from "react";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";
import { QuizQuestion } from "../types";

interface QuestionCardProps {
  question: QuizQuestion;
  index: number;
  selectedOptionId: string | null;
  onSelectOption: (optionId: string) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  selectedOptionId,
  onSelectOption,
}) => {
  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-10">
      {/* Question Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="size-8 rounded-lg bg-primary text-white font-black text-xs flex items-center justify-center">
            {index + 1}
          </span>
          <h3 className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">
            CÂU HỎI TRẮC NGHIỆM
          </h3>
        </div>
        <Markdown
          content={question?.content || ""}
          className="text-xl md:text-2xl font-bold text-dark-blue dark:text-white leading-relaxed question-content select-none"
        />
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-4">
        {question?.options?.map((opt, optIdx) => {
          const isSelected = selectedOptionId === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelectOption(opt.id)}
              className={cn(
                "group flex items-center gap-6 p-6 md:p-8 rounded-[2rem] border-2 transition-all text-left",
                isSelected
                  ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10"
                  : "bg-white dark:bg-navy-blue border-gray-100 dark:border-white/5 text-gray-navy hover:border-primary/30"
              )}
            >
              <div
                className={cn(
                  "size-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all font-black text-xs",
                  isSelected
                    ? "border-primary bg-primary text-white"
                    : "border-gray-200 dark:border-white/10 group-hover:border-primary/50"
                )}
              >
                {String.fromCharCode(65 + optIdx)}
              </div>
              <Markdown
                content={opt.text || ""}
                className="text-base md:text-lg font-bold leading-relaxed"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
