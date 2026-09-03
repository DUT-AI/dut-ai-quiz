"use client";

import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock3, 
  AlertTriangle, 
  AlertCircle 
} from "lucide-react";
import { HomeworkSubmission } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SubmissionScoreCardProps {
  submission: HomeworkSubmission;
}

export function SubmissionScoreCard({ submission }: SubmissionScoreCardProps) {
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
      className: "bg-green-500/10 text-green-600 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-800/30" 
    },
    FAILED: { 
      label: "Chấm lỗi", 
      icon: XCircle, 
      className: "bg-red-500/10 text-red dark:bg-red-500/20 dark:text-red border-red-200 dark:bg-red-800/30" 
    },
  }[submission.status] || {
    label: "Không rõ",
    icon: Clock3,
    className: "bg-gray-100 text-gray-500 border-gray-200"
  };

  const StatusIcon = statusConfig.icon;

  return (
    <Card className="border border-gray-150 bg-white/50 dark:border-white/10 dark:bg-zinc-900/40 backdrop-blur-sm shadow-none">
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Score display (Only if Graded) */}
          {submission.status === "GRADED" && submission.score !== undefined ? (
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-indigo-600/10 border-4 border-primary/20 shadow-inner">
              <div className="text-center">
                <span className="text-3xl font-black text-primary">
                  {submission.score}
                </span>
                <span className="block text-[8px] uppercase tracking-wider text-gray-navy dark:text-light-blue/60 font-black mt-0.5">
                  Điểm số
                </span>
              </div>
            </div>
          ) : (
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-950/60 border-4 border-gray-200 dark:border-white/10">
              <div className="text-center text-gray-navy/50 dark:text-light-blue/40">
                <StatusIcon className="size-8 mx-auto" />
                <span className="block text-[8px] uppercase tracking-wider font-bold mt-1">
                  {submission.status === "GRADING" ? "Đang chấm" : "Chờ chấm"}
                </span>
              </div>
            </div>
          )}

          {/* Details & badges */}
          <div className="space-y-3 text-center sm:text-left flex-1">
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
              <Badge variant="outline" className={`h-6 ${statusConfig.className} font-bold`}>
                <StatusIcon className="mr-1.5 size-3.5" />
                {statusConfig.label}
              </Badge>
              {submission.status === "GRADED" && (
                <Badge variant={submission.is_pass ? "default" : "destructive"} className="h-6 font-bold">
                  {submission.is_pass ? "Đạt yêu cầu" : "Chưa đạt"}
                </Badge>
              )}
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-black text-dark-blue dark:text-white flex items-center justify-center sm:justify-start gap-1">
                <Award className="size-4 text-primary" />
                Đánh giá kết quả
              </h4>
              <p className="text-xs text-gray-navy dark:text-light-blue/70">
                {submission.status === "GRADED" 
                  ? `Bài làm đã được chấm điểm tự động. Kết quả: ${submission.is_pass ? "Đạt yêu cầu của bài tập." : "Chưa đạt yêu cầu đề ra."}`
                  : submission.status === "GRADING"
                  ? "Bài tập đang được hệ thống biên dịch và chấm điểm tự động. Vui lòng đợi trong giây lát."
                  : submission.status === "FAILED"
                  ? "Hệ thống chấm điểm gặp lỗi khi xử lý bài tập của học viên."
                  : "Bài tập đã được tải lên thành công và đang chờ kiểm tra."
                }
              </p>
            </div>
          </div>
        </div>

        {/* Warning Plagiarism Section */}
        {submission.is_plagiarized && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 dark:bg-red-500/10 p-4 text-xs text-red">
            <AlertTriangle className="size-4 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <span className="font-bold block">Cảnh báo nghi vấn đạo văn:</span>
              <p className="leading-relaxed">
                Hệ thống phát hiện tệp bài làm có độ tương đồng mã nguồn cao bất thường với tài liệu học tập hoặc bài làm của học viên khác. Vui lòng kiểm tra kỹ lưỡng lịch sử và mã nguồn bài làm của học viên này.
              </p>
            </div>
          </div>
        )}

        {/* Error Log Section */}
        {submission.status === "FAILED" && submission.grading_error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 dark:bg-red-500/10 p-4 text-xs text-red">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="space-y-1 w-full">
              <span className="font-bold block">Nhật ký lỗi chấm điểm (Auto-grader error log):</span>
              <pre className="mt-2 p-3 font-mono text-[10px] text-red-600 bg-red-500/5 dark:bg-red-950/20 dark:text-red-400 rounded-xl overflow-x-auto whitespace-pre-wrap border border-red-200/50 dark:border-red-900/20 max-h-40 custom-scrollbar">
                {submission.grading_error}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
