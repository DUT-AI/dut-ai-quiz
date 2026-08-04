"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useHomeworks, useHomeworkSubmissions } from "@/features/homeworks/queries";
import { SubmissionDetailHeader } from "@/features/homeworks/components/submission-detail-header";
import { SubmissionScoreCard } from "@/features/homeworks/components/submission-score-card";
import { SubmissionFeedbackCard } from "@/features/homeworks/components/submission-feedback-card";
import { Button } from "@/components/ui/button";

export default function TeacherHomeworkSubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const homeworkId = params?.id as string;
  const submissionId = params?.submissionId as string;

  const { data: homeworksData, isLoading: isLoadingHomeworks } = useHomeworks();
  const { data: submissionsData, isLoading: isLoadingSubmissions, error: submissionsError } = useHomeworkSubmissions(homeworkId);

  // Find homework info
  const homework = useMemo(() => {
    if (!homeworksData?.data) return null;
    return homeworksData.data.find((h) => h.id === homeworkId) || null;
  }, [homeworksData, homeworkId]);

  // Find specific submission info
  const submission = useMemo(() => {
    if (!submissionsData?.data) return null;
    return submissionsData.data.find((s) => s.id === submissionId) || null;
  }, [submissionsData, submissionId]);

  const isLoading = isLoadingHomeworks || isLoadingSubmissions;
  const hasError = submissionsError || (!isLoading && (!submission || !homework));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-sm text-gray-navy/70 space-y-3">
        <div className="size-8 border-4 border-primary border-t-transparent animate-spin rounded-full" />
        <span className="font-bold dark:text-light-blue">Đang tải chi tiết bài làm...</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="text-left py-10 space-y-4 max-w-xl">
        <div className="p-5 rounded-3xl bg-red-500/10 border border-red-200 text-red font-bold text-sm dark:bg-red-500/20 dark:border-red-900/30">
          Không tìm thấy bài làm của học viên này hoặc bài làm không tồn tại.
        </div>
        <Button
          onClick={() => router.push(`/teacher/homeworks/${homeworkId}/submissions`)}
          className="rounded-2xl flex items-center gap-2"
        >
          <ArrowLeft className="size-4" />
          Quay lại danh sách bài nộp
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-14 text-left">
      {/* Header component */}
      {submission && homework && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <SubmissionDetailHeader
            homeworkId={homeworkId}
            homeworkTitle={homework.title}
            submission={submission}
          />
        </motion.div>
      )}

      {/* Main Content Layout */}
      {submission && (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left / Top: Score Card (col-span 12 on mobile, col-span 5 on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <SubmissionScoreCard submission={submission} />
          </motion.div>

          {/* Right / Bottom: Markdown Feedback Card (col-span 12 on mobile, col-span 7 on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:col-span-7"
          >
            <SubmissionFeedbackCard submission={submission} />
          </motion.div>
        </div>
      )}
    </div>
  );
}
