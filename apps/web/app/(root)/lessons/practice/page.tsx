"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useLessons } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Zap,
  ChevronRight,
  BookOpen,
  Trophy,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LessonsTabLayout } from "@/components/lessons/lessons-tab-layout";

export default function LessonsPracticePage() {
  const router = useRouter();
  const { data: lessons = [], isLoading: isLoadingLessons } = useLessons();

  return (
    <LessonsTabLayout activeTab="practice">
      <div className="w-full space-y-8 text-left">
        {/* General Practice Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-emerald-600 
            via-teal-600 to-indigo-900 p-8 md:p-10 border border-white/20 shadow-2xl shadow-emerald-500/20 
            dark:shadow-indigo-500/20 text-white flex flex-col md:flex-row justify-between items-start 
            md:items-center gap-6"
        >
          <div className="absolute right-0 top-0 size-50 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-xs font-black uppercase tracking-widest text-amber-300">
              <Zap className="size-4 animate-bounce text-amber-300 fill-current" />
              Chế độ Gamification
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Luyện tập <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-250 to-teal-200">Tổng hợp</span>
            </h2>
            <p className="text-emerald-50 text-sm md:text-base leading-relaxed opacity-95">
              Thách thức bản thân với bộ câu hỏi ngẫu nhiên được tổng hợp từ tất cả các bài học. Đánh bại quái vật, kiếm vàng và tích lũy điểm số!
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/practice")}
            className="px-8 py-5 rounded-[2rem] bg-white text-emerald-900 hover:bg-emerald-50 font-black uppercase tracking-wider text-xs flex items-center gap-3 shadow-2xl transition-all whitespace-nowrap self-stretch md:self-auto justify-center"
          >
            <Play className="size-5 fill-current" />
            Vào đấu trường
          </motion.button>
        </motion.div>

        {/* Section title */}
        <div className="space-y-2 pt-4">
          <h3 className="text-2xl font-bold text-dark-blue dark:text-white">Luyện tập theo bài học</h3>
          <p className="text-sm text-gray-navy dark:text-light-blue opacity-60">Chọn từng bài học cụ thể để rèn luyện và củng cố kiến thức trọng tâm.</p>
        </div>

        {isLoadingLessons ? (
          <div className="flex flex-col items-center py-20 opacity-30">
            <div className="size-10 border-4 border-primary border-t-transparent animate-spin rounded-full mb-4" />
            <p className="font-bold">Đang tải danh sách bài học...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {lessons.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="group"
                >
                  <Card className="h-full border-none shadow-xl bg-white dark:bg-navy-blue/40 rounded-3xl overflow-hidden flex flex-col justify-between">
                    <div className="h-2 w-full bg-indigo-500/10 group-hover:bg-indigo-500 transition-colors" />
                    <CardContent className="p-8 text-left flex-1 flex flex-col justify-between gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="size-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black text-2xl group-hover:bg-indigo-500 group-hover:text-white transition-all">
                            {lesson.order}
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-550/10 text-indigo-500 border-none">
                            Luyện tập
                          </span>
                        </div>

                        <h3 className="text-2xl font-bold text-dark-blue dark:text-white group-hover:text-indigo-500 transition-colors line-clamp-2 min-h-[4rem]">
                          {lesson.name}
                        </h3>
                        <p className="text-gray-navy dark:text-light-blue text-sm line-clamp-2 opacity-70">
                          {lesson.description || "Thực hành ngay các câu hỏi trắc nghiệm của bài học này để chuẩn bị tốt nhất."}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                        <Button
                          onClick={() => router.push(`/practice?lessonId=${lesson.id}`)}
                          className="w-full py-6 rounded-2xl bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-all"
                        >
                          <Play className="size-4 fill-current" />
                          Bắt đầu luyện tập
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </LessonsTabLayout>
  );
}
