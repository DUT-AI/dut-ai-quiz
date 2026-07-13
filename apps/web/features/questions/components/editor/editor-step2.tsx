import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { CheckCircle2, ImageIcon, Loader2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { handlePasteImage } from "@/lib/upload-utils";
import type { QuestionFormValues } from "../../types";

const newOption = () => ({
  id: crypto.randomUUID().split("-")[0],
  text: "",
  is_correct: false,
});

interface EditorStep2Props {
  fields: Record<string, any>[];
  append: (value: any) => void;
  remove: (index: number) => void;
  uploading: string | null;
  onUploadFile: (file: File, field: string) => Promise<void>;
}

export function EditorStep2({ fields, append, remove, uploading, onUploadFile }: EditorStep2Props) {
  const { register, control, watch, setValue, formState: { errors } } = useFormContext<QuestionFormValues>();
  const watchOptions = watch("options");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <label className="text-xs font-black text-gray-navy opacity-45 uppercase tracking-[0.2em] px-1 italic flex items-center gap-2">
        <CheckCircle2 className="size-4 text-primary" /> Các phương án đáp án
      </label>

      {errors.options?.root && (
        <p className="text-red text-xs px-2">{errors.options.root.message}</p>
      )}
      {typeof errors.options?.message === "string" && (
        <p className="text-red text-xs px-2">{errors.options.message}</p>
      )}

      <div className="grid gap-4">
        {fields.map((field, idx) => (
          <div key={field.id} className="relative group flex items-start gap-4 w-full">
            {/* Correct toggle */}
            <Controller
              control={control}
              name={`options.${idx}.is_correct`}
              render={({ field: f }) => (
                <button
                  type="button"
                  onClick={() => {
                    const currentOptions = watchOptions || [];
                    const updated = currentOptions.map((opt, i) => ({
                      ...opt,
                      is_correct: i === idx,
                    }));
                    setValue("options", updated, { shouldDirty: true, shouldValidate: true });
                  }}
                  className={`mt-3 size-10 rounded-2xl flex items-center justify-center border-2 transition-all font-black text-sm shrink-0 ${
                    f.value
                      ? "bg-green border-green text-white shadow-lg shadow-green/20"
                      : "bg-transparent border-gray-200 dark:border-white/10 text-gray-navy hover:border-primary/50"
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </button>
              )}
            />

            <div className="flex-1 min-w-0 flex items-start gap-3 bg-gray-50/30 dark:bg-white/5 p-3 rounded-2xl border border-gray-100/50 dark:border-white/5 hover:border-primary/20 transition-all">
              <div className="flex-1 min-w-0">
                <textarea
                  id={`editor-option-${field.id}`}
                  {...register(`options.${idx}.text`)}
                  onPaste={(e) => handlePasteImage(e, (file) => onUploadFile(file, field.id))}
                  placeholder={`Đáp án ${String.fromCharCode(65 + idx)}...`}
                  className={`w-full px-4 py-3 rounded-xl bg-transparent outline-none transition-all font-medium resize-none overflow-hidden ${
                    errors.options?.[idx]?.text ? "border-red/40" : "border-transparent"
                  }`}
                />
                {errors.options?.[idx]?.text && (
                  <p className="text-red text-xs px-2 mt-1">{errors.options[idx]!.text!.message}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0 pt-2">
                <label className="cursor-pointer p-2 rounded-xl text-gray-navy hover:text-primary hover:bg-primary/10 transition-all opacity-40 hover:opacity-100">
                  {uploading === field.id ? <Loader2 className="size-4 animate-spin text-primary" /> : <ImageIcon className="size-4" />}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && onUploadFile(e.target.files[0], field.id)}
                  />
                </label>
                {fields.length > 2 && (
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="p-2 rounded-xl text-red/40 hover:text-red hover:bg-red/10 transition-all"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {fields.length < 6 && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => append(newOption())}
            className="w-fit text-primary font-bold flex items-center gap-2 mt-2 px-6 py-5 rounded-2xl hover:bg-primary/10"
          >
            <Plus className="size-4" /> Thêm đáp án
          </Button>
        )}
      </div>
    </div>
  );
}
