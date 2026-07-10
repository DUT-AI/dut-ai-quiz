"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  Loader2,
  FileJson,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useBulkCreateQuestions } from "@/lib/queries";

interface Props {
  lessonId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkQuestionModal({ lessonId, onClose, onSuccess }: Props) {
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bulkMut = useBulkCreateQuestions();

  const handleImport = async () => {
    setError(null);
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        throw new Error("Dữ liệu phải là một mảng []");
      }

      // Basic validation
      for (const item of parsed) {
        if (!item.question || !Array.isArray(item.options)) {
          throw new Error("Mỗi câu hỏi phải có trường 'question' và 'options' (mảng)");
        }
      }

      await bulkMut.mutateAsync({
        questions: parsed,
        lesson_id: lessonId,
        pool_type: "PRACTICE"
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Bulk import failed", err);
      setError(err.message || "Định dạng JSON không hợp lệ");
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="bg-white dark:bg-navy-blue w-full max-w-4xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-white/10"
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="p-8 border-b border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4 text-left">
              <div className="size-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-primary flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <FileJson className="size-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-dark-blue dark:text-white uppercase tracking-tight">Nhập câu hỏi JSON</h2>
                <p className="text-sm text-gray-navy opacity-60">Dán mảng JSON của bạn vào bên dưới để tạo hàng loạt.</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <X className="size-6 text-gray-navy" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="space-y-6 text-left">
              <div className="space-y-4">
                <label className="text-xs font-black text-gray-navy opacity-40 uppercase tracking-[0.2em] px-1 italic">
                  JSON Data
                </label>
                <div className="relative">
                  <textarea
                    autoFocus
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder={`[
  {
    "question": "Nội dung câu hỏi...",
    "pool_type": "PRACTICE",
    "difficulty": "EASY",
    "options": [
      { "text": "Đáp án A", "is_correct": true },
      { "text": "Đáp án B", "is_correct": false }
    ],
    "solution": "Giải thích..."
  }
]`}
                    rows={15}
                    className="w-full px-6 py-6 rounded-3xl bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 outline-none transition-all font-mono text-sm leading-relaxed resize-none"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red/10 border border-red/20 text-red text-sm flex items-center gap-3">
                  <AlertCircle className="size-5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="p-6 rounded-[32px] bg-indigo-500/5 dark:bg-white/5 border border-indigo-500/10 space-y-4">
                <h4 className="font-bold text-sm text-indigo-500">💡 Hướng dẫn:</h4>
                <ul className="text-xs space-y-2 opacity-70 list-disc pl-4">
                  <li>Dữ liệu phải là một mảng các đối tượng.</li>
                  <li>Mỗi đối tượng cần có: <code className="bg-white/10 px-1 rounded">question</code> (string), <code className="bg-white/10 px-1 rounded">options</code> (array).</li>
                  <li>Các trường <code className="bg-white/10 px-1 rounded">solution</code> (string), <code className="bg-white/10 px-1 rounded">pool_type</code> (<code className="bg-white/15 px-1 rounded">"PRACTICE"</code> | <code className="bg-white/15 px-1 rounded">"EXAM"</code> | <code className="bg-white/15 px-1 rounded">"GAME"</code>) và <code className="bg-white/10 px-1 rounded">difficulty</code> (<code className="bg-white/15 px-1 rounded">"EASY"</code> | <code className="bg-white/15 px-1 rounded">"MEDIUM"</code> | <code className="bg-white/15 px-1 rounded">"HARD"</code>) là không bắt buộc.</li>
                  <li>Hệ thống sẽ tự động gán ID cho các đáp án và liên kết với bài học hiện tại.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-gray-100 dark:border-white/10 flex items-center justify-end gap-4 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="py-6 px-8 rounded-2xl font-bold"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleImport}
              disabled={!jsonInput.trim() || bulkMut.isPending}
              className="py-6 px-12 rounded-2xl bg-indigo-600 text-white font-bold flex items-center gap-2 shadow-xl shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
            >
              {bulkMut.isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-5" />
              )}
              Bắt đầu Import
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
