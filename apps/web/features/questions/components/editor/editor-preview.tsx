import React, { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { Markdown } from "@/components/markdown";

interface EditorPreviewProps {
  viewMode: "split" | "editor" | "preview";
  content: string;
  options: Array<{ id: string; text: string; is_correct: boolean }>;
  solution?: string;
}

export function EditorPreview({ viewMode, content, options, solution }: EditorPreviewProps) {
  const previewOptions = useMemo(
    () =>
      options.map((opt, i) => ({
        id: opt.id,
        text: opt.text?.trim() || `*(Chưa nhập đáp án ${String.fromCharCode(65 + i)})*`,
        is_correct: opt.is_correct,
      })) ?? [],
    [options]
  );

  return (
    <div className={`overflow-y-auto p-6 md:p-10 custom-scrollbar bg-gray-50/40 dark:bg-navy-blue/20 ${
      viewMode === "preview" 
        ? "flex-1 w-full max-w-none px-6 md:px-12 lg:px-20 mx-auto" 
        : "lg:w-[40%] xl:w-[35%] border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-white/10"
    }`}>
      <div className="space-y-6">
        <label className="text-xs font-black text-gray-navy opacity-45 uppercase tracking-[0.2em] px-1 italic flex items-center gap-2">
          <Sparkles className="size-4 text-primary animate-pulse" /> Xem trước trực quan
        </label>

        <div className="rounded-3xl bg-white dark:bg-navy-blue border border-gray-200/50 dark:border-white/5 p-6 md:p-8 space-y-6 shadow-sm">
          {/* Content Preview */}
          {content?.trim() ? (
            <Markdown
              content={content}
              className="text-lg font-semibold text-dark-blue dark:text-white leading-relaxed select-text"
            />
          ) : (
            <div className="text-lg font-semibold text-dark-blue dark:text-white leading-relaxed select-text opacity-30 italic">
              Chưa nhập nội dung câu hỏi...
            </div>
          )}

          {/* Options Preview */}
          <div className="space-y-3">
            {previewOptions.map((opt, i) => (
              <div
                key={opt.id}
                className={`flex items-start gap-3 px-5 py-4 rounded-2xl border text-sm font-medium transition-all ${
                  opt.is_correct
                    ? "bg-green/10 border-green/30 text-green"
                    : "bg-gray-50/50 dark:bg-white/5 border-gray-100 dark:border-white/5 text-dark-blue dark:text-white opacity-85"
                }`}
              >
                <span
                  className={`size-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border-2 ${
                    opt.is_correct
                      ? "bg-green text-white border-green"
                      : "bg-white dark:bg-navy-blue border-gray-200 dark:border-white/10 text-primary"
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                {opt.text ? (
                  <Markdown
                    content={opt.text}
                    className="flex-1 leading-relaxed"
                  />
                ) : (
                  <span className="flex-1 opacity-30 italic">
                    Chưa nhập đáp án {String.fromCharCode(65 + i)}...
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Solution Preview */}
          {solution?.trim() && (
            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest opacity-60 flex items-center gap-1">
                <Sparkles className="size-3" /> Hướng dẫn giải
              </p>
              <Markdown
                content={solution}
                className="text-sm text-dark-blue dark:text-white leading-relaxed"
              />
            </div>
          )}
        </div>

        <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-2">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest opacity-60">
            💡 Hướng dẫn soạn thảo nhanh
          </h4>
          <div className="text-xs text-gray-navy leading-relaxed space-y-1.5 opacity-80">
            <p><strong>Toán LaTeX:</strong> <code className="bg-white dark:bg-white/10 px-1 py-0.5 rounded text-primary">$a^2+b^2=c^2$</code> hoặc công thức khối <code className="bg-white dark:bg-white/10 px-1 py-0.5 rounded text-primary">$$E=mc^2$$</code></p>
            <p><strong>In đậm:</strong> <code className="bg-white dark:bg-white/10 px-1 py-0.5 rounded text-primary">**chữ đậm**</code></p>
            <p><strong>Tiêu đề:</strong> <code className="bg-white dark:bg-white/10 px-1 py-0.5 rounded text-primary">## Tiêu đề</code></p>
            <p><strong>Danh sách:</strong> <code className="bg-white dark:bg-white/10 px-1 py-0.5 rounded text-primary">- mục 1</code></p>
            <p><strong>Ảnh:</strong> Nhấp vào biểu tượng ảnh hoặc dán ảnh trực tiếp từ bộ nhớ tạm <kbd className="bg-white dark:bg-white/10 px-1.5 py-0.5 rounded shadow-sm">Ctrl+V / Cmd+V</kbd></p>
          </div>
        </div>
      </div>
    </div>
  );
}
