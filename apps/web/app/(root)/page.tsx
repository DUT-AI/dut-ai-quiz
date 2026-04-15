"use client";
import Game from "@/components/molecules/game";
import MaxWidthWrapper from "@/components/atoms/max-width-wrapper";
import Score from "@/components/atoms/score";
import Subjects from "@/components/atoms/subjects";
import { useQuestionStore } from "@/store/quiz-store";
import { useEffect } from "react";
import { MotionDiv } from "@/components/animated/motion-div";
import { cn } from "@/lib/utils";

export default function Home() {
  const {
    fetchExams,
    exams,
    listLoading,
    listError,
    selectedExam,
    hasCompleteAll,
    reset,
    sessionError,
    sessionLoading,
  } = useQuestionStore();

  useEffect(() => {
    void fetchExams();
  }, [fetchExams]);

  return (
    <MaxWidthWrapper
      className={cn(
        selectedExam && "xl:place-content-center",
        "grid px-6 grid-cols-1 md:grid-cols-2 gap-10 xl:gap-20 lg:px-0 relative z-50 h-full"
      )}
    >
      {listError && (
        <div className="md:col-span-2 rounded-xl bg-red-500/10 text-red-700 dark:text-red-300 p-4 text-sm">
          {listError}
          <span className="block mt-1 opacity-80">
            Kiểm tra API đang chạy, CORS và cookie đăng nhập (hoặc AUTH_DEV_BYPASS +
            role student cho làm bài).
          </span>
        </div>
      )}
      {sessionError && (
        <div className="md:col-span-2 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-100 p-4 text-sm">
          {sessionError}
        </div>
      )}

      {!selectedExam && (
        <>
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col xs:gap-4 md:gap-10 lg:mt-28 xl:mt-0"
          >
            <h1 className="xs:text-4xl md:text-5xl font-normal text-dark-blue dark:text-white xl:text-6xl 2xl:text-6xl">
              Welcome to the <span className="font-bold">DUT AI Quiz</span>
            </h1>
            <p className="text-gray-navy italic dark:text-light-blue xs:text-sm xl:text-xl">
              Chọn một đề đã xuất bản để bắt đầu (dữ liệu từ API).
            </p>
          </MotionDiv>
          <MotionDiv
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-y-4 xl:gap-y-6 justify-center w-full"
          >
            {listLoading && (
              <p className="text-gray-navy dark:text-light-blue">Đang tải đề…</p>
            )}
            {!listLoading && exams.length === 0 && !listError && (
              <p className="text-gray-navy dark:text-light-blue">
                Chưa có đề nào. Hãy tạo đề trên hệ thống quản trị và xuất bản.
              </p>
            )}
            <Subjects data={exams} />
            {sessionLoading && (
              <p className="text-sm text-gray-navy dark:text-light-blue">
                Đang mở bài…
              </p>
            )}
          </MotionDiv>
        </>
      )}
      {selectedExam && hasCompleteAll === false && <Game />}
      {hasCompleteAll && (
        <>
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col xs:gap-3 md:gap-6 h-full lg:mt-20"
          >
            <h1 className="xs:text-4xl md:text-5xl font-normal text-dark-blue dark:text-white xl:text-6xl">
              Hoàn thành bài thi
            </h1>
            <p className="xs:text-4xl md:text-5xl font-bold text-dark-blue dark:text-white xl:text-6xl">
              Điểm của bạn
            </p>
          </MotionDiv>
          <MotionDiv
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col justify-center gap-y-4"
          >
            <Score />
            <button
              type="button"
              className="w-full bg-purple py-4 px-5 rounded-xl shadow-lg text-white font-semibold text-lg text-center"
              onClick={reset}
            >
              Làm đề khác
            </button>
          </MotionDiv>
        </>
      )}
    </MaxWidthWrapper>
  );
}
