"use client";

import React from "react";
import { motion } from "framer-motion";
import { Timer, Zap, Swords } from "lucide-react";
import { type GameQuestion } from "../types";
import { Markdown } from "@/components/markdown";

interface PracticeQuestionCardProps {
  currentQuestion: GameQuestion;
  currentIdx: number;
  totalQuestions: number;
  stage: number;
  doubleActive: boolean;
  timeLeft: number;
  timerMax: number;
  timerFrozen: boolean;
  selectedOptionId: string | null;
  isAnswered: boolean;
  isSelectedCorrect: boolean;
  hiddenOptions: string[];
  onSubmitAnswer: (optionId: string) => void;
  onNextQuestion: () => void;
  correctOptionId: string | null;
}

export default function PracticeQuestionCard({
  currentQuestion,
  currentIdx,
  totalQuestions,
  stage,
  doubleActive,
  timeLeft,
  timerMax,
  timerFrozen,
  selectedOptionId,
  isAnswered,
  isSelectedCorrect,
  hiddenOptions,
  onSubmitAnswer,
  onNextQuestion,
  correctOptionId,
}: PracticeQuestionCardProps) {
  return (
    <div className="w-full flex flex-col gap-4 items-center">
      {/* ⏳ DYNAMIC TIMER BAR (Cartoon Progress Bar) */}
      <div className="w-full bg-white dark:bg-slate-900 border-3 border-zinc-900 dark:border-slate-700 p-2 md:p-3 rounded-none shadow-md text-zinc-900 dark:text-slate-100 relative">
        <div className="flex items-center justify-between text-[11px] md:text-xs font-mono font-bold text-zinc-700 dark:text-slate-350 px-1 pb-1.5 border-b border-zinc-100 dark:border-slate-800">
          <span className="flex items-center gap-1.5">
            <Timer className={`w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500 ${timerFrozen ? "" : "animate-spin"}`} />
            <span>{timerFrozen ? "THỜI GIAN ĐÃ BỊ ĐÓNG BĂNG" : "THỜI GIAN CO RÚT SUY NGHĨ"}</span>
          </span>
          <span className={`${timeLeft < 4 ? "text-red-500 animate-pulse font-extrabold" : "text-zinc-700 dark:text-slate-300"}`}>
            {timeLeft}s
          </span>
        </div>
        <div className="h-2.5 md:h-3 w-full bg-zinc-200 dark:bg-slate-950 border-2 border-zinc-900 dark:border-slate-850 rounded-none overflow-hidden relative mt-1">
          <motion.div
            className={`h-full ${
              timerFrozen
                ? "bg-sky-400 dark:bg-sky-500"
                : timeLeft > timerMax * 0.5
                ? "bg-emerald-400 dark:bg-emerald-500"
                : timeLeft > timerMax * 0.25
                ? "bg-amber-400 dark:bg-amber-500"
                : "bg-red-400 dark:bg-red-500"
            }`}
            initial={{ width: "100%" }}
            animate={{ width: `${(timeLeft / timerMax) * 100}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>
      </div>

      {/* ─── QUESTION CARD & ANSWERS GRID (Cartoon White Box Style) ─── */}
      <div className="w-full bg-white dark:bg-slate-900 border-3 border-zinc-900 dark:border-slate-700 p-4 md:p-6 rounded-none relative shadow-lg text-zinc-900 dark:text-slate-100 font-mono">
        {/* Active Double Points Buff Indicator */}
        {doubleActive && (
          <div className="absolute -top-3.5 -left-3.5 bg-amber-400 text-zinc-900 border-2 border-zinc-900 font-extrabold text-[9px] md:text-[10px] px-2 py-1 flex items-center gap-1 shadow-sm z-20 animate-bounce">
            <Zap className="w-3.5 h-3.5 text-zinc-900 fill-zinc-900" />
            <span>NHÂN PHẨM X2 ĐIỂM KÍCH HOẠT</span>
          </div>
        )}

        {/* Question Info Header */}
        <div className="flex justify-between items-center text-xs md:text-sm text-zinc-500 dark:text-slate-400 tracking-wider mb-4 border-b-2 border-zinc-150 dark:border-slate-800 pb-2.5 font-bold">
          <span className="text-cyan-600 dark:text-cyan-400 font-extrabold">
            [ ẢI THỬ THÁCH CÂU HỎI {currentIdx + 1} / {totalQuestions} ]
          </span>
          <span>TẦNG ẢI {stage} / 3</span>
        </div>

        {/* Question Body Text */}
        <div className="text-sm md:text-base lg:text-lg font-extrabold leading-relaxed text-zinc-900 dark:text-white mb-6 min-h-[50px] theory-markdown-content">
          <Markdown content={currentQuestion.content} />
        </div>

        {/* Answers Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOptionId === option.id;
            const isHidden = hiddenOptions.includes(option.id);

            let btnStyles = "border-zinc-900 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-slate-800 text-zinc-900 dark:text-slate-100 bg-stone-50 dark:bg-slate-950 shadow-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-200";
            
            if (isAnswered) {
              const isCorrectOption = correctOptionId === option.id;
              if (isSelected) {
                btnStyles = isSelectedCorrect 
                  ? "border-emerald-500 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-sm shadow-emerald-500/20" 
                  : "border-red-500 bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 shadow-sm shadow-red-500/20";
              } else if (isCorrectOption) {
                btnStyles = "border-emerald-500 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-sm shadow-emerald-500/20";
              } else {
                btnStyles = "border-zinc-200 dark:border-slate-800 text-zinc-300 dark:text-slate-700 bg-zinc-50 dark:bg-slate-950 opacity-30 cursor-default shadow-none pointer-events-none";
              }
            } else if (selectedOptionId) {
              if (isSelected) {
                btnStyles = "border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-zinc-900 dark:text-white animate-pulse shadow-sm";
              } else {
                btnStyles = "border-zinc-200 dark:border-slate-800 text-zinc-300 dark:text-slate-700 bg-zinc-50 dark:bg-slate-950 opacity-30 cursor-default shadow-none pointer-events-none";
              }
            } else if (isHidden) {
              btnStyles = "border-zinc-100 dark:border-slate-850 text-zinc-200 dark:text-slate-800 bg-zinc-50 dark:bg-slate-950 opacity-10 cursor-not-allowed pointer-events-none shadow-none";
            }

            return (
              <button
                key={option.id}
                type="button"
                disabled={isAnswered || !!selectedOptionId || isHidden}
                onClick={() => onSubmitAnswer(option.id)}
                className={`w-full text-left p-3.5 border-2 transition-all duration-200 flex items-start gap-3 rounded-none relative group overflow-hidden ${btnStyles}`}
              >
                <span className="font-extrabold text-cyan-600 dark:text-cyan-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors duration-200">
                  {String.fromCharCode(65 + idx)}.
                </span>

                <span className="text-xs md:text-sm font-bold leading-normal option-markdown">
                  <Markdown content={option.text} />
                </span>
              </button>
            );
          })}
        </div>

        {/* Continue/Next Action Button */}
        {isAnswered && (
          <motion.div
            className="mt-6 flex justify-end"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              type="button"
              onClick={onNextQuestion}
              className="px-6 py-2.5 font-extrabold tracking-wider rounded-none bg-emerald-500 hover:bg-emerald-400 text-white font-mono text-xs md:text-sm border-2 border-zinc-900 dark:border-slate-700 shadow-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-2"
            >
              <span>TIẾP TỤC HÀNH TRÌNH</span>
              <Swords className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </div>
      <style jsx global>{`
        .option-markdown p {
          margin: 0 !important;
          display: inline !important;
        }
        .option-markdown img {
          pointer-events: none !important;
          cursor: default !important;
        }
      `}</style>
    </div>
  );
}
