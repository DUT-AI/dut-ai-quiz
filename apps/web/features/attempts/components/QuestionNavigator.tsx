"use client";

import React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { QuizQuestion } from "../types";

interface QuestionNavigatorProps {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Record<string, string | null>;
  isOpen: boolean;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  questions,
  currentIndex,
  answers,
  isOpen,
  onClose,
  onSelectIndex,
}) => {
  const answeredCount = Object.keys(answers).filter((id) => answers[id]).length;
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  return (
    <>
      <aside
        className={cn(
          "absolute inset-y-0 left-0 w-80 bg-white dark:bg-navy-blue border-r border-gray-100 dark:border-white/5 transition-transform duration-300 z-40 p-6 flex flex-col gap-6",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase text-gray-navy opacity-40 tracking-widest italic">
            Danh sách câu hỏi
          </h3>
          <button onClick={onClose} className="lg:hidden">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 h-full">
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, i) => {
              const qId = q.question_id || q.id;
              const hasAnswer = qId ? !!answers[qId] : false;
              const isCurrent = currentIndex === i;

              return (
                <button
                  key={qId || i}
                  onClick={() => {
                    onSelectIndex(i);
                    onClose();
                  }}
                  className={cn(
                    "size-10 rounded-xl flex items-center justify-center text-xs font-black transition-all border",
                    isCurrent
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                      : hasAnswer
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-gray-50 dark:bg-white/5 text-gray-navy border-transparent"
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-gray-50 dark:bg-white/5 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase opacity-60">
            <span>Tiến độ</span>
            <span>
              {answeredCount}/{questions.length}
            </span>
          </div>
          <div className="h-1.5 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile navigator drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
};
