"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  useExam, 
  useExternalUsers, 
  useStudentExamAttempts, 
  useDeleteExamAttempt 
} from "@/features/exams/queries";
import { StudentAttemptHeader } from "@/features/exams/components/exam-stats/student-attempts/student-attempt-header";
import { AttemptQuestionReview } from "@/features/exams/components/exam-stats/student-attempts/attempt-question-review";
import { AttemptFocusTimeline } from "@/features/exams/components/exam-stats/student-attempts/attempt-focus-timeline";
import { DeleteAttemptDialog } from "@/features/exams/components/exam-stats/student-attempts/delete-attempt-dialog";
import { 
  Clock, 
  ShieldAlert, 
  FileText, 
  Trash2, 
  Layers,
  ChevronDown
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function StudentAttemptsDetailPage() {
  const params = useParams<{ id: string; studentId: string }>();
  const examId = params.id;
  const studentId = Number(params.studentId);
  const router = useRouter();

  const { data: exam, isLoading: loadingExam } = useExam(examId);
  const { data: externalUsersData } = useExternalUsers();
  const { 
    data: studentData, 
    isLoading: loadingAttempts,
    refetch: refetchAttempts 
  } = useStudentExamAttempts(examId, studentId);

  const deleteMutation = useDeleteExamAttempt(examId, studentId);

  const studentUser = React.useMemo(() => {
    const list = externalUsersData?.data || [];
    return list.find((u) => u.id === studentId) || { id: studentId };
  }, [externalUsersData?.data, studentId]);

  const [selectedAttemptIndex, setSelectedAttemptIndex] = useState<number>(0);
  const [deleteAttemptId, setDeleteAttemptId] = useState<string | null>(null);

  if (loadingExam || loadingAttempts) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="size-12 border-4 border-blue-500 border-t-transparent animate-spin rounded-full" />
        <p className="font-bold text-blue-500 animate-pulse">Đang nạp chi tiết bài thi học sinh...</p>
      </div>
    );
  }

  if (!exam || !studentData) {
    return (
      <div className="p-12 text-center font-bold text-gray-navy">
        Không tìm thấy thông tin lượt thi của học sinh.
      </div>
    );
  }

  const attempts = studentData.attempts;
  const currentAttempt = attempts[selectedAttemptIndex] || attempts[0];

  const handleDeleteConfirm = async () => {
    if (!deleteAttemptId) return;
    try {
      await deleteMutation.mutateAsync(deleteAttemptId);
      setDeleteAttemptId(null);
      await refetchAttempts();
      setSelectedAttemptIndex(0);
    } catch (e) {
      console.error("Error deleting attempt:", e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Student Profile & Overview Header */}
      <StudentAttemptHeader
        examId={examId}
        examTitle={exam.title}
        student={studentUser}
        totalAttempts={studentData.total_attempts}
        bestScore={studentData.best_score}
        maxTabOut={studentData.max_tab_out}
      />

      {attempts.length === 0 ? (
        <div className="p-16 rounded-[3rem] bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 text-center space-y-3">
          <p className="text-xl font-bold text-dark-blue dark:text-white">
            Học sinh chưa có lượt làm bài nào
          </p>
          <p className="text-sm font-semibold text-gray-navy opacity-60">
            Lượt làm bài có thể đã được xóa hoặc học sinh chưa tham gia bài thi này.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Attempt Selector & Action Bar (Replaced 2-column layout with Single Row Select Box) */}
          <div className="p-6 md:p-8 rounded-[2.5rem] bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              {/* Attempt Select Box */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                <label className="text-xs font-black uppercase text-gray-navy opacity-60 flex items-center gap-1.5 shrink-0">
                  <Layers className="size-4 text-blue-500" />
                  Chọn lượt thi:
                </label>
                <div className="relative w-full sm:w-auto min-w-[320px]">
                  <select
                    value={selectedAttemptIndex}
                    onChange={(e) => setSelectedAttemptIndex(Number(e.target.value))}
                    className="w-full appearance-none pl-4 pr-10 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-bold text-dark-blue dark:text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 cursor-pointer transition-all"
                  >
                    {attempts.map((att, idx) => {
                      const startTimeStr = new Date(att.started_at).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const startDateStr = new Date(att.started_at).toLocaleDateString("vi-VN");
                      const scoreStr = att.score !== null ? `${att.score} điểm` : "N/A";
                      const tabOutStr = att.tab_out_count > 0 ? ` (${att.tab_out_count} lần thoát tab)` : "";

                      return (
                        <option key={att.id} value={idx}>
                          Lượt #{attempts.length - idx} • {scoreStr} • {att.status} • {startTimeStr} {startDateStr}{tabOutStr}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-navy pointer-events-none opacity-60" />
                </div>
              </div>

              {/* Delete Attempt Button */}
              {currentAttempt && (
                <button
                  type="button"
                  onClick={() => setDeleteAttemptId(currentAttempt.id)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-red/10 hover:bg-red/20 text-red font-bold text-xs transition-colors shrink-0 self-end sm:self-auto"
                >
                  <Trash2 className="size-4" />
                  Xóa lượt thi này
                </button>
              )}
            </div>

            {/* Current Attempt Summary Banner */}
            {currentAttempt && (
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-gray-50/70 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-black text-dark-blue dark:text-white">
                    Lượt #{attempts.length - selectedAttemptIndex}
                  </span>
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider",
                      currentAttempt.status === "COMPLETED"
                        ? "bg-green-500/15 text-green-600"
                        : "bg-orange/15 text-orange"
                    )}
                  >
                    {currentAttempt.status}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-navy opacity-70">
                    <Clock className="size-3.5" />
                    <span>
                      Bắt đầu: {new Date(currentAttempt.started_at).toLocaleString("vi-VN")}
                      {currentAttempt.completed_at && ` • Nộp bài: ${new Date(currentAttempt.completed_at).toLocaleString("vi-VN")}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {currentAttempt.tab_out_count > 0 && (
                    <span className="flex items-center gap-1.5 text-xs font-black uppercase text-red bg-red/10 px-3 py-1 rounded-xl">
                      <ShieldAlert className="size-3.5" />
                      {currentAttempt.tab_out_count} lần thoát tab
                    </span>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-blue-500">
                      {currentAttempt.score !== null ? currentAttempt.score : "N/A"}
                    </span>
                    <span className="text-xs font-bold text-gray-navy opacity-50">/ 10 điểm</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sub-tabs: Question Breakdown vs Anti-Cheat Events */}
          {currentAttempt && (
            <Tabs defaultValue="questions" className="w-full space-y-6">
              <TabsList>
                <TabsTrigger value="questions">
                  <FileText className="size-4" />
                  Chi tiết câu hỏi ({currentAttempt.questions.length})
                </TabsTrigger>
                <TabsTrigger value="anticheat">
                  <ShieldAlert className="size-4" />
                  Nhật ký gian lận ({currentAttempt.focus_events.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="questions" className="outline-none mt-0">
                <AttemptQuestionReview questions={currentAttempt.questions} />
              </TabsContent>

              <TabsContent value="anticheat" className="outline-none mt-0">
                <div className="p-8 rounded-[2.5rem] bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 shadow-sm">
                  <AttemptFocusTimeline
                    events={currentAttempt.focus_events}
                    examId={examId}
                    studentId={studentId}
                    attemptId={currentAttempt.id}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {currentAttempt && (
        <DeleteAttemptDialog
          open={!!deleteAttemptId}
          onOpenChange={(open) => !open && setDeleteAttemptId(null)}
          onConfirm={handleDeleteConfirm}
          isDeleting={deleteMutation.isPending}
          attemptScore={currentAttempt.score}
          attemptStatus={currentAttempt.status}
        />
      )}
    </div>
  );
}
