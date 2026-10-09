"use client";

import React from "react";
import { Calendar, CheckCircle2, Clock, Download, FileCode } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { Homework, HomeworkSubmission } from "../types";
import { openHomeworkAttachment } from "../queries";

interface StudentHomeworkHeaderProps {
  homework: Homework;
  submissionsCount: number;
  latestSubmission: HomeworkSubmission | null;
  step2: boolean;
  step3: boolean;
}

export function StudentHomeworkHeader({
  homework,
  submissionsCount,
  latestSubmission,
  step2,
  step3,
}: StudentHomeworkHeaderProps) {
  return (
    <Card className="overflow-hidden border border-gray-150 bg-white shadow-sm dark:border-white/10 dark:bg-navy-blue/40 backdrop-blur-sm">
      <div className="h-1.5 w-full bg-primary" />
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 text-xs font-bold"
              >
                <FileCode className="size-3.5 mr-1" />
                Bài tập coding
              </Badge>
              {step2 ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-xs font-bold"
                >
                  <CheckCircle2 className="size-3.5 mr-1 text-emerald-500" />
                  Đã nộp bài {submissionsCount > 1 ? `(${submissionsCount} lần)` : ""}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300 border-slate-200/60 text-xs font-bold"
                >
                  <Clock className="size-3.5 mr-1 text-slate-400" />
                  Chưa nộp bài
                </Badge>
              )}
              {step3 && typeof latestSubmission?.score === "number" && (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-xs font-bold"
                >
                  Điểm số gần nhất: {latestSubmission.score}/10
                </Badge>
              )}
            </div>

            <CardTitle className="text-2xl font-black text-dark-blue dark:text-white sm:text-3xl">
              {homework.title}
            </CardTitle>

            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-navy dark:text-light-blue">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-gray-400" />
                Giao ngày: {formatDateTime(homework.created_at)}
              </span>
            </div>
          </div>

          {/* Action buttons (Download attachment) */}
          {homework.has_attachment && (
            <Button
              variant="outline"
              onClick={() => openHomeworkAttachment(homework.id)}
              className="border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-light-blue dark:hover:bg-white/5 rounded-xl font-semibold gap-2 shrink-0"
            >
              <Download className="size-4" /> Tải đề bài đính kèm (.zip)
            </Button>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}
