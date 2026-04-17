"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import ExamStepper from "@/components/teacher/exam-editor/ExamStepper";

export default function NewExamPage() {
  const router = useRouter();

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <button
        onClick={() => router.push("/teacher/exams")}
        className="flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all mb-4 group"
      >
        <ArrowLeft className="size-5" />
        Quay lại danh sách kỳ thi
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <span className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-2 block">
            TẠO MỚI
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-dark-blue dark:text-white mb-4">
            Thiết lập <span className="text-primary">Kỳ thi</span>
          </h1>
          <p className="text-lg text-gray-navy dark:text-light-blue max-w-2xl opacity-70">
            Hoàn thành 3 bước đơn giản để tạo một kỳ thi chuyên nghiệp với danh sách thí sinh và bộ câu hỏi tùy chỉnh.
          </p>
        </div>
        <div className="hidden sm:block p-6 rounded-[2.5rem] bg-white dark:bg-navy-blue shadow-xl border border-white/10 text-center min-w-[200px]">
          <div className="flex items-center justify-center gap-2 text-primary mb-1">
            <Sparkles className="size-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Hỗ trợ giáo viên</span>
          </div>
          <p className="text-sm font-bold text-gray-navy opacity-60">Quy trình làm đề 3 bước</p>
        </div>
      </div>

      <ExamStepper />
    </div>
  );
}
