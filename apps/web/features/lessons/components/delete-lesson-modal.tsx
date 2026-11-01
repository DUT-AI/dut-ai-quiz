"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, BookOpen, ChevronDown, Loader2, X } from "lucide-react";
import { useQuestions } from "@/features/questions/queries";
import type { Lesson } from "@/features/lessons/types";
import { toast } from "sonner";

interface DeleteLessonModalProps {
  isOpen: boolean;
  lesson: Lesson | null;
  allLessons: Lesson[];
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (options: { action: "reassign" | "unassign" | "delete"; reassignToLessonId?: string }) => Promise<void>;
}

export function DeleteLessonModal({
  isOpen,
  lesson,
  allLessons,
  isLoading = false,
  onClose,
  onConfirm,
}: DeleteLessonModalProps) {
  const [action, setAction] = useState<"reassign" | "unassign" | "delete">("unassign");
  const [targetLessonId, setTargetLessonId] = useState<string>("");

  // Query question count for this lesson
  const { data: questions, isLoading: isQuestionsLoading } = useQuestions(
    lesson?.id ? { lesson_id: lesson.id, limit: 1000 } : undefined
  );

  const questionCount = questions?.length ?? 0;
  const availableTargetLessons = allLessons.filter((l) => l.id !== lesson?.id);

  const handleSubmit = async () => {
    if (!lesson) return;

    if (questionCount > 0 && action === "reassign" && !targetLessonId) {
      toast.error("Vui lòng chọn bài học mới để chuyển câu hỏi sang.");
      return;
    }

    try {
      await onConfirm({
        action,
        reassignToLessonId: action === "reassign" ? targetLessonId : undefined,
      });
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Xóa bài học thất bại. Vui lòng thử lại.";
      toast.error(msg);
    }
  };

  if (!isOpen || !lesson) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={isLoading ? undefined : onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        key="modal-content"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="bg-white dark:bg-navy-blue w-full max-w-lg max-h-[calc(100vh-2rem)] md:max-h-[85vh] rounded-[24px] md:rounded-[32px] shadow-2xl relative z-10 flex flex-col overflow-hidden border border-gray-100 dark:border-white/10 m-4"
      >
        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-white">
                Xác nhận xóa bài học
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0 disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Bạn đang yêu cầu xóa bài học{" "}
            <span className="font-semibold text-slate-700 dark:text-zinc-200">
              "{lesson.name}"
            </span>
            .
          </p>

          {/* Question Count Alert / Info */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="size-5 text-primary" />
              <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                Số lượng câu hỏi trong bài học:
              </span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              {isQuestionsLoading ? "Đang đếm..." : `${questionCount} câu hỏi`}
            </span>
          </div>

          {/* Options for questions if count > 0 */}
          {questionCount > 0 ? (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Tùy chọn xử lý câu hỏi
              </label>

              {/* Option 1: Unassign (Default & Safest) */}
              <div
                onClick={() => setAction("unassign")}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  action === "unassign"
                    ? "border-primary bg-primary/[0.04] dark:bg-primary/[0.08] shadow-sm"
                    : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="lesson_action"
                    checked={action === "unassign"}
                    onChange={() => setAction("unassign")}
                    className="mt-1 text-primary focus:ring-primary cursor-pointer"
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                      Gỡ liên kết (Lưu câu hỏi ở trạng thái chưa phân loại)
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                      Toàn bộ câu hỏi vẫn được bảo lưu an toàn trong ngân hàng câu hỏi và các đề thi đã tạo. Bạn có thể sắp xếp lại sau.
                    </p>
                  </div>
                </div>
              </div>

              {/* Option 2: Reassign to another lesson */}
              <div
                onClick={() => setAction("reassign")}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  action === "reassign"
                    ? "border-primary bg-primary/[0.04] dark:bg-primary/[0.08] shadow-sm"
                    : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="lesson_action"
                    checked={action === "reassign"}
                    onChange={() => setAction("reassign")}
                    className="mt-1 text-primary focus:ring-primary cursor-pointer"
                  />
                  <div className="w-full space-y-2">
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">
                        Chuyển toàn bộ câu hỏi sang bài học khác
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                        Chuyển quyền phân loại các câu hỏi này sang một bài học đích bạn chọn.
                      </p>
                    </div>

                    {action === "reassign" && (
                      <div className="pt-2">
                        <div className="relative">
                          <select
                            value={targetLessonId}
                            onChange={(e) => setTargetLessonId(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 text-slate-800 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none font-medium"
                          >
                            <option value="">-- Chọn bài học tiếp nhận --</option>
                            {availableTargetLessons.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="size-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Option 3: Delete questions */}
              <div
                onClick={() => setAction("delete")}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  action === "delete"
                    ? "border-red-500 bg-red-500/[0.04] dark:bg-red-500/[0.08] shadow-sm"
                    : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="lesson_action"
                    checked={action === "delete"}
                    onChange={() => setAction("delete")}
                    className="mt-1 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">
                      Xóa tất cả câu hỏi thuộc bài học này
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                      Hệ thống sẽ chỉ cho phép xóa nếu các câu hỏi này chưa từng được đưa vào bất kỳ đề thi nào.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-zinc-400 italic">
              Bài học này không có câu hỏi nào. Bạn có thể tiến hành xóa ngay.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold text-sm text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isLoading || isQuestionsLoading}
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-md shadow-red-600/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            <span>Xác nhận xóa</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
