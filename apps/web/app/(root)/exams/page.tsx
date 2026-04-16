"use client";

import React from "react";
import { useExamsFull } from "@/lib/queries";
import { parseICT } from "@/lib/utils";
import { Calendar, Clock, ArrowRight, BookOpen, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function ExamsPage() {
  const { data: exams = [], isLoading } = useExamsFull();

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse text-black dark:text-white">
        <div className="h-10 w-48 bg-gray-200 dark:bg-white/5 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-[2.5rem] bg-gray-100 dark:bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-purple/10 dark:bg-purple/20 flex items-center justify-center">
                <BookOpen className="size-6 text-purple" />
            </div>
            <h1 className="text-4xl font-black text-dark-blue dark:text-white">
                Kỳ thi của tôi
            </h1>
        </div>
        <p className="text-gray-navy dark:text-light-blue/60 font-medium">
          Danh sách các bài kiểm tra và đánh giá năng lực dành riêng cho bạn.
        </p>
      </header>

      {exams.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
          <Trophy className="size-20" />
          <p className="text-xl font-bold uppercase tracking-widest text-[#1E293B] dark:text-white">Hiện chưa có kỳ thi nào</p>
          <p className="text-sm">Hãy quay lại sau khi giáo viên chỉ định kỳ thi mới nhé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {exams.map((exam, idx) => {
            const startTime = exam.start_time ? parseICT(exam.start_time) : null;
            const endTime = exam.end_time ? parseICT(exam.end_time) : null;
            const isUpcoming = startTime && startTime > new Date();
            const isEnded = endTime && endTime < new Date();
            const isOpen = !isUpcoming && !isEnded;

            return (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple/20 to-indigo-500/20 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative h-full bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 rounded-[3rem] p-8 flex flex-col transition-all duration-300 group-hover:translate-y-[-8px] group-hover:border-purple/30 shadow-sm backdrop-blur-xl">
                  <div className="flex justify-between items-start mb-6 text-black dark:text-white">
                    <div className="size-14 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                      <BookOpen className="size-7 text-purple" />
                    </div>
                    <div className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                      isOpen ? "bg-green-500/10 text-green-500" :
                      isUpcoming ? "bg-blue-500/10 text-blue-500" : "bg-red/10 text-red"
                    )}>
                      {isOpen ? "Đang diễn ra" : isUpcoming ? "Sắp tới" : "Đã kết thúc"}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-dark-blue dark:text-white mb-3 line-clamp-2 leading-tight">
                    {exam.title}
                  </h3>
                  
                  <div className="space-y-3 mb-8 flex-1">
                    <div className="flex items-center gap-3 text-sm text-gray-navy dark:text-light-blue/50">
                      <Clock className="size-4" />
                      <span>{exam.duration_minutes} phút</span>
                    </div>
                    {startTime && (
                      <div className="flex items-center gap-3 text-sm text-gray-navy dark:text-light-blue/50">
                        <Calendar className="size-4 shrink-0" />
                        <div className="flex flex-col">
                          <span>Bắt đầu: {format(startTime, "HH:mm, dd/MM/yyyy", { locale: vi })}</span>
                          {endTime && (
                            <span>Kết thúc: {format(endTime, "HH:mm, dd/MM/yyyy", { locale: vi })}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Link 
                    href={`/exams/${exam.id}`}
                    className={cn(
                      "w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all",
                      isOpen 
                        ? "bg-purple text-white shadow-lg shadow-purple-500/20 hover:scale-[1.02]" 
                        : isUpcoming 
                            ? "bg-gray-100 dark:bg-white/5 text-gray-navy opacity-50 cursor-not-allowed"
                            : "bg-gray-100 dark:bg-white/5 text-gray-navy opacity-50"
                    )}
                    onClick={(e) => !isOpen && e.preventDefault()}
                  >
                    {isUpcoming ? "Chưa đến giờ" : isEnded ? "Đã kết thúc" : "Vào phòng thi"}
                    {isOpen && <ArrowRight className="size-5" />}
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}
