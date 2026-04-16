"use client";
import { useState } from "react";
import ImageUpload from "./image-upload";
import { useLessons } from "@/lib/queries";
import type { PoolType, QuestionCreate, QuestionOut } from "@/lib/types";

interface Props {
  initial?: QuestionOut;
  onSave: (data: QuestionCreate) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
  /** Khi đã biết lesson_id từ context, ẩn dropdown bài học */
  hideLessonSelect?: boolean;
}

const EMPTY_OPTION = () => ({
  id: crypto.randomUUID().split("-")[0],
  text: "",
  is_correct: false,
});

export default function QuestionForm({
  initial,
  onSave,
  onCancel,
  saving,
  hideLessonSelect = false,
}: Props) {
  const { data: lessons = [] } = useLessons();

  const [poolType, setPoolType] = useState<PoolType>(initial?.pool_type ?? "PRACTICE");
  const [content, setContent] = useState(initial?.content ?? "");
  const [options, setOptions] = useState(
    initial?.options?.length
      ? initial.options.map((o) => ({ ...o }))
      : [EMPTY_OPTION(), EMPTY_OPTION(), EMPTY_OPTION(), EMPTY_OPTION()]
  );
  const [solution, setSolution] = useState(initial?.solution ?? "");
  const [lessonId, setLessonId] = useState<string>(initial?.lesson_id ?? "");
  const [error, setError] = useState<string | null>(null);

  function insertImageUrl(url: string) {
    setContent((c) => c + `\n![ảnh](${url})`);
  }

  function setCorrect(idx: number) {
    setOptions(options.map((o, i) => ({ ...o, is_correct: i === idx })));
  }

  function setOptionText(idx: number, text: string) {
    setOptions(options.map((o, i) => (i === idx ? { ...o, text } : o)));
  }

  function addOption() {
    if (options.length >= 6) return;
    setOptions([...options, EMPTY_OPTION()]);
  }

  function removeOption(idx: number) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!content.trim()) return setError("Nội dung không được trống");
    if (!options.some((o) => o.is_correct))
      return setError("Phải chọn ít nhất 1 đáp án đúng");
    if (options.some((o) => !o.text.trim()))
      return setError("Các đáp án không được để trống");

    try {
      await onSave({
        pool_type: poolType,
        content,
        options,
        solution: solution || undefined,
        tags: [],
        lesson_id: lessonId || null,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lỗi lưu câu hỏi");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[280px]">
          <label className="block text-xs font-semibold mb-1 text-gray-navy dark:text-light-blue">
            Loại câu hỏi
          </label>
          <select
            value={poolType}
            onChange={(e) => setPoolType(e.target.value as PoolType)}
            className="w-full rounded border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-2 py-1.5 text-sm"
          >
            <option value="PRACTICE">Luyện tập</option>
            <option value="EXAM">Kiểm tra</option>
          </select>
        </div>
      </div>

      {/* Lesson select (ẩn khi đã biết lesson từ context) */}
      {!hideLessonSelect && (
        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-navy dark:text-light-blue">
            Bài học
          </label>
          <select
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
            className="w-full rounded border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-2 py-1.5 text-sm"
          >
            <option value="">— Chưa phân bài học —</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.order > 0 ? `${l.order}. ` : ""}{l.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Content */}
      <div>
        <label className="block text-xs font-semibold mb-1 text-gray-navy dark:text-light-blue">
          Nội dung câu hỏi (hỗ trợ Markdown + LaTeX $…$)
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full rounded border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-3 py-2 text-sm font-mono resize-y"
          placeholder="Nhập nội dung câu hỏi…"
        />
        <ImageUpload onUploaded={insertImageUrl} />
      </div>

      {/* Options */}
      <div>
        <label className="block text-xs font-semibold mb-2 text-gray-navy dark:text-light-blue">
          Đáp án (chọn radio = đáp án đúng)
        </label>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                checked={opt.is_correct}
                onChange={() => setCorrect(i)}
                className="accent-purple"
              />
              <input
                type="text"
                value={opt.text}
                onChange={(e) => setOptionText(i, e.target.value)}
                placeholder={`Đáp án ${String.fromCharCode(65 + i)}`}
                className="flex-1 rounded border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={() => removeOption(i)}
                className="text-red text-xs hover:underline"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {options.length < 6 && (
          <button
            type="button"
            onClick={addOption}
            className="mt-2 text-xs text-purple hover:underline"
          >
            + Thêm đáp án
          </button>
        )}
      </div>

      {/* Solution */}
      <div>
        <label className="block text-xs font-semibold mb-1 text-gray-navy dark:text-light-blue">
          Giải thích (tuỳ chọn)
        </label>
        <textarea
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          rows={2}
          className="w-full rounded border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-3 py-2 text-sm"
        />
      </div>

      {error && (
        <p className="text-red text-sm font-medium">{error}</p>
      )}

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
          className="px-4 py-2 rounded text-sm font-medium bg-purple text-white hover:bg-purple/80 disabled:opacity-50 transition"
        >
          {saving ? "Đang lưu…" : initial ? "Cập nhật" : "Tạo mới"}
        </button>
      </div>
    </form>
  );
}
