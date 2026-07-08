"use client";

import React from "react";
import { motion } from "framer-motion";
import { Timer, Zap, Swords } from "lucide-react";
import { type GameQuestion } from "../types";

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
        <h3 className="text-sm md:text-base lg:text-lg font-extrabold leading-relaxed text-zinc-900 dark:text-white mb-6 min-h-[50px] whitespace-pre-wrap">
          {currentQuestion.content}
        </h3>

        {/* Answers Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOptionId === option.id;
            const isHidden = hiddenOptions.includes(option.id);

            let btnStyles = "border-zinc-900 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-slate-800 text-zinc-900 dark:text-slate-100 bg-stone-50 dark:bg-slate-950 shadow-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-200";
            
            if (isAnswered) {
              // Wait, the client doesn't know which option is correct beforehand since BE handles it!
              // But when isAnswered is true, we have a selectedOptionId, and we need to show correctness.
              // Wait! How do we know which option is correct?
              // The backend PATCH `/answers` returns `is_correct`.
              // Wait! If the user answered, did the server reveal the correct answer?
              // Let's check `patch_game_answer.py` or the schema `GamificationAnswerResultOut`.
              // Ah! The API response `GamificationAnswerResultOut` has:
              // `is_correct: bool`
              // But it does NOT tell us the correct option_id if we choose wrong!
              // Wait, let's verify if the server returns the correct answer.
              // Looking at the pydantic schema of `GamificationAnswerResultOut` in `game.py`:
              // `is_correct: bool`, `points_gained: int`, `coins_gained: int`, `updated_gamification: dict`, `is_game_over: bool`.
              // It does NOT return `correct_option_id`!
              // Oh! If the user answers incorrectly, how do we show which one was correct?
              // Wait, in `page.tsx` line 320:
              // `const isCorrect = optionId !== null && currentQuestion?.options.find((o: any) => o.id === optionId)?.is_correct === true;`
              // Ah! In the mock frontend, `currentQuestion` has `options: [{ id: "a", text: "const", is_correct: true }]` (the mock questions had `is_correct` in them!).
              // But the real backend cleans up `options` before sending them to the client!
              // Let's check `start_game_session.py` lines 77-83:
              // ```python
              // def clean_options(options):
              //     cleaned = []
              //     for opt in options:
              //         o_dict = opt.to_dict()
              //         o_dict.pop("is_correct", None)
              //         cleaned.append(o_dict)
              //     return cleaned
              // ```
              // Yes! The server removes `is_correct` from the options so that the client cannot cheat!
              // That is a classic security practice!
              // So the frontend does NOT know which option is the correct one when rendering the question.
              // Then how do we show the result of the answer?
              // If `isAnswered` is true:
              // - If the user selected this option and the response said `is_correct` was true, then this option is correct! We style it green.
              // - If the user selected this option and the response said `is_correct` was false, then this option is incorrect! We style it red.
              // - What about the other options? We cannot easily show which one was the correct one since the server didn't tell us, OR we can just style all other options as disabled (reduced opacity).
              // Wait! This is actually normal and fair. If they select a wrong option, they only see that their selection was wrong (red), and they can guess/study later. Or we can highlight the selected one as red, and keep all others dimmed.
              // Let's check if the server returns any info. It doesn't, so that's the only way!
              // Let's implement this logic:
              // If selected:
              //   If was correct: green
              //   If was incorrect: red
              // If not selected:
              if (isSelected) {
                btnStyles = isSelectedCorrect 
                  ? "border-emerald-500 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-sm shadow-emerald-500/20" 
                  : "border-red-500 bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 shadow-sm shadow-red-500/20";
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
                disabled={isAnswered || isHidden}
                onClick={() => onSubmitAnswer(option.id)}
                className={`w-full text-left p-3.5 border-2 transition-all duration-200 flex items-start gap-3 rounded-none relative group overflow-hidden ${btnStyles}`}
              >
                <span className="font-extrabold text-cyan-600 dark:text-cyan-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors duration-200">
                  {option.id.toUpperCase()}.
                </span>

                <span className="text-xs md:text-sm font-bold leading-normal">
                  {option.text}
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
    </div>
  );
}
