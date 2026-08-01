"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Check,
  Circle,
  Download,
  FileArchive,
  Upload,
  Clock,
  ArrowRight,
  Sparkles
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, parseICT } from "@/lib/utils";
import { openHomeworkAttachment } from "../queries";
import { Homework } from "../types";
import { FileDropzone } from "./file-dropzone";
import { SubmissionResult } from "./submission-result";

interface HomeworkCardProps {
  homework: Homework;
  onSubmit: (homeworkId: string, file: File) => Promise<void>;
  isSubmitting: boolean;
}

function getDeadlineInfo(deadlineStr: string) {
  const deadline = parseICT(deadlineStr);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const isOverdue = diffMs < 0;
  const absDiff = Math.abs(diffMs);

  const diffMins = Math.floor(absDiff / (1000 * 60));
  const diffHours = Math.floor(absDiff / (1000 * 60 * 60));
  const diffDays = Math.floor(absDiff / (1000 * 60 * 60 * 24));

  if (isOverdue) {
    if (diffDays > 0) return { text: `Quá hạn ${diffDays} ngày`, variant: "destructive" as const, color: "text-red dark:text-red/90" };
    if (diffHours > 0) return { text: `Quá hạn ${diffHours} giờ`, variant: "destructive" as const, color: "text-red dark:text-red/90" };
    return { text: `Quá hạn ${diffMins} phút`, variant: "destructive" as const, color: "text-red dark:text-red/90" };
  } else {
    if (diffDays > 0) {
      if (diffDays === 1) return { text: "Còn 1 ngày", variant: "default" as const, color: "text-primary" };
      return { text: `Còn ${diffDays} ngày`, variant: "outline" as const, color: "text-gray-navy dark:text-light-blue" };
    }
    if (diffHours > 0) return { text: `Còn ${diffHours} giờ`, variant: "outline" as const, color: "text-amber-500 border-amber-500/20 bg-amber-500/5 font-semibold" };
    return { text: `Còn ${diffMins} phút`, variant: "outline" as const, color: "text-amber-500 border-amber-500/20 bg-amber-500/5 font-semibold animate-pulse" };
  }
}

export function HomeworkCard({ homework, onSubmit, isSubmitting }: HomeworkCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const deadlineInfo = getDeadlineInfo(homework.deadline);
  const isOverdue = new Date() > parseICT(homework.deadline);
  const submission = homework.current_submission;

  // Determine active steps for timeline
  const step1 = true; // Assigned is always done
  const step2 = !!submission; // Submitted
  const step3 = submission?.status === "GRADED"; // Graded

  const handleFormSubmit = async () => {
    if (!file) return;
    try {
      await onSubmit(homework.id, file);
      setFile(null);
    } catch (e) {
      // toast is handled in parent
    }
  };

  return (
    <Card className="overflow-hidden border border-gray-150 bg-white shadow-md dark:border-white/30 dark:bg-navy-blue/60 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:border-primary/50 dark:hover:border-primary/50">
      {/* Decorative Top Accent Line based on deadline status */}
      <div className={`h-1.5 w-full ${isOverdue && !submission ? "bg-red" : "bg-primary"}`} />

      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black text-dark-blue dark:text-white sm:text-2xl">
              {homework.title}
            </CardTitle>
            <p className="text-xs text-gray-navy dark:text-light-blue">
              Giao ngày: {formatDateTime(homework.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={deadlineInfo.variant} className={deadlineInfo.color}>
              <Clock className="mr-1 size-3" />
              {deadlineInfo.text}
            </Badge>
            <Badge variant="outline" className="border-gray-200 dark:border-white/30 dark:text-light-blue">
              Hạn: {formatDateTime(homework.deadline)}
            </Badge>
          </div>
        </div>

        <div className="mt-4 text-sm leading-relaxed text-slate dark:text-light-blue/90">
          <p className="whitespace-pre-wrap rounded-xl bg-gray-50/50 p-4 dark:bg-white/5">
            {homework.description}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-0">
        {/* Homework Attachment */}
        {homework.has_attachment && (
          <div className="flex justify-start">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openHomeworkAttachment(homework.id)}
              className="group border-primary/20 text-primary hover:bg-primary/5 hover:text-primary dark:border-primary/30"
            >
              <Download className="mr-2 size-4 transition-transform group-hover:-translate-y-0.5" />
              Tải đề bài đính kèm
            </Button>
          </div>
        )}

        <hr className="border-gray-100 dark:border-white/15" />

        {/* Timeline Progress Tracker */}
        <div className="py-2">
          <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-navy dark:text-light-blue/70">
            Tiến trình bài tập
          </h4>
          <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            {/* Horizontal Line background for large screens */}
            <div className="absolute top-[18px] left-5 right-5 hidden h-0.5 bg-gray-200 dark:bg-white/20 sm:block" />

            {/* Step 1: Assigned */}
            <div className="relative z-10 flex items-center gap-3 sm:flex-col sm:gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-sm shadow-primary/30">
                <Check className="size-4" />
              </div>
              <div className="text-left sm:text-center">
                <p className="text-sm font-bold text-dark-blue dark:text-white">Đã giao</p>
                <p className="text-xs text-gray-navy dark:text-light-blue/70">Nhận đề bài</p>
              </div>
            </div>

            {/* Connecting line for mobile */}
            <div className="ml-4 h-4 w-0.5 bg-gray-200 dark:bg-white/20 sm:hidden" />

            {/* Step 2: Submitted */}
            <div className="relative z-10 flex items-center gap-3 sm:flex-col sm:gap-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${step2
                ? "bg-primary text-white shadow-sm shadow-primary/30"
                : "border-2 border-gray-300 bg-white text-gray-400 dark:border-white/30 dark:bg-zinc-950"
                }`}>
                {step2 ? <Check className="size-4" /> : <Circle className="size-4 opacity-30" />}
              </div>
              <div className="text-left sm:text-center">
                <p className={`text-sm font-bold ${step2 ? "text-dark-blue dark:text-white" : "text-gray-400"}`}>
                  Đã nộp bài
                </p>
                <p className="text-xs text-gray-navy dark:text-light-blue/70">Tải lên file code</p>
              </div>
            </div>

            {/* Connecting line for mobile */}
            <div className="ml-4 h-4 w-0.5 bg-gray-200 dark:bg-white/20 sm:hidden" />

            {/* Step 3: Graded */}
            <div className="relative z-10 flex items-center gap-3 sm:flex-col sm:gap-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${step3
                ? "bg-primary text-white shadow-sm shadow-primary/30"
                : submission?.status === "GRADING"
                  ? "border-2 border-amber-500 bg-amber-500/5 text-amber-500 animate-pulse"
                  : "border-2 border-gray-300 bg-white text-gray-400 dark:border-white/30 dark:bg-zinc-950"
                }`}>
                {step3 ? (
                  <Check className="size-4" />
                ) : submission?.status === "GRADING" ? (
                  <Clock className="size-4 animate-spin" />
                ) : (
                  <Circle className="size-4 opacity-30" />
                )}
              </div>
              <div className="text-left sm:text-center">
                <p className={`text-sm font-bold ${step3 ? "text-dark-blue dark:text-white" : "text-gray-400"}`}>
                  Đã chấm điểm
                </p>
                <p className="text-xs text-gray-navy dark:text-light-blue/70">
                  {submission?.status === "GRADING" ? "Hệ thống đang chấm..." : "Xem kết quả & feedback"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Previous Submission Result */}
        {submission && (
          <div className="mt-4">
            <SubmissionResult submission={submission} />
          </div>
        )}

        {/* Upload Form Area */}
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.02] p-4 dark:border-primary/25 dark:bg-primary/[0.01]">
          <div className="flex flex-col gap-4">
            <h4 className="flex items-center gap-1.5 text-sm font-bold text-dark-blue dark:text-white">
              <Sparkles className="size-4 text-primary" />
              {submission ? "Nộp lại bài làm mới" : "Nộp bài làm của bạn"}
            </h4>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <FileDropzone
                  file={file}
                  onFileChange={setFile}
                  allowedSuffixes={[".zip", ".rar", ".7z", ".tar.gz", ".gz"]}
                  maxSizeMB={10}
                />
              </div>

              <motion.div
                whileHover={{ scale: file ? 1.02 : 1 }}
                whileTap={{ scale: file ? 0.98 : 1 }}
                className="w-full sm:w-auto"
              >
                <Button
                  disabled={!file || isSubmitting}
                  onClick={handleFormSubmit}
                  className="w-full h-11 px-6 shadow-sm shadow-primary/20"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Đang nộp...
                    </span>
                  ) : (
                    <>
                      <Upload className="mr-2 size-4" />
                      {submission ? "Nộp lại" : "Nộp bài"}
                    </>
                  )}
                </Button>
              </motion.div>
            </div>

            <p className="text-[11px] leading-normal text-gray-navy dark:text-light-blue/70">
              * Hệ thống chỉ chấp nhận file nén (.zip, .rar, .7z, .tar.gz).
              Học viên nộp sau deadline vẫn được hệ thống ghi nhận nhưng sẽ bị đánh dấu là trễ hạn.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
