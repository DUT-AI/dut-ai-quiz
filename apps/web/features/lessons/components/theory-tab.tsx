"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { renderMathInHTML } from "@/lib/render-math";

interface TheoryTabProps {
  contentMd?: string | null;
}

/**
 * Basic markdown/latex renderer helper for theory content.
 */
function renderTheoryMarkdown(raw: string): string {
  if (!raw) return "";

  // Render math, bold, italic, code blocks using project's katex helper
  let html = renderMathInHTML(raw);

  // Parse Markdown headings
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3 text-dark-blue dark:text-white">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4 border-b border-gray-100 dark:border-white/5 pb-2 text-dark-blue dark:text-white">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-black mt-10 mb-6 text-dark-blue dark:text-white">$1</h1>');

  // Parse Markdown bullet lists
  html = html.replace(/^\* (.*$)/gim, '<li class="ml-6 my-2 list-disc text-gray-navy dark:text-light-blue">$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li class="ml-6 my-2 list-disc text-gray-navy dark:text-light-blue">$1</li>');

  // Split into paragraphs, skipping heading tags and list items
  html = html
    .split("\n\n")
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return "";
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<li") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol") ||
        trimmed.startsWith("<img")
      ) {
        return trimmed;
      }
      return `<p class="my-4 leading-relaxed text-gray-navy dark:text-light-blue text-base font-medium opacity-90">${trimmed}</p>`;
    })
    .join("\n");

  return html;
}

export function TheoryTab({ contentMd }: TheoryTabProps) {
  if (!contentMd) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 rounded-[2.5rem] shadow-xl p-8">
        <Sparkles className="size-16 text-primary/60 mb-6 animate-pulse" />
        <h3 className="text-2xl font-black text-dark-blue dark:text-white mb-3">
          Bài học đang được tiến hành soạn thảo
        </h3>
        <p className="text-gray-navy dark:text-light-blue opacity-70 max-w-md font-medium text-sm">
          Giảng viên chưa hoàn tất phần soạn thảo lý thuyết cho chương này.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 rounded-[2.5rem] shadow-xl p-8 md:p-12 text-left">
      <div
        className="prose prose-slate dark:prose-invert max-w-none text-dark-blue dark:text-white leading-relaxed font-medium"
        dangerouslySetInnerHTML={{
          __html: renderTheoryMarkdown(contentMd),
        }}
      />
    </div>
  );
}
