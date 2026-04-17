"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { useExam, useExamQuestions } from "@/lib/queries";
import ExamStepper from "@/components/teacher/exam-editor/ExamStepper";

export default function EditExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  const { data: exam, isLoading: loadingExam } = useExam(id);
  const { data: questions, isLoading: loadingQuestions } = useExamQuestions(id);

  if (loadingExam || loadingQuestions) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-primary">
        <Loader2 className="size-10 animate-spin mb-4" />
        <p className="font-bold animate-pulse">Đang tải dữ liệu kỳ thi...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy kỳ thi</h1>
        <button onClick={() => router.push("/teacher/exams")} className="text-primary font-bold">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  // Combine exam with its questions for the stepper
  const fullExamData = {
    ...exam,
    questions: questions || []
  };

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
          <span className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em] mb-2 block">
            CHỈNH SỬA
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-dark-blue dark:text-white mb-4">
            Cập nhật <span className="text-primary">{exam.title}</span>
          </h1>
          <p className="text-lg text-gray-navy dark:text-light-blue max-w-2xl opacity-70">
            Bạn đang chỉnh sửa cấu hình kỳ thi. Hãy nhớ kiểm tra lại danh sách thí sinh và bộ câu hỏi trước khi lưu.
          </p>
        </div>
        <div className="hidden sm:block p-6 rounded-[2.5rem] bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-white/5 text-center min-w-[200px]">
          <div className="flex items-center justify-center gap-2 text-indigo-600 mb-1">
            <Sparkles className="size-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Đang chỉnh sửa</span>
          </div>
          <p className="text-sm font-bold opacity-60">Dữ liệu được bảo mật</p>
        </div>
      </div>

      <ExamStepper initialData={fullExamData} />
    </div>
  );
}
