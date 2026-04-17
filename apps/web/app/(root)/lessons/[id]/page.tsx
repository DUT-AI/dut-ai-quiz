"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLessons, useQuestions, useDeleteQuestion } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  ListRestart,
  Sparkles,
  X,
  Lightbulb,
  Plus,
  Edit3,
  Trash2,
  Check,
  XCircle,
  RotateCcw,
  FileJson
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { renderMathInHTML } from "@/lib/render-math";
import type { QuestionOut } from "@/lib/types";
import QuestionEditorModal from "@/components/lessons/question-editor-modal";
import BulkQuestionModal from "@/components/lessons/bulk-question-modal";

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: lessons = [] } = useLessons();
  const { data: questions = [], isLoading } = useQuestions({ 
    lesson_id: id,
    pool_type: "PRACTICE" 
  });

  const lesson = useMemo(() => lessons.find(l => l.id === id), [lessons, id]);
  const [explainingQuestion, setExplainingQuestion] = useState<QuestionOut | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionOut | null>(null);

  const deleteMut = useDeleteQuestion();

  const handleEdit = useCallback((q: QuestionOut) => {
    setEditingQuestion(q);
  }, []);

  const handleDelete = useCallback(async (q: QuestionOut) => {
    if (confirm("Bạn có chắc chắn muốn xóa câu hỏi này không?")) {
      try {
        await deleteMut.mutateAsync(q.id);
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  }, [deleteMut]);

  const handleExplain = useCallback((q: QuestionOut) => {
    setExplainingQuestion(q);
  }, []);

  const handleCloseModal = useCallback(() => {
    setExplainingQuestion(null);
  }, []);

  const Header = useMemo(() => {
    if (!lesson) return null;
    return (
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 text-left">
        <div>
          <span className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-2 block">
            BÀI HỌC {lesson.order}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-dark-blue dark:text-white mb-4">
            {lesson.name}
          </h1>
          <p className="text-lg text-gray-navy dark:text-light-blue max-w-2xl opacity-70">
            {lesson.description || "Dưới đây là danh sách các câu hỏi và bài tập để rèn luyện."}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="hidden sm:block p-4 rounded-3xl bg-white dark:bg-navy-blue shadow-lg border border-white/10 text-center min-w-[120px]">
            <p className="text-xs font-bold text-gray-navy opacity-50 uppercase tracking-tighter">Câu hỏi</p>
            <p className="text-2xl font-black text-primary">{questions.length}</p>
          </div>

          <button
            onClick={() => setShowBulkModal(true)}
            className="group relative px-6 py-5 rounded-[2rem] bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 border border-indigo-100 dark:border-white/5 hover:bg-indigo-100 transition-all shadow-lg"
          >
            <div className="size-6 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <FileJson className="size-4" />
            </div>
            Nhập JSON
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="group relative px-8 py-5 rounded-[2rem] bg-gradient-to-br from-primary to-pink-500 text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-3 shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all text-nowrap"
          >
            <div className="size-6 rounded-lg bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform">
              <Plus className="size-4" />
            </div>
            Thêm câu hỏi
          </button>
        </div>
      </div>
    );
  }, [lesson, questions.length]);

  if (!lesson && !isLoading && lessons.length > 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Không tìm thấy bài học</h2>
        <Button onClick={() => router.push("/lessons")}>Quay lại danh sách</Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <button
        onClick={() => router.push("/lessons")}
        className="flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all mb-4 group"
      >
        <ArrowLeft className="size-5" />
        Quay lại danh sách bài học
      </button>

      {Header}

      <div className="space-y-6 text-left">
        <h2 className="text-xl font-bold text-dark-blue dark:text-white flex items-center gap-3">
          <ListRestart className="text-primary" />
          Danh sách câu hỏi ôn tập
        </h2>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-100 dark:bg-white/5 animate-pulse rounded-3xl w-full" />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl opacity-30">
            <BookOpen className="size-16 mx-auto mb-4" />
            <p className="font-bold">Hiện tại bài học này chưa cập nhật câu hỏi.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                q={q}
                idx={idx}
                onExplain={handleExplain}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {explainingQuestion && (
          <AIExplanationModal
            question={explainingQuestion}
            onClose={handleCloseModal}
          />
        )}
        {showAddModal && (
          <QuestionEditorModal
            lessonId={id as string}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => { }}
          />
        )}
        {editingQuestion && (
          <QuestionEditorModal
            lessonId={id as string}
            initialData={editingQuestion}
            onClose={() => setEditingQuestion(null)}
            onSuccess={() => { }}
          />
        )}
        {showBulkModal && (
          <BulkQuestionModal
            lessonId={id as string}
            onClose={() => setShowBulkModal(false)}
            onSuccess={() => { }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const QuestionCard = React.memo(({ q, idx, onExplain, onEdit, onDelete }: {
  q: QuestionOut;
  idx: number;
  onExplain: (q: QuestionOut) => void;
  onEdit: (q: QuestionOut) => void;
  onDelete: (q: QuestionOut) => void;
}) => {
  const contentHtml = useMemo(() => renderMathInHTML(q.content), [q.content]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const handleSelect = (optionId: string) => {
    if (isRevealed) return;
    setSelectedId(optionId);
    setIsRevealed(true);
  };

  const handleReset = () => {
    setSelectedId(null);
    setIsRevealed(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.05 }}
    >
      <Card className={cn(
        "border-none shadow-lg bg-white dark:bg-navy-blue/60 rounded-3xl overflow-hidden hover:shadow-xl transition-all border-l-4",
        isRevealed
          ? (q.options.find(o => o.id === selectedId)?.is_correct ? "border-l-green" : "border-l-red")
          : "border-l-primary/20"
      )}>
        <CardContent className="p-8">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex sm:flex-col items-center justify-between sm:justify-start gap-4 shrink-0">
              <div className="size-14 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center font-bold text-gray-navy opacity-50">
                #{idx + 1}
              </div>

              {isRevealed && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleReset}
                  className="size-10 rounded-xl hover:bg-primary/10 text-primary"
                  title="Làm lại"
                >
                  <RotateCcw className="size-5" />
                </Button>
              )}
            </div>

            <div className="flex-1 space-y-8">
              <div
                className="text-xl font-medium text-dark-blue dark:text-white leading-relaxed whitespace-pre-wrap select-text"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />

              <div className="grid grid-cols-1 gap-3">
                {q.options.map((opt, i) => {
                  const isSelected = selectedId === opt.id;
                  const isCorrect = opt.is_correct;

                  let statusStyles = "bg-gray-50/50 dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-primary/30";
                  if (isRevealed) {
                    if (isCorrect) {
                      statusStyles = "bg-green/10 border-green/30 text-green ring-2 ring-green/20";
                    } else if (isSelected) {
                      statusStyles = "bg-red/10 border-red/30 text-red opacity-100";
                    } else {
                      statusStyles = "opacity-40 grayscale-[0.5]";
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      disabled={isRevealed}
                      onClick={() => handleSelect(opt.id)}
                      className={cn(
                        "group relative w-full px-6 py-4 rounded-2xl border transition-all flex gap-4 items-center text-left",
                        statusStyles,
                        !isRevealed && "active:scale-[0.98] hover:translate-x-1"
                      )}
                    >
                      <div className={cn(
                        "size-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors",
                        isRevealed && isCorrect ? "bg-green text-white" :
                          isSelected && !isCorrect ? "bg-red text-white" :
                            "bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 text-primary"
                      )}>
                        {isRevealed && isCorrect ? <Check className="size-4" /> :
                          isSelected && !isCorrect ? <XCircle className="size-4" /> :
                            String.fromCharCode(65 + i)}
                      </div>
                      <span
                        className="font-medium select-text"
                        dangerouslySetInnerHTML={{ __html: renderMathInHTML(opt.text) }}
                      />

                      {isSelected && !isRevealed && (
                        <motion.div layoutId="selection" className="absolute inset-0 border-2 border-primary rounded-2xl pointer-events-none" />
                      )}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {isRevealed && q.solution && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-8 p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-3">
                      <h4 className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest opacity-60">
                        <Lightbulb className="size-3" />
                        Hướng dẫn chi tiết
                      </h4>
                      <div
                        className="text-dark-blue dark:text-white leading-relaxed font-medium whitespace-pre-wrap select-text"
                        dangerouslySetInnerHTML={{ __html: renderMathInHTML(q.solution) }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-navy hover:text-primary hover:bg-primary/5 p-2 rounded-xl transition-all"
                    onClick={() => onEdit(q)}
                  >
                    <Edit3 className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-navy hover:text-red hover:bg-red/5 p-2 rounded-xl transition-all"
                    onClick={() => onDelete(q)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="h-px flex-1" />
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-primary font-bold flex items-center gap-2 hover:bg-primary/10 px-4 py-2 rounded-2xl"
                  onClick={() => onExplain(q)}
                >
                  <Sparkles className="size-4" />
                  Xem gợi ý
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

QuestionCard.displayName = "QuestionCard";

function AIExplanationModal({ question, onClose }: { question: QuestionOut; onClose: () => void }) {
  const solutionHtml = useMemo(() => {
    return question.solution
      ? renderMathInHTML(question.solution)
      : "Bài học này hiện chưa có lời giải chi tiết. Hãy thử thảo luận cùng giảng viên nhé!";
  }, [question.solution]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-navy-blue w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-white/10"
      >
        <div className="p-8 md:p-12 text-left">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Sparkles className="size-5" />
              </div>
              <h2 className="text-2xl font-bold text-dark-blue dark:text-white">Hướng dẫn <span className="text-primary">Giải đáp</span></h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <X className="size-6 text-gray-navy" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-navy dark:text-light-blue opacity-80 text-sm italic">
              &quot;{question.content.substring(0, 150)}{question.content.length > 150 ? "..." : ""}&quot;
            </div>

            <div className="min-h-[150px] flex flex-col items-start pt-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 text-left w-full"
              >
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 font-black text-dark-blue dark:text-white uppercase tracking-widest text-[10px] opacity-40">
                    <Lightbulb className="size-3" />
                    Lời giải / Gợi ý
                  </h3>
                  <div className="bg-primary/5 dark:bg-white/5 p-6 rounded-3xl border border-primary/10">
                    <div
                      className="text-dark-blue dark:text-white leading-relaxed font-medium text-lg"
                      dangerouslySetInnerHTML={{ __html: solutionHtml }}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-3 text-xs text-gray-navy dark:text-light-blue opacity-60">
                    <CheckCircle2 className="size-4 text-green" />
                    Nội dung trên giúp bạn nắm bắt phương pháp giải bài tập.
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
