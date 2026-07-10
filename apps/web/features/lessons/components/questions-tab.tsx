"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

import { useQuestions, useDeleteQuestion } from "@/lib/queries";
import type { QuestionOut } from "@/lib/types";
import { PoolType } from "@/features/questions/types";
import QuestionEditorModal from "@/features/questions/components/question-editor-modal";
import BulkQuestionModal from "@/features/questions/components/bulk-question-modal";
import { PdfImport } from "@/components/pdf-import";

import { AIExplanationModal } from "../../questions/components/ai-explanation-modal";
import { useAuth } from "@/context/auth-context";
import { ConfirmModal } from "@/components/molecules/confirm-modal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchBar } from "@/components/ui/search-bar";

import { QuestionsTabHeader } from "./questions-tab-header";
import { QuestionsTabList } from "./questions-tab-list";

interface QuestionsTabProps {
  lessonId: string;
  isAdminView?: boolean;
  lessonName?: string;
}

export function QuestionsTab({ lessonId, isAdminView = false, lessonName }: QuestionsTabProps) {
  const [activePoolType, setActivePoolType] = useState<PoolType>("PRACTICE");
  const [searchQuery, setSearchQuery] = useState("");

  // Questions query for all pool types under this lesson
  const { data: allQuestions = [], isLoading: isLoadingQuestions } = useQuestions({
    lesson_id: lessonId,
  });

  const { canManage } = useAuth();
  const isTeacher = isAdminView && canManage;

  const [explainingQuestion, setExplainingQuestion] = useState<QuestionOut | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionOut | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<QuestionOut | null>(null);

  const deleteMut = useDeleteQuestion();

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

  // Questions matching active pool type
  const filteredQuestions = useMemo(() => {
    return searchedQuestions.filter((q) => q.pool_type === activePoolType);
  }, [searchedQuestions, activePoolType]);

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
    setEditingQuestion(q);
  }, []);

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

  return (
    <div className="space-y-8 text-left">
      {/* Redesigned Header using subcomponent */}
      <QuestionsTabHeader
        lessonName={lessonName}
        activePoolType={activePoolType}
        isTeacher={isTeacher}
        questionsCount={filteredQuestions.length}
        onAddClick={() => setShowAddModal(true)}
        onBulkClick={() => setShowBulkModal(true)}
        onPdfClick={() => setShowPdfModal(true)}
      />

      {/* Filter and Search Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-zinc-800/80">
        {isTeacher && (
          <Tabs
            value={activePoolType}
            onValueChange={(val) => {
              setActivePoolType(val as PoolType);
            }}
            className="w-full md:w-auto"
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
        )}

        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={handleClearSearch}
          placeholder="Tìm kiếm câu hỏi..."
          containerClassName="w-full md:max-w-xs shrink-0"
        />
      </div>

      {/* Redesigned Questions list using subcomponent */}
      <QuestionsTabList
        isLoading={isLoadingQuestions}
        questions={filteredQuestions}
        activePoolType={activePoolType}
        isTeacher={isTeacher}
        onExplain={handleExplain}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchQuery={searchQuery}
        onClearSearch={handleClearSearch}
      />

      {/* Modals and overlay panels */}
      <AnimatePresence>
        {explainingQuestion && (
          <AIExplanationModal question={explainingQuestion} onClose={handleCloseModal} />
        )}
        {showAddModal && (
          <QuestionEditorModal
            lessonId={lessonId}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => { }}
          />
        )}
        {editingQuestion && (
          <QuestionEditorModal
            lessonId={lessonId}
            initialData={editingQuestion}
            onClose={() => setEditingQuestion(null)}
            onSuccess={() => { }}
          />
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
    </div>
  );
}



