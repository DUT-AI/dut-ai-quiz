"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Plus, X, Calendar, Sparkles, Users, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateHackathon, useUpdateHackathon } from "@/lib/queries";
import { type Hackathon } from "../types";
import { z } from "zod";
import { cn, formatToLocalDatetime } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const HackathonFormSchema = z.object({
  name: z.string().min(1, "Tên hackathon không được để trống"),
  description: z.string().optional(),
  rules: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  participation_mode: z.enum(["individual", "team", "both"]),
});

type HackathonFormInput = z.infer<typeof HackathonFormSchema>;

interface HackathonFormModalProps {
  onClose: () => void;
  initialData?: Hackathon;
}

export function HackathonFormModal({ onClose, initialData }: HackathonFormModalProps) {
  const createMut = useCreateHackathon();
  const updateMut = useUpdateHackathon(initialData?.id || "");

  const isEdit = !!initialData;

  const [step, setStep] = React.useState<1 | 2>(1);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<HackathonFormInput>({
    resolver: zodResolver(HackathonFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      rules: initialData?.rules || "",
      start_time: formatToLocalDatetime(initialData?.start_time),
      end_time: formatToLocalDatetime(initialData?.end_time),
      participation_mode: initialData?.participation_mode || "both",
    },
  });

  const rulesContent = watch("rules") || "";

  const handleNextStep = async () => {
    const isStep1Valid = await trigger(["name", "participation_mode", "start_time", "end_time"]);
    if (isStep1Valid) {
      setStep(2);
    }
  };

  const onSubmit = async (data: HackathonFormInput) => {
    const payload = {
      name: data.name,
      description: data.description || "",
      rules: data.rules || "",
      start_time: data.start_time ? new Date(data.start_time).toISOString() : null,
      end_time: data.end_time ? new Date(data.end_time).toISOString() : null,
      participation_mode: data.participation_mode,
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-navy-blue w-full max-w-4xl rounded-[40px] shadow-2xl relative z-10 my-8 overflow-hidden border border-white/10"
      >
        <div className="p-8 md:p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-primary flex items-center justify-center text-white shrink-0">
                <Plus className="size-5" />
              </div>
              <h2 className="text-2xl font-bold text-dark-blue dark:text-white truncate">
                {isEdit ? (
                  <>
                    Sửa <span className="text-primary">Hackathon</span>
                  </>
                ) : (
                  <>
                    Thêm <span className="text-primary">Hackathon mới</span>
                  </>
                )}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shrink-0">
              <X className="size-6 text-gray-navy" />
            </button>
          </div>

          {/* Progress Steps Indicators */}
          <div className="flex items-center gap-4 mb-8 px-1 select-none">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <span className={cn(
                "size-6 rounded-full flex items-center justify-center text-xs font-black transition-colors",
                step === 1 ? "bg-primary text-white" : "bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white"
              )}>
                1
              </span>
              <span className={cn(
                "text-xs font-bold transition-opacity",
                step === 1 ? "opacity-100 text-dark-blue dark:text-white" : "opacity-50 text-gray-navy group-hover:opacity-100"
              )}>
                Thông tin chung
              </span>
            </button>
            
            <div className="h-[2px] flex-1 bg-gray-150 dark:bg-white/10" />
            
            <button
              type="button"
              onClick={handleNextStep}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <span className={cn(
                "size-6 rounded-full flex items-center justify-center text-xs font-black transition-colors",
                step === 2 ? "bg-primary text-white" : "bg-gray-150 dark:bg-white/5 text-gray-navy group-hover:bg-primary group-hover:text-white"
              )}>
                2
              </span>
              <span className={cn(
                "text-xs font-bold transition-opacity",
                step === 2 ? "opacity-100 text-dark-blue dark:text-white" : "opacity-50 text-gray-navy group-hover:opacity-100"
              )}>
                Luật thi đấu (Markdown)
              </span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-left">
            {step === 1 ? (
              <div className="space-y-5">
                {/* Tên hackathon */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-navy opacity-55 uppercase tracking-widest px-1">
                    Tên hackathon
                  </label>
                  <input
                    autoFocus
                    placeholder="Ví dụ: DUT AI Hackathon 2026"
                    {...register("name")}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-primary outline-none transition-all font-medium"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs font-bold px-1 mt-1">{errors.name.message}</p>
                  )}
                </div>

                {/* Mô tả */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-navy opacity-55 uppercase tracking-widest px-1">
                    Mô tả
                  </label>
                  <textarea
                    placeholder="Mô tả mục tiêu, chủ đề của cuộc thi..."
                    rows={5}
                    {...register("description")}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-primary outline-none transition-all font-medium resize-none"
                  />
                </div>

                {/* Hình thức & Thời gian */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Hình thức tham gia */}
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="text-xs font-black text-gray-navy opacity-55 uppercase tracking-widest px-1">
                      Hình thức tham gia
                    </label>
                    <div className="relative">
                      <select
                        {...register("participation_mode")}
                        className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-primary outline-none transition-all font-medium appearance-none cursor-pointer"
                      >
                        <option value="both" className="dark:bg-navy-blue">Cả hai</option>
                        <option value="individual" className="dark:bg-navy-blue">Cá nhân</option>
                        <option value="team" className="dark:bg-navy-blue">Đội nhóm</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-navy opacity-60">
                        <Users className="size-4" />
                      </div>
                    </div>
                  </div>

                  {/* Bắt đầu */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-navy opacity-55 uppercase tracking-widest px-1">
                      Thời gian Bắt đầu
                    </label>
                    <input
                      type="datetime-local"
                      {...register("start_time")}
                      className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-primary outline-none transition-all font-medium text-sm"
                    />
                  </div>

                  {/* Kết thúc */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-navy opacity-55 uppercase tracking-widest px-1">
                      Thời gian Kết thúc
                    </label>
                    <input
                      type="datetime-local"
                      {...register("end_time")}
                      className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-primary outline-none transition-all font-medium text-sm"
                    />
                  </div>
                </div>

                {/* Step 1 Actions */}
                <div className="pt-4 flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    className="flex-1 py-5 rounded-2xl font-bold"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 px-8 py-5 rounded-2xl bg-primary text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
                  >
                    <span>Kế tiếp</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* 2 cột song song (Soạn thảo & Preview) */}
                <div className="flex flex-col md:flex-row gap-6 w-full">
                  {/* Cột trái: Textarea soạn thảo */}
                  <div className="flex-1 space-y-1.5 text-left">
                    <label className="text-xs font-black text-gray-navy opacity-55 uppercase tracking-widest px-1">
                      Luật thi đấu (Markdown)
                    </label>
                    <textarea
                      placeholder="Hỗ trợ định dạng Markdown (Ví dụ: # Quy định, * Điểm số, v.v.)..."
                      {...register("rules")}
                      className="w-full h-[350px] px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:border-primary outline-none transition-all font-medium resize-none custom-scrollbar"
                    />
                  </div>

                  {/* Cột phải: Khung hiển thị preview */}
                  <div className="flex-1 space-y-1.5 text-left flex flex-col">
                    <label className="text-xs font-black text-gray-navy opacity-55 uppercase tracking-widest px-1">
                      Xem trước (Preview)
                    </label>
                    <div className="w-full h-[350px] px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 overflow-y-auto custom-scrollbar text-sm prose dark:prose-invert max-w-none break-words">
                      {rulesContent ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {rulesContent}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-gray-navy opacity-50 italic py-4">Nội dung xem trước sẽ hiển thị ở đây...</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 2 Actions */}
                <div className="pt-4 flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(1)}
                    className="flex-1 py-5 rounded-2xl font-bold flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="size-4" />
                    <span>Quay lại</span>
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="flex-2 px-8 py-5 rounded-2xl bg-primary text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
                  >
                    {isPending ? (
                      <div className="size-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    <span>{isEdit ? "Cập nhật" : "Tạo ngay"}</span>
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}
