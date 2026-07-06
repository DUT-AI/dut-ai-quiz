"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Calendar, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateHackathon } from "@/lib/queries";
import { type Hackathon } from "../types";
import { z } from "zod";
import { cn, formatToLocalDatetime } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const HackathonFormSchema = z.object({
  name: z.string().min(1, "Tên hackathon không được để trống"),
  description: z.string().optional(),
  rules: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  participation_mode: z.enum(["individual", "team", "both"]),
  max_team_members: z.number().min(1, "Số lượng thành viên tối thiểu là 1"),
});

type HackathonFormInput = z.infer<typeof HackathonFormSchema>;

interface HackathonEditTabProps {
  hackathon: Hackathon;
}

export function HackathonEditTab({ hackathon }: HackathonEditTabProps) {
  const updateMut = useUpdateHackathon(hackathon.id);
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<HackathonFormInput>({
    resolver: zodResolver(HackathonFormSchema),
    defaultValues: {
      name: hackathon.name,
      description: hackathon.description || "",
      rules: hackathon.rules || "",
      start_time: formatToLocalDatetime(hackathon.start_time),
      end_time: formatToLocalDatetime(hackathon.end_time),
      participation_mode: hackathon.participation_mode,
      max_team_members: hackathon.max_team_members ?? 5,
    },
  });

  const rulesContent = watch("rules") || "";

  const onSubmit = async (data: HackathonFormInput) => {
    const payload = {
      name: data.name,
      description: data.description || "",
      rules: data.rules || "",
      start_time: data.start_time ? new Date(data.start_time).toISOString() : null,
      end_time: data.end_time ? new Date(data.end_time).toISOString() : null,
      participation_mode: data.participation_mode,
      max_team_members: Number(data.max_team_members) || 5,
    };

    try {
      await updateMut.mutateAsync(payload);
      toast.success("Cập nhật thông tin Hackathon thành công!");
    } catch {
      // ignore
    }
  };

  const isPending = updateMut.isPending;

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
        <div>
          <h3 className="text-lg font-black text-navy-blue dark:text-white leading-tight">
            Chỉnh sửa Thiết lập Hackathon
          </h3>
          <p className="text-xs text-gray-navy/70 dark:text-light-blue/60 mt-1">
            Điều chỉnh thời gian, thể lệ thi đấu và thiết lập đội nhóm.
          </p>
        </div>

        {/* Tab switcher for Rules markdown */}
        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab("edit")}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
              tab === "edit"
                ? "bg-white dark:bg-navy-blue text-primary shadow-sm"
                : "text-gray-navy dark:text-light-blue/70 hover:text-navy-blue dark:hover:text-white"
            )}
          >
            Chỉnh sửa
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
              tab === "preview"
                ? "bg-white dark:bg-navy-blue text-primary shadow-sm"
                : "text-gray-navy dark:text-light-blue/70 hover:text-navy-blue dark:hover:text-white"
            )}
          >
            Xem thể lệ (Markdown)
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "preview" ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-6 rounded-3xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01] min-h-[400px] prose dark:prose-invert max-w-none"
          >
            {rulesContent ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{rulesContent}</ReactMarkdown>
            ) : (
              <p className="text-gray-navy/50 dark:text-light-blue/40 italic">Chưa nhập thể lệ thi đấu.</p>
            )}
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tên Hackathon */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-gray-navy dark:text-light-blue/70 uppercase tracking-wider block">
                  Tên Hackathon *
                </label>
                <input
                  type="text"
                  {...register("name")}
                  placeholder="Nhập tên giải đấu..."
                  className={cn(
                    "w-full px-4 py-3 rounded-2xl border bg-transparent text-sm focus:outline-none focus:border-primary text-navy-blue dark:text-white",
                    errors.name ? "border-red" : "border-gray-200 dark:border-white/10"
                  )}
                />
                {errors.name && (
                  <span className="text-xs font-bold text-red">{errors.name.message}</span>
                )}
              </div>

              {/* Hình thức tham gia */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-navy dark:text-light-blue/70 uppercase tracking-wider block">
                  Hình thức tham gia
                </label>
                <div className="relative">
                  <Users className="absolute left-4 top-3.5 size-4 text-gray-navy dark:text-light-blue/60" />
                  <select
                    {...register("participation_mode")}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-primary text-navy-blue dark:bg-navy-blue dark:text-white"
                  >
                    <option value="both">Cá nhân & Đội nhóm (Tự chọn)</option>
                    <option value="individual">Chỉ Cá nhân</option>
                    <option value="team">Chỉ Đội nhóm</option>
                  </select>
                </div>
              </div>

              {/* Số lượng thành viên tối đa */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-navy dark:text-light-blue/70 uppercase tracking-wider block">
                  Số lượng thành viên tối đa / Đội
                </label>
                <input
                  type="number"
                  min={1}
                  {...register("max_team_members", { valueAsNumber: true })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-primary text-navy-blue dark:text-white"
                />
              </div>

              {/* Thời gian bắt đầu */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-navy dark:text-light-blue/70 uppercase tracking-wider block">
                  Thời gian Bắt đầu đăng ký
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3.5 size-4 text-gray-navy dark:text-light-blue/60" />
                  <input
                    type="datetime-local"
                    {...register("start_time")}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-primary text-navy-blue dark:text-white"
                  />
                </div>
              </div>

              {/* Thời gian kết thúc */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-navy dark:text-light-blue/70 uppercase tracking-wider block">
                  Thời gian Kết thúc đăng ký
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3.5 size-4 text-gray-navy dark:text-light-blue/60" />
                  <input
                    type="datetime-local"
                    {...register("end_time")}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-primary text-navy-blue dark:text-white"
                  />
                </div>
              </div>

              {/* Mô tả ngắn */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-gray-navy dark:text-light-blue/70 uppercase tracking-wider block">
                  Mô tả ngắn
                </label>
                <textarea
                  {...register("description")}
                  placeholder="Mô tả tóm tắt về giải đấu..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-primary text-navy-blue dark:text-white"
                />
              </div>

              {/* Thể lệ thi đấu */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="size-4 text-primary" />
                  <label className="text-xs font-black text-gray-navy dark:text-light-blue/70 uppercase tracking-wider block">
                    Thể lệ & Luật thi đấu (Markdown)
                  </label>
                </div>
                <textarea
                  {...register("rules")}
                  placeholder="Soạn thảo thể lệ cuộc thi, các mốc thời gian, cách tính điểm..."
                  rows={10}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-primary text-navy-blue dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-white/5">
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-xl px-8 py-5 bg-primary text-white font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/95"
              >
                <Save className="size-4" />
                <span>{isPending ? "Đang lưu..." : "Lưu thiết lập"}</span>
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
