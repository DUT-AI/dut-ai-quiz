import React from "react";

interface PoolTypeSelectorProps {
  value: "PRACTICE" | "EXAM" | "MOCK";
  onChange: (value: "PRACTICE" | "EXAM" | "MOCK") => void;
}

export function PoolTypeSelector({ value, onChange }: PoolTypeSelectorProps) {
  const options = [
    { id: "PRACTICE", label: "Luyện tập", icon: "🏋️" },
    { id: "EXAM", label: "Kiểm tra", icon: "📝" },
    { id: "MOCK", label: "Thi thử", icon: "🏆" },
  ] as const;

  return (
    <div className="space-y-3">
      <label className="text-xs font-black text-gray-navy opacity-40 uppercase tracking-[0.2em] px-1 italic block">
        Phân loại câu hỏi
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
                  ? "border-primary bg-primary/10 text-primary dark:bg-primary/20"
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
