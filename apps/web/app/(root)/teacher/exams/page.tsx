"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useExamsFull,
  useDeleteExam,
} from "@/lib/queries";
import { Sparkles, BarChart2 } from "lucide-react";
import type { ExamOut } from "@/lib/types";
import { ConfirmModal } from "@/components/molecules/confirm-modal";
import { SearchBar } from "@/components/ui/search-bar";

export default function ExamsPage() {
  const router = useRouter();
  const { data: exams, isLoading, error } = useExamsFull();
  const deleteMut = useDeleteExam();
  const [deletingExam, setDeletingExam] = useState<ExamOut | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredExams = useMemo(() => {
    if (!exams) return [];
    return exams.filter((ex) =>
      ex.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [exams, searchQuery]);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto">
          <h1 className="text-xl font-bold text-dark-blue dark:text-white shrink-0">
            Danh sách kỳ thi
          </h1>
          <SearchBar
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery("")}
            placeholder="Tìm kiếm kỳ thi..."
            className="w-full sm:w-64 py-2 h-10 rounded-xl"
          />
        </div>
        <button
          onClick={() => router.push("/teacher/exams/new")}
          className="px-6 py-3 bg-gradient-to-br from-primary to-indigo-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shrink-0 self-end md:self-auto"
        >
          <Sparkles className="size-4" />
          + Tạo kỳ thi mới
        </button>
      </div>

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
          {exams.length > 0 && filteredExams.length === 0 && (
            <p className="text-gray-navy dark:text-light-blue text-sm text-center py-8">
              Không tìm thấy kỳ thi nào phù hợp với từ khóa "{searchQuery}".
            </p>
          )}
          {filteredExams.map((ex) => (
            <ExamRow
              key={ex.id}
              exam={ex}
              onDelete={() => setDeletingExam(ex)}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingExam}
        title="Xoá kỳ thi"
        description={`Bạn có chắc chắn muốn xoá kỳ thi "${deletingExam?.title}"?`}
        confirmLabel="Xoá ngay"
        cancelLabel="Hủy"
        variant="danger"
        isLoading={deleteMut.isPending}
        onConfirm={async () => {
          if (deletingExam) {
            try {
              await deleteMut.mutateAsync(deletingExam.id);
            } catch (err) {
              console.error("Delete failed", err);
            } finally {
              setDeletingExam(null);
            }
          }
        }}
        onCancel={() => setDeletingExam(null)}
      />
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
          {exam.end_time
            ? ` · kết thúc ${new Date(exam.end_time).toLocaleString("vi")}`
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
          href={`/teacher/stats/${exam.id}`}
          className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition flex items-center gap-1"
        >
          <BarChart2 className="size-3" />
          Thống kê
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
