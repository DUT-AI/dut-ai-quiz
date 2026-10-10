"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  BookOpenCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  FileCode,
  GraduationCap,
  Loader2,
  Paperclip,
  RefreshCw,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Homework } from "../types";
import { cn } from "@/lib/utils";

interface HomeworkDetailHeaderProps {
  homework: Homework;
  lessonName?: string;
  lessonId?: string | null;
  activeTab: "overview" | "submissions";
  onTabChange: (tab: "overview" | "submissions") => void;
  submissionsCount: number;
  onEdit: () => void;
  onArchive: () => void;
  onRetryRubric: () => void;
  isRetryingRubric: boolean;
}

export function HomeworkDetailHeader({
  homework,
  lessonName,
  lessonId,
  activeTab,
  onTabChange,
  submissionsCount,
  onEdit,
  onArchive,
  onRetryRubric,
  isRetryingRubric,
}: HomeworkDetailHeaderProps) {
  const router = useRouter();

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const isProcessingRubric = homework.grading_status === "PROCESSING";

  return (
    <div className="space-y-6">
      {/* Navigation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/teacher/homeworks");
            }
          }}
          className="group inline-flex items-center gap-2 text-xs font-black text-gray-navy hover:text-navy-blue dark:text-light-blue/70 dark:hover:text-white transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Quay lại danh sách bài tập</span>
        </button>

        {lessonId && lessonName && (
          <Link
            href={`/teacher/lessons/${lessonId}/homeworks`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <GraduationCap className="size-3.5" />
            <span>Bài học: {lessonName}</span>
            <ExternalLink className="size-3" />
          </Link>
        )}
      </div>

      {/* Main Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="rounded-3xl bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/10 p-6 md:p-8 shadow-sm space-y-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase tracking-wider">
                <FileCode className="size-3" />
                Coding Assignment
              </span>

              {/* Grading Status Badge */}
              {homework.grading_status === "READY" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                  <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                  AI Sẵn sàng chấm (READY)
                </span>
              )}
              {homework.grading_status === "PROCESSING" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 text-[11px] font-bold border border-sky-500/20">
                  <Loader2 className="size-3 text-sky-500 animate-spin" />
                  Đang phân tích rubric (PROCESSING)
                </span>
              )}
              {homework.grading_status === "FAILED" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[11px] font-bold border border-rose-500/20">
                  <AlertTriangle className="size-3 text-rose-600 dark:text-rose-400" />
                  Lỗi khởi tạo rubric (FAILED)
                </span>
              )}
              {(!homework.grading_status || homework.grading_status === "PENDING") && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-bold border border-amber-500/20">
                  <Clock className="size-3 text-amber-600 dark:text-amber-400" />
                  Chờ phân tích (PENDING)
                </span>
              )}

              {/* Attachment Tag */}
              {homework.has_attachment && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold border border-indigo-500/20">
                  <Paperclip className="size-3" />
                  Có file đính kèm (.zip)
                </span>
              )}
            </div>

            {/* Assignment Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-dark-blue dark:text-white tracking-tight">
              {homework.title}
            </h1>

            {/* Dates & ID meta */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-navy/80 dark:text-light-blue/70 font-semibold pt-1">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5 text-gray-400" />
                Ngày tạo: {formatDate(homework.created_at)}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5 text-gray-400" />
                Cập nhật: {formatDate(homework.updated_at)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              onClick={onRetryRubric}
              disabled={isRetryingRubric || isProcessingRubric}
              className="h-10 rounded-xl px-3.5 border-primary/30 text-primary hover:bg-primary/10 flex items-center gap-2 font-bold cursor-pointer"
              title="Yêu cầu AI worker phân tích lại bài tập và tạo rubric mới"
            >
              <RefreshCw
                className={cn(
                  "size-4",
                  (isRetryingRubric || isProcessingRubric) && "animate-spin"
                )}
              />
              <span className="hidden sm:inline">
                {isProcessingRubric ? "Đang tạo rubric..." : "Tạo lại Rubric"}
              </span>
            </Button>

            <Button
              onClick={onEdit}
              className="h-10 rounded-xl px-4 flex items-center gap-2 font-bold shadow-sm cursor-pointer"
            >
              <Edit3 className="size-4" />
              <span>Chỉnh sửa bài tập</span>
            </Button>

            <Button
              variant="outline"
              onClick={onArchive}
              className="h-10 rounded-xl px-3.5 border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
              title="Lưu trữ bài tập này"
            >
              <Archive className="size-4" />
            </Button>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="border-t border-gray-150 dark:border-white/10 pt-4 flex items-center gap-2">
          <button
            onClick={() => onTabChange("overview")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer",
              activeTab === "overview"
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "text-gray-navy/80 dark:text-light-blue/70 hover:bg-gray-100 dark:hover:bg-white/5"
            )}
          >
            <BookOpenCheck className="size-4" />
            <span>Tổng quan & Đề bài</span>
          </button>

          <button
            onClick={() => onTabChange("submissions")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer",
              activeTab === "submissions"
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "text-gray-navy/80 dark:text-light-blue/70 hover:bg-gray-100 dark:hover:bg-white/5"
            )}
          >
            <Users className="size-4" />
            <span>Danh sách bài nộp</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-black",
                activeTab === "submissions"
                  ? "bg-white/20 text-white"
                  : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
              )}
            >
              {submissionsCount}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
