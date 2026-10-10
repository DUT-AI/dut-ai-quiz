import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Eye,
  AlertTriangle,
  ChevronRight,
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
import { MobileSubmissionHistory } from "./mobile-submission-history";

interface MobileSubmissionCardProps {
  homework: Homework;
  sub?: HomeworkSubmission;
  group?: GroupedSubmission;
  onRetry: (submissionId: string) => Promise<void>;
  retryingId: string | null;
}

export function MobileSubmissionCard({
  homework,
  sub,
  group,
  onRetry,
  retryingId,
}: MobileSubmissionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 1. Single Submission View (when filtered)
  if (sub) {
    const initials = getInitials(sub.owner_name || "");
    const isRetryingThis = retryingId === sub.id;
    const isGrading = sub.status === "GRADING";

    return (
      <div className="p-4 rounded-2xl border border-gray-150 dark:border-white/10 bg-white dark:bg-navy-blue/60 backdrop-blur-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-primary/20 dark:border-primary/30">
              <span className="text-xs font-black text-primary dark:text-primary-foreground">
                {initials}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-dark-blue dark:text-white text-sm text-left">
                {sub.owner_name}
              </h4>
              <span className="text-[10px] text-gray-navy dark:text-light-blue/60 font-medium block text-left">
                User ID: #{sub.user_id}
              </span>
            </div>
          </div>

          <div>
            {sub.status === "GRADED" && sub.score !== undefined ? (
              <span className="text-sm font-black text-primary block leading-none">
                {sub.score} / 10
              </span>
            ) : (
              <SubmissionStatusBadge status={sub.status} size="sm" />
            )}
          </div>
        </div>

        <hr className="border-gray-100 dark:border-white/5" />

        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs font-semibold">
          <div>
            <span className="text-[10px] text-gray-navy/60 dark:text-light-blue/40 block uppercase tracking-wider text-left">
              Lần nộp
            </span>
            <span className="text-dark-blue dark:text-white font-bold block text-left">
              Lần nộp #{sub.attempt_number}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-gray-navy/60 dark:text-light-blue/40 block uppercase tracking-wider text-left">
              Thời gian
            </span>
            <span className="text-dark-blue dark:text-white font-bold block truncate text-left">
              {formatDateTime(sub.submitted_at)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-gray-navy/60 dark:text-light-blue/40 block uppercase tracking-wider text-left">
              Trùng lặp
            </span>
            {sub.is_plagiarized ? (
              <span className="text-red font-bold flex items-center gap-0.5 animate-pulse text-left">
                <AlertTriangle className="size-3 shrink-0" /> Trùng lặp cao
              </span>
            ) : (
              <span className="text-gray-navy/50 dark:text-light-blue/30 text-left block">
                An toàn
              </span>
            )}
          </div>
        </div>

        <hr className="border-gray-100 dark:border-white/5" />

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openSubmissionFile(sub.id)}
            className="flex-1 h-9 border-gray-250 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-light-blue dark:hover:bg-white/5 rounded-xl text-xs font-bold gap-1 cursor-pointer"
          >
            <Download className="size-3.5" /> Tải file
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isGrading || isRetryingThis}
            onClick={() => onRetry(sub.id)}
            className="flex-1 h-9 border-amber-300 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-white rounded-xl text-xs font-bold gap-1 cursor-pointer transition-all"
            title="Chấm lại bài nộp này"
          >
            <RotateCcw className={cn("size-3.5", isRetryingThis && "animate-spin")} />
            {isRetryingThis ? "Đang gửi..." : "Chấm lại"}
          </Button>
          <Link href={`/teacher/homeworks/${homework.id}/submissions/${sub.id}`} className="flex-1">
            <Button
              size="sm"
              className="w-full h-9 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold gap-1 shadow-sm cursor-pointer"
            >
              <Eye className="size-3.5" /> Chi tiết
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Grouped Student View (collapsible attempts list)
  if (group) {
    const initials = getInitials(group.owner_name || "");
    const latest = group.latestSubmission;
    const isRetryingLatest = retryingId === latest.id;
    const isGradingLatest = latest.status === "GRADING";

    const cardBg = isExpanded
      ? "bg-amber-50/40 border-amber-200/60 dark:bg-amber-950/10 dark:border-amber-900/30"
      : "bg-white border-gray-150 dark:bg-navy-blue/60 dark:border-white/10";

    return (
      <div className={cn("p-4 rounded-2xl border backdrop-blur-sm space-y-3 transition-all duration-200", cardBg)}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between hover:opacity-90 transition-opacity outline-none text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-primary/20 dark:border-primary/30">
              <span className="text-xs font-black text-primary dark:text-primary-foreground">
                {initials}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-dark-blue dark:text-white text-sm text-left">{group.owner_name}</h4>
              <span className="text-[10px] text-gray-navy dark:text-light-blue/60 font-medium block text-left">
                User ID: #{group.userId} • {group.submissions.length} lần nộp
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {latest.status === "GRADED" && latest.score !== undefined ? (
              <div className="text-right">
                <span className="text-sm font-black text-primary block leading-none">{latest.score}đ</span>
                <span className="text-[8px] text-gray-navy dark:text-light-blue/45 font-bold uppercase tracking-wide block mt-0.5">
                  Mới nhất
                </span>
              </div>
            ) : (
              <SubmissionStatusBadge status={latest.status} size="sm" />
            )}
            {isExpanded ? <ChevronUp className="size-4 text-gray-400" /> : <ChevronDown className="size-4" />}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden space-y-3 pt-3 border-t border-t-amber-100 dark:border-t-amber-950/30 pl-4 border-l border-l-amber-200/60 dark:border-l-amber-900/30"
            >
              <h5 className="font-bold text-[10px] text-gray-navy/60 dark:text-light-blue/40 uppercase tracking-wider text-left">
                Lịch sử nộp bài ({group.submissions.length} lần)
              </h5>

              <MobileSubmissionHistory
                homeworkId={homework.id}
                submissions={group.submissions}
                onRetry={onRetry}
                retryingId={retryingId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}
