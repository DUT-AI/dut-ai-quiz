"use client";

import React from "react";
import { Clock, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExamHeaderProps {
  title?: string;
  timeLeft: number | null;
  formatTime: (seconds: number) => string;
  onSubmitClick: () => void;
  isSubmitting: boolean;
}

export const ExamHeader: React.FC<ExamHeaderProps> = ({
  title = "KỲ THI ĐANG DIỄN RA",
  timeLeft,
  formatTime,
  onSubmitClick,
  isSubmitting,
}) => {
  return (
    <header className="h-20 bg-white dark:bg-navy-blue border-b border-gray-100 dark:border-white/5 flex items-center justify-between px-6 md:px-12 z-50 shadow-sm shrink-0">
      <div className="flex items-center gap-4">
        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-black text-xs">AI</span>
        </div>
        <div className="hidden md:block">
          <h2 className="text-sm font-black text-dark-blue dark:text-white uppercase tracking-wider line-clamp-1 max-w-[300px]">
            {title}
          </h2>
          <p className="text-[10px] font-bold text-gray-navy uppercase opacity-40">
            Phòng thi DUT AI Manager
          </p>
        </div>
      </div>

      <div
        className={cn(
          "flex items-center gap-3 px-6 py-2.5 rounded-2xl font-black text-xl transition-colors shrink-0",
          timeLeft !== null && timeLeft < 300
            ? "bg-red/10 text-red animate-pulse"
            : "bg-gray-50 dark:bg-white/5 text-dark-blue dark:text-white"
        )}
      >
        <Clock className="size-6" />
        {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
      </div>

      <button
        onClick={onSubmitClick}
        disabled={isSubmitting}
        className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
      >
        <Send className="size-4" />
        NỘP BÀI
      </button>
    </header>
  );
};
