import React from "react";
import { useFormContext } from "react-hook-form";
import { Sparkles, Loader2, ImageIcon } from "lucide-react";
import { EditorToolbar } from "./editor-toolbar";
import { handlePasteImage } from "@/lib/upload-utils";
import type { QuestionFormValues } from "../../types";

interface EditorStep3Props {
  insertFormat: (field: "content" | "solution" | string, before: string, after?: string) => void;
  uploading: string | null;
  onUploadFile: (file: File, field: "content" | "solution" | string) => Promise<void>;
}

export function EditorStep3({ insertFormat, uploading, onUploadFile }: EditorStep3Props) {
  const { register } = useFormContext<QuestionFormValues>();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <label className="text-xs font-black text-gray-navy opacity-45 uppercase tracking-[0.2em] px-1 italic flex items-center gap-2">
        <Sparkles className="size-4 text-primary" /> Hướng dẫn chi tiết / Lời giải
      </label>
      <div className="flex flex-col rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 focus-within:border-primary/50 transition-all bg-gray-50 dark:bg-white/5">
        <EditorToolbar onInsert={(before, after) => insertFormat("solution", before, after)} />
        <div className="relative group">
          <textarea
            id="editor-solution"
            {...register("solution")}
            onPaste={(e) => handlePasteImage(e, (file) => onUploadFile(file, "solution"))}
            placeholder="Hướng dẫn giải bài tập, hỗ trợ LaTeX và dán ảnh..."
            className="w-full px-6 py-4 bg-transparent border-0 outline-none transition-all font-medium text-sm resize-none overflow-hidden focus:bg-white dark:focus:bg-navy-blue"
          />
          <div className="absolute right-4 bottom-4">
            {uploading === "solution" && <Loader2 className="size-5 animate-spin text-primary" />}
            <label className="cursor-pointer p-2 rounded-xl bg-white dark:bg-white/10 shadow-sm hover:scale-110 transition-all text-primary opacity-40 hover:opacity-100 border border-gray-100 dark:border-white/5 block">
              <ImageIcon className="size-5" />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && onUploadFile(e.target.files[0], "solution")}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
