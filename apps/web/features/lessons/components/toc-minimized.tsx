"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { HeadingItem } from "../utils/theory-parser";

interface TocMinimizedProps {
  headings: HeadingItem[];
  activeId: string;
  onHeadingClick: (id: string) => void;
}

export function TocMinimized({ headings, activeId, onHeadingClick }: TocMinimizedProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col items-center py-4 px-2.5 gap-2 select-none w-full font-sans"
    >
      {headings.map((heading) => {
        const isActive = activeId === heading.id;

        // Width logic based on Notion style outline representation:
        // H1 (level 1): longest, H2 (level 2): medium, H3 (level 3): shorter, H4 (level 4): shortest
        let widthClass = "w-6";
        if (heading.level === 2) widthClass = "w-[18px]";
        else if (heading.level === 3) widthClass = "w-3";
        else if (heading.level >= 4) widthClass = "w-2";

        return (
          <button
            key={heading.id}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onHeadingClick(heading.id);
            }}
            className={cn(
              "h-[3px] rounded-full transition-all duration-300 cursor-pointer focus:outline-none relative group block",
              widthClass,
              isActive
                ? "bg-[#1b66c9] dark:bg-[#1b66c9] h-[4px] shadow-sm"
                : "bg-[#d5e7ff] dark:bg-[#a9b7ca] hover:bg-[#1b66c9] dark:hover:bg-[#529cca]"
            )}
            title={heading.text}
          >
            {/* Tooltip on hover */}
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900/90 dark:bg-zinc-800/95 text-white text-[11px] px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 font-medium border border-transparent dark:border-zinc-700/50">
              {heading.text}
            </span>
          </button>
        );
      })}
    </motion.div>
  );
}
