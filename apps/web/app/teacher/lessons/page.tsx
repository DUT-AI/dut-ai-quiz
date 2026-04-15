"use client";
import { useState } from "react";
import Link from "next/link";
import {
  useLessons,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
} from "@/lib/queries";
import type { Lesson } from "@/lib/types";

/* ─── Form tạo/sửa bài học ──────────────────────────────── */
function LessonFormInline({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Lesson;
  onSave: (data: { name: string; description: string; order: number }) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [order, setOrder] = useState(initial?.order ?? 0);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setErr("Tên bài học không được trống");
    setErr(null);
    try {
      await onSave({ name, description, order });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Lỗi lưu");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold mb-1 text-gray-navy dark:text-light-blue">
            Tên bài học
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Bài 1 – Mô hình OSI"
            className="w-full rounded-lg border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-3 py-1.5 text-sm"
          />
        </div>
        <div className="w-24">
          <label className="block text-xs font-semibold mb-1 text-gray-navy dark:text-light-blue">
            Thứ tự
          </label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="w-full rounded-lg border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-3 py-1.5 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1 text-gray-navy dark:text-light-blue">
          Mô tả (tuỳ chọn)
        </label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tóm tắt nội dung bài học…"
          className="w-full rounded-lg border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-3 py-1.5 text-sm"
        />
      </div>
      {err && <p className="text-red text-xs">{err}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-1.5 rounded-lg bg-purple text-white text-sm font-medium hover:bg-purple/80 disabled:opacity-50 transition"
        >
          {saving ? "Đang lưu…" : initial ? "Cập nhật" : "Tạo bài học"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 rounded-lg text-sm bg-slate/10 hover:bg-slate/20 dark:bg-white/10 dark:hover:bg-white/20 transition"
        >
          Huỷ
        </button>
      </div>
    </form>
  );
}

/* ─── Row bài học ──────────────────────────────────────── */
function LessonRow({ lesson }: { lesson: Lesson }) {
  const [editing, setEditing] = useState(false);
  const updateMut = useUpdateLesson(lesson.id);
  const deleteMut = useDeleteLesson();

  async function handleUpdate(data: { name: string; description: string; order: number }) {
    await updateMut.mutateAsync(data);
    setEditing(false);
  }

  return (
    <div className="rounded-xl bg-white dark:bg-slate/20 border border-slate/10 dark:border-white/10 overflow-hidden">
      {!editing ? (
        <div className="flex items-center gap-4 p-4">
          <div className="w-8 h-8 rounded-lg bg-purple/10 flex items-center justify-center text-purple font-bold text-sm shrink-0">
            {lesson.order}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-dark-blue dark:text-white text-sm">
              {lesson.name}
            </p>
            {lesson.description && (
              <p className="text-xs text-gray-navy dark:text-light-blue mt-0.5 truncate">
                {lesson.description}
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/teacher/lessons/${lesson.id}/questions`}
              className="text-xs px-2 py-1 rounded bg-purple/10 text-purple hover:bg-purple/20 transition font-medium"
            >
              Câu hỏi
            </Link>
            <button
              onClick={() => setEditing(true)}
              className="text-xs px-2 py-1 rounded bg-slate/10 hover:bg-slate/20 dark:bg-white/10 dark:hover:bg-white/20 transition"
            >
              Sửa
            </button>
            <button
              onClick={() => {
                if (confirm(`Xoá bài học "${lesson.name}"?\nCác câu hỏi trong bài sẽ bị bỏ liên kết.`)) {
                  deleteMut.mutate(lesson.id);
                }
              }}
              className="text-xs px-2 py-1 rounded bg-red/10 text-red hover:bg-red/20 transition"
            >
              Xoá
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate/5 dark:bg-white/5">
          <LessonFormInline
            initial={lesson}
            onSave={handleUpdate}
            onCancel={() => setEditing(false)}
            saving={updateMut.isPending}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────── */
export default function LessonsPage() {
  const { data: lessons, isLoading, error } = useLessons();
  const createMut = useCreateLesson();
  const [showCreate, setShowCreate] = useState(false);

  async function handleCreate(data: { name: string; description: string; order: number }) {
    await createMut.mutateAsync(data);
    setShowCreate(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-dark-blue dark:text-white">
          Bài học
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-purple text-white rounded-lg text-sm font-medium hover:bg-purple/80 transition"
        >
          + Thêm bài học
        </button>
      </div>

      {showCreate && (
        <div className="mb-4 p-4 rounded-xl bg-white dark:bg-slate/20 border border-purple/30 shadow-sm">
          <p className="text-sm font-semibold mb-3 text-dark-blue dark:text-white">
            Bài học mới
          </p>
          <LessonFormInline
            onSave={handleCreate}
            onCancel={() => setShowCreate(false)}
            saving={createMut.isPending}
          />
        </div>
      )}

      {isLoading && (
        <p className="text-sm text-gray-navy dark:text-light-blue">Đang tải…</p>
      )}
      {error && (
        <p className="text-red text-sm">
          {error instanceof Error ? error.message : "Lỗi"}
        </p>
      )}

      <div className="space-y-2">
        {lessons?.length === 0 && !showCreate && (
          <p className="text-center text-gray-navy dark:text-light-blue text-sm py-10">
            Chưa có bài học nào. Hãy tạo bài học đầu tiên!
          </p>
        )}
        {lessons?.map((l) => (
          <LessonRow key={l.id} lesson={l} />
        ))}
      </div>
    </div>
  );
}
