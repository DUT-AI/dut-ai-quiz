"use client";

import React from "react";
import { Check, Circle, Loader2, X } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { HomeworkSubmission } from "../types";

interface StudentHomeworkStepperProps {
  step2: boolean;
  step3: boolean;
  submissionFailed: boolean;
  latestSubmission: HomeworkSubmission | null;
}

export function StudentHomeworkStepper({
  step2,
  step3,
  submissionFailed,
  latestSubmission,
}: StudentHomeworkStepperProps) {
  const isGrading =
    latestSubmission?.status === "GRADING" || latestSubmission?.status === "UPLOADED";

  return (
    <Card className="border border-gray-150 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-navy-blue/30 backdrop-blur-sm">
      <h4 className="mb-6 text-xs font-bold uppercase tracking-wider text-gray-navy dark:text-light-blue/70">
        Tiến trình bài tập
      </h4>
      <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        {/* Horizontal Line background for large screens */}
        <div className="absolute top-[18px] left-8 right-8 hidden h-0.5 bg-gray-200 dark:bg-white/10 sm:block" />

        {/* Step 1: Assigned */}
        <div className="relative z-10 flex items-center gap-3 sm:flex-col sm:gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-sm shadow-primary/30">
            <Check className="size-5" />
          </div>
          <div className="text-left sm:text-center">
            <p className="text-sm font-bold text-dark-blue dark:text-white">Đã giao</p>
            <p className="text-xs text-gray-navy dark:text-light-blue/70">Nhận đề bài</p>
          </div>
        </div>

        {/* Step 2: Submitted */}
        <div className="relative z-10 flex items-center gap-3 sm:flex-col sm:gap-2">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
              step2
                ? "bg-primary text-white shadow-sm shadow-primary/30"
                : submissionFailed
                ? "border-2 border-red bg-red/5 text-red"
                : "border-2 border-gray-300 bg-white text-gray-400 dark:border-white/20 dark:bg-zinc-950"
            }`}
          >
            {step2 ? (
              <Check className="size-5" />
            ) : submissionFailed ? (
              <X className="size-5" />
            ) : (
              <Circle className="size-4 opacity-30" />
            )}
          </div>
          <div className="text-left sm:text-center">
            <p
              className={`text-sm font-bold ${
                step2
                  ? "text-dark-blue dark:text-white"
                  : submissionFailed
                  ? "text-red"
                  : "text-gray-400"
              }`}
            >
              {submissionFailed ? "Nộp bài lỗi" : "Đã nộp bài"}
            </p>
            <p className="text-xs text-gray-navy dark:text-light-blue/70">
              {submissionFailed
                ? "Vui lòng thử lại"
                : latestSubmission?.submitted_at
                ? formatDateTime(latestSubmission.submitted_at)
                : "Tải lên file code"}
            </p>
          </div>
        </div>

        {/* Step 3: Grading / Graded */}
        <div className="relative z-10 flex items-center gap-3 sm:flex-col sm:gap-2">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
              step3
                ? "bg-primary text-white shadow-sm shadow-primary/30"
                : isGrading
                ? "border-2 border-amber-500 bg-amber-500/10 text-amber-500"
                : submissionFailed
                ? "border-2 border-red bg-red/5 text-red"
                : "border-2 border-gray-300 bg-white text-gray-400 dark:border-white/20 dark:bg-zinc-950"
            }`}
          >
            {step3 ? (
              <Check className="size-5" />
            ) : isGrading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : submissionFailed ? (
              <X className="size-5" />
            ) : (
              <Circle className="size-4 opacity-30" />
            )}
          </div>
          <div className="text-left sm:text-center">
            <p
              className={`text-sm font-bold ${
                step3
                  ? "text-dark-blue dark:text-white"
                  : isGrading
                  ? "text-amber-600 dark:text-amber-400"
                  : submissionFailed
                  ? "text-red"
                  : "text-gray-400"
              }`}
            >
              {step3
                ? "Đã chấm điểm"
                : isGrading
                ? "Đang chấm điểm"
                : submissionFailed
                ? "Chấm bài lỗi"
                : "Chấm điểm"}
            </p>
            <p className="text-xs text-gray-navy dark:text-light-blue/70">
              {isGrading
                ? "Hệ thống đang chấm..."
                : step3
                ? "Xem kết quả & feedback"
                : submissionFailed
                ? "Vui lòng thử lại"
                : "Chờ nộp bài"}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
