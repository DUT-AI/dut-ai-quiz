"use client";
import type { ExamTile } from "@/lib/types";
import { useQuestionStore } from "@/store/quiz-store";
import Image from "next/image";
import { backgroundColors, tintForTitle } from "@/lib/utils";

type SubjectsProps = {
  data: ExamTile[];
};

const Subjects = ({ data }: SubjectsProps) => {
  const selectExam = useQuestionStore((s) => s.selectExam);
  const sessionLoading = useQuestionStore((s) => s.sessionLoading);

  return (
    <>
      {data.map((exam) => (
        <button
          key={exam.id}
          type="button"
          disabled={sessionLoading}
          onClick={() => void selectExam(exam)}
          className="flex items-center gap-x-4 bg-[#fff] dark:bg-slate py-3 px-4 xl:py-5 rounded-2xl shadow-lg ring-1 hover:ring-purple transition-all disabled:opacity-60"
        >
          <div
            className="p-2 rounded-lg"
            style={{
              backgroundColor:
                backgroundColors[exam.title] ?? tintForTitle(exam.title),
            }}
          >
            <Image src={exam.icon} alt="" width={30} height={30} />
          </div>
          <p className="dark:text-white text-xl font-semibold text-left">
            {exam.title}
          </p>
        </button>
      ))}
    </>
  );
};

export default Subjects;
