"use client";

import React from "react";
import { CommentList } from "./comment-list";

interface LessonCommentsProps {
  lessonId: string;
}

export function LessonComments({ lessonId }: LessonCommentsProps) {
  if (!lessonId) return null;

  return (
    <div className="mt-12 bg-white dark:bg-[#121E31]/90 border border-gray-200 dark:border-white/20 rounded-[2.5rem] shadow-xl pt-10 pb-10 px-6 md:pt-12 md:pb-12 md:px-12 text-left transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <LessonCommentsHeader />
        <div className="mt-8">
          <CommentList targetType="lesson_qna" targetId={lessonId} />
        </div>
      </div>
    </div>
  );
}

function LessonCommentsHeader() {
  return (
    <div className="border-b border-gray-150 dark:border-white/10 pb-4">
      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
        Hỏi đáp &amp; Thảo luận bài học
      </h2>
      <p className="text-sm text-gray-navy/70 dark:text-light-blue/60 mt-1">
        Nơi các bạn sinh viên trao đổi, thảo luận giải đáp thắc mắc về nội dung bài học lý thuyết này.
      </p>
    </div>
  );
}
