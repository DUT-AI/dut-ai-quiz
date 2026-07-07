import React from "react";
import { Sparkles } from "lucide-react";

export function LessonDraft() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-navy-blue/40 border border-gray-150 dark:border-white/5 rounded-[2.5rem] shadow-xl p-8 max-w-2xl mx-auto">
      <div className="size-16 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6 animate-pulse">
        <Sparkles className="size-8" />
      </div>
      <h3 className="text-2xl font-black text-dark-blue dark:text-white mb-3">
        Bài học đang soạn thảo
      </h3>
      <p className="text-gray-navy dark:text-light-blue opacity-70 max-w-md text-sm leading-relaxed">
        Nội dung lý thuyết của bài học này đang được tiến hành soạn thảo và cập nhật. Vui lòng quay lại sau!
      </p>
    </div>
  );
}
