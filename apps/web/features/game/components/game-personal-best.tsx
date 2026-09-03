"use client";

import React from "react";
import { Trophy, Coins, Gamepad2, Award, Sparkles, User, Crosshair } from "lucide-react";
import { motion } from "framer-motion";
import { useGameHistorySummary } from "../queries";

interface GamePersonalBestProps {
  lessonSlug: string;
  variant?: "retro" | "modern";
}

export default function GamePersonalBest({ lessonSlug, variant = "retro" }: GamePersonalBestProps) {
  const { data: summaries = [], isLoading } = useGameHistorySummary();

  const summary = summaries.find((s) => s.lesson_slug === lessonSlug);

  const getTierLabel = (tier: number) => {
    if (tier === 1) return "Tầng 1 (Dễ)";
    if (tier === 2) return "Tầng 2 (Vừa)";
    if (tier >= 3) return "Tầng 3 (Khó)";
    return `Tầng ${tier}`;
  };

  if (variant === "modern") {
    if (isLoading) {
      return (
        <div className="w-full bg-white/40 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2.5rem] shadow-lg animate-pulse">
          <div className="h-6 bg-zinc-200 dark:bg-zinc-850 w-1/4 mb-6 rounded-md" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-800/40 rounded-2xl" />
            ))}
          </div>
        </div>
      );
    }

    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.08,
        },
      },
    };

    const cardItemVariants = {
      hidden: { opacity: 0, scale: 0.95, y: 10 },
      visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
    };

    return (
      <div className="w-full bg-white/60 dark:bg-[#1E2A3A]/20 backdrop-blur-md border border-gray-150/80 dark:border-white/5 p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden transition-all duration-300">
        {/* Hologram Grid Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.015)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
        
        {/* Glow corners inside card */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

        {/* HUD Header */}
        <div className="flex items-center justify-between border-b border-zinc-150 dark:border-white/10 pb-4 mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl border border-indigo-500/20 dark:border-indigo-500/30">
              <Crosshair className="w-5 h-5 text-indigo-500 dark:text-indigo-400 animate-spin" style={{ animationDuration: "16s" }} />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest text-indigo-600 dark:text-indigo-400 uppercase font-mono block">
                PLAYER PROFILE SUMMARY
              </span>
              <span className="text-sm font-black tracking-tight text-zinc-800 dark:text-white uppercase font-sans">
                Kỷ Lục Cá Nhân
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-100/80 dark:bg-white/5 rounded-full border border-zinc-200 dark:border-white/10 text-[10px] font-mono font-bold text-zinc-550 dark:text-gray-400">
            <User className="size-3 text-indigo-500 dark:text-indigo-400" />
            <span>ACTIVE COMMANDER</span>
          </div>
        </div>

        {!summary || summary.total_sessions === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 border border-dashed border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02] text-center rounded-2xl group hover:border-indigo-500/50 transition-colors duration-300 relative z-10">
            <div className="w-12 h-12 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-2xl flex items-center justify-center mb-4 text-indigo-500 dark:text-indigo-400 transition-transform group-hover:scale-110 duration-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-zinc-800 dark:text-white mb-2 font-sans">
              Chưa bắt đầu hành trình
            </h4>
            <p className="text-xs text-zinc-500 dark:text-gray-400 leading-relaxed max-w-xs font-medium font-sans">
              Hãy tham gia trận thi đấu đầu tiên để lưu dấu ấn và lập kỷ lục của bạn trên bảng vàng!
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10"
          >
            {/* Highest Score */}
            <motion.div
              variants={cardItemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-zinc-50/40 dark:bg-white/[0.03] border border-zinc-200/65 dark:border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-cyan-500/50 dark:hover:border-cyan-500/50 hover:bg-white dark:hover:bg-white/[0.06] hover:shadow-md transition-all duration-300 relative group/item"
            >
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-[10px] font-black tracking-widest font-mono">
                <Trophy className="w-4 h-4" />
                <span>MAX SCORE</span>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono tracking-tight text-zinc-800 dark:text-white group-hover:text-cyan-650 dark:group-hover:text-cyan-400 transition-colors">
                  {summary.highest_points}
                </span>
                <span className="text-xs font-bold text-zinc-400 dark:text-gray-500">PTS</span>
              </div>
              {/* Micro Status Bar */}
              <div className="mt-3 w-full h-1 bg-zinc-200 dark:bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, (summary.highest_points / 200) * 100)}%` }} />
              </div>
            </motion.div>

            {/* Highest Tier Reached */}
            <motion.div
              variants={cardItemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-zinc-50/40 dark:bg-white/[0.03] border border-zinc-200/65 dark:border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:bg-white dark:hover:bg-white/[0.06] hover:shadow-md transition-all duration-300 relative group/item"
            >
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-black tracking-widest font-mono">
                <Award className="w-4 h-4" />
                <span>MAX CHALLENGE</span>
              </div>
              <div className="mt-4 text-sm font-black font-sans text-zinc-800 dark:text-white group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">
                {getTierLabel(summary.highest_tier)}
              </div>
              {/* Dot Indicators */}
              <div className="mt-3 flex gap-1.5 items-center">
                {[1, 2, 3].map((t) => (
                  <div
                    key={t}
                    className={`size-2 rounded-full ${
                      summary.highest_tier >= t
                        ? t === 1
                          ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                          : t === 2
                          ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                          : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                        : "bg-zinc-200 dark:bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </motion.div>

            {/* Sessions Played (Completed / Total) */}
            <motion.div
              variants={cardItemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-zinc-50/40 dark:bg-white/[0.03] border border-zinc-200/65 dark:border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:bg-white dark:hover:bg-white/[0.06] hover:shadow-md transition-all duration-300 relative group/item"
            >
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[10px] font-black tracking-widest font-mono">
                <Gamepad2 className="w-4 h-4" />
                <span>WIN RATE</span>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-xl font-black font-mono text-zinc-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {summary.completed_sessions}
                </span>
                <span className="text-xs font-bold text-zinc-400 dark:text-gray-500">/ {summary.total_sessions} TRẬN</span>
              </div>
              {/* Real completed percentage progress bar */}
              <div className="mt-3 w-full h-1 bg-zinc-200 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(summary.completed_sessions / Math.max(1, summary.total_sessions)) * 100}%` }}
                />
              </div>
            </motion.div>

            {/* Total Gold Earned */}
            <motion.div
              variants={cardItemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-zinc-50/40 dark:bg-white/[0.03] border border-zinc-200/65 dark:border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:bg-white dark:hover:bg-white/[0.06] hover:shadow-md transition-all duration-300 relative group/item"
            >
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 text-[10px] font-black tracking-widest font-mono">
                <Coins className="w-4 h-4" />
                <span>ACCUMULATED GOLD</span>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-xl font-black font-mono text-amber-500 dark:text-amber-400">
                  🪙 {summary.total_gold_earned}
                </span>
                <span className="text-xs font-bold text-zinc-400 dark:text-gray-500">GOLD</span>
              </div>
              {/* Progress Bar */}
              <div className="mt-3 w-full h-1 bg-zinc-200 dark:bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full animate-pulse" style={{ width: `${Math.min(100, (summary.total_gold_earned / 5000) * 100)}%` }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full bg-white dark:bg-navy-blue border-3 border-zinc-900 dark:border-zinc-700 p-6 font-mono text-zinc-900 dark:text-zinc-100 shadow-md animate-pulse">
        <div className="h-6 bg-zinc-200 dark:bg-zinc-800 w-1/2 mb-6" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-navy-blue border-3 border-zinc-900 dark:border-zinc-700 p-6 font-mono text-zinc-900 dark:text-zinc-100 shadow-md relative overflow-hidden transition-all duration-300">
      {/* Decorative background grid pattern for premium feel */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />

      <div className="flex items-center gap-2 border-b-2 border-zinc-900 dark:border-zinc-700 pb-3 mb-5 relative z-10">
        <Award className="w-6 h-6 text-amber-500 animate-pulse" />
        <span className="text-sm font-black tracking-wider uppercase">
          Kỷ Lục Cá Nhân
        </span>
      </div>

      {!summary || summary.total_sessions === 0 ? (
        // Beautiful "Not Played Yet" State
        <div className="relative z-10 flex flex-col items-center justify-center py-10 px-4 border-2 border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-center rounded-none group hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors duration-300">
          <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none flex items-center justify-center mb-4 text-zinc-400 dark:text-zinc-505 transition-transform group-hover:scale-110 group-hover:rotate-6 duration-300">
            <Sparkles className="w-6 h-6 text-zinc-400 dark:text-zinc-505" />
          </div>
          <h4 className="text-xs font-black uppercase text-zinc-700 dark:text-zinc-400 mb-2">
            Chưa bắt đầu hành trình
          </h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs font-bold">
            Hãy tham gia trận thi đấu đầu tiên để lưu dấu ấn và lập kỷ lục của bạn trên bảng vàng!
          </p>
        </div>
      ) : (
        // Premium Personal Best Statistics Grid
        <div className="relative z-10 grid grid-cols-2 gap-4">
          {/* Highest Score */}
          <div className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-800 p-3 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-[10px] font-extrabold tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>ĐIỂM CAO NHẤT</span>
            </div>
            <div className="mt-2 text-cyan-600 dark:text-cyan-400 text-lg font-black tracking-wide">
              {summary.highest_points} PTS
            </div>
          </div>

          {/* Highest Tier Reached */}
          <div className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-800 p-3 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-[10px] font-extrabold tracking-wider">
              <Award className="w-3.5 h-3.5 text-indigo-500" />
              <span>ẢI CAO NHẤT</span>
            </div>
            <div className="mt-2 text-zinc-800 dark:text-zinc-200 text-xs font-black tracking-wide">
              {getTierLabel(summary.highest_tier)}
            </div>
          </div>

          {/* Sessions Played (Completed / Total) */}
          <div className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-800 p-3 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-[10px] font-extrabold tracking-wider">
              <Gamepad2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>HOÀN THÀNH</span>
            </div>
            <div className="mt-2 text-zinc-800 dark:text-zinc-200 text-xs font-black tracking-wide">
              {summary.completed_sessions} / {summary.total_sessions} trận
            </div>
          </div>

          {/* Total Gold Earned */}
          <div className="bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-800 p-3 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-zinc-550 dark:text-zinc-400 text-[10px] font-extrabold tracking-wider">
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
