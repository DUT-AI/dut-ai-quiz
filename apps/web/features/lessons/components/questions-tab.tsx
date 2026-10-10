"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Trash2, Check } from "lucide-react";

import { useQuestions, useDeleteQuestion, useBulkDeleteQuestions } from "@/lib/queries";
import type { QuestionOut } from "@/lib/types";
import { PoolType } from "@/features/questions/types";
import { PdfImport } from "@/components/pdf-import";
import { useAuth } from "@/context/auth-context";
import { ConfirmModal } from "@/components/molecules/confirm-modal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchBar } from "@/components/ui/search-bar";
import { Button } from "@/components/ui/button";
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

  // Questions query for all pool types under this lesson
  const { data: allQuestions = [], isLoading: isLoadingQuestions } = useQuestions({
    lesson_id: lessonId,
  });

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

  const [difficultyFilter, setDifficultyFilter] = useState<"ALL" | "EASY" | "MEDIUM" | "HARD">("ALL");

  // Reset selection when switching tab or filter
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activePoolType, difficultyFilter, searchQuery]);

  // Local client-side realtime filtering across all tabs
  const searchedQuestions = useMemo(() => {
    if (!searchQuery.trim()) return allQuestions;
    const term = searchQuery.toLowerCase().trim();
    return allQuestions.filter((q) => {
      const matchContent = q.content?.toLowerCase().includes(term);
      const matchSolution = q.solution?.toLowerCase().includes(term);
      const matchOptions = q.options?.some((o) => o.text?.toLowerCase().includes(term));
      return matchContent || matchSolution || matchOptions;
    });
  }, [allQuestions, searchQuery]);

  // Questions matching active pool type and difficulty filter
  const filteredQuestions = useMemo(() => {
    return searchedQuestions.filter((q) => {
      const matchPool = q.pool_type === activePoolType;
      const matchDifficulty = difficultyFilter === "ALL" || q.difficulty === difficultyFilter;
      return matchPool && matchDifficulty;
    });
  }, [searchedQuestions, activePoolType, difficultyFilter]);

  // Dynamic counts for each category based on search results
  const counts = useMemo(() => {
    const res = { PRACTICE: 0, EXAM: 0, GAME: 0 };
    searchedQuestions.forEach((q) => {
      if (q.pool_type && res[q.pool_type] !== undefined) {
        res[q.pool_type]++;
      }
    });
    return res;
  }, [searchedQuestions]);

  // Dynamic counts for each difficulty level based on current search and active pool
  const difficultyCounts = useMemo(() => {
    const res: Record<"ALL" | "EASY" | "MEDIUM" | "HARD", number> = { ALL: 0, EASY: 0, MEDIUM: 0, HARD: 0 };
    const activePoolQuestions = searchedQuestions.filter((q) => q.pool_type === activePoolType);
    res.ALL = activePoolQuestions.length;
    activePoolQuestions.forEach((q) => {
      if (q.difficulty) {
        const diffKey = q.difficulty as "EASY" | "MEDIUM" | "HARD";
        if (res[diffKey] !== undefined) {
          res[diffKey]++;
        }
      }
    });
    return res;
  }, [searchedQuestions, activePoolType]);

  // Auto-switch tabs to the first category that has matching questions when searching
  useEffect(() => {
    if (!searchQuery.trim()) return;

    // Check if the current tab has any matches
    const activeHasMatches = searchedQuestions.some((q) => q.pool_type === activePoolType);
    if (activeHasMatches) return;

    // If not, find the first category that has results and switch to it
    const pools: PoolType[] = ["PRACTICE", "EXAM", "GAME"];
    for (const p of pools) {
      if (searchedQuestions.some((q) => q.pool_type === p)) {
        setActivePoolType(p);
        break;
      }
    }
  }, [searchQuery, searchedQuestions, activePoolType]);

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

  const isAllSelected = filteredQuestions.length > 0 && selectedIds.size === filteredQuestions.length;

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map((q) => q.id)));
    }
  }, [isAllSelected, filteredQuestions]);

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

  return (
    <div className="space-y-8 text-left">
      {isTeacher && (
        <>
          {/* Redesigned Header using subcomponent */}
          <QuestionsTabHeader
            lessonName={lessonName}
            activePoolType={activePoolType}
            isTeacher={isTeacher}
            questionsCount={filteredQuestions.length}
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
              Hiện có <span className="font-extrabold text-primary">{filteredQuestions.length}</span> câu hỏi được hiển thị.
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
      {isTeacher && filteredQuestions.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-zinc-900/90 rounded-2xl border border-slate-200/60 dark:border-zinc-800 transition-all">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={filteredQuestions.length === 0}
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
                  ? "Bỏ chọn tất cả"
                  : `Chọn tất cả (${filteredQuestions.length})`}
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
        questions={filteredQuestions}
        activePoolType={activePoolType}
        isTeacher={isTeacher}
        onExplain={handleExplain}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchQuery={searchQuery}
        onClearSearch={handleClearSearch}
        difficultyFilter={difficultyFilter}
        onClearDifficulty={handleClearDifficulty}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
      />

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



