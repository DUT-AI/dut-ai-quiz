"use client";

import React from "react";
import { Trophy, Coins, Gamepad2, Award, Sparkles } from "lucide-react";
import { useGameHistorySummary } from "../queries";

interface PracticePersonalBestProps {
  lessonSlug: string;
}

export default function PracticePersonalBest({ lessonSlug }: PracticePersonalBestProps) {
  const { data: summaries = [], isLoading } = useGameHistorySummary();

  const summary = summaries.find((s) => s.lesson_slug === lessonSlug);

  const getTierLabel = (tier: number) => {
    if (tier === 1) return "Tầng 1 (Dễ)";
    if (tier === 2) return "Tầng 2 (Vừa)";
    if (tier >= 3) return "Tầng 3 (Khó)";
    return `Tầng ${tier}`;
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white dark:bg-slate-900 border-3 border-zinc-900 dark:border-slate-700 p-6 font-mono text-zinc-900 dark:text-slate-100 shadow-md animate-pulse">
        <div className="h-6 bg-zinc-200 dark:bg-slate-800 w-1/2 mb-6" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-zinc-100 dark:bg-slate-800 border-2 border-zinc-200 dark:border-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-slate-900 border-3 border-zinc-900 dark:border-slate-700 p-6 font-mono text-zinc-900 dark:text-slate-100 shadow-md relative overflow-hidden transition-all duration-300">
      {/* Decorative background grid pattern for premium feel */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />

      <div className="flex items-center gap-2 border-b-2 border-zinc-900 dark:border-slate-700 pb-3 mb-5 relative z-10">
        <Award className="w-6 h-6 text-amber-500 animate-pulse" />
        <span className="text-sm font-black tracking-wider uppercase">
          Kỷ Lục Cá Nhân
        </span>
      </div>

      {!summary || summary.total_sessions === 0 ? (
        // Beautiful "Not Played Yet" State
        <div className="relative z-10 flex flex-col items-center justify-center py-10 px-4 border-2 border-dashed border-zinc-300 dark:border-slate-800 bg-zinc-50/50 dark:bg-slate-950/40 text-center rounded-none group hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors duration-300">
          <div className="w-12 h-12 bg-zinc-100 dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-none flex items-center justify-center mb-4 text-zinc-400 dark:text-slate-600 transition-transform group-hover:scale-110 group-hover:rotate-6 duration-300">
            <Sparkles className="w-6 h-6 text-zinc-400 dark:text-slate-500" />
          </div>
          <h4 className="text-xs font-black uppercase text-zinc-700 dark:text-slate-350 mb-2">
            Chưa bắt đầu hành trình
          </h4>
          <p className="text-[11px] text-zinc-500 dark:text-slate-400 leading-relaxed max-w-xs font-bold">
            Hãy tham gia trận thi đấu đầu tiên để lưu dấu ấn và lập kỷ lục của bạn trên bảng vàng!
          </p>
        </div>
      ) : (
        // Premium Personal Best Statistics Grid
        <div className="relative z-10 grid grid-cols-2 gap-4">
          {/* Highest Score */}
          <div className="bg-zinc-50 dark:bg-slate-950 border-2 border-zinc-900 dark:border-slate-800 p-3 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-slate-400 text-[10px] font-extrabold tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>ĐIỂM CAO NHẤT</span>
            </div>
            <div className="mt-2 text-cyan-600 dark:text-cyan-400 text-lg font-black tracking-wide">
              {summary.highest_points} PTS
            </div>
          </div>

          {/* Highest Tier Reached */}
          <div className="bg-zinc-50 dark:bg-slate-950 border-2 border-zinc-900 dark:border-slate-800 p-3 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-slate-400 text-[10px] font-extrabold tracking-wider">
              <Award className="w-3.5 h-3.5 text-indigo-500" />
              <span>ẢI CAO NHẤT</span>
            </div>
            <div className="mt-2 text-zinc-800 dark:text-slate-200 text-xs font-black tracking-wide">
              {getTierLabel(summary.highest_tier)}
            </div>
          </div>

          {/* Sessions Played (Completed / Total) */}
          <div className="bg-zinc-50 dark:bg-slate-950 border-2 border-zinc-900 dark:border-slate-800 p-3 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-slate-400 text-[10px] font-extrabold tracking-wider">
              <Gamepad2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>HOÀN THÀNH</span>
            </div>
            <div className="mt-2 text-zinc-800 dark:text-slate-200 text-xs font-black tracking-wide">
              {summary.completed_sessions} / {summary.total_sessions} trận
            </div>
          </div>

          {/* Total Gold Earned */}
          <div className="bg-zinc-50 dark:bg-slate-950 border-2 border-zinc-900 dark:border-slate-800 p-3 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-slate-400 text-[10px] font-extrabold tracking-wider">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>VÀNG TÍCH LŨY</span>
            </div>
            <div className="mt-2 text-amber-500 text-xs font-black tracking-wide flex items-center gap-1">
              🪙 {summary.total_gold_earned} VÀNG
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
