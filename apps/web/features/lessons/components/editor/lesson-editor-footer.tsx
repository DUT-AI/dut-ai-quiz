"use client";

import React from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LessonEditorFooterProps {
  currentStep: 1 | 2 | 3;
  videoCount: number;
  isPending: boolean;
  isEdit: boolean;
  onPrevStep: () => void;
  onNextStep: () => void;
}

export function LessonEditorFooter({
  currentStep,
  videoCount,
  isPending,
  isEdit,
  onPrevStep,
  onNextStep,
}: LessonEditorFooterProps) {
  return (
    <div className="mt-auto pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0">
      <div>
        {currentStep > 1 && (
          <Button
            type="button"
            variant="ghost"
            onClick={onPrevStep}
            className="py-5 px-6 rounded-2xl font-bold flex items-center gap-2 text-gray-navy hover:text-dark-blue dark:hover:text-white"
          >
            <ArrowLeft className="size-4" /> Quay lại Bước {currentStep - 1}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {currentStep === 1 && (
          <Button
            type="button"
            onClick={onNextStep}
            className="py-5 px-8 rounded-2xl bg-primary text-white font-bold flex items-center gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            Tiếp theo: Video tham khảo ({videoCount})
          </Button>
        )}
        {currentStep === 2 && (
          <Button
            type="button"
            onClick={onNextStep}
            className="py-5 px-8 rounded-2xl bg-primary text-white font-bold flex items-center gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            Tiếp theo: Soạn nội dung Markdown
          </Button>
        )}
        {currentStep === 3 && (
          <Button
            type="submit"
            form="lesson-editor-form"
            disabled={isPending}
            className="py-5 px-10 rounded-2xl bg-primary text-white font-bold flex items-center gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            {isPending ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 className="size-5" />}
            {isEdit ? "Cập nhật bài học" : "Lưu bài học"}
          </Button>
        )}
      </div>
    </div>
  );
}
