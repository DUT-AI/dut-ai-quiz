"use client";

import React from "react";
import { Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SubmitConfirmationModalProps {
  isOpen: boolean;
  answeredCount: number;
  totalQuestions: number;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const SubmitConfirmationModal: React.FC<SubmitConfirmationModalProps> = ({
  isOpen,
  answeredCount,
  totalQuestions,
  isSubmitting,
  onCancel,
  onConfirm,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[220] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white dark:bg-navy-blue rounded-[3rem] p-10 max-w-lg w-full text-center space-y-6 shadow-2xl border border-primary/20"
          >
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Send className="size-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-dark-blue dark:text-white uppercase tracking-tighter">
                Xác nhận nộp bài
              </h2>
              <p className="text-gray-navy dark:text-light-blue/60 text-sm">
                Bạn có chắc chắn muốn nộp bài? Sau khi nộp, bạn sẽ không thể chỉnh sửa câu trả lời.
              </p>
              <p className="text-xs text-gray-navy/50 dark:text-light-blue/40">
                Đã trả lời: <span className="font-bold text-primary">{answeredCount}</span> /{" "}
                {totalQuestions} câu
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-gray-navy dark:text-white rounded-[2rem] font-black text-sm active:scale-95 transition-all disabled:opacity-50"
              >
                TIẾP TỤC LÀM BÀI
              </button>
              <button
                onClick={onConfirm}
                disabled={isSubmitting}
                className="flex-1 py-4 bg-primary text-white rounded-[2rem] font-black text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "ĐANG NỘP..." : "NỘP BÀI NGAY"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
