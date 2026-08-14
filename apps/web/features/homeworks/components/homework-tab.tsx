"use client";

import { motion } from "framer-motion";
import { 
  BookOpen, 
  CheckCircle2, 
  FileCode, 
  GraduationCap, 
  LayoutList,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { useMyHomeworks, useSubmitHomework } from "../queries";
import { HomeworkCard } from "./homework-card";

export function HomeworkTab({ lessonId }: { lessonId: string }) {
  const { data, isLoading, error } = useMyHomeworks(lessonId || null);
  const submit = useSubmitHomework();

  const handleSubmit = async (homeworkId: string, file: File) => {
    try {
      await submit.mutateAsync({ homeworkId, file });
      toast.info("Đã nhận file. Hệ thống đang kiểm tra và chấm điểm.");
    } catch (submissionError) {
      const msg = submissionError instanceof Error ? submissionError.message : "Nộp bài thất bại";
      toast.error(msg);
      throw submissionError;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg className="h-10 w-10 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="mt-4 text-sm font-semibold text-gray-navy dark:text-light-blue animate-pulse">
          Đang tải bài tập coding...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red/20 bg-red/5 p-6 text-center text-red">
        Không thể tải bài tập coding của bài học. Vui lòng thử lại sau.
      </div>
    );
  }

  if (!data?.data.length) {
    return (
      <Card className="border-dashed border-gray-200 dark:border-white/10 dark:bg-navy-blue/20">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-navy mb-4">
            <FileCode className="h-6 w-6" />
          </div>
          <p className="font-bold text-dark-blue dark:text-white">Chưa có bài tập coding</p>
          <p className="mt-1 text-sm text-gray-navy dark:text-light-blue/70">
            Bài học này chưa có bài tập coding dành cho bạn.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics for the dashboard
  const totalHomeworks = data.data.length;
  const submittedHomeworks = data.data.filter(
    h => h.current_submission && h.current_submission.status !== "FAILED"
  ).length;
  const gradedHomeworks = data.data.filter(
    h => h.current_submission?.status === "GRADED" && typeof h.current_submission.score === "number"
  );
  const avgScore = gradedHomeworks.length > 0
    ? (gradedHomeworks.reduce((sum, h) => sum + (h.current_submission!.score || 0), 0) / gradedHomeworks.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-6">
      {/* Student Homeworks Mini-Dashboard */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Metric 1: Total assigned */}
        <Card className="border border-gray-150 bg-white shadow-sm dark:border-white/5 dark:bg-navy-blue/30 backdrop-blur-sm">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LayoutList className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-navy dark:text-light-blue">Đã giao</p>
              <h3 className="text-xl font-black text-dark-blue dark:text-white">
                {totalHomeworks} <span className="text-xs font-normal text-gray-navy">bài tập</span>
              </h3>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Completed / Submitted */}
        <Card className="border border-gray-150 bg-white shadow-sm dark:border-white/5 dark:bg-navy-blue/30 backdrop-blur-sm">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green/10 text-green">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-navy dark:text-light-blue">Đã nộp bài</p>
              <h3 className="text-xl font-black text-dark-blue dark:text-white">
                {submittedHomeworks}/{totalHomeworks} <span className="text-xs font-normal text-gray-navy">hoàn thành</span>
              </h3>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Avg Score */}
        <Card className="border border-gray-150 bg-white shadow-sm dark:border-white/5 dark:bg-navy-blue/30 backdrop-blur-sm">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-navy dark:text-light-blue">Điểm trung bình</p>
              <h3 className="text-xl font-black text-dark-blue dark:text-white">
                {avgScore} <span className="text-xs font-normal text-gray-navy">/ 10</span>
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Homework Cards List */}
      <div className="grid gap-6">
        {data.data.map((homework, idx) => (
          <motion.div
            key={homework.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
          >
            <HomeworkCard
              homework={homework}
              onSubmit={handleSubmit}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
