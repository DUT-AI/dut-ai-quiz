"use client";

import React from "react";
import { HelpCircle } from "lucide-react";

interface FeedbackHeaderProps {
  onShowSuggestions?: () => void;
}

export function FeedbackHeader({ onShowSuggestions }: FeedbackHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-gray-150 dark:border-white/10 pb-6">
      {/* Mini Badge Tag */}
      <div>
        <span className="text-[10px] sm:text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 dark:bg-primary/20 px-3 py-1 rounded-full">
          Cộng đồng đóng góp
        </span>
      </div>

      {/* Main Title and Subtitle */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Đóng góp ý kiến &amp; Phản hồi
          </h1>
          {onShowSuggestions && (
            <button
              onClick={onShowSuggestions}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-gray-navy/50 hover:text-primary dark:text-light-blue/50 dark:hover:text-emerald-400 transition-all duration-200 shrink-0"
              title="Hướng dẫn & Gợi ý"
            >
              <HelpCircle className="size-6 sm:size-7" />
            </button>
          )}
        </div>
        <p className="text-sm sm:text-base text-gray-navy/70 dark:text-light-blue/60 max-w-3xl leading-relaxed">
          Ý kiến đóng góp của bạn rất quan trọng để giúp đội ngũ phát triển cải tiến và hoàn thiện hệ thống{" "}
          <span className="font-extrabold text-primary dark:text-emerald-400">
            DUT AI Quiz
          </span>{" "}
          mỗi ngày.
        </p>
      </div>
    </div>
  );
}

