"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LessonSchema, type Lesson, type Module } from "../types";
import { z } from "zod";

export const LessonFormSchema = LessonSchema.omit({ id: true, content_md: true }).extend({
  content_md: z.string().optional(),
});
export type LessonFormInput = z.infer<typeof LessonFormSchema>;

interface LessonFormProps {
  initialData?: Lesson;
  modules: Module[];
  onSubmit: (data: LessonFormInput) => void | Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

export function LessonForm({ initialData, modules, onSubmit, onCancel, isPending }: LessonFormProps) {
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LessonFormInput>({
    resolver: zodResolver(LessonFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      order: initialData?.order || 1,
      slug: initialData?.slug || "",
      content_md: initialData?.content_md || "",
      module_id: initialData?.module_id || null,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-left">
      <div className="space-y-2">
        <label className="text-xs font-black text-gray-navy dark:text-light-blue/80 opacity-50 dark:opacity-100 uppercase tracking-widest px-1">
          Tên bài học
        </label>
        <input
          autoFocus
          placeholder="Ví dụ: Giải tích 1 - Đạo hàm"
          {...register("name")}
          className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-primary outline-none transition-all font-medium text-dark-blue dark:text-white"
        />
        {errors.name && (
          <p className="text-red-500 text-xs font-bold px-1">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black text-gray-navy dark:text-light-blue/80 opacity-50 dark:opacity-100 uppercase tracking-widest px-1">
          Nội dung bài học (Markdown)
        </label>
        <textarea
          placeholder="Viết nội dung lý thuyết của bài học bằng Markdown..."
          rows={14}
          {...register("content_md")}
          className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-primary outline-none transition-all font-mono text-sm resize-y text-dark-blue dark:text-white"
        />
        <p className="text-[11px] text-gray-navy/60 dark:text-light-blue/50 px-1">
          Nội dung này được lưu trực tiếp trong hệ thống và dùng để tạo chỉ mục tìm kiếm bài học liên quan.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black text-gray-navy dark:text-light-blue/80 opacity-50 dark:opacity-100 uppercase tracking-widest px-1">
          Mô tả ngắn
        </label>
        <textarea
          placeholder="Mô tả nội dung trọng tâm của bài học..."
          rows={3}
          {...register("description")}
          className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-primary outline-none transition-all font-medium resize-none text-dark-blue dark:text-white"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black text-gray-navy dark:text-light-blue/80 opacity-50 dark:opacity-100 uppercase tracking-widest px-1">
          Blog Slug
        </label>
        <input
          placeholder="Ví dụ: batch-normalization-6"
          {...register("slug")}
          className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-primary outline-none transition-all font-medium text-dark-blue dark:text-white"
        />
        {errors.slug && (
          <p className="text-red-500 text-xs font-bold px-1">{errors.slug.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-navy dark:text-light-blue/80 opacity-50 dark:opacity-100 uppercase tracking-widest px-1">
            Chương (Module)
          </label>
          <div className="relative">
            <select
              {...register("module_id")}
              className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-primary outline-none transition-all font-bold text-dark-blue dark:text-white appearance-none"
            >
              <option value="">-- Chưa phân loại --</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  Chương {m.order}: {m.name}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
          {errors.module_id && (
            <p className="text-red-500 text-xs font-bold px-1">{errors.module_id.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-navy dark:text-light-blue/80 opacity-50 dark:opacity-100 uppercase tracking-widest px-1 flex items-center justify-between">
            <span>Thứ tự</span>
            <span className="text-[10px] font-medium opacity-60 normal-case tracking-normal flex items-center gap-1">
              <BookOpen className="size-3" /> Học phần chính
            </span>
          </label>
          <input
            type="number"
            {...register("order", { valueAsNumber: true })}
            className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-primary outline-none transition-all font-bold text-dark-blue dark:text-white text-lg"
          />
          {errors.order && (
            <p className="text-red-500 text-xs font-bold px-1">{errors.order.message}</p>
          )}
        </div>
      </div>

      <div className="pt-4 flex gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="flex-1 py-6 rounded-2xl font-bold dark:text-white dark:hover:bg-white/10"
        >
          Hủy
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="flex-[2] px-10 py-6 rounded-2xl bg-primary text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
        >
          {isPending ? (
            <div className="size-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {isEdit ? "Cập nhật" : "Tạo ngay"}
        </Button>
      </div>
    </form>
  );
}
