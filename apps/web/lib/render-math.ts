import katex from "katex";

/**
 * Chuyển nội dung câu hỏi (có thể là Markdown + LaTeX + HTML) thành HTML
 * an toàn để dùng với dangerouslySetInnerHTML.
 *
 * Pipeline:
 *  1. Markdown hình ảnh: ![alt](url) → <img ...>
 *  2. Block math: $$...$$ → KaTeX display mode
 *  3. Inline math: $...$ → KaTeX inline mode
 *  4. Markdown bold/italic cơ bản
 */
export function renderMathInHTML(raw: string): string {
  if (!raw) return "";

  // 1. Markdown images → <img>
  let result = raw.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (_, alt: string, src: string) =>
      `<img src="${src}" alt="${alt}" class="max-w-full my-2 rounded" style="max-height:320px"/>`
  );

  // 2. Block math: $$...$$ (phải xử lý trước $)
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math: string) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
        output: "html",
      });
    } catch {
      return `<span style="color:red">$$${math}$$</span>`;
    }
  });

  // 3. Inline math: $...$
  result = result.replace(/\$([^$\n<>]{1,300}?)\$/g, (match, math: string) => {
    if (!math.trim()) return match;
    try {
      return katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
        output: "html",
      });
    } catch {
      return match;
    }
  });

  // 4. Markdown: **bold**, *italic*, `code`
  result = result
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code class="bg-slate/10 px-1 rounded text-sm font-mono">$1</code>');

  // 5. Line breaks: \n → <br> (ngoài HTML tags)
  result = result.replace(/\n/g, "<br>");

  return result;
}
