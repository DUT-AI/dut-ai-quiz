"use client";

import React from "react";
import Link from "next/link";
import {
  FileCode,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  Paperclip,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import type { Homework } from "../types";

interface StudentHomeworkTableProps {
  homeworks: Homework[];
  slug: string;
  isPreview?: boolean;
}

export function StudentHomeworkTable({
  homeworks,
  slug,
  isPreview = false,
}: StudentHomeworkTableProps) {
  const querySuffix = isPreview ? "?preview=true" : "";

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-150 bg-white shadow-sm dark:border-white/10 dark:bg-navy-blue/30 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-150 bg-gray-50/80 text-xs font-bold uppercase tracking-wider text-gray-navy dark:border-white/10 dark:bg-white/[0.03] dark:text-light-blue">
            <tr>
              <th scope="col" className="px-5 py-4 w-12 text-center">
                #
              </th>
              <th scope="col" className="px-5 py-4 min-w-[240px]">
                Bài tập coding
              </th>
              <th scope="col" className="px-5 py-4 min-w-[170px]">
                Tình trạng nộp bài
              </th>
              <th scope="col" className="px-5 py-4 min-w-[170px]">
                Đánh giá & Điểm số
              </th>
              <th scope="col" className="px-5 py-4 text-right min-w-[140px]">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150 dark:divide-white/5">
            {homeworks.map((homework, index) => {
              const submission = homework.current_submission;
              const isSubmitted = !!submission && submission.status !== "FAILED";
              const isGraded = submission?.status === "GRADED";
              const isGrading =
                submission?.status === "GRADING" || submission?.status === "UPLOADED";
              const isFailed = submission?.status === "FAILED";
              const detailUrl = `/lessons/${slug}/homework/${homework.id}${querySuffix}`;

              return (
                <tr
                  key={homework.id}
                  className="group transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.02]"
                >
                  {/* STT */}
                  <td className="px-5 py-4 text-center font-semibold text-gray-400 dark:text-gray-500">
                    {index + 1}
                  </td>

                  {/* Tiêu đề bài tập */}
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={detailUrl}
                        className="font-bold text-dark-blue hover:text-primary dark:text-white dark:hover:text-primary transition-colors flex items-center gap-2"
                      >
                        <FileCode className="size-4 shrink-0 text-primary" />
                        <span className="line-clamp-1">{homework.title}</span>
                      </Link>

                      <div className="flex items-center gap-2 text-xs text-gray-navy dark:text-light-blue/70">
                        {homework.has_attachment && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <Paperclip className="size-3" />
                            Đính kèm đề bài
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Tình trạng nộp bài */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    {isSubmitted ? (
                      <div className="space-y-1">
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-semibold gap-1.5 py-1 px-2.5"
                        >
                          <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                          <span>Đã nộp bài</span>
                        </Badge>
                        {submission?.submitted_at && (
                          <p className="text-[11px] text-gray-navy dark:text-light-blue/60 pl-1">
                            {formatDateTime(submission.submitted_at)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300 border-slate-200/60 font-semibold gap-1.5 py-1 px-2.5"
                      >
                        <Clock className="size-3.5 text-slate-400 shrink-0" />
                        <span>Chưa nộp bài</span>
                      </Badge>
                    )}
                  </td>

                  {/* Tình trạng đánh giá */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    {!submission ? (
                      <span className="text-xs text-gray-400 italic">Chưa nộp</span>
                    ) : isGrading ? (
                      <Badge
                        variant="outline"
                        className="bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20 font-semibold gap-1.5 py-1 px-2.5 animate-pulse"
                      >
                        <Loader2 className="size-3.5 animate-spin text-sky-500 shrink-0" />
                        <span>Đang chấm điểm</span>
                      </Badge>
                    ) : isGraded ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center font-extrabold text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            {typeof submission.score === "number" ? submission.score : "—"}{" "}
                            <span className="text-[11px] font-normal text-emerald-700 dark:text-emerald-400 ml-1">
                              / 10
                            </span>
                          </span>

                          {submission.is_pass !== null && submission.is_pass !== undefined && (
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                submission.is_pass
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                  : "bg-red/10 text-red dark:bg-red/20 dark:text-red"
                              }`}
                            >
                              {submission.is_pass ? "Đạt" : "Chưa đạt"}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : isFailed ? (
                      <Badge
                        variant="outline"
                        className="bg-red/10 text-red border-red/20 font-semibold gap-1.5 py-1 px-2.5"
                      >
                        <AlertCircle className="size-3.5 text-red shrink-0" />
                        <span>Lỗi chấm điểm</span>
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-400">Đã nhận file</span>
                    )}
                  </td>

                  {/* Thao tác */}
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="border-gray-200 hover:border-primary/50 hover:bg-primary/10 hover:text-primary dark:border-white/10 dark:hover:bg-primary/20 rounded-xl transition-all font-semibold gap-1.5"
                    >
                      <Link href={detailUrl}>
                        <span>Chi tiết</span>
                        <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
