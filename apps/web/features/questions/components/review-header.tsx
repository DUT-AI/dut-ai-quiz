"use client";

import React from "react";
import { FileCheck } from "lucide-react";

interface ReviewHeaderProps {
  count?: number;
}

export function ReviewHeader({ count }: ReviewHeaderProps) {
  return (
    <div className="relative overflow-hidden bg-slate-50/50 dark:bg-zinc-900/50 border border-slate-200/50 dark:border-white/5 p-6 rounded-3xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-colors duration-300">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-start gap-4">
        <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-2xl text-primary shrink-0 shadow-inner">
          <FileCheck className="size-8" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl md:text-3xl font-black text-dark-blue dark:text-white uppercase tracking-tight flex flex-wrap items-center gap-2.5">
            Phê duyệt câu hỏi
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            Xem danh sách các câu hỏi đang ở trạng thái Nháp. Bạn có thể kiểm tra trùng lặp,
            sửa thông tin trực tiếp, dùng AI tạo lại lời giải trước khi phê duyệt cho người dùng xem.
          </p>
        </div>
      </div>

      {count !== undefined && (
        <div className="shrink-0 flex items-center">
          <div className="bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-black tracking-wide flex items-center gap-2 shadow-sm">
            <span>{count} CÂU HỎI ĐANG ĐỢI DUYỆT</span>
          </div>
        </div>
      )}
    </div>
  );
}
