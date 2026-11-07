"use client";

import React, { useState } from "react";
import { AlertTriangle, ShieldCheck, Clock, Trash2 } from "lucide-react";
import type { StudentAttemptFocusEventOut } from "@/features/exams/types";
import { useDeleteFocusEvent, useClearAttemptFocusEvents } from "@/features/exams/queries";

interface AttemptFocusTimelineProps {
  events: StudentAttemptFocusEventOut[];
  examId: string;
  studentId: number;
  attemptId?: string;
}

export function AttemptFocusTimeline({
  events,
  examId,
  studentId,
  attemptId,
}: AttemptFocusTimelineProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleteEventMutation = useDeleteFocusEvent(examId, studentId);
  const clearEventsMutation = useClearAttemptFocusEvents(examId, studentId);

  const handleDeleteOne = async (eventId: string) => {
    if (!attemptId) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa sự kiện vi phạm này? Số lần vi phạm (tab_out_count) sẽ giảm đi 1.")) {
      return;
    }
    setDeletingId(eventId);
    try {
      await deleteEventMutation.mutateAsync({ attemptId, eventId });
    } catch (err: any) {
      alert(err.message || "Xóa sự kiện thất bại");
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!attemptId) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa TOÀN BỘ vi phạm của lượt thi này? Số lần vi phạm (tab_out_count) sẽ được đặt về 0.")) {
      return;
    }
    try {
      await clearEventsMutation.mutateAsync(attemptId);
    } catch (err: any) {
      alert(err.message || "Xóa toàn bộ vi phạm thất bại");
    }
  };

  if (events.length === 0) {
    return (
      <div className="flex items-center gap-3 p-5 rounded-2xl bg-green-500/5 border border-green-500/20 text-green-600 font-bold text-sm">
        <ShieldCheck className="size-5 shrink-0" />
        Không ghi nhận bất kỳ vi phạm thoát tab hoặc rời màn hình nào trong lượt thi này.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-red">
          <AlertTriangle className="size-4 shrink-0" />
          Ghi nhận {events.length} sự kiện vi phạm quy chế thi:
        </div>

        {attemptId && (
          <button
            onClick={handleClearAll}
            disabled={clearEventsMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red/10 text-red hover:bg-red/20 font-bold text-xs transition-colors disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
            {clearEventsMutation.isPending ? "Đang xóa..." : "Xóa tất cả vi phạm"}
          </button>
        )}
      </div>

      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {events.map((e, idx) => {
          const timeStr = new Date(e.received_at).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
          const dateStr = new Date(e.received_at).toLocaleDateString("vi-VN");

          let label = e.event;
          if (e.event === "mouse_leave") label = "Rời chuột khỏi cửa sổ thi (mouse_leave)";
          else if (e.event === "window_blur") label = "Chuyển sang ứng dụng khác (window_blur)";
          else if (e.event === "timer_throttled") label = "Phát hiện gian lận trình duyệt (timer_throttled)";
          else if (e.event === "devtools_detected") label = "Mở cửa sổ lập trình viên (devtools_detected)";

          const isDeleting = deletingId === e.id;

          return (
            <div
              key={e.id}
              className="p-3.5 rounded-2xl bg-red/5 border border-red/10 flex items-center justify-between text-xs font-semibold gap-3 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="size-5 rounded-full bg-red/10 text-red flex items-center justify-center font-black text-[10px] shrink-0">
                  {idx + 1}
                </span>
                <span className="font-bold text-dark-blue dark:text-white truncate">{label}</span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 text-gray-navy opacity-70">
                  <Clock className="size-3" />
                  <span>{timeStr} • {dateStr}</span>
                </div>

                {attemptId && (
                  <button
                    onClick={() => handleDeleteOne(e.id)}
                    disabled={isDeleting}
                    title="Xóa sự kiện này và giảm vi phạm đi 1"
                    className="p-1.5 rounded-lg text-red/60 hover:text-red hover:bg-red/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
