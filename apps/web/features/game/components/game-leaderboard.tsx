"use client";

import React, { useState } from "react";
import { Trophy, Crown, Medal, Coins, Clock, Gamepad2, Maximize2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameLeaderboard } from "../queries";
import GameLeaderboardModal from "./game-leaderboard-modal";
import GameFireworks from "./game-fireworks";

interface GameLeaderboardProps {
  lessonSlug: string;
  variant?: "retro" | "modern";
}

export default function GameLeaderboard({ lessonSlug, variant = "retro" }: GameLeaderboardProps) {
  const { data: leaderboard = [], isLoading } = useGameLeaderboard(lessonSlug);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isModern = variant === "modern";

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${isModern ? "font-sans" : "font-mono"}`}>
        <div className={`size-10 border-4 ${isModern ? "border-primary" : "border-amber-500"} border-t-transparent animate-spin rounded-full mb-4`} />
        <span className={`text-xs ${isModern ? "text-gray-navy dark:text-light-blue font-black tracking-wider" : "text-zinc-500 dark:text-zinc-400 font-extrabold"} animate-pulse`}>
          ĐANG TẢI BẢNG XẾP HẠNG...
        </span>
      </div>
    );
  }

  // Modern Variant Design
  if (isModern) {
    const top3 = leaderboard.slice(0, 3);
    const remaining = leaderboard.slice(3);

    // Grid order: 2nd on left, 1st in center, 3rd on right
    const podiumItems = [
      { rank: 2, data: top3[1], color: "text-zinc-450 dark:text-zinc-300", bgClass: "bg-zinc-500/10 dark:bg-zinc-400/5", borderClass: "border-zinc-300/60 dark:border-zinc-700/50", glowClass: "shadow-zinc-500/5", avatarSize: "size-16 md:size-20" },
      { rank: 1, data: top3[0], color: "text-amber-500", bgClass: "bg-amber-500/10 dark:bg-amber-400/5", borderClass: "border-amber-400 dark:border-amber-600/60", glowClass: "shadow-amber-500/15 dark:shadow-amber-500/10", avatarSize: "size-20 md:size-24" },
      { rank: 3, data: top3[2], color: "text-orange-500", bgClass: "bg-orange-500/10 dark:bg-orange-400/5", borderClass: "border-orange-400/60 dark:border-orange-700/50", glowClass: "shadow-orange-500/5", avatarSize: "size-14 md:size-16" }
    ];

    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
      }
    };

    const rowVariants = {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
    };

    return (
      <>
        <div 
          onClick={() => setIsModalOpen(true)}
          className="w-full font-sans text-dark-blue dark:text-white flex flex-col h-full relative cursor-pointer group/card py-4 overflow-hidden rounded-3xl"
        >
          {/* Fireworks canvas animation directly on the card */}
          <GameFireworks />

          {/* Soft aura glow behind leaderboards */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/15 blur-3xl rounded-full pointer-events-none" />

          <div className="flex items-center justify-between border-b border-gray-150/80 dark:border-white/10 pb-3 mb-6 relative z-10">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-500/20 rounded-full text-xs font-black tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">
                <Trophy className="w-3.5 h-3.5" />
                <span>BẢNG VÀNG DŨNG SĨ</span>
              </div>
            </div>
            {leaderboard.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
                className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-navy dark:text-light-blue transition-colors flex items-center gap-1 group/expand"
                title="Xem bảng vàng đầy đủ"
              >
                <Maximize2 className="size-4 group-hover/expand:scale-110 transition-transform" />
              </button>
            )}
          </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-12 text-xs text-gray-navy dark:text-light-blue/50 font-bold relative z-10">
            Chưa có dũng sĩ nào ghi danh trên bảng vàng.
          </div>
        ) : (
          <div className="flex flex-col gap-6 relative z-10 flex-1 justify-between">
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

            {/* Rest of the leaderboard list */}
            {remaining.length > 0 ? (
              <motion.div
                variants={containerVariants}
                className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar"
              >
                {remaining.map((row, idx) => {
                  const actualRank = idx + 4;
                  return (
                    <motion.div
                      key={row.user_id}
                      variants={rowVariants}
                      whileHover={{ scale: 1.01, x: 3 }}
                      className="flex items-center justify-between p-3 bg-white/40 dark:bg-[#1E2A3A]/20 hover:bg-gradient-to-r hover:from-white hover:to-indigo-50/20 dark:hover:from-[#1E2A3A]/40 dark:hover:to-indigo-950/10 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-indigo-500/30 dark:hover:border-indigo-500/20 transition-all text-xs font-semibold"
                    >
                      {/* Left: Rank, Avatar and Username */}
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-center font-black text-gray-navy dark:text-light-blue/70">
                          {actualRank}
                        </span>
                        
                        {row.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.avatar_url}
                            alt={row.username || "Dũng Sĩ"}
                            className="size-7 rounded-full border border-gray-150 dark:border-white/10 object-cover"
                          />
                        ) : (
                          <div className="size-7 bg-indigo-500/10 dark:bg-indigo-400/5 rounded-full border border-gray-150 dark:border-white/10 flex items-center justify-center text-[9px] text-indigo-550 dark:text-indigo-400 font-black">
                            DS
                          </div>
                        )}
                        <span className="truncate max-w-[100px] sm:max-w-none text-dark-blue dark:text-white font-extrabold">
                          {row.username || `Dũng Sĩ #${row.user_id}`}
                        </span>
                      </div>

                      {/* Right: PTS, Gold, Response Time */}
                      <div className="flex items-center gap-3 md:gap-5 text-right font-black">
                        <div className="flex flex-col text-right">
                          <span className="text-indigo-650 dark:text-indigo-400 text-[11px] md:text-xs">
                            {row.final_score.toFixed(0)} PTS
                          </span>
                          <span className="text-[10px] text-amber-500 flex items-center justify-end gap-0.5">
                            🪙 {row.gold}
                          </span>
                        </div>
                        <div className="hidden sm:flex flex-col text-right text-[10px] text-gray-navy dark:text-light-blue/60 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" /> {row.total_time_response.toFixed(1)}s
                          </span>
                          <span className="flex items-center gap-1 justify-end">
                            <Gamepad2 className="size-3" /> {row.attempt_count} lượt
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              remaining.length === 0 && top3.length > 0 && (
                <div className="text-center text-[10px] text-gray-navy dark:text-light-blue/40 font-medium py-2">
                  Chỉ các dũng sĩ trên bục vinh quang hiện đang dẫn đầu!
                </div>
              )
            )}
          </div>
        )}

      </div>

        {/* Full-screen detailed rankings popup */}
        <AnimatePresence>
          {isModalOpen && (
            <GameLeaderboardModal
              lessonSlug={lessonSlug}
              leaderboard={leaderboard}
              onClose={() => setIsModalOpen(false)}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  // Retro Design (Untouched for compatibility)
  const containerClasses = "w-full bg-white dark:bg-navy-blue border-3 border-zinc-900 dark:border-zinc-700 p-4 font-mono text-zinc-900 dark:text-zinc-100 shadow-md";
  const headerClasses = "flex items-center gap-2 border-b-2 border-zinc-900 dark:border-zinc-700 pb-2 mb-3";
  const headerTitleClasses = "text-sm font-extrabold tracking-wider";
  const tableHeaderClasses = "border-b border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 font-extrabold";
  const tableRowClasses = "hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors font-bold";
  const tableBorderClasses = "divide-y divide-zinc-100 dark:divide-zinc-800/50";

  return (
    <div className={containerClasses}>
      <div className={headerClasses}>
        <Trophy className="w-5 h-5 text-amber-500" />
        <span className={headerTitleClasses}>
          BẢNG VÀNG DŨNG SĨ
        </span>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-8 text-xs text-zinc-450 dark:text-zinc-500 font-bold">
          Chưa có dũng sĩ nào ghi danh trên bảng vàng.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={tableHeaderClasses}>
                <th className="py-2 pr-2 text-center w-10">Hạng</th>
                <th className="py-2">Dũng Sĩ</th>
                <th className="py-2 text-right">Điểm Số</th>
                <th className="py-2 text-right">Vàng</th>
                <th className="py-2 text-right hidden sm:table-cell">Thời Gian</th>
                <th className="py-2 text-right hidden sm:table-cell">Lượt Chơi</th>
              </tr>
            </thead>
            <tbody className={tableBorderClasses}>
              {leaderboard.map((row, idx) => {
                const isTop3 = idx < 3;
                
                const retroRankColors = [
                  "bg-amber-400 border-zinc-900 text-zinc-900 font-black", // 1st Gold
                  "bg-zinc-300 border-zinc-900 text-zinc-900 font-black", // 2nd Silver
                  "bg-amber-600 border-zinc-900 text-white font-black", // 3rd Bronze
                ];

                return (
                  <tr
                    key={row.user_id}
                    className={tableRowClasses}
                  >
                    <td className="py-2 pr-2 text-center">
                      {isTop3 ? (
                        <span className={`inline-flex items-center justify-center w-6 h-6 border border-2 text-[10px] ${retroRankColors[idx]}`}>
                          {idx + 1}
                        </span>
                      ) : (
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {idx + 1}
                        </span>
                      )}
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        {row.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.avatar_url}
                            alt={row.username || "Dũng Sĩ"}
                            className="size-5 rounded-none border border-zinc-900 dark:border-zinc-700 object-cover"
                          />
                        ) : (
                          <div className="size-5 bg-zinc-200 dark:bg-zinc-800 border border-zinc-900 dark:border-zinc-700 flex items-center justify-center text-[9px] text-zinc-550 font-bold">
                            DS
                          </div>
                        )}
                        <span className="truncate max-w-[120px] sm:max-w-none text-zinc-900 dark:text-zinc-200">
                          {row.username || `Dũng Sĩ #${row.user_id}`}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 text-right text-cyan-600 dark:text-cyan-400">
                      {row.final_score.toFixed(0)} PTS
                    </td>
                    <td className="py-2 text-right text-amber-500 font-black">
                      🪙{row.gold}
                    </td>
                    <td className="py-2 text-right hidden sm:table-cell text-zinc-500 dark:text-zinc-400">
                      {row.total_time_response.toFixed(1)}s
                    </td>
                    <td className="py-2 text-right hidden sm:table-cell text-zinc-500 dark:text-zinc-400">
                      {row.attempt_count}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
