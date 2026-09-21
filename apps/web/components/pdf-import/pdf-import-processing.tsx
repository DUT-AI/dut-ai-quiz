"use client";

import React from "react";
import { Loader2, FileText, AlertCircle } from "lucide-react";
import { useImportSessionStatus } from "@/lib/queries";
import { motion } from "framer-motion";

interface Props {
  jobId: string;
  onCompleted: () => void;
  onFailed: (error: string) => void;
}

export function PdfImportProcessing({ jobId, onCompleted, onFailed }: Props) {
  const { data: statusData } = useImportSessionStatus(jobId, true);

  React.useEffect(() => {
    if (statusData?.status === "COMPLETED") {
      onCompleted();
    } else if (statusData?.status === "FAILED") {
      onFailed(statusData.error_message || "Lỗi xử lý file PDF");
    }
  }, [statusData, onCompleted, onFailed]);

  const total = statusData?.total_questions ?? 0;
  const processed = statusData?.processed_questions ?? 0;
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-8 animate-in fade-in duration-300">
      {/* Animated Icon Container */}
      <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-xl shadow-primary/5">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>

      <div className="space-y-2 max-w-md">
        <h3 className="text-xl font-black text-dark-blue dark:text-white">AI đang phân tích tài liệu</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          Hệ thống đang bóc tách nội dung câu hỏi, các phương án lựa chọn và hình ảnh đi kèm từ file PDF của bạn.
        </p>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full max-w-md bg-slate-100 dark:bg-white/5 p-6 rounded-3xl border border-slate-200/50 dark:border-white/5 shadow-inner">
        <div className="flex items-center justify-between text-xs font-bold text-gray-navy uppercase tracking-wider mb-2">
          <span>Tiến trình trích xuất</span>
          <span>{percentage}%</span>
        </div>
        <div className="w-full h-3 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-gradient-to-r from-primary to-indigo-600 rounded-full"
          />
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2 overflow-hidden flex-1 mr-4">
            <FileText className="size-4 text-primary shrink-0" />
            <span className="font-semibold text-xs truncate">
              {statusData?.file_name || "Document.pdf"}
            </span>
          </div>
          <span className="font-bold text-xs shrink-0">
            {processed} / {total} câu hỏi
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-900/40 px-4 py-3 rounded-2xl">
        <AlertCircle className="size-4 shrink-0" />
        <span>Vui lòng không đóng cửa sổ này cho đến khi quá trình bóc tách hoàn tất.</span>
      </div>
    </div>
  );
}
