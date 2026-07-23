"use client";

import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Columns,
  Edit3,
  Eye,
  ImageIcon,
  Loader2,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import { useCreateLesson, useUpdateLesson, useModules, usePresignUpload } from "@/lib/queries";
import { uploadImage, handlePasteImage } from "@/lib/upload-utils";
import { LessonSchema, type Lesson, type Module } from "../types";
import { EditorToolbar } from "@/features/questions/components/editor/editor-toolbar";

export const LessonEditorSchema = LessonSchema.omit({ id: true, content_md: true }).extend({
  content_md: z.string().optional(),
});
export type LessonEditorInput = z.infer<typeof LessonEditorSchema>;

interface LessonEditorPageProps {
  initialData?: Lesson;
  lessonId?: string;
}

export function LessonEditorPage({ initialData }: LessonEditorPageProps) {
  const router = useRouter();
  const { data: modules = [] } = useModules();
  const presign = usePresignUpload();

  const isEdit = !!initialData;
  const createMut = useCreateLesson();
  const updateMut = useUpdateLesson(initialData?.id || "");

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">("split");
  const [editorWidth, setEditorWidth] = useState<number>(55); // percent
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [uploading, setUploading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDesktop(window.innerWidth >= 1024);
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const methods = useForm<LessonEditorInput>({
    resolver: zodResolver(LessonEditorSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      order: initialData?.order || 1,
      slug: initialData?.slug || "",
      content_md: initialData?.content_md || "",
      module_id: initialData?.module_id || null,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = methods;

  const watchContent = watch("content_md") || "";
  const watchName = watch("name") || "";
  const watchDescription = watch("description") || "";
  const watchModuleId = watch("module_id");

  const handleNextStep = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const isValid = await trigger(["name", "slug", "order", "module_id"]);
    if (isValid) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const selectedModule = useMemo(
    () => modules.find((m) => m.id === watchModuleId),
    [modules, watchModuleId]
  );

  // Auto adjust textarea height while preserving scroll
  useEffect(() => {
    const textarea = document.getElementById("lesson-editor-content") as HTMLTextAreaElement | null;
    if (textarea) {
      const parent = textarea.closest(".overflow-y-auto");
      const scrollTop = parent ? parent.scrollTop : 0;
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(350, textarea.scrollHeight)}px`;
      if (parent) parent.scrollTop = scrollTop;
    }
  }, [watchContent]);

  // Insert format / LaTeX into text position
  const insertFormat = (before: string, after: string = "") => {
    const textarea = document.getElementById("lesson-editor-content") as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = before + selected + after;
    const newValue = text.substring(0, start) + replacement + text.substring(end);

    setValue("content_md", newValue, { shouldDirty: true, shouldValidate: true });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 10);
  };

  // Upload image to cursor position
  const handleUploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      const textarea = document.getElementById("lesson-editor-content") as HTMLTextAreaElement | null;
      try {
        const url = await uploadImage(file, presign.mutateAsync);
        const markdown = `\n![image](${url})\n`;

        if (textarea) {
          const start = textarea.selectionStart ?? textarea.value.length;
          const end = textarea.selectionEnd ?? textarea.value.length;
          const currentText = textarea.value;
          const newValue = currentText.substring(0, start) + markdown + currentText.substring(end);

          setValue("content_md", newValue, { shouldDirty: true, shouldValidate: true });

          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + markdown.length, start + markdown.length);
          }, 10);
        } else {
          setValue("content_md", (getValues("content_md") ?? "") + markdown, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
      } catch (err) {
        console.error("Upload failed", err);
      } finally {
        setUploading(false);
      }
    },
    [presign.mutateAsync, setValue, getValues]
  );

  // Resize drag handle
  const startResize = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const percentage = (relativeX / rect.width) * 100;
      const clamped = Math.max(25, Math.min(75, percentage));
      setEditorWidth(clamped);
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX);
    };

    const stopResize = () => setIsDragging(false);

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", stopResize);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", stopResize);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", stopResize);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", stopResize);
    };
  }, [isDragging]);

  const handleBack = () => {
    router.push("/teacher/lessons");
  };

  const onSubmit = async (values: LessonEditorInput) => {
    const payload = {
      name: values.name,
      description: values.description || "",
      content_md: values.content_md || "",
      order: values.order,
      slug: values.slug || "",
      module_id: values.module_id || null,
    };

    if (isEdit) {
      await updateMut.mutateAsync(payload);
    } else {
      await createMut.mutateAsync(payload);
    }
    handleBack();
  };

  const isPending = createMut.isPending || updateMut.isPending || isSubmitting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className={`fixed inset-0 z-[100] bg-white dark:bg-navy-blue flex flex-col w-screen h-screen overflow-hidden text-left ${
        isDragging ? "select-none cursor-col-resize" : ""
      }`}
    >
      {/* Top Bar Header */}
      <div className="px-6 md:px-8 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0 bg-white dark:bg-navy-blue z-20">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            className="size-10 rounded-2xl p-0 flex items-center justify-center text-gray-navy hover:text-dark-blue dark:hover:text-white border border-gray-200/50 dark:border-white/10"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h2 className="text-lg font-black text-dark-blue dark:text-white leading-none flex items-center gap-2">
              <BookOpen className="size-5 text-primary" />
              {isEdit ? "Chỉnh sửa bài học" : "Soạn bài học mới"}
            </h2>
            <p className="text-xs text-gray-navy font-bold tracking-wide mt-1">
              Quản lý bài học • Nội dung chi tiết & Lý thuyết
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* View Modes */}
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 p-1 rounded-2xl border border-gray-200/40 dark:border-white/5">
            <button
              type="button"
              onClick={() => setViewMode("editor")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "editor"
                  ? "bg-white dark:bg-white/15 text-primary shadow-sm"
                  : "text-gray-navy hover:text-dark-blue dark:hover:text-white"
              }`}
            >
              <Edit3 className="size-3.5" /> Chỉ soạn thảo
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "split"
                  ? "bg-white dark:bg-white/15 text-primary shadow-sm"
                  : "text-gray-navy hover:text-dark-blue dark:hover:text-white"
              }`}
            >
              <Columns className="size-3.5" /> Chia đôi
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "preview"
                  ? "bg-white dark:bg-white/15 text-primary shadow-sm"
                  : "text-gray-navy hover:text-dark-blue dark:hover:text-white"
              }`}
            >
              <Eye className="size-3.5" /> Xem trước
            </button>
          </div>

          <Button
            type="submit"
            form="lesson-editor-form"
            disabled={isPending}
            className="py-2.5 px-6 rounded-2xl bg-primary text-white font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 text-xs"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            {isEdit ? "Lưu thay đổi" : "Tạo bài học"}
          </Button>
        </div>
      </div>

      {/* Main Body */}
      <div ref={containerRef} className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Editor Form Column */}
        <form
          id="lesson-editor-form"
          onSubmit={handleSubmit(onSubmit)}
          className={`flex-1 flex flex-col overflow-y-auto custom-scrollbar ${
            viewMode === "preview" ? "hidden" : ""
          }`}
          style={
            viewMode === "split" && isDesktop
              ? { width: `${editorWidth}%`, flex: "none" }
              : undefined
          }
        >
          <div className="flex-1 px-6 md:px-10 py-6 w-full flex flex-col space-y-6">
            {/* Stepper Header Tabs */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-2 text-left group"
                >
                  <span
                    className={`size-7 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                      currentStep === 1
                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110"
                        : "bg-gray-100 dark:bg-white/10 text-gray-navy group-hover:scale-105"
                    }`}
                  >
                    1
                  </span>
                  <span
                    className={`text-xs font-black uppercase tracking-wider transition-colors ${
                      currentStep === 1 ? "text-primary" : "text-gray-navy group-hover:text-dark-blue dark:group-hover:text-white"
                    }`}
                  >
                    Thông tin bài học
                  </span>
                </button>

                <div className="w-8 h-0.5 bg-gray-100 dark:bg-white/5" />

                <button
                  type="button"
                  onClick={async () => {
                    const isValid = await trigger(["name", "slug", "order", "module_id"]);
                    if (isValid) setCurrentStep(2);
                  }}
                  className="flex items-center gap-2 text-left group"
                >
                  <span
                    className={`size-7 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                      currentStep === 2
                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110"
                        : "bg-gray-100 dark:bg-white/10 text-gray-navy group-hover:scale-105"
                    }`}
                  >
                    2
                  </span>
                  <span
                    className={`text-xs font-black uppercase tracking-wider transition-colors ${
                      currentStep === 2 ? "text-primary" : "text-gray-navy group-hover:text-dark-blue dark:group-hover:text-white"
                    }`}
                  >
                    Nội dung Markdown & Lý thuyết
                  </span>
                </button>
              </div>
            </div>

            {/* Step 1: General Info */}
            {currentStep === 1 && (
              <div className="bg-gray-50/50 dark:bg-white/5 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-white/5 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Lesson Name */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-black text-gray-navy dark:text-light-blue/80 uppercase tracking-wider px-1">
                      Tên bài học <span className="text-red-500">*</span>
                    </label>
                    <input
                      autoFocus
                      placeholder="Ví dụ: Đạo hàm và ứng dụng..."
                      {...register("name")}
                      className="w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 focus:border-primary outline-none font-bold text-base text-dark-blue dark:text-white"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs px-1 font-medium">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Module */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-gray-navy dark:text-light-blue/80 uppercase tracking-wider px-1">
                      Chương (Module)
                    </label>
                    <select
                      {...register("module_id")}
                      className="w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 focus:border-primary outline-none font-bold text-sm text-dark-blue dark:text-white"
                    >
                      <option value="">-- Chưa phân loại --</option>
                      {modules.map((m) => (
                        <option key={m.id} value={m.id}>
                          Chương {m.order}: {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Order */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-gray-navy dark:text-light-blue/80 uppercase tracking-wider px-1">
                      Thứ tự bài học
                    </label>
                    <input
                      type="number"
                      {...register("order", { valueAsNumber: true })}
                      className="w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 focus:border-primary outline-none font-bold text-base text-dark-blue dark:text-white"
                    />
                  </div>

                  {/* Blog Slug */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-black text-gray-navy dark:text-light-blue/80 uppercase tracking-wider px-1">
                      Blog Slug (URL tùy chọn)
                    </label>
                    <input
                      placeholder="dao-ham-va-ung-dung"
                      {...register("slug")}
                      className="w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 focus:border-primary outline-none font-medium text-sm text-dark-blue dark:text-white"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-navy dark:text-light-blue/80 uppercase tracking-wider px-1">
                    Mô tả ngắn trọng tâm bài học
                  </label>
                  <textarea
                    placeholder="Mô tả tóm tắt nội dung trọng tâm của bài học..."
                    rows={4}
                    {...register("description")}
                    className="w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 focus:border-primary outline-none font-medium text-sm resize-none text-dark-blue dark:text-white leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Markdown Content Editor */}
            {currentStep === 2 && (
              <div className="flex-1 flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <label className="text-xs font-black text-gray-navy opacity-60 uppercase tracking-widest px-1 flex items-center justify-between">
                  <span>Nội dung bài học (Markdown & LaTeX)</span>
                  <span className="text-[10px] font-normal lowercase opacity-70">
                    Hỗ trợ dán ảnh (Ctrl+V) & công thức toán
                  </span>
                </label>

                <div className="flex-1 flex flex-col rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 focus-within:border-primary/50 transition-all bg-gray-50 dark:bg-white/5">
                  <EditorToolbar onInsert={insertFormat} />
                  <div className="relative flex-1 group">
                    <textarea
                      id="lesson-editor-content"
                      {...register("content_md")}
                      onPaste={(e) => handlePasteImage(e, handleUploadFile)}
                      placeholder="Nhập nội dung lý thuyết chi tiết của bài học bằng Markdown..."
                      className="w-full min-h-[380px] p-6 bg-transparent border-0 outline-none transition-all font-mono text-base leading-relaxed resize-none overflow-hidden text-dark-blue dark:text-white focus:bg-white dark:focus:bg-navy-blue"
                    />
                    <div className="absolute right-6 bottom-6 flex items-center gap-3">
                      {uploading && <Loader2 className="size-5 animate-spin text-primary" />}
                      <label className="cursor-pointer p-2.5 rounded-2xl bg-white dark:bg-white/10 shadow-md hover:scale-110 active:scale-95 transition-all text-primary border border-gray-100 dark:border-white/5">
                        <ImageIcon className="size-5" />
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleUploadFile(e.target.files[0])}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Footer Controls */}
            <div className="mt-auto pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0">
              <div>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handlePrevStep}
                    className="py-5 px-6 rounded-2xl font-bold flex items-center gap-2 text-gray-navy hover:text-dark-blue dark:hover:text-white"
                  >
                    <ArrowLeft className="size-4" /> Quay lại Bước 1
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {currentStep === 1 ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="py-5 px-8 rounded-2xl bg-primary text-white font-bold flex items-center gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                  >
                    Tiếp theo: Nhập nội dung Markdown
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    form="lesson-editor-form"
                    disabled={isPending}
                    className="py-5 px-10 rounded-2xl bg-primary text-white font-bold flex items-center gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                  >
                    {isPending ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 className="size-5" />}
                    {isEdit ? "Cập nhật bài học" : "Lưu bài học"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Resizable Grabber Handle */}
        {viewMode === "split" && (
          <div
            onMouseDown={startResize}
            onTouchStart={startResize}
            className={`hidden lg:flex items-center justify-center w-1.5 hover:w-2 cursor-col-resize hover:bg-primary/30 transition-all select-none relative z-30 bg-gray-100/50 dark:bg-white/10 ${
              isDragging ? "bg-primary/50 w-2" : ""
            }`}
          >
            <div className="absolute top-1/2 -translate-y-1/2 w-5 h-12 bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 rounded-full flex flex-col gap-0.5 items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 group z-40">
              <span className="w-1 h-3 bg-gray-400 dark:bg-white/30 rounded-full" />
              <span className="w-1 h-3 bg-gray-400 dark:bg-white/30 rounded-full" />
            </div>
          </div>
        )}

        {/* Live Preview Area */}
        {(viewMode === "split" || viewMode === "preview") && (
          <div
            className={`overflow-y-auto p-6 md:p-10 custom-scrollbar bg-gray-50/40 dark:bg-navy-blue/20 ${
              viewMode === "preview"
                ? "flex-1 w-full max-w-4xl px-6 md:px-12 mx-auto"
                : "border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-white/10"
            }`}
            style={
              viewMode === "split" && isDesktop
                ? { width: `${100 - editorWidth}%`, flex: "none" }
                : undefined
            }
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-200/50 dark:border-white/10 pb-4">
                <label className="text-xs font-black text-gray-navy opacity-50 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Sparkles className="size-4 text-primary animate-pulse" /> Xem trước bài học
                </label>
                {selectedModule && (
                  <span className="px-3 py-1 rounded-xl bg-primary/10 text-primary font-bold text-xs">
                    Chương {selectedModule.order}: {selectedModule.name}
                  </span>
                )}
              </div>

              {/* Main Content Render */}
              <div className="rounded-3xl bg-white dark:bg-navy-blue p-8 md:p-12 space-y-6 shadow-sm border border-gray-200/50 dark:border-white/5 text-left">
                {/* Lesson Title */}
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-dark-blue dark:text-white leading-tight">
                    {watchName || "(Chưa nhập tên bài học)"}
                  </h1>
                  {watchDescription && (
                    <p className="text-sm text-gray-navy dark:text-light-blue/80 mt-2 font-medium leading-relaxed">
                      {watchDescription}
                    </p>
                  )}
                </div>

                <div className="w-full h-px bg-gray-100 dark:bg-white/5" />

                {/* Markdown body */}
                {watchContent.trim() ? (
                  <Markdown
                    content={watchContent}
                    className="text-base text-dark-blue dark:text-white leading-relaxed select-text"
                  />
                ) : (
                  <div className="py-12 text-center text-sm font-medium text-gray-navy/40 dark:text-light-blue/30 italic">
                    Chưa có nội dung Markdown bài học...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
