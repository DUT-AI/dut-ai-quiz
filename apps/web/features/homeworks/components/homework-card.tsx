"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Circle,
  Download,
  Upload,
  Clock,
  Sparkles,
  X,
  FileText
} from "lucide-react";
import React, { useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/components/markdown";
import { formatDateTime } from "@/lib/utils";
import { openHomeworkAttachment } from "../queries";
import { Homework } from "../types";
import { FileDropzone } from "./file-dropzone";
import { SubmissionResult } from "./submission-result";

interface HomeworkCardProps {
  homework: Homework;
  onSubmit: (homeworkId: string, file: File) => Promise<void>;
}

export function HomeworkCard({ homework, onSubmit }: HomeworkCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDescOpen, setIsDescOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submission = homework.current_submission;

  // Determine active steps for timeline
  const submissionFailed = submission?.status === "FAILED";
  const step2 = !!submission && !submissionFailed; // Successfully accepted
  const step3 = submission?.status === "GRADED"; // Graded

  const handleFormSubmit = async () => {
    if (!file || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(homework.id, file);
      setFile(null);
    } catch {
      // toast is handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden border border-gray-150 bg-white shadow-md dark:border-white/30 dark:bg-navy-blue/60 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:border-primary/50 dark:hover:border-primary/50">
      <div className="h-1.5 w-full bg-primary" />

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

        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-0">
        {/* Action Buttons for Task Info */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={() => setIsDescOpen(true)}
            className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:text-primary dark:border-primary/30 h-10 rounded-xl"
          >
            <FileText className="mr-2 size-4" /> Xem đề bài chi tiết
          </Button>
          {homework.has_attachment && (
            <Button
              variant="outline"
              onClick={() => openHomeworkAttachment(homework.id)}
              className="border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-light-blue dark:hover:bg-white/5 h-10 rounded-xl"
            >
              <Download className="mr-2 size-4" /> Tải đề bài đính kèm
            </Button>
          )}
        </div>

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
                : submissionFailed
                  ? "border-2 border-red bg-red/5 text-red"
                  : "border-2 border-gray-300 bg-white text-gray-400 dark:border-white/30 dark:bg-zinc-950"
                }`}>
                {step2 ? (
                  <Check className="size-4" />
                ) : submissionFailed ? (
                  <X className="size-4" />
                ) : (
                  <Circle className="size-4 opacity-30" />
                )}
              </div>
              <div className="text-left sm:text-center">
                <p className={`text-sm font-bold ${step2 ? "text-dark-blue dark:text-white" : submissionFailed ? "text-red" : "text-gray-400"}`}>
                  {submissionFailed ? "Nộp bài không đạt" : "Đã nộp bài"}
                </p>
                <p className="text-xs text-gray-navy dark:text-light-blue/70">
                  {submissionFailed ? "Vui lòng sửa file và nộp lại" : "Tải lên file code"}
                </p>
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
                  inputId={`homework-file-upload-${homework.id}`}
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
              * Hệ thống chỉ chấp nhận file nén (.zip, .rar, .7z, .tar.gz, .gz).
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    
    {/* Description Modal */}
    {typeof window !== "undefined" && createPortal(
      <AnimatePresence>
        {isDescOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDescOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative z-10 flex max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl border border-gray-150 bg-white shadow-2xl dark:border-white/20 dark:bg-navy-blue"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-white/5 md:px-6">
                <div className="flex items-center gap-2">
                  <FileText className="size-5 text-primary" />
                  <div>
                    <h3 className="text-lg font-black text-dark-blue dark:text-white">
                      Chi tiết đề bài: {homework.title}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDescOpen(false)}
                  className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-dark-blue dark:hover:bg-white/5 dark:hover:text-white transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Content body */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="prose dark:prose-invert max-w-none break-words text-base font-sans leading-relaxed tracking-wide text-dark-blue dark:text-white">
                  <Markdown content={homework.description} />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end border-t border-gray-100 p-4 dark:border-white/5 md:px-6">
                <Button
                  type="button"
                  onClick={() => setIsDescOpen(false)}
                  className="h-10 rounded-xl px-6"
                >
                  Đóng
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
  </>
  );
}
