"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LessonSchema, type Lesson } from "../types";
import { z } from "zod";

export const LessonFormSchema = LessonSchema.omit({ id: true });
export type LessonFormInput = z.infer<typeof LessonFormSchema>;

interface LessonFormProps {
  initialData?: Lesson;
  onSubmit: (data: LessonFormInput) => void | Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

export function LessonForm({ initialData, onSubmit, onCancel, isPending }: LessonFormProps) {
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-navy dark:text-light-blue/80 opacity-50 dark:opacity-100 uppercase tracking-widest px-1">
            Thứ tự
          </label>
          <input
            type="number"
            {...register("order", { valueAsNumber: true })}
            className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-primary outline-none transition-all font-medium text-dark-blue dark:text-white"
          />
          {errors.order && (
            <p className="text-red-500 text-xs font-bold px-1">{errors.order.message}</p>
          )}
        </div>
        <div className="flex flex-col justify-end">
          <div className="flex items-center gap-2 p-4 text-xs font-bold text-gray-navy dark:text-light-blue/70 opacity-40 dark:opacity-100">
            <BookOpen className="size-4" />
            Học phần chính
          </div>
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
