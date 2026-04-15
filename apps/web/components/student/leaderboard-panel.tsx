"use client";
import { useLeaderboard } from "@/lib/queries";

interface Props {
  examId: string;
  examTitle?: string;
}

export default function LeaderboardPanel({ examId, examTitle }: Props) {
  const { data: entries, isLoading, error } = useLeaderboard(examId);

  return (
    <div className="mt-6">
      <h3 className="font-bold text-sm text-dark-blue dark:text-white mb-3">
        🏆 Bảng xếp hạng{examTitle ? ` – ${examTitle}` : ""}
      </h3>
      {isLoading && (
        <p className="text-xs text-gray-navy dark:text-light-blue">Đang tải…</p>
      )}
      {error && (
        <p className="text-xs text-red">
          {error instanceof Error ? error.message : "Lỗi"}
        </p>
      )}
      {entries && entries.length === 0 && (
        <p className="text-xs text-gray-navy dark:text-light-blue">
          Chưa có dữ liệu.
        </p>
      )}
      {entries && entries.length > 0 && (
        <ol className="space-y-1">
          {entries.map((e, i) => {
            const medal =
              i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
            const percent = Math.round(e.best_score * 100);
            return (
              <li
                key={e.user_id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/60 dark:bg-white/5 text-sm"
              >
                <span className="w-7 text-center font-semibold">{medal}</span>
                <span className="flex-1 text-gray-navy dark:text-light-blue text-xs">
                  User #{e.user_id}
                </span>
                <span className="font-bold text-dark-blue dark:text-white">
                  {percent}%
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
