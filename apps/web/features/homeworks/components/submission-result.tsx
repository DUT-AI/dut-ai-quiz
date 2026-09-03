"use client";

import { motion } from "framer-motion";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock3, 
  Download, 
  XCircle, 
  MessageSquare,
  Award,
  AlertCircle,
  FileCode
} from "lucide-react";
import ReactMarkdown from "react-markdown";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { HomeworkSubmission } from "../types";
import { openSubmissionFile } from "../queries";

interface SubmissionResultProps {
  submission: HomeworkSubmission;
  compact?: boolean;
}

export function SubmissionResult({ submission, compact = false }: SubmissionResultProps) {
  const statusConfig = {
    UPLOADED: { 
      label: "Đã tải lên", 
      icon: Clock3, 
      className: "bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-800/30" 
    },
    GRADING: { 
      label: "Đang chấm điểm", 
      icon: Clock3, 
      className: "bg-amber-500/10 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-800/30 animate-pulse" 
    },
    GRADED: { 
      label: "Đã chấm điểm", 
      icon: CheckCircle2, 
      className: "bg-green/10 text-green border-green/20 dark:bg-green/20 dark:text-green" 
    },
    FAILED: { 
      label: "Không đạt",
      icon: XCircle, 
      className: "bg-red/10 text-red border-red/20 dark:bg-red/20 dark:text-red" 
    },
  }[submission.status] || {
    label: "Không rõ",
    icon: Clock3,
    className: "bg-gray-100 text-gray-500 border-gray-200"
  };

  const StatusIcon = statusConfig.icon;

  return (
    <Card className="border border-gray-150 bg-gray-50/50 shadow-none dark:border-white/20 dark:bg-zinc-950/40">
      <CardHeader className="pb-3 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 text-gray-navy dark:text-light-blue">
              <FileCode className="size-4" />
            </div>
            <CardTitle className="text-sm font-bold text-dark-blue dark:text-white">
              Lần nộp bài #{submission.attempt_number}
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`h-6 ${statusConfig.className}`}>
              <StatusIcon className="mr-1.5 size-3.5" />
              {statusConfig.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-4">
        {/* Submitted Time and File Download */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs">
          <span className="text-gray-navy dark:text-light-blue/80">
            Nộp lúc: {formatDateTime(submission.submitted_at)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openSubmissionFile(submission.id)}
            className="h-8 border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-white/20 dark:text-light-blue dark:hover:bg-white/5"
          >
            <Download className="mr-1.5 size-3.5" /> Tải bài nộp (.zip)
          </Button>
        </div>

        {/* Graded Details */}
        {!compact && submission.status === "GRADED" && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center gap-4">
              {/* Circular Score Badge */}
              <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-green/5 dark:from-primary/20 dark:to-green/10 border-2 border-primary/20">
                <div className="text-center">
                  <span className="text-xl font-black text-primary dark:text-primary-foreground">
                    {submission.score ?? "—"}
                  </span>
                  <span className="block text-[8px] uppercase tracking-wide text-gray-navy dark:text-light-blue/60 font-bold -mt-1">
                    Điểm
                  </span>
                </div>
              </div>

              {/* Status details */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={submission.is_pass ? "default" : "destructive"}>
                    {submission.is_pass ? "Đạt yêu cầu" : "Chưa đạt"}
                  </Badge>
                  {submission.is_plagiarized && (
                    <Badge variant="destructive" className="border-red bg-red/10 text-red dark:bg-red/20">
                      <AlertTriangle className="mr-1 size-3" /> Nghi vấn đạo văn
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-navy dark:text-light-blue/80">
                  Bài làm đã được hệ thống tự động chấm điểm và đánh giá.
                </p>
              </div>
            </div>

            {/* Plagiarism Banner */}
            {submission.is_plagiarized && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red/20 bg-red/5 p-3 text-xs text-red dark:bg-red/10">
                <AlertTriangle className="size-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Cảnh báo sao chép:</span> Bài làm của bạn có độ trùng lặp cao bất thường với cơ sở dữ liệu bài tập hoặc bài làm của học viên khác. Vui lòng liên hệ trợ giảng để được giải đáp.
                </div>
              </div>
            )}

            {/* Teacher / System Feedback */}
            {submission.feedback && (
              <div className="space-y-2">
                <h5 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-navy dark:text-light-blue/70">
                  <MessageSquare className="size-3.5 text-primary" /> Nhận xét chi tiết
                </h5>
                <div className="prose prose-sm max-w-none rounded-xl border border-gray-100 bg-white p-4 text-slate dark:prose-invert dark:border-white/5 dark:bg-zinc-900/60">
                  <ReactMarkdown>{submission.feedback}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Failed Details */}
        {submission.status === "FAILED" && submission.grading_error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red/20 bg-red/5 p-3 text-xs text-red dark:bg-red/10">
            <AlertCircle className="size-4 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Bài nộp không đạt:</span> {submission.grading_error}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
