"use client";

import React from "react";
import { CommentList } from "./comment-list";

interface LessonCommentsProps {
  lessonId: string;
}

export function LessonComments({ lessonId }: LessonCommentsProps) {
  if (!lessonId) return null;

  return (
    <div className="mt-12 text-left transition-colors duration-300 pb-10">
      <div className="max-w-5xl mx-auto">
        <CommentList 
          targetType="lesson_qna" 
          targetId={lessonId} 
          title="Hỏi đáp &amp; Thảo luận bài học"
        />
      </div>
    </div>
  );
}
