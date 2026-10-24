"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import SwitchTheme from "@/components/atoms/switch-theme";

export interface GameTopBarProps {
  lessonSlug: string;
}

export default function GameTopBar({ lessonSlug }: GameTopBarProps) {
  const router = useRouter();

  return (
    <div className="w-full max-w-[98%] mx-auto flex justify-between items-center py-2 mb-2 px-1 relative z-20">
      <button
        onClick={() => router.push(`/lessons/${lessonSlug}`)}
        className="flex items-center gap-2 px-3 py-2 text-xs md:text-sm font-bold uppercase tracking-wider bg-white dark:bg-navy-blue border-2 border-zinc-900 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-zinc-700 dark:text-zinc-300 font-mono shadow-sm"
      >
        <BookOpen className="size-4" />
        <span>Quay lại Bài học</span>
      </button>
      <SwitchTheme />
    </div>
  );
}
