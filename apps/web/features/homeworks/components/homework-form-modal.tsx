"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, FileText, Upload, Sparkles, GraduationCap, Edit3 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";
import { useLessons } from "@/lib/queries";
import { useCreateHomework, useUpdateHomework } from "../queries";
import { Homework } from "../types";
import { LessonSelect } from "./lesson-select";
import { DateTimePicker } from "./date-time-picker";
import { DescriptionEditorModal } from "./description-editor-modal";

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
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    setLessonId(homework?.lesson_id ?? "");
    setTitle(homework?.title ?? "");
    setDescription(homework?.description ?? "");
    setDeadline(homework?.deadline.slice(0, 16) ?? "");
    setFile(null);
    setIsEditorOpen(false);
  }, [homework, open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!lessonId || !title.trim() || !deadline) {
      return toast.error("Vui lòng điền đầy đủ: bài học, tiêu đề và hạn nộp");
    }
    const values = {
      lessonId,
      title,
      description,
      deadline,
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
            className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-150 bg-white p-6 shadow-2xl dark:border-white/20 dark:bg-navy-blue md:p-8 custom-scrollbar"
          >
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="flex items-center gap-2 text-2xl font-black text-dark-blue dark:text-white">
                  <Sparkles className="size-5 text-primary" />
                  {homework ? "Chỉnh sửa bài tập" : "Tạo bài tập mới"}
                </h2>
                <p className="text-sm text-gray-navy dark:text-light-blue/80">
                  Tạo bài tập coding cho bài học này.
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
                  <LessonSelect
                    lessons={lessons}
                    selectedId={lessonId}
                    onChange={setLessonId}
                  />
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-navy dark:text-light-blue/80">
                    <FileText className="size-3.5 text-primary" /> Tiêu đề bài tập
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-11 rounded-lg border border-gray-250 bg-gray-50 px-4 text-sm text-dark-blue outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/20 dark:bg-zinc-950/40 dark:text-white dark:focus:border-primary"
                    placeholder="Ví dụ: Bài tập Python cơ bản..."
                    required
                  />
                </div>

                {/* Deadline */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-navy dark:text-light-blue/80">
                    <Calendar className="size-3.5 text-primary" /> Hạn nộp bài
                  </label>
                  <DateTimePicker
                    value={deadline}
                    onChange={setDeadline}
                  />
                </div>

                {/* Description with Dedicated Markdown Editor Modal */}
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-navy dark:text-light-blue/80">
                      Mô tả / Đề bài chi tiết
                    </label>

                  </div>

                  {description ? (
                    <div
                      onClick={() => setIsEditorOpen(true)}
                      className="relative border border-gray-250 dark:border-white/20 bg-gray-50/50 dark:bg-zinc-950/20 hover:bg-gray-100/30 dark:hover:bg-zinc-950/40 rounded-xl p-4 max-h-[160px] overflow-hidden cursor-pointer transition-all group"
                    >
                      <div className="prose dark:prose-invert max-w-none break-words text-base font-sans leading-relaxed tracking-wide pointer-events-none select-none pb-12">
                        <Markdown content={description} />
                      </div>
                      
                      {/* Contrasting gradient mask (gray-200 to transparent / zinc-900 to transparent) */}
                      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-gray-200 via-gray-200/70 to-transparent dark:from-zinc-900 dark:via-zinc-900/70 dark:to-transparent pointer-events-none transition-colors duration-300" />
                      
                      {/* Centered edit action badge */}
                      <div className="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-primary bg-white dark:bg-zinc-900 border border-gray-150 dark:border-white/10 px-3.5 py-2 rounded-xl shadow-md transform group-hover:scale-105 group-hover:translate-y-[-2px] transition-all duration-300">
                          <Edit3 className="size-3.5" /> Bấm để chỉnh sửa đề bài
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setIsEditorOpen(true)}
                      className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-250 dark:border-white/20 rounded-xl bg-gray-50/50 dark:bg-zinc-950/20 hover:bg-gray-100/50 dark:hover:bg-zinc-950/40 cursor-pointer transition-all group"
                    >
                      <FileText className="size-8 text-gray-400 group-hover:text-primary transition-colors mb-2" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-light-blue/90">
                        Chưa có đề bài chi tiết
                      </span>
                      <span className="text-xs text-gray-navy/60 dark:text-light-blue/50 mt-1">
                        Click vào đây để mở trình soạn thảo đề bài
                      </span>
                    </div>
                  )}
                </div>

                {/* Attachment File */}
                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-navy dark:text-light-blue/80">
                    File đề bài đính kèm (Tùy chọn)
                  </label>
                  <div className="relative flex items-center rounded-xl border border-gray-250 bg-gray-50 dark:border-white/20 dark:bg-zinc-950/40">
                    <label className="flex h-11 cursor-pointer items-center justify-center rounded-l-xl bg-gray-150 px-4 text-sm font-bold text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-light-blue dark:hover:bg-white/10 transition-colors">
                      <Upload className="mr-2 size-4" />
                      Chọn file
                      <input
                        type="file"
                        accept=".pdf,.zip"
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


              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="h-11 rounded-xl px-5 border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-white/20 dark:text-light-blue dark:hover:bg-white/5"
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
                    "Tạo bài tập"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>

          <DescriptionEditorModal
            open={isEditorOpen}
            initialValue={description}
            onClose={() => setIsEditorOpen(false)}
            onSave={setDescription}
          />
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
