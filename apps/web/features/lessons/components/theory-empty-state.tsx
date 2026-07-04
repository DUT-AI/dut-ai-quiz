// Chưa có nội dung bài học
import React from "react";
import { Sparkles } from "lucide-react";

export function TheoryEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center text-center py-24 bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 rounded-[2.5rem] shadow-xl p-8">
            <Sparkles className="size-16 text-primary/60 mb-6 animate-pulse" />
            <h3 className="text-2xl font-black text-dark-blue dark:text-white mb-3">
                Bài học đang được tiến hành soạn thảo
            </h3>
            <p className="text-gray-navy dark:text-light-blue opacity-70 max-w-md font-medium text-sm">
                Giảng viên chưa hoàn tất phần soạn thảo lý thuyết cho chương này.
            </p>
        </div>
    );
}