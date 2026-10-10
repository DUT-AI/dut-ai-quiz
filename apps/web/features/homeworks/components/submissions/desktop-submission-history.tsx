import Link from "next/link";
import { AlertTriangle, ChevronRight, RotateCcw } from "lucide-react";
import { HomeworkSubmission } from "../../types";
import { Button } from "@/components/ui/button";
import { formatDateTime, cn } from "@/lib/utils";
import { SubmissionStatusBadge } from "./submission-status-badge";

interface DesktopSubmissionHistoryProps {
  homeworkId: string;
  ownerName?: string | null;
  submissions: HomeworkSubmission[];
  onRetry: (submissionId: string) => Promise<void>;
  retryingId: string | null;
}

export function DesktopSubmissionHistory({
  homeworkId,
  ownerName,
  submissions,
  onRetry,
  retryingId,
}: DesktopSubmissionHistoryProps) {
  return (
    <tr className="bg-amber-50/35 dark:bg-amber-950/10 transition-colors">
      <td colSpan={7} className="p-4 pl-12">
        <div className="space-y-3 border-l-2 border-amber-400 pl-6 py-2">
          <h5 className="font-bold text-xs text-dark-blue dark:text-white uppercase tracking-wider mb-2 text-left">
            Lịch sử bài nộp của {ownerName || "học viên"}
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    "p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/30 bg-amber-50/50 hover:bg-amber-50/80 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 flex flex-col gap-2 transition-all duration-200 shadow-sm",
                    borderAccent
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="flex items-center gap-1.5 font-bold text-dark-blue dark:text-white text-xs">
                        <span>Lần nộp #{item.attempt_number}</span>
                        {item.is_plagiarized && (
                          <span className="text-[9px] px-1 bg-red-500/10 text-red dark:bg-red-500/20 rounded font-bold flex items-center gap-0.5 animate-pulse">
                            <AlertTriangle className="size-2.5 text-red shrink-0 ml-0.5" /> Trùng lặp
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-navy/70 dark:text-light-blue/50 font-medium">
                        {formatDateTime(item.submitted_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <SubmissionStatusBadge status={item.status} size="sm" />

                      {item.status === "GRADED" && item.score !== undefined && (
                        <span className="font-black text-primary text-xs">{item.score} / 10</span>
                      )}

                      {/* Nút Chấm Lại */}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isGrading || isRetryingThis}
                        onClick={() => onRetry(item.id)}
                        className={cn(
                          "h-6 text-[10px] px-2 py-0.5 rounded-md font-bold transition-all shadow-none flex items-center gap-1 cursor-pointer",
                          item.status === "FAILED"
                            ? "border-red-300 dark:border-red-800/60 bg-red-50/60 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white"
                            : "border-amber-300 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-white"
                        )}
                        title="Yêu cầu worker chấm lại bài nộp này"
                      >
                        <RotateCcw className={cn("size-2.5", isRetryingThis && "animate-spin")} />
                        <span>{isRetryingThis ? "Đang gửi..." : "Chấm lại"}</span>
                      </Button>

                      <Link href={`/teacher/homeworks/${homeworkId}/submissions/${item.id}`}>
                        <Button
                          size="sm"
                          className="h-6 text-[10px] px-2 py-0.5 bg-primary hover:bg-primary/95 text-white rounded font-bold flex items-center gap-0.5 shadow-sm cursor-pointer"
                        >
                          Chi tiết <ChevronRight className="size-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </td>
    </tr>
  );
}
