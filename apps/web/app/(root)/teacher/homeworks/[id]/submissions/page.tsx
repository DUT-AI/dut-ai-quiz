"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TeacherHomeworkSubmissionsRedirect() {
  const params = useParams();
  const router = useRouter();
  const homeworkId = params?.id as string;

  useEffect(() => {
    if (homeworkId) {
      router.replace(`/teacher/homeworks/${homeworkId}?tab=submissions`);
    }
  }, [homeworkId, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-sm text-gray-navy/70 space-y-3">
      <div className="size-8 border-4 border-primary border-t-transparent animate-spin rounded-full" />
      <span className="font-bold dark:text-light-blue">Đang chuyển đến trang chi tiết bài tập...</span>
    </div>
  );
}
