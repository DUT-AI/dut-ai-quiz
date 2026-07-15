"use client";

import React from "react";
import { Trophy } from "lucide-react";
import { useGameLeaderboard } from "../queries";

interface GameLeaderboardProps {
  lessonSlug: string;
  variant?: "retro" | "modern";
}

export default function GameLeaderboard({ lessonSlug, variant = "retro" }: GameLeaderboardProps) {
  const { data: leaderboard = [], isLoading } = useGameLeaderboard(lessonSlug);

  const isModern = variant === "modern";

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center py-10 ${isModern ? "font-sans" : "font-mono"}`}>
        <div className={`size-8 border-3 ${isModern ? "border-primary" : "border-amber-500"} border-t-transparent animate-spin rounded-full mb-3`} />
        <span className={`text-xs ${isModern ? "text-gray-navy dark:text-light-blue font-bold" : "text-zinc-500 dark:text-zinc-400 font-extrabold"} animate-pulse`}>
          ĐANG TẢI BẢNG XẾP HẠNG...
        </span>
      </div>
    );
  }

  const containerClasses = isModern
    ? "w-full bg-white dark:bg-navy-blue/40 border border-gray-150 dark:border-white/10 p-6 rounded-[2.5rem] font-sans text-dark-blue dark:text-white shadow-xl flex flex-col h-full"
    : "w-full bg-white dark:bg-navy-blue border-3 border-zinc-900 dark:border-zinc-700 p-4 font-mono text-zinc-900 dark:text-zinc-100 shadow-md";

  const headerClasses = isModern
    ? "flex items-center gap-2 border-b border-gray-150 dark:border-white/10 pb-3 mb-4"
    : "flex items-center gap-2 border-b-2 border-zinc-900 dark:border-zinc-700 pb-2 mb-3";

  const headerTitleClasses = isModern
    ? "text-base font-black text-dark-blue dark:text-white uppercase tracking-wider"
    : "text-sm font-extrabold tracking-wider";

  const tableHeaderClasses = isModern
    ? "border-b border-gray-100 dark:border-white/5 text-gray-navy dark:text-light-blue opacity-70 font-bold"
    : "border-b border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 font-extrabold";

  const tableRowClasses = isModern
    ? "hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-semibold"
    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors font-bold";

  const tableBorderClasses = isModern
    ? "divide-y divide-gray-100 dark:divide-white/5"
    : "divide-y divide-zinc-100 dark:divide-zinc-800/50";

  return (
    <div className={containerClasses}>
      <div className={headerClasses}>
        <Trophy className={`w-5 h-5 ${isModern ? "text-primary" : "text-amber-500"}`} />
        <span className={headerTitleClasses}>
          BẢNG VÀNG DŨNG SĨ
        </span>
      </div>

      {leaderboard.length === 0 ? (
        <div className={`text-center py-8 text-xs ${isModern ? "text-gray-navy dark:text-light-blue opacity-50 font-medium" : "text-zinc-400 dark:text-zinc-500 font-bold"}`}>
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

                const modernRankColors = [
                  "bg-amber-100 text-amber-650 dark:bg-amber-950/40 dark:text-amber-400 font-black",
                  "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-300 font-black",
                  "bg-orange-100 text-orange-650 dark:bg-orange-950/40 dark:text-orange-400 font-black",
                ];

                return (
                  <tr
                    key={row.user_id}
                    className={tableRowClasses}
                  >
                    <td className="py-2 pr-2 text-center">
                      {isTop3 ? (
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 border ${
                            isModern 
                              ? `rounded-full border-transparent text-[10px] ${modernRankColors[idx]}` 
                              : `border-2 text-[10px] ${retroRankColors[idx]}`
                          }`}
                        >
                          {idx + 1}
                        </span>
                      ) : (
                        <span className={isModern ? "text-gray-navy dark:text-light-blue opacity-70" : "text-zinc-500 dark:text-zinc-400"}>
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
                            className={
                              isModern 
                                ? "size-6 rounded-full border border-gray-150 dark:border-white/10 object-cover"
                                : "size-5 rounded-none border border-zinc-900 dark:border-zinc-700 object-cover"
                            }
                          />
                        ) : (
                          <div className={
                            isModern
                              ? "size-6 bg-indigo-550/10 rounded-full border border-gray-150 dark:border-white/10 flex items-center justify-center text-[9px] text-indigo-550 font-black"
                              : "size-5 bg-zinc-200 dark:bg-zinc-800 border border-zinc-900 dark:border-zinc-700 flex items-center justify-center text-[9px] text-zinc-500 font-bold"
                          }>
                            DS
                          </div>
                        )}
                        <span className={`truncate max-w-[120px] sm:max-w-none ${isModern ? "text-dark-blue dark:text-white" : "text-zinc-900 dark:text-zinc-200"}`}>
                          {row.username || `Dũng Sĩ #${row.user_id}`}
                        </span>
                      </div>
                    </td>
                    <td className={`py-2 text-right ${isModern ? "text-primary font-black" : "text-cyan-600 dark:text-cyan-400"}`}>
                      {row.final_score.toFixed(0)} PTS
                    </td>
                    <td className="py-2 text-right text-amber-500 font-black">
                      🪙{row.gold}
                    </td>
                    <td className={`py-2 text-right hidden sm:table-cell ${isModern ? "text-gray-navy dark:text-light-blue opacity-70" : "text-zinc-500 dark:text-zinc-400"}`}>
                      {row.total_time_response.toFixed(1)}s
                    </td>
                    <td className={`py-2 text-right hidden sm:table-cell ${isModern ? "text-gray-navy dark:text-light-blue opacity-70" : "text-zinc-500 dark:text-zinc-400"}`}>
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
