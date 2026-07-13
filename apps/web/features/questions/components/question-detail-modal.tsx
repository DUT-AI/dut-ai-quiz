"use client";

import React from "react";
import { motion } from "framer-motion";
import { X, CheckCircle2, Lightbulb } from "lucide-react";
import { Markdown } from "@/components/markdown";
import type { QuestionOut } from "@/features/questions/types";
import { cn } from "@/lib/utils";

interface QuestionDetailModalProps {
  question: QuestionOut;
  correctRate: number;
  onClose: () => void;
}

export function QuestionDetailModal({ question, correctRate, onClose }: QuestionDetailModalProps) {

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-navy-blue w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-gray-100 dark:border-white/5"
      >
        <div className="p-8 md:p-10 max-h-[85vh] overflow-y-auto custom-scrollbar text-left">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                correctRate > 0.7 ? "bg-green-500/10 text-green-500" : correctRate < 0.4 ? "bg-red/10 text-red" : "bg-orange/10 text-orange"
              )}>
                Tỉ lệ đúng: {Math.round(correctRate * 100)}%
              </span>
              {question.difficulty && (
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                  question.difficulty === "EASY" && "bg-green-500/10 text-green-500 border-green-500/20",
                  question.difficulty === "MEDIUM" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                  question.difficulty === "HARD" && "bg-red/10 text-red border-red/20"
                )}>
                  Độ khó: {question.difficulty === "EASY" ? "Dễ" : question.difficulty === "MEDIUM" ? "Trung bình" : "Khó"}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="size-5 text-gray-navy" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Question Content */}
            <div className="space-y-2">
              <h3 className="font-black text-dark-blue dark:text-white uppercase tracking-widest text-[10px] opacity-40">
                Câu hỏi
              </h3>
              <Markdown 
                content={question.content}
                className="text-lg font-bold text-dark-blue dark:text-white leading-relaxed"
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <h3 className="font-black text-dark-blue dark:text-white uppercase tracking-widest text-[10px] opacity-40">
                Các phương án lựa chọn
              </h3>
              <div className="space-y-3">
                {question.options.map((opt: any, idx: number) => {
                  const letter = String.fromCharCode(65 + idx);
                  return (
                    <div 
                      key={opt.id || idx}
                      className={cn(
                        "p-4 rounded-2xl border transition-all flex items-start gap-3",
                        opt.is_correct 
                          ? "bg-green-500/10 border-green-500/30 text-green-500 dark:text-green-400 font-bold" 
                          : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-navy dark:text-light-blue"
                      )}
                    >
                      <span className={cn(
                        "size-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                        opt.is_correct ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-white/10 text-gray-navy"
                      )}>
                        {letter}
                      </span>
                      <Markdown 
                        content={opt.text}
                        className="flex-1 text-sm font-medium"
                      />
                      {opt.is_correct && <CheckCircle2 className="size-4 text-green-500 shrink-0 mt-1" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Solution */}
            {question.solution?.trim() && (
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-white/5">
                <h3 className="flex items-center gap-2 font-black text-dark-blue dark:text-white uppercase tracking-widest text-[10px] opacity-40">
                  <Lightbulb className="size-3" />
                  Hướng dẫn giải chi tiết
                </h3>
                <div className="bg-primary/5 dark:bg-white/5 p-5 rounded-2xl border border-primary/10">
                  <Markdown
                    content={question.solution}
                    className="text-dark-blue dark:text-white leading-relaxed text-sm font-medium"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
