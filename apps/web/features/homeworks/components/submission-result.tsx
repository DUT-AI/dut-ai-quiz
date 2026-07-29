"use client";

import { AlertTriangle, CheckCircle2, Clock3, Download, XCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HomeworkSubmission } from "../types";
import { openSubmissionFile } from "../queries";

export function SubmissionResult({
  submission,
  compact = false,
}: {
  submission: HomeworkSubmission;
  compact?: boolean;
}) {
  const status = {
    UPLOADED: { label: "Đã tải lên", icon: Clock3, className: "bg-blue-500/10 text-blue-600" },
    GRADING: { label: "Đang chấm", icon: Clock3, className: "bg-amber-500/10 text-amber-600" },
    GRADED: { label: "Đã chấm", icon: CheckCircle2, className: "bg-green/10 text-green" },
    FAILED: { label: "Chấm lỗi", icon: XCircle, className: "bg-red/10 text-red" },
  }[submission.status];
  const Icon = status.icon;

  return (
    <Card className="border-none bg-gray-50 dark:bg-white/5 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm">
            Lần nộp #{submission.attempt_number}
          </CardTitle>
          <div className="flex items-center gap-2">
            {submission.is_late && <Badge variant="destructive">Nộp trễ</Badge>}
            <Badge className={status.className}>
              <Icon className="mr-1 size-3" /> {status.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-gray-navy dark:text-light-blue">
            {new Date(submission.submitted_at).toLocaleString("vi-VN")}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openSubmissionFile(submission.id)}
          >
            <Download className="mr-2 size-4" /> Tải bài nộp
          </Button>
        </div>

        {!compact && submission.status === "GRADED" && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-3xl font-black text-primary">
                {submission.score ?? "—"}/10
              </span>
              <Badge variant={submission.is_pass ? "default" : "destructive"}>
                {submission.is_pass ? "Đạt" : "Chưa đạt"}
              </Badge>
              {submission.is_plagiarized && (
                <Badge variant="destructive">
                  <AlertTriangle className="mr-1 size-3" /> Nghi vấn đạo văn
                </Badge>
              )}
            </div>
            {submission.feedback && (
              <div className="prose prose-sm max-w-none rounded-2xl bg-white p-4 dark:prose-invert dark:bg-navy-blue">
                <ReactMarkdown>{submission.feedback}</ReactMarkdown>
              </div>
            )}
          </>
        )}

        {submission.status === "FAILED" && submission.grading_error && (
          <p className="text-sm text-red">{submission.grading_error}</p>
        )}
      </CardContent>
    </Card>
  );
}
