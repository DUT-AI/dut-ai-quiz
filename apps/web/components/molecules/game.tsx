"use client";
import { useQuestionStore } from "@/store/quiz-store";
import CurrentQuestion from "../atoms/current-question";
import Answers from "./answers";
import Progress from "../atoms/progress";
import { MotionDiv } from "../animated/motion-div";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTabOut } from "@/hooks/use-tab-out";

const Game = () => {
  const { questions, currentQuestion, goNextQuestion, attemptId, expiresAt } =
    useQuestionStore();
  useTabOut(attemptId);

  const question = questions[currentQuestion];

  const [shouldAnimateQuestion, setShouldAnimateQuestion] = useState(false);
  const [shouldAnimateAnswers, setShouldAnimateAnswers] = useState(false);

  useEffect(() => {
    setShouldAnimateQuestion(true);
    setShouldAnimateAnswers(true);
  }, [currentQuestion]);

  if (!question) {
    return (
      <p className="text-gray-navy dark:text-light-blue">Đang tải câu hỏi…</p>
    );
  }

  return (
    <>
      <div className="flex flex-col xl:justify-center xl:items-center gap-2 lg:px-6 w-full max-h-96 lg:mt-16 xl:mt-0 xl:max-h-full">
        {expiresAt && (
          <p className="text-sm text-gray-navy dark:text-light-blue w-full">
            Hết hạn (UTC): {new Date(expiresAt).toLocaleString()}
          </p>
        )}
        <AnimatePresence
          initial={false}
          mode="wait"
          onExitComplete={() => setShouldAnimateQuestion(true)}
        >
          {shouldAnimateQuestion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key={currentQuestion}
              className="flex flex-col gap-4"
            >
              <p className="italic xs:text-sm md:text-md text-gray-navy dark:text-light-blue xl:text-xl">
                Câu {currentQuestion + 1} / {questions.length}
              </p>
              <CurrentQuestion data={question} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence
          initial={false}
          mode="wait"
          onExitComplete={() => setShouldAnimateQuestion(true)}
        >
          {shouldAnimateQuestion && (
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="xs:mt-2 lg:mt-auto xl:mt-20 w-full "
              key={currentQuestion}
            >
              <Progress
                total={questions.length}
                currentIndex={currentQuestion + 1}
              />
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence
        initial={false}
        mode="wait"
        onExitComplete={() => setShouldAnimateAnswers(true)}
      >
        {shouldAnimateAnswers && (
          <MotionDiv
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col gap-y-4 justify-center w-full"
            key={currentQuestion}
          >
            <Answers
              options={question.options}
              questionId={question.question_id}
              goNextQuestion={goNextQuestion}
            />
          </MotionDiv>
        )}
      </AnimatePresence>
    </>
  );
};

export default Game;
