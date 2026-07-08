"use client";

import React from "react";
import { Trophy, Skull, RotateCcw, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PracticeLeaderboard from "./practice-leaderboard";

interface PracticeGameResultProps {
  lessonSlug: string;
  gameResult: "victory" | "defeat";
  score: number;
  gold: number;
  highestIdx: number;
  onRetry: () => void;
}

export default function PracticeGameResult({
  lessonSlug,
  gameResult,
  score,
  gold,
  highestIdx,
  onRetry,
}: PracticeGameResultProps) {
  const router = useRouter();

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start py-6 px-4 md:px-0">
      {/* Result Stats Box (7 cols) */}
      <div className="lg:col-span-7 flex justify-center">
        <motion.div
          className="w-full bg-white dark:bg-slate-900 border-3 border-zinc-900 dark:border-slate-700 p-8 rounded-none text-center shadow-lg text-zinc-900 dark:text-slate-100 font-mono"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          {gameResult === "victory" ? (
            <>
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/40 border-2 border-zinc-900 dark:border-slate-700 rounded-none flex items-center justify-center mx-auto mb-4 animate-bounce text-amber-500 shadow-sm">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-widest text-zinc-900 dark:text-white mb-2">
                CHINH PHỤC THÀNH CÔNG!
              </h2>
              <p className="text-xs text-zinc-550 dark:text-slate-400 mb-6 font-bold">
                Chúc mừng dũng sĩ! Bạn đã vượt qua tất cả thử thách leo tháp.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 border-2 border-zinc-900 dark:border-slate-700 rounded-none flex items-center justify-center mx-auto mb-4 animate-pulse text-red-500 shadow-sm">
                <Skull className="w-8 h-8" />
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-widest text-red-500 dark:text-red-400 mb-2">
                ĐẠI BẠI KHÔNG THỂ LEO THÁP!
              </h2>
              <p className="text-xs text-zinc-550 dark:text-slate-400 mb-6 font-bold">
                Đã hết sinh mệnh bảo toàn. Bạn hãy rèn luyện thêm để tái đấu nhé!
              </p>
            </>
          )}

          {/* End-Game Statistics Board */}
          <div className="bg-zinc-50 dark:bg-slate-950 border-2 border-zinc-900 dark:border-slate-800 p-4 text-xs text-left mb-8 space-y-3 shadow-sm rounded-none">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-slate-800 font-extrabold">
              <span className="text-zinc-500 dark:text-slate-400">TỔNG ĐIỂM ĐẠT ĐƯỢC:</span>
              <span className="font-extrabold text-cyan-600 dark:text-cyan-400">{score} PTS</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-slate-800 font-extrabold">
              <span className="text-zinc-500 dark:text-slate-400">VÀNG MANG VỀ:</span>
              <span className="font-extrabold text-amber-500">🪙 {gold} VÀNG</span>
            </div>
            <div className="flex justify-between items-center font-extrabold">
              <span className="text-zinc-500 dark:text-slate-400">ẢI LỚN NHẤT VƯỢT QUA:</span>
              <span className="font-extrabold text-zinc-900 dark:text-white">ẢI {highestIdx} / 20</span>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={onRetry}
              className="py-2.5 px-4 font-extrabold rounded-none bg-amber-400 hover:bg-amber-300 dark:bg-amber-500 dark:hover:bg-amber-400 text-zinc-900 font-mono text-xs border-2 border-zinc-900 dark:border-slate-700 shadow-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>TÁI ĐẤU</span>
            </button>
            <button
              type="button"
              onClick={() => router.push(`/lessons/${lessonSlug}`)}
              className="py-2.5 px-4 font-extrabold rounded-none bg-indigo-500 hover:bg-indigo-400 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-mono text-xs border-2 border-zinc-900 dark:border-slate-700 shadow-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>VỀ BÀI HỌC</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Leaderboard Column (5 cols) */}
      <div className="lg:col-span-5 w-full">
        <PracticeLeaderboard lessonSlug={lessonSlug} />
      </div>
    </div>
  );
}
