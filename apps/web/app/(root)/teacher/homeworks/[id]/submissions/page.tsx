"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpenCheck, GraduationCap, ChevronDown } from "lucide-react";
import { useHomeworks, useHomeworkSubmissions } from "@/features/homeworks/queries";
import { SubmissionsStats } from "@/features/homeworks/components/submissions-stats";
import { SubmissionsList } from "@/features/homeworks/components/submissions-list";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/markdown";

export default function TeacherHomeworkSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const homeworkId = params?.id as string;
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const { data: homeworksData, isLoading: isLoadingHomeworks, error: homeworksError } = useHomeworks();
  const { data: submissionsData, isLoading: isLoadingSubmissions } = useHomeworkSubmissions(homeworkId);

  // Find corresponding homework details
  const homework = useMemo(() => {
    if (!homeworksData?.data) return null;
    return homeworksData.data.find((h) => h.id === homeworkId) || null;
  }, [homeworksData, homeworkId]);

  const submissions = useMemo(() => {
    return submissionsData?.data || [];
  }, [submissionsData]);

  const isLoading = isLoadingHomeworks || isLoadingSubmissions;
  const hasError = homeworksError || (!isLoadingHomeworks && !homework);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-sm text-gray-navy/70 space-y-3">
        <div className="size-8 border-4 border-primary border-t-transparent animate-spin rounded-full" />
        <span className="font-bold dark:text-light-blue">Đang tải dữ liệu bài nộp...</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="text-left py-10 space-y-4 max-w-xl">
        <div className="p-5 rounded-3xl bg-red-500/10 border border-red-200 text-red font-bold text-sm dark:bg-red-500/20 dark:border-red-900/30">
          Không tìm thấy bài tập được yêu cầu hoặc đã xảy ra lỗi tải dữ liệu.
        </div>
        <Button
          onClick={() => router.push("/teacher/homeworks")}
          className="rounded-2xl flex items-center gap-2"
        >
          <ArrowLeft className="size-4" />
          Quay lại quản lý bài tập
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-14 text-left">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <button
          onClick={() => router.push("/teacher/homeworks")}
          className="group flex items-center gap-2 text-xs font-black text-gray-navy hover:text-navy-blue dark:text-light-blue/70 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Quản lý Bài tập</span>
        </button>
      </motion.div>

      {/* Homework Info Banner */}
      {homework && (
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          onClick={() => setIsDescExpanded(!isDescExpanded)}
          className="rounded-[2rem] bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/10 p-6 md:p-8 shadow-sm text-left flex flex-col md:flex-row justify-between items-start gap-6 cursor-pointer select-none hover:shadow-md transition-all duration-250"
        >
          <div className="space-y-3 flex-1 w-full">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                <GraduationCap className="size-3" />
                Quản lý bài nộp
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-dark-blue dark:text-white">
              {homework.title}
            </h1>
            
            {/* Click to expand homework description */}
            {homework.description && (
              <div className="space-y-2 pt-1">
                <div
                  className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors outline-none cursor-pointer"
                >
                  <BookOpenCheck className="size-3.5" />
                  <span>{isDescExpanded ? "Thu gọn đề bài" : "Xem chi tiết đề bài"}</span>
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform duration-200",
                      isDescExpanded && "rotate-180"
                    )}
                  />
                </div>
                
                <AnimatePresence initial={false}>
                  {isDescExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 p-5 rounded-2xl bg-gray-50/50 dark:bg-zinc-900/40 border border-gray-150 dark:border-white/5 text-sm font-sans text-left prose prose-sm dark:prose-invert max-w-none cursor-text select-text"
                      >
                        <Markdown content={homework.description} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

        </motion.div>
      )}

      {/* Aggregate Stats Cards */}
      {homework && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <SubmissionsStats homework={homework} submissions={submissions} />
        </motion.div>
      )}

      {/* Submissions List Section */}
      {homework && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-2">
            <BookOpenCheck className="size-5 text-primary" />
            <h2 className="text-lg font-black text-dark-blue dark:text-white">
              Danh sách chi tiết
            </h2>
          </div>
          <SubmissionsList homework={homework} submissions={submissions} isLoading={isLoadingSubmissions} />
        </motion.div>
      )}
    </div>
  );
}
