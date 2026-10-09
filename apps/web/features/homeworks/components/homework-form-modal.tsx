"use client";

import {
  X,
  FileText,
  Upload,
  Sparkles,
  GraduationCap,
  Edit3,
  Paperclip,
  CheckCircle2,
  FileArchive,
  Download,
  RefreshCw,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import { useLessons } from "@/lib/queries";
import { useCreateHomework, useUpdateHomework, openHomeworkAttachment } from "../queries";
import { Homework } from "../types";
import { LessonSelect } from "./lesson-select";
import { DescriptionEditorModal } from "./description-editor-modal";

interface HomeworkFormModalProps {
  open: boolean;
  homework: Homework | null;
  onClose: () => void;
  defaultLessonId?: string;
}

interface HomeworkFormModalContentProps {
  homework: Homework | null;
  defaultLessonId?: string;
  onClose: () => void;
}

function HomeworkFormModalContent({
  homework,
  defaultLessonId,
  onClose,
}: HomeworkFormModalContentProps) {
  const create = useCreateHomework();
  const update = useUpdateHomework();
  const { data: lessons = [] } = useLessons();

  // Initialize state synchronously with props to prevent initial render flicker and layout shifts
  const [lessonId, setLessonId] = useState(
    () => homework?.lesson_id ?? defaultLessonId ?? ""
  );
  const [title, setTitle] = useState(() => homework?.title ?? "");
  const [description, setDescription] = useState(() => homework?.description ?? "");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadAttachment = async () => {
    if (!homework?.id) return;
    try {
      setIsDownloading(true);
      await openHomeworkAttachment(homework.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể tải tệp đính kèm");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (selected) {
      if (!selected.name.toLowerCase().endsWith(".zip")) {
        toast.error("File đề bài đính kèm phải là file .zip");
        e.target.value = "";
        return;
      }
      setFile(selected);
    }
    // Reset input value so selecting the same file again triggers onChange
    e.target.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Prevent background scrolling while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!lessonId || !title.trim()) {
      return toast.error("Vui lòng điền đầy đủ bài học và tiêu đề");
    }
    const values = {
      lessonId,
      title,
      description,
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 10 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
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

                {/* Contrasting gradient mask */}
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
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-navy dark:text-light-blue/80">
                <Paperclip className="size-3.5 text-primary" /> File đề bài đính kèm (Tùy chọn)
              </label>
              {homework?.has_attachment && !file && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3" /> Đã có tệp trên hệ thống
                </span>
              )}
            </div>

            {/* State 1: A new file is chosen */}
            {file ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3.5 dark:border-primary/20 dark:bg-primary/10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                    <FileArchive className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-dark-blue dark:text-white">
                        {file.name}
                      </p>
                      <span className="shrink-0 rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        File mới
                      </span>
                    </div>
                    <p className="text-xs text-gray-navy dark:text-light-blue/70">
                      {formatFileSize(file.size)} &bull; Sẽ được lưu khi nhấn {homework ? "Lưu thay đổi" : "Tạo bài tập"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-250 bg-white px-3 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-white/20 dark:bg-zinc-900 dark:text-light-blue dark:hover:bg-zinc-800 transition-colors">
                    <RefreshCw className="size-3.5" />
                    Đổi file
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    title="Hủy chọn file này"
                    className="flex h-9 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                  >
                    <X className="size-3.5" />
                    Hủy
                  </button>
                </div>
              </div>
            ) : homework?.has_attachment ? (
              /* State 2: Existing attachment on the server */
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-50/50 p-3.5 dark:border-emerald-500/20 dark:bg-emerald-950/20">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                    <FileArchive className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-dark-blue dark:text-white">
                        Tệp đề bài đính kèm hiện tại (.zip)
                      </p>
                      <span className="shrink-0 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        Đang hoạt động
                      </span>
                    </div>
                    <p className="text-xs text-gray-navy dark:text-light-blue/70">
                      Học sinh sẽ tải về tệp này khi xem và giải bài tập.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    disabled={isDownloading}
                    onClick={handleDownloadAttachment}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 text-xs font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 dark:border-emerald-500/30 dark:bg-zinc-900 dark:text-emerald-300 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    <Download className="size-3.5" />
                    {isDownloading ? "Đang mở..." : "Tải về xem"}
                  </button>
                  <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-250 bg-white px-3 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-white/20 dark:bg-zinc-900 dark:text-light-blue dark:hover:bg-zinc-800 transition-colors">
                    <Upload className="size-3.5" />
                    Thay file mới
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              /* State 3: No file on server and none selected */
              <div className="relative flex items-center rounded-xl border border-gray-250 bg-gray-50 dark:border-white/20 dark:bg-zinc-950/40">
                <label className="flex h-11 cursor-pointer items-center justify-center rounded-l-xl bg-gray-150 px-4 text-sm font-bold text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-light-blue dark:hover:bg-white/10 transition-colors">
                  <Upload className="mr-2 size-4" />
                  Chọn file
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <span className="truncate px-4 text-xs text-gray-navy/70 dark:text-light-blue/60">
                  Chưa có file đề đính kèm (hỗ trợ định dạng .zip)...
                </span>
              </div>
            )}

            <p className="text-[11px] text-gray-navy dark:text-light-blue/70">
              ZIP có thể chứa mọi loại file; các file PDF bên trong sẽ được dùng làm yêu cầu bổ sung khi chấm.
            </p>
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

      {isEditorOpen && (
        <DescriptionEditorModal
          open={isEditorOpen}
          initialValue={description}
          onClose={() => setIsEditorOpen(false)}
          onSave={setDescription}
        />
      )}
    </motion.div>
  );
}

export function HomeworkFormModal({
  open,
  homework,
  onClose,
  defaultLessonId,
}: HomeworkFormModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            key="homework-form-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content with key to guarantee clean state initialization */}
          <HomeworkFormModalContent
            key={homework ? homework.id : "new-homework"}
            homework={homework}
            defaultLessonId={defaultLessonId}
            onClose={onClose}
          />
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
