"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteAttemptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
  attemptScore: number | null;
  attemptStatus: string;
}

export function DeleteAttemptDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
  attemptScore,
  attemptStatus,
}: DeleteAttemptDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => !isDeleting && onOpenChange(false)}
      />

      {/* Dialog Window */}
      <div className="relative w-full max-w-md rounded-[2.5rem] bg-white dark:bg-navy-blue p-8 shadow-2xl border border-gray-100 dark:border-white/10 z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => !isDeleting && onOpenChange(false)}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-navy transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="space-y-3">
          <div className="size-12 rounded-2xl bg-red/10 text-red flex items-center justify-center mb-1">
            <AlertTriangle className="size-6" />
          </div>
          <h2 className="text-xl font-black text-dark-blue dark:text-white">
            Xác nhận xóa lượt thi?
          </h2>
          <p className="text-sm font-medium text-gray-navy leading-relaxed">
            Hành động này sẽ <strong className="text-red font-bold">xóa vĩnh viễn</strong> lượt làm bài này cùng toàn bộ câu trả lời và lịch sử vi phạm đã lưu.
            <br /><br />
            Học sinh sẽ được <strong className="text-dark-blue dark:text-white font-bold">hoàn trả 1 lượt thi</strong> và có thể thực hiện làm lại bài từ đầu.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-2 text-xs font-semibold">
          <div className="flex justify-between">
            <span className="text-gray-navy opacity-60">Trạng thái:</span>
            <span className="font-bold uppercase text-dark-blue dark:text-white">{attemptStatus}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-navy opacity-60">Điểm số hiện tại:</span>
            <span className="font-black text-blue-500">
              {attemptScore !== null ? attemptScore : "N/A"}
            </span>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
            className="px-5 py-2.5 rounded-2xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 font-bold text-xs text-dark-blue dark:text-white transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red hover:bg-red/90 font-bold text-xs text-white shadow-lg shadow-red/20 transition-all disabled:opacity-50"
          >
            <Trash2 className="size-4" />
            {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
