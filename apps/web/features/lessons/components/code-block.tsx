"use client";

import React, { useState } from "react";
import hljs from "highlight.js";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language: string;
}

const escapeHTML = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const CodeBlock = React.memo(function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  let highlightedHtml = "";
  if (language && hljs.getLanguage(language)) {
    try {
      highlightedHtml = hljs.highlight(code, { language }).value;
    } catch {
      highlightedHtml = escapeHTML(code);
    }
  } else {
    try {
      highlightedHtml = hljs.highlightAuto(code).value;
    } catch {
      highlightedHtml = escapeHTML(code);
    }
  }

  return (
    <div className="code-block-container my-8 rounded-2xl overflow-hidden shadow-lg border border-zinc-200 dark:border-zinc-800/80 bg-[#0B0F17] dark:bg-[#090C14] transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5">
      <div className="flex items-center justify-between px-5 py-3 bg-[#131B2D] dark:bg-[#0D1525] border-b border-zinc-800/60 select-none">
        <div className="flex space-x-2 items-center">
          <span className="w-3 h-3 rounded-full bg-rose-500/85"></span>
          <span className="w-3 h-3 rounded-full bg-amber-500/85"></span>
          <span className="w-3 h-3 rounded-full bg-emerald-500/85"></span>
          <span className="ml-3 text-xs md:text-sm font-semibold tracking-wide text-zinc-300 capitalize">
            {language || "code"}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-zinc-300 hover:text-white bg-zinc-800/60 hover:bg-zinc-700 active:scale-95 transition-all duration-200 text-xs md:text-sm font-medium border border-zinc-700/40 shadow-sm cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-5 overflow-x-auto theory-scrollbar text-left m-0">
        <code
          className="block font-mono text-sm md:text-[15px] leading-relaxed text-zinc-100"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      </pre>
    </div>
  );
});
