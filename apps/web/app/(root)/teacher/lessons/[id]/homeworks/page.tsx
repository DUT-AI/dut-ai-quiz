"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpenCheck,
  Plus,
  Search,
  CodeXml,
  Users,
  GraduationCap,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLessons } from "@/lib/queries";
import {
  useHomeworks,
  useArchiveHomework,
} from "@/features/homeworks/queries";
import type { Homework } from "@/features/homeworks/types";
import { HomeworkTable } from "@/features/homeworks/components/homework-table";
import { HomeworkFormModal } from "@/features/homeworks/components/homework-form-modal";

export default function LessonHomeworksPage() {
  const { id: lessonId } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: lessons = [], isLoading: isLoadingLessons } = useLessons();
  const { data: homeworksData, isLoading: isLoadingHomeworks } = useHomeworks(lessonId);
  const archive = useArchiveHomework();

  const lesson = lessons.find((l) => l.id === lessonId);
  const homeworks = homeworksData?.data || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Homework | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Homework | null>(null);

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      await archive.mutateAsync(archiveTarget.id);
      toast.success("Đã lưu trữ bài tập thành công");
      setArchiveTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu trữ bài tập");
    }
  };

  // Filter homeworks by search
  const filteredHomeworks = useMemo(() => {
    return homeworks.filter((h) => {
      const q = searchQuery.toLowerCase();
      return h.title.toLowerCase().includes(q) || h.description.toLowerCase().includes(q);
    });
  }, [homeworks, searchQuery]);

  // Quick stats
  const totalSubmissions = useMemo(() => {
    return homeworks.reduce((acc, h) => acc + (h.submitted_count || 0), 0);
  }, [homeworks]);

  const isLoading = isLoadingLessons || isLoadingHomeworks;

  return (
    <div className="w-full space-y-8 pb-12 text-left">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-bold text-gray-navy/70 dark:text-light-blue/60">
        <Link
          href="/teacher/lessons"
          className="hover:text-primary transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" />
          Quản lý bài học
        </Link>
        <span>/</span>
        <span className="text-dark-blue dark:text-white font-extrabold truncate max-w-xs">
          {lesson?.name || "Chi tiết bài học"}
        </span>
        <span>/</span>
        <span className="text-primary">Bài tập coding</span>
      </div>

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider mb-1 border border-indigo-500/20">
            <GraduationCap className="size-3.5" />
            {lesson?.name || "Bài học"}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-dark-blue dark:text-white tracking-tight flex items-center gap-3">
            <CodeXml className="size-8 text-primary" />
            Danh sách <span className="text-primary">Bài tập Coding</span>
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm max-w-2xl">
            Quản lý các bài tập nộp mã nguồn, bài giải và theo dõi tiến trình nộp bài của học viên trong bài học này.
          </p>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="h-11 px-5 shadow-lg shadow-primary/20 rounded-2xl font-bold flex items-center gap-2"
          >
            <Plus className="size-4" />
            <span>Thêm bài tập mới</span>
          </Button>
        </motion.div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-navy/80 dark:text-light-blue/70">
              Tổng số bài tập
            </p>
            <p className="text-2xl font-black text-dark-blue dark:text-white">
              {isLoading ? "..." : homeworks.length} bài
            </p>
          </div>
          <div className="size-12 rounded-xl bg-primary/10 dark:bg-emerald-500/10 text-primary dark:text-emerald-400 flex items-center justify-center border border-primary/20">
            <BookOpenCheck className="size-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-navy/80 dark:text-light-blue/70">
              Tổng lượt học viên đã nộp
            </p>
            <p className="text-2xl font-black text-dark-blue dark:text-white">
              {isLoading ? "..." : totalSubmissions} lượt
            </p>
          </div>
          <div className="size-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Users className="size-6" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm bài tập theo tiêu đề hoặc mô tả..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-250 bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/20 dark:bg-zinc-900/60 dark:text-white"
        />
      </div>

      {/* Main Table Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-navy-blue rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
          <div className="size-8 border-4 border-primary border-t-transparent animate-spin rounded-full mb-3" />
          <p className="text-xs font-bold text-gray-navy dark:text-light-blue animate-pulse">
            Đang tải danh sách bài tập...
          </p>
        </div>
      ) : (
        <HomeworkTable
          homeworks={filteredHomeworks}
          lessons={lessons}
          showLessonColumn={false}
          onEdit={(hw) => {
            setEditing(hw);
            setFormOpen(true);
          }}
          onArchive={(hw) => setArchiveTarget(hw)}
        />
      )}

      {/* Form Modal */}
      <HomeworkFormModal
        open={formOpen}
        homework={editing}
        defaultLessonId={lessonId}
        onClose={() => setFormOpen(false)}
      />

      {/* Confirm Archive Dialog */}
      <ConfirmDialog
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleConfirmArchive}
        title="Lưu trữ bài tập này?"
        description={
          archiveTarget
            ? `Bạn có chắc chắn muốn lưu trữ bài tập "${archiveTarget.title}"? Học viên sẽ không thể xem hoặc nộp bài giải cho bài tập này nữa.`
            : ""
        }
        confirmText="Xác nhận lưu trữ"
        cancelText="Hủy bỏ"
        isDestructive={true}
      />
    </div>
  );
}
