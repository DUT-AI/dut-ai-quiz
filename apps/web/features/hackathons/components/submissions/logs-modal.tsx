"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Terminal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubmissionLogs } from "../../queries";

interface LogsModalProps {
  submissionId: string | null;
  onClose: () => void;
}

export function LogsModal({ submissionId, onClose }: LogsModalProps) {
  // Query to get logs, only enabled when submissionId is provided
  const { data: logsData, isLoading } = useSubmissionLogs(submissionId || "", {
    enabled: !!submissionId,
  });

  return (
    <AnimatePresence>
      {submissionId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-navy-blue w-full max-w-3xl rounded-[36px] shadow-2xl relative z-10 p-8 border border-white/10 text-left flex flex-col max-h-[90vh] overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-navy/60 dark:text-light-blue/60 transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <h4 className="text-lg font-black text-navy-blue dark:text-white flex items-center gap-2 mb-2">
              <Terminal className="size-5 text-primary" />
              Nhật ký thực thi (Execution Logs)
            </h4>
            <p className="text-xs text-gray-navy/60 dark:text-light-blue/60 mb-5">
              Xem kết quả chạy thử nghiệm và các log đầu ra từ Container Sandbox.
            </p>

            {/* Logs Content Area */}
            <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-900 font-mono text-xs leading-relaxed space-y-4 max-h-[50vh] min-h-[200px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-2">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <span className="opacity-75 text-slate-400">Đang tải logs từ máy chủ...</span>
                </div>
              ) : logsData?.logs ? (
                <pre className="whitespace-pre-wrap word-break-all text-emerald-400">{logsData.logs}</pre>
              ) : (
                <div className="text-slate-500 italic text-center py-10">
                  Không có log đầu ra nào được ghi nhận cho lượt nộp này.
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <Button
                onClick={onClose}
                className="rounded-xl px-5 font-bold cursor-pointer"
              >
                Đóng cửa sổ
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
