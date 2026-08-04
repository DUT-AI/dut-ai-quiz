"use client";

import Link from "next/link";
import { ArrowLeft, Download, FileCode, User } from "lucide-react";
import { HomeworkSubmission } from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { openSubmissionFile } from "../queries";

interface SubmissionDetailHeaderProps {
  homeworkId: string;
  homeworkTitle: string;
  submission: HomeworkSubmission;
}

const getInitials = (name: string) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(-2)
    .join("")
    .toUpperCase();
};

export function SubmissionDetailHeader({ homeworkId, homeworkTitle, submission }: SubmissionDetailHeaderProps) {
  const initials = getInitials(submission.owner_name || "");

  return (
    <div className="space-y-6">
      {/* Back to Submissions Dashboard */}
      <div>
        <Link 
          href={`/teacher/homeworks/${homeworkId}/submissions`}
          className="group inline-flex items-center gap-2 text-xs font-black text-gray-navy hover:text-navy-blue dark:text-light-blue/70 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Danh sách bài nộp ({homeworkTitle})</span>
        </Link>
      </div>

      {/* Main Header Layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-gray-150 bg-white dark:border-white/10 dark:bg-navy-blue/60 backdrop-blur-sm">
        {/* Left Side: Avatar + Student details */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-indigo-500/10 border-2 border-primary/20 dark:border-primary/30">
            <span className="text-sm font-black text-primary dark:text-primary-foreground">
              {initials}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg md:text-xl font-black text-dark-blue dark:text-white">
                {submission.owner_name}
              </h1>
              <Badge variant="outline" className="border-gray-200 dark:border-white/10 dark:text-light-blue/80 bg-white/50 dark:bg-zinc-950/20 py-0.5">
                Lần nộp #{submission.attempt_number}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-gray-navy dark:text-light-blue/60">
              <span>Mã học viên: #{submission.user_id}</span>
              <span className="h-3 w-px bg-gray-200 dark:bg-white/10 hidden sm:inline" />
              <span>Nộp ngày: {formatDateTime(submission.submitted_at)}</span>
              {submission.is_late && (
                <span className="px-1.5 py-0.5 bg-red/10 text-red dark:bg-red/20 font-bold rounded text-[10px] uppercase tracking-wide">
                  Nộp trễ
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Download submission action */}
        <div className="shrink-0 flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openSubmissionFile(submission.id)}
            className="w-full md:w-auto h-10 border-gray-250 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-light-blue dark:hover:bg-white/5 rounded-xl text-xs font-bold gap-2"
          >
            <Download className="size-4 text-primary" />
            <span>Tải bài nộp (.zip)</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
