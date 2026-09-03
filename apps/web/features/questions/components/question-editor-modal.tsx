"use client";

import React, { useCallback, useMemo } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Loader2,
  CheckCircle2,
  Edit3,
  Columns,
  Eye,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { usePresignUpload, useCreateQuestion, useUpdateQuestion, useTags } from "@/lib/queries";
import { uploadImage } from "@/lib/upload-utils";
import type { QuestionOut } from "@/lib/types";
import { QuestionFormSchema, type QuestionFormValues } from "@/features/questions/types";
import { EditorStep1 } from "./editor/editor-step1";
import { EditorStep2 } from "./editor/editor-step2";
import { EditorStep3 } from "./editor/editor-step3";
import { EditorPreview } from "./editor/editor-preview";

interface Props {
  lessonId: string;
  initialData?: QuestionOut;
  onClose: () => void;
  onSuccess: () => void;
}

const newOption = () => ({
  id: crypto.randomUUID().split("-")[0],
  text: "",
  is_correct: false,
});

export default function QuestionEditorModal({ lessonId, initialData, onClose, onSuccess }: Props) {
  const presign = usePresignUpload();
  const createMut = useCreateQuestion();
  const updateMut = useUpdateQuestion();

  const [viewMode, setViewMode] = React.useState<"split" | "editor" | "preview">("split");
  const [currentStep, setCurrentStep] = React.useState<1 | 2 | 3>(1);

  const [editorWidth, setEditorWidth] = React.useState<number>(60); // percent
  const [isDragging, setIsDragging] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setIsDesktop(window.innerWidth >= 1024);
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const startResize = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const percentage = (relativeX / rect.width) * 100;
      
      // Clamp between 20% and 80%
      const clamped = Math.max(20, Math.min(80, percentage));
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

  const defaultOptions = initialData?.options?.length
    ? initialData.options.map((o) => ({ id: o.id ?? newOption().id, text: o.text, is_correct: o.is_correct }))
    : [
      { ...newOption(), is_correct: true },
      newOption(),
      newOption(),
      newOption(),
    ];

  const { data: allTags = [] } = useTags();

  const methods = useForm<QuestionFormValues>({
    resolver: zodResolver(QuestionFormSchema),
    defaultValues: {
      pool_type: initialData?.pool_type ?? "PRACTICE",
      difficulty: (initialData?.difficulty as any) ?? "EASY",
      content: initialData?.content ?? "",
      options: defaultOptions,
      solution: initialData?.solution ?? "",
      lesson_id: lessonId,
      tags: [],
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { isSubmitting },
  } = methods;

  React.useEffect(() => {
    if (initialData?.tags && allTags.length) {
      const tagIds = allTags
        .filter((tag) => initialData.tags.includes(tag.name))
        .map((tag) => tag.id);
      setValue("tags", tagIds);
    }
  }, [initialData?.tags, allTags, setValue]);

  const { fields, append, remove, update } = useFieldArray({ control, name: "options" });

  // Watch live values for preview
  const watchContent = watch("content");
  const watchOptions = watch("options");
  const watchSolution = watch("solution");

  // Image upload helper — appends markdown to a field
  const [uploading, setUploading] = React.useState<string | null>(null);

  const handleUpload = useCallback(
    async (file: File, target: "content" | "solution" | string) => {
      setUploading(target);
      const id = target === "content" ? "editor-content" : target === "solution" ? "editor-solution" : `editor-option-${target}`;
      const textarea = document.getElementById(id) as HTMLTextAreaElement | null;

      try {
        const url = await uploadImage(file, presign.mutateAsync);
        const markdown = `\n![image](${url})\n`;

        if (textarea) {
          const start = textarea.selectionStart ?? textarea.value.length;
          const end = textarea.selectionEnd ?? textarea.value.length;
          const currentText = textarea.value;
          const newValue = currentText.substring(0, start) + markdown + currentText.substring(end);

          if (target === "content") {
            setValue("content", newValue, { shouldDirty: true, shouldValidate: true });
          } else if (target === "solution") {
            setValue("solution", newValue, { shouldDirty: true, shouldValidate: true });
          } else {
            const idx = fields.findIndex((f) => f.id === target);
            if (idx !== -1) {
              update(idx, { ...fields[idx], text: newValue });
            }
          }

          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + markdown.length, start + markdown.length);
          }, 10);
        } else {
          // Fallback if textarea element is not found
          if (target === "content") {
            setValue("content", (getValues("content") ?? "") + markdown, { shouldDirty: true, shouldValidate: true });
          } else if (target === "solution") {
            setValue("solution", (getValues("solution") ?? "") + markdown, { shouldDirty: true, shouldValidate: true });
          } else {
            const idx = fields.findIndex((f) => f.id === target);
            if (idx !== -1) {
              const currentText = getValues(`options.${idx}.text`) ?? "";
              update(idx, { ...fields[idx], text: currentText + markdown });
            }
          }
        }
      } catch (err) {
        console.error("Upload failed", err);
      } finally {
        setUploading(null);
      }
    },
    [presign.mutateAsync, getValues, fields, setValue, update]
  );

  // Auto adjust textarea height while preserving scroll position
  React.useEffect(() => {
    const contentTextarea = document.getElementById("editor-content") as HTMLTextAreaElement | null;
    if (contentTextarea) {
      const parent = contentTextarea.closest(".overflow-y-auto");
      const scrollTop = parent ? parent.scrollTop : 0;
      contentTextarea.style.height = "auto";
      contentTextarea.style.height = `${contentTextarea.scrollHeight}px`;
      if (parent) {
        parent.scrollTop = scrollTop;
      }
    }
  }, [watchContent, currentStep]);

  React.useEffect(() => {
    const solutionTextarea = document.getElementById("editor-solution") as HTMLTextAreaElement | null;
    if (solutionTextarea) {
      const parent = solutionTextarea.closest(".overflow-y-auto");
      const scrollTop = parent ? parent.scrollTop : 0;
      solutionTextarea.style.height = "auto";
      solutionTextarea.style.height = `${solutionTextarea.scrollHeight}px`;
      if (parent) {
        parent.scrollTop = scrollTop;
      }
    }
  }, [watchSolution, currentStep]);

  React.useEffect(() => {
    if (fields.length === 0) return;
    const firstTextarea = document.getElementById(`editor-option-${fields[0].id}`);
    const parent = firstTextarea?.closest(".overflow-y-auto");
    const scrollTop = parent ? parent.scrollTop : 0;

    fields.forEach((field) => {
      const textarea = document.getElementById(`editor-option-${field.id}`) as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    });

    if (parent) {
      parent.scrollTop = scrollTop;
    }
  }, [watchOptions, currentStep, fields]);

  // Helper to insert LaTeX or markdown format at the textarea selection/cursor
  const insertFormat = (
    field: "content" | "solution" | string,
    before: string,
    after: string = ""
  ) => {
    const id = field === "content" ? "editor-content" : field === "solution" ? "editor-solution" : `editor-option-${field}`;
    const textarea = document.getElementById(id) as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = before + selected + after;
    const newValue = text.substring(0, start) + replacement + text.substring(end);

    if (field === "content") {
      setValue("content", newValue, { shouldDirty: true, shouldValidate: true });
    } else if (field === "solution") {
      setValue("solution", newValue, { shouldDirty: true, shouldValidate: true });
    } else {
      const idx = fields.findIndex((f) => f.id === field);
      if (idx !== -1) {
        update(idx, { ...fields[idx], text: newValue });
      }
    }

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length
      );
    }, 10);
  };

  const handleInsertLink = (field: "content" | "solution" | string) => {
    const id = field === "content" ? "editor-content" : field === "solution" ? "editor-solution" : `editor-option-${field}`;
    const textarea = document.getElementById(id) as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end).trim();

    let replacement = "";
    
    if (selected.startsWith("http://") || selected.startsWith("https://")) {
      const title = prompt("Nhập tiêu đề hiển thị cho liên kết này (hoặc để trống):");
      if (title === null) return;
      
      const displayTitle = title.trim() || selected;
      replacement = `[${displayTitle}](${selected})`;
    } else {
      const url = prompt(
        selected ? `Nhập địa chỉ URL cho liên kết '${selected}':` : "Nhập địa chỉ URL của liên kết:",
        "https://"
      );
      if (url === null) return;
      
      const finalUrl = url.trim() || "url";
      const displayTitle = selected || "Link";
      replacement = `[${displayTitle}](${finalUrl})`;
    }

    const newValue = text.substring(0, start) + replacement + text.substring(end);

    if (field === "content") {
      setValue("content", newValue, { shouldDirty: true, shouldValidate: true });
    } else if (field === "solution") {
      setValue("solution", newValue, { shouldDirty: true, shouldValidate: true });
    } else {
      const idx = fields.findIndex((f) => f.id === field);
      if (idx !== -1) {
        update(idx, { ...fields[idx], text: newValue });
      }
    }

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + replacement.length);
    }, 10);
  };

  const handleNextStep = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (currentStep === 1) {
      const isValid = await trigger("content");
      if (isValid) setCurrentStep(2);
    } else if (currentStep === 2) {
      const isValid = await trigger("options");
      if (isValid) setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  const onSubmit = async (values: QuestionFormValues) => {
    try {
      const payload = {
        pool_type: values.pool_type,
        difficulty: values.difficulty,
        content: values.content,
        options: values.options,
        solution: values.solution || undefined,
        tags: values.tags || [],
        lesson_id: lessonId,
      };
      if (initialData) {
        await updateMut.mutateAsync({ id: initialData.id, payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  // Live preview object
  const previewOptions = useMemo(
    () =>
      watchOptions?.map((opt, i) => ({
        id: opt.id,
        text: opt.text?.trim() || `*(Chưa nhập đáp án ${String.fromCharCode(65 + i)})*`,
        is_correct: opt.is_correct,
      })) ?? [],
    [watchOptions]
  );

  const isPending = createMut.isPending || updateMut.isPending || isSubmitting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className={`fixed inset-0 z-[110] bg-white dark:bg-navy-blue flex flex-col w-screen h-screen overflow-hidden text-left ${
        isDragging ? "select-none cursor-col-resize" : ""
      }`}
    >
      {/* Header */}
      <div className="px-8 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0 bg-white dark:bg-navy-blue z-20">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Edit3 className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-dark-blue dark:text-white leading-none">
              {initialData ? "Chỉnh sửa câu hỏi" : "Soạn câu hỏi mới"}
            </h2>
            <p className="text-xs text-gray-navy font-bold tracking-wide mt-1">
              Bài học • {lessonId.slice(0, 8)}...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* View Modes */}
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 p-1 rounded-2xl border border-gray-200/40 dark:border-white/5">
            <button
              onClick={() => setViewMode("editor")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === "editor"
                  ? "bg-white dark:bg-white/15 text-primary shadow-sm"
                  : "text-gray-navy hover:text-dark-blue dark:hover:text-white"
              }`}
            >
              <Edit3 className="size-3.5" /> Chỉ soạn thảo
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === "split"
                  ? "bg-white dark:bg-white/15 text-primary shadow-sm"
                  : "text-gray-navy hover:text-dark-blue dark:hover:text-white"
              }`}
            >
              <Columns className="size-3.5" /> Chia đôi
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === "preview"
                  ? "bg-white dark:bg-white/15 text-primary shadow-sm"
                  : "text-gray-navy hover:text-dark-blue dark:hover:text-white"
              }`}
            >
              <Eye className="size-3.5" /> Xem trước
            </button>
          </div>

          <button
            onClick={onClose}
            className="size-10 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all flex items-center justify-center text-gray-navy hover:text-dark-blue dark:hover:text-white border border-transparent hover:border-gray-200/50 dark:hover:border-white/10"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div
        ref={containerRef}
        className="flex-1 flex flex-col lg:flex-row overflow-hidden relative"
      >
        <FormProvider {...methods}>
          <form
            id="question-form"
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
            <div className="flex-1 px-4 md:px-6 py-6 w-full flex flex-col">
              {/* Stepper Tabs */}
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-6 mb-8 shrink-0">
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
                      Câu hỏi
                    </span>
                  </button>

                  <div className="w-8 h-0.5 bg-gray-100 dark:bg-white/5" />

                  <button
                    type="button"
                    onClick={async () => {
                      const isContentValid = await trigger("content");
                      if (isContentValid) setCurrentStep(2);
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
                      Đáp án
                    </span>
                  </button>

                  <div className="w-8 h-0.5 bg-gray-100 dark:bg-white/5" />

                  <button
                    type="button"
                    onClick={async () => {
                      const isContentValid = await trigger("content");
                      const isOptionsValid = await trigger("options");
                      if (isContentValid && isOptionsValid) setCurrentStep(3);
                    }}
                    className="flex items-center gap-2 text-left group"
                  >
                    <span
                      className={`size-7 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                        currentStep === 3
                          ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110"
                          : "bg-gray-100 dark:bg-white/10 text-gray-navy group-hover:scale-105"
                      }`}
                    >
                      3
                    </span>
                    <span
                      className={`text-xs font-black uppercase tracking-wider transition-colors ${
                        currentStep === 3 ? "text-primary" : "text-gray-navy group-hover:text-dark-blue dark:group-hover:text-white"
                      }`}
                    >
                      Lời giải
                    </span>
                  </button>
                </div>
              </div>

              {/* Form step screens */}
              <div className="flex-1">
                {currentStep === 1 && (
                  <EditorStep1
                    insertFormat={insertFormat}
                    onInsertLink={handleInsertLink}
                    uploading={uploading}
                    onUploadFile={handleUpload}
                  />
                )}
                {currentStep === 2 && (
                  <EditorStep2
                    fields={fields}
                    append={append}
                    remove={remove}
                    uploading={uploading}
                    onUploadFile={handleUpload}
                  />
                )}
                {currentStep === 3 && (
                  <EditorStep3
                    insertFormat={insertFormat}
                    onInsertLink={handleInsertLink}
                    uploading={uploading}
                    onUploadFile={handleUpload}
                  />
                )}
              </div>

              {/* Stepper Footer Controls */}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0">
                <div>
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handlePrevStep}
                      className="py-6 px-8 rounded-2xl font-bold flex items-center gap-2 text-gray-navy hover:text-dark-blue dark:hover:text-white"
                    >
                      <ArrowLeft className="size-4" /> Quay lại
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {currentStep < 3 ? (
                    <Button
                      key="next-footer"
                      type="button"
                      onClick={(e) => handleNextStep(e)}
                      className="py-6 px-10 rounded-2xl bg-primary text-white font-bold flex items-center gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                    >
                      Tiếp theo <ArrowRight className="size-4" />
                    </Button>
                  ) : (
                    <Button
                      key="submit-footer"
                      form="question-form"
                      type="submit"
                      disabled={isPending}
                      className="py-6 px-12 rounded-2xl bg-primary text-white font-bold flex items-center gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                    >
                      {isPending ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 className="size-5" />}
                      {initialData ? "Cập nhật câu hỏi" : "Lưu câu hỏi"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </FormProvider>

        {/* Divider / Drag Handle */}
        {viewMode === "split" && (
          <div
            onMouseDown={startResize}
            onTouchStart={startResize}
            className={`hidden lg:flex items-center justify-center w-1.5 hover:w-2 cursor-col-resize hover:bg-primary/30 transition-all select-none relative z-30 bg-gray-100/50 dark:bg-white/10 ${
              isDragging ? "bg-primary/50 w-2" : ""
            }`}
          >
            {/* Grabber Handle */}
            <div className="absolute top-1/2 -translate-y-1/2 w-5 h-12 bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 rounded-full flex flex-col gap-0.5 items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 group z-40">
              <span className="w-1 h-3 bg-gray-400 dark:bg-white/30 rounded-full" />
              <span className="w-1 h-3 bg-gray-400 dark:bg-white/30 rounded-full" />
            </div>
          </div>
        )}

        {/* Live Preview Area (always previews everything) */}
        {(viewMode === "split" || viewMode === "preview") && (
          <EditorPreview
            viewMode={viewMode}
            content={watchContent}
            options={previewOptions}
            solution={watchSolution}
            style={
              viewMode === "split" && isDesktop
                ? { width: `${100 - editorWidth}%`, flex: "none" }
                : undefined
            }
          />
        )}
      </div>
    </motion.div>
  );
}

export { QuestionEditorModal };
