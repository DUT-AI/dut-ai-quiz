"use client";

import React from "react";
import { X, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { HeadingItem } from "../utils/theory-parser";

interface TocExpandedProps {
  headings: HeadingItem[];
  activeId: string;
  onHeadingClick: (id: string) => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function TocExpanded({
  headings,
  activeId,
  onHeadingClick,
  onClose,
  showCloseButton = false,
}: TocExpandedProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col h-full max-h-[400px] lg:max-h-[550px] bg-white dark:bg-[#191919] text-slate-800 dark:text-slate-200 select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
        <div className="flex items-center gap-1.5">
          <List className="size-3.5 text-slate-400 dark:text-slate-500" />
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Mục lục bài học
          </span>
        </div>
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* List items */}
      <div
        className="overflow-y-auto flex-1 py-2 px-1.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(156, 163, 175, 0.25) transparent",
        }}
      >
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          return (
            <button
              key={heading.id}
              onClick={(e) => {
                e.preventDefault();
                onHeadingClick(heading.id);
              }}
              className={cn(
                "w-full text-left py-1 px-2.5 my-[1px] rounded-[4px] transition-all duration-150 cursor-pointer block truncate text-[13px] font-normal leading-[1.4]",
                heading.level === 1 && "pl-2.5",
                heading.level === 2 && "pl-5",
                heading.level === 3 && "pl-8",
                heading.level >= 4 && "pl-11 italic opacity-80",
                isActive
                  ? "text-[#1b66c9] dark:text-[#529cca] bg-[#efefef]/80 dark:bg-zinc-800/80 font-medium"
                  : "text-slate-700 dark:text-slate-350 hover:text-slate-950 dark:hover:text-white hover:bg-[#efefef]/40 dark:hover:bg-zinc-800/40"
              )}
              title={heading.text}
            >
              {heading.text}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
