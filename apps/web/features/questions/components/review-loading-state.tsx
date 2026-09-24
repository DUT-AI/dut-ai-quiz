import React from "react";
import { Loader2 } from "lucide-react";

export function ReviewLoadingState() {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/5 rounded-[36px] p-24 text-center space-y-6 flex flex-col items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 dark:bg-primary/10 rounded-full blur-xl animate-pulse" />
        <Loader2 className="size-16 animate-spin text-primary relative z-10" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Đang tải câu hỏi</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold max-w-xs mx-auto leading-relaxed">
          Đang quét cơ sở dữ liệu và tối ưu danh sách các câu hỏi nháp cần duyệt...
        </p>
      </div>
    </div>
  );
}
