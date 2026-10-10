"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useHomework,
  useMyHomeworkSubmission,
  useMyHomeworkSubmissions,
  useSubmitHomework,
  useRetryHomeworkSubmission,
} from "../queries";
import { StudentHomeworkHeader } from "./student-homework-header";
import { StudentHomeworkStepper } from "./student-homework-stepper";
import { StudentHomeworkDescription } from "./student-homework-description";
import { StudentHomeworkUploadForm } from "./student-homework-upload-form";
import { StudentHomeworkHistory } from "./student-homework-history";

interface StudentHomeworkDetailProps {
  homeworkId: string;
  lessonId: string;
  slug: string;
  isPreview?: boolean;
}

export function StudentHomeworkDetail({
  homeworkId,
  slug,
  isPreview = false,
}: StudentHomeworkDetailProps) {
  const querySuffix = isPreview ? "?preview=true" : "";
  const backUrl = `/lessons/${slug}/homework${querySuffix}`;

  const { data: homework, isLoading: isHwLoading, error: hwError } = useHomework(homeworkId);
  const { data: mySubmission } = useMyHomeworkSubmission(homeworkId);
  const { data: mySubmissions } = useMyHomeworkSubmissions(homeworkId);

  const submit = useSubmitHomework();
  const retry = useRetryHomeworkSubmission();

  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // List of all submissions (all attempts), falling back to single submission if list not available yet
  const submissions = useMemo(() => {
    if (mySubmissions && mySubmissions.length > 0) {
      return mySubmissions;
    }
    if (mySubmission) {
      return [mySubmission];
    }
    if (homework?.current_submission) {
      return [homework.current_submission];
    }
    return [];
  }, [mySubmissions, mySubmission, homework?.current_submission]);

  const latestSubmission = submissions[0] || null;
  const submissionFailed = latestSubmission?.status === "FAILED";
  const step2 = submissions.length > 0 && !submissionFailed;
  const step3 = latestSubmission?.status === "GRADED";

  const handleFormSubmit = async () => {
    if (!file || isSubmitting || !homework) return;
    setIsSubmitting(true);
    try {
      await submit.mutateAsync({ homeworkId: homework.id, file });
      toast.success("Nộp bài thành công! Hệ thống đang chấm điểm.");
      setFile(null);
    } catch (submissionError) {
      const msg = submissionError instanceof Error ? submissionError.message : "Nộp bài thất bại";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = async () => {
    if (!latestSubmission || !submissionFailed || isRetrying) return;
    setIsRetrying(true);
    try {
      await retry.mutateAsync(latestSubmission.id);
      toast.info("Đã gửi yêu cầu chấm lại bài với file cũ.");
    } catch (retryError) {
      const msg = retryError instanceof Error ? retryError.message : "Không thể chấm lại bài";
      toast.error(msg);
    } finally {
      setIsRetrying(false);
    }
  };

  if (isHwLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="mt-4 text-sm font-semibold text-gray-navy dark:text-light-blue animate-pulse">
          Đang tải chi tiết bài tập...
        </p>
      </div>
    );
  }

  if (hwError || !homework) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-gray-navy dark:text-light-blue">
          <Link href={backUrl}>
            <ArrowLeft className="size-4" /> Quay lại danh sách bài tập
          </Link>
        </Button>
        <Card className="border-red/20 bg-red/5 p-8 text-center text-red">
          <AlertCircle className="mx-auto size-8 mb-2" />
          <p className="font-bold">Không tìm thấy bài tập coding này</p>
          <p className="mt-1 text-sm text-red/80">
            Bài tập có thể đã bị lưu trữ hoặc bạn không có quyền truy cập.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Quay lại danh sách */}
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 text-gray-navy hover:text-dark-blue dark:text-light-blue dark:hover:text-white transition-colors"
        >
          <Link href={backUrl}>
            <ArrowLeft className="size-4" /> Quay lại danh sách bài tập
          </Link>
        </Button>
      </div>

      {/* 2. Header thông tin bài tập */}
      <StudentHomeworkHeader
        homework={homework}
        submissionsCount={submissions.length}
        latestSubmission={latestSubmission}
        step2={step2}
        step3={step3}
      />

      {/* 3. Tiến trình bài tập (Stepper) */}
      <StudentHomeworkStepper
        step2={step2}
        step3={step3}
        submissionFailed={submissionFailed}
        latestSubmission={latestSubmission}
      />

      {/* 4. Đề bài & Yêu cầu chi tiết (Full width) */}
      <StudentHomeworkDescription description={homework.description} />

      {/* 5. Nộp bài làm mới (Full width ở dưới cùng) */}
      <StudentHomeworkUploadForm
        homeworkId={homework.id}
        hasPreviousSubmissions={submissions.length > 0}
        file={file}
        onFileChange={setFile}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      {/* 6. Danh sách tất cả các kết quả đánh giá (Phân trang) */}
      <StudentHomeworkHistory
        submissions={submissions}
        latestSubmissionId={latestSubmission?.id}
        onRetry={handleRetry}
        isRetrying={isRetrying}
        pageSize={3}
      />
    </div>
  );
}
