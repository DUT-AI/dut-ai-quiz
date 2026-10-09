"use client";

import { useState } from "react";
import { Check, Copy, Layers } from "lucide-react";
import { toast } from "sonner";

interface HomeworkInfoCardProps {
  homeworkId: string;
  lessonName?: string;
  submissionsCount: number;
}

export function HomeworkInfoCard({
  homeworkId,
  lessonName,
  submissionsCount,
}: HomeworkInfoCardProps) {
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = () => {
    if (!homeworkId) return;
    navigator.clipboard.writeText(homeworkId);
    setCopiedId(true);
    toast.success("Đã copy mã bài tập vào clipboard");
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/10 p-6 shadow-sm space-y-3">
      <h3 className="text-base font-black text-dark-blue dark:text-white flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/5">
        <Layers className="size-4 text-primary" />
        Thông tin bài tập
      </h3>

      <div className="space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-navy/70 dark:text-light-blue/60 font-semibold">
            Mã bài tập (ID):
          </span>
          <button
            onClick={handleCopyId}
            className="inline-flex items-center gap-1 font-mono text-[11px] bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md text-dark-blue dark:text-light-blue hover:text-primary transition-colors cursor-pointer"
            title="Bấm để copy ID"
          >
            <span>{homeworkId.slice(0, 8)}...</span>
            {copiedId ? (
              <Check className="size-3 text-emerald-500" />
            ) : (
              <Copy className="size-3" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-navy/70 dark:text-light-blue/60 font-semibold">
            Bài học liên kết:
          </span>
          <span className="font-bold text-dark-blue dark:text-white truncate max-w-[160px]">
            {lessonName || "Chưa phân loại"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-navy/70 dark:text-light-blue/60 font-semibold">
            Tổng số bài nộp:
          </span>
          <span className="font-extrabold text-primary">
            {submissionsCount} bài
          </span>
        </div>
      </div>
    </div>
  );
}
