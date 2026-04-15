"use client";
import { useMyAttempts, useExamsFull, usePracticeHistory } from "@/lib/queries";
import ImageBackground from "@/components/atoms/image-background";
import MaxWidthWrapper from "@/components/atoms/max-width-wrapper";
import type { AttemptOut } from "@/lib/types";

function statusBadge(status: string) {
  if (status === "COMPLETED")
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-green/20 text-green font-medium">
        Đã nộp
      </span>
    );
  if (status === "IN_PROGRESS")
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-medium">
        Đang làm
      </span>
    );
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-slate/10 text-gray-navy">
      {status}
    </span>
  );
}

function AttemptRow({
  attempt,
  examTitle,
}: {
  attempt: AttemptOut;
  examTitle?: string;
}) {
  const score =
    attempt.score !== null ? `${Math.round(attempt.score * 100)}%` : "—";
  const started = new Date(attempt.started_at).toLocaleString("vi");
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate/20 shadow-sm border border-slate/10 dark:border-white/10">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-dark-blue dark:text-white text-sm truncate">
          {examTitle ?? `Kỳ thi #${attempt.exam_id.slice(0, 8)}`}
        </p>
        <p className="text-xs text-gray-navy dark:text-light-blue mt-0.5">
          {started}
          {attempt.tab_out_count > 0
            ? ` · ${attempt.tab_out_count} lần rời tab`
            : ""}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {statusBadge(attempt.status)}
        <span className="font-bold text-dark-blue dark:text-white text-sm w-10 text-right">
          {score}
        </span>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { data: attempts, isLoading: loadingAttempts } = useMyAttempts();
  const { data: exams } = useExamsFull();
  const { data: practiceHistory, isLoading: loadingPractice } =
    usePracticeHistory();

  const examMap = new Map(exams?.map((e) => [e.id, e.title]) ?? []);

  return (
    <div className="relative">
      <ImageBackground />
      <MaxWidthWrapper className="py-8">
        <h1 className="text-2xl font-bold text-dark-blue dark:text-white mb-6">
          Lịch sử làm bài
        </h1>

        {/* Exam history */}
        <section className="mb-8">
          <h2 className="font-semibold text-sm text-gray-navy dark:text-light-blue uppercase tracking-wide mb-3">
            Kỳ thi
          </h2>
          {loadingAttempts && (
            <p className="text-sm text-gray-navy dark:text-light-blue">
              Đang tải…
            </p>
          )}
          {attempts && attempts.length === 0 && (
            <p className="text-sm text-gray-navy dark:text-light-blue text-center py-6">
              Chưa tham gia kỳ thi nào.
            </p>
          )}
          <div className="space-y-2">
            {attempts?.map((a) => (
              <AttemptRow
                key={a.id}
                attempt={a}
                examTitle={examMap.get(a.exam_id)}
              />
            ))}
          </div>
        </section>

        {/* Practice history */}
        <section>
          <h2 className="font-semibold text-sm text-gray-navy dark:text-light-blue uppercase tracking-wide mb-3">
            Luyện tập
          </h2>
          {loadingPractice && (
            <p className="text-sm text-gray-navy dark:text-light-blue">
              Đang tải…
            </p>
          )}
          {practiceHistory && practiceHistory.length === 0 && (
            <p className="text-sm text-gray-navy dark:text-light-blue text-center py-6">
              Chưa có lịch sử luyện tập.
            </p>
          )}
          <div className="space-y-2">
            {(practiceHistory as Record<string, unknown>[] | undefined)?.map(
              (row) => {
                const id = String(row.id ?? "");
                const started = row.started_at
                  ? new Date(String(row.started_at)).toLocaleString("vi")
                  : "";
                const status = String(row.status ?? "");
                const ql = Number(row.question_limit ?? 0);
                return (
                  <div
                    key={id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate/20 shadow-sm border border-slate/10 dark:border-white/10"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-dark-blue dark:text-white text-sm">
                        Phiên luyện tập – {ql} câu
                      </p>
                      <p className="text-xs text-gray-navy dark:text-light-blue mt-0.5">
                        {started}
                      </p>
                    </div>
                    {statusBadge(status)}
                  </div>
                );
              }
            )}
          </div>
        </section>
      </MaxWidthWrapper>
    </div>
  );
}
