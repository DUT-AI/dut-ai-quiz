"use client";

import React from "react";
import { HelpCircle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/markdown";
import { QuestionDetailModal } from "@/features/questions/components";
import type { QuestionOut } from "@/features/questions/types";

interface QuestionStat {
  question_id: string;
  content: string;
  correct_rate: number;
}

interface QuestionAnalysisTabProps {
  questionStats: QuestionStat[];
  questionMap: Map<string, QuestionOut>;
}

export function QuestionAnalysisTab({ questionStats, questionMap }: QuestionAnalysisTabProps) {
  const [detailQuestion, setDetailQuestion] = React.useState<{ question: QuestionOut; correctRate: number } | null>(null);

  return (
    <div className="bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 rounded-[3rem] p-8 md:p-10 shadow-sm">
      <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
        <HelpCircle className="size-5 text-blue-500" />
        Phân tích câu hỏi
      </h3>
      <div className="space-y-6">
        {questionStats.map((q, idx) => {
          const qDetail = questionMap.get(q.question_id);
          return (
            <div 
              key={q.question_id} 
              className={cn(
                "group space-y-3 p-5 rounded-3xl border border-gray-100 dark:border-white/5 transition-all select-none",
                qDetail ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 hover:border-blue-500/20" : ""
              )}
              onClick={() => {
                if (qDetail) {
                  setDetailQuestion({ question: qDetail, correctRate: q.correct_rate });
                }
              }}
            >
              <div className="flex justify-between items-start gap-4">
                <Markdown 
                  content={`${idx + 1}. ${q.content}`}
                  className="text-sm font-bold text-dark-blue dark:text-white line-clamp-2"
                />
                <span className={cn(
                  "text-xs font-black shrink-0 flex items-center gap-1",
                  q.correct_rate > 0.7 ? "text-green-500" : q.correct_rate < 0.4 ? "text-red" : "text-orange"
                )}>
                  {Math.round(q.correct_rate * 100)}% đúng
                  {qDetail && <ChevronRight className="size-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />}
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${q.correct_rate * 100}%` }}
                  transition={{ duration: 1, delay: idx * 0.1 }}
                  className={cn(
                    "h-full rounded-full transition-all",
                    q.correct_rate > 0.7 ? "bg-green-500" : q.correct_rate < 0.4 ? "bg-red shadow-sm shadow-red/20" : "bg-orange"
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal chi tiết câu hỏi */}
      <AnimatePresence>
        {detailQuestion && (
          <QuestionDetailModal 
            question={detailQuestion.question}
            correctRate={detailQuestion.correctRate}
            onClose={() => setDetailQuestion(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
