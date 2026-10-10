import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SubmissionStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  className?: string;
}

export function SubmissionStatusBadge({
  status,
  size = "md",
  className,
}: SubmissionStatusBadgeProps) {
  const config = {
    UPLOADED: {
      label: "Đã tải lên",
      icon: Clock3,
      style:
        "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-800/30",
    },
    GRADING: {
      label: "Đang chấm",
      icon: Clock3,
      style:
        "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-800/30 animate-pulse",
    },
    GRADED: {
      label: "Đã chấm điểm",
      icon: CheckCircle2,
      style:
        "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-800/30",
    },
    FAILED: {
      label: "Chấm lỗi",
      icon: XCircle,
      style:
        "bg-red-500/10 text-red dark:bg-red-500/20 dark:text-red border-red-200 dark:border-red-800/30",
    },
  }[status] || {
    label: "Không rõ",
    icon: Clock3,
    style: "bg-gray-100 text-gray-500 border-gray-200",
  };

  const Icon = config.icon;
  const isSmall = size === "sm";

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-bold inline-flex items-center gap-1",
        isSmall ? "h-5 text-[9px] px-1.5" : "h-6 text-xs px-2",
        config.style,
        className
      )}
    >
      <Icon className={cn(isSmall ? "size-2.5" : "size-3", "shrink-0")} />
      <span>{config.label}</span>
    </Badge>
  );
}
