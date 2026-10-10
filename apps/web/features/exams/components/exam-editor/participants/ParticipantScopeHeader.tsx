"use client";

import React from "react";
import { Globe, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParticipantScopeHeaderProps {
  isPublic: boolean;
  onToggleScope: (isPublic: boolean) => void;
}

export function ParticipantScopeHeader({
  isPublic,
  onToggleScope,
}: ParticipantScopeHeaderProps) {
  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-navy-blue/80 border border-gray-150 dark:border-white/10 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary block mb-1">
            Phạm vi thí sinh dự thi
          </span>
          <h3 className="text-base font-bold text-dark-blue dark:text-white">
            {isPublic
              ? "Kỳ thi đang mở công khai cho toàn trường"
              : "Kỳ thi giới hạn cho danh sách cá nhân / nhóm"}
          </h3>
          <p className="text-xs text-gray-navy dark:text-light-blue/70 mt-0.5">
            {isPublic
              ? "Tất cả học sinh đều có thể xem và tham gia thi khi bài thi được công khai."
              : "Chỉ các học sinh hoặc nhóm được thêm vào danh sách dưới đây mới có quyền làm bài."}
          </p>
        </div>

        {/* Segmented Switch */}
        <div className="flex items-center p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-150 dark:border-white/10 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onToggleScope(true)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
              isPublic
                ? "bg-white dark:bg-navy-blue text-primary shadow-sm font-black"
                : "text-gray-navy hover:text-dark-blue dark:text-light-blue/70 dark:hover:text-white opacity-70 hover:opacity-100"
            )}
          >
            <Globe className="size-3.5" />
            Mở công khai
          </button>
          <button
            type="button"
            onClick={() => onToggleScope(false)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
              !isPublic
                ? "bg-white dark:bg-navy-blue text-primary shadow-sm font-black"
                : "text-gray-navy hover:text-dark-blue dark:text-light-blue/70 dark:hover:text-white opacity-70 hover:opacity-100"
            )}
          >
            <Lock className="size-3.5" />
            Chỉ định cá nhân / nhóm
          </button>
        </div>
      </div>
    </div>
  );
}
