"use client";

import React from "react";
import NextImage from "next/image";
import Link from "next/link";
import { ArrowLeft, User, Trophy, Activity, AlertTriangle } from "lucide-react";

interface StudentAttemptHeaderProps {
  examId: string;
  examTitle?: string;
  student: {
    id: number;
    name?: string;
    email?: string;
    avatar_url?: string | null;
  };
  totalAttempts: number;
  bestScore: number | null;
  maxTabOut: number;
}

export function StudentAttemptHeader({
  examId,
  examTitle,
  student,
  totalAttempts,
  bestScore,
  maxTabOut,
}: StudentAttemptHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb Back */}
      <div>
        <Link
          href={`/teacher/stats/${examId}`}
          className="inline-flex items-center gap-2 text-gray-navy hover:text-blue-500 font-bold transition-colors text-sm"
        >
          <ArrowLeft className="size-4" />
          Quay lại thống kê: {examTitle || "Đề thi"}
        </Link>
      </div>

      {/* Student Profile Card */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="size-16 rounded-full bg-blue-500/10 flex items-center justify-center font-black text-xl text-blue-500 overflow-hidden shrink-0 border-2 border-blue-500/20">
            {student.avatar_url ? (
              <NextImage
                src={student.avatar_url}
                alt=""
                width={64}
                height={64}
                className="size-full object-cover"
                unoptimized
              />
            ) : (
              student.name?.charAt(0) || <User className="size-7" />
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-black text-dark-blue dark:text-white">
              {student.name || `User #${student.id}`}
            </h1>
            <p className="text-sm font-semibold text-gray-navy opacity-70">
              {student.email || "Không có email"} • ID #{student.id}
            </p>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="px-5 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-center">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-gray-navy opacity-60 mb-0.5 justify-center">
              <Activity className="size-3 text-orange" />
              Lượt thi
            </div>
            <p className="text-xl font-black text-dark-blue dark:text-white">{totalAttempts}</p>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-center">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-gray-navy opacity-60 mb-0.5 justify-center">
              <Trophy className="size-3 text-green-500" />
              Điểm cao nhất
            </div>
            <p className="text-xl font-black text-green-500">
              {bestScore !== null ? bestScore : "N/A"}
            </p>
          </div>

          {maxTabOut > 0 && (
            <div className="px-5 py-3 rounded-2xl bg-red/10 border border-red/20 text-center">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-red mb-0.5 justify-center">
                <AlertTriangle className="size-3 text-red" />
                Thoát tab max
              </div>
              <p className="text-xl font-black text-red">{maxTabOut} lần</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
