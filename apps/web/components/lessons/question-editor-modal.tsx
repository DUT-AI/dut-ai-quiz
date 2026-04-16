"use client";

import React, { useState, useCallback } from "react";
import { 
  X, 
  Sparkles,
  Loader2,
  Trash2,
  Plus,
  ImageIcon,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { usePresignUpload, useCreateQuestion, useUpdateQuestion } from "@/lib/queries";
import { uploadImage, handlePasteImage } from "@/lib/upload-utils";
import type { PoolType, QuestionOut } from "@/lib/types";

interface Props {
  lessonId: string;
  initialData?: QuestionOut;
  onClose: () => void;
  onSuccess: () => void;
}

const EMPTY_OPTION = () => ({
  id: crypto.randomUUID().split("-")[0],
  text: "",
  is_correct: false,
});

export default function QuestionEditorModal({ lessonId, initialData, onClose, onSuccess }: Props) {
  const [poolType, setPoolType] = useState<PoolType>(initialData?.pool_type ?? "PRACTICE");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [options, setOptions] = useState(
    initialData?.options?.length 
      ? initialData.options.map(o => ({ ...o }))
      : [
          { ...EMPTY_OPTION(), is_correct: true },
          EMPTY_OPTION(),
          EMPTY_OPTION(),
          EMPTY_OPTION(),
        ]
  );
  const [solution, setSolution] = useState(initialData?.solution ?? "");
  const [uploading, setUploading] = useState<string | null>(null); // "content" | "option-id" | "solution"

  const presign = usePresignUpload();
  const createMut = useCreateQuestion();
  const updateMut = useUpdateQuestion();

  const handleUpload = useCallback(async (file: File, target: string) => {
    setUploading(target);
    try {
      const url = await uploadImage(file, presign.mutateAsync);
      const markdown = `\n![image](${url})`;
      
      if (target === "content") {
        setContent(prev => prev + markdown);
      } else if (target === "solution") {
        setSolution(prev => prev + markdown);
      } else {
        setOptions(prev => prev.map(opt => opt.id === target ? { ...opt, text: opt.text + markdown } : opt));
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(null);
    }
  }, [presign.mutateAsync]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (!options.some(o => o.is_correct)) return;

    try {
      if (initialData) {
        await updateMut.mutateAsync({
          id: initialData.id,
          payload: {
            pool_type: poolType,
            content,
            options,
            solution: solution || undefined,
            tags: [],
            lesson_id: lessonId,
          }
        });
      } else {
        await createMut.mutateAsync({
          pool_type: poolType,
          content,
          options,
          solution: solution || undefined,
          tags: [],
          lesson_id: lessonId,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Save failed", err);
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
              <div className="size-12 rounded-2xl bg-gradient-to-br from-purple to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple/20">
                <Plus className="size-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-dark-blue dark:text-white uppercase tracking-tight">
                  {initialData ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
                </h2>
                <p className="text-sm text-gray-navy opacity-60">
                  Hỗ trợ Markdown, LaTeX và chèn hình ảnh nhanh.
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <X className="size-6 text-gray-navy" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <form id="question-form" onSubmit={handleSubmit} className="space-y-10 text-left">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Left side: Type & Main Content */}
                <div className="md:col-span-3 space-y-8">
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-navy opacity-40 uppercase tracking-[0.2em] px-1 italic flex items-center gap-2">
                       <FileTextIcon /> Nội dung câu hỏi
                    </label>
                    <div className="relative group">
                      <textarea
                        autoFocus
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onPaste={(e) => handlePasteImage(e, (file) => handleUpload(file, "content"))}
                        placeholder="Nhập nội dung câu học, $...$ cho LaTeX, hỗ trợ dán ảnh trực tiếp (Ctrl+V)..."
                        rows={6}
                        className="w-full px-8 py-6 rounded-3xl bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-purple/30 outline-none transition-all font-medium text-lg leading-relaxed resize-none"
                      />
                      <div className="absolute right-4 bottom-4 flex items-center gap-3">
                         {uploading === "content" && <Loader2 className="size-5 animate-spin text-purple" />}
                         <label className="cursor-pointer p-2 rounded-xl bg-white dark:bg-white/10 shadow-sm hover:scale-110 active:scale-95 transition-all text-purple">
                            <ImageIcon className="size-5" />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*" 
                              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "content")} 
                            />
                         </label>
                      </div>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-6">
                    <label className="text-xs font-black text-gray-navy opacity-40 uppercase tracking-[0.2em] px-1 italic flex items-center gap-2">
                       <CheckCircle2 className="size-4" /> Đáp án & Gợi ý
                    </label>
                    <div className="grid grid-cols-1 gap-4">
                      {options.map((opt, idx) => (
                        <div key={opt.id} className="relative group flex items-start gap-4">
                          <button
                            type="button"
                            onClick={() => setOptions(prev => prev.map((o, i) => ({ ...o, is_correct: i === idx })))}
                            className={cn(
                              "mt-4 size-8 rounded-xl flex items-center justify-center border-2 transition-all font-black text-xs shrink-0",
                              opt.is_correct 
                                ? "bg-purple border-purple text-white shadow-lg shadow-purple/20" 
                                : "bg-transparent border-gray-200 dark:border-white/10 text-gray-navy"
                            )}
                          >
                            {String.fromCharCode(65 + idx)}
                          </button>
                          
                          <div className="flex-1 flex items-start gap-3">
                            <div className="flex-1 overflow-hidden">
                              <textarea
                                value={opt.text}
                                onChange={(e) => setOptions(prev => prev.map(o => o.id === opt.id ? { ...o, text: e.target.value } : o))}
                                onPaste={(e) => handlePasteImage(e, (file) => handleUpload(file, opt.id))}
                                placeholder={`Đáp án ${String.fromCharCode(65 + idx)}...`}
                                rows={1}
                                className="w-full px-6 py-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-transparent focus:border-purple/30 outline-none transition-all font-medium min-h-[56px] resize-none overflow-hidden"
                              />
                            </div>
                            <div className="flex items-center gap-1 shrink-0 pt-2">
                               <label className="cursor-pointer p-2 rounded-xl text-gray-navy hover:text-purple hover:bg-purple/10 transition-all opacity-40 hover:opacity-100 flex items-center justify-center">
                                  {uploading === opt.id ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], opt.id)} 
                                  />
                               </label>
                               {options.length > 2 && (
                                 <button
                                  type="button"
                                  onClick={() => setOptions(prev => prev.filter(o => o.id !== opt.id))}
                                  className="p-2 rounded-xl text-red/40 hover:text-red hover:bg-red/10 transition-all flex items-center justify-center"
                                 >
                                    <Trash2 className="size-4" />
                                 </button>
                               )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {options.length < 6 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setOptions(prev => [...prev, EMPTY_OPTION()])}
                          className="w-fit text-purple font-bold flex items-center gap-2 mt-2 px-6"
                        >
                          <Plus className="size-4" /> Thêm đáp án
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Solution */}
                  <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/10">
                    <label className="text-xs font-black text-gray-navy opacity-40 uppercase tracking-[0.2em] px-1 italic flex items-center gap-2">
                       <Sparkles className="size-4" /> Giải thích / Gợi ý
                    </label>
                    <div className="relative">
                      <textarea
                        value={solution}
                        onChange={(e) => setSolution(e.target.value)}
                        onPaste={(e) => handlePasteImage(e, (file) => handleUpload(file, "solution"))}
                        placeholder="Hướng dẫn giải bài tập..."
                        rows={3}
                        className="w-full px-8 py-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-transparent focus:border-purple/30 outline-none transition-all font-medium text-sm resize-none"
                      />
                      <div className="absolute right-4 bottom-4">
                        <label className="cursor-pointer p-2 rounded-xl bg-white dark:bg-white/10 shadow-sm hover:scale-110 transition-all text-purple opacity-40 hover:opacity-100 block">
                            <ImageIcon className="size-5" />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*" 
                              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "solution")} 
                            />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side: Tips */}
                <div className="md:col-span-1 space-y-8">
                   <div className="p-8 rounded-[32px] bg-purple/5 dark:bg-white/5 border border-purple/10 space-y-6">
                      <div className="space-y-2">
                         <div className="p-4 rounded-2xl bg-white dark:bg-navy-blue text-[10px] leading-relaxed opacity-60">
                           <p className="font-bold mb-1">💡 Tips:</p>
                           Dùng Markdown (`**đậm**`, `*nghiêng*`) và dán ảnh trực tiếp giúp soạn thảo nhanh hơn gấp nhiều lần.
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </form>
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
              form="question-form"
              type="submit"
              disabled={!content.trim() || createMut.isPending || updateMut.isPending}
              className="py-6 px-12 rounded-2xl bg-purple text-white font-bold flex items-center gap-2 shadow-xl shadow-purple/20 transition-all hover:scale-105 active:scale-95"
            >
              {(createMut.isPending || updateMut.isPending) ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-5" />
              )}
              {initialData ? "Cập nhật câu hỏi" : "Lưu câu hỏi"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function FileTextIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="size-4">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
