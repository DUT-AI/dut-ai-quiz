"use client";

import React from "react";

export type LessonEditorStep = 1 | 2 | 3 | 4;

interface LessonEditorStepperProps {
  currentStep: LessonEditorStep;
  videoCount: number;
  essayCount: number;
  onSelectStep: (step: LessonEditorStep) => void;
}

export function LessonEditorStepper({
  currentStep,
  videoCount,
  essayCount,
  onSelectStep,
}: LessonEditorStepperProps) {
  const steps: { step: LessonEditorStep; label: string }[] = [
    { step: 1, label: "Thông tin chung" },
    { step: 2, label: `Video tham khảo (${videoCount})` },
    { step: 3, label: "Nội dung Markdown" },
    { step: 4, label: `Câu hỏi tự luận (${essayCount})` },
  ];

  return (
    <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4 shrink-0 overflow-x-auto">
      <div className="flex items-center gap-2 md:gap-3">
        {steps.map((item, idx) => (
          <React.Fragment key={item.step}>
            {idx > 0 && (
              <div className="w-5 md:w-7 h-0.5 bg-gray-100 dark:bg-white/5 shrink-0" />
            )}
            <button
              type="button"
              onClick={() => onSelectStep(item.step)}
              className="flex items-center gap-2 text-left group shrink-0"
            >
              <span
                className={`size-7 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                  currentStep === item.step
                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110"
                    : "bg-gray-100 dark:bg-white/10 text-gray-navy group-hover:scale-105"
                }`}
              >
                {item.step}
              </span>
              <span
                className={`text-xs font-black uppercase tracking-wider transition-colors ${
                  currentStep === item.step
                    ? "text-primary"
                    : "text-gray-navy group-hover:text-dark-blue dark:group-hover:text-white"
                }`}
              >
                {item.label}
              </span>
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
