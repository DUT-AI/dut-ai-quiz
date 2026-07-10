"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Swords, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import GameLeaderboard from "@/features/game/components/game-leaderboard";

interface GameTabProps {
  lessonId: string;
  slug: string;
}

export function GameTab({ lessonId, slug }: GameTabProps) {
  const router = useRouter();

  return (
    <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch px-4 md:px-0 py-4">
      {/* Left Column: Old clean card style */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center text-center py-12 md:py-16 bg-white dark:bg-navy-blue/40 border border-gray-150 dark:border-white/10 rounded-[2.5rem] shadow-xl p-8 md:p-12">
        <div className="size-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-8 animate-bounce">
          <Swords className="size-10" />
        </div>
        <h3 className="text-3xl font-black text-dark-blue dark:text-white mb-4">
          Đấu Trường Luyện Tập
        </h3>
        <p className="text-gray-navy dark:text-light-blue opacity-75 max-w-md text-base leading-relaxed mb-8 font-medium">
          Sử dụng các vật phẩm như Khiên bảo vệ, Nhân đôi điểm và cạnh tranh bảng xếp hạng với các học viên khác bằng cách trả lời nhanh các câu hỏi!
        </p>
        <Button
          onClick={() => router.push(`/lessons/${slug}/game`)}
          className="py-6 px-10 rounded-[1.8rem] bg-indigo-500 text-white font-black uppercase tracking-widest hover:bg-indigo-600 shadow-xl shadow-indigo-500/25 active:scale-95 transition-all text-xs flex items-center gap-3"
        >
          <Play className="size-4 fill-current animate-pulse" />
          Bắt đầu thi đấu
        </Button>
      </div>

      {/* Right Column: Modern Leaderboard */}
      <div className="lg:col-span-5 w-full flex">
        <GameLeaderboard lessonSlug={slug} variant="modern" />
      </div>
    </div>
  );
}
