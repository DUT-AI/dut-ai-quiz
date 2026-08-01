"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, FileText, Upload, Sparkles, GraduationCap } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import StepParticipants from "@/features/exams/components/exam-editor/StepParticipants";
import { useLessons } from "@/lib/queries";
import { useCreateHomework, useUpdateHomework } from "../queries";
import { Homework } from "../types";

interface HomeworkFormModalProps {
  open: boolean;
  homework: Homework | null;
  onClose: () => void;
}

export function HomeworkFormModal({ open, homework, onClose }: HomeworkFormModalProps) {
  const create = useCreateHomework();
  const update = useUpdateHomework();
  const { data: lessons = [] } = useLessons();

  const [mounted, setMounted] = useState(false);
  const [lessonId, setLessonId] = useState("");

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    setLessonId(homework?.lesson_id ?? "");
    setTitle(homework?.title ?? "");
    setDescription(homework?.description ?? "");
    setDeadline(homework?.deadline.slice(0, 16) ?? "");
    setAssigneeIds(homework?.assignee_ids ?? []);
    setFile(null);
  }, [homework, open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!lessonId || !title.trim() || !deadline || assigneeIds.length === 0) {
      return toast.error("Vui lòng điền đầy đủ: bài học, tiêu đề, hạn nộp và người nhận");
    }
    const values = {
      lessonId,
      title,
      description,
      deadline,
      assigneeIds,
      file,
    };
    try {
      if (homework) {
        await update.mutateAsync({ id: homework.id, values });
        toast.success("Cập nhật bài tập thành công");
      } else {
        await create.mutateAsync(values);
        toast.success("Tạo bài tập thành công");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thao tác thất bại");
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-gray-150 bg-white p-6 shadow-2xl dark:border-white/5 dark:bg-navy-blue md:p-8 custom-scrollbar"
          >
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="flex items-center gap-2 text-2xl font-black text-dark-blue dark:text-white">
                  <Sparkles className="size-5 text-primary" />
                  {homework ? "Chỉnh sửa bài tập" : "Tạo bài tập mới"}
                </h2>
                <p className="text-sm text-gray-navy dark:text-light-blue/80">
                  Giao bài tập coding cho từng học viên hoặc cả lớp học.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-150 hover:text-dark-blue dark:hover:bg-white/5 dark:hover:text-white transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={submit} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                {/* Lesson Selection */}
                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-navy dark:text-light-blue/80">
                    <GraduationCap className="size-3.5 text-primary" /> Bài học
                  </label>
                  <select
                    value={lessonId}
                    onChange={(e) => setLessonId(e.target.value)}
                    className="w-full h-11 rounded-xl border border-gray-250 bg-gray-50 px-4 py-2 text-sm text-dark-blue outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-zinc-950/40 dark:text-white dark:focus:border-primary"
                    required
                  >
                    <option value="" className="dark:bg-zinc-950">Chọn bài học chứa bài tập coding</option>
                    {lessons.map((lesson) => (
                      <option key={lesson.id} value={lesson.id} className="dark:bg-zinc-950">
                        {lesson.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-navy dark:text-light-blue/80">
                    <FileText className="size-3.5 text-primary" /> Tiêu đề bài tập
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-11 rounded-xl border border-gray-250 bg-gray-50 px-4 text-sm text-dark-blue outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-zinc-950/40 dark:text-white dark:focus:border-primary"
                    placeholder="Ví dụ: Bài tập Python cơ bản..."
                    required
                  />
                </div>

                {/* Deadline */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-navy dark:text-light-blue/80">
                    <Calendar className="size-3.5 text-primary" /> Hạn nộp bài
                  </label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full h-11 rounded-xl border border-gray-250 bg-gray-50 px-4 py-2 text-sm text-dark-blue outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-zinc-950/40 dark:text-white dark:focus:border-primary"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-navy dark:text-light-blue/80">
                    Mô tả / Đề bài chi tiết
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Nhập yêu cầu, đề bài hoặc gợi ý làm bài..."
                    className="w-full rounded-xl border border-gray-250 bg-gray-50 px-4 py-3 text-sm text-dark-blue outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-zinc-950/40 dark:text-white dark:focus:border-primary"
                  />
                </div>

                {/* Attachment File */}
                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-navy dark:text-light-blue/80">
                    File đề bài đính kèm (Tùy chọn)
                  </label>
                  <div className="relative flex items-center rounded-xl border border-gray-250 bg-gray-50 dark:border-white/10 dark:bg-zinc-950/40">
                    <label className="flex h-11 cursor-pointer items-center justify-center rounded-l-xl bg-gray-150 px-4 text-sm font-bold text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-light-blue dark:hover:bg-white/10 transition-colors">
                      <Upload className="mr-2 size-4" />
                      Chọn file
                      <input
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        className="hidden"
                      />
                    </label>
                    <span className="truncate px-4 text-xs text-gray-navy dark:text-light-blue/80">
                      {file ? file.name : "Chưa chọn file đề đính kèm..."}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assignees Selection */}
              <div className="rounded-2xl border border-gray-150 p-5 dark:border-white/5 dark:bg-white/[0.01]">
                <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-navy dark:text-light-blue/80">
                  Phân phối & Người nhận bài tập
                </h4>
                <StepParticipants selectedIds={assigneeIds} onChange={setAssigneeIds} />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="h-11 rounded-xl px-5 border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:text-light-blue dark:hover:bg-white/5"
                >
                  Hủy bỏ
                </Button>
                <Button 
                  type="submit" 
                  disabled={create.isPending || update.isPending}
                  className="h-11 rounded-xl px-6"
                >
                  {create.isPending || update.isPending ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Đang xử lý...
                    </span>
                  ) : homework ? (
                    "Lưu thay đổi"
                  ) : (
                    "Tạo và giao bài"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
