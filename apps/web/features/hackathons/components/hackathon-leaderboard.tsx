"use client";

import React from "react";
import { formatDateTime } from "@/lib/utils";
import { Medal, Trophy } from "lucide-react";
import { useHackathonLeaderboard, useHackathonSubmissionEvents } from "../queries";
import { cn } from "@/lib/utils";
import type { HackathonTask } from "../types";

interface HackathonLeaderboardProps {
  hackathonId: string;
  tasks: HackathonTask[];
}

export function HackathonLeaderboard({ hackathonId, tasks }: HackathonLeaderboardProps) {
  const { data: leaderboard = [], isLoading } = useHackathonLeaderboard(hackathonId);
  useHackathonSubmissionEvents(hackathonId, true); // keep real-time updates active

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-3">
        <div className="size-6 border-2 border-primary border-t-transparent animate-spin rounded-full" />
        <span className="text-sm font-medium text-gray-navy/60">Đang tải bảng xếp hạng...</span>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl bg-white/50 dark:bg-white/[0.01]">
        <Trophy className="size-10 text-gray-navy/20 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-navy/60 dark:text-light-blue/50">Chưa có ai nộp bài thành công.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-navy-blue mt-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-white/[0.02] text-xs font-bold text-gray-navy/60 dark:text-light-blue/60 border-b border-gray-200 dark:border-white/10">
            <tr>
              <th className="px-6 py-4 w-20 text-center">Hạng</th>
              <th className="px-6 py-4">Đội / Người thi</th>
              {tasks.map((task, i) => (
                <th key={task.id} className="px-6 py-4 text-center">
                  Bài {i + 1}
                </th>
              ))}
              <th className="px-6 py-4 text-center">Thời gian Inference</th>
              <th className="px-6 py-4 text-right">Tổng điểm</th>
              <th className="px-6 py-4 text-right">Cập nhật cuối</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {leaderboard.map((row) => {
              const isTop3 = row.rank <= 3;
              return (
                <tr
                  key={row.participant_id}
                  className={cn(
                    "hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors",
                    row.rank === 1 && "bg-amber-50/30 dark:bg-amber-900/10",
                    row.rank === 2 && "bg-slate-100/30 dark:bg-slate-800/20",
                    row.rank === 3 && "bg-orange-50/30 dark:bg-orange-900/10"
                  )}
                >
                  <td className="px-6 py-4 text-center">
                    {row.rank === 1 ? (
                      <Trophy className="size-5 text-amber-500 mx-auto" />
                    ) : row.rank === 2 ? (
                      <Medal className="size-5 text-slate-400 mx-auto" />
                    ) : row.rank === 3 ? (
                      <Medal className="size-5 text-orange-400 mx-auto" />
                    ) : (
                      <span className="font-bold text-gray-navy/60 dark:text-light-blue/50">{row.rank}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-navy-blue dark:text-white">
                      {row.participant_type === "team" ? `Team ${row.team_id?.substring(0, 8)}` : `Thí sinh ${row.user_id}`}
                    </div>
                    <div className="text-xs text-gray-navy/60 dark:text-light-blue/50">
                      ID: {row.participant_type === "team" ? row.team_id : row.user_id}
                    </div>
                  </td>
                  {tasks.map((task) => {
                    const score = row.task_scores?.[task.id];
                    return (
                      <td key={task.id} className="px-6 py-4 text-center">
                        <span className={cn(
                          "inline-flex px-2 py-0.5 rounded-md text-xs font-bold",
                          score !== null && score !== undefined ? "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white" : "text-gray-400 dark:text-gray-600"
                        )}>
                          {score !== null && score !== undefined ? Number(score).toFixed(4) : "-"}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 text-center text-gray-navy/70 dark:text-light-blue/70">
                    {row.total_inference_time ? `${row.total_inference_time.toFixed(4)}s` : "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex px-2.5 py-1 bg-primary/10 text-primary font-bold rounded-lg text-sm">
                      {typeof row.total_score === "number" ? row.total_score.toFixed(4) : row.total_score}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-navy/70 dark:text-light-blue/70">
                    {formatDateTime(row.updated_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
