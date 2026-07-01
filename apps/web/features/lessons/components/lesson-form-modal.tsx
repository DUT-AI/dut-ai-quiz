"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Plus, X, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateLesson, useUpdateLesson } from "@/lib/queries";
import { LessonSchema, type Lesson } from "../types";
import { z } from "zod";

const LessonFormSchema = LessonSchema.omit({ id: true });
type LessonFormInput = z.infer<typeof LessonFormSchema>;

interface LessonFormModalProps {
  onClose: () => void;
  initialData?: Lesson;
}

export function LessonFormModal({ onClose, initialData }: LessonFormModalProps) {
  const createMut = useCreateLesson();
  const updateMut = useUpdateLesson(initialData?.id || "");

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

  const onSubmit = async (data: LessonFormInput) => {
    const payload = {
      name: data.name,
      description: data.description || "",
      order: data.order,
      slug: data.slug || "",
    };

    if (isEdit) {
      await updateMut.mutateAsync(payload);
    } else {
      await createMut.mutateAsync(payload);
    }
    onClose();
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-navy-blue w-full max-w-lg rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-white/10"
      >
        <div className="p-8 md:p-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-primary flex items-center justify-center text-white">
                <Plus className="size-5" />
              </div>
              <h2 className="text-2xl font-bold text-dark-blue dark:text-white">
                {isEdit ? (
                  <>
                    Sửa <span className="text-primary">Bài học</span>
                  </>
                ) : (
                  <>
                    Thêm <span className="text-primary">Bài học mới</span>
                  </>
                )}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <X className="size-6 text-gray-navy" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-left">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-navy opacity-50 uppercase tracking-widest px-1">
                Tên bài học
              </label>
              <input
                autoFocus
                placeholder="Ví dụ: Giải tích 1 - Đạo hàm"
                {...register("name")}
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-primary outline-none transition-all font-medium"
              />
              {errors.name && (
                <p className="text-red-500 text-xs font-bold px-1">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-navy opacity-50 uppercase tracking-widest px-1">
                Mô tả ngắn
              </label>
              <textarea
                placeholder="Mô tả nội dung trọng tâm của bài học..."
                rows={3}
                {...register("description")}
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-primary outline-none transition-all font-medium resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-navy opacity-50 uppercase tracking-widest px-1">
                Blog Slug
              </label>
              <input
                placeholder="Ví dụ: batch-normalization-6"
                {...register("slug")}
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-primary outline-none transition-all font-medium"
              />
              {errors.slug && (
                <p className="text-red-500 text-xs font-bold px-1">{errors.slug.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-navy opacity-50 uppercase tracking-widest px-1">
                  Thứ tự
                </label>
                <input
                  type="number"
                  {...register("order", { valueAsNumber: true })}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-primary outline-none transition-all font-medium"
                />
                {errors.order && (
                  <p className="text-red-500 text-xs font-bold px-1">{errors.order.message}</p>
                )}
              </div>
              <div className="flex flex-col justify-end">
                <div className="flex items-center gap-2 p-4 text-xs font-bold text-gray-navy opacity-40">
                  <BookOpen className="size-4" />
                  Học phần chính
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="flex-1 py-6 rounded-2xl font-bold"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-2 px-10 py-6 rounded-2xl bg-primary text-white font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
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
        </div>
      </motion.div>
    </div>
  );
}
