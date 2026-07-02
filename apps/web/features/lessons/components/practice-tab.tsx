"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Swords, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PracticeTabProps {
  lessonId: string;
  slug: string;
}

export function PracticeTab({ lessonId, slug }: PracticeTabProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 rounded-[2.5rem] shadow-xl p-8 max-w-2xl mx-auto">
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
        onClick={() => router.push(`/lessons/${slug}/practice`)}
        className="py-6 px-10 rounded-[1.8rem] bg-indigo-500 text-white font-black uppercase tracking-widest hover:bg-indigo-600 shadow-xl shadow-indigo-500/25 active:scale-95 transition-all text-xs flex items-center gap-3"
      >
        <Play className="size-4 fill-current animate-pulse" />
        Bắt đầu thi đấu
      </Button>
    </div>
  );
}

