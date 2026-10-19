"use client";

import React from "react";
import { motion } from "framer-motion";
import { Trophy, Clock, Swords, Award, AlertCircle, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { useUserMatchHistory } from "../queries";
import { UserMatchHistoryItem } from "../types";

interface GameUserMatchHistoryViewProps {
  lessonSlug: string;
  userId: number;
  initialUsername?: string | null;
  initialAvatarUrl?: string | null;
  onSelectMatch: (match: UserMatchHistoryItem) => void;
}

export const GameUserMatchHistoryView: React.FC<GameUserMatchHistoryViewProps> = ({
  lessonSlug,
  userId,
  initialUsername,
  initialAvatarUrl,
  onSelectMatch,
}) => {
  const { data, isLoading, error } = useUserMatchHistory(lessonSlug, userId);

  const username = data?.username || initialUsername || `Dũng Sĩ #${userId}`;
  const avatarUrl = data?.avatar_url || initialAvatarUrl;

  if (isLoading) {
    return (
      <div className="space-y-4 py-6">
        <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50/50 dark:bg-navy-blue/20 border border-gray-100 dark:border-white/5 animate-pulse">
          <div className="size-12 rounded-full bg-indigo-500/10 dark:bg-white/10" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-1/3 bg-indigo-500/10 dark:bg-white/10 rounded" />
            <div className="h-3 w-1/4 bg-gray-150 dark:bg-white/5 rounded" />
          </div>
        </div>
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-3xl bg-slate-50/40 dark:bg-navy-blue/10 border border-gray-100 dark:border-white/5 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
        <AlertCircle className="size-10 text-rose-500/80 animate-bounce" />
        <p className="text-sm font-bold text-gray-navy dark:text-light-blue/70">
          Không thể tải lịch sử thi đấu của dũng sĩ này. Vui lòng thử lại sau!
        </p>
      </div>
    );
  }

  const { history, total_attempts, highest_score, total_gold } = data;

  return (
    <div className="space-y-6">
      {/* Player Header Summary Card */}
      <div className="p-4 md:p-5 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-500/15 dark:via-purple-500/10 dark:to-transparent border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={username}
              className="size-12 rounded-full border-2 border-indigo-500/30 object-cover shadow-sm"
            />
          ) : (
            <div className="size-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-550 dark:text-indigo-400 font-black text-sm border-2 border-indigo-500/30">
              DS
            </div>
          )}
          <div>
            <h3 className="text-base md:text-lg font-black text-dark-blue dark:text-white leading-tight">
              {username}
            </h3>
            <p className="text-xs text-gray-navy dark:text-light-blue/60 font-medium flex items-center gap-1.5 mt-0.5">
              <span>Đã hoàn thành {total_attempts} lượt thi</span>
            </p>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="flex items-center gap-4 text-xs font-black">
          <div className="flex items-center gap-1.5 bg-primary/10 dark:bg-primary/20 text-primary px-3 py-1.5 rounded-2xl">
            <Trophy className="size-3.5" />
            <span>Kỷ lục: {highest_score.toFixed(0)} PTS</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 px-3 py-1.5 rounded-2xl">
            <span>🪙 {total_gold} Vàng</span>
          </div>
        </div>
      </div>

      {/* Match History List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-gray-navy dark:text-light-blue/60 px-1">
          <span>DANH SÁCH CÁC LƯỢT THI ({history.length})</span>
          <span className="text-[11px] text-gray-400">Bấm vào lượt thi để xem chi tiết</span>
        </div>

        {history.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-2.5 rounded-3xl border border-dashed border-gray-200 dark:border-white/10 p-6">
            <Swords className="size-8 text-gray-navy/40 dark:text-light-blue/30" />
            <p className="text-sm font-bold text-gray-navy dark:text-light-blue/70">
              Dũng sĩ chưa có lượt thi đấu nào được ghi nhận trong bài học này.
            </p>
          </div>
        ) : (
          history.map((match) => {
            const formattedDate = new Date(match.started_at).toLocaleString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });

            return (
              <motion.button
                key={match.id}
                whileHover={{ scale: 1.01, x: 3 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSelectMatch(match)}
                className="w-full text-left p-4 rounded-3xl border bg-slate-50/60 dark:bg-navy-blue/20 hover:bg-slate-100/70 dark:hover:bg-white/5 border-gray-100 dark:border-white/5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group/item cursor-pointer"
              >
                {/* Left: Attempt Number & Timestamp */}
                <div className="flex items-center gap-3.5">
                  <div className="size-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-550 dark:text-indigo-400 font-black text-xs shrink-0 group-hover/item:bg-indigo-500 group-hover/item:text-white transition-colors">
                    #{match.attempt_number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-dark-blue dark:text-white">
                        Lượt thi #{match.attempt_number}
                      </span>
                      {match.is_completed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="size-3" /> Hoàn thành
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                          <XCircle className="size-3" /> Game Over
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-navy dark:text-light-blue/50 font-medium mt-0.5">
                      {formattedDate}
                    </p>
                  </div>
                </div>

                {/* Right: Metrics & Arrow */}
                <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-gray-100 dark:border-white/5 text-xs font-black">
                  <div className="flex items-center gap-3">
                    <span className="text-primary bg-primary/10 dark:bg-primary/20 px-3 py-1 rounded-full text-xs">
                      {match.final_score.toFixed(0)} PTS
                    </span>
                    <span className="text-amber-500">
                      🪙 {match.gold}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-navy dark:text-light-blue/60 text-[11px] font-semibold">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3 text-indigo-500" />
                      {match.total_time_response.toFixed(1)}s
                    </span>
                    <span className="flex items-center gap-1 text-emerald-500 font-bold">
                      <Award className="size-3" />
                      {match.accuracy_percentage.toFixed(0)}%
                    </span>
                  </div>

                  <ChevronRight className="size-4 text-gray-400 group-hover/item:text-indigo-500 group-hover/item:translate-x-1 transition-all shrink-0 hidden sm:block" />
                </div>
              </motion.button>
            );
            })
          )}
      </div>
    </div>
  );
};
