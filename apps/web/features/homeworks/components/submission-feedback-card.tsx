"use client";

import { MessageSquare, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { HomeworkSubmission } from "../types";
import { Card, CardContent } from "@/components/ui/card";

interface SubmissionFeedbackCardProps {
  submission: HomeworkSubmission;
}

export function SubmissionFeedbackCard({ submission }: SubmissionFeedbackCardProps) {
  return (
    <Card className="border border-gray-150 bg-white/50 dark:border-white/10 dark:bg-zinc-900/40 backdrop-blur-sm shadow-none text-left">
      <CardContent className="p-6 space-y-4">
        {/* Title */}
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-2">
          <MessageSquare className="size-4 text-primary" />
          <h3 className="text-sm font-black text-dark-blue dark:text-white uppercase tracking-wider">
            Nhận xét chi tiết từ hệ thống
          </h3>
        </div>

        {/* Feedback content */}
        {submission.feedback ? (
          <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed text-slate-800 dark:text-light-blue/90 break-words font-sans space-y-4">
            <ReactMarkdown>{submission.feedback}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center text-gray-navy/60 dark:text-light-blue/40 space-y-2">
            <FileText className="size-8 opacity-40" />
            <p className="text-xs font-bold">Không có nhận xét chi tiết</p>
            <p className="text-[10px] max-w-xs">
              Bài nộp này chưa được nhận xét chi tiết hoặc đang được xử lý trong hàng đợi chấm điểm.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
