"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  useLessons,
  useQuestions,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
} from "@/lib/queries";
import QuestionForm from "@/components/teacher/question-form";
import type { PoolType, QuestionCreate, QuestionOut } from "@/lib/types";

type FilterPoolType = PoolType | "";

const POOL_BADGE: Record<PoolType, { label: string; cls: string }> = {
  PRACTICE: { label: "Luyện tập", cls: "bg-green/20 text-green" },
  EXAM: { label: "Kiểm tra", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
};

export default function LessonQuestionsPage() {
  const { id: lessonId } = useParams<{ id: string }>();
  const { data: lessons } = useLessons();
  const lesson = lessons?.find((l) => l.id === lessonId);

  const [poolType, setPoolType] = useState<FilterPoolType>("");
  const [editing, setEditing] = useState<QuestionOut | "new" | null>(null);

  const { data: questions, isLoading, error } = useQuestions({
    lesson_id: lessonId,
    pool_type: poolType || undefined,
    limit: 200,
  });

  const deleteMut = useDeleteQuestion();

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/teacher/lessons" className="text-gray-navy dark:text-light-blue hover:underline">
          Bài học
        </Link>
        <span className="text-gray-navy dark:text-light-blue">/</span>
        <span className="font-semibold text-dark-blue dark:text-white">
          {lesson?.name ?? "…"}
        </span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-dark-blue dark:text-white">
          Câu hỏi trong bài học
        </h1>
        <button
          onClick={() => setEditing("new")}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/80 transition"
        >
          + Thêm câu hỏi
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-4">
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
              lessonId={lessonId}
              onDone={() => setEditing(null)}
            />
          </div>
        </div>
      )}

      {/* List */}
      {isLoading && <p className="text-sm text-gray-navy dark:text-light-blue">Đang tải…</p>}
      {error && <p className="text-red text-sm">{error instanceof Error ? error.message : "Lỗi"}</p>}
      <div className="space-y-2">
        {questions?.length === 0 && (
          <p className="text-center text-gray-navy dark:text-light-blue text-sm py-10">
            Chưa có câu hỏi nào. Hãy thêm câu hỏi đầu tiên!
          </p>
        )}
        {questions?.map((q, i) => {
          const badge = q.pool_type ? POOL_BADGE[q.pool_type] : { label: "Chưa phân loại", cls: "bg-gray-100 text-gray-500" };
          return (
            <div
              key={q.id}
              className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate/20 shadow-sm border border-slate/10 dark:border-white/10"
            >
              <span className="text-xs font-bold text-gray-navy dark:text-light-blue w-6 shrink-0 pt-0.5">
                {i + 1}.
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark-blue dark:text-white line-clamp-2">
                  {q.content}
                </p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                    {badge.label}
                  </span>
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
    </div>
  );
}

function QuestionFormWrapper({
  editing,
  lessonId,
  onDone,
}: {
  editing: QuestionOut | "new";
  lessonId: string;
  onDone: () => void;
}) {
  const createMut = useCreateQuestion();
  const updateMut = useUpdateQuestion();

  async function handleSave(data: QuestionCreate) {
    const payload = { ...data, lesson_id: lessonId };
    if (editing === "new") {
      await createMut.mutateAsync(payload);
    } else {
      await updateMut.mutateAsync({ id: editing.id, payload });
    }
    onDone();
  }

  return (
    <QuestionForm
      initial={editing !== "new" ? editing : undefined}
      onSave={handleSave}
      onCancel={onDone}
      saving={createMut.isPending || updateMut.isPending}
      hideLessonSelect
    />
  );
}
