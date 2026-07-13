import React from "react";
import { Difficulty } from "../types";

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (value: Difficulty) => void;
}

export function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
  const options = [
    { id: "EASY", label: "Dễ", icon: "🌱", activeClass: "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400 dark:bg-green-500/20" },
    { id: "MEDIUM", label: "Trung bình", icon: "⚡", activeClass: "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:bg-amber-500/20" },
    { id: "HARD", label: "Khó", icon: "🔥", activeClass: "border-red bg-red/10 text-red dark:bg-red/20" },
  ] as const;

  return (
    <div className="space-y-3">
      <label className="text-xs font-black text-gray-navy opacity-40 uppercase tracking-[0.2em] px-1 italic block">
        Độ khó câu hỏi
      </label>
      <div className="flex flex-wrap gap-3">
        {options.map((opt) => {
          const isActive = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`px-6 py-3 rounded-2xl text-sm font-bold border-2 transition-all duration-200 flex items-center gap-2 ${
                isActive
                  ? opt.activeClass
                  : "border-gray-100 dark:border-white/10 bg-transparent text-gray-navy dark:text-light-blue opacity-55 hover:opacity-100"
              }`}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
