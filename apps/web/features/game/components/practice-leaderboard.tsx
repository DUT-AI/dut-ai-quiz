"use client";

import React from "react";
import { Trophy, Clock, Coins, Swords, Shield } from "lucide-react";
import { useGameLeaderboard } from "../queries";

interface PracticeLeaderboardProps {
  lessonSlug: string;
}

export default function PracticeLeaderboard({ lessonSlug }: PracticeLeaderboardProps) {
  const { data: leaderboard = [], isLoading } = useGameLeaderboard(lessonSlug);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 font-mono">
        <div className="size-8 border-3 border-amber-500 border-t-transparent animate-spin rounded-full mb-3" />
        <span className="text-xs text-zinc-500 dark:text-slate-400 font-extrabold animate-pulse">
          ĐANG TẢI BẢNG XẾP HẠNG...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-slate-900 border-3 border-zinc-900 dark:border-slate-700 p-4 font-mono text-zinc-900 dark:text-slate-100 shadow-md">
      <div className="flex items-center gap-2 border-b-2 border-zinc-900 dark:border-slate-700 pb-2 mb-3">
        <Trophy className="w-5 h-5 text-amber-500" />
        <span className="text-sm font-extrabold tracking-wider">
          BẢNG VÀNG DŨNG SĨ
        </span>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-8 text-xs text-zinc-400 dark:text-slate-500 font-bold">
          Chưa có dũng sĩ nào ghi danh trên bảng vàng.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-slate-800 text-zinc-500 dark:text-slate-400 font-extrabold">
                <th className="py-2 pr-2 text-center w-10">Hạng</th>
                <th className="py-2">Dũng Sĩ</th>
                <th className="py-2 text-right">Điểm Số</th>
                <th className="py-2 text-right">Vàng</th>
                <th className="py-2 text-right hidden sm:table-cell">Thời Gian</th>
                <th className="py-2 text-right hidden sm:table-cell">Lượt Chơi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-slate-800/50">
              {leaderboard.map((row, idx) => {
                const isTop3 = idx < 3;
                const rankColors = [
                  "bg-amber-400 border-zinc-900 text-zinc-900 font-black", // 1st Gold
                  "bg-slate-300 border-zinc-900 text-zinc-900 font-black", // 2nd Silver
                  "bg-amber-600 border-zinc-900 text-white font-black", // 3rd Bronze
                ];

                return (
                  <tr
                    key={row.user_id}
                    className="hover:bg-zinc-50 dark:hover:bg-slate-800/40 transition-colors font-bold"
                  >
                    <td className="py-2 pr-2 text-center">
                      {isTop3 ? (
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 border-2 text-[10px] ${rankColors[idx]}`}
                        >
                          {idx + 1}
                        </span>
                      ) : (
                        <span className="text-zinc-500 dark:text-slate-400">{idx + 1}</span>
                      )}
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        {row.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.avatar_url}
                            alt={row.username || "Dũng Sĩ"}
                            className="size-5 rounded-none border border-zinc-900 dark:border-slate-700 object-cover"
                          />
                        ) : (
                          <div className="size-5 bg-zinc-200 dark:bg-slate-800 border border-zinc-900 dark:border-slate-700 flex items-center justify-center text-[9px] text-zinc-500 font-bold">
                            DS
                          </div>
                        )}
                        <span className="truncate max-w-[120px] sm:max-w-none text-zinc-900 dark:text-slate-200">
                          {row.username || `Dũng Sĩ #${row.user_id}`}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 text-right text-cyan-600 dark:text-cyan-400">
                      {row.final_score.toFixed(0)} PTS
                    </td>
                    <td className="py-2 text-right text-amber-500">
                      🪙{row.gold}
                    </td>
                    <td className="py-2 text-right text-zinc-500 dark:text-slate-400 hidden sm:table-cell">
                      {row.total_time_response.toFixed(1)}s
                    </td>
                    <td className="py-2 text-right text-zinc-500 dark:text-slate-400 hidden sm:table-cell">
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
