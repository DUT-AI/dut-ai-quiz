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

  let html = raw;

  // 1. Format blockquotes first so they don't get wrapped in paragraphs
  html = html.replace(/^>\s*(.*$)/gim, '<blockquote class="border-l-4 border-emerald-500 bg-slate-50 dark:bg-slate-900/40 px-5 py-3 my-6 rounded-r-xl italic text-slate-600 dark:text-slate-400 text-lg md:text-xl">$1</blockquote>');
  html = html.replace(/<\/blockquote>\s*<blockquote[^>]*>/g, '<br />');

  // 2. Format headings with Tailwind classes
  html = html.replace(/^#### (.*$)/gim, '<h4 class="text-lg md:text-xl font-semibold tracking-tight text-slate-900 dark:text-white mt-5 mb-2">$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mt-7 mb-3">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-9 mb-4 pb-2 border-b border-slate-200 dark:border-zinc-800/80">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-11 mb-5 leading-tight">$1</h1>');

  // 3. Format lists with Tailwind classes
  html = html.replace(/^\* (.*$)/gim, '<li class="list-disc ml-6 my-2 text-lg md:text-xl text-slate-700 dark:text-slate-300 font-normal leading-relaxed">$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li class="list-disc ml-6 my-2 text-lg md:text-xl text-slate-700 dark:text-slate-300 font-normal leading-relaxed">$1</li>');

  // 4. Split into paragraphs, skipping block elements
  html = html
    .split(/\n\s*\n/)
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return "";
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<li") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol") ||
        trimmed.startsWith("<img") ||
        trimmed.startsWith("<blockquote")
      ) {
        return trimmed;
      }
      return `<p class="text-lg md:text-xl text-slate-700 dark:text-slate-300 font-normal leading-relaxed my-5">${trimmed}</p>`;
    })
    .join("\n\n");

  // 5. Render math, bold, italic, code blocks, etc. (Called ONLY once here)
  html = renderMathInHTML(html);

  // 6. Post-process bold and inline code to apply premium Tailwind styling
  html = html.replace(/<strong>/gi, '<strong class="font-bold text-slate-900 dark:text-white">');
  html = html.replace(/<code>/gi, '<code class="font-mono text-sm font-semibold text-pink-600 dark:text-pink-400 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-zinc-700/50 px-1.5 py-0.5 rounded-md">');

  // 7. Post-process tables to apply custom Tailwind styling (if present)
  html = html.replace(/<table>/gi, '<table class="w-full my-6 border-collapse text-sm text-left">');
  html = html.replace(/<th>/gi, '<th class="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-zinc-800 px-4 py-3 font-semibold text-slate-900 dark:text-white">');
  html = html.replace(/<td>/gi, '<td class="border border-slate-200 dark:border-zinc-800 px-4 py-3 text-slate-700 dark:text-slate-300">');
  html = html.replace(/<tr>/gi, '<tr class="even:bg-slate-50/50 dark:even:bg-white/[0.02]">');

  // 8. Style KaTeX container spacing and size
  html = html.replace(/class="katex-display"/g, 'class="katex-display my-6 p-2 overflow-x-auto overflow-y-hidden select-all"');
  html = html.replace(/class="katex"/g, 'class="katex text-[1.05em] select-all"');

  // 9. Clean up any unnecessary <br /> tags between/around block elements
  html = html
    .replace(/(<\/(p|h1|h2|h3|h4|li|ul|ol|hr|div|blockquote)>)(?:\s*<br\s*\/?>)+/gi, "$1")
    .replace(/(?:\s*<br\s*\/?>)+(<(p|h1|h2|h3|h4|li|ul|ol|hr|div|blockquote)[^>]*>)/gi, "$1");

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
        className="max-w-4xl mx-auto text-left font-sans antialiased text-dark-blue dark:text-white"
        dangerouslySetInnerHTML={{
          __html: renderTheoryMarkdown(contentMd),
        }}
      />
    </div>
  );
}
