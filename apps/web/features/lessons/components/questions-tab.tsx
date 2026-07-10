"use client";

import React, { useState, useCallback } from "react";
import { ListRestart, FileJson, Plus, BookOpen, FileText } from "lucide-react";
import { AnimatePresence } from "framer-motion";

import { useQuestions, useDeleteQuestion } from "@/lib/queries";
import type { QuestionOut } from "@/lib/types";
import { PoolType } from "@/features/questions/types";
import QuestionEditorModal from "@/features/questions/components/question-editor-modal";
import BulkQuestionModal from "@/features/questions/components/bulk-question-modal";
import { PdfImport } from "@/components/pdf-import";

import { QuestionCard } from "../../questions/components/question-card";
import { AIExplanationModal } from "../../questions/components/ai-explanation-modal";
import { useAuth } from "@/context/auth-context";
import { ConfirmModal } from "@/components/molecules/confirm-modal";

interface QuestionsTabProps {
  lessonId: string;
  isAdminView?: boolean;
}

export function QuestionsTab({ lessonId, isAdminView = false }: QuestionsTabProps) {
  const [activePoolType, setActivePoolType] = useState<PoolType>("PRACTICE");

  // Questions query
  const { data: questions = [], isLoading: isLoadingQuestions } = useQuestions({
    lesson_id: lessonId,
    pool_type: activePoolType,
  });

  const { user, canManage } = useAuth();
  const isTeacher = isAdminView && canManage;

  const [explainingQuestion, setExplainingQuestion] = useState<QuestionOut | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionOut | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<QuestionOut | null>(null);

  const deleteMut = useDeleteQuestion();

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

  return (
    <div className="space-y-6 text-left">
      {/* Question manipulation buttons */}
      <div className="flex justify-between items-center gap-4 mb-4">
        <h2 className="text-xl font-bold text-dark-blue dark:text-white flex items-center gap-3">
          <ListRestart className="text-primary" />
          Danh sách câu hỏi ôn tập
        </h2>
        {isTeacher && (
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowBulkModal(true)}
              className="group relative px-6 py-4 rounded-[1.5rem] bg-indigo-50 dark:bg-white/5 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 border border-indigo-100 dark:border-white/5 hover:bg-indigo-100 transition-all shadow-sm"
            >
              <FileJson className="size-4" />
              Nhập JSON
            </button>
            <button
              onClick={() => setShowPdfModal(true)}
              className="group relative px-6 py-4 rounded-[1.5rem] bg-rose-50 dark:bg-white/5 text-rose-600 dark:text-rose-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 border border-rose-100 dark:border-white/5 hover:bg-rose-100 transition-all shadow-sm"
            >
              <FileText className="size-4" />
              Import PDF
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="group relative px-6 py-4 rounded-[1.5rem] bg-gradient-to-br from-primary to-pink-500 text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-nowrap"
            >
              <Plus className="size-4" />
              Thêm câu hỏi
            </button>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      {isTeacher && (
        <div className="flex border-b border-gray-100 dark:border-white/10 pb-2 gap-6 overflow-x-auto select-none">
          {([
            { id: "PRACTICE", label: "Luyện tập", icon: "🏋️" },
            { id: "EXAM", label: "Kiểm tra", icon: "📝" },
            { id: "GAME", label: "Trò chơi", icon: "🎮" },
          ] as const).map((t) => {
            const isActive = activePoolType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActivePoolType(t.id)}
                className={`pb-2 text-sm font-bold border-b-2 transition-all relative flex items-center gap-1.5 ${isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-navy opacity-60 hover:opacity-100 dark:text-light-blue"
                  }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {isLoadingQuestions ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-gray-100 dark:bg-white/5 animate-pulse rounded-[2rem] w-full"
            />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[2rem] opacity-35">
          <BookOpen className="size-16 mx-auto mb-4" />
          <p className="font-bold text-lg text-dark-blue dark:text-white">
            {activePoolType === "PRACTICE" && "Hiện tại bài học này chưa cập nhật câu hỏi ôn tập."}
            {activePoolType === "EXAM" && "Hiện tại bài học này chưa cập nhật câu hỏi kiểm tra."}
            {activePoolType === "GAME" && "Hiện tại bài học này chưa cập nhật câu hỏi trò chơi."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {questions.map((q, idx) => (
            <QuestionCard
              key={q.id}
              q={q}
              idx={idx}
              onExplain={handleExplain}
              onEdit={isTeacher ? handleEdit : undefined}
              onDelete={isTeacher ? handleDelete : undefined}
            />
          ))}
        </div>
      )}

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
