"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Volume2, VolumeX } from "lucide-react";
import SwitchTheme from "@/components/atoms/switch-theme";

export interface GameTopBarProps {
  lessonSlug: string;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export default function GameTopBar({
  lessonSlug,
  isMuted = false,
  onToggleMute,
}: GameTopBarProps) {
  const router = useRouter();

  return (
    <div className="w-full px-5 flex justify-between items-center py-2 mb-2 relative z-20">
      <button
        onClick={() => router.push(`/lessons/${lessonSlug}`)}
        className="flex items-center gap-2 px-3 py-2 text-xs md:text-sm font-bold uppercase tracking-wider bg-white dark:bg-navy-blue border-2 border-zinc-900 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-zinc-700 dark:text-zinc-300 font-mono shadow-sm"
      >
        <BookOpen className="size-4" />
        <span>Quay lại Bài học</span>
      </button>

      {/* Right controls: Sound Toggle Button + Switch Theme */}
      <div className="flex items-center gap-2">
        {onToggleMute && (
          <button
            onClick={onToggleMute}
            className="flex items-center justify-center gap-1.5 px-3 py-2 h-10 md:h-12 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-blue text-zinc-800 dark:text-zinc-100 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm text-xs md:text-sm font-mono font-bold"
            title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
          >
            {isMuted ? (
              <VolumeX className="size-4 md:size-5 text-red-500" />
            ) : (
              <Volume2 className="size-4 md:size-5 text-emerald-500" />
            )}
            <span className="tracking-wider">{isMuted ? "ÂM: TẮT" : "ÂM: BẬT"}</span>
          </button>
        )}
        <SwitchTheme />
      </div>
    </div>
  );
}
