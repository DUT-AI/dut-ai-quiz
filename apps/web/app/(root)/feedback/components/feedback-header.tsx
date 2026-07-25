"use client";

import React from "react";

export function FeedbackHeader() {
  return (
    <div className="flex flex-col gap-3 border-b border-gray-150 dark:border-white/10 pb-6">
      {/* Mini Badge Tag */}
      <div>
        <span className="text-[10px] sm:text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 dark:bg-primary/20 px-3 py-1 rounded-full">
          Cộng đồng đóng góp
        </span>
      </div>

      {/* Main Title and Subtitle */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
          Đóng góp ý kiến &amp; Phản hồi
        </h1>
        <p className="text-sm sm:text-base text-gray-navy/70 dark:text-light-blue/60 max-w-3xl leading-relaxed">
          Ý kiến đóng góp của bạn rất quan trọng để giúp đội ngũ phát triển cải tiến và hoàn thiện hệ thống{" "}
          <span className="font-extrabold text-primary dark:text-emerald-400">
            DUT AI Quiz
          </span>{" "}
          mỗi ngày.
        </p>
      </div>
    </div>
  );
}
