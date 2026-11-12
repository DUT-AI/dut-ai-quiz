"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Trash2, Check } from "lucide-react";

import { useQuestions, usePaginatedQuestions, useDeleteQuestion, useBulkDeleteQuestions } from "@/lib/queries";
import type { QuestionOut } from "@/lib/types";
import { PoolType } from "@/features/questions/types";
import { PdfImport } from "@/components/pdf-import";
import { useAuth } from "@/context/auth-context";
import { ConfirmModal } from "@/components/molecules/confirm-modal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchBar } from "@/components/ui/search-bar";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { ReviewPagination } from "@/features/questions/components/review-pagination";
import { cn } from "@/lib/utils";

import {
  AIExplanationModal,
  BulkQuestionModal,
  DifficultyFilter,
  QuestionsList,
} from "@/features/questions/components";

import { QuestionsTabHeader } from "./questions-tab-header";

interface QuestionsTabProps {
  lessonId: string;
  isAdminView?: boolean;
  lessonName?: string;
}

export function QuestionsTab({ lessonId, isAdminView = false, lessonName }: QuestionsTabProps) {
  const router = useRouter();
  const [activePoolType, setActivePoolType] = useState<PoolType>("PRACTICE");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery.trim(), 400);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [difficultyFilter, setDifficultyFilter] = useState<"ALL" | "EASY" | "MEDIUM" | "HARD">("ALL");

  // Reset page when filter / search changes
  useEffect(() => {
    setPage(1);
  }, [activePoolType, difficultyFilter, debouncedSearch]);

  // Paginated Questions query directly from server
  const {
    data: paginatedData,
    isLoading: isLoadingQuestions,
    isPlaceholderData,
  } = usePaginatedQuestions({
    lesson_id: lessonId,
    pool_type: activePoolType,
    difficulty: difficultyFilter === "ALL" ? undefined : difficultyFilter,
    search: debouncedSearch || undefined,
    page: page,
    page_size: pageSize,
  });

  const questions = useMemo(() => paginatedData?.items || [], [paginatedData]);
  const totalCount = paginatedData?.total || 0;
  const totalPages = paginatedData?.total_pages || 1;

  // Lightweight queries for pool badge counts
  const { data: practiceCountData } = usePaginatedQuestions({
    lesson_id: lessonId,
    pool_type: "PRACTICE",
    search: debouncedSearch || undefined,
    page: 1,
    page_size: 1,
  });
  const { data: examCountData } = usePaginatedQuestions({
    lesson_id: lessonId,
    pool_type: "EXAM",
    search: debouncedSearch || undefined,
    page: 1,
    page_size: 1,
  });
  const { data: gameCountData } = usePaginatedQuestions({
    lesson_id: lessonId,
    pool_type: "GAME",
    search: debouncedSearch || undefined,
    page: 1,
    page_size: 1,
  });

  const counts = useMemo(() => ({
    PRACTICE: practiceCountData?.total ?? 0,
    EXAM: examCountData?.total ?? 0,
    GAME: gameCountData?.total ?? 0,
  }), [practiceCountData?.total, examCountData?.total, gameCountData?.total]);

  // Difficulty counts under current pool
  const { data: easyCountData } = usePaginatedQuestions({
    lesson_id: lessonId,
    pool_type: activePoolType,
    difficulty: "EASY",
    search: debouncedSearch || undefined,
    page: 1,
    page_size: 1,
  });
  const { data: mediumCountData } = usePaginatedQuestions({
    lesson_id: lessonId,
    pool_type: activePoolType,
    difficulty: "MEDIUM",
    search: debouncedSearch || undefined,
    page: 1,
    page_size: 1,
  });
  const { data: hardCountData } = usePaginatedQuestions({
    lesson_id: lessonId,
    pool_type: activePoolType,
    difficulty: "HARD",
    search: debouncedSearch || undefined,
    page: 1,
    page_size: 1,
  });

  const difficultyCounts = useMemo(() => ({
    ALL: counts[activePoolType] || 0,
    EASY: easyCountData?.total ?? 0,
    MEDIUM: mediumCountData?.total ?? 0,
    HARD: hardCountData?.total ?? 0,
  }), [activePoolType, counts, easyCountData?.total, mediumCountData?.total, hardCountData?.total]);

  const { canManageQuestions } = useAuth();
  const isTeacher = isAdminView && canManageQuestions;

  const [explainingQuestion, setExplainingQuestion] = useState<QuestionOut | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState<QuestionOut | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const deleteMut = useDeleteQuestion();
  const bulkDeleteMut = useBulkDeleteQuestions();

  // Reset selection when switching tab or filter or page
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activePoolType, difficultyFilter, debouncedSearch, page]);

  const handleEdit = useCallback((q: QuestionOut) => {
    router.push(`/teacher/lessons/${lessonId}/questions/${q.id}/edit`);
  }, [router, lessonId]);

  const handleDelete = useCallback(
    (q: QuestionOut) => {
      setDeletingQuestion(q);
    },
    []
  );

  const handleExplain = useCallback((q: QuestionOut) => {
    setExplainingQuestion(q);
  }, []);

  const handleCloseModal = useCallback(() => {
    setExplainingQuestion(null);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleClearDifficulty = useCallback(() => {
    setDifficultyFilter("ALL");
  }, []);

  const handleToggleSelect = useCallback((q: QuestionOut) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(q.id)) {
        next.delete(q.id);
      } else {
        next.add(q.id);
      }
      return next;
    });
  }, []);

  const isAllSelected = questions.length > 0 && selectedIds.size === questions.length;

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map((q) => q.id)));
    }
  }, [isAllSelected, questions]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.size === 0) return;
    try {
      await bulkDeleteMut.mutateAsync(Array.from(selectedIds));
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
    } catch (err) {
      console.error("Bulk delete failed", err);
    }
  };

  const handlePrevPage = () => {
    setPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setPage((p) => (p < totalPages ? p + 1 : p));
  };

  return (
    <div className="space-y-8 text-left">
      {isTeacher && (
        <>
          {/* Redesigned Header using subcomponent */}
          <QuestionsTabHeader
            lessonId={lessonId}
            lessonName={lessonName}
            activePoolType={activePoolType}
            isTeacher={isTeacher}
            questionsCount={totalCount}
            onAddClick={() => router.push(`/teacher/lessons/${lessonId}/questions/new`)}
            onBulkClick={() => setShowBulkModal(true)}
            onPdfClick={() => setShowPdfModal(true)}
          />

          {/* Filter and Search Section */}
          <div className="flex flex-col gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800/80">
            <div className="flex flex-col lg:flex-row lg:items-center lg:flex-wrap justify-between gap-4">
              <Tabs
                value={activePoolType}
                onValueChange={(val) => {
                  setActivePoolType(val as PoolType);
                  setDifficultyFilter("ALL");
                }}
                className="w-full lg:w-auto"
              >
                <TabsList className="bg-slate-100/80 dark:bg-zinc-900 border-none p-1 rounded-2xl">
                  <TabsTrigger
                    value="PRACTICE"
                    className="flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-black uppercase tracking-wider"
                  >
                    <span>🏋️</span>
                    <span>Luyện tập</span>
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-slate-200/60 dark:bg-zinc-800 text-[10px] opacity-80">
                      {counts.PRACTICE}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="EXAM"
                    className="flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-black uppercase tracking-wider"
                  >
                    <span>📝</span>
                    <span>Kiểm tra</span>
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-slate-200/60 dark:bg-zinc-800 text-[10px] opacity-80">
                      {counts.EXAM}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="GAME"
                    className="flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-black uppercase tracking-wider"
                  >
                    <span>🎮</span>
                    <span>Trò chơi</span>
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-slate-200/60 dark:bg-zinc-800 text-[10px] opacity-80">
                      {counts.GAME}
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <div className="w-full sm:w-44 shrink-0">
                  <DifficultyFilter
                    value={difficultyFilter}
                    onChange={setDifficultyFilter}
                    counts={difficultyCounts}
                  />
                </div>

                <SearchBar
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={handleClearSearch}
                  placeholder="Tìm kiếm câu hỏi..."
                  containerClassName="w-full sm:max-w-xs"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {!isTeacher && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
              Danh sách câu hỏi luyện tập
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Hiện có <span className="font-extrabold text-primary">{totalCount}</span> câu hỏi được tìm thấy.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-44 shrink-0">
              <DifficultyFilter
                value={difficultyFilter}
                onChange={setDifficultyFilter}
                counts={difficultyCounts}
              />
            </div>

            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={handleClearSearch}
              placeholder="Tìm kiếm câu hỏi..."
              containerClassName="w-full sm:max-w-xs"
            />
          </div>
        </div>
      )}

      {/* Teacher Bulk Selection Toolbar */}
      {isTeacher && questions.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-zinc-900/90 rounded-2xl border border-slate-200/60 dark:border-zinc-800 transition-all">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={questions.length === 0}
              className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-primary transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div
                className={cn(
                  "size-5 rounded-lg border-2 flex items-center justify-center transition-all",
                  isAllSelected
                    ? "bg-primary border-primary text-white"
                    : selectedIds.size > 0
                    ? "bg-primary/20 border-primary text-primary"
                    : "border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                )}
              >
                {isAllSelected && <Check className="size-3.5 stroke-[3]" />}
                {selectedIds.size > 0 && !isAllSelected && <div className="size-2 bg-primary rounded-sm" />}
              </div>
              <span>
                {isAllSelected
                  ? "Bỏ chọn tất cả trang này"
                  : `Chọn tất cả trang này (${questions.length})`}
              </span>
            </button>

            {selectedIds.size > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-black animate-in fade-in zoom-in-95 duration-150">
                Đã chọn {selectedIds.size} câu
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy chọn
                </button>
                <Button
                  size="sm"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-wider bg-red hover:bg-red/90 text-white h-9 px-4 rounded-xl shadow-md shadow-red/20 transition-all cursor-pointer active:scale-95"
                >
                  <Trash2 className="size-3.5" />
                  <span>Xóa {selectedIds.size} câu hỏi</span>
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Redesigned Questions list using subcomponent */}
      <QuestionsList
        isLoading={isLoadingQuestions}
        questions={questions}
        activePoolType={activePoolType}
        isTeacher={isTeacher}
        onExplain={handleExplain}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchQuery={debouncedSearch}
        onClearSearch={handleClearSearch}
        difficultyFilter={difficultyFilter}
        onClearDifficulty={handleClearDifficulty}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
      />

      {/* Server Pagination Controls */}
      {totalPages > 1 && (
        <ReviewPagination
          page={page}
          isPrevDisabled={page === 1 || isPlaceholderData}
          isNextDisabled={page >= totalPages || isPlaceholderData}
          onPrev={handlePrevPage}
          onNext={handleNextPage}
        />
      )}

      {/* Modals and overlay panels */}
      <AnimatePresence>
        {explainingQuestion && (
          <AIExplanationModal question={explainingQuestion} onClose={handleCloseModal} />
        )}

        {showBulkModal && (
          <BulkQuestionModal
            lessonId={lessonId}
            onClose={() => setShowBulkModal(false)}
            onSuccess={() => { }}
          />
        )}
        {showPdfModal && (
          <PdfImport
            lessonId={lessonId}
            onClose={() => setShowPdfModal(false)}
            onSuccess={() => setShowPdfModal(false)}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!deletingQuestion}
        title="Xóa câu hỏi"
        description="Bạn có chắc chắn muốn xóa câu hỏi này không?"
        confirmLabel="Xóa ngay"
        cancelLabel="Hủy"
        variant="danger"
        isLoading={deleteMut.isPending}
        onConfirm={async () => {
          if (deletingQuestion) {
            try {
              await deleteMut.mutateAsync(deletingQuestion.id);
            } catch (err) {
              console.error("Delete failed", err);
            } finally {
              setDeletingQuestion(null);
            }
          }
        }}
        onCancel={() => setDeletingQuestion(null)}
      />

      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        title="Xóa hàng loạt câu hỏi"
        description={`Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.size} câu hỏi đã chọn không? Thao tác này không thể hoàn tác.`}
        confirmLabel={`Xóa ${selectedIds.size} câu hỏi`}
        cancelLabel="Hủy"
        variant="danger"
        isLoading={bulkDeleteMut.isPending}
        onConfirm={handleBulkDeleteConfirm}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />
    </div>
  );
}



