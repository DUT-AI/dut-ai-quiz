"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { type Module } from "../../types";

interface LessonPreviewPanelProps {
  name: string;
  description?: string;
  content: string;
  selectedModule?: Module;
  viewMode: "split" | "editor" | "preview";
  editorWidth: number;
  isDesktop: boolean;
}

export function LessonPreviewPanel({
  name,
  description,
  content,
  selectedModule,
  viewMode,
  editorWidth,
  isDesktop,
}: LessonPreviewPanelProps) {
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
    </div>
  );
}
