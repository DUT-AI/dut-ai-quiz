"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useCreateLesson, useUpdateLesson } from "@/lib/queries";
import { type Lesson } from "../types";
import { LessonForm, type LessonFormInput } from "./lesson-form";

interface LessonFormModalProps {
  onClose: () => void;
  initialData?: Lesson;
}

export function LessonFormModal({ onClose, initialData }: LessonFormModalProps) {
  const createMut = useCreateLesson();
  const updateMut = useUpdateLesson(initialData?.id || "");

  const isEdit = !!initialData;

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
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
        className="bg-white dark:bg-navy-blue w-full max-w-lg max-h-[calc(100vh-2rem)] md:max-h-[85vh] rounded-[24px] md:rounded-[40px] shadow-2xl relative z-10 flex flex-col overflow-hidden border border-gray-100 dark:border-white/10 m-4"
      >
        {/* Header - Fixed */}
        <div className="p-6 pb-4 md:p-10 md:pb-6 flex items-center justify-between border-b border-gray-100 dark:border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-8 md:size-10 rounded-xl md:rounded-2xl bg-primary flex items-center justify-center text-white shrink-0">
              <Plus className="size-4 md:size-5" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-dark-blue dark:text-white leading-tight">
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
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shrink-0">
            <X className="size-5 md:size-6 text-gray-navy dark:text-light-blue/70" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <div className="p-6 md:p-10 overflow-y-auto flex-1 custom-scrollbar">
          <LessonForm
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onClose}
            isPending={isPending}
          />
        </div>
      </motion.div>
    </div>
  );
}
