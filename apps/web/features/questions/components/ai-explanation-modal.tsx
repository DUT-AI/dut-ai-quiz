"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, X, Lightbulb, CheckCircle2 } from "lucide-react";

import { renderMathInHTML } from "@/lib/render-math";
import type { QuestionOut } from "@/lib/types";

interface AIExplanationModalProps {
  question: QuestionOut;
  onClose: () => void;
}

export function AIExplanationModal({ question, onClose }: AIExplanationModalProps) {
  const solutionHtml = useMemo(() => {
    return question.solution
      ? renderMathInHTML(question.solution)
      : "Bài học này hiện chưa có lời giải chi tiết. Hãy thử thảo luận cùng giảng viên nhé!";
  }, [question.solution]);

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
        className="bg-white dark:bg-navy-blue w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-white/10 max-h-[85vh] md:max-h-[90vh] flex flex-col"
      >
        <div className="p-6 md:p-10 text-left flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-6 md:mb-8 shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Sparkles className="size-5" />
              </div>
              <h2 className="text-2xl font-bold text-dark-blue dark:text-white">
                Hướng dẫn <span className="text-primary">Giải đáp</span>
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="size-6 text-gray-navy" />
            </button>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto pr-1 md:pr-2 select-text">
            <div className="p-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-navy dark:text-light-blue opacity-80 text-sm italic">
              &quot;{question.content.substring(0, 150)}
              {question.content.length > 150 ? "..." : ""}&quot;
            </div>

            <div className="flex flex-col items-start pt-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 text-left w-full"
              >
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 font-black text-dark-blue dark:text-white uppercase tracking-widest text-[10px] opacity-40">
                    <Lightbulb className="size-3" />
                    Lời giải / Gợi ý
                  </h3>
                  <div className="bg-primary/5 dark:bg-white/5 p-6 rounded-3xl border border-primary/10">
                    <div
                      className="text-dark-blue dark:text-white leading-relaxed font-medium text-lg"
                      dangerouslySetInnerHTML={{ __html: solutionHtml }}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-3 text-xs text-gray-navy dark:text-light-blue opacity-60">
                    <CheckCircle2 className="size-4 text-green" />
                    Nội dung trên giúp bạn nắm bắt phương pháp giải bài tập.
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
