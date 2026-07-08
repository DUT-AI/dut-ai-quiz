"use client";

import React from "react";
import { Swords, Play, Heart, Coins, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import PracticePersonalBest from "./practice-personal-best";

interface PracticeStartScreenProps {
  lessonSlug: string;
  hasActiveSession: boolean;
  isStarting: boolean;
  onStart: () => void;
}

export default function PracticeStartScreen({
  lessonSlug,
  hasActiveSession,
  isStarting,
  onStart,
}: PracticeStartScreenProps) {
  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start py-6 px-4 md:px-0">
      {/* Rules / Intro Column (7 columns) */}
      <div className="lg:col-span-7 flex flex-col bg-white dark:bg-slate-900 border-3 border-zinc-900 dark:border-slate-700 p-6 md:p-8 relative shadow-lg text-zinc-900 dark:text-slate-100 font-mono">
        <div className="size-16 rounded-none bg-indigo-500/10 border-2 border-dashed border-indigo-500/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-6 mx-auto animate-bounce">
          <Swords className="size-8" />
        </div>

        <h3 className="text-2xl md:text-3xl font-black text-center text-zinc-900 dark:text-white mb-4">
          ĐẤU TRƯỜNG LUYỆN TẬP
        </h3>
        
        <p className="text-zinc-600 dark:text-slate-400 max-w-md mx-auto text-center text-xs md:text-sm leading-relaxed mb-6 font-bold">
          Chinh phục các câu hỏi leo tháp, thu thập vàng và sử dụng các vật phẩm phép thuật để đánh bại các Boss canh giữ!
        </p>

        {/* Rules Board */}
        <div className="bg-zinc-50 dark:bg-slate-950 border-2 border-zinc-900 dark:border-slate-800 p-4 mb-6 text-xs md:text-sm space-y-3 font-bold text-zinc-700 dark:text-slate-350">
          <div className="flex items-start gap-2">
            <span className="text-amber-500">▶</span>
            <p>Mỗi lượt chơi bắt đầu với <span className="text-red-500">3 Mạng (HP)</span>. Trả lời sai sẽ bị mất HP.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-500">▶</span>
            <p>Bạn sẽ leo qua 3 tầng ải: <span className="text-emerald-500">Dễ (Tầng 1)</span>, <span className="text-amber-500">Trung bình (Tầng 2)</span>, và <span className="text-rose-500">Khó (Tầng 3)</span>.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-500">▶</span>
            <p>Cuối mỗi tầng là cuộc chiến với <span className="text-red-500 font-extrabold">BOSS CANH GIỮ</span>. Trả lời sai khi đấu Boss bị mất <span className="text-red-500 font-extrabold">2 HP</span> và thời gian suy nghĩ bị rút ngắn còn <span className="text-amber-500">10 giây</span>.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-500">▶</span>
            <p>Vượt qua Boss thành công sẽ giúp dũng sĩ phục hồi lại <span className="text-emerald-500">+2 HP</span> (tối đa 5 HP).</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-500">▶</span>
            <p>Sử dụng Vàng tích lũy khi trả lời đúng để mua các vật phẩm phép thuật hỗ trợ.</p>
          </div>
        </div>

        {/* Start button */}
        <div className="flex justify-center mt-2">
          <Button
            onClick={onStart}
            disabled={isStarting}
            className="py-6 px-10 rounded-none bg-indigo-500 text-white font-black uppercase tracking-widest hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 shadow-md border-2 border-zinc-900 dark:border-slate-700 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-sm flex items-center gap-3 w-full sm:w-auto"
          >
            {isStarting ? (
              <div className="size-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
            ) : hasActiveSession ? (
              <RotateCcw className="size-4 animate-pulse" />
            ) : (
              <Play className="size-4 fill-current animate-pulse" />
            )}
            <span>{hasActiveSession ? "Tiếp tục thi đấu" : "Bắt đầu thi đấu"}</span>
          </Button>
        </div>
      </div>

      {/* Leaderboard Column (5 columns) */}
      <div className="lg:col-span-5 w-full">
        <PracticePersonalBest lessonSlug={lessonSlug} />
      </div>
    </div>
  );
}
