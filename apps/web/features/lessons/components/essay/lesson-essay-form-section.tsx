"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  MessageSquareQuote,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import {
  LessonEssayQuestionDraftSchema,
  type LessonEssayQuestionCreate,
} from "../../types";

export interface EssayDraftPreview {
  question_md: string;
  answer_md: string;
  editingIndex: number | null;
}

interface LessonEssayFormSectionProps {
  items: LessonEssayQuestionCreate[];
  onChange: (items: LessonEssayQuestionCreate[]) => void;
  onDraftChange?: (draft: EssayDraftPreview | null) => void;
}

export function LessonEssayFormSection({
  items,
  onChange,
  onDraftChange,
}: LessonEssayFormSectionProps) {
  const [questionInput, setQuestionInput] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<"write" | "preview">("write");
  const [errors, setErrors] = useState<{ question?: string; answer?: string }>({});

  useEffect(() => {
    if (!onDraftChange) return;
    if (!questionInput.trim() && !answerInput.trim() && editingIndex === null) {
      onDraftChange(null);
      return;
    }
    onDraftChange({
      question_md: questionInput,
      answer_md: answerInput,
      editingIndex,
    });
  }, [questionInput, answerInput, editingIndex, onDraftChange]);

  const resetForm = () => {
    setQuestionInput("");
    setAnswerInput("");
    setEditingIndex(null);
    setPreviewMode("write");
    setErrors({});
  };

  const handleSaveItem = () => {
    const parsed = LessonEssayQuestionDraftSchema.safeParse({
      id: editingIndex !== null ? items[editingIndex]?.id ?? null : null,
      question_md: questionInput,
      answer_md: answerInput,
      order: editingIndex !== null ? editingIndex : items.length,
    });

    if (!parsed.success) {
      const nextErrors: { question?: string; answer?: string } = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "question_md") {
          nextErrors.question = issue.message;
        }
        if (issue.path[0] === "answer_md") {
          nextErrors.answer = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    const nextItem: LessonEssayQuestionCreate = {
      id: editingIndex !== null ? items[editingIndex]?.id ?? null : null,
      question_md: parsed.data.question_md.trim(),
      answer_md: parsed.data.answer_md.trim(),
      order: editingIndex !== null ? editingIndex : items.length,
    };

    if (editingIndex !== null) {
      const updated = items.map((item, idx) =>
        idx === editingIndex ? nextItem : { ...item, order: idx }
      );
      onChange(updated);
    } else {
      onChange([...items, nextItem].map((item, idx) => ({ ...item, order: idx })));
    }

    resetForm();
  };

  const handleStartEdit = (index: number) => {
    const target = items[index];
    if (!target) return;
    setEditingIndex(index);
    setQuestionInput(target.question_md);
    setAnswerInput(target.answer_md);
    setPreviewMode("write");
    setErrors({});
  };

  const handleRemove = (index: number) => {
    const updated = items
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, order: i }));
    onChange(updated);
    if (editingIndex === index) {
      resetForm();
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const copy = [...items];
    const temp = copy[targetIndex];
    copy[targetIndex] = copy[index];
    copy[index] = temp;
    onChange(copy.map((item, i) => ({ ...item, order: i })));

    if (editingIndex === index) {
      setEditingIndex(targetIndex);
    } else if (editingIndex === targetIndex) {
      setEditingIndex(index);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-dark-blue dark:text-white uppercase tracking-wider flex items-center gap-2">
            <MessageSquareQuote className="size-4 text-primary" />
            Quản lý Câu hỏi tự luận (Markdown)
          </h3>
          <p className="text-xs text-gray-navy/60 dark:text-light-blue/50 mt-1">
            Soạn từng cặp câu hỏi và đáp án tham khảo bằng Markdown. Đáp án sẽ mặc định ẩn để học viên tự tư duy trước khi xem.
          </p>
        </div>

        <div className="inline-flex items-center p-1 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200/70 dark:border-white/10">
          <button
            type="button"
            onClick={() => setPreviewMode("write")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              previewMode === "write"
                ? "bg-white dark:bg-navy-blue text-primary shadow-sm"
                : "text-gray-500 dark:text-light-blue/70 hover:text-dark-blue dark:hover:text-white"
            }`}
          >
            Soạn thảo
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode("preview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              previewMode === "preview"
                ? "bg-white dark:bg-navy-blue text-primary shadow-sm"
                : "text-gray-500 dark:text-light-blue/70 hover:text-dark-blue dark:hover:text-white"
            }`}
          >
            <Eye className="size-3.5" />
            Xem trước
          </button>
        </div>
      </div>

      {/* Authoring / Edit Card */}
      <div className="p-5 md:p-6 rounded-2xl bg-gray-50/70 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/10 space-y-4">
        {editingIndex !== null && (
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-700 dark:text-amber-300">
            <span>Đang chỉnh sửa câu hỏi #{editingIndex + 1}</span>
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1 hover:underline"
            >
              <X className="size-3.5" />
              Hủy
            </button>
          </div>
        )}

        {previewMode === "write" ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="essay-question-md"
                className="text-xs font-black text-gray-navy dark:text-light-blue/80 opacity-70 uppercase tracking-widest"
              >
                Nội dung câu hỏi (Markdown) *
              </label>
              <textarea
                id="essay-question-md"
                rows={4}
                placeholder="Ví dụ: Phân biệt **Stack** và **Queue**? Cho ví dụ ứng dụng thực tế và độ phức tạp $O(1)$."
                value={questionInput}
                onChange={(e) => {
                  setQuestionInput(e.target.value);
                  if (errors.question) setErrors((prev) => ({ ...prev, question: undefined }));
                }}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 focus:border-primary outline-none transition-all font-mono text-sm text-dark-blue dark:text-white resize-y"
              />
              {errors.question && (
                <p className="text-red-500 text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="size-3.5 shrink-0" />
                  {errors.question}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="essay-answer-md"
                className="text-xs font-black text-gray-navy dark:text-light-blue/80 opacity-70 uppercase tracking-widest"
              >
                Đáp án tham khảo (Markdown) *
              </label>
              <textarea
                id="essay-answer-md"
                rows={5}
                placeholder="Ví dụ: - **Stack (LIFO)**: vào sau ra trước...&#10;- **Queue (FIFO)**: vào trước ra trước..."
                value={answerInput}
                onChange={(e) => {
                  setAnswerInput(e.target.value);
                  if (errors.answer) setErrors((prev) => ({ ...prev, answer: undefined }));
                }}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 focus:border-primary outline-none transition-all font-mono text-sm text-dark-blue dark:text-white resize-y"
              />
              {errors.answer && (
                <p className="text-red-500 text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="size-3.5 shrink-0" />
                  {errors.answer}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white dark:bg-navy-blue border border-gray-200/70 dark:border-white/10 space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-primary">
                Xem trước câu hỏi
              </span>
              {questionInput.trim() ? (
                <div className="min-w-0 overflow-x-auto text-sm text-dark-blue dark:text-white">
                  <Markdown content={questionInput} />
                </div>
              ) : (
                <p className="text-xs italic text-gray-400">Chưa nhập nội dung câu hỏi...</p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Xem trước đáp án tham khảo
              </span>
              {answerInput.trim() ? (
                <div className="min-w-0 overflow-x-auto text-sm text-slate-800 dark:text-slate-100">
                  <Markdown content={answerInput} />
                </div>
              ) : (
                <p className="text-xs italic text-gray-400">Chưa nhập nội dung đáp án...</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          {editingIndex !== null && (
            <Button
              type="button"
              variant="ghost"
              onClick={resetForm}
              className="rounded-xl font-bold px-4 py-2.5"
            >
              Hủy chỉnh sửa
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSaveItem}
            className="rounded-xl font-bold px-5 py-2.5 flex items-center gap-2"
          >
            {editingIndex !== null ? (
              <>
                <Check className="size-4" />
                Cập nhật câu hỏi #{editingIndex + 1}
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Thêm câu hỏi tự luận
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Existing Q&A List */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-gray-navy dark:text-light-blue/80 opacity-70 uppercase tracking-wider">
          Câu hỏi đã thêm ({items.length})
        </h4>

        {items.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-center text-xs text-gray-400 font-medium">
            Chưa có câu hỏi tự luận nào. Hãy nhập cặp câu hỏi &amp; đáp án Markdown ở trên rồi nhấn &ldquo;Thêm câu hỏi tự luận&rdquo;.
          </div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={item.id || `draft-${index}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  className={`flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-white/[0.04] border shadow-sm transition-colors ${
                    editingIndex === index
                      ? "border-amber-500/60 bg-amber-50/30 dark:bg-amber-500/5"
                      : "border-gray-200/70 dark:border-white/10"
                  }`}
                >
                  <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg shrink-0">
                    #{index + 1}
                  </span>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="text-sm font-bold text-dark-blue dark:text-white line-clamp-2 whitespace-pre-wrap">
                      {item.question_md}
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400/90 line-clamp-2 whitespace-pre-wrap">
                      Đáp án: {item.answer_md}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(index)}
                      className="size-8 p-0 rounded-lg text-gray-500 hover:text-primary"
                      title="Chỉnh sửa câu hỏi"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={index === 0}
                      onClick={() => handleMove(index, -1)}
                      className="size-8 p-0 rounded-lg text-gray-400 hover:text-dark-blue dark:hover:text-white"
                      title="Di chuyển lên"
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={index === items.length - 1}
                      onClick={() => handleMove(index, 1)}
                      className="size-8 p-0 rounded-lg text-gray-400 hover:text-dark-blue dark:hover:text-white"
                      title="Di chuyển xuống"
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(index)}
                      className="size-8 p-0 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
