"use client";

import React from "react";
import { 
  CheckCircle2, 
  FileCode, 
  GraduationCap, 
  LayoutList,
  Loader2,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { useMyHomeworks } from "../queries";
import { StudentHomeworkTable } from "./student-homework-table";

interface HomeworkTabProps {
  lessonId: string;
  slug?: string;
  isPreview?: boolean;
}

export function HomeworkTab({ lessonId, slug = "", isPreview = false }: HomeworkTabProps) {
  const { data, isLoading, error } = useMyHomeworks(lessonId || null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="mt-4 text-sm font-semibold text-gray-navy dark:text-light-blue animate-pulse">
          Đang tải bài tập coding...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red/20 bg-red/5 p-6 text-center text-red">
        Không thể tải bài tập coding của bài học. Vui lòng thử lại sau.
      </div>
    );
  }

  if (!data?.data.length) {
    return (
      <Card className="border-dashed border-gray-200 dark:border-white/10 dark:bg-navy-blue/20">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-navy mb-4">
            <FileCode className="h-6 w-6" />
          </div>
          <p className="font-bold text-dark-blue dark:text-white">Chưa có bài tập coding</p>
          <p className="mt-1 text-sm text-gray-navy dark:text-light-blue/70">
            Bài học này hiện chưa có bài tập coding nào được giao.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics for the mini dashboard
  const totalHomeworks = data.data.length;
  const submittedHomeworks = data.data.filter(
    (h) => h.current_submission && h.current_submission.status !== "FAILED"
  ).length;
  const gradedHomeworks = data.data.filter(
    (h) => h.current_submission?.status === "GRADED" && typeof h.current_submission.score === "number"
  );
  const avgScore =
    gradedHomeworks.length > 0
      ? (
          gradedHomeworks.reduce((sum, h) => sum + (h.current_submission!.score || 0), 0) /
          gradedHomeworks.length
        ).toFixed(1)
      : "—";

  return (
    <div className="space-y-6">
      {/* Student Homeworks Mini-Dashboard */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Metric 1: Total assigned */}
        <Card className="border border-gray-150 bg-white shadow-sm dark:border-white/5 dark:bg-navy-blue/30 backdrop-blur-sm">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LayoutList className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-navy dark:text-light-blue">Đã giao</p>
              <h3 className="text-xl font-black text-dark-blue dark:text-white">
                {totalHomeworks} <span className="text-xs font-normal text-gray-navy">bài tập</span>
              </h3>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Completed / Submitted */}
        <Card className="border border-gray-150 bg-white shadow-sm dark:border-white/5 dark:bg-navy-blue/30 backdrop-blur-sm">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-navy dark:text-light-blue">Đã nộp bài</p>
              <h3 className="text-xl font-black text-dark-blue dark:text-white">
                {submittedHomeworks}/{totalHomeworks}{" "}
                <span className="text-xs font-normal text-gray-navy">hoàn thành</span>
              </h3>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Avg Score */}
        <Card className="border border-gray-150 bg-white shadow-sm dark:border-white/5 dark:bg-navy-blue/30 backdrop-blur-sm">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-navy dark:text-light-blue">Điểm trung bình</p>
              <h3 className="text-xl font-black text-dark-blue dark:text-white">
                {avgScore} <span className="text-xs font-normal text-gray-navy">/ 10</span>
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Homeworks Table View */}
      <StudentHomeworkTable
        homeworks={data.data}
        slug={slug}
        isPreview={isPreview}
      />
    </div>
  );
}
