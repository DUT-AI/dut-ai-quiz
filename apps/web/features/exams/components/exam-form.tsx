"use client";
import { useState } from "react";
import type { ExamCreate, ExamOut } from "@/lib/types";
import { formatToLocalDatetime } from "@/lib/utils";

interface Props {
  initial?: ExamOut;
  onSave: (data: ExamCreate) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export default function ExamForm({ initial, onSave, onCancel, saving }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [startTime, setStartTime] = useState(
    formatToLocalDatetime(initial?.start_time)
  );
  const [endTime, setEndTime] = useState(formatToLocalDatetime(initial?.end_time));
  const [duration, setDuration] = useState(
    initial?.duration_minutes ?? 60
  );
  const [maxAttempts, setMaxAttempts] = useState(initial?.max_attempts ?? 1);
  const [isPublished, setIsPublished] = useState(
    initial?.is_published ?? false
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Tiêu đề không được trống");
    try {
      await onSave({
        title,
        description,
        start_time: startTime || null,
        end_time: endTime || null,
        duration_minutes: duration,
        max_attempts: maxAttempts,
        is_published: isPublished,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lỗi lưu kỳ thi");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold mb-1 text-gray-navy dark:text-light-blue">
          Tiêu đề kỳ thi
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-2 py-1.5 text-sm"
          placeholder="VD: Kiểm tra giữa kỳ HK1 2024"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1 text-gray-navy dark:text-light-blue">
          Mô tả
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold mb-1 text-gray-navy dark:text-light-blue">
            Bắt đầu (tuỳ chọn)
          </label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold mb-1 text-gray-navy dark:text-light-blue">
            Kết thúc (tuỳ chọn)
          </label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-semibold mb-1 text-gray-navy dark:text-light-blue">
            Thời gian (phút)
          </label>
          <input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full rounded border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-semibold mb-1 text-gray-navy dark:text-light-blue">
            Số lần thi tối đa
          </label>
          <input
            type="number"
            min={1}
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(Number(e.target.value))}
            className="w-full rounded border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="accent-primary"
        />
        <span className="text-sm">Công khai (học sinh có thể thấy)</span>
      </label>

      {error && <p className="text-red text-sm font-medium">{error}</p>}

      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded text-sm bg-slate/10 hover:bg-slate/20 dark:bg-white/10 dark:hover:bg-white/20 transition"
        >
          Huỷ
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded text-sm font-medium bg-primary text-white hover:bg-primary/80 disabled:opacity-50 transition"
        >
          {saving ? "Đang lưu…" : initial ? "Cập nhật" : "Tạo mới"}
        </button>
      </div>
    </form>
  );
}
