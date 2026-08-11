"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Check, Trash2, Save, Sparkles, HelpCircle, BookOpen, ShieldAlert, Layers } from "lucide-react";
import {
  useApproveQuestion,
  useRejectQuestion,
  useUpdateQuestion,
  useRegenerateSolution,
} from "@/lib/queries";
import { LiveDuplicateChecker } from "@/components/pdf-import/live-duplicate-checker";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ReviewQuestionCardProps {
  question: any;
  index: number;
  lessons: any[];
  onSuccess: () => void;
}

export function ReviewQuestionCard({
  question,
  index,
  lessons,
  onSuccess,
}: ReviewQuestionCardProps) {
  const [editedQuestion, setEditedQuestion] = useState<any>(question);
  const [submitting, setSubmitting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [aiHint, setAiHint] = useState("");

  const approveMutation = useApproveQuestion();
  const rejectMutation = useRejectQuestion();
  const updateMutation = useUpdateQuestion();
  const regenerateMutation = useRegenerateSolution();

  useEffect(() => {
    setEditedQuestion(question);
  }, [question]);

  if (!editedQuestion) return null;

  const handleUpdateField = (field: string, value: any) => {
    setEditedQuestion((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdateOption = (oIdx: number, field: string, value: any) => {
    setEditedQuestion((prev: any) => {
      const options = [...prev.options];
      options[oIdx] = { ...options[oIdx], [field]: value };
      return { ...prev, options };
    });
  };

  const toggleOptionCorrectness = (oIdx: number) => {
    setEditedQuestion((prev: any) => {
      const options = prev.options.map((opt: any, idx: number) => ({
        ...opt,
        is_correct: idx === oIdx,
      }));
      return { ...prev, options };
    });
  };

  // 1. Approve Question (Make it PUBLIC)
  const handleApprove = async () => {
    if (!editedQuestion.content.trim()) {
      toast.error("Nội dung câu hỏi không được để trống.");
      return;
    }
    if (!editedQuestion.options.some((o: any) => o.is_correct)) {
      toast.error("Cần có ít nhất một phương án đúng trước khi duyệt.");
      return;
    }

    setSubmitting(true);
    try {
      await approveMutation.mutateAsync({
        id: editedQuestion.id,
        payload: {
          content: editedQuestion.content,
          solution: editedQuestion.solution || undefined,
          difficulty: editedQuestion.difficulty,
          lesson_id: editedQuestion.lesson_id || undefined,
        },
      });
      toast.success("Đã phê duyệt câu hỏi thành PUBLIC!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi phê duyệt câu hỏi");
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Save Draft Edits
  const handleSaveDraft = async () => {
    setSubmitting(true);
    try {
      await updateMutation.mutateAsync({
        id: editedQuestion.id,
        payload: {
          content: editedQuestion.content,
          options: editedQuestion.options.map((o: any) => ({
            id: o.id,
            text: o.text,
            is_correct: !!o.is_correct,
            fixed: !!o.fixed,
          })),
          solution: editedQuestion.solution || undefined,
          difficulty: editedQuestion.difficulty,
          pool_type: editedQuestion.pool_type || "PRACTICE",
          lesson_id: editedQuestion.lesson_id || undefined,
        },
      });
      toast.success("Đã lưu chỉnh sửa nháp!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi lưu câu hỏi nháp");
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Reject/Delete Question
  const handleReject = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa/bỏ qua câu hỏi nháp này không?")) return;

    setSubmitting(true);
    try {
      await rejectMutation.mutateAsync(editedQuestion.id);
      toast.success("Đã xóa câu hỏi nháp.");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xóa câu hỏi");
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Regenerate solution using AI
  const handleRegenerateSolution = async () => {
    setRegenerating(true);
    try {
      const res = await regenerateMutation.mutateAsync({
        id: editedQuestion.id,
        admin_hint: aiHint,
      });
      if (res && res.solution) {
        handleUpdateField("solution", res.solution);
        toast.success("Đã sinh lại lời giải mới bằng AI!");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi sinh lại lời giải");
    } finally {
      setRegenerating(false);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "EASY":
        return "text-green-600 bg-green-500/10 border-green-500/20";
      case "MEDIUM":
        return "text-amber-600 bg-amber-500/10 border-amber-500/20";
      case "HARD":
        return "text-rose-600 bg-rose-500/10 border-rose-500/20";
      default:
        return "text-slate-600 bg-slate-500/10 border-slate-500/20";
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-white/5 rounded-3xl shadow-md overflow-hidden transition-colors duration-300">
      {/* Top Banner Accent */}
      <div className="h-1 bg-gradient-to-r from-primary/50 via-violet-500/50 to-primary/50" />

      <div className="p-6 md:p-8 space-y-6">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-black text-primary uppercase tracking-wider bg-primary/5 px-3 py-1 rounded-xl">
              CÂU HỎI NHÁP #{index}
            </span>
            <span className="text-[11px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl uppercase tracking-wider">
              DRAFT
            </span>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-zinc-800 px-2.5 py-1 rounded-xl border border-slate-200/50 dark:border-white/5">
              Bài học: {lessons.find((l) => l.id === editedQuestion.lesson_id)?.name || "Chưa gắn bài học"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold border px-2.5 py-1 rounded-xl uppercase tracking-wider ${getDifficultyColor(editedQuestion.difficulty)}`}>
              Độ khó: {editedQuestion.difficulty === "EASY" ? "Dễ" : editedQuestion.difficulty === "MEDIUM" ? "Trung bình" : "Khó"}
            </span>
          </div>
        </div>

        {/* Two-Column Responsive Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT COLUMN: Question & Answers */}
          <div className="flex-1 space-y-6">
            {/* Content text */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Nội dung câu hỏi
              </label>
              <textarea
                value={editedQuestion.content}
                onChange={(e) => handleUpdateField("content", e.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-zinc-800/30 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 dark:text-white transition-colors duration-200 resize-y"
              />
              <LiveDuplicateChecker content={editedQuestion.content} poolType={editedQuestion.pool_type} />
            </div>

            {/* Options Choices */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Các phương án trả lời
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {editedQuestion.options?.map((opt: any, oIdx: number) => {
                  const label = String.fromCharCode(65 + oIdx);
                  return (
                    <div
                      key={opt.id || oIdx}
                      className={`flex items-center gap-3 border rounded-2xl p-3.5 transition-colors duration-200 focus-within:ring-2 ${
                        opt.is_correct
                          ? "border-emerald-500/40 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] focus-within:ring-emerald-500/20"
                          : "border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-800/30 focus-within:ring-primary/20 focus-within:border-primary"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleOptionCorrectness(oIdx)}
                        className={`size-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                          opt.is_correct
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                            : "border-slate-300 dark:border-zinc-700 hover:border-emerald-500 text-transparent"
                        }`}
                      >
                        <Check className="size-4" />
                      </button>
                      
                      <span className={`size-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 transition-colors ${
                        opt.is_correct
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-slate-400"
                      }`}>
                        {label}
                      </span>

                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleUpdateOption(oIdx, "text", e.target.value)}
                        className="flex-1 bg-transparent text-sm border-0 outline-none text-slate-800 dark:text-white font-medium"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Settings, Explanation & AI Wizard */}
          <div className="w-full lg:w-[400px] shrink-0 space-y-6">
            
            {/* Quick Settings Panel */}
            <div className="bg-slate-50/50 dark:bg-zinc-800/20 border border-slate-200/50 dark:border-white/5 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-2">
                Thiết lập câu hỏi
              </h4>
              
              <div className="grid grid-cols-1 gap-3.5">
                {/* Lesson */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="size-3" /> Bài học liên quan
                  </label>
                  <select
                    value={editedQuestion.lesson_id || ""}
                    onChange={(e) => handleUpdateField("lesson_id", e.target.value || null)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-bold outline-none text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-colors duration-200"
                  >
                    <option value="">Chưa gắn bài học</option>
                    {lessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <ShieldAlert className="size-3" /> Độ khó
                  </label>
                  <select
                    value={editedQuestion.difficulty}
                    onChange={(e) => handleUpdateField("difficulty", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-bold outline-none text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-colors duration-200"
                  >
                    <option value="EASY">Dễ</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HARD">Khó</option>
                  </select>
                </div>

                {/* Pool Type */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Layers className="size-3" /> Dạng câu hỏi
                  </label>
                  <select
                    value={editedQuestion.pool_type}
                    onChange={(e) => handleUpdateField("pool_type", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-bold outline-none text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-colors duration-200"
                  >
                    <option value="PRACTICE">Luyện tập</option>
                    <option value="EXAM">Thi cử/Kiểm tra</option>
                    <option value="GAME">Giải đấu</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Solution Input */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Lời giải chi tiết
              </label>
              <textarea
                value={editedQuestion.solution || ""}
                onChange={(e) => handleUpdateField("solution", e.target.value)}
                rows={3}
                placeholder="Nhập lời giải hoặc sử dụng AI..."
                className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-zinc-800/30 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 dark:text-white transition-colors duration-200 resize-y"
              />
            </div>

            {/* AI Generator Wizard Panel */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500/[0.05] via-purple-500/[0.05] to-pink-500/[0.05] dark:from-indigo-500/[0.02] dark:via-purple-500/[0.02] dark:to-pink-500/[0.02] border border-indigo-500/10 dark:border-indigo-500/20 p-5 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block flex items-center gap-1.5">
                  <Sparkles className="size-4 animate-pulse text-indigo-500" />
                  🪄 Sinh lời giải bằng Gemini AI
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Viết chi tiết bằng Tiếng Việt..."
                  value={aiHint}
                  onChange={(e) => setAiHint(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-white transition-colors duration-200"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                  Định hướng giúp AI viết lời giải đúng theo định dạng mong muốn.
                </p>
              </div>
              <Button
                onClick={handleRegenerateSolution}
                disabled={regenerating}
                variant="outline"
                className="w-full border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 rounded-xl text-xs font-black h-10 flex items-center justify-center gap-1.5 transition-colors duration-200 shadow-sm"
              >
                {regenerating ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    AI đang viết...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5 text-indigo-500" />
                    Sinh lời giải tự động
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-white/5">
          <Button
            onClick={handleReject}
            disabled={submitting}
            variant="ghost"
            className="w-full sm:w-auto rounded-xl px-5 h-11 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-black transition-colors"
          >
            <Trash2 className="size-4 mr-2 inline" /> Hủy & Xóa bỏ
          </Button>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={handleSaveDraft}
              disabled={submitting}
              variant="outline"
              className="w-full sm:w-auto rounded-xl px-5 h-11 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-black hover:bg-slate-50 dark:hover:bg-white/5 transition-colors duration-200"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin mr-2 inline" />
              ) : (
                <Save className="size-4 mr-2 inline" />
              )}
              Lưu nháp
            </Button>
            <Button
              onClick={handleApprove}
              disabled={submitting}
              className="w-full sm:w-auto rounded-xl px-6 h-11 !bg-emerald-600 hover:!bg-emerald-700 !text-white dark:!bg-emerald-700 dark:hover:!bg-emerald-600 dark:!text-emerald-50 shadow-md text-xs font-black flex items-center justify-center gap-2 transition-colors duration-200 hover:scale-[1.01]"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin shrink-0" />
              ) : (
                <Check className="size-4 shrink-0" />
              )}
              Duyệt công khai
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
