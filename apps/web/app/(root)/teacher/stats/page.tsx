"use client";

import React, { useState } from "react";
import { useExamsFull } from "@/lib/queries";
import { BookOpen, Search, ArrowRight, BarChart3, Clock, Users } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { parseICT } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function TeacherStatsPage() {
  const { data: exams = [], isLoading } = useExamsFull();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredExams = exams.filter(ex => 
    ex.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-gray-200 dark:bg-white/5 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-[2rem] bg-gray-100 dark:bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
              <BarChart3 className="size-6 text-blue-500" />
            </div>
            <h1 className="text-4xl font-black text-dark-blue dark:text-white">
              Thống kê kết quả
            </h1>
          </div>
          <p className="text-gray-navy dark:text-light-blue/60 font-medium ml-16">
            Chọn một kỳ thi để xem phân tích chi tiết và kết quả của sinh viên.
          </p>
        </div>

        <div className="relative group min-w-[300px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-gray-navy/40 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Tìm kiếm kỳ thi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-black dark:text-white"
          />
        </div>
      </header>

      {filteredExams.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
          <BarChart3 className="size-20" />
          <p className="text-xl font-bold uppercase tracking-widest">Không tìm thấy kỳ thi nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredExams.map((exam, idx) => {
            const startTime = exam.start_time ? parseICT(exam.start_time) : null;
            
            return (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link 
                  href={`/teacher/stats/${exam.id}`}
                  className="group block relative h-full bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-8 transition-all duration-300 hover:translate-y-[-8px] hover:border-blue-500/30 shadow-sm hover:shadow-xl hover:shadow-blue-500/10"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="size-14 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                      <BookOpen className="size-7 text-blue-500" />
                    </div>
                    <div className="size-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                      <ArrowRight className="size-5" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-dark-blue dark:text-white mb-4 line-clamp-2">
                    {exam.title}
                  </h3>

                  <div className="space-y-3 mt-auto">
                    <div className="flex items-center gap-3 text-sm text-gray-navy dark:text-light-blue/50">
                      <Clock className="size-4" />
                      <span>{exam.duration_minutes} phút</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-navy dark:text-light-blue/50">
                      <Users className="size-4" />
                      <span>{exam.participant_ids.length} sinh viên</span>
                    </div>
                    {startTime && (
                      <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 mt-4">
                        {format(startTime, "dd MMM yyyy", { locale: vi })}
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
