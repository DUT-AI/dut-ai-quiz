"use client";

import React from "react";
import { Swords, Trophy, Skull, Lock } from "lucide-react";
import { type StageProgressStatus } from "../types";

export interface GameHeaderHudProps {
  stageProgress: StageProgressStatus[];
  currentIdx: number;
  score: number;
}

export default function GameHeaderHud({
  stageProgress,
  currentIdx,
  score,
}: GameHeaderHudProps) {
  return (
    <header className="relative w-full max-w-[98%] mx-auto flex justify-between items-center bg-white dark:bg-navy-blue border-3 border-zinc-900 dark:border-zinc-700 p-3 md:p-4 rounded-none mb-3 z-10 shadow-md select-none">
      {/* Left Side: Stage progress dots */}
      <div className="flex flex-col items-start select-none">
        <div className="text-[10px] md:text-xs text-zinc-500 dark:text-zinc-400 mb-1 tracking-wider font-extrabold font-mono">
          TIẾN TRÌNH THỬ THÁCH
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-md md:max-w-none py-1">
          {stageProgress.map((status, i) => {
            const isActive = i === currentIdx;
            let icon = null;
            let btnClass =
              "bg-zinc-100 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed";

            if (isActive) {
              icon = (
                <Swords className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 text-zinc-900 dark:text-white animate-pulse" />
              );
              btnClass =
                "bg-amber-400 dark:bg-amber-500 border-zinc-900 dark:border-zinc-700 text-zinc-900 dark:text-white scale-110";
            } else if (status === "correct") {
              icon = (
                <Trophy className="w-3 h-3 md:w-4 md:h-4 text-emerald-800 dark:text-emerald-300" />
              );
              btnClass =
                "bg-emerald-400 dark:bg-emerald-650 border-zinc-900 dark:border-zinc-700";
            } else if (status === "incorrect") {
              icon = (
                <Skull className="w-3 h-3 md:w-4 md:h-4 text-red-800 dark:text-red-300" />
              );
              btnClass =
                "bg-red-400 dark:bg-red-650 border-zinc-900 dark:border-zinc-700";
            } else {
              icon = (
                <Lock className="w-2.5 h-2.5 md:w-3 md:h-3 text-zinc-400 dark:text-zinc-500" />
              );
            }

            return (
              <button
                key={i}
                type="button"
                disabled
                className={`relative w-8 h-8 md:w-10 md:h-10 border-2 transition-all duration-300 flex items-center justify-center rounded-none font-bold ${btnClass}`}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-none border-2 border-amber-500 dark:border-amber-400 animate-active-dot opacity-80 pointer-events-none" />
                )}
                {icon}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Side: Score */}
      <div className="flex flex-col items-end">
        <span className="text-[10px] md:text-xs text-zinc-500 dark:text-zinc-400 font-extrabold font-mono">
          ĐIỂM SỐ
        </span>
        <span className="text-cyan-600 dark:text-cyan-400 font-extrabold tracking-wide font-mono text-lg md:text-xl">
          {score} PTS
        </span>
      </div>
    </header>
  );
}
