"use client";

import { X } from "lucide-react";

import { useExternalUsers } from "@/lib/queries";
import { SubmissionResult } from "./submission-result";
import { useHomeworkSubmissions } from "../queries";
import { Homework } from "../types";

export function SubmissionsPanel({
  homework,
  onClose,
}: {
  homework: Homework | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useHomeworkSubmissions(homework?.id ?? null);
  const { data: usersData } = useExternalUsers();
  if (!homework) return null;

  const submittedUserIds = new Set(
    data?.data.map((submission) => submission.user_id) ?? [],
  );
  const userById = new Map(
    (usersData?.data ?? []).map((user) => [user.id, user]),
  );
  const unsubmitted = homework.assignee_ids
    .filter((userId) => !submittedUserIds.has(userId))
    .map((userId) => ({
      id: userId,
      name: userById.get(userId)?.name ?? `Thành viên #${userId}`,
    }));

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/40">
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl dark:bg-navy-blue md:p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black">Bài nộp</h2>
            <p className="text-sm text-gray-navy">{homework.title}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-gray-100">
            <X className="size-5" />
          </button>
        </div>
        {isLoading && <p className="py-10 text-center opacity-50">Đang tải...</p>}
        {data?.data.length === 0 && (
          <p className="py-10 text-center text-gray-navy">Chưa có bài nộp.</p>
        )}
        {!isLoading && unsubmitted.length > 0 && (
          <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="mb-3 text-sm font-black text-amber-700">
              Chưa nộp ({unsubmitted.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {unsubmitted.map((user) => (
                <span
                  key={user.id}
                  className="rounded-full bg-white px-3 py-1 text-xs font-bold shadow-sm dark:bg-white/10"
                >
                  {user.name}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-4">
          {data?.data.map((submission) => (
            <div key={submission.id}>
              <p className="mb-2 text-sm font-bold">
                {submission.owner_name || `Thành viên #${submission.user_id}`}
              </p>
              <SubmissionResult submission={submission} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
