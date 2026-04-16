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
      `<img src="${src}" alt="${alt}" class="max-w-full my-4 rounded-2xl clickable-img cursor-zoom-in shadow-sm hover:shadow-xl transition-all" style="max-height:400px; display: block; margin-left: auto; margin-right: auto;"/>`
  );

  // 1.1 Process existing <img> tags to add class and cursor
  result = result.replace(/<img /g, '<img class="clickable-img cursor-zoom-in" ');

  // 2. Block math: $$...$$
  result = result.replace(/\$\$([\s\S]+?)\$\$/g, (_, math: string) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return `$$${math}$$`;
    }
  });

  // 3. Inline math: $...$
  result = result.replace(/\$([\s\S]+?)\$/g, (match, math: string) => {
    if (!math.trim()) return match;
    try {
      return katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return match;
    }
  });

  // 4. Markdown: **bold**, *italic*, `code`
  result = result
    .replace(/\*\*((?:.|\n)+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*((?:.|\n)+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code class="bg-slate/10 px-1 rounded text-sm font-mono">$1</code>');

  return result;
}
