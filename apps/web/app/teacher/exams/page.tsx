"use client";
import { useState } from "react";
import Link from "next/link";
import {
  useExamsFull,
  useCreateExam,
  useDeleteExam,
} from "@/lib/queries";
import ExamForm from "@/components/teacher/exam-form";
import type { ExamCreate, ExamOut } from "@/lib/types";

export default function ExamsPage() {
  const { data: exams, isLoading, error } = useExamsFull();
  const createMut = useCreateExam();
  const deleteMut = useDeleteExam();
  const [showForm, setShowForm] = useState(false);

  async function handleCreate(data: ExamCreate) {
    await createMut.mutateAsync(data);
    setShowForm(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-dark-blue dark:text-white">
          Danh sách kỳ thi
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-purple text-white rounded-lg text-sm font-medium hover:bg-purple/80 transition"
        >
          + Tạo kỳ thi
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-blue rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold mb-4 text-dark-blue dark:text-white">
              Tạo kỳ thi mới
            </h2>
            <ExamForm
              onSave={handleCreate}
              onCancel={() => setShowForm(false)}
              saving={createMut.isPending}
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
      {exams && (
        <div className="space-y-3">
          {exams.length === 0 && (
            <p className="text-gray-navy dark:text-light-blue text-sm text-center py-8">
              Chưa có kỳ thi nào.
            </p>
          )}
          {exams.map((ex) => (
            <ExamRow
              key={ex.id}
              exam={ex}
              onDelete={() =>
                confirm(`Xoá kỳ thi "${ex.title}"?`) && deleteMut.mutate(ex.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ExamRow({
  exam,
  onDelete,
}: {
  exam: ExamOut;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate/20 shadow-sm border border-slate/10 dark:border-white/10">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-dark-blue dark:text-white text-sm truncate">
            {exam.title}
          </p>
          {exam.is_published ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green/20 text-green font-medium">
              Công khai
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate/10 dark:bg-white/10 text-gray-navy dark:text-light-blue">
              Nháp
            </span>
          )}
        </div>
        <p className="text-xs text-gray-navy dark:text-light-blue mt-0.5">
          {exam.duration_minutes} phút · tối đa {exam.max_attempts} lần
          {exam.start_time
            ? ` · bắt đầu ${new Date(exam.start_time).toLocaleString("vi")}`
            : ""}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Link
          href={`/teacher/exams/${exam.id}`}
          className="text-xs px-2 py-1 rounded bg-slate/10 hover:bg-slate/20 dark:bg-white/10 dark:hover:bg-white/20 transition"
        >
          Quản lý câu hỏi
        </Link>
        <Link
          href={`/teacher/exams/${exam.id}/edit`}
          className="text-xs px-2 py-1 rounded bg-slate/10 hover:bg-slate/20 dark:bg-white/10 dark:hover:bg-white/20 transition"
        >
          Sửa
        </Link>
        <button
          onClick={onDelete}
          className="text-xs px-2 py-1 rounded bg-red/10 text-red hover:bg-red/20 transition"
        >
          Xoá
        </button>
      </div>
    </div>
  );
}
