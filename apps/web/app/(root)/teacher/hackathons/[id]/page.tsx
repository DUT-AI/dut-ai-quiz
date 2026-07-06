"use client";

import React, { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useHackathon, useDeleteHackathon } from "@/features/hackathons/queries";
import {
  HackathonTasksTab,
  HackathonRegistrationsTab,
  HackathonEditTab,
} from "@/features/hackathons/components";
import {
  ArrowLeft,
  FileCode,
  Users,
  Pencil,
  Trash2,
  Calendar,
  Award,
} from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function TeacherHackathonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hackathonId = params?.id as string;

  const { data: hackathon, isLoading, error } = useHackathon(hackathonId);
  const deleteMutation = useDeleteHackathon();

  const tabParam = searchParams?.get("tab");
  const initialTab = (tabParam === "registrations" || tabParam === "edit") ? tabParam : "tasks";
  const [activeTab, setActiveTab] = useState<"tasks" | "registrations" | "edit">(initialTab);

  const handleDelete = async () => {
    if (!hackathon) return;
    if (
      confirm(
        `Bạn có chắc chắn muốn xoá hackathon "${hackathon.name}"? Hành động này sẽ xoá toàn bộ đề bài và đơn đăng ký liên quan.`
      )
    ) {
      try {
        await deleteMutation.mutateAsync(hackathon.id);
        toast.success("Xoá hackathon thành công!");
        router.push("/teacher/hackathons");
      } catch {
        // ignore
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-sm text-gray-navy/70 space-y-3">
        <div className="size-8 border-4 border-primary border-t-transparent animate-spin rounded-full" />
        <span className="font-bold">Đang tải thông tin giải đấu...</span>
      </div>
    );
  }

  if (error || !hackathon) {
    return (
      <div className="text-left py-10 space-y-4 max-w-xl">
        <div className="p-5 rounded-3xl bg-red/10 border border-red/10 text-red font-bold text-sm">
          {error instanceof Error ? error.message : "Không tìm thấy thông tin Hackathon này."}
        </div>
        <Button
          onClick={() => router.push("/teacher/hackathons")}
          className="rounded-2xl flex items-center gap-2"
        >
          <ArrowLeft className="size-4" />
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back & Breadcrumb with entry animation */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex items-center justify-between"
      >
        <button
          onClick={() => router.push("/teacher/hackathons")}
          className="group flex items-center gap-2 text-xs font-black text-gray-navy hover:text-navy-blue dark:text-light-blue/70 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Quản lý Hackathons</span>
        </button>
      </motion.div>

      {/* Main Header / Banner Info with slide-down entry */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="rounded-[2.5rem] bg-white dark:bg-navy-blue border border-gray-100 dark:border-white/5 p-8 md:p-10 shadow-sm relative overflow-hidden text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-dark-blue dark:text-white">
              {hackathon.name}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
              <Award className="size-3.5" />
              Quản trị viên
            </span>
          </div>

          <p className="text-sm text-gray-navy dark:text-light-blue opacity-75 max-w-3xl leading-relaxed">
            {hackathon.description || "Chưa cập nhật mô tả ngắn cho giải đấu này."}
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-gray-navy dark:text-light-blue opacity-60">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4 text-primary" />
              <span>
                {formatDateTime(hackathon.start_time)} - {formatDateTime(hackathon.end_time)}
              </span>
            </div>
            <div>
              Hình thức:{" "}
              {hackathon.participation_mode === "both"
                ? "Cá nhân & Đội nhóm"
                : hackathon.participation_mode === "team"
                ? "Đội nhóm"
                : "Cá nhân"}
            </div>
          </div>
        </div>

        {/* Nút xóa trên Header */}
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="flex items-center gap-2 text-xs px-5 py-3 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition font-black border border-destructive/10 hover:border-transparent shrink-0 cursor-pointer self-end md:self-center"
        >
          <Trash2 className="size-4" />
          <span>{deleteMutation.isPending ? "Đang xoá..." : "Xoá giải đấu"}</span>
        </button>
      </motion.div>

      {/* Tab Selector Navigation using Shadcn Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
        <TabsList>
          <TabsTrigger value="tasks">
            <FileCode className="size-4" />
            <span>Đề bài</span>
          </TabsTrigger>
          <TabsTrigger value="registrations">
            <Users className="size-4" />
            <span>Đăng ký</span>
          </TabsTrigger>
          <TabsTrigger value="edit">
            <Pencil className="size-4" />
            <span>Sửa</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <HackathonTasksTab hackathon={hackathon} />
          </motion.div>
        </TabsContent>
        <TabsContent value="registrations">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <HackathonRegistrationsTab hackathon={hackathon} />
          </motion.div>
        </TabsContent>
        <TabsContent value="edit">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <HackathonEditTab hackathon={hackathon} />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
