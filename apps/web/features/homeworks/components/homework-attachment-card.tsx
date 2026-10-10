"use client";

import { useState } from "react";
import { Download, FileArchive, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { openHomeworkAttachment } from "../queries";

interface HomeworkAttachmentCardProps {
  homeworkId: string;
  hasAttachment: boolean;
  onAddAttachment: () => void;
}

export function HomeworkAttachmentCard({
  homeworkId,
  hasAttachment,
  onAddAttachment,
}: HomeworkAttachmentCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadAttachment = async () => {
    if (!homeworkId) return;
    try {
      setIsDownloading(true);
      await openHomeworkAttachment(homeworkId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể tải tệp đính kèm");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/10 p-6 md:p-8 shadow-sm space-y-4">
      <h3 className="text-lg font-black text-dark-blue dark:text-white flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-white/5">
        <Paperclip className="size-5 text-primary" />
        Tệp đề bài đính kèm
      </h3>

      {hasAttachment ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="size-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileArchive className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-dark-blue dark:text-white text-sm truncate">
                Tệp đề bài đính kèm (.zip)
              </p>
              <p className="text-xs text-gray-navy/80 dark:text-light-blue/70 mt-0.5">
                Học sinh có thể tải về tệp này khi xem và giải bài tập.
              </p>
            </div>
          </div>

          <Button
            onClick={handleDownloadAttachment}
            disabled={isDownloading}
            className="rounded-xl shrink-0 font-bold flex items-center gap-2 cursor-pointer"
          >
            <Download className="size-4" />
            {isDownloading ? "Đang mở..." : "Tải xuống đề bài"}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 rounded-2xl border border-dashed border-gray-250 dark:border-white/10 bg-gray-50/50 dark:bg-zinc-900/30 text-xs text-gray-navy/70 dark:text-light-blue/60">
          <span>Bài tập này hiện chưa có file nén đính kèm.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddAttachment}
            className="rounded-xl text-xs font-bold"
          >
            Thêm file đính kèm
          </Button>
        </div>
      )}
    </div>
  );
}
