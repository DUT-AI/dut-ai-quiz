"use client";

import React from "react";
import { FileArchive, Loader2, Sparkles } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { type Module, type LessonEditorInput } from "../../types";

interface LessonInfoStepProps {
  methods: UseFormReturn<LessonEditorInput>;
  modules: Module[];
  isPendingImport: boolean;
  onImportNotionZip: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function LessonInfoStep({
  methods,
  modules,
  isPendingImport,
  onImportNotionZip,
}: LessonInfoStepProps) {
  const {
    register,
    formState: { errors },
  } = methods;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Notion Import Box */}
      <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-white/5 dark:to-white/5 p-6 rounded-3xl border border-blue-100/50 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-dark-blue dark:text-white leading-none">
              Nhập bài học nhanh từ Notion
            </h3>
            <p className="text-xs text-gray-navy dark:text-light-blue/70 font-bold tracking-wide mt-1">
              Tải lên tệp zip xuất từ Notion để tự động tạo bài học và đính kèm hình ảnh.
            </p>
          </div>
        </div>

        <div>
          <label
            className={`cursor-pointer py-2.5 px-5 rounded-2xl bg-primary text-white font-bold text-xs flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 ${
              isPendingImport ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            {isPendingImport ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileArchive className="size-4" />
            )}
            {isPendingImport ? "Đang xử lý..." : "Chọn tệp ZIP Notion"}
            <input
              type="file"
              className="hidden"
              accept=".zip"
              disabled={isPendingImport}
              onChange={onImportNotionZip}
            />
          </label>
        </div>
      </div>

      <div className="bg-gray-50/50 dark:bg-white/5 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-white/5 space-y-6">
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
    </div>
  );
}
