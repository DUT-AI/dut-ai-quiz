"use client";
import { useState } from "react";
import Link from "next/link";
import {
  useQuestions,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useLessons,
} from "@/lib/queries";
import QuestionForm from "@/components/teacher/question-form";
import type { PoolType, QuestionCreate, QuestionOut } from "@/lib/types";

type FilterPoolType = PoolType | "";

const POOL_BADGE: Record<PoolType, { label: string; cls: string }> = {
  PRACTICE: { label: "Luyện tập", cls: "bg-green/20 text-green" },
  EXAM: {
    label: "Kiểm tra",
    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
};

export default function QuestionsPage() {
  const [poolType, setPoolType] = useState<FilterPoolType>("");
  const [lessonFilter, setLessonFilter] = useState("");
  const [editing, setEditing] = useState<QuestionOut | null | "new">(null);

  const { data: lessons = [] } = useLessons();
  const { data: questions, isLoading, error } = useQuestions({
    pool_type: poolType || undefined,
    lesson_id: lessonFilter || undefined,
    limit: 200,
  });

  const deleteMut = useDeleteQuestion();
  const lessonMap = new Map(lessons.map((l) => [l.id, l.name]));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-dark-blue dark:text-white">
          Tất cả câu hỏi
        </h1>
        <div className="flex gap-2">
          <Link
            href="/teacher/lessons"
            className="px-3 py-2 text-sm rounded-lg bg-slate/10 hover:bg-slate/20 dark:bg-white/10 dark:hover:bg-white/20 transition"
          >
            Quản lý bài học
          </Link>
          <button
            onClick={() => setEditing("new")}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/80 transition"
          >
            + Thêm câu hỏi
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-4">
        <select
          value={lessonFilter}
          onChange={(e) => setLessonFilter(e.target.value)}
          className="rounded border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-2 py-1.5 text-sm max-w-[200px]"
        >
          <option value="">Tất cả bài học</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.order > 0 ? `${l.order}. ` : ""}{l.name}
            </option>
          ))}
        </select>
        <select
          value={poolType}
          onChange={(e) => setPoolType(e.target.value as FilterPoolType)}
          className="rounded border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-2 py-1.5 text-sm"
        >
          <option value="">Tất cả loại</option>
          <option value="PRACTICE">Luyện tập</option>
          <option value="EXAM">Kiểm tra</option>
        </select>
      </div>

      {/* Modal */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-blue rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold mb-4 text-dark-blue dark:text-white">
              {editing === "new" ? "Thêm câu hỏi mới" : "Chỉnh sửa câu hỏi"}
            </h2>
            <QuestionFormWrapper
              editing={editing}
              onDone={() => setEditing(null)}
            />
          </div>
        </div>
      )}

      {isLoading && (
        <p className="text-gray-navy dark:text-light-blue text-sm">Đang tải…</p>
      )}
      {error && (
        <p className="text-red text-sm">
          {error instanceof Error ? error.message : "Lỗi tải dữ liệu"}
        </p>
      )}
      {questions && (
        <div className="space-y-2">
          {questions.length === 0 && (
            <p className="text-gray-navy dark:text-light-blue text-sm text-center py-8">
              Không có câu hỏi nào.
            </p>
          )}
          {questions.map((q) => {
            const badge = POOL_BADGE[q.pool_type];
            const lessonName = q.lesson_id ? lessonMap.get(q.lesson_id) : null;
            return (
              <div
                key={q.id}
                className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate/20 shadow-sm border border-slate/10 dark:border-white/10"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-blue dark:text-white line-clamp-2">
                    {q.content}
                  </p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                      {badge.label}
                    </span>
                    {lessonName && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {lessonName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setEditing(q)}
                    className="text-xs px-2 py-1 rounded bg-slate/10 hover:bg-slate/20 dark:bg-white/10 dark:hover:bg-white/20 transition"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Xoá câu hỏi này?")) deleteMut.mutate(q.id);
                    }}
                    className="text-xs px-2 py-1 rounded bg-red/10 text-red hover:bg-red/20 transition"
                  >
                    Xoá
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuestionFormWrapper({
  editing,
  onDone,
}: {
  editing: QuestionOut | "new";
  onDone: () => void;
}) {
  const createMut = useCreateQuestion();
  const updateMut = useUpdateQuestion();

  async function handleSave(data: QuestionCreate) {
    if (editing === "new") {
      await createMut.mutateAsync(data);
    } else {
      await updateMut.mutateAsync({ id: editing.id, payload: data });
    }
    onDone();
  }

  return (
    <QuestionForm
      initial={editing !== "new" ? editing : undefined}
      onSave={handleSave}
      onCancel={onDone}
      saving={createMut.isPending || updateMut.isPending}
    />
  );
}
