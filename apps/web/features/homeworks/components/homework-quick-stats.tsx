"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";
import { HomeworkSubmission } from "../types";

interface HomeworkQuickStatsProps {
  submissions: HomeworkSubmission[];
}

export function HomeworkQuickStats({ submissions }: HomeworkQuickStatsProps) {
  const stats = useMemo(() => {
    const graded = submissions.filter((s) => s.status === "GRADED");
    const gradedCount = graded.length;

    let passRateText = "—";
    if (gradedCount > 0) {
      const passCount = graded.filter((s) => s.is_pass).length;
      passRateText = `${Math.round((passCount / gradedCount) * 100)}%`;
    }

    let avgScoreText = "—";
    if (gradedCount > 0) {
      const sum = graded.reduce((acc, s) => acc + (s.score || 0), 0);
      avgScoreText = `${(sum / gradedCount).toFixed(1)}/10`;
    }

    return {
      totalSubmissions: submissions.length,
      passRateText,
      avgScoreText,
    };
  }, [submissions]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/10 shadow-sm space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-navy/70 dark:text-light-blue/60 flex items-center justify-between">
          <span>Tổng số bài nộp</span>
          <Users className="size-3.5 text-primary" />
        </p>
        <p className="text-2xl font-black text-dark-blue dark:text-white">
          {stats.totalSubmissions} <span className="text-sm font-semibold text-gray-navy/70">bài</span>
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/10 shadow-sm space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-navy/70 dark:text-light-blue/60">
          Tỷ lệ đạt (Pass)
        </p>
        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
          {stats.passRateText}
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/10 shadow-sm space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-navy/70 dark:text-light-blue/60">
          Điểm trung bình
        </p>
        <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
          {stats.avgScoreText}
        </p>
      </div>
    </div>
  );
}
