"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ChevronRight } from "lucide-react";
import { Lesson } from "../types";

interface LessonCardProps {
  lesson: Lesson;
  index: number;
  onClick: () => void;
}

export function LessonCard({ lesson, index, onClick }: LessonCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className="h-full border-none shadow-xl bg-white dark:bg-navy-blue/40 rounded-3xl overflow-hidden group">
        <div className="h-2 w-full bg-primary/10 group-hover:bg-primary transition-colors" />
        <CardContent className="p-8 text-left">
          <div className="flex justify-between items-start mb-6">
            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl group-hover:bg-primary group-hover:text-white transition-all">
              {lesson.order}
            </div>
            <Badge className="bg-green/10 text-green border-none hover:bg-green/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider">
              Sẵn sàng
            </Badge>
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
  );
}
