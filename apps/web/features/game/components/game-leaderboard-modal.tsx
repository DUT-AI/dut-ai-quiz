"use client";

import React from "react";
import { Trophy, Crown, Medal, Coins, Clock, Gamepad2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LeaderboardRow {
  user_id: number;
  username?: string | null;
  avatar_url?: string | null;
  final_score: number;
  gold: number;
  total_time_response: number;
  attempt_count: number;
}

interface GameLeaderboardModalProps {
  lessonSlug: string;
  leaderboard: LeaderboardRow[];
  onClose: () => void;
}

export default function GameLeaderboardModal({
  leaderboard,
  onClose,
}: GameLeaderboardModalProps) {
  const top3 = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans">
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-white/70 dark:bg-black/75 backdrop-blur-md"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="bg-white dark:bg-navy-blue w-full max-w-4xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-gray-150 dark:border-white/10 max-h-[90vh] md:max-h-[85vh] flex flex-col transition-all duration-300"
      >
        {/* Glowing backdrop blobs */}
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-transparent blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-pink-500/10 via-amber-500/5 to-transparent blur-3xl rounded-full pointer-events-none" />

        <div className="p-6 md:p-8 flex flex-col flex-1 min-h-0 overflow-hidden relative z-10">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4 mb-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-550 dark:text-indigo-400">
                <Trophy className="size-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-dark-blue dark:text-white uppercase tracking-wide">
                  Bảng Vàng Dũng Sĩ
                </h2>
                <p className="text-xs text-gray-navy dark:text-light-blue/60 font-medium">
                  Danh sách vinh danh tất cả dũng sĩ tham gia đấu trường
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-gray-55/50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-navy dark:text-light-blue transition-colors border border-gray-150 dark:border-white/5"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto pr-1 md:pr-2 custom-scrollbar space-y-8 pb-4">
            
            {/* Podium (Top 3) */}
            {top3.length > 0 && (
              <div className="grid grid-cols-3 gap-3 md:gap-6 items-end justify-center py-4 max-w-2xl mx-auto border-b border-gray-100 dark:border-white/5 pb-8">
                
                {/* 2nd Place (Left) */}
                <div className="flex flex-col items-center">
                  {top3[1] ? (
                    <motion.div
                      whileHover={{ y: -5 }}
                      className="w-full flex flex-col items-center p-4 rounded-3xl border border-indigo-500/15 dark:border-indigo-400/20 bg-gradient-to-br from-indigo-500/[0.07] via-purple-500/[0.03] to-pink-500/[0.07] dark:from-indigo-500/[0.12] dark:via-purple-500/[0.04] dark:to-pink-500/[0.12] hover:from-indigo-500/[0.12] hover:via-purple-500/[0.06] hover:to-pink-500/[0.12] text-center shadow-md relative"
                    >
                      <div className="absolute -top-4 bg-zinc-200/90 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-zinc-300 dark:border-zinc-700">
                        HẠNG 2
                      </div>
                      <div className="relative mt-2">
                        {top3[1].avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={top3[1].avatar_url || undefined}
                            alt={top3[1].username || "Dũng Sĩ"}
                            className="size-16 md:size-20 rounded-full object-cover border-2 border-zinc-350 dark:border-zinc-500 shadow-md"
                          />
                        ) : (
                          <div className="size-16 md:size-20 bg-zinc-250 dark:bg-zinc-850 rounded-full border-2 border-zinc-350 dark:border-zinc-500 flex items-center justify-center text-sm font-black text-zinc-500">
                            DS
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-zinc-400 dark:bg-zinc-500 text-white rounded-full p-1 border border-white dark:border-navy-blue shadow">
                          <Medal className="size-4" />
                        </div>
                      </div>
                      <h4 className="mt-3 text-xs md:text-sm font-black text-dark-blue dark:text-zinc-200 text-wrap break-words max-w-full leading-snug">
                        {top3[1].username || `Dũng Sĩ #${top3[1].user_id}`}
                      </h4>
                      <span className="text-[10px] md:text-xs text-zinc-650 dark:text-zinc-300 font-black mt-1.5 bg-zinc-500/10 dark:bg-zinc-400/25 px-2 py-0.5 rounded-full border border-zinc-300/10 dark:border-zinc-500/10">
                        {top3[1].final_score.toFixed(0)} PTS
                      </span>
                    </motion.div>
                  ) : (
                    <div className="w-full opacity-20 border border-dashed border-gray-300 dark:border-white/5 rounded-3xl h-28" />
                  )}
                </div>

                {/* 1st Place (Center) */}
                <div className="flex flex-col items-center">
                  {top3[0] && (
                    <motion.div
                      whileHover={{ y: -5 }}
                      className="w-full flex flex-col items-center p-5 rounded-3xl border border-indigo-500/20 dark:border-indigo-400/25 bg-gradient-to-br from-indigo-500/[0.09] via-purple-500/[0.04] to-pink-500/[0.09] dark:from-indigo-500/[0.15] dark:via-purple-500/[0.05] dark:to-pink-500/[0.15] hover:from-indigo-500/[0.14] hover:via-purple-500/[0.07] hover:to-pink-500/[0.14] text-center shadow-xl relative pb-6 z-20"
                    >
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="absolute -top-8 text-amber-500 animate-pulse"
                      >
                        <Crown className="size-9 fill-amber-500" />
                      </motion.div>
                      <div className="absolute -top-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-3 py-0.5 rounded-full border border-amber-600 shadow-md">
                        TRẠNG NGUYÊN
                      </div>
                      <div className="relative mt-3">
                        {top3[0].avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={top3[0].avatar_url || undefined}
                            alt={top3[0].username || "Dũng Sĩ"}
                            className="size-20 md:size-24 rounded-full object-cover border-4 border-amber-450 dark:border-amber-500 shadow-lg"
                          />
                        ) : (
                          <div className="size-20 md:size-24 bg-amber-100/50 dark:bg-amber-950/20 rounded-full border-4 border-amber-450 dark:border-amber-500 flex items-center justify-center text-lg font-black text-amber-600 dark:text-amber-400">
                            DS
                          </div>
                        )}
                      </div>
                      <h3 className="mt-3 text-sm md:text-base font-black text-dark-blue dark:text-white text-wrap break-words max-w-full leading-snug">
                        {top3[0].username || `Dũng Sĩ #${top3[0].user_id}`}
                      </h3>
                      <span className="text-xs md:text-sm text-amber-650 dark:text-amber-400 font-black mt-1.5 bg-amber-500/10 dark:bg-amber-400/25 px-3 py-0.5 rounded-full border border-amber-500/10 dark:border-amber-400/10">
                        {top3[0].final_score.toFixed(0)} PTS
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* 3rd Place (Right) */}
                <div className="flex flex-col items-center">
                  {top3[2] ? (
                    <motion.div
                      whileHover={{ y: -5 }}
                      className="w-full flex flex-col items-center p-4 rounded-3xl border border-indigo-500/15 dark:border-indigo-400/20 bg-gradient-to-br from-indigo-500/[0.07] via-purple-500/[0.03] to-pink-500/[0.07] dark:from-indigo-500/[0.12] dark:via-purple-500/[0.04] dark:to-pink-500/[0.12] hover:from-indigo-500/[0.12] hover:via-purple-500/[0.06] hover:to-pink-500/[0.12] text-center shadow-md relative"
                    >
                      <div className="absolute -top-4 bg-orange-200/90 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-orange-300 dark:border-orange-900">
                        HẠNG 3
                      </div>
                      <div className="relative mt-2">
                        {top3[2].avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={top3[2].avatar_url || undefined}
                            alt={top3[2].username || "Dũng Sĩ"}
                            className="size-14 md:size-16 rounded-full object-cover border-2 border-orange-400/60 dark:border-orange-500 shadow-md"
                          />
                        ) : (
                          <div className="size-14 md:size-16 bg-orange-100/50 dark:bg-orange-950/20 rounded-full border-2 border-orange-450 dark:border-orange-600 flex items-center justify-center text-xs font-black text-orange-600 dark:text-orange-450">
                            DS
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-orange-500 dark:bg-orange-600 text-white rounded-full p-1 border border-white dark:border-navy-blue shadow animate-pulse">
                          <Medal className="size-4" />
                        </div>
                      </div>
                      <h4 className="mt-3 text-xs md:text-sm font-black text-dark-blue dark:text-zinc-200 text-wrap break-words max-w-full leading-snug">
                        {top3[2].username || `Dũng Sĩ #${top3[2].user_id}`}
                      </h4>
                      <span className="text-[10px] md:text-xs text-orange-650 dark:text-orange-400 font-black mt-1.5 bg-orange-500/10 dark:bg-orange-400/25 px-2 py-0.5 rounded-full border border-orange-500/10 dark:border-orange-400/10">
                        {top3[2].final_score.toFixed(0)} PTS
                      </span>
                    </motion.div>
                  ) : (
                    <div className="w-full opacity-20 border border-dashed border-gray-300 dark:border-white/5 rounded-3xl h-28" />
                  )}
                </div>

              </div>
            )}

            {/* Complete Rankings List Table */}
            <div className="w-full">
              <h4 className="text-sm font-black text-dark-blue dark:text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Gamepad2 className="size-4 text-indigo-500" />
                Danh sách chi tiết xếp hạng
              </h4>
              
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col gap-2.5 w-full"
              >
                {leaderboard.map((row, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;
                  
                  return (
                    <motion.div
                      key={row.user_id}
                      variants={rowVariants}
                      whileHover={{ scale: 1.01, x: 4 }}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-3xl border transition-all text-sm ${
                        isTop3 
                          ? "bg-indigo-500/5 dark:bg-indigo-400/5 border-indigo-500/20" 
                          : "bg-slate-50/50 dark:bg-navy-blue/20 hover:bg-slate-50 dark:hover:bg-white/5 border-gray-100 dark:border-white/5"
                      }`}
                    >
                      {/* Left Block: Rank & User Profile */}
                      <div className="flex items-center gap-4">
                        <span className={`w-8 text-center font-black text-sm ${
                          rank === 1 ? "text-amber-500" : rank === 2 ? "text-zinc-450 dark:text-zinc-300" : rank === 3 ? "text-orange-500" : "text-gray-navy dark:text-light-blue/50"
                        }`}>
                          #{rank}
                        </span>

                        {row.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.avatar_url || undefined}
                            alt={row.username || "Dũng Sĩ"}
                            className="size-8 rounded-full border border-gray-150 dark:border-white/10 object-cover shadow-sm"
                          />
                        ) : (
                          <div className="size-8 bg-indigo-500/10 dark:bg-indigo-400/5 rounded-full border border-gray-150 dark:border-white/10 flex items-center justify-center text-[10px] text-indigo-550 dark:text-indigo-400 font-black">
                            DS
                          </div>
                        )}

                        <span className="text-dark-blue dark:text-white font-black text-wrap break-all max-w-[200px] sm:max-w-none leading-snug">
                          {row.username || `Dũng Sĩ #${row.user_id}`}
                        </span>
                      </div>

                      {/* Right Block: Complete Metrics */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-white/5 font-black text-xs">
                        {/* Score and Gold */}
                        <div className="flex items-center gap-4">
                          <span className="text-primary bg-primary/10 dark:bg-primary/20 px-3 py-1 rounded-full text-xs">
                            {row.final_score.toFixed(0)} PTS
                          </span>
                          <span className="text-amber-500 flex items-center gap-1">
                            🪙 {row.gold} Vàng
                          </span>
                        </div>

                        {/* Extra details */}
                        <div className="flex items-center gap-4 text-gray-navy dark:text-light-blue/70 font-semibold text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <Clock className="size-3 text-indigo-500" /> {row.total_time_response.toFixed(1)}s
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Gamepad2 className="size-3 text-emerald-500" /> {row.attempt_count} lượt
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

          </div>
        </div>

      </motion.div>
    </div>
  );
}
