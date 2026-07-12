"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HelpCircle, Edit3, Trash2 } from "lucide-react";
import type { Lesson } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TeacherLessonRowProps {
  lesson: Lesson;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function TeacherLessonRow({
  lesson,
  index,
  onEdit,
  onDelete,
}: TeacherLessonRowProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/lessons/${lesson.slug || lesson.id}?preview=true`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="w-full"
    >
      <Card 
        onClick={handleCardClick}
        className="cursor-pointer border border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-sm hover:shadow-md hover:border-primary/30 dark:hover:border-primary/30 rounded-2xl transition-all duration-300 overflow-hidden"
      >
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 text-left">
          {/* Order Badge / Avatar */}
          <div className="flex items-center gap-4">
            <div className="size-11 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 flex items-center justify-center text-primary dark:text-primary-foreground font-black text-base shrink-0 shadow-inner">
              {lesson.order}
            </div>
            
            {/* Mobile Actions/Titles helper info */}
            <div className="sm:hidden flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-widest text-primary/80 mb-0.5 block">
                Chương {lesson.order}
              </span>
              <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm leading-snug">
                {lesson.name}
              </h3>
            </div>
          </div>

          {/* Desktop Title & Details */}
          <div className="hidden sm:block flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-base lg:text-lg leading-snug hover:text-primary transition-colors">
                {lesson.name}
              </h3>
              {lesson.slug && (
                <Badge variant="secondary" className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-none">
                  {lesson.slug}
                </Badge>
              )}
            </div>
            <p className="text-xs lg:text-sm text-slate-500 dark:text-zinc-400 mt-1 line-clamp-1 font-medium">
              {lesson.description || "Chưa có mô tả ngắn nào cho bài học này."}
            </p>
          </div>

          {/* Mobile Description */}
          <p className="sm:hidden text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 px-1">
            {lesson.description || "Chưa có mô tả ngắn nào cho bài học này."}
          </p>

          {/* Action Buttons Group */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 mt-2 sm:mt-0 ml-auto sm:ml-0 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 border-slate-100 dark:border-zinc-800 pt-3 sm:pt-0"
          >
            <Link
              href={`/teacher/lessons/${lesson.id}/questions`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary transition-all duration-200 font-bold flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <HelpCircle className="size-3.5" />
              <span className="hidden lg:inline">Câu hỏi</span>
            </Link>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-xs px-3 py-2 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white dark:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500 dark:hover:text-white transition-all duration-200 font-bold flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Edit3 className="size-3.5" />
              <span>Sửa</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-xs px-3 py-2 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white dark:bg-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500 dark:hover:text-white transition-all duration-200 font-bold flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Trash2 className="size-3.5" />
              <span>Xoá</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
