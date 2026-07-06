import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LessonNotFound() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-40">
      <h2 className="text-3xl font-black text-dark-blue dark:text-white mb-6">
        Không tìm thấy bài học
      </h2>
      <Button asChild className="rounded-2xl">
        <Link href="/lessons">Quay lại danh sách bài học</Link>
      </Button>
    </div>
  );
}
