"use client";

import React, { useCallback, useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { EditorToolbar } from "@/features/questions/components/editor/editor-toolbar";
import { uploadImage, handlePasteImage } from "@/lib/upload-utils";
import { usePresignUpload } from "@/lib/queries";
import { type LessonEditorInput } from "../../types";

interface LessonContentStepProps {
  methods: UseFormReturn<LessonEditorInput>;
}

export function LessonContentStep({ methods }: LessonContentStepProps) {
  const { register, setValue, getValues } = methods;
  const presign = usePresignUpload();
  const [uploading, setUploading] = useState(false);

  // Insert format / LaTeX into text position
  const insertFormat = (before: string, after: string = "") => {
    const textarea = document.getElementById("lesson-editor-content") as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = before + selected + after;
    const newValue = text.substring(0, start) + replacement + text.substring(end);

    setValue("content_md", newValue, { shouldDirty: true, shouldValidate: true });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 10);
  };

  const handleInsertLink = () => {
    const textarea = document.getElementById("lesson-editor-content") as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end).trim();

    let replacement = "";

    if (selected.startsWith("http://") || selected.startsWith("https://")) {
      const title = prompt("Nhập tiêu đề hiển thị cho liên kết này (hoặc để trống):");
      if (title === null) return;

      const displayTitle = title.trim() || selected;
      replacement = `[${displayTitle}](${selected})`;
    } else {
      const url = prompt(
        selected ? `Nhập địa chỉ URL cho liên kết '${selected}':` : "Nhập địa chỉ URL của liên kết:",
        "https://"
      );
      if (url === null) return;

      const finalUrl = url.trim() || "url";
      const displayTitle = selected || "Link";
      replacement = `[${displayTitle}](${finalUrl})`;
    }

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setValue("content_md", newValue, { shouldDirty: true, shouldValidate: true });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + replacement.length);
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      handleInsertLink();
    }
  };

  // Upload image to cursor position
  const handleUploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      const textarea = document.getElementById("lesson-editor-content") as HTMLTextAreaElement | null;
      try {
        const url = await uploadImage(file, presign.mutateAsync);
        const markdown = `\n![image](${url})\n`;

        if (textarea) {
          const start = textarea.selectionStart ?? textarea.value.length;
          const end = textarea.selectionEnd ?? textarea.value.length;
          const currentText = textarea.value;
          const newValue = currentText.substring(0, start) + markdown + currentText.substring(end);

          setValue("content_md", newValue, { shouldDirty: true, shouldValidate: true });

          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + markdown.length, start + markdown.length);
          }, 10);
        } else {
          setValue("content_md", (getValues("content_md") ?? "") + markdown, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
      } catch (err) {
        console.error("Upload failed", err);
      } finally {
        setUploading(false);
      }
    },
    [presign.mutateAsync, setValue, getValues]
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-hidden">
      <label className="text-xs font-black text-gray-navy opacity-60 uppercase tracking-widest px-1 flex items-center justify-between shrink-0">
        <span>Nội dung bài học (Markdown & LaTeX)</span>
        <span className="text-[10px] font-normal lowercase opacity-70">
          Hỗ trợ dán ảnh (Ctrl+V) & công thức toán
        </span>
      </label>

      <div className="flex-1 flex flex-col min-h-0 rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 focus-within:border-primary/50 transition-all bg-gray-50 dark:bg-white/5">
        <EditorToolbar onInsert={insertFormat} onInsertLink={handleInsertLink} />
        <div className="relative flex-1 min-h-0 group">
          <textarea
            id="lesson-editor-content"
            {...register("content_md")}
            onPaste={(e) => handlePasteImage(e, handleUploadFile)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập nội dung lý thuyết chi tiết của bài học bằng Markdown..."
            className="w-full h-full p-6 bg-transparent border-0 outline-none transition-all font-mono text-base leading-relaxed resize-none overflow-y-auto custom-scrollbar text-dark-blue dark:text-white focus:bg-white dark:focus:bg-navy-blue"
          />
          <div className="absolute right-6 bottom-6 flex items-center gap-3">
            {uploading && <Loader2 className="size-5 animate-spin text-primary" />}
            <label className="cursor-pointer p-2.5 rounded-2xl bg-white dark:bg-white/10 shadow-md hover:scale-110 active:scale-95 transition-all text-primary border border-gray-100 dark:border-white/5">
              <ImageIcon className="size-5" />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleUploadFile(e.target.files[0])}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
