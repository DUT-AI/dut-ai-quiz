"use client";

import React from "react";
import { AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import type { StudentAttemptFocusEventOut } from "@/features/exams/types";

interface AttemptFocusTimelineProps {
  events: StudentAttemptFocusEventOut[];
}

export function AttemptFocusTimeline({ events }: AttemptFocusTimelineProps) {
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
      <div className="flex items-center gap-2 text-sm font-bold text-red">
        <AlertTriangle className="size-4 shrink-0" />
        Ghi nhận {events.length} sự kiện vi phạm quy chế thi:
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

          return (
            <div
              key={e.id}
              className="p-3.5 rounded-2xl bg-red/5 border border-red/10 flex items-center justify-between text-xs font-semibold"
            >
              <div className="flex items-center gap-2.5">
                <span className="size-5 rounded-full bg-red/10 text-red flex items-center justify-center font-black text-[10px]">
                  {idx + 1}
                </span>
                <span className="font-bold text-dark-blue dark:text-white">{label}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-navy opacity-70 shrink-0">
                <Clock className="size-3" />
                <span>{timeStr} • {dateStr}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
