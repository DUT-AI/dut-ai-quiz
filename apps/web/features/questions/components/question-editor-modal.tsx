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
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { usePresignUpload, useCreateQuestion, useUpdateQuestion, useTags } from "@/lib/queries";
import { uploadImage, handlePasteImage } from "@/lib/upload-utils";
import type { QuestionOut } from "@/lib/types";
import { QuestionFormSchema, type QuestionFormValues } from "@/features/questions/types";
import { renderMathInHTML } from "@/lib/render-math";
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
          setValue("content", (getValues("content") ?? "") + markdown);
        } else if (target === "solution") {
          setValue("solution", (getValues("solution") ?? "") + markdown);
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="bg-white dark:bg-navy-blue w-full max-w-7xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-white/10"
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="p-8 border-b border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4 text-left">
              <div className="size-12 rounded-2xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Plus className="size-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-dark-blue dark:text-white uppercase tracking-tight">
                  {initialData ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
                </h2>
                <p className="text-sm text-gray-navy opacity-60">
                  Hỗ trợ Markdown, LaTeX và chèn hình ảnh nhanh.
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <X className="size-6 text-gray-navy" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <form id="question-form" onSubmit={handleSubmit(onSubmit)} className="space-y-10 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pool type selector */}
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

                {/* Difficulty selector */}
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

                {/* Tag selector */}
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left: Inputs */}
                <div className="space-y-8 min-w-0">
                  {/* Content */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-navy opacity-40 uppercase tracking-[0.2em] px-1 italic flex items-center gap-2">
                      <FileText className="size-4" /> Nội dung câu hỏi
                    </label>
                    <div className="relative group">
                      <textarea
                        {...register("content")}
                        autoFocus
                        onPaste={(e) => handlePasteImage(e, (file) => handleUpload(file, "content"))}
                        placeholder="Nhập nội dung câu hỏi, $...$ cho LaTeX, hỗ trợ dán ảnh (Ctrl+V)..."
                        rows={5}
                        className={`w-full px-8 py-6 rounded-3xl bg-gray-50 dark:bg-white/5 border-2 outline-none transition-all font-medium text-lg leading-relaxed resize-y ${
                          errors.content ? "border-red/50" : "border-transparent focus:border-primary/30"
                        }`}
                      />
                      <div className="absolute right-4 bottom-4 flex items-center gap-3">
                        {uploading === "content" && <Loader2 className="size-5 animate-spin text-primary" />}
                        <label className="cursor-pointer p-2 rounded-xl bg-white dark:bg-white/10 shadow-sm hover:scale-110 active:scale-95 transition-all text-primary">
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
                    {errors.content && (
                      <p className="text-red text-xs px-2">{errors.content.message}</p>
                    )}
                  </div>

                  {/* Options */}
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-navy opacity-40 uppercase tracking-[0.2em] px-1 italic flex items-center gap-2">
                      <CheckCircle2 className="size-4" /> Đáp án
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
                                className={`mt-4 size-8 rounded-xl flex items-center justify-center border-2 transition-all font-black text-xs shrink-0 ${
                                  f.value
                                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-transparent border-gray-200 dark:border-white/10 text-gray-navy"
                                }`}
                              >
                                {String.fromCharCode(65 + idx)}
                              </button>
                            )}
                          />

                          <div className="flex-1 min-w-0 flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <textarea
                                {...register(`options.${idx}.text`)}
                                onPaste={(e) => handlePasteImage(e, (file) => handleUpload(file, field.id))}
                                placeholder={`Đáp án ${String.fromCharCode(65 + idx)}...`}
                                rows={2}
                                className={`w-full px-6 py-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 border outline-none transition-all font-medium min-h-[56px] resize-y overflow-y-auto ${
                                  errors.options?.[idx]?.text ? "border-red/40" : "border-transparent focus:border-primary/30"
                                }`}
                              />
                              {errors.options?.[idx]?.text && (
                                <p className="text-red text-xs px-2 mt-1">{errors.options[idx]!.text!.message}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0 pt-2">
                              <label className="cursor-pointer p-2 rounded-xl text-gray-navy hover:text-primary hover:bg-primary/10 transition-all opacity-40 hover:opacity-100">
                                {uploading === field.id ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
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
                          className="w-fit text-primary font-bold flex items-center gap-2 mt-2 px-6"
                        >
                          <Plus className="size-4" /> Thêm đáp án
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Solution */}
                  <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/10">
                    <label className="text-xs font-black text-gray-navy opacity-40 uppercase tracking-[0.2em] px-1 italic flex items-center gap-2">
                      <Sparkles className="size-4" /> Hướng dẫn chi tiết / Lời giải
                    </label>
                    <div className="relative">
                      <textarea
                        {...register("solution")}
                        onPaste={(e) => handlePasteImage(e, (file) => handleUpload(file, "solution"))}
                        placeholder="Hướng dẫn giải bài tập..."
                        rows={3}
                        className="w-full px-8 py-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary/30 outline-none transition-all font-medium text-sm resize-y"
                      />
                      <div className="absolute right-4 bottom-4">
                        <label className="cursor-pointer p-2 rounded-xl bg-white dark:bg-white/10 shadow-sm hover:scale-110 transition-all text-primary opacity-40 hover:opacity-100 block">
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

                {/* Right: Live Preview */}
                <div className="space-y-6 min-w-0 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-white/10 lg:pl-10 pt-8 lg:pt-0 text-left">
                  <div className="sticky top-0 space-y-5">
                    <label className="text-xs font-black text-gray-navy opacity-40 uppercase tracking-[0.2em] px-1 italic flex items-center gap-2">
                      <Sparkles className="size-4 text-primary animate-pulse" /> Live Preview
                    </label>

                    <div className="rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 p-6 space-y-6 overflow-auto max-h-[55vh]">
                      <div
                        className="text-lg font-semibold text-dark-blue dark:text-white leading-relaxed select-text"
                        dangerouslySetInnerHTML={{
                          __html: watchContent?.trim()
                            ? renderMathInHTML(watchContent)
                            : "<span class='opacity-30 italic'>Chưa nhập nội dung câu hỏi...</span>",
                        }}
                      />

                      <div className="space-y-3">
                        {previewOptions.map((opt, i) => (
                          <div
                            key={opt.id}
                            className={`flex items-start gap-3 px-5 py-3 rounded-2xl border text-sm font-medium transition-all ${
                              opt.is_correct
                                ? "bg-green/10 border-green/30 text-green"
                                : "bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 text-dark-blue dark:text-white opacity-70"
                            }`}
                          >
                            <span
                              className={`size-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border-2 ${
                                opt.is_correct
                                  ? "bg-green text-white border-green"
                                  : "bg-white dark:bg-navy-blue border-gray-200 dark:border-white/10 text-primary"
                              }`}
                            >
                              {String.fromCharCode(65 + i)}
                            </span>
                            {opt.text ? (
                              <span
                                className="flex-1 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: renderMathInHTML(opt.text) }}
                              />
                            ) : (
                              <span className="flex-1 opacity-30 italic">
                                Chưa nhập đáp án {String.fromCharCode(65 + i)}...
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {watchSolution?.trim() && (
                        <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest opacity-60 flex items-center gap-1">
                            <Sparkles className="size-3" /> Hướng dẫn giải
                          </p>
                          <div
                            className="text-sm text-dark-blue dark:text-white leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: renderMathInHTML(watchSolution) }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="p-5 rounded-3xl bg-primary/5 dark:bg-white/5 border border-primary/10 space-y-2">
                      <h4 className="text-[10px] font-black text-primary uppercase tracking-widest opacity-60">
                        💡 Hướng dẫn soạn thảo
                      </h4>
                      <div className="text-xs text-gray-navy leading-relaxed space-y-1.5 opacity-80">
                        <p><strong>Toán LaTeX:</strong> <code className="bg-white dark:bg-white/10 px-1 py-0.5 rounded text-primary">$a^2+b^2=c^2$</code></p>
                        <p><strong>In đậm:</strong> <code className="bg-white dark:bg-white/10 px-1 py-0.5 rounded text-primary">**chữ đậm**</code></p>
                        <p><strong>Tiêu đề:</strong> <code className="bg-white dark:bg-white/10 px-1 py-0.5 rounded text-primary">## Tiêu đề</code></p>
                        <p><strong>Danh sách:</strong> <code className="bg-white dark:bg-white/10 px-1 py-0.5 rounded text-primary">- mục 1</code></p>
                        <p><strong>Ảnh:</strong> Dán <kbd className="bg-white dark:bg-white/10 px-1 py-0.5 rounded shadow-sm">Ctrl+V</kbd> trực tiếp</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-gray-100 dark:border-white/10 flex items-center justify-end gap-4 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="py-6 px-8 rounded-2xl font-bold"
            >
              Hủy bỏ
            </Button>
            <Button
              form="question-form"
              type="submit"
              disabled={isPending}
              className="py-6 px-12 rounded-2xl bg-primary text-white font-bold flex items-center gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              {isPending ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 className="size-5" />}
              {initialData ? "Cập nhật câu hỏi" : "Lưu câu hỏi"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Named re-export for compatibility
export { QuestionEditorModal };
