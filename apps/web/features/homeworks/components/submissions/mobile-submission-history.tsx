import Link from "next/link";
import { Download, Eye, AlertTriangle, RotateCcw } from "lucide-react";
import { HomeworkSubmission } from "../../types";
import { Button } from "@/components/ui/button";
import { formatDateTime, cn } from "@/lib/utils";
import { openSubmissionFile } from "../../queries";
import { SubmissionStatusBadge } from "./submission-status-badge";

interface MobileSubmissionHistoryProps {
  homeworkId: string;
  submissions: HomeworkSubmission[];
  onRetry: (submissionId: string) => Promise<void>;
  retryingId: string | null;
}

export function MobileSubmissionHistory({
  homeworkId,
  submissions,
  onRetry,
  retryingId,
}: MobileSubmissionHistoryProps) {
  return (
    <div className="space-y-2">
      {submissions.map((item) => {
        const borderAccent =
          {
            GRADED: "border-l-4 border-l-green-500",
            GRADING: "border-l-4 border-l-amber-500 animate-pulse",
            UPLOADED: "border-l-4 border-l-blue-500",
            FAILED: "border-l-4 border-l-red-500",
          }[item.status] || "border-l-4 border-l-gray-300";

        const isRetryingThis = retryingId === item.id;
        const isGrading = item.status === "GRADING";

        return (
          <div
            key={item.id}
            className={cn(
              "p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/30 bg-amber-50/50 hover:bg-amber-50/80 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 space-y-2 transition-all duration-200 shadow-sm",
              borderAccent
            )}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="flex items-center gap-1.5 font-bold text-dark-blue dark:text-white text-xs">
                  <span>Lần nộp #{item.attempt_number}</span>
                  {item.is_plagiarized && (
                    <span className="text-[9px] px-1 bg-red-500/10 text-red dark:bg-red-500/20 rounded font-bold flex items-center gap-0.5 animate-pulse">
                      <AlertTriangle className="size-2.5 text-red shrink-0" /> Trùng lặp
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-navy/70 dark:text-light-blue/50 font-medium block">
                  {formatDateTime(item.submitted_at)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <SubmissionStatusBadge status={item.status} size="sm" />
                {item.status === "GRADED" && item.score !== undefined && (
                  <span className="font-black text-primary text-xs shrink-0">{item.score} / 10</span>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openSubmissionFile(item.id)}
                className="flex-1 h-7 border-gray-250 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-light-blue dark:hover:bg-white/5 rounded-lg text-[10px] font-bold gap-1 cursor-pointer"
              >
                <Download className="size-3" /> Tải file
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={isGrading || isRetryingThis}
                onClick={() => onRetry(item.id)}
                className={cn(
                  "flex-1 h-7 rounded-lg text-[10px] font-bold gap-1 transition-all cursor-pointer",
                  item.status === "FAILED"
                    ? "border-red-300 dark:border-red-800/60 bg-red-50/60 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white"
                    : "border-amber-300 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-white"
                )}
                title="Chấm lại lần nộp này"
              >
                <RotateCcw className={cn("size-3", isRetryingThis && "animate-spin")} />
                {isRetryingThis ? "Đang gửi..." : "Chấm lại"}
              </Button>

              <Link href={`/teacher/homeworks/${homeworkId}/submissions/${item.id}`} className="flex-1">
                <Button
                  size="sm"
                  className="w-full h-7 bg-primary hover:bg-primary/95 text-white rounded-lg text-[10px] font-bold gap-1 shadow-sm cursor-pointer"
                >
                  <Eye className="size-3" /> Chi tiết
                </Button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
