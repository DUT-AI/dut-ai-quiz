"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ModuleSchema, type Module } from "../types";
import { z } from "zod";

export const ModuleFormSchema = ModuleSchema.omit({ id: true, lessons: true });
export type ModuleFormInput = z.infer<typeof ModuleFormSchema>;

interface ModuleFormProps {
  initialData?: Module;
  onSubmit: (data: ModuleFormInput) => void | Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

export function ModuleForm({ initialData, onSubmit, onCancel, isPending }: ModuleFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ModuleFormInput>({
    resolver: zodResolver(ModuleFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      order: initialData?.order || 1,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-left">
      <div className="space-y-2">
        <label className="text-xs font-black text-gray-navy dark:text-light-blue/80 opacity-50 dark:opacity-100 uppercase tracking-widest px-1">
          Tên chương (Module)
        </label>
        <input
          autoFocus
          placeholder="Ví dụ: Chương 1: Cơ sở dữ liệu"
          {...register("name")}
          className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-primary outline-none transition-all font-bold text-dark-blue dark:text-white text-lg"
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
          placeholder="Giới thiệu về nội dung chương..."
          {...register("description")}
          rows={3}
          className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-primary outline-none transition-all font-medium text-dark-blue dark:text-white resize-none"
        />
        {errors.description && (
          <p className="text-red-500 text-xs font-bold px-1">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2 max-w-[200px]">
        <label className="text-xs font-black text-gray-navy dark:text-light-blue/80 opacity-50 dark:opacity-100 uppercase tracking-widest px-1">
          Thứ tự
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

      <div className="pt-4 flex gap-3">
        <Button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          variant="outline"
          className="flex-1 rounded-2xl py-6 font-bold text-gray-navy/70 border-gray-100 dark:border-white/5 dark:text-white/50"
        >
          Hủy
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-2xl py-6 font-bold bg-primary text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          {isPending ? "Đang xử lý..." : (initialData ? "Cập nhật" : "Tạo chương")}
        </Button>
      </div>
    </form>
  );
}
