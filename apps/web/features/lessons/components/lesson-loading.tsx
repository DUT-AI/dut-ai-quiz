import React from "react";

export function LessonLoading() {
  return (
    <div className="h-full flex flex-col items-center justify-center py-40 opacity-50">
      <div className="size-12 border-4 border-primary border-t-transparent animate-spin rounded-full mb-6" />
      <p className="font-bold text-lg">Đang tải bài học...</p>
    </div>
  );
}
