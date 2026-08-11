import React from "react";
import { CheckCircle2 } from "lucide-react";

export function ReviewEmptyState() {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/5 rounded-[36px] p-20 text-center space-y-6 flex flex-col items-center justify-center">
      <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-4 rounded-3xl text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-16" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Sạch bóng câu hỏi nháp!</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed font-semibold">
          Tuyệt vời! Hiện tại không có câu hỏi nháp nào cần duyệt phù hợp với bộ lọc được chọn.
        </p>
      </div>
    </div>
  );
}
