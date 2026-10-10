"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLessons } from "@/lib/queries";
import {
  useHomework,
  useHomeworkSubmissions,
  useArchiveHomework,
  useRetryHomeworkRubric,
} from "@/features/homeworks/queries";
import { HomeworkDetailHeader } from "@/features/homeworks/components/homework-detail-header";
import { HomeworkOverviewTab } from "@/features/homeworks/components/homework-overview-tab";
import { SubmissionsStats } from "@/features/homeworks/components/submissions-stats";
import { SubmissionsList } from "@/features/homeworks/components/submissions-list";
import { HomeworkFormModal } from "@/features/homeworks/components/homework-form-modal";

export default function TeacherHomeworkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const homeworkId = params?.id as string;

  // Active tab: 'overview' | 'submissions'
  const initialTab = searchParams.get("tab") === "submissions" ? "submissions" : "overview";
  const [activeTab, setActiveTab] = useState<"overview" | "submissions">(initialTab);

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);

  // Queries
  const { data: homework, isLoading: isLoadingHomework } = useHomework(homeworkId);
  const { data: submissionsData, isLoading: isLoadingSubmissions } = useHomeworkSubmissions(homeworkId);
  const { data: lessons = [] } = useLessons();
  const archive = useArchiveHomework();
  const retryRubric = useRetryHomeworkRubric();

  const submissions = useMemo(() => {
    return submissionsData?.data || [];
  }, [submissionsData]);

  const lesson = useMemo(() => {
    if (!homework?.lesson_id) return null;
    return lessons.find((l) => l.id === homework.lesson_id) || null;
  }, [homework, lessons]);

  // Tab switch handler with URL update (without full page reload)
  const handleTabChange = (tab: "overview" | "submissions") => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === "submissions") {
      url.searchParams.set("tab", "submissions");
    } else {
      url.searchParams.delete("tab");
    }
    window.history.replaceState({}, "", url.toString());
  };

  const handleConfirmArchive = async () => {
    if (!homework?.id) return;
    try {
      await archive.mutateAsync(homework.id);
      toast.success("Đã lưu trữ bài tập thành công");
      router.push("/teacher/homeworks");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thao tác thất bại");
    }
  };

  const handleRetryRubric = async () => {
    if (!homework?.id) return;
    try {
      await retryRubric.mutateAsync(homework.id);
      toast.success("Đã gửi yêu cầu tạo lại rubric cho AI worker");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thao tác thất bại");
    }
  };

  if (isLoadingHomework) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-sm text-gray-navy/70 space-y-3">
        <div className="size-8 border-4 border-primary border-t-transparent animate-spin rounded-full" />
        <span className="font-bold dark:text-light-blue">Đang tải dữ liệu bài tập...</span>
      </div>
    );
  }

  if (!homework) {
    return (
      <div className="text-left py-10 space-y-4 max-w-xl">
        <div className="p-5 rounded-3xl bg-red-500/10 border border-red-200 text-red font-bold text-sm dark:bg-red-500/20 dark:border-red-900/30">
          Không tìm thấy bài tập được yêu cầu hoặc bài tập đã bị xóa / lưu trữ.
        </div>
        <Button
          onClick={() => router.push("/teacher/homeworks")}
          className="rounded-2xl flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          Quay lại quản lý bài tập
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 text-left">
      {/* Detail Header & Action Bar */}
      <HomeworkDetailHeader
        homework={homework}
        lessonName={lesson?.name}
        lessonId={lesson?.id}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        submissionsCount={submissions.length}
        onEdit={() => setIsEditOpen(true)}
        onArchive={() => setIsArchiveConfirmOpen(true)}
        onRetryRubric={handleRetryRubric}
        isRetryingRubric={retryRubric.isPending}
      />

      {/* TAB 1: OVERVIEW & PROMPT */}
      {activeTab === "overview" && (
        <HomeworkOverviewTab
          homework={homework}
          submissions={submissions}
          lessonName={lesson?.name}
          onEdit={() => setIsEditOpen(true)}
          onRetryRubric={handleRetryRubric}
          isRetryingRubric={retryRubric.isPending}
        />
      )}

      {/* TAB 2: SUBMISSIONS LIST */}
      {activeTab === "submissions" && (
        <motion.div
          key="tab-submissions"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <SubmissionsStats homework={homework} submissions={submissions} />
          <SubmissionsList
            homework={homework}
            submissions={submissions}
            isLoading={isLoadingSubmissions}
          />
        </motion.div>
      )}

      {/* Edit Homework Form Modal */}
      <HomeworkFormModal
        open={isEditOpen}
        homework={homework}
        onClose={() => setIsEditOpen(false)}
      />

      {/* Confirm Archive Dialog */}
      <ConfirmDialog
        isOpen={isArchiveConfirmOpen}
        onClose={() => setIsArchiveConfirmOpen(false)}
        onConfirm={handleConfirmArchive}
        title="Lưu trữ bài tập này?"
        description={`Bạn có chắc chắn muốn lưu trữ bài tập "${homework.title}"? Học viên sẽ không thể xem hoặc nộp bài giải cho bài tập này nữa.`}
        confirmText="Xác nhận lưu trữ"
        cancelText="Hủy bỏ"
        isDestructive={true}
      />
    </div>
  );
}
