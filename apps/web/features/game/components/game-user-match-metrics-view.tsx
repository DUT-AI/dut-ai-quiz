"use client";

import React from "react";
import {
  Trophy,
  Clock,
  Award,
  Zap,
  Heart,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { UserMatchHistoryItem } from "../types";

interface GameUserMatchMetricsViewProps {
  match: UserMatchHistoryItem;
  username: string;
}

export const GameUserMatchMetricsView: React.FC<GameUserMatchMetricsViewProps> = ({
  match,
  username,
}) => {
  const formattedDate = new Date(match.started_at).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const incorrectCount = Math.max(0, match.total_questions - match.correct_count);

  return (
    <div className="space-y-6">
      {/* Match Overview Banner */}
      <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/5 border border-indigo-500/20 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-550 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full">
                Lượt thi #{match.attempt_number}
              </span>
              {match.is_completed ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="size-3.5" /> Hoàn thành bài thi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-full">
                  <XCircle className="size-3.5" /> Dừng bước giữa chừng
                </span>
              )}
            </div>
            <h3 className="text-lg md:text-xl font-black text-dark-blue dark:text-white">
              Thành tích của {username}
            </h3>
            <p className="text-xs text-gray-navy dark:text-light-blue/60 font-medium flex items-center gap-1.5 mt-1">
              <Calendar className="size-3.5" />
              <span>Thời điểm bắt đầu: {formattedDate}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-navy dark:text-light-blue/50 font-bold uppercase tracking-wider">
                Điểm chung cuộc
              </span>
              <span className="text-2xl md:text-3xl font-black text-primary">
                {match.final_score.toFixed(0)} <span className="text-sm font-bold">PTS</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Metric 1: Vàng */}
        <div className="p-4 rounded-3xl bg-slate-50/60 dark:bg-navy-blue/20 border border-gray-100 dark:border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-black">Vàng Kiếm Được</span>
            <span className="text-lg">🪙</span>
          </div>
          <span className="text-xl md:text-2xl font-black text-dark-blue dark:text-white">
            {match.gold}
          </span>
          <span className="text-[10px] text-gray-navy dark:text-light-blue/50 font-semibold mt-1">
            Thưởng sau lượt thi
          </span>
        </div>

        {/* Metric 2: Thời gian làm bài */}
        <div className="p-4 rounded-3xl bg-slate-50/60 dark:bg-navy-blue/20 border border-gray-100 dark:border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-500 mb-2">
            <span className="text-xs font-black">Thời Gian</span>
            <Clock className="size-4" />
          </div>
          <span className="text-xl md:text-2xl font-black text-dark-blue dark:text-white">
            {match.total_time_response.toFixed(1)}s
          </span>
          <span className="text-[10px] text-gray-navy dark:text-light-blue/50 font-semibold mt-1">
            Tổng thời gian phản hồi
          </span>
        </div>

        {/* Metric 3: Độ chính xác */}
        <div className="p-4 rounded-3xl bg-slate-50/60 dark:bg-navy-blue/20 border border-gray-100 dark:border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <span className="text-xs font-black">Độ Chính Xác</span>
            <Award className="size-4" />
          </div>
          <span className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {match.accuracy_percentage.toFixed(0)}%
          </span>
          <span className="text-[10px] text-gray-navy dark:text-light-blue/50 font-semibold mt-1">
            {match.correct_count}/{match.total_questions} câu trả lời đúng
          </span>
        </div>

        {/* Metric 4: Max Streak */}
        <div className="p-4 rounded-3xl bg-slate-50/60 dark:bg-navy-blue/20 border border-gray-100 dark:border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-orange-500 mb-2">
            <span className="text-xs font-black">Chuỗi Đúng (Streak)</span>
            <Zap className="size-4" />
          </div>
          <span className="text-xl md:text-2xl font-black text-dark-blue dark:text-white">
            {match.max_streak} 🔥
          </span>
          <span className="text-[10px] text-gray-navy dark:text-light-blue/50 font-semibold mt-1">
            Chuỗi đúng dài nhất
          </span>
        </div>
      </div>

      {/* Secondary Detailed Breakdown */}
      <div className="p-5 rounded-3xl bg-slate-50/40 dark:bg-navy-blue/10 border border-gray-100 dark:border-white/5 space-y-4">
        <h4 className="text-xs font-black text-dark-blue dark:text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="size-4 text-indigo-500" />
          Chi Tiết Chỉ Số Thi Đấu
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-150 dark:border-white/5">
            <span className="flex items-center gap-2 text-gray-navy dark:text-light-blue/70">
              <CheckCircle2 className="size-4 text-emerald-500" /> Số câu đúng
            </span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">
              {match.correct_count} câu
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-150 dark:border-white/5">
            <span className="flex items-center gap-2 text-gray-navy dark:text-light-blue/70">
              <XCircle className="size-4 text-rose-500" /> Số câu sai
            </span>
            <span className="font-black text-rose-500">
              {incorrectCount} câu
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-150 dark:border-white/5">
            <span className="flex items-center gap-2 text-gray-navy dark:text-light-blue/70">
              <HelpCircle className="size-4 text-indigo-500" /> Tổng số câu hỏi
            </span>
            <span className="font-black text-dark-blue dark:text-white">
              {match.total_questions} câu
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-150 dark:border-white/5">
            <span className="flex items-center gap-2 text-gray-navy dark:text-light-blue/70">
              <Heart className="size-4 text-rose-500" /> Mạng còn lại
            </span>
            <span className="font-black text-dark-blue dark:text-white">
              {match.lives_left} ❤️
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-indigo-550/5 dark:bg-indigo-400/5 border border-indigo-500/10 text-[11px] text-gray-navy dark:text-light-blue/70 leading-relaxed">
          💡 <span className="font-bold text-dark-blue dark:text-white">Ghi chú bảo mật:</span> Nội dung câu hỏi và đáp án chi tiết được ẩn để đảm bảo tính công bằng và bảo mật ngân hàng đề thi của đấu trường Arena.
        </div>
      </div>
    </div>
  );
};
