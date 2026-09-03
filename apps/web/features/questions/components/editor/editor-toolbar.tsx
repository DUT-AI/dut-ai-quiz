import React from "react";

interface EditorToolbarProps {
  onInsert: (before: string, after?: string) => void;
  onInsertLink?: () => void;
}

export function EditorToolbar({ onInsert, onInsertLink }: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 bg-gray-50 dark:bg-white/5 px-4 py-2 border-b border-gray-200/50 dark:border-white/5 shrink-0 z-10">
      {/* Formatting */}
      <button
        type="button"
        title="In đậm"
        onClick={() => onInsert("**", "**")}
        className="px-2.5 py-1.5 rounded-lg text-gray-navy hover:text-dark-blue dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10 text-xs font-black transition-all"
      >
        B
      </button>
      <button
        type="button"
        title="In nghiêng"
        onClick={() => onInsert("*", "*")}
        className="px-2.5 py-1.5 rounded-lg text-gray-navy hover:text-dark-blue dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10 text-xs font-serif italic font-bold transition-all"
      >
        I
      </button>
      <button
        type="button"
        title="Gạch ngang"
        onClick={() => onInsert("~~", "~~")}
        className="px-2.5 py-1.5 rounded-lg text-gray-navy hover:text-dark-blue dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10 text-xs line-through transition-all"
      >
        S
      </button>

      <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-1" />

      {/* Headings */}
      <button
        type="button"
        title="Tiêu đề 1"
        onClick={() => onInsert("# ")}
        className="px-2 py-1 rounded-lg text-gray-navy hover:text-dark-blue dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10 text-[10px] font-black transition-all"
      >
        H1
      </button>
      <button
        type="button"
        title="Tiêu đề 2"
        onClick={() => onInsert("## ")}
        className="px-2 py-1 rounded-lg text-gray-navy hover:text-dark-blue dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10 text-[10px] font-black transition-all"
      >
        H2
      </button>

      <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-1" />

      {/* LaTeX Math */}
      <button
        type="button"
        title="LaTeX dòng ($...$)"
        onClick={() => onInsert("$", "$")}
        className="px-2.5 py-1.5 rounded-lg text-primary hover:bg-primary/10 text-xs font-bold font-mono transition-all"
      >
        $ Inline
      </button>
      <button
        type="button"
        title="LaTeX khối ($$...$$)"
        onClick={() => onInsert("$$\n", "\n$$")}
        className="px-2.5 py-1.5 rounded-lg text-primary hover:bg-primary/10 text-xs font-bold font-mono transition-all"
      >
        $$ Block
      </button>
      <button
        type="button"
        title="Phân số"
        onClick={() => onInsert("\\frac{", "}{}")}
        className="px-2.5 py-1.5 rounded-lg text-primary hover:bg-primary/10 text-xs font-mono transition-all"
      >
        \frac
      </button>
      <button
        type="button"
        title="Căn thức"
        onClick={() => onInsert("\\sqrt{", "}")}
        className="px-2.5 py-1.5 rounded-lg text-primary hover:bg-primary/10 text-xs font-mono transition-all"
      >
        \sqrt
      </button>
      <button
        type="button"
        title="Ma trận bmatrix"
        onClick={() => onInsert("\\begin{bmatrix}\n", "\n\\end{bmatrix}")}
        className="px-2.5 py-1.5 rounded-lg text-primary hover:bg-primary/10 text-xs font-mono transition-all"
      >
        [Matrix]
      </button>

      <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-1" />

      {/* Blocks */}
      <button
        type="button"
        title="Danh sách mục"
        onClick={() => onInsert("- ")}
        className="px-2.5 py-1.5 rounded-lg text-gray-navy hover:text-dark-blue dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10 text-xs transition-all"
      >
        • List
      </button>
      <button
        type="button"
        title="Bảng Markdown"
        onClick={() => onInsert("| Tiêu đề 1 | Tiêu đề 2 |\n|---|---|\n| Ô 1 | Ô 2 |\n")}
        className="px-2.5 py-1.5 rounded-lg text-gray-navy hover:text-dark-blue dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10 text-xs transition-all"
      >
        Table
      </button>
      <button
        type="button"
        title="Chèn link"
        onClick={() => {
          if (onInsertLink) {
            onInsertLink();
          } else {
            const url = prompt("Nhập địa chỉ URL của liên kết:", "https://");
            if (url !== null) {
              onInsert("[", `](${url.trim() || "url"})`);
            }
          }
        }}
        className="px-2.5 py-1.5 rounded-lg text-gray-navy hover:text-dark-blue dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10 text-xs transition-all"
      >
        Link
      </button>
    </div>
  );
}
