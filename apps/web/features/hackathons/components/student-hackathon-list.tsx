"use client";

import React, { useState } from "react";
import { useHackathons } from "@/lib/queries";
import { HackathonCard } from "./hackathon-card";
import { Award, Sparkles, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export function StudentHackathonList() {
  const { data: hackathons = [], isLoading, error } = useHackathons();
  const [filter, setFilter] = useState<"all" | "ongoing" | "upcoming" | "expired">("all");

  const filteredHackathons = hackathons.filter((h) => {
    const now = new Date();
    const start = h.start_time ? new Date(h.start_time) : null;
    const end = h.end_time ? new Date(h.end_time) : null;

    const isExpired = end ? end < now : false;
    const isStarted = start ? start <= now : false;
    const isOngoing = isStarted && !isExpired;
    const isUpcoming = start ? start > now : false;

    if (filter === "ongoing") return isOngoing;
    if (filter === "upcoming") return isUpcoming;
    if (filter === "expired") return isExpired;
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
        <div>
          <span className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-2 block">
            THI ĐẤU CÔNG NGHỆ
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-dark-blue dark:text-white mb-3">
            Hackathons
          </h1>
          <p className="text-lg text-gray-navy dark:text-light-blue max-w-2xl opacity-75 leading-relaxed font-medium">
            Tham gia tranh tài ở các cuộc thi lập trình và giải đấu trí tuệ để thử thách bản thân và nhận quà hấp dẫn.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-gray-150 dark:border-white/10 gap-4 overflow-x-auto no-scrollbar pb-1">
        <div className="flex gap-2 md:gap-4 overflow-x-auto no-scrollbar">
          {(
            [
              { id: "all", label: "Tất cả giải đấu" },
              { id: "ongoing", label: "Đang diễn ra" },
              { id: "upcoming", label: "Sắp bắt đầu" },
              { id: "expired", label: "Đã kết thúc" },
            ] as const
          ).map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "relative px-4 py-3 text-sm font-black transition-all duration-200 text-nowrap pb-4 border-b-2 cursor-pointer",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-navy dark:text-light-blue hover:text-primary opacity-70 hover:opacity-100"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-navy dark:text-light-blue opacity-50 px-2 select-none">
          <Filter className="size-3.5" />
          <span>Lọc sự kiện</span>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="h-40 flex flex-col items-center justify-center py-20 opacity-50">
          <div className="size-10 border-4 border-primary border-t-transparent animate-spin rounded-full mb-4" />
          <p className="font-bold text-sm">Đang tải danh sách giải đấu...</p>
        </div>
      )}
      {error && (
        <div className="p-5 rounded-2xl bg-red/10 text-red border border-red/10 text-sm font-bold text-left max-w-xl">
          {error instanceof Error ? error.message : "Không thể kết nối tới máy chủ. Vui lòng tải lại trang."}
        </div>
      )}

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {!isLoading && filteredHackathons.length === 0 && (
          <div className="col-span-full rounded-[2.5rem] border border-dashed border-gray-200 dark:border-white/10 p-16 text-center bg-white/20 dark:bg-white/[0.01]">
            <Award className="size-16 text-gray-navy opacity-30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-dark-blue dark:text-white mb-2">
              Không tìm thấy giải đấu
            </h3>
            <p className="text-sm text-gray-navy dark:text-light-blue opacity-60 max-w-sm mx-auto">
              Hiện tại không có sự kiện hackathon nào phù hợp với bộ lọc bạn chọn.
            </p>
          </div>
        )}

        {filteredHackathons.map((h) => (
          <HackathonCard key={h.id} hackathon={h} />
        ))}
      </div>
    </div>
  );
}
