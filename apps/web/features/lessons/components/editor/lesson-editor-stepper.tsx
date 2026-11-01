"use client";

import React from "react";

interface LessonEditorStepperProps {
  currentStep: 1 | 2 | 3;
  videoCount: number;
  onSelectStep: (step: 1 | 2 | 3) => void;
}

export function LessonEditorStepper({
  currentStep,
  videoCount,
  onSelectStep,
}: LessonEditorStepperProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4 shrink-0 overflow-x-auto">
      <div className="flex items-center gap-2 md:gap-3">
        {/* Stage 1 */}
        <button
          type="button"
          onClick={() => onSelectStep(1)}
          className="flex items-center gap-2 text-left group shrink-0"
        >
          <span
            className={`size-7 rounded-xl flex items-center justify-center font-black text-xs transition-all ${currentStep === 1
                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110"
                : "bg-gray-100 dark:bg-white/10 text-gray-navy group-hover:scale-105"
              }`}
          >
            1
          </span>
          <span
            className={`text-xs font-black uppercase tracking-wider transition-colors ${currentStep === 1
                ? "text-primary"
                : "text-gray-navy group-hover:text-dark-blue dark:group-hover:text-white"
              }`}
          >
            Thông tin chung
          </span>
        </button>

        <div className="w-6 md:w-8 h-0.5 bg-gray-100 dark:bg-white/5 shrink-0" />

        {/* Stage 2 */}
        <button
          type="button"
          onClick={() => onSelectStep(2)}
          className="flex items-center gap-2 text-left group shrink-0"
        >
          <span
            className={`size-7 rounded-xl flex items-center justify-center font-black text-xs transition-all ${currentStep === 2
                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110"
                : "bg-gray-100 dark:bg-white/10 text-gray-navy group-hover:scale-105"
              }`}
          >
            2
          </span>
          <span
            className={`text-xs font-black uppercase tracking-wider transition-colors ${currentStep === 2
                ? "text-primary"
                : "text-gray-navy group-hover:text-dark-blue dark:group-hover:text-white"
              }`}
          >
            Video tham khảo ({videoCount})
          </span>
        </button>

        <div className="w-6 md:w-8 h-0.5 bg-gray-100 dark:bg-white/5 shrink-0" />

        {/* Stage 3 */}
        <button
          type="button"
          onClick={() => onSelectStep(3)}
          className="flex items-center gap-2 text-left group shrink-0"
        >
          <span
            className={`size-7 rounded-xl flex items-center justify-center font-black text-xs transition-all ${currentStep === 3
                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110"
                : "bg-gray-100 dark:bg-white/10 text-gray-navy group-hover:scale-105"
              }`}
          >
            3
          </span>
          <span
            className={`text-xs font-black uppercase tracking-wider transition-colors ${currentStep === 3
                ? "text-primary"
                : "text-gray-navy group-hover:text-dark-blue dark:group-hover:text-white"
              }`}
          >
            Nội dung Markdown
          </span>
        </button>
      </div>
    </div>
  );
}
