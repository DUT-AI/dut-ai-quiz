"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HomeworkGradingStatusCardProps {
  status?: string;
  error?: string | null;
  onRetry: () => void;
  onEdit: () => void;
  isRetrying: boolean;
}

export function HomeworkGradingStatusCard({
  status,
  error,
  onRetry,
  onEdit,
  isRetrying,
}: HomeworkGradingStatusCardProps) {
  return (
    <div className="rounded-3xl bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/10 p-6 shadow-sm space-y-4">
      <h3 className="text-base font-black text-dark-blue dark:text-white flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/5">
        <Sparkles className="size-4 text-primary" />
        Cấu hình chấm tự động AI
      </h3>

      {status === "READY" && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>Rubric đã sẵn sàng</span>
          </div>
          <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
            Hệ thống AI đã phân tích đề bài và thiết lập tiêu chí chấm tự động cho bài tập này. Mọi bài nộp sẽ được chấm ngay khi gửi lên.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="w-full rounded-xl text-xs font-bold border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={cn("size-3.5", isRetrying && "animate-spin")} />
            <span>Tạo lại rubric AI</span>
          </Button>
        </div>
      )}

      {status === "PROCESSING" && (
        <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-2">
          <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-bold text-sm">
            <Loader2 className="size-4 animate-spin shrink-0" />
            <span>Đang phân tích rubric</span>
          </div>
          <p className="text-xs text-sky-800/80 dark:text-sky-300/80 leading-relaxed">
            Worker AI đang phân tích nội dung đề bài và tài liệu đính kèm để tạo tiêu chí chấm. Vui lòng chờ giây lát.
          </p>
        </div>
      )}

      {status === "FAILED" && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
            <AlertTriangle className="size-4 shrink-0" />
            <span>Khởi tạo rubric thất bại</span>
          </div>
          {error && (
            <div className="rounded-xl bg-white/70 dark:bg-black/30 p-3 text-[11px] font-mono text-rose-800 dark:text-rose-300 break-words max-h-40 overflow-y-auto custom-scrollbar">
              {error}
            </div>
          )}
          <p className="text-xs text-rose-800/80 dark:text-rose-300/80 leading-relaxed">
            💡 Bạn có thể bấm Thử tạo lại ngay hoặc Sửa bài tập để cập nhật nội dung đề bài rõ ràng hơn.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button
              size="sm"
              onClick={onRetry}
              disabled={isRetrying}
              className="flex-1 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={cn("size-3.5", isRetrying && "animate-spin")} />
              <span>Thử tạo lại</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="rounded-xl text-xs font-bold"
            >
              Sửa bài tập
            </Button>
          </div>
        </div>
      )}

      {(!status || status === "PENDING") && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
            <Clock className="size-4 shrink-0" />
            <span>Đang chờ phân tích</span>
          </div>
          <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
            Bài tập đang được xếp hàng chờ worker AI tiếp nhận phân tích đề bài.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="w-full rounded-xl text-xs font-bold border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={cn("size-3.5", isRetrying && "animate-spin")} />
            <span>Gửi lại yêu cầu phân tích</span>
          </Button>
        </div>
      )}
    </div>
  );
}
