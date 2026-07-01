"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLessons } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ChevronRight,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
export default function LessonsContentPage() {
  const router = useRouter();
  const { data: lessons = [], isLoading: isLoadingLessons } = useLessons();

  return (
    <div className="w-full space-y-8">
      {/* Page Header */}
      <div className="text-left">
        <h1 className="text-4xl md:text-5xl font-bold text-dark-blue dark:text-white">
          Học tập & <span className="text-primary">Khám phá</span>
        </h1>
        <p className="text-gray-navy dark:text-light-blue mt-2">
          Hệ thống lộ trình bài học giúp bạn nắm vững kiến thức từ cơ bản đến nâng cao.
        </p>
      </div>

      <div className="w-full">

        {isLoadingLessons ? (
          <div className="flex flex-col items-center py-20 opacity-30">
            <div className="size-10 border-4 border-primary border-t-transparent animate-spin rounded-full mb-4" />
            <p className="font-bold">Đang tải giáo trình...</p>
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
                  onClick={() => router.push(`/lessons/${lesson.slug || lesson.id}`)}
                  className="cursor-pointer"
                >
                  <Card className="h-full border-none shadow-xl bg-white dark:bg-navy-blue/40 rounded-3xl overflow-hidden group">
                    <div className="h-2 w-full bg-primary/10 group-hover:bg-primary transition-colors" />
                    <CardContent className="p-8 text-left">
                      <div className="flex justify-between items-start mb-6">
                        <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl group-hover:bg-primary group-hover:text-white transition-all">
                          {lesson.order}
                        </div>
                        <Badge className="bg-green/10 text-green border-none">Sẵn sàng</Badge>
                      </div>

                      <h3 className="text-2xl font-bold text-dark-blue dark:text-white mb-3 group-hover:text-primary transition-colors">
                        {lesson.name}
                      </h3>
                      <p className="text-gray-navy dark:text-light-blue text-sm line-clamp-2 mb-6 opacity-70">
                        {lesson.description || "Tìm hiểu sâu về các khái niệm và bài tập thực hành của chương học này."}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2 text-xs text-gray-navy font-bold uppercase tracking-widest opacity-60">
                          <FileText className="size-4" />
                          Kiến thức trọng tâm
                        </div>
                        <ChevronRight className="size-5 text-primary group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}


      </div>
    </div>
  );
}



function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", className)}>
      {children}
    </span>
  );
}
