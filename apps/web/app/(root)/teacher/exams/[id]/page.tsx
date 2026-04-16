"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  useExam,
  useExamQuestions,
  useQuestions,
  useSetExamQuestions,
} from "@/lib/queries";
import type { QuestionOut } from "@/lib/types";

export default function ExamQuestionsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: exam } = useExam(id);
  const { data: assigned = [], isLoading } = useExamQuestions(id);
  const { data: allQuestions = [] } = useQuestions({ pool_type: "EXAM", limit: 200 });
  const setMut = useSetExamQuestions(id);

  const [search, setSearch] = useState("");

  const assignedIds = new Set(assigned.map((q) => q.id));

  const filtered = allQuestions.filter(
    (q) =>
      !assignedIds.has(q.id) &&
      (search === "" ||
        q.content.toLowerCase().includes(search.toLowerCase()) ||
        q.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())))
  );

  async function addQuestion(q: QuestionOut) {
    const next = [...assigned.map((a) => a.id), q.id];
    await setMut.mutateAsync(next);
  }

  async function removeQuestion(qId: string) {
    const next = assigned.filter((a) => a.id !== qId).map((a) => a.id);
    await setMut.mutateAsync(next);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/teacher/exams"
          className="text-sm text-gray-navy dark:text-light-blue hover:underline"
        >
          ← Kỳ thi
        </Link>
        <h1 className="text-xl font-bold text-dark-blue dark:text-white truncate">
          {exam?.title ?? "Đang tải…"}
        </h1>
        <Link
          href={`/teacher/exams/${id}/edit`}
          className="ml-auto text-xs px-3 py-1.5 rounded bg-slate/10 hover:bg-slate/20 dark:bg-white/10 dark:hover:bg-white/20 transition"
        >
          Sửa thông tin
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Assigned questions */}
        <div>
          <h2 className="font-semibold text-sm text-dark-blue dark:text-white mb-3">
            Câu hỏi trong đề ({assigned.length})
          </h2>
          {isLoading && (
            <p className="text-sm text-gray-navy dark:text-light-blue">Đang tải…</p>
          )}
          <div className="space-y-2">
            {assigned.map((q, i) => (
              <div
                key={q.id}
                className="flex items-start gap-2 p-3 rounded-lg bg-white dark:bg-slate/20 border border-slate/10 dark:border-white/10 text-sm"
              >
                <span className="font-bold text-gray-navy dark:text-light-blue shrink-0 w-5">
                  {i + 1}.
                </span>
                <span className="flex-1 line-clamp-2 text-dark-blue dark:text-white">
                  {q.content}
                </span>
                <button
                  onClick={() => removeQuestion(q.id)}
                  disabled={setMut.isPending}
                  className="text-red text-xs hover:underline shrink-0"
                >
                  Gỡ
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Available questions */}
        <div>
          <h2 className="font-semibold text-sm text-dark-blue dark:text-white mb-3">
            Câu hỏi chưa thêm
          </h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm…"
            className="w-full mb-3 rounded border border-slate/30 dark:border-white/20 bg-white dark:bg-slate/30 px-2 py-1.5 text-sm"
          />
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filtered.map((q) => (
              <div
                key={q.id}
                className="flex items-start gap-2 p-3 rounded-lg bg-white dark:bg-slate/20 border border-slate/10 dark:border-white/10 text-sm"
              >
                <span className="flex-1 line-clamp-2 text-dark-blue dark:text-white">
                  {q.content}
                </span>
                <button
                  onClick={() => addQuestion(q)}
                  disabled={setMut.isPending}
                  className="text-purple text-xs hover:underline shrink-0"
                >
                  + Thêm
                </button>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-gray-navy dark:text-light-blue text-center py-4">
                Không có câu hỏi phù hợp.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
