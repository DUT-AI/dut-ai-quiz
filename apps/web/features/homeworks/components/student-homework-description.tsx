"use client";

import React from "react";
import { FileText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/components/markdown";

interface StudentHomeworkDescriptionProps {
  description?: string | null;
}

export function StudentHomeworkDescription({ description }: StudentHomeworkDescriptionProps) {
  return (
    <Card className="border border-gray-150 bg-white shadow-sm dark:border-white/10 dark:bg-navy-blue/30 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-primary" />
          <CardTitle className="text-lg font-bold text-dark-blue dark:text-white">
            Đề bài & Yêu cầu chi tiết
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-6">
        {description ? (
          <div className="prose dark:prose-invert max-w-none break-words text-sm leading-relaxed tracking-wide text-dark-blue dark:text-white font-sans">
            <Markdown content={description} />
          </div>
        ) : (
          <p className="text-sm italic text-gray-400">
            Không có mô tả chi tiết cho bài tập này.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
