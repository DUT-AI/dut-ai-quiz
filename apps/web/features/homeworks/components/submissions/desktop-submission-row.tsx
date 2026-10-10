import { useState, Fragment } from "react";
import Link from "next/link";
import {
  Download,
  Eye,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import { Homework, HomeworkSubmission } from "../../types";
import { Button } from "@/components/ui/button";
import { formatDateTime, cn } from "@/lib/utils";
import { openSubmissionFile } from "../../queries";
import { GroupedSubmission, getInitials } from "./types";
import { SubmissionStatusBadge } from "./submission-status-badge";
import { DesktopSubmissionHistory } from "./desktop-submission-history";

interface DesktopSubmissionRowProps {
  homework: Homework;
  sub?: HomeworkSubmission;
  group?: GroupedSubmission;
  onRetry: (submissionId: string) => Promise<void>;
  retryingId: string | null;
}

export function DesktopSubmissionRow({
  homework,
  sub,
  group,
  onRetry,
  retryingId,
}: DesktopSubmissionRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 1. Single Submission View (when filters are active)
  if (sub) {
    const initials = getInitials(sub.owner_name || "");
    const isRetryingThis = retryingId === sub.id;
    const isGrading = sub.status === "GRADING";

    return (
      <tr className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
        <td className="p-4 pl-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-primary/20 dark:border-primary/30">
              <span className="text-xs font-black text-primary dark:text-primary-foreground">
                {initials}
              </span>
            </div>
            <div>
              <span className="font-bold text-dark-blue dark:text-white block text-sm">
                {sub.owner_name}
              </span>
              <span className="text-[10px] text-gray-navy dark:text-light-blue/50 font-medium">
                User ID: #{sub.user_id}
              </span>
            </div>
          </div>
        </td>
        <td className="p-4 font-semibold text-dark-blue dark:text-light-blue">
          Lần nộp #{sub.attempt_number}
        </td>
        <td className="p-4 text-gray-navy dark:text-light-blue/80">
          <span className="block font-medium">{formatDateTime(sub.submitted_at)}</span>
        </td>
        <td className="p-4">
          {sub.is_plagiarized ? (
            <span className="inline-flex items-center gap-1 text-red font-bold animate-pulse">
              <AlertTriangle className="size-3.5" /> Độ trùng cao
            </span>
          ) : (
            <span className="text-gray-navy/60 dark:text-light-blue/40 font-medium">An toàn</span>
          )}
        </td>
        <td className="p-4">
          <SubmissionStatusBadge status={sub.status} />
        </td>
        <td className="p-4">
          {sub.status === "GRADED" && sub.score !== undefined ? (
            <span className="text-sm font-black text-primary">{sub.score} / 10</span>
          ) : (
            <span className="text-gray-navy/40 dark:text-light-blue/30 font-bold">—</span>
          )}
        </td>
        <td className="p-4 pr-6 text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openSubmissionFile(sub.id)}
              className="h-8 border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-light-blue dark:hover:bg-white/5 rounded-lg text-xs cursor-pointer"
            >
              <Download className="mr-1 size-3" /> Tải file
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isGrading || isRetryingThis}
              onClick={() => onRetry(sub.id)}
              className="h-8 border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white rounded-lg text-xs font-bold gap-1 transition-all cursor-pointer"
              title="Yêu cầu chấm lại bài nộp này"
            >
              <RotateCcw className={cn("size-3", isRetryingThis && "animate-spin")} />
              <span>{isRetryingThis ? "Đang gửi..." : "Chấm lại"}</span>
            </Button>
            <Link href={`/teacher/homeworks/${homework.id}/submissions/${sub.id}`}>
              <Button size="sm" className="h-8 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold gap-1 shadow-sm cursor-pointer">
                <Eye className="size-3" /> Xem chi tiết
              </Button>
            </Link>
          </div>
        </td>
      </tr>
    );
  }

  // 2. Grouped Student Row (collapsible attempts list)
  if (group) {
    const initials = getInitials(group.owner_name || "");
    const latest = group.latestSubmission;
    const hasPlagiarism = group.submissions.some((s) => s.is_plagiarized);
    const isRetryingLatest = retryingId === latest.id;
    const isGradingLatest = latest.status === "GRADING";

    return (
      <Fragment>
        <tr
          onClick={() => setIsExpanded(!isExpanded)}
          className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer select-none border-b border-gray-100 dark:border-white/5"
        >
          <td className="p-4 pl-6 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-primary/20 dark:border-primary/30">
                <span className="text-xs font-black text-primary dark:text-primary-foreground">
                  {initials}
                </span>
              </div>
              <div>
                <span className="font-bold text-dark-blue dark:text-white block text-sm">
                  {group.owner_name}
                </span>
                <span className="text-[10px] text-gray-navy dark:text-light-blue/50 font-medium block">
                  User ID: #{group.userId}
                </span>
              </div>
            </div>
          </td>
          <td className="p-4 font-semibold text-dark-blue dark:text-light-blue text-left">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-navy dark:text-light-blue/70">
              Lịch sử ({group.submissions.length})
              {isExpanded ? (
                <ChevronUp className="size-4 text-primary" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </span>
          </td>
          <td className="p-4 text-gray-navy dark:text-light-blue/80 text-left">
            <span className="block font-medium">{formatDateTime(latest.submitted_at)}</span>
          </td>
          <td className="p-4 text-left">
            {hasPlagiarism ? (
              <span className="inline-flex items-center gap-1 text-red font-bold animate-pulse">
                <AlertTriangle className="size-3.5" /> Độ trùng cao
              </span>
            ) : (
              <span className="text-gray-navy/60 dark:text-light-blue/40 font-medium">An toàn</span>
            )}
          </td>
          <td className="p-4 text-left">
            <SubmissionStatusBadge status={latest.status} />
          </td>
          <td className="p-4 text-left">
            {latest.status === "GRADED" && latest.score !== undefined ? (
              <span className="text-sm font-black text-primary">{latest.score} / 10</span>
            ) : (
              <span className="text-gray-navy/40 dark:text-light-blue/30 font-bold">—</span>
            )}
          </td>
          <td className="p-4 pr-6 text-right">
            <div
              className="flex items-center justify-end gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => openSubmissionFile(latest.id)}
                className="h-8 border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-light-blue dark:hover:bg-white/5 rounded-lg text-xs cursor-pointer"
              >
                <Download className="mr-1 size-3" /> Tải file
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isGradingLatest || isRetryingLatest}
                onClick={() => onRetry(latest.id)}
                className="h-8 border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white rounded-lg text-xs font-bold gap-1 transition-all cursor-pointer"
                title="Yêu cầu chấm lại lần nộp mới nhất này"
              >
                <RotateCcw className={cn("size-3", isRetryingLatest && "animate-spin")} />
                <span>{isRetryingLatest ? "Đang gửi..." : "Chấm lại"}</span>
              </Button>
              <Link href={`/teacher/homeworks/${homework.id}/submissions/${latest.id}`}>
                <Button size="sm" className="h-8 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold gap-1 shadow-sm cursor-pointer">
                  <Eye className="size-3" /> Xem chi tiết
                </Button>
              </Link>
            </div>
          </td>
        </tr>

        {isExpanded && (
          <DesktopSubmissionHistory
            homeworkId={homework.id}
            ownerName={group.owner_name}
            submissions={group.submissions}
            onRetry={onRetry}
            retryingId={retryingId}
          />
        )}
      </Fragment>
    );
  }

  return null;
}
