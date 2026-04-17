"use client";

import { cn } from "@/lib/utils";
import { useQuestionStore } from "@/store/quiz-store";
import { useState, useEffect } from "react";
import Answer from "../atoms/answer";
import type { QuizOption } from "@/lib/types";

type AnswersProps = {
  options: QuizOption[];
  questionId: string;
  goNextQuestion: () => void;
};

const Answers = ({ options, questionId, goNextQuestion }: AnswersProps) => {
  const { questions, selectAnswer, finishQuiz } = useQuestionStore();
  const stored = questions.find((q) => q.question_id === questionId);
  const savedId = stored?.userSelectedOptionId ?? "";

  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSelectedOptionId(savedId);
    setSubmitted(!!savedId);
  }, [questionId, savedId]);

  const answerLabels = ["A", "B", "C", "D", "E", "F"].slice(0, options.length);

  const qIndex = questions.findIndex((q) => q.question_id === questionId);
  const isLast = qIndex >= 0 && qIndex === questions.length - 1;

  const handleSelectOption = (id: string) => {
    if (submitted) return;
    setSelectedOptionId((prev) => (prev === id ? "" : id));
  };

  const handlePrimary = async () => {
    if (submitted) {
      if (isLast) {
        await finishQuiz();
        return;
      }
      goNextQuestion();
      setSubmitted(false);
      setSelectedOptionId("");
      return;
    }
    if (!selectedOptionId) return;
    await selectAnswer(questionId, selectedOptionId);
    setSubmitted(true);
  };

  return (
    <>
      <ul className="flex flex-col gap-y-4 justify-center w-full">
        {options.map((opt, index) => (
          <Answer
            key={opt.id}
            optionId={opt.id}
            optionText={opt.text}
            selectedOptionId={selectedOptionId}
            isCorrect={null}
            showGraded={false}
            handleSelectOption={handleSelectOption}
            index={index}
            answerLabels={answerLabels}
          />
        ))}
      </ul>

      <button
        type="button"
        onClick={() => void handlePrimary()}
        className={cn(
          "w-full bg-primary py-4 px-5 rounded-xl shadow-lg text-white font-semibold text-lg text-center"
        )}
      >
        {submitted
          ? isLast
            ? "Nộp bài"
            : "Câu tiếp"
          : "Ghi nhận đáp án"}
      </button>
    </>
  );
};

export default Answers;
