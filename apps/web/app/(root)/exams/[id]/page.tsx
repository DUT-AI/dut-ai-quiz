"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useExam, useStartAttempt } from "@/lib/queries";
import { 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  Play, 
  ArrowLeft,
  FileText,
  UserCheck,
  AlertTriangle,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { parseICT } from "@/lib/utils";

export default function ExamEntrancePage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const { data: exam, isLoading: loadingExam } = useExam(examId);
  const startAttempt = useStartAttempt();
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const res = await startAttempt.mutateAsync(examId);
      router.push(`/exams/${examId}/attempt/${res.attempt_id}`);
    } catch (err: any) {
      alert(err.message || "Không thể bắt đầu kỳ thi. Vui lòng thử lại.");
      setIsStarting(false);
    }
  };

  if (loadingExam) {
    return <div className="animate-pulse h-screen flex items-center justify-center">
      <div className="size-12 border-4 border-purple border-t-transparent animate-spin rounded-full" />
    </div>;
  }

  if (!exam) return <div>Không tìm thấy kỳ thi</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <Link 
        href="/exams"
        className="inline-flex items-center gap-2 text-gray-navy dark:text-light-blue/60 hover:text-purple transition-colors font-bold text-sm"
      >
        <ArrowLeft className="size-4" />
        Quay lại danh sách
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 rounded-[3rem] p-10 md:p-14 shadow-xl backdrop-blur-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
            <ShieldCheck className="size-64 text-purple" />
        </div>

        <div className="relative space-y-10">
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple/10 text-purple text-[10px] font-black uppercase tracking-widest">
              Xác nhận tham gia
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-dark-blue dark:text-white leading-tight">
              {exam.title}
            </h1>
            <p className="text-gray-navy dark:text-light-blue/70 text-lg">
              {exam.description || "Bài kiểm tra đánh giá năng lực định kỳ."}
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4 p-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-purple/20 transition-colors">
              <div className="size-12 rounded-2xl bg-white dark:bg-navy-blue flex items-center justify-center shadow-sm">
                <Clock className="size-6 text-purple" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-navy opacity-40">Thời lượng</p>
                <p className="font-bold text-dark-blue dark:text-white">{exam.duration_minutes} phút</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-purple/20 transition-colors">
              <div className="size-12 rounded-2xl bg-white dark:bg-navy-blue flex items-center justify-center shadow-sm">
                <ShieldCheck className="size-6 text-purple" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-navy opacity-40">Số lượt làm bài</p>
                <p className="font-bold text-dark-blue dark:text-white">Tối đa {exam.max_attempts} lần</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-purple/20 transition-colors md:col-span-2">
              <div className="size-12 rounded-2xl bg-white dark:bg-navy-blue flex items-center justify-center shadow-sm">
                <Calendar className="size-6 text-purple" />
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-navy opacity-40">Bắt đầu</p>
                  <p className="font-bold text-dark-blue dark:text-white">
                    {exam.start_time ? format(parseICT(exam.start_time), "HH:mm, dd/MM/yyyy", { locale: vi }) : "Không giới hạn"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-navy opacity-40">Kết thúc</p>
                  <p className="font-bold text-dark-blue dark:text-white">
                    {exam.end_time ? format(parseICT(exam.end_time), "HH:mm, dd/MM/yyyy", { locale: vi }) : "Không giới hạn"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold text-dark-blue dark:text-white flex items-center gap-3">
              <AlertCircle className="size-5 text-purple" />
              Quy chế và hướng dẫn
            </h3>
            <div className="grid grid-cols-1 gap-4">
               {[
                 { icon: FileText, text: "Bài thi được cấu trúc theo dạng trắc nghiệm một đáp án đúng." },
                 { icon: UserCheck, text: "Hệ thống sẽ ghi nhận nếu bạn thoát khỏi trình duyệt hoặc chuyển tab." },
                 { icon: AlertTriangle, text: "Phạm quy quá 2 lần sẽ khiến bài thi bị tự động nộp và chấm điểm." },
                 { icon: Clock, text: "Kết quả sẽ được công bố ngay sau khi bạn kết thúc bài thi." },
               ].map((item, i) => (
                 <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-sm">
                    <item.icon className="size-5 text-purple shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-gray-navy dark:text-light-blue/70">{item.text}</p>
                 </div>
               ))}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex flex-col items-center gap-6">
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="group relative w-full md:w-auto min-w-[300px] h-20 bg-purple text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-purple-500/30 hover:scale-[1.02] active:scale-95 transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <div className="relative flex items-center justify-center gap-4">
                {isStarting ? (
                   <div className="size-6 border-4 border-white border-t-transparent animate-spin rounded-full" />
                ) : (
                  <>
                    BẮT ĐẦU THI NGAY
                    <Play className="size-6 fill-current" />
                  </>
                )}
              </div>
            </button>
            <p className="text-xs font-medium text-gray-navy dark:text-light-blue/40 italic">
               * Bằng cách nhấn bắt đầu, bạn đồng ý với mọi quy chế được nêu bên trên.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
