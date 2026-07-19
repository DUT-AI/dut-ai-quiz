"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Trophy, Crown, Medal, Coins, Clock, Gamepad2, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GameFireworks from "./game-fireworks";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Prevent background scrolling while modal is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

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

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans">
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-white/70 dark:bg-black/75 backdrop-blur-md"
      />

      {/* Fireworks canvas animation overlay */}
      <GameFireworks />

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
            {/* Top 3 Podium Cards */}
            {top3.length > 0 && (
              <div className="relative flex items-end justify-center gap-3 md:gap-8 py-6 border-b border-gray-100 dark:border-white/5 pb-8 max-w-xl mx-auto w-full">
                
                {/* Neon floor and reflection lines under columns */}
                <div className="absolute bottom-[2px] left-[5%] right-[5%] h-[2.5px] bg-gradient-to-r from-transparent via-indigo-500/40 dark:via-indigo-400/40 to-transparent blur-[1px] pointer-events-none" />
                <div className="absolute bottom-0 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-purple-500/25 to-transparent pointer-events-none" />

                {/* 2nd Place (Left - Silver) */}
                <div className="flex flex-col items-center flex-1 max-w-[120px] relative group/pod-item">
                  {top3[1] ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      whileHover={{ y: -4 }}
                      className="flex flex-col items-center text-center w-full"
                    >
                      <div className="relative mb-2 mt-4">
                        <motion.div
                          animate={{ y: [0, -3, 0] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                          className="absolute -top-6 left-1/2 -translate-x-1/2 text-slate-500 dark:text-slate-300 z-20"
                        >
                          <Medal className="size-5 md:size-6 fill-slate-100 dark:fill-slate-800 drop-shadow" />
                        </motion.div>

                        {top3[1].avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={top3[1].avatar_url}
                            alt={top3[1].username || "Dũng Sĩ"}
                            className="size-12 md:size-16 rounded-full object-cover border-2 border-slate-350 dark:border-slate-500 shadow-md group-hover/pod-item:shadow-slate-400/20"
                          />
                        ) : (
                          <div className="size-12 md:size-16 bg-slate-250 dark:bg-slate-855 rounded-full border-2 border-slate-350 dark:border-slate-500 flex items-center justify-center text-xs font-black text-slate-500">
                            DS
                          </div>
                        )}
                      </div>
                      <h5 className="text-[10px] md:text-xs font-black truncate max-w-full text-dark-blue dark:text-zinc-200 px-1">
                        {top3[1].username || `Dũng Sĩ #${top3[1].user_id}`}
                      </h5>
                      <span className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 font-extrabold mb-2">
                        {top3[1].final_score.toFixed(0)} PTS
                      </span>
                    </motion.div>
                  ) : (
                    <div className="h-16 w-full" />
                  )}
                  {/* Visual Podium Column */}
                  <div className="w-full h-18 md:h-24 bg-slate-100/30 dark:bg-white/[0.05] bg-gradient-to-t from-slate-400/30 via-slate-400/10 to-transparent dark:from-slate-500/25 dark:via-slate-500/10 dark:to-transparent border-t-2 border-x-0 border-b-0 border-sky-400 dark:border-t-sky-300 rounded-t-2xl flex items-center justify-center relative shadow-[0_0_15px_rgba(148,163,184,0.08)] dark:shadow-[0_0_25px_rgba(148,163,184,0.12)] transition-all duration-300 group-hover/pod-item:border-t-sky-300 dark:group-hover/pod-item:border-t-sky-200 group-hover/pod-item:shadow-[0_0_30px_rgba(148,163,184,0.2)]">
                    <span className="text-3xl md:text-5xl font-black text-sky-600 dark:text-sky-300 select-none font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(56,189,248,0.4)]">
                      2
                    </span>
                  </div>
                </div>

                {/* 1st Place (Center - Main Gold Card) */}
                <div className="flex flex-col items-center flex-1 max-w-[140px] z-10 relative group/pod-item">
                  {top3[0] ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      whileHover={{ y: -4 }}
                      className="flex flex-col items-center text-center w-full relative"
                    >
                      {/* Gold crown and sparkles decoration */}
                      <div className="relative mb-2 mt-4">
                        <motion.div
                          animate={{ y: [0, -3, 0] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                          className="absolute -top-6 left-1/2 -translate-x-1/2 text-amber-500 z-20"
                        >
                          <Crown className="size-6 md:size-7 fill-amber-500 drop-shadow" />
                        </motion.div>
                        
                        <motion.div
                          animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
                          transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                          className="absolute -top-7 -right-3 text-amber-400"
                        >
                          <Sparkles className="size-3 fill-amber-400" />
                        </motion.div>
                        <motion.div
                          animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.8, 1, 0.8] }}
                          transition={{ repeat: Infinity, duration: 1.8, delay: 0.5 }}
                          className="absolute -top-6 -left-5 text-amber-400"
                        >
                          <Sparkles className="size-2.5 fill-amber-500" />
                        </motion.div>

                        {top3[0].avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={top3[0].avatar_url}
                            alt={top3[0].username || "Dũng Sĩ"}
                            className="size-16 md:size-20 rounded-full object-cover border-4 border-amber-400 dark:border-amber-500 shadow-lg group-hover/pod-item:shadow-amber-500/25"
                          />
                        ) : (
                          <div className="size-16 md:size-20 bg-amber-500/10 dark:bg-amber-950/20 rounded-full border-4 border-amber-400 dark:border-amber-500 flex items-center justify-center text-sm font-black text-amber-600 dark:text-amber-400">
                            DS
                          </div>
                        )}
                      </div>
                      <h5 className="text-xs md:text-sm font-black truncate max-w-full text-dark-blue dark:text-white px-1">
                        {top3[0].username || `Dũng Sĩ #${top3[0].user_id}`}
                      </h5>
                      <span className="text-[10px] md:text-xs text-amber-650 dark:text-amber-400 font-extrabold mb-2">
                        {top3[0].final_score.toFixed(0)} PTS
                      </span>
                    </motion.div>
                  ) : (
                    <div className="h-16 w-full" />
                  )}
                  {/* Visual Podium Column */}
                  <div className="w-full h-24 md:h-32 bg-slate-100/30 dark:bg-white/[0.05] bg-gradient-to-t from-amber-500/30 via-amber-500/15 to-transparent dark:from-amber-500/25 dark:via-amber-500/10 dark:to-transparent border-t-4 border-x-0 border-b-0 border-amber-400 dark:border-t-amber-400 rounded-t-2xl flex items-center justify-center relative shadow-[0_0_15px_rgba(245,158,11,0.1)] dark:shadow-[0_0_25px_rgba(245,158,11,0.15)] transition-all duration-300 group-hover/pod-item:border-t-amber-300 dark:group-hover/pod-item:border-t-amber-300 group-hover/pod-item:shadow-[0_0_30px_rgba(245,158,11,0.25)]">
                    <span className="text-4xl md:text-6xl font-black text-amber-600 dark:text-amber-300 select-none font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                      1
                    </span>
                  </div>
                </div>

                {/* 3rd Place (Right - Bronze) */}
                <div className="flex flex-col items-center flex-1 max-w-[120px] relative group/pod-item">
                  {top3[2] ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      whileHover={{ y: -4 }}
                      className="flex flex-col items-center text-center w-full"
                    >
                      <div className="relative mb-2 mt-4">
                        <motion.div
                          animate={{ y: [0, -3, 0] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                          className="absolute -top-5 left-1/2 -translate-x-1/2 text-orange-700 dark:text-orange-400 z-20"
                        >
                          <Medal className="size-4 md:size-5 fill-orange-100 dark:fill-orange-900/60 drop-shadow" />
                        </motion.div>

                        {top3[2].avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={top3[2].avatar_url}
                            alt={top3[2].username || "Dũng Sĩ"}
                            className="size-10 md:size-14 rounded-full object-cover border-2 border-orange-400/60 dark:border-orange-500 shadow-md group-hover/pod-item:shadow-orange-500/20"
                          />
                        ) : (
                          <div className="size-10 md:size-14 bg-orange-500/10 dark:bg-orange-950/20 rounded-full border-2 border-orange-400 dark:border-orange-600 flex items-center justify-center text-xs font-black text-orange-600 dark:text-orange-500">
                            DS
                          </div>
                        )}
                      </div>
                      <h5 className="text-[10px] md:text-xs font-black truncate max-w-full text-dark-blue dark:text-zinc-300 px-1">
                        {top3[2].username || `Dũng Sĩ #${top3[2].user_id}`}
                      </h5>
                      <span className="text-[9px] md:text-[10px] text-orange-500 dark:text-orange-400 font-extrabold mb-2">
                        {top3[2].final_score.toFixed(0)} PTS
                      </span>
                    </motion.div>
                  ) : (
                    <div className="h-16 w-full" />
                  )}
                  {/* Visual Podium Column */}
                  <div className="w-full h-12 md:h-16 bg-slate-100/30 dark:bg-white/[0.05] bg-gradient-to-t from-orange-500/30 via-orange-500/15 to-transparent dark:from-orange-550/25 dark:via-orange-550/10 dark:to-transparent border-t-2 border-x-0 border-b-0 border-orange-400 dark:border-t-orange-400 rounded-t-2xl flex items-center justify-center relative shadow-[0_0_15px_rgba(249,115,22,0.08)] dark:shadow-[0_0_25px_rgba(249,115,22,0.12)] transition-all duration-300 group-hover/pod-item:border-t-orange-300 dark:group-hover/pod-item:border-t-orange-300 group-hover/pod-item:shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                    <span className="text-2xl md:text-4xl font-black text-orange-600 dark:text-orange-300 select-none font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]">
                      3
                    </span>
                  </div>
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
    </div>,
    document.body
  );
}
