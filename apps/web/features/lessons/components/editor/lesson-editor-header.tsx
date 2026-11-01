"use client";

import React from "react";
import { ArrowLeft, BookOpen, CheckCircle2, Columns, Edit3, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LessonEditorHeaderProps {
  isEdit: boolean;
  isPending: boolean;
  viewMode: "split" | "editor" | "preview";
  onChangeViewMode: (mode: "split" | "editor" | "preview") => void;
  onBack: () => void;
}

export function LessonEditorHeader({
  isEdit,
  isPending,
  viewMode,
  onChangeViewMode,
  onBack,
}: LessonEditorHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-white/5 pb-6">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onBack}
          className="size-10 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 shrink-0 border-gray-200 dark:border-white/10"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h2 className="text-lg font-black text-dark-blue dark:text-white leading-none flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            {isEdit ? "Chỉnh sửa bài học" : "Soạn bài học mới"}
          </h2>
          <p className="text-xs text-gray-navy font-bold tracking-wide mt-1">
            Quản lý bài học • Nội dung chi tiết & Lý thuyết
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* View Modes */}
        <div className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 p-1 rounded-2xl border border-gray-200/40 dark:border-white/5">
          <button
            type="button"
            onClick={() => onChangeViewMode("editor")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === "editor"
                ? "bg-white dark:bg-white/15 text-primary shadow-sm"
                : "text-gray-navy hover:text-dark-blue dark:hover:text-white"
            }`}
          >
            <Edit3 className="size-3.5" /> Chỉ soạn thảo
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode("split")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === "split"
                ? "bg-white dark:bg-white/15 text-primary shadow-sm"
                : "text-gray-navy hover:text-dark-blue dark:hover:text-white"
            }`}
          >
            <Columns className="size-3.5" /> Chia đôi
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode("preview")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === "preview"
                ? "bg-white dark:bg-white/15 text-primary shadow-sm"
                : "text-gray-navy hover:text-dark-blue dark:hover:text-white"
            }`}
          >
            <Eye className="size-3.5" /> Xem trước
          </button>
        </div>

        <Button
          type="submit"
          form="lesson-editor-form"
          disabled={isPending}
          className="py-2.5 px-6 rounded-2xl bg-primary text-white font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 text-xs"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          {isEdit ? "Lưu thay đổi" : "Tạo bài học"}
        </Button>
      </div>
    </div>
  );
}
