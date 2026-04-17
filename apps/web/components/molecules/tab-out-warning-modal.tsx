"use client";

import { useQuestionStore } from "@/store/quiz-store";

export function TabOutWarningModal() {
  const showWarnModal = useQuestionStore((s) => s.showWarnModal);
  const setWarnModal = useQuestionStore((s) => s.setWarnModal);
  const tabOutCount = useQuestionStore((s) => s.tabOutCount);

  if (!showWarnModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex flex-col gap-5 text-center">
          <div className="text-5xl" aria-hidden>
            ⚠️
          </div>

          <h2 className="text-xl font-bold text-dark-blue dark:text-white">
            Bạn vừa rời khỏi trang thi!
          </h2>

          <p className="text-gray-navy dark:text-light-blue text-sm leading-relaxed">
            Hệ thống ghi nhận bạn đã rời tab lần{" "}
            <span className="font-bold text-dark-blue dark:text-white">
              {tabOutCount}
            </span>
            .
            <br />
            Nếu rời tab thêm lần nữa, bài thi sẽ{" "}
            <span className="font-bold text-red-500">tự động nộp</span> và chấm
            theo đáp án đã chọn.
          </p>

          <button
            type="button"
            onClick={() => setWarnModal(false)}
            className="w-full bg-primary py-3 px-5 rounded-xl text-white font-semibold text-base hover:opacity-90 transition-opacity"
          >
            Tôi hiểu, tiếp tục làm bài
          </button>
        </div>
      </div>
    </div>
  );
}
