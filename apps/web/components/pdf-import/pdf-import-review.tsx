"use client";

import React, { useState, useEffect } from "react";
import { Trash2, Save, AlertCircle, Loader2, Check } from "lucide-react";
import { useDraftQuestions, useUpdateQuestion, useRejectQuestion } from "@/lib/queries";
import { LiveDuplicateChecker } from "./live-duplicate-checker";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  jobId: string;
  onSuccess: () => void;
  onClose?: () => void;
}

export function PdfImportReview({ jobId, onSuccess, onClose }: Props) {
  const { data: draftData, isLoading: isLoadingDrafts, refetch } = useDraftQuestions(jobId);
  const updateMutation = useUpdateQuestion();
  const rejectMutation = useRejectQuestion();

  const [questions, setQuestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (draftData?.questions) {
      setQuestions(draftData.questions);
    }
  }, [draftData]);

  const handleUpdateField = (index: number, field: string, value: any) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleUpdateOption = (qIdx: number, oIdx: number, field: string, value: any) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const options = [...copy[qIdx].options];
      options[oIdx] = { ...options[oIdx], [field]: value };
      copy[qIdx] = { ...copy[qIdx], options };
      return copy;
    });
  };

  const toggleOptionCorrectness = (qIdx: number, oIdx: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const options = copy[qIdx].options.map((opt: any, idx: number) => ({
        ...opt,
        is_correct: idx === oIdx, // Assuming single-choice questions from PDF
      }));
      copy[qIdx] = { ...copy[qIdx], options };
      return copy;
    });
  };

  const handleDeleteQuestion = async (qIdx: number, qId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa câu hỏi nháp này không?")) return;
    try {
      await rejectMutation.mutateAsync(qId);
      setQuestions((prev) => prev.filter((_, idx) => idx !== qIdx));
    } catch (err) {
      toast.error("Lỗi khi xóa câu hỏi nháp");
    }
  };

  const handleSaveAll = async () => {
    // Validate
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content.trim()) {
        toast.error(`Câu hỏi số ${i + 1} không được để trống nội dung.`);
        return;
      }
      if (q.options.some((o: any) => !o.text.trim())) {
        toast.error(`Các phương án lựa chọn ở câu hỏi số ${i + 1} không được để trống.`);
        return;
      }
      if (!q.options.some((o: any) => o.is_correct)) {
        toast.error(`Câu hỏi số ${i + 1} cần có ít nhất một phương án đúng.`);
        return;
      }
    }

    setSaving(true);
    try {
      // Save all edited questions in parallel
      await Promise.all(
        questions.map((q) =>
          updateMutation.mutateAsync({
            id: q.id,
            payload: {
              content: q.content,
              options: q.options.map((o: any) => ({
                id: o.id,
                text: o.text,
                is_correct: !!o.is_correct,
                fixed: !!o.fixed,
              })),
              solution: q.solution || undefined,
              difficulty: q.difficulty,
              pool_type: q.pool_type || "PRACTICE",
            },
          })
        )
      );
      toast.success("Đã lưu danh sách câu hỏi thành công dưới dạng Nháp (DRAFT). Đang chờ Admin phê duyệt.");
      onSuccess();
      if (onClose) onClose();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi lưu danh sách câu hỏi");
    } finally {
      setSaving(false);
    }
  };

  if (isLoadingDrafts) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-sm text-slate-500 font-bold">Đang tải danh sách câu hỏi bóc tách...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="size-12 mx-auto text-slate-400" />
        <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300">Không có câu hỏi nào được bóc tách</h4>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          AI không tìm thấy câu hỏi trắc nghiệm nào từ file PDF đã tải lên. Vui lòng kiểm tra lại cấu trúc file PDF.
        </p>
        <Button onClick={onClose} variant="outline" className="rounded-xl">Đóng</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-3xl p-6 flex gap-3">
        <AlertCircle className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
          <p className="font-bold text-blue-700 dark:text-blue-400 mb-1">Kiểm tra thông tin trước khi lưu</p>
          <p>Dưới đây là các câu hỏi AI đã bóc tách được. Bạn có thể sửa đổi trực tiếp các câu hỏi này hoặc xóa bỏ các câu hỏi lỗi trước khi xác nhận lưu nháp vào hệ thống.</p>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, qIdx) => (
          <div
            key={q.id}
            className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-white/5 p-6 sm:p-8 rounded-[32px] shadow-sm relative group text-left"
          >
            {/* Header of Question Card */}
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-white/5 pb-4">
              <span className="text-sm font-black text-primary uppercase tracking-wider">
                Câu hỏi #{qIdx + 1}
              </span>
              <div className="flex items-center gap-3">
                <select
                  value={q.difficulty}
                  onChange={(e) => handleUpdateField(qIdx, "difficulty", e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold outline-none text-slate-700 dark:text-slate-300"
                >
                  <option value="EASY">Dễ</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="HARD">Khó</option>
                </select>
                <button
                  onClick={() => handleDeleteQuestion(qIdx, q.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                  title="Xóa câu hỏi này"
                >
                  <Trash2 className="size-4.5" />
                </button>
              </div>
            </div>

            {/* Content Input */}
            <div className="space-y-2 mb-6">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nội dung câu hỏi</label>
              <textarea
                value={q.content}
                onChange={(e) => handleUpdateField(qIdx, "content", e.target.value)}
                rows={3}
                placeholder="Nhập nội dung câu hỏi..."
                className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800 px-4 py-3 text-sm outline-none focus:border-primary/50 text-slate-800 dark:text-white transition-colors"
              />
              <LiveDuplicateChecker content={q.content} poolType={q.pool_type} />
            </div>

            {/* Options List */}
            <div className="space-y-3 mb-6">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Các phương án trả lời</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options?.map((opt: any, oIdx: number) => {
                  const label = String.fromCharCode(65 + oIdx);
                  return (
                    <div
                      key={opt.id || oIdx}
                      className={`flex items-center gap-3 border rounded-2xl p-3 transition-colors ${
                        opt.is_correct
                          ? "border-green-500/50 bg-green-50/10 dark:bg-green-500/5"
                          : "border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-800/30"
                      }`}
                    >
                      {/* Check Button */}
                      <button
                        type="button"
                        onClick={() => toggleOptionCorrectness(qIdx, oIdx)}
                        className={`size-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                          opt.is_correct
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-slate-300 dark:border-zinc-700 hover:border-green-500 text-transparent"
                        }`}
                      >
                        <Check className="size-4" />
                      </button>
                      
                      <span className="text-xs font-black text-slate-400 dark:text-slate-500 shrink-0">
                        {label}
                      </span>

                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleUpdateOption(qIdx, oIdx, "text", e.target.value)}
                        placeholder={`Đáp án ${label}`}
                        className="flex-1 bg-transparent text-sm border-0 outline-none text-slate-800 dark:text-white"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Solution Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lời giải chi tiết (Tùy chọn)</label>
              <textarea
                value={q.solution || ""}
                onChange={(e) => handleUpdateField(qIdx, "solution", e.target.value)}
                rows={2}
                placeholder="Nhập lời giải..."
                className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800 px-4 py-3 text-sm outline-none focus:border-primary/50 text-slate-800 dark:text-white transition-colors"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex justify-center sticky bottom-4 z-10">
        <Button
          onClick={handleSaveAll}
          disabled={saving}
          className="w-full md:w-80 h-14 text-lg rounded-2xl bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              Đang lưu câu hỏi...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-3" />
              Lưu toàn bộ Nháp
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
