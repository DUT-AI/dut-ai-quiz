"use client";

import React from "react";
import {
  ReviewHeader,
  ReviewFilterBar,
  ReviewLoadingState,
  ReviewEmptyState,
  ReviewQuestionCard,
  ReviewPagination,
} from "@/features/questions/components";
import { useQuestionsReview } from "@/features/questions/hooks/use-questions-review";

export default function QuestionsReviewPage() {
  const {
    page,
    limit,
    offset,
    lessonId,
    setLessonId,
    difficulty,
    setDifficulty,
    poolType,
    setPoolType,
    relatedQuestionsOnly,
    setRelatedQuestionsOnly,
    lessons,
    questions,
    totalCount,
    isLoading,
    isPlaceholderData,
    refetch,
    handleNextPage,
    handlePrevPage,
    handleResetFilters,
  } = useQuestionsReview();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      <ReviewHeader count={totalCount} />

      <ReviewFilterBar
        lessonId={lessonId}
        setLessonId={setLessonId}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        poolType={poolType}
        setPoolType={setPoolType}
        relatedQuestionsOnly={relatedQuestionsOnly}
        setRelatedQuestionsOnly={setRelatedQuestionsOnly}
        lessons={lessons}
        onReset={handleResetFilters}
      />

      {isLoading ? (
        <ReviewLoadingState />
      ) : questions.length === 0 ? (
        <ReviewEmptyState />
      ) : (
        <div className="space-y-6">
          {questions.map((q: any, qIdx: number) => (
            <ReviewQuestionCard
              key={q.id}
              question={q}
              index={offset + qIdx + 1}
              lessons={lessons}
              onSuccess={refetch}
            />
          ))}

          <ReviewPagination
            page={page}
            isPrevDisabled={page === 1 || isPlaceholderData}
            isNextDisabled={questions.length < limit || isPlaceholderData}
            onPrev={handlePrevPage}
            onNext={handleNextPage}
          />
        </div>
      )}
    </div>
  );
}
