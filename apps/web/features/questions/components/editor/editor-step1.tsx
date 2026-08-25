import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { FileText, Loader2, ImageIcon } from "lucide-react";
import { PoolTypeSelector } from "../pool-type-selector";
import { DifficultySelector } from "../difficulty-selector";
import { TagSelector } from "../tag-selector";
import { EditorToolbar } from "./editor-toolbar";
import { handlePasteImage } from "@/lib/upload-utils";
import type { QuestionFormValues } from "../../types";
import { LiveDuplicateChecker } from "@/components/pdf-import/live-duplicate-checker";

interface EditorStep1Props {
  insertFormat: (field: "content" | "solution" | string, before: string, after?: string) => void;
  onInsertLink?: (field: "content" | "solution" | string) => void;
  uploading: string | null;
  onUploadFile: (file: File, field: "content" | "solution" | string) => Promise<void>;
}

export function EditorStep1({ insertFormat, onInsertLink, uploading, onUploadFile }: EditorStep1Props) {
  const { register, control, watch, formState: { errors } } = useFormContext<QuestionFormValues>();

  const contentVal = watch("content");
  const poolTypeVal = watch("pool_type");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Metadata Selectors (compact row) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 dark:bg-white/5 p-4 rounded-3xl border border-gray-100/50 dark:border-white/5">
        <Controller
          control={control}
          name="pool_type"
          render={({ field }) => (
            <PoolTypeSelector
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="difficulty"
          render={({ field }) => (
            <DifficultySelector
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="tags"
          render={({ field }) => (
            <TagSelector
              value={field.value || []}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      {/* Question Content textarea auto-expanding */}
      <div className="space-y-3">
        <label className="text-xs font-black text-gray-navy opacity-45 uppercase tracking-[0.2em] px-1 italic flex items-center gap-2">
          <FileText className="size-4 text-primary" /> Nội dung câu hỏi
        </label>
        <div className="flex flex-col rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 focus-within:border-primary/50 transition-all bg-gray-50 dark:bg-white/5">
          <EditorToolbar 
            onInsert={(before, after) => insertFormat("content", before, after)} 
            onInsertLink={() => onInsertLink?.("content")}
          />
          <div className="relative group">
            <textarea
              id="editor-content"
              {...register("content")}
              autoFocus
              onPaste={(e) => handlePasteImage(e, (file) => onUploadFile(file, "content"))}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                  e.preventDefault();
                  onInsertLink?.("content");
                }
              }}
              placeholder="Nhập nội dung câu hỏi, $...$ cho LaTeX, hỗ trợ dán ảnh (Ctrl+V)..."
              className={`w-full px-6 py-4 bg-transparent border-0 outline-none transition-all font-medium text-lg leading-relaxed resize-none overflow-hidden ${
                errors.content ? "bg-red/5" : "focus:bg-white dark:focus:bg-navy-blue"
              }`}
            />
            <div className="absolute right-4 bottom-4 flex items-center gap-3">
              {uploading === "content" && <Loader2 className="size-5 animate-spin text-primary" />}
              <label className="cursor-pointer p-2 rounded-xl bg-white dark:bg-white/10 shadow-sm hover:scale-110 active:scale-95 transition-all text-primary border border-gray-100 dark:border-white/5">
                <ImageIcon className="size-5" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && onUploadFile(e.target.files[0], "content")}
                />
              </label>
            </div>
          </div>
        </div>
        
        <LiveDuplicateChecker content={contentVal || ""} poolType={poolTypeVal} />

        {errors.content && (
          <p className="text-red text-xs px-2">{errors.content.message}</p>
        )}
      </div>
    </div>
  );
}
