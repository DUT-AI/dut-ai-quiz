"use client";

import React from "react";
import { Swords, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameStartScreenProps {
  lessonSlug: string;
  hasActiveSession: boolean;
  isStarting: boolean;
  onStart: () => void;
}

export default function GameStartScreen({
  lessonSlug,
  hasActiveSession,
  isStarting,
  onStart,
}: GameStartScreenProps) {
  return (
    <div className="w-full max-w-xl mx-auto flex flex-col justify-center items-center py-16 px-4">
      <div className="w-full flex flex-col bg-white dark:bg-navy-blue border-3 border-zinc-900 dark:border-zinc-700 p-8 text-center relative shadow-lg text-zinc-900 dark:text-zinc-100 font-mono">
        <div className="size-16 rounded-none bg-indigo-500/10 border-2 border-dashed border-indigo-500/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-6 mx-auto animate-bounce">
          <Swords className="size-8" />
        </div>

        <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white mb-4 uppercase">
          ĐẤU TRƯỜNG LUYỆN TẬP
        </h3>
        
        <p className="text-zinc-650 dark:text-zinc-400 text-xs md:text-sm leading-relaxed mb-8 font-bold max-w-sm mx-auto">
          Chào mừng dũng sĩ! Hãy chuẩn bị tinh thần để chinh phục các thử thách học thuật và đánh bại các Boss canh giữ.
        </p>

        <div className="flex justify-center">
          <Button
            onClick={onStart}
            disabled={isStarting}
            className="py-6 px-10 rounded-none bg-indigo-500 text-white font-black uppercase tracking-widest hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 shadow-md border-2 border-zinc-900 dark:border-zinc-700 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-sm flex items-center gap-3 w-full sm:w-auto"
          >
            {isStarting ? (
              <div className="size-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
            ) : hasActiveSession ? (
              <RotateCcw className="size-4 animate-pulse" />
            ) : (
              <Play className="size-4 fill-current animate-pulse" />
            )}
            <span>{hasActiveSession ? "Tiếp tục thi đấu" : "Bắt đầu thi đấu"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
