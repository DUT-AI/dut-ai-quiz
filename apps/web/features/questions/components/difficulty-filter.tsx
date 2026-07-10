"use client";

import React from "react";

interface DifficultyFilterProps {
  value: "ALL" | "EASY" | "MEDIUM" | "HARD";
  onChange: (val: "ALL" | "EASY" | "MEDIUM" | "HARD") => void;
  counts: { ALL: number; EASY: number; MEDIUM: number; HARD: number };
}

export function DifficultyFilter({ value, onChange, counts }: DifficultyFilterProps) {
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as any)}
        className="w-full pl-4 pr-10 py-2.5 rounded-2xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 cursor-pointer appearance-none shadow-sm"
      >
        <option value="ALL">💎 Tất cả ({counts.ALL})</option>
        <option value="EASY">🌱 Dễ ({counts.EASY})</option>
        <option value="MEDIUM">⚡ Trung bình ({counts.MEDIUM})</option>
        <option value="HARD">🔥 Khó ({counts.HARD})</option>
      </select>
      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
        <svg
          className="size-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}
