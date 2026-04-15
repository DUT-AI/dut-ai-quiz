"use client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useExam, useUpdateExam } from "@/lib/queries";
import ExamForm from "@/components/teacher/exam-form";
import type { ExamCreate } from "@/lib/types";

export default function EditExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: exam, isLoading } = useExam(id);
  const updateMut = useUpdateExam(id);

  async function handleSave(data: ExamCreate) {
    await updateMut.mutateAsync(data);
    router.push("/teacher/exams");
  }

  if (isLoading)
    return (
      <p className="text-gray-navy dark:text-light-blue text-sm">Đang tải…</p>
    );
  if (!exam)
    return <p className="text-red text-sm">Không tìm thấy kỳ thi.</p>;

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/teacher/exams"
          className="text-sm text-gray-navy dark:text-light-blue hover:underline"
        >
          ← Kỳ thi
        </Link>
        <h1 className="text-xl font-bold text-dark-blue dark:text-white">
          Chỉnh sửa kỳ thi
        </h1>
      </div>
      <div className="bg-white dark:bg-slate/20 rounded-2xl p-6 shadow-sm border border-slate/10 dark:border-white/10">
        <ExamForm
          initial={exam}
          onSave={handleSave}
          onCancel={() => router.push("/teacher/exams")}
          saving={updateMut.isPending}
        />
      </div>
    </div>
  );
}
