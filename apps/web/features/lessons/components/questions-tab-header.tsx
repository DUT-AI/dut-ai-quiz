"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileJson, FileText, Plus, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuestionsTabHeaderProps {
  lessonName?: string;
  activePoolType: "PRACTICE" | "EXAM" | "GAME";
  isTeacher: boolean;
  questionsCount: number;
  onAddClick: () => void;
  onBulkClick: () => void;
  onPdfClick: () => void;
}

export function QuestionsTabHeader({
  lessonName,
  activePoolType,
  isTeacher,
  questionsCount,
  onAddClick,
  onBulkClick,
  onPdfClick,
}: QuestionsTabHeaderProps) {
  const router = useRouter();

  const getPoolLabel = () => {
    switch (activePoolType) {
      case "PRACTICE":
        return "Luyện tập";
      case "EXAM":
        return "Kiểm tra";
      case "GAME":
        return "Trò chơi";
      default:
        return "Câu hỏi";
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Navigation Row: Breadcrumb & Back action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          <Link href="/teacher/lessons" className="hover:text-primary transition-colors">
            Bài học
          </Link>
          <span className="opacity-60">/</span>
          <span className="text-slate-600 dark:text-zinc-300 max-w-[200px] truncate" title={lessonName}>
            {lessonName ?? "Đang tải..."}
          </span>
          <span className="opacity-60">/</span>
          <span className="text-primary font-black">Ngân hàng câu hỏi</span>
        </div>

        <button
          onClick={() => router.push("/teacher/lessons")}
          className="flex items-center gap-1.5 text-xs font-extrabold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider group self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại danh sách bài học</span>
        </button>
      </div>

      {/* Main Title & Action Buttons Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <Database className="size-8 text-primary shrink-0" />
            <span>
              {lessonName ?? "..."}
            </span>
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm max-w-xl">
            Quản lý ngân hàng câu hỏi. Hiện có{" "}
            <span className="font-extrabold text-primary">{questionsCount}</span> câu hỏi thuộc danh mục{" "}
            <span className="font-semibold text-slate-700 dark:text-zinc-200">
              {getPoolLabel()}
            </span>.
          </p>
        </div>

        {isTeacher && (
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Button
              variant="outline"
              onClick={onBulkClick}
              className="flex items-center justify-center gap-2 px-5 py-5 rounded-2xl bg-indigo-50/50 hover:bg-indigo-100/70 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs tracking-wider uppercase transition-all duration-300 w-full sm:w-auto"
            >
              <FileJson className="size-4 shrink-0" />
              <span>Nhập JSON</span>
            </Button>
            <Button
              variant="outline"
              onClick={onPdfClick}
              className="flex items-center justify-center gap-2 px-5 py-5 rounded-2xl bg-rose-50/50 hover:bg-rose-100/70 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 font-extrabold text-xs tracking-wider uppercase transition-all duration-300 w-full sm:w-auto"
            >
              <FileText className="size-4 shrink-0" />
              <span>Import PDF</span>
            </Button>
            <Button
              onClick={onAddClick}
              className="flex items-center justify-center gap-2 px-6 py-5 rounded-2xl bg-gradient-to-br from-primary to-pink-500 hover:opacity-95 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 w-full sm:w-auto"
            >
              <Plus className="size-4 shrink-0" />
              <span>Thêm câu hỏi</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
