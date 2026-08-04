"use client";

import { useMemo } from "react";
import {
  Users,
  Award,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Clock
} from "lucide-react";
import { Homework, HomeworkSubmission } from "../types";
import { Card, CardContent } from "@/components/ui/card";

interface SubmissionsStatsProps {
  homework: Homework;
  submissions: HomeworkSubmission[];
}

export function SubmissionsStats({ homework, submissions }: SubmissionsStatsProps) {
  const stats = useMemo(() => {
    const uniqueUsersCount = new Set(submissions.map((s) => s.user_id)).size;
    const totalSubmissions = submissions.length;

    const gradedSubmissions = submissions.filter((s) => s.status === "GRADED");
    const gradedCount = gradedSubmissions.length;

    const averageScore = gradedCount > 0
      ? (gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedCount).toFixed(1)
      : "—";

    const passCount = gradedSubmissions.filter((s) => s.is_pass).length;
    const passRate = gradedCount > 0
      ? Math.round((passCount / gradedCount) * 100)
      : 0;

    const lateCount = submissions.filter((s) => s.is_late).length;
    const plagiarismCount = submissions.filter((s) => s.is_plagiarized).length;

    return {
      uniqueUsersCount,
      totalSubmissions,
      averageScore,
      passRate,
      lateCount,
      plagiarismCount,
    };
  }, [submissions]);

  const cards = [
    {
      title: "Số học viên đã nộp",
      value: `${stats.uniqueUsersCount}`,
      description: `Tổng số ${stats.totalSubmissions} lượt nộp bài`,
      icon: Users,
      color: "from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30",
    },
    {
      title: "Điểm trung bình",
      value: stats.averageScore,
      description: "Tính trên các bài đã chấm",
      icon: Award,
      color: "from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-900/30",
    },
    {
      title: "Tỷ lệ đạt",
      value: `${stats.passRate}%`,
      description: `Đạt yêu cầu bài tập`,
      icon: CheckCircle,
      color: "from-green-500/10 to-emerald-500/10 text-green dark:text-green border-green/20 dark:border-green/30",
    },
    {
      title: "Cần lưu ý",
      value: `${stats.lateCount + stats.plagiarismCount}`,
      description: `${stats.lateCount} nộp trễ, ${stats.plagiarismCount} đạo văn`,
      icon: AlertTriangle,
      color: "from-amber-500/10 to-red-500/10 text-amber-500 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <Card
            key={i}
            className="overflow-hidden border border-gray-150 bg-white/50 dark:border-white/10 dark:bg-zinc-900/40 backdrop-blur-sm shadow-none"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-navy dark:text-light-blue/60">
                    {card.title}
                  </p>
                  <p className="text-2xl font-black text-dark-blue dark:text-white">
                    {card.value}
                  </p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br border ${card.color}`}>
                  <Icon className="size-6" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs text-gray-navy/80 dark:text-light-blue/70 font-semibold">
                {card.title === "Cần lưu ý" && (stats.lateCount > 0 || stats.plagiarismCount > 0) ? (
                  <span className="flex items-center gap-1 text-red dark:text-red/90 animate-pulse">
                    <Clock className="size-3" />
                    {card.description}
                  </span>
                ) : (
                  <span>{card.description}</span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
