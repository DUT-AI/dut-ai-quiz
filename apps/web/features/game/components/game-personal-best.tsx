"use client";

import React from "react";
import { Trophy, Coins, Gamepad2, Award, Sparkles } from "lucide-react";
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
        <div className="w-full bg-white dark:bg-navy-blue/40 border border-gray-150 dark:border-white/10 p-6 rounded-[2rem] shadow-lg animate-pulse">
          <div className="h-6 bg-zinc-200 dark:bg-zinc-800 w-1/2 mb-6 rounded-md" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-zinc-100 dark:bg-zinc-800/40 rounded-2xl" />
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
      <div className="w-full bg-white/60 dark:bg-[#1E2A3A]/20 backdrop-blur-md border border-gray-150/80 dark:border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden transition-all duration-300">
        {/* Glow corner inside card */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/5 dark:bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="flex items-center gap-2 border-b border-gray-150/80 dark:border-white/10 pb-3 mb-5 relative z-10">
          <div className="p-1.5 bg-amber-500/10 dark:bg-amber-500/5 rounded-lg border border-amber-500/20">
            <Award className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <span className="text-sm font-black tracking-tight text-dark-blue dark:text-white uppercase">
            Kỷ Lục Cá Nhân
          </span>
        </div>

        {!summary || summary.total_sessions === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-zinc-950/20 text-center rounded-2xl group hover:border-indigo-500/50 transition-colors duration-300 relative z-10">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4 text-indigo-500 transition-transform group-hover:scale-110 duration-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-dark-blue dark:text-white mb-2">
              Chưa bắt đầu hành trình
            </h4>
            <p className="text-xs text-gray-navy dark:text-light-blue opacity-75 leading-relaxed max-w-xs font-medium">
              Hãy tham gia trận thi đấu đầu tiên để lưu dấu ấn và lập kỷ lục của bạn trên bảng vàng!
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-4 relative z-10"
          >
            {/* Highest Score */}
            <motion.div
              variants={cardItemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white/40 dark:bg-[#1E2A3A]/30 border border-gray-100 dark:border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-cyan-500/40 dark:hover:border-cyan-500/30 hover:bg-gradient-to-br hover:from-white hover:to-cyan-50/20 dark:hover:from-[#1E2A3A]/40 dark:hover:to-cyan-950/10 hover:shadow-lg hover:shadow-cyan-500/5 dark:hover:shadow-cyan-950/15 transition-all duration-300 shadow-sm"
            >
              <div className="flex items-center gap-2 text-gray-navy dark:text-light-blue/70 text-[11px] font-black tracking-wider">
                <div className="p-1.5 bg-cyan-500/10 dark:bg-cyan-500/5 rounded-lg">
                  <Trophy className="w-3.5 h-3.5 text-cyan-500" />
                </div>
                <span>ĐIỂM CAO NHẤT</span>
              </div>
              <div className="mt-3 text-cyan-600 dark:text-cyan-400 text-xl font-black tracking-wide">
                {summary.highest_points} <span className="text-xs font-bold text-gray-navy dark:text-light-blue/50">PTS</span>
              </div>
            </motion.div>

            {/* Highest Tier Reached */}
            <motion.div
              variants={cardItemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white/40 dark:bg-[#1E2A3A]/30 border border-gray-100 dark:border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-500/40 dark:hover:border-indigo-500/30 hover:bg-gradient-to-br hover:from-white hover:to-indigo-50/20 dark:hover:from-[#1E2A3A]/40 dark:hover:to-indigo-950/10 hover:shadow-lg hover:shadow-indigo-500/5 dark:hover:shadow-indigo-950/15 transition-all duration-300 shadow-sm"
            >
              <div className="flex items-center gap-2 text-gray-navy dark:text-light-blue/70 text-[11px] font-black tracking-wider">
                <div className="p-1.5 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-lg">
                  <Award className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <span>ẢI CAO NHẤT</span>
              </div>
              <div className="mt-3 text-dark-blue dark:text-indigo-200 text-sm font-black tracking-wide">
                {getTierLabel(summary.highest_tier)}
              </div>
            </motion.div>

            {/* Sessions Played (Completed / Total) */}
            <motion.div
              variants={cardItemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white/40 dark:bg-[#1E2A3A]/30 border border-gray-100 dark:border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/40 dark:hover:border-emerald-500/30 hover:bg-gradient-to-br hover:from-white hover:to-emerald-50/20 dark:hover:from-[#1E2A3A]/40 dark:hover:to-emerald-950/10 hover:shadow-lg hover:shadow-emerald-500/5 dark:hover:shadow-emerald-950/15 transition-all duration-300 shadow-sm"
            >
              <div className="flex items-center gap-2 text-gray-navy dark:text-light-blue/70 text-[11px] font-black tracking-wider">
                <div className="p-1.5 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-lg">
                  <Gamepad2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <span>HOÀN THÀNH</span>
              </div>
              <div className="mt-3 text-dark-blue dark:text-emerald-400 text-sm font-black tracking-wide">
                {summary.completed_sessions} / {summary.total_sessions} <span className="text-xs font-bold text-gray-navy dark:text-light-blue/50">trận</span>
              </div>
            </motion.div>

            {/* Total Gold Earned */}
            <motion.div
              variants={cardItemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white/40 dark:bg-[#1E2A3A]/30 border border-gray-100 dark:border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/40 dark:hover:border-amber-500/30 hover:bg-gradient-to-br hover:from-white hover:to-amber-50/20 dark:hover:from-[#1E2A3A]/40 dark:hover:to-amber-950/10 hover:shadow-lg hover:shadow-amber-500/5 dark:hover:shadow-amber-950/15 transition-all duration-300 shadow-sm"
            >
              <div className="flex items-center gap-2 text-gray-navy dark:text-light-blue/70 text-[11px] font-black tracking-wider">
                <div className="p-1.5 bg-amber-500/10 dark:bg-amber-500/5 rounded-lg">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <span>VÀNG TÍCH LŨY</span>
              </div>
              <div className="mt-3 text-amber-500 text-sm font-black tracking-wide flex items-center gap-1">
                🪙 {summary.total_gold_earned} <span className="text-xs font-bold text-gray-navy dark:text-light-blue/50">Vàng</span>
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
          <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none flex items-center justify-center mb-4 text-zinc-400 dark:text-zinc-650 transition-transform group-hover:scale-110 group-hover:rotate-6 duration-300">
            <Sparkles className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
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
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-[10px] font-extrabold tracking-wider">
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
