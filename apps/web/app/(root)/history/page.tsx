"use client";

import React, { useState } from "react";
import { 
  History, 
  Search, 
  ChevronRight, 
  Trophy, 
  Clock, 
  CheckCircle2, 
  Timer,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { useMyAttempts } from "@/lib/queries";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { motion } from "framer-motion";

export default function HistoryPage() {
  const { data: attempts, isLoading } = useMyAttempts();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "COMPLETED" | "IN_PROGRESS">("ALL");

  const filteredAttempts = attempts?.filter(item => {
    const matchesSearch = item.exam_title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "ALL" || item.attempt.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: attempts?.length || 0,
    completed: attempts?.filter(a => a.attempt.status === "COMPLETED").length || 0,
    avgScore: attempts?.length 
      ? (attempts.reduce((acc, curr) => acc + (curr.attempt.score || 0), 0) / attempts.length).toFixed(1)
      : 0,
    totalViolations: attempts?.reduce((acc, curr) => acc + curr.attempt.tab_out_count, 0) || 0,
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="size-12 animate-spin text-primary" />
        <p className="text-gray-navy animate-pulse font-medium">Đang tải lịch sử của bạn...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12 pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-dark-blue to-navy-blue p-12 text-white shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <History className="size-64" />
        </div>
        
        <div className="relative z-10 space-y-8">
            <div className="space-y-2">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 text-primary font-black tracking-widest uppercase text-sm"
                >
                    <div className="w-8 h-1 bg-primary rounded-full" />
                    LỊCH SỬ HỌC TẬP
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl font-black tracking-tighter"
                >
                    Hành trình Chinh phục Tri thức
                </motion.h1>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatCard icon={History} label="Tổng số bài" value={stats.total} color="bg-blue-500" delay={0.1} />
                <StatCard icon={CheckCircle2} label="Đã hoàn thành" value={stats.completed} color="bg-green-500" delay={0.2} />
                <StatCard icon={Trophy} label="Điểm trung bình" value={stats.avgScore} color="bg-yellow-500" delay={0.3} />
                <StatCard icon={AlertTriangle} label="Tổng số vi phạm" value={stats.totalViolations} color="bg-red-500" delay={0.4} />
            </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-navy transition-colors group-focus-within:text-primary" />
          <input 
            type="text"
            placeholder="Tìm kiếm bài thi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-navy-blue rounded-2xl border border-gray-navy/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
          />
        </div>

        <div className="flex bg-gray-navy/5 p-1.5 rounded-2xl border border-gray-navy/10 w-full md:w-auto overflow-hidden">
            {["ALL", "COMPLETED", "IN_PROGRESS"].map((f) => (
                <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        filter === f 
                            ? "bg-white dark:bg-dark-blue text-primary shadow-lg" 
                            : "text-gray-navy hover:text-dark-blue"
                    }`}
                >
                    {f === "ALL" ? "Tất cả" : f === "COMPLETED" ? "Đã xong" : "Đang làm"}
                </button>
            ))}
        </div>
      </div>

      {/* Efforts List */}
      <div className="space-y-4">
        {filteredAttempts?.length === 0 ? (
          <div className="text-center py-24 bg-gray-navy/5 rounded-[3rem] border-2 border-dashed border-gray-navy/10">
            <div className="size-20 bg-gray-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="size-10 text-gray-navy/40" />
            </div>
            <h3 className="text-xl font-black text-dark-blue">Không tìm thấy kết quả nào</h3>
            <p className="text-gray-navy">Hãy thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
          </div>
        ) : (
          filteredAttempts?.map((item, idx) => (
            <motion.div 
              key={item.attempt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group relative bg-white dark:bg-navy-blue overflow-hidden rounded-[2.5rem] border border-gray-navy/10 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all"
            >
                {/* Visual Accent */}
                <div className={`absolute top-0 left-0 w-2 h-full ${
                  item.attempt.status === "COMPLETED" ? "bg-green-500" : "bg-primary"
                }`} />

                <div className="p-8 flex flex-col md:flex-row items-center gap-8">
                    {/* Icon/Date */}
                    <div className="flex items-center gap-6 min-w-0 flex-1">
                        <div className={`shrink-0 size-14 rounded-2xl flex items-center justify-center ${
                          item.attempt.status === "COMPLETED" ? "bg-green-50 text-green-600" : "bg-primary text-primary"
                        }`}>
                            <History className="size-6" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-xl font-black tracking-tight text-dark-blue truncate group-hover:text-primary transition-colors">
                                {item.exam_title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 mt-1">
                                <span className="flex items-center gap-1.5 text-xs text-gray-navy font-bold">
                                    <Clock className="size-3.5" />
                                    {format(new Date(item.attempt.started_at), "HH:mm, dd/MM/yyyy", { locale: vi })}
                                </span>
                                <div className="size-1 bg-gray-navy/30 rounded-full" />
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                  item.attempt.status === "COMPLETED" 
                                    ? "bg-green-100 text-green-700" 
                                    : "bg-primary text-primary"
                                }`}>
                                    {item.attempt.status === "COMPLETED" ? "Hoàn thành" : "Đang làm"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-8 px-8 border-x border-gray-navy/5">
                        <div className="text-center">
                            <p className="text-[10px] text-gray-navy font-black uppercase tracking-tighter mb-1">Điểm số</p>
                            <p className="text-2xl font-black text-dark-blue">
                                {item.attempt.score !== null ? item.attempt.score : "—"}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-gray-navy font-black uppercase tracking-tighter mb-1">Cảnh báo</p>
                            <p className={`text-2xl font-black ${item.attempt.tab_out_count > 0 ? "text-red" : "text-green-500"}`}>
                                {item.attempt.tab_out_count}
                            </p>
                        </div>
                    </div>

                    {/* Action */}
                    <div className="shrink-0 flex gap-3">
                        {item.attempt.status === "COMPLETED" ? (
                          <Link 
                            href={`/history/${item.attempt.id}/review`}
                            className="flex items-center gap-2 px-6 py-3.5 bg-dark-blue text-white rounded-2xl font-black text-sm hover:bg-primary hover:scale-105 active:scale-95 transition-all shadow-lg shadow-dark-blue/10"
                          >
                            XEM CHI TIẾT
                            <ChevronRight className="size-4" />
                          </Link>
                        ) : (
                          <Link 
                            href={`/exams/${item.attempt.exam_id}/attempt/${item.attempt.id}`}
                            className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white rounded-2xl font-black text-sm hover:bg-dark-blue hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/10"
                          >
                            TIẾP TỤC
                            <Timer className="size-4" />
                          </Link>
                        )}
                    </div>
                </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, delay }: any) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10"
        >
            <div className={`shrink-0 size-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="size-5 text-white" />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">{label}</p>
                <p className="text-xl font-black">{value}</p>
            </div>
        </motion.div>
    );
}
