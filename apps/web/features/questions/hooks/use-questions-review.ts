import { useState } from "react";
import { useQuestions, useLessons } from "@/lib/queries";

export function useQuestionsReview() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const offset = (page - 1) * limit;

  // Filters
  const [lessonId, setLessonId] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [poolType, setPoolType] = useState("");

  const { data: lessons = [] } = useLessons();

  const {
    data: questions = [],
    isLoading,
    isPlaceholderData,
    refetch: refetchPaginated,
  } = useQuestions({
    status: "DRAFT",
    lesson_id: lessonId || undefined,
    difficulty: difficulty || undefined,
    pool_type: poolType || undefined,
    limit: limit,
    offset: offset,
  });

  // Query to count total draft questions matching current filter
  const {
    data: allDraftQuestions = [],
    refetch: refetchAll,
  } = useQuestions({
    status: "DRAFT",
    lesson_id: lessonId || undefined,
    difficulty: difficulty || undefined,
    pool_type: poolType || undefined,
  });

  const refetch = async () => {
    await Promise.all([refetchPaginated(), refetchAll()]);
  };

  const handleNextPage = () => {
    if (questions.length === limit) {
      setPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const handleResetFilters = () => {
    setLessonId("");
    setDifficulty("");
    setPoolType("");
    setPage(1);
  };

  return {
    page,
    limit,
    offset,
    lessonId,
    setLessonId,
    difficulty,
    setDifficulty,
    poolType,
    setPoolType,
    lessons,
    questions,
    totalCount: allDraftQuestions.length,
    isLoading,
    isPlaceholderData,
    refetch,
    handleNextPage,
    handlePrevPage,
    handleResetFilters,
  };
}
