import { renderMathInHTML } from "@/lib/render-math";
import hljs from "highlight.js";
import { stripMarkdown, slugify, escapeHTML, joinSoftNewlines } from "./helpers";
import { parseMarkdownTables } from "./table";
import { linkifyPlainURLs } from "./linkify";

export interface HeadingItem {
    id: string;
    text: string;
    level: number;
}

export interface RenderResult {
    html: string;
    headings: HeadingItem[];
}

/**
 * Basic markdown/latex renderer helper for theory content.
 */
export function renderTheoryMarkdown(raw: string): RenderResult {
    if (!raw) return { html: "", headings: [] };

    // 1. Mask code blocks first to protect them from regex adjustments
    const codeBlocks: { lang: string; code: string }[] = [];
    // Matches ```lang\ncode\n```
    let processed = raw.replace(/```(\w*)\r?\n([\s\S]*?)\r?\n[ \t]*```/g, (_, lang, code) => {
        const index = codeBlocks.length;
        codeBlocks.push({ lang, code });
        return `<div class="code-block-placeholder" data-index="${index}"></div>`;
    });

    // 2. Preprocess soft newlines on the masked content
    processed = joinSoftNewlines(processed);

    let html = parseMarkdownTables(processed);
    const headings: HeadingItem[] = [];
    const slugCounts = new Map<string, number>();

    const registerHeading = (text: string, level: number) => {
        // Strip HTML tags if any from the title
        const cleanText = text.replace(/<[^>]*>/g, "").trim();
        let slug = slugify(cleanText);
        if (!slug) slug = "heading";
        const count = slugCounts.get(slug) || 0;
        slugCounts.set(slug, count + 1);
        const id = count > 0 ? `${slug}-${count}` : slug;
        headings.push({ id, text: cleanText, level });
        return id;
    };

    // 1. Format blockquotes first so they don't get wrapped in paragraphs (wrapped in premium card later)
    html = html.replace(/^>\s*(.*$)/gim, '<blockquote class="italic text-slate-600 dark:text-slate-400 text-lg md:text-xl m-0">$1</blockquote>');
    html = html.replace(/<\/blockquote>\s*<blockquote[^>]*>/g, '<br />');

    // 2. Format headings with Tailwind classes and assign unique IDs in order of appearance
    html = html.replace(/^(#{1,4})\s+(.*$)/gim, (_, hashes, text) => {
        const level = hashes.length;
        const rawText = text.trim();
        const cleanText = stripMarkdown(rawText);
        const id = registerHeading(cleanText, level);

        switch (level) {
            case 1:
                return `<h1 id="${id}" class="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-16 mb-5 leading-tight scroll-mt-24">${cleanText}</h1>`;
            case 2:
                return `<h2 id="${id}" class="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-9 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700 scroll-mt-24">${cleanText}</h2>`;
            case 3:
                return `<h3 id="${id}" class="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-7 mb-3 scroll-mt-24">${cleanText}</h3>`;
            case 4:
                return `<h4 id="${id}" class="text-lg md:text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200 mt-6 mb-2 pl-3 border-l-2 border-slate-300 dark:border-slate-600 scroll-mt-24">${cleanText}</h4>`;
            default:
                return _;
        }
    });

    // 3. Format lists with Tailwind classes (supporting indented items and ordered list items)
    html = html.replace(/^[ \t]*\* (.*$)/gim, '<li class="list-disc ml-6 my-2 text-lg md:text-xl text-slate-700 dark:text-slate-200 font-normal leading-relaxed break-words">$1</li>');
    html = html.replace(/^[ \t]*- (.*$)/gim, '<li class="list-disc ml-6 my-2 text-lg md:text-xl text-slate-700 dark:text-slate-200 font-normal leading-relaxed break-words">$1</li>');
    html = html.replace(/^[ \t]*(\d+)\. (.*$)/gim, '<li class="list-decimal ml-6 my-2 text-lg md:text-xl text-slate-700 dark:text-slate-200 font-normal leading-relaxed break-words">$2</li>');

    // 4. Split into paragraphs, skipping block elements
    html = html
        .split(/\n\s*\n/)
        .map((p) => {
            const trimmed = p.trim();
            if (!trimmed) return "";
            if (
                trimmed.startsWith("<h") ||
                trimmed.startsWith("<li") ||
                trimmed.startsWith("<ul") ||
                trimmed.startsWith("<ol") ||
                trimmed.startsWith("<img") ||
                trimmed.startsWith("<blockquote") ||
                trimmed.startsWith("<div") ||
                trimmed.startsWith("<table") ||
                trimmed.startsWith("<aside")
            ) {
                return trimmed;
            }
            return `<p class="text-lg md:text-xl text-slate-700 dark:text-slate-200 font-normal leading-relaxed my-5 break-words">${trimmed}</p>`;
        })
        .join("\n\n");

    // 5. Render math, bold, italic, code blocks, etc. (Called ONLY once here)
    html = renderMathInHTML(html);

    // 5.1 Parse standard markdown links [text](url)
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 underline underline-offset-4 decoration-emerald-600/30 hover:decoration-emerald-500 transition-colors font-medium break-all">$1</a>');

    // 6. Post-process bold and inline code to apply premium Tailwind styling
    html = html.replace(/<strong>/gi, '<strong class="font-bold text-slate-900 dark:text-white">');
    html = html.replace(/<code>/gi, '<code class="font-mono text-sm font-semibold text-pink-600 dark:text-pink-400 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-zinc-700/50 px-1.5 py-0.5 rounded-md">');

    // 8. Style KaTeX container spacing and size
    html = html.replace(/class="katex-display"/g, 'class="katex-display my-6 p-2 overflow-x-auto overflow-y-hidden select-all"');
    html = html.replace(/class="katex"/g, 'class="katex text-[1.05em] select-all"');

    // 9. Clean up any unnecessary <br /> tags between/around block elements
    html = html
        .replace(/(<\/(p|h1|h2|h3|h4|li|ul|ol|hr|div|blockquote|aside)>)(?:\s*<br\s*\/?>)+/gi, "$1")
        .replace(/(?:\s*<br\s*\/?>)+(<(p|h1|h2|h3|h4|li|ul|ol|hr|div|blockquote|aside)[^>]*>)/gi, "$1");

    // 10. Post-process images to apply cursor-pointer and premium styling
    html = html.replace(/<img([^>]*)>/gi, (_, attrs) => {
        const premiumClasses = "mx-auto rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer my-6 max-w-full h-auto";
        if (attrs.includes('class="') || attrs.includes("class='")) {
            return `<img${attrs.replace(/class=["']([^"']*)["']/i, `class="$1 ${premiumClasses}"`)}>`;
        } else {
            return `<img class="${premiumClasses}"${attrs}>`;
        }
    });

    // 10.1 Post-process aside block callouts to apply premium styling with info icon
    html = html.replace(/<aside>/gi, `
<div class="relative pl-12 pr-6 py-5 my-8 rounded-2xl bg-emerald-50/30 dark:bg-emerald-950/[0.04] border-l-4 border-primary/80 dark:border-primary/60 shadow-sm">
  <div class="absolute left-4 top-5.5 text-primary/80 dark:text-primary/60 select-none">
    <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
  </div>
  <aside class="text-slate-700 dark:text-slate-350 text-lg md:text-xl font-normal leading-relaxed m-0">
`.trim());
    html = html.replace(/<\/aside>/gi, '</aside></div>');

    // 10.2 Parse plain text URLs to clickable anchor tags
    html = linkifyPlainURLs(html);

    // 10.3 Post-process blockquotes to wrap in premium container with quote icon
    html = html.replace(/<blockquote([^>]*)>([\s\S]*?)<\/blockquote>/gi, `
<div class="relative pl-12 pr-6 py-5 my-8 rounded-2xl bg-gradient-to-r from-slate-50/80 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-900/10 border-l-4 border-emerald-500 shadow-sm">
  <div class="absolute left-4 top-5 text-emerald-500/40 dark:text-emerald-500/30 select-none">
    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 14.725c0-5.141 3.892-10.519 10-11.725l.944 2c-3.077 1.183-4.944 3.388-4.944 6.5h4v9h-10v-5.775zm-13 0c0-5.141 3.892-10.519 10-11.725l.944 2c-3.077 1.183-4.944 3.388-4.944 6.5h4v9h-10v-5.775z"/>
    </svg>
  </div>
  <blockquote$1>$2</blockquote>
</div>
`.trim());

    // 11. Restore code blocks with premium card header, macOS control buttons, copy functionality, syntax highlighting, and full light/dark mode support.
    html = html.replace(/<div class="code-block-placeholder" data-index="(\d+)"><\/div>/g, (_, idx) => {
        const block = codeBlocks[parseInt(idx, 10)];
        if (!block) return "";
        
        const langText = block.lang ? block.lang.toLowerCase() : "";
        let highlightedCode = "";
        
        if (langText && hljs.getLanguage(langText)) {
            try {
                highlightedCode = hljs.highlight(block.code, { language: langText }).value;
            } catch (e) {
                highlightedCode = escapeHTML(block.code);
            }
        } else {
            try {
                // Auto-detect language if not specified
                highlightedCode = hljs.highlightAuto(block.code).value;
            } catch (e) {
                highlightedCode = escapeHTML(block.code);
            }
        }
        
        const langDisplay = langText || "code";

        return `
<div class="code-block-container my-8 rounded-2xl overflow-hidden shadow-lg border border-zinc-200 dark:border-zinc-800/80 bg-[#0B0F17] dark:bg-[#090C14] transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5">
    <div class="flex items-center justify-between px-5 py-3 bg-[#131B2D] dark:bg-[#0D1525] border-b border-zinc-800/60 select-none">
        <div class="flex space-x-2 items-center">
            <span class="w-3 h-3 rounded-full bg-rose-500/85"></span>
            <span class="w-3 h-3 rounded-full bg-amber-500/85"></span>
            <span class="w-3 h-3 rounded-full bg-emerald-500/85"></span>
            <span class="ml-3 text-xs md:text-sm font-semibold tracking-wide text-zinc-300 capitalize">${langDisplay}</span>
        </div>
        <button onclick="
            const code = this.closest('.code-block-container').querySelector('code').innerText;
            navigator.clipboard.writeText(code);
            const icon = this.querySelector('.copy-icon');
            const check = this.querySelector('.check-icon');
            const text = this.querySelector('.copy-text');
            icon.classList.add('hidden');
            check.classList.remove('hidden');
            text.innerText = 'Copied!';
            setTimeout(() => {
                icon.classList.remove('hidden');
                check.classList.add('hidden');
                text.innerText = 'Copy';
            }, 2000);
        " class="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-zinc-300 hover:text-white bg-zinc-800/60 hover:bg-zinc-700 active:scale-95 transition-all duration-200 text-xs md:text-sm font-medium border border-zinc-700/40 shadow-sm">
            <svg class="copy-icon w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
            </svg>
            <svg class="check-icon w-3.5 h-3.5 text-emerald-400 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="copy-text">Copy</span>
        </button>
    </div>
    <pre class="p-5 overflow-x-auto text-left m-0"><code class="block font-mono text-sm md:text-[15px] leading-relaxed text-zinc-100">${highlightedCode}</code></pre>
</div>
        `.trim();
    });

    return { html, headings };
}
