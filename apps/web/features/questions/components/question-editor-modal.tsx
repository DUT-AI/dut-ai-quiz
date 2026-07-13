"use client";

import React, { useCallback, useMemo } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Sparkles,
  Loader2,
  Trash2,
  Plus,
  ImageIcon,
  CheckCircle2,
  FileText,
  Edit3,
  Columns,
  Eye,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { usePresignUpload, useCreateQuestion, useUpdateQuestion, useTags } from "@/lib/queries";
import { uploadImage, handlePasteImage } from "@/lib/upload-utils";
import type { QuestionOut } from "@/lib/types";
import { QuestionFormSchema, type QuestionFormValues } from "@/features/questions/types";
import { Markdown } from "@/components/markdown";
import { PoolTypeSelector } from "./pool-type-selector";
import { DifficultySelector } from "./difficulty-selector";
import { TagSelector } from "./tag-selector";

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

  const defaultOptions = initialData?.options?.length
    ? initialData.options.map((o) => ({ id: o.id ?? newOption().id, text: o.text, is_correct: o.is_correct }))
    : [
      { ...newOption(), is_correct: true },
      newOption(),
      newOption(),
      newOption(),
    ];

  const { data: allTags = [] } = useTags();

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<QuestionFormValues>({
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
      try {
        const url = await uploadImage(file, presign.mutateAsync);
        const markdown = `\n![image](${url})`;

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
      } catch (err) {
        console.error("Upload failed", err);
      } finally {
        setUploading(null);
      }
    },
    [presign.mutateAsync, getValues, fields, setValue, update]
  );

  // Auto adjust textarea height
  React.useEffect(() => {
    const contentTextarea = document.getElementById("editor-content") as HTMLTextAreaElement | null;
    if (contentTextarea) {
      contentTextarea.style.height = "auto";
      contentTextarea.style.height = `${contentTextarea.scrollHeight}px`;
    }
  }, [watchContent, currentStep]);

  React.useEffect(() => {
    const solutionTextarea = document.getElementById("editor-solution") as HTMLTextAreaElement | null;
    if (solutionTextarea) {
      solutionTextarea.style.height = "auto";
      solutionTextarea.style.height = `${solutionTextarea.scrollHeight}px`;
    }
  }, [watchSolution, currentStep]);

  React.useEffect(() => {
    fields.forEach((field) => {
      const textarea = document.getElementById(`editor-option-${field.id}`) as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    });
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

  const renderToolbar = (field: "content" | "solution" | string) => {
    return (
      <div className="flex flex-wrap items-center gap-1 bg-gray-50 dark:bg-white/5 px-4 py-2 border-b border-gray-200/50 dark:border-white/5 shrink-0 z-10">
        {/* Formatting */}
        <button
          type="button"
          title="In đậm"
          onClick={() => insertFormat(field, "**", "**")}
          className="px-2.5 py-1.5 rounded-lg text-gray-navy hover:text-dark-blue dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10 text-xs font-black transition-all"
        >
          B
        </button>
        <button
          type="button"
          title="In nghiêng"
          onClick={() => insertFormat(field, "*", "*")}
          className="px-2.5 py-1.5 rounded-lg text-gray-navy hover:text-dark-blue dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10 text-xs font-serif italic font-bold transition-all"
        >
          I
        </button>
        <button
          type="button"
          title="Gạch ngang"
          onClick={() => insertFormat(field, "~~", "~~")}
          className="px-2.5 py-1.5 rounded-lg text-gray-navy hover:text-dark-blue dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10 text-xs line-through transition-all"
        >
          S
        </button>

        <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-1" />

        {/* Headings */}
        <button
          type="button"
          title="Tiêu đề 1"
          onClick={() => insertFormat(field, "# ")}
          className="px-2 py-1 rounded-lg text-gray-navy hover:text-dark-blue dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10 text-[10px] font-black transition-all"
        >
          H1
        </button>
        <button
          type="button"
          title="Tiêu đề 2"
          onClick={() => insertFormat(field, "## ")}
          className="px-2 py-1 rounded-lg text-gray-navy hover:text-dark-blue dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10 text-[10px] font-black transition-all"
        >
          H2
        </button>

        <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-1" />

        {/* LaTeX Math */}
        <button
          type="button"
          title="LaTeX dòng ($...$)"
          onClick={() => insertFormat(field, "$", "$")}
          className="px-2.5 py-1.5 rounded-lg text-primary hover:bg-primary/10 text-xs font-bold font-mono transition-all"
        >
          $ Inline
        </button>
        <button
          type="button"
          title="LaTeX khối ($$...$$)"
          onClick={() => insertFormat(field, "$$\n", "\n$$")}
          className="px-2.5 py-1.5 rounded-lg text-primary hover:bg-primary/10 text-xs font-bold font-mono transition-all"
        >
          $$ Block
        </button>
        <button
          type="button"
          title="Phân số"
          onClick={() => insertFormat(field, "\\frac{", "}{}")}
          className="px-2.5 py-1.5 rounded-lg text-primary hover:bg-primary/10 text-xs font-mono transition-all"
        >
          \frac
        </button>
        <button
          type="button"
          title="Căn thức"
          onClick={() => insertFormat(field, "\\sqrt{", "}")}
          className="px-2.5 py-1.5 rounded-lg text-primary hover:bg-primary/10 text-xs font-mono transition-all"
        >
          \sqrt
        </button>
        <button
          type="button"
          title="Ma trận bmatrix"
          onClick={() => insertFormat(field, "\\begin{bmatrix}\n", "\n\\end{bmatrix}")}
          className="px-2.5 py-1.5 rounded-lg text-primary hover:bg-primary/10 text-xs font-mono transition-all"
        >
          [Matrix]
        </button>

        <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-1" />

        {/* Blocks */}
        <button
          type="button"
          title="Danh sách mục"
          onClick={() => insertFormat(field, "- ")}
          className="px-2.5 py-1.5 rounded-lg text-gray-navy hover:text-dark-blue dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10 text-xs transition-all"
        >
          • List
        </button>
        <button
          type="button"
          title="Bảng Markdown"
          onClick={() => insertFormat(field, "| Tiêu đề 1 | Tiêu đề 2 |\n|---|---|\n| Ô 1 | Ô 2 |\n")}
          className="px-2.5 py-1.5 rounded-lg text-gray-navy hover:text-dark-blue dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10 text-xs transition-all"
        >
          Table
        </button>
        <button
          type="button"
          title="Chèn link"
          onClick={() => insertFormat(field, "[", "](url)")}
          className="px-2.5 py-1.5 rounded-lg text-gray-navy hover:text-dark-blue dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10 text-xs transition-all"
        >
          Link
        </button>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className="fixed inset-0 z-[110] bg-white dark:bg-navy-blue flex flex-col w-screen h-screen overflow-hidden text-left"
    >
      {/* Header */}
      <div className="px-8 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0 bg-white dark:bg-navy-blue z-20">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-2xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
            <Plus className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-dark-blue dark:text-white uppercase tracking-tight leading-tight">
              {initialData ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
            </h2>
            <p className="text-xs text-gray-navy opacity-60 hidden sm:block">
              Hỗ trợ Markdown, LaTeX và dán ảnh nhanh
            </p>
          </div>
        </div>

        {/* View Switcher in the center */}
        <div className="hidden md:flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200/50 dark:border-white/5 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("editor")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === "editor"
                ? "bg-white dark:bg-navy-blue shadow-md text-primary"
                : "text-gray-navy hover:text-dark-blue dark:hover:text-white"
              }`}
          >
            <Edit3 className="size-4" />
            Soạn thảo
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === "split"
                ? "bg-white dark:bg-navy-blue shadow-md text-primary"
                : "text-gray-navy hover:text-dark-blue dark:hover:text-white"
              }`}
          >
            <Columns className="size-4" />
            Chia đôi
          </button>
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === "preview"
                ? "bg-white dark:bg-navy-blue shadow-md text-primary"
                : "text-gray-navy hover:text-dark-blue dark:hover:text-white"
              }`}
          >
            <Eye className="size-4" />
            Xem trước
          </button>
        </div>

        {/* Actions on the right */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="py-5 px-6 rounded-xl font-bold text-xs"
          >
            Hủy bỏ
          </Button>

          {currentStep === 3 ? (
            <Button
              key="submit-header"
              form="question-form"
              type="submit"
              disabled={isPending}
              className="py-5 px-8 rounded-xl bg-primary text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 animate-none"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              {initialData ? "Lưu câu hỏi" : "Tạo câu hỏi"}
            </Button>
          ) : (
            <Button
              key="next-header"
              type="button"
              onClick={(e) => handleNextStep(e)}
              className="py-5 px-8 rounded-xl bg-primary text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              Tiếp theo <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Body container */}
      <div className="flex-1 overflow-hidden">
        <form id="question-form" onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col lg:flex-row">
          {/* Editor Area */}
          {(viewMode === "split" || viewMode === "editor") && (
            <div className={`flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar ${viewMode === "editor" ? "w-full max-w-none px-6 md:px-12 lg:px-20 mx-auto" : "lg:w-[60%] xl:w-[65%]"
              }`}>
              <div className="flex flex-col h-full min-h-0 pb-12">
                {/* Stepper Progress Bar */}
                <div className="flex items-center justify-between w-full max-w-xl mx-auto mb-8 bg-gray-50 dark:bg-white/5 px-6 py-4 rounded-2xl border border-gray-100/50 dark:border-white/5 shrink-0 select-none">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center gap-2 group cursor-pointer"
                  >
                    <span className={`size-7 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${currentStep === 1
                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110"
                        : currentStep > 1
                          ? "bg-green text-white"
                          : "bg-gray-200 dark:bg-white/10 text-gray-navy"
                      }`}>
                      {currentStep > 1 ? "✓" : "1"}
                    </span>
                    <span className={`text-xs font-black uppercase tracking-wider transition-colors ${currentStep === 1 ? "text-primary" : "text-gray-navy group-hover:text-dark-blue dark:group-hover:text-white"
                      }`}>
                      Câu hỏi
                    </span>
                  </button>

                  <div className="flex-1 h-px bg-gray-200 dark:bg-white/10 mx-4" />

                  <button
                    type="button"
                    onClick={() => currentStep >= 2 ? setCurrentStep(2) : null}
                    disabled={currentStep < 2}
                    className="flex items-center gap-2 group disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className={`size-7 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${currentStep === 2
                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110"
                        : currentStep > 2
                          ? "bg-green text-white"
                          : "bg-gray-200 dark:bg-white/10 text-gray-navy"
                      }`}>
                      {currentStep > 2 ? "✓" : "2"}
                    </span>
                    <span className={`text-xs font-black uppercase tracking-wider transition-colors ${currentStep === 2 ? "text-primary" : "text-gray-navy group-hover:text-dark-blue dark:group-hover:text-white"
                      }`}>
                      Đáp án
                    </span>
                  </button>

                  <div className="flex-1 h-px bg-gray-200 dark:bg-white/10 mx-4" />

                  <button
                    type="button"
                    onClick={() => currentStep >= 3 ? setCurrentStep(3) : null}
                    disabled={currentStep < 3}
                    className="flex items-center gap-2 group disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className={`size-7 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${currentStep === 3
                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110"
                        : "bg-gray-200 dark:bg-white/10 text-gray-navy"
                      }`}>
                      3
                    </span>
                    <span className={`text-xs font-black uppercase tracking-wider transition-colors ${currentStep === 3 ? "text-primary" : "text-gray-navy group-hover:text-dark-blue dark:group-hover:text-white"
                      }`}>
                      Lời giải
                    </span>
                  </button>
                </div>

                {/* Step 1: Content + Meta */}
                {currentStep === 1 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Metadata Selectors (compact row) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 dark:bg-white/5 p-4 rounded-3xl border border-gray-100/50 dark:border-white/5">
                      <Controller
                        control={control}
                        name="pool_type"
                        render={({ field }) => (
                          <PoolTypeSelector
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <Controller
                        control={control}
                        name="difficulty"
                        render={({ field }) => (
                          <DifficultySelector
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <Controller
                        control={control}
                        name="tags"
                        render={({ field }) => (
                          <TagSelector
                            value={field.value || []}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>

                    {/* Question Content textarea auto-expanding */}
                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-navy opacity-45 uppercase tracking-[0.2em] px-1 italic flex items-center gap-2">
                        <FileText className="size-4 text-primary" /> Nội dung câu hỏi
                      </label>
                      <div className="flex flex-col rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 focus-within:border-primary/50 transition-all bg-gray-50 dark:bg-white/5">
                        {renderToolbar("content")}
                        <div className="relative group">
                          <textarea
                            id="editor-content"
                            {...register("content")}
                            autoFocus
                            onPaste={(e) => handlePasteImage(e, (file) => handleUpload(file, "content"))}
                            placeholder="Nhập nội dung câu hỏi, $...$ cho LaTeX, hỗ trợ dán ảnh (Ctrl+V)..."
                            className={`w-full px-6 py-4 bg-transparent border-0 outline-none transition-all font-medium text-lg leading-relaxed resize-none overflow-hidden ${errors.content ? "bg-red/5" : "focus:bg-white dark:focus:bg-navy-blue"
                              }`}
                          />
                          <div className="absolute right-4 bottom-4 flex items-center gap-3">
                            {uploading === "content" && <Loader2 className="size-5 animate-spin text-primary" />}
                            <label className="cursor-pointer p-2 rounded-xl bg-white dark:bg-white/10 shadow-sm hover:scale-110 active:scale-95 transition-all text-primary border border-gray-100 dark:border-white/5">
                              <ImageIcon className="size-5" />
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "content")}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                      {errors.content && (
                        <p className="text-red text-xs px-2">{errors.content.message}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Options */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <label className="text-xs font-black text-gray-navy opacity-45 uppercase tracking-[0.2em] px-1 italic flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-primary" /> Các phương án đáp án
                    </label>

                    {errors.options?.root && (
                      <p className="text-red text-xs px-2">{errors.options.root.message}</p>
                    )}
                    {typeof errors.options?.message === "string" && (
                      <p className="text-red text-xs px-2">{errors.options.message}</p>
                    )}

                    <div className="grid gap-4">
                      {fields.map((field, idx) => (
                        <div key={field.id} className="relative group flex items-start gap-4 w-full">
                          {/* Correct toggle */}
                          <Controller
                            control={control}
                            name={`options.${idx}.is_correct`}
                            render={({ field: f }) => (
                              <button
                                type="button"
                                onClick={() => {
                                  const currentOptions = watchOptions || [];
                                  const updated = currentOptions.map((opt, i) => ({
                                    ...opt,
                                    is_correct: i === idx,
                                  }));
                                  setValue("options", updated, { shouldDirty: true, shouldValidate: true });
                                }}
                                className={`mt-3 size-10 rounded-2xl flex items-center justify-center border-2 transition-all font-black text-sm shrink-0 ${f.value
                                    ? "bg-green border-green text-white shadow-lg shadow-green/20"
                                    : "bg-transparent border-gray-200 dark:border-white/10 text-gray-navy hover:border-primary/50"
                                  }`}
                              >
                                {String.fromCharCode(65 + idx)}
                              </button>
                            )}
                          />

                          <div className="flex-1 min-w-0 flex items-start gap-3 bg-gray-50/30 dark:bg-white/5 p-3 rounded-2xl border border-gray-100/50 dark:border-white/5 hover:border-primary/20 transition-all">
                            <div className="flex-1 min-w-0">
                              <textarea
                                id={`editor-option-${field.id}`}
                                {...register(`options.${idx}.text`)}
                                onPaste={(e) => handlePasteImage(e, (file) => handleUpload(file, field.id))}
                                placeholder={`Đáp án ${String.fromCharCode(65 + idx)}...`}
                                className={`w-full px-4 py-3 rounded-xl bg-transparent outline-none transition-all font-medium resize-none overflow-hidden ${errors.options?.[idx]?.text ? "border-red/40" : "border-transparent"
                                  }`}
                              />
                              {errors.options?.[idx]?.text && (
                                <p className="text-red text-xs px-2 mt-1">{errors.options[idx]!.text!.message}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0 pt-2">
                              <label className="cursor-pointer p-2 rounded-xl text-gray-navy hover:text-primary hover:bg-primary/10 transition-all opacity-40 hover:opacity-100">
                                {uploading === field.id ? <Loader2 className="size-4 animate-spin text-primary" /> : <ImageIcon className="size-4" />}
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], field.id)}
                                />
                              </label>
                              {fields.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => remove(idx)}
                                  className="p-2 rounded-xl text-red/40 hover:text-red hover:bg-red/10 transition-all"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {fields.length < 6 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => append(newOption())}
                          className="w-fit text-primary font-bold flex items-center gap-2 mt-2 px-6 py-5 rounded-2xl hover:bg-primary/10"
                        >
                          <Plus className="size-4" /> Thêm đáp án
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Explanation */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <label className="text-xs font-black text-gray-navy opacity-45 uppercase tracking-[0.2em] px-1 italic flex items-center gap-2">
                      <Sparkles className="size-4 text-primary" /> Hướng dẫn chi tiết / Lời giải
                    </label>
                    <div className="flex flex-col rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 focus-within:border-primary/50 transition-all bg-gray-50 dark:bg-white/5">
                      {renderToolbar("solution")}
                      <div className="relative group">
                        <textarea
                          id="editor-solution"
                          {...register("solution")}
                          onPaste={(e) => handlePasteImage(e, (file) => handleUpload(file, "solution"))}
                          placeholder="Hướng dẫn giải bài tập, hỗ trợ LaTeX và dán ảnh..."
                          className="w-full px-6 py-4 bg-transparent border-0 outline-none transition-all font-medium text-sm resize-none overflow-hidden focus:bg-white dark:focus:bg-navy-blue"
                        />
                        <div className="absolute right-4 bottom-4">
                          {uploading === "solution" && <Loader2 className="size-5 animate-spin text-primary" />}
                          <label className="cursor-pointer p-2 rounded-xl bg-white dark:bg-white/10 shadow-sm hover:scale-110 transition-all text-primary opacity-40 hover:opacity-100 border border-gray-100 dark:border-white/5 block">
                            <ImageIcon className="size-5" />
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "solution")}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
            </div>
          )}

          {/* Live Preview Area (always previews everything) */}
          {(viewMode === "split" || viewMode === "preview") && (
            <div className={`overflow-y-auto p-6 md:p-10 custom-scrollbar bg-gray-50/40 dark:bg-navy-blue/20 ${viewMode === "preview" ? "flex-1 w-full max-w-none px-6 md:px-12 lg:px-20 mx-auto" : "lg:w-[40%] xl:w-[35%] border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-white/10"
              }`}>
              <div className="space-y-6">
                <label className="text-xs font-black text-gray-navy opacity-45 uppercase tracking-[0.2em] px-1 italic flex items-center gap-2">
                  <Sparkles className="size-4 text-primary animate-pulse" /> Xem trước trực quan
                </label>

                <div className="rounded-3xl bg-white dark:bg-navy-blue border border-gray-200/50 dark:border-white/5 p-6 md:p-8 space-y-6 shadow-sm">
                  {/* Content Preview */}
                  {watchContent?.trim() ? (
                    <Markdown
                      content={watchContent}
                      className="text-lg font-semibold text-dark-blue dark:text-white leading-relaxed select-text"
                    />
                  ) : (
                    <div className="text-lg font-semibold text-dark-blue dark:text-white leading-relaxed select-text opacity-30 italic">
                      Chưa nhập nội dung câu hỏi...
                    </div>
                  )}

                  {/* Options Preview */}
                  <div className="space-y-3">
                    {previewOptions.map((opt, i) => (
                      <div
                        key={opt.id}
                        className={`flex items-start gap-3 px-5 py-4 rounded-2xl border text-sm font-medium transition-all ${opt.is_correct
                            ? "bg-green/10 border-green/30 text-green"
                            : "bg-gray-50/50 dark:bg-white/5 border-gray-100 dark:border-white/5 text-dark-blue dark:text-white opacity-85"
                          }`}
                      >
                        <span
                          className={`size-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border-2 ${opt.is_correct
                              ? "bg-green text-white border-green"
                              : "bg-white dark:bg-navy-blue border-gray-200 dark:border-white/10 text-primary"
                            }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt.text ? (
                          <Markdown
                            content={opt.text}
                            className="flex-1 leading-relaxed"
                          />
                        ) : (
                          <span className="flex-1 opacity-30 italic">
                            Chưa nhập đáp án {String.fromCharCode(65 + i)}...
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Solution Preview */}
                  {watchSolution?.trim() && (
                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest opacity-60 flex items-center gap-1">
                        <Sparkles className="size-3" /> Hướng dẫn giải
                      </p>
                      <Markdown
                        content={watchSolution}
                        className="text-sm text-dark-blue dark:text-white leading-relaxed"
                      />
                    </div>
                  )}
                </div>

                <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-2">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-widest opacity-60">
                    💡 Hướng dẫn soạn thảo nhanh
                  </h4>
                  <div className="text-xs text-gray-navy leading-relaxed space-y-1.5 opacity-80">
                    <p><strong>Toán LaTeX:</strong> <code className="bg-white dark:bg-white/10 px-1 py-0.5 rounded text-primary">$a^2+b^2=c^2$</code> hoặc công thức khối <code className="bg-white dark:bg-white/10 px-1 py-0.5 rounded text-primary">$$E=mc^2$$</code></p>
                    <p><strong>In đậm:</strong> <code className="bg-white dark:bg-white/10 px-1 py-0.5 rounded text-primary">**chữ đậm**</code></p>
                    <p><strong>Tiêu đề:</strong> <code className="bg-white dark:bg-white/10 px-1 py-0.5 rounded text-primary">## Tiêu đề</code></p>
                    <p><strong>Danh sách:</strong> <code className="bg-white dark:bg-white/10 px-1 py-0.5 rounded text-primary">- mục 1</code></p>
                    <p><strong>Ảnh:</strong> Nhấp vào biểu tượng ảnh hoặc dán ảnh trực tiếp từ bộ nhớ tạm <kbd className="bg-white dark:bg-white/10 px-1.5 py-0.5 rounded shadow-sm">Ctrl+V / Cmd+V</kbd></p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </motion.div>
  );
}

// Named re-export for compatibility
export { QuestionEditorModal };
