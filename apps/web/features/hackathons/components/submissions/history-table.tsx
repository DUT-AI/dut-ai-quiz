"use client";

import React from "react";
import { Loader2, Download, Ban, Terminal, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type HackathonSubmission, type SubmissionStatus } from "../../types";
import { formatDateTime } from "@/lib/utils";

interface HistoryTableProps {
  submissions: HackathonSubmission[];
  isLoading: boolean;
  onCancel: (id: string) => Promise<void>;
  onViewLogs: (id: string) => void;
}

export function HistoryTable({
  submissions,
  isLoading,
  onCancel,
  onViewLogs,
}: HistoryTableProps) {
  const getStatusBadge = (status: SubmissionStatus, errMsg: string | null | undefined) => {
    switch (status) {
      case "UPLOADING":
      case "EXTRACTING":
      case "RUNNING":
      case "EVALUATING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold border border-amber-500/10 animate-pulse">
            <Loader2 className="size-3 animate-spin" />
            {status === "RUNNING"
              ? "Đang chạy"
              : status === "EVALUATING"
              ? "Đang chấm"
              : "Đang xử lý"}
          </span>
        );
      case "PUBLISHED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/10">
            <CheckCircle className="size-3" />
            Hoàn thành
          </span>
        );
      case "FAILED":
        return (
          <span
            title={errMsg || "Lỗi chấm bài"}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/10 cursor-help"
          >
            <XCircle className="size-3" />
            Lỗi chấm bài
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-500/10 text-gray-500 text-xs font-bold border border-gray-500/10">
            <Ban className="size-3" />
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-xs font-semibold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <h5 className="text-sm font-black text-navy-blue dark:text-white flex items-center gap-2">
        <Clock className="size-4 text-primary" />
        Lịch sử bài nộp của bạn
      </h5>

      {isLoading ? (
        <div className="flex items-center py-6 text-xs text-gray-navy/60">
          <Loader2 className="size-4 mr-2 animate-spin text-primary" />
          Đang tải lịch sử bài nộp...
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-8 rounded-xl border border-dashed border-gray-150 dark:border-white/5 text-xs text-gray-navy/60 italic">
          Chưa có lượt nộp bài nào cho thử thách này.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-navy-blue shadow-sm">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/[0.01] border-b border-gray-100 dark:border-white/5 text-xs font-black text-gray-navy dark:text-light-blue/60 uppercase tracking-wider">
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Tệp nộp bài</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-center">Điểm số</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.005]">
                  <td className="px-6 py-4 text-xs font-bold text-navy-blue dark:text-white whitespace-nowrap">
                    {formatDateTime(sub.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <a
                        href={sub.script_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-bold"
                      >
                        <Download className="size-3" /> Predict Script
                      </a>
                      {sub.model_url && (
                        <a
                          href={sub.model_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-bold"
                        >
                          <Download className="size-3" /> Model Weights
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    {getStatusBadge(sub.status, sub.error_message)}
                  </td>
                  <td className="px-6 py-4 text-center font-black text-base text-primary whitespace-nowrap">
                    {sub.status === "PUBLISHED"
                      ? sub.score !== null && sub.score !== undefined
                        ? sub.score.toFixed(4)
                        : "0.0000"
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      {/* Cancel button if running */}
                      {["UPLOADING", "EXTRACTING", "RUNNING", "EVALUATING"].includes(sub.status) && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onCancel(sub.id)}
                          className="rounded-lg h-8 px-3 text-xs font-bold cursor-pointer"
                        >
                          <Ban className="size-3.5 mr-1" /> Hủy
                        </Button>
                      )}
                      {/* Logs button */}
                      {["PUBLISHED", "FAILED", "CANCELLED"].includes(sub.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewLogs(sub.id)}
                          className="rounded-lg h-8 px-3 text-xs font-bold border-gray-200 hover:bg-slate-100 cursor-pointer"
                        >
                          <Terminal className="size-3.5 mr-1" /> Xem logs
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
