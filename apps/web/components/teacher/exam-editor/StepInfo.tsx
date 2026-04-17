"use client";
import React from "react";
import { Input } from "@/components/ui/button"; // Not really input, I'll use standard inputs

export interface ExamInfoData {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  max_attempts: number;
  is_published: boolean;
}

interface Props {
  data: ExamInfoData;
  onChange: (data: Partial<ExamInfoData>) => void;
}

export default function StepInfo({ data, onChange }: Props) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <label className="text-xs font-black text-gray-navy opacity-40 uppercase tracking-[0.2em] px-1 italic">
          Thông tin cơ bản
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Tên kỳ thi (VD: Kiểm tra cuối kỳ)"
          className="w-full px-6 py-5 rounded-[2rem] bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-lg"
        />
        <textarea
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Mô tả về kỳ thi này..."
          rows={3}
          className="w-full px-6 py-5 rounded-[2rem] bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary/50 transition-all text-sm resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-navy opacity-40 uppercase tracking-[0.2em] px-1 italic">
            Thời điểm bắt đầu
          </label>
          <input
            type="datetime-local"
            value={data.start_time}
            onChange={(e) => onChange({ start_time: e.target.value })}
            className="w-full px-6 py-4 rounded-3xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-navy opacity-40 uppercase tracking-[0.2em] px-1 italic">
            Thời điểm kết thúc
          </label>
          <input
            type="datetime-local"
            value={data.end_time}
            onChange={(e) => onChange({ end_time: e.target.value })}
            className="w-full px-6 py-4 rounded-3xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-navy opacity-40 uppercase tracking-[0.2em] px-1 italic">
            Thời gian làm bài (Phút)
          </label>
          <input
            type="number"
            min={1}
            value={data.duration_minutes}
            onChange={(e) => onChange({ duration_minutes: parseInt(e.target.value) || 0 })}
            className="w-full px-6 py-4 rounded-3xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary/50 transition-all font-bold text-primary"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-navy opacity-40 uppercase tracking-[0.2em] px-1 italic">
            Số lần thi tối đa
          </label>
          <input
            type="number"
            min={1}
            value={data.max_attempts}
            onChange={(e) => onChange({ max_attempts: parseInt(e.target.value) || 0 })}
            className="w-full px-6 py-4 rounded-3xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary/50 transition-all font-bold"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-3xl bg-primary/5 border border-primary/10">
        <input
          type="checkbox"
          id="is_published"
          checked={data.is_published}
          onChange={(e) => onChange({ is_published: e.target.checked })}
          className="size-5 rounded-lg accent-primary"
        />
        <label htmlFor="is_published" className="text-sm font-bold text-primary cursor-pointer select-none">
          Công khai kỳ thi cho học sinh tham gia ngay
        </label>
      </div>
    </div>
  );
}
