"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Trophy,
  Crown,
  Medal,
  Clock,
  Gamepad2,
  X,
  Sparkles,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GameFireworks from "./game-fireworks";
import { GameUserMatchHistoryView } from "./game-user-match-history-view";
import { GameUserMatchMetricsView } from "./game-user-match-metrics-view";
import { UserMatchHistoryItem } from "../types";

interface LeaderboardRow {
  user_id: number;
  username?: string | null;
  avatar_url?: string | null;
  final_score: number;
  gold: number;
  total_time_response: number;
  attempt_count: number;
  is_completed?: boolean;
  total_questions?: number;
  answered_questions?: number;
}

interface GameLeaderboardModalProps {
  lessonSlug: string;
  leaderboard: LeaderboardRow[];
  onClose: () => void;
}

type ModalView = "LEADERBOARD" | "MATCH_HISTORY" | "MATCH_METRICS";

export default function GameLeaderboardModal({
  lessonSlug,
  leaderboard,
  onClose,
}: GameLeaderboardModalProps) {
  const [mounted, setMounted] = useState(false);
  const [currentView, setCurrentView] = useState<ModalView>("LEADERBOARD");
  const [selectedUser, setSelectedUser] = useState<{
    user_id: number;
    username?: string | null;
    avatar_url?: string | null;
  } | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<UserMatchHistoryItem | null>(null);

  useEffect(() => {
    setMounted(true);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleSelectUser = (row: LeaderboardRow) => {
    setSelectedUser({
      user_id: row.user_id,
      username: row.username,
      avatar_url: row.avatar_url,
    });
    setSelectedMatch(null);
    setCurrentView("MATCH_HISTORY");
  };

  const handleSelectMatch = (match: UserMatchHistoryItem) => {
    setSelectedMatch(match);
    setCurrentView("MATCH_METRICS");
  };

  const handleBack = () => {
    if (currentView === "MATCH_METRICS") {
      setSelectedMatch(null);
      setCurrentView("MATCH_HISTORY");
    } else if (currentView === "MATCH_HISTORY") {
      setSelectedUser(null);
      setCurrentView("LEADERBOARD");
    }
  };

  const handleClose = () => {
    setCurrentView("LEADERBOARD");
    setSelectedUser(null);
    setSelectedMatch(null);
    onClose();
  };

  const top3 = leaderboard.slice(0, 3);

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
        onClick={handleClose}
        className="absolute inset-0 bg-white/70 dark:bg-black/75 backdrop-blur-md"
      />

      {/* Fireworks canvas animation overlay */}
      {currentView === "LEADERBOARD" && <GameFireworks />}

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
          {/* Header with Breadcrumb Navigation */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4 mb-6 shrink-0">
            <div className="flex items-center gap-3">
              {currentView !== "LEADERBOARD" && (
                <button
                  onClick={handleBack}
                  className="p-2.5 rounded-2xl bg-gray-55/60 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-navy dark:text-light-blue transition-colors border border-gray-150 dark:border-white/5 mr-1"
                  title="Quay lại"
                >
                  <ArrowLeft className="size-5" />
                </button>
              )}

              <div className="size-11 rounded-2xl bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-550 dark:text-indigo-400 shrink-0">
                <Trophy className="size-6 animate-pulse" />
              </div>

              <div>
                {/* Breadcrumb Links */}
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-navy dark:text-light-blue/60 mb-0.5">
                  <button
                    onClick={() => {
                      setCurrentView("LEADERBOARD");
                      setSelectedUser(null);
                      setSelectedMatch(null);
                    }}
                    className={`hover:text-primary transition-colors ${
                      currentView === "LEADERBOARD"
                        ? "text-primary dark:text-primary font-black"
                        : "hover:underline cursor-pointer"
                    }`}
                  >
                    Bảng Vàng
                  </button>

                  {selectedUser && (
                    <>
                      <span className="text-gray-300 dark:text-white/20">/</span>
                      <button
                        onClick={() => {
                          setCurrentView("MATCH_HISTORY");
                          setSelectedMatch(null);
                        }}
                        className={`hover:text-primary transition-colors truncate max-w-[150px] sm:max-w-[200px] ${
                          currentView === "MATCH_HISTORY"
                            ? "text-primary dark:text-primary font-black"
                            : "hover:underline cursor-pointer"
                        }`}
                      >
                        {selectedUser.username || `Dũng Sĩ #${selectedUser.user_id}`}
                      </button>
                    </>
                  )}

                  {selectedMatch && (
                    <>
                      <span className="text-gray-300 dark:text-white/20">/</span>
                      <span className="text-primary dark:text-primary font-black">
                        Lượt #{selectedMatch.attempt_number}
                      </span>
                    </>
                  )}
                </div>

                <h2 className="text-xl md:text-2xl font-black text-dark-blue dark:text-white uppercase tracking-wide">
                  {currentView === "LEADERBOARD" && "Bảng Vàng Dũng Sĩ"}
                  {currentView === "MATCH_HISTORY" && "Lịch Sử Thi Đấu"}
                  {currentView === "MATCH_METRICS" && `Chi Tiết Lượt #${selectedMatch?.attempt_number}`}
                </h2>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2.5 rounded-full bg-gray-55/50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-navy dark:text-light-blue transition-colors border border-gray-150 dark:border-white/5"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Scrollable Content Container */}
          <div className="flex-1 overflow-y-auto pr-1 md:pr-2 custom-scrollbar pb-4">
            <AnimatePresence mode="wait">
              {/* VIEW 1: LEADERBOARD */}
              {currentView === "LEADERBOARD" && (
                <motion.div
                  key="leaderboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-8"
                >
                  {/* Top 3 Podium Cards (Visual only, non-clickable) */}
                  {top3.length > 0 && (
                    <div className="relative flex items-end justify-center gap-3 md:gap-8 py-6 border-b border-gray-100 dark:border-white/5 pb-8 max-w-xl mx-auto w-full">
                      {/* Neon floor lines */}
                      <div className="absolute bottom-[2px] left-[5%] right-[5%] h-[2.5px] bg-gradient-to-r from-transparent via-indigo-500/40 dark:via-indigo-400/40 to-transparent blur-[1px] pointer-events-none" />
                      <div className="absolute bottom-0 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-purple-500/25 to-transparent pointer-events-none" />

                      {/* 2nd Place (Left - Silver) */}
                      <div className="flex flex-col items-center flex-1 max-w-[120px] relative group/pod-item">
                        {top3[1] ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
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
                                  alt="Silver"
                                  className="size-12 md:size-14 rounded-full border-2 border-slate-300 dark:border-slate-600 object-cover shadow-lg"
                                />
                              ) : (
                                <div className="size-12 md:size-14 bg-slate-100 dark:bg-slate-800 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center font-black text-slate-700 dark:text-slate-300 text-sm shadow-lg">
                                  2
                                </div>
                              )}
                            </div>
                            <span className="font-bold text-xs text-dark-blue dark:text-white truncate max-w-full">
                              {top3[1].username || `Dũng Sĩ #${top3[1].user_id}`}
                            </span>
                            <span className="text-[11px] font-black text-primary">
                              {top3[1].final_score.toFixed(0)} PTS
                            </span>
                            <div className="w-full h-16 md:h-20 bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-t-2xl mt-2 flex items-center justify-center font-black text-lg text-slate-500 dark:text-slate-400">
                              #2
                            </div>
                          </motion.div>
                        ) : (
                          <div className="w-full h-16 md:h-20 opacity-20 bg-slate-100 dark:bg-slate-800 rounded-t-2xl" />
                        )}
                      </div>

                      {/* 1st Place (Center - Gold) */}
                      <div className="flex flex-col items-center flex-1 max-w-[140px] relative group/pod-item -mt-4">
                        {top3[0] ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center text-center w-full"
                          >
                            <div className="relative mb-2 mt-4">
                              <motion.div
                                animate={{ y: [0, -5, 0], rotate: [-2, 2, -2] }}
                                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                                className="absolute -top-7 left-1/2 -translate-x-1/2 text-amber-500 z-20"
                              >
                                <Crown className="size-7 md:size-8 fill-amber-400 drop-shadow-md" />
                              </motion.div>
                              {top3[0].avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={top3[0].avatar_url}
                                  alt="Gold"
                                  className="size-16 md:size-20 rounded-full border-4 border-amber-400 object-cover shadow-2xl ring-4 ring-amber-400/20"
                                />
                              ) : (
                                <div className="size-16 md:size-20 bg-amber-50 dark:bg-amber-950/40 rounded-full border-4 border-amber-400 flex items-center justify-center font-black text-amber-600 dark:text-amber-400 text-lg shadow-2xl ring-4 ring-amber-400/20">
                                  1
                                </div>
                              )}
                            </div>
                            <span className="font-black text-xs md:text-sm text-dark-blue dark:text-white truncate max-w-full">
                              {top3[0].username || `Dũng Sĩ #${top3[0].user_id}`}
                            </span>
                            <span className="text-xs font-black text-primary">
                              {top3[0].final_score.toFixed(0)} PTS
                            </span>
                            <div className="w-full h-24 md:h-28 bg-gradient-to-t from-amber-300 to-amber-200 dark:from-amber-600/40 dark:to-amber-500/40 rounded-t-2xl mt-2 flex items-center justify-center font-black text-2xl text-amber-700 dark:text-amber-300 shadow-inner">
                              #1
                            </div>
                          </motion.div>
                        ) : null}
                      </div>

                      {/* 3rd Place (Right - Bronze) */}
                      <div className="flex flex-col items-center flex-1 max-w-[120px] relative group/pod-item">
                        {top3[2] ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="flex flex-col items-center text-center w-full"
                          >
                            <div className="relative mb-2 mt-4">
                              <motion.div
                                animate={{ y: [0, -3, 0] }}
                                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                                className="absolute -top-6 left-1/2 -translate-x-1/2 text-orange-600 dark:text-orange-400 z-20"
                              >
                                <Medal className="size-5 md:size-6 fill-orange-200 dark:fill-orange-900 drop-shadow" />
                              </motion.div>
                              {top3[2].avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={top3[2].avatar_url}
                                  alt="Bronze"
                                  className="size-12 md:size-14 rounded-full border-2 border-orange-300 dark:border-orange-700 object-cover shadow-lg"
                                />
                              ) : (
                                <div className="size-12 md:size-14 bg-orange-50 dark:bg-orange-950/30 rounded-full border-2 border-orange-300 dark:border-orange-700 flex items-center justify-center font-black text-orange-700 dark:text-orange-400 text-sm shadow-lg">
                                  3
                                </div>
                              )}
                            </div>
                            <span className="font-bold text-xs text-dark-blue dark:text-white truncate max-w-full">
                              {top3[2].username || `Dũng Sĩ #${top3[2].user_id}`}
                            </span>
                            <span className="text-[11px] font-black text-primary">
                              {top3[2].final_score.toFixed(0)} PTS
                            </span>
                            <div className="w-full h-12 md:h-14 bg-gradient-to-t from-orange-200 to-orange-100 dark:from-orange-900/40 dark:to-orange-800/40 rounded-t-2xl mt-2 flex items-center justify-center font-black text-lg text-orange-700 dark:text-orange-400">
                              #3
                            </div>
                          </motion.div>
                        ) : (
                          <div className="w-full h-12 md:h-14 opacity-20 bg-orange-100 dark:bg-orange-950/20 rounded-t-2xl" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Leaderboard Table List (Clickable items) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-navy dark:text-light-blue/60 px-1">
                      <span>BẢNG XẾP HẠNG TẤT CẢ DŨNG SĨ ({leaderboard.length})</span>
                      <span className="text-[11px] text-gray-400">Bấm vào dũng sĩ để xem lịch sử thi</span>
                    </div>

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
                          <motion.button
                            key={row.user_id}
                            variants={rowVariants}
                            whileHover={{ scale: 1.01, x: 4 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => handleSelectUser(row)}
                            className={`w-full text-left flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-3xl border transition-all text-sm group/row cursor-pointer ${
                              isTop3
                                ? "bg-indigo-500/5 dark:bg-indigo-400/5 hover:bg-indigo-500/10 border-indigo-500/20"
                                : "bg-slate-50/50 dark:bg-navy-blue/20 hover:bg-slate-100/70 dark:hover:bg-white/5 border-gray-100 dark:border-white/5"
                            }`}
                          >
                            {/* Left Block: Rank & User Profile */}
                            <div className="flex items-center gap-4">
                              <span
                                className={`w-8 text-center font-black text-sm ${
                                  rank === 1
                                    ? "text-amber-500"
                                    : rank === 2
                                    ? "text-zinc-450 dark:text-zinc-300"
                                    : rank === 3
                                    ? "text-orange-500"
                                    : "text-gray-navy dark:text-light-blue/50"
                                }`}
                              >
                                #{rank}
                              </span>

                              {row.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={row.avatar_url || undefined}
                                  alt={row.username || "Dũng Sĩ"}
                                  className="size-8 rounded-full border border-gray-150 dark:border-white/10 object-cover shadow-sm group-hover/row:border-indigo-500/40 transition-colors"
                                />
                              ) : (
                                <div className="size-8 bg-indigo-500/10 dark:bg-indigo-400/5 rounded-full border border-gray-150 dark:border-white/10 flex items-center justify-center text-[10px] text-indigo-550 dark:text-indigo-400 font-black group-hover/row:border-indigo-500/40 transition-colors">
                                  DS
                                </div>
                              )}

                              <div className="flex flex-col">
                                <span className="text-dark-blue dark:text-white font-black text-wrap break-all max-w-[200px] sm:max-w-none leading-snug group-hover/row:text-primary transition-colors">
                                  {row.username || `Dũng Sĩ #${row.user_id}`}
                                </span>
                                <span className="text-[10px] text-gray-navy/60 dark:text-light-blue/40 font-medium sm:hidden">
                                  Bấm để xem lịch sử thi
                                </span>
                              </div>
                            </div>

                            {/* Right Block: Complete Metrics & Arrow */}
                            <div className="flex items-center justify-between sm:justify-end gap-5 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-white/5 font-black text-xs">
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
                                  <Clock className="size-3 text-indigo-500" />{" "}
                                  {row.total_time_response.toFixed(1)}s
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Gamepad2 className="size-3 text-emerald-500" />{" "}
                                  {row.attempt_count} lượt
                                </span>
                              </div>

                              <ChevronRight className="size-4 text-gray-400 group-hover/row:text-primary group-hover/row:translate-x-1 transition-all shrink-0 hidden sm:block" />
                            </div>
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* VIEW 2: MATCH HISTORY (TẦNG 2) */}
              {currentView === "MATCH_HISTORY" && selectedUser && (
                <motion.div
                  key="match-history"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <GameUserMatchHistoryView
                    lessonSlug={lessonSlug}
                    userId={selectedUser.user_id}
                    initialUsername={selectedUser.username}
                    initialAvatarUrl={selectedUser.avatar_url}
                    onSelectMatch={handleSelectMatch}
                  />
                </motion.div>
              )}

              {/* VIEW 3: MATCH METRICS (TẦNG 3) */}
              {currentView === "MATCH_METRICS" && selectedMatch && selectedUser && (
                <motion.div
                  key="match-metrics"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <GameUserMatchMetricsView
                    match={selectedMatch}
                    username={selectedUser.username || `Dũng Sĩ #${selectedUser.user_id}`}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
