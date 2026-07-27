"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  FileText, 
  Video, 
  Brain, 
  Cpu, 
  Code, 
  Network, 
  ArrowRight, 
  Sparkles,
  Layers
} from "lucide-react";
import type { Lesson } from "@/features/lessons/types";

interface Props {
  lesson: Lesson;
  index: number;
}

// Function to select a suitable icon based on lesson title keywords
function getLessonIcon(name: string) {
  const lowercaseName = name.toLowerCase();
  
  if (lowercaseName.includes("cnn") || lowercaseName.includes("neural") || lowercaseName.includes("mạng") || lowercaseName.includes("model")) {
    return Network;
  }
  if (lowercaseName.includes("brain") || lowercaseName.includes("trí tuệ") || lowercaseName.includes("ai") || lowercaseName.includes("deep")) {
    return Brain;
  }
  if (lowercaseName.includes("code") || lowercaseName.includes("lập trình") || lowercaseName.includes("python") || lowercaseName.includes("java")) {
    return Code;
  }
  if (lowercaseName.includes("cpu") || lowercaseName.includes("gpu") || lowercaseName.includes("phần cứng") || lowercaseName.includes("concurrency") || lowercaseName.includes("parallel")) {
    return Cpu;
  }
  if (lowercaseName.includes("layer") || lowercaseName.includes("tầng") || lowercaseName.includes("chương") || lowercaseName.includes("dropout")) {
    return Layers;
  }
  if (lowercaseName.includes("video") || lowercaseName.includes("clip") || lowercaseName.includes("xem")) {
    return Video;
  }
  if (lowercaseName.includes("bài tập") || lowercaseName.includes("thực hành") || lowercaseName.includes("quiz") || lowercaseName.includes("thi")) {
    return Sparkles;
  }
  return BookOpen;
}

export function LessonNodeCard({ lesson, index }: Props) {
  const router = useRouter();
  const Icon = getLessonIcon(lesson.name);

  const handleClick = () => {
    router.push(`/lessons/${lesson.slug || lesson.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -5, scale: 1.015 }}
      onClick={handleClick}
      className="group cursor-pointer w-full text-left"
    >
      <div className="relative h-full overflow-hidden rounded-2xl transition-all duration-300
        bg-white/70 dark:bg-navy-blue/40 
        backdrop-blur-md 
        border border-slate-200/60 dark:border-white/10 
        hover:border-primary/50 dark:hover:border-primary/40
        shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] 
        hover:shadow-2xl hover:shadow-primary/10 dark:hover:shadow-primary/5
        p-6 flex flex-col justify-between gap-4"
      >
        {/* Decorative Top Accent Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10 group-hover:from-primary/40 group-hover:via-primary/80 group-hover:to-primary/40 transition-all duration-300" />
        
        <div>
          {/* Badge & Icon Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="size-11 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center transition-all duration-300 group-hover:bg-primary group-hover:text-white dark:group-hover:text-navy-blue shadow-inner">
              <Icon className="size-5 transition-transform duration-300 group-hover:scale-110" />
            </div>
            
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-gray-navy dark:text-light-blue/70">
              Bài {lesson.order}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-lg font-bold text-dark-blue dark:text-white leading-snug group-hover:text-primary transition-colors duration-200 line-clamp-2">
            {lesson.name}
          </h4>

          {/* Description */}
          <p className="text-xs text-gray-navy/80 dark:text-light-blue/70 mt-2 font-medium line-clamp-2 leading-relaxed">
            {lesson.description || "Tìm hiểu các kiến thức cốt lõi và bài tập liên quan của bài học này."}
          </p>
        </div>

        {/* Footer Navigation Link */}
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-150/50 dark:border-white/5 text-[11px] font-black uppercase tracking-widest text-gray-navy/60 dark:text-light-blue/50 group-hover:text-primary transition-colors duration-200">
          <span className="flex items-center gap-1.5">
            <FileText className="size-3.5" />
            Vào học ngay
          </span>
          <ArrowRight className="size-4 transform translate-x-0 group-hover:translate-x-1.5 transition-transform duration-200" />
        </div>
      </div>
    </motion.div>
  );
}
