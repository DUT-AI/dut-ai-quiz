import { renderMathInHTML } from "@/lib/render-math";

interface HeadingItem {
    id: string;
    text: string;
    level: number;
}

interface RenderResult {
    html: string;
    headings: HeadingItem[];
}

/**
 * Helper to strip markdown symbols (like **, *, _, `, html tags) from heading text.
 */
function stripMarkdown(text: string): string {
    return text
        .replace(/\*\*(.*?)\*\*/g, "$1") // bold
        .replace(/\*(.*?)\*/g, "$1")     // italic
        .replace(/_(.*?)_/g, "$1")       // italic
        .replace(/`(.*?)`/g, "$1")       // inline code
        .replace(/<[^>]*>/g, "")         // HTML tags
        .trim();
}

/**
 * Standard slugify function helper for generating clean heading IDs.
 * Supports Vietnamese accent removal.
 */
function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accent marks
        .replace(/[đĐ]/g, "d")
        .replace(/[^a-z0-9\s-]/g, "") // remove special characters
        .trim()
        .replace(/\s+/g, "-") // replace spaces with -
        .replace(/-+/g, "-"); // remove duplicate -
}

/**
 * Parses markdown table structure (rows starting/ending with |) and converts it to HTML.
 */
function parseMarkdownTables(markdown: string): string {
    const lines = markdown.split(/\r?\n/);
    const result: string[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let alignments: ("left" | "center" | "right" | null)[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const isTableRow = line.startsWith("|") && line.endsWith("|");

        if (isTableRow) {
            const cols = line.split("|").slice(1, -1).map((c) => c.trim());

            if (!inTable) {
                const nextLine = lines[i + 1] ? lines[i + 1].trim() : "";
                const isSeparator =
                    nextLine.startsWith("|") &&
                    nextLine.endsWith("|") &&
                    nextLine.replace(/[\s|:-]/g, "").length === 0;

                if (isSeparator) {
                    inTable = true;
                    tableRows = [cols];

                    const separatorCols = nextLine.split("|").slice(1, -1).map((c) => c.trim());
                    alignments = separatorCols.map((col) => {
                        if (col.startsWith(":") && col.endsWith(":")) return "center";
                        if (col.endsWith(":")) return "right";
                        if (col.startsWith(":")) return "left";
                        return null;
                    });

                    i++; // Skip the separator line
                } else {
                    result.push(lines[i]);
                }
            } else {
                tableRows.push(cols);
            }
        } else {
            if (inTable) {
                result.push(renderHTMLTable(tableRows, alignments));
                inTable = false;
                tableRows = [];
                alignments = [];
            }
            result.push(lines[i]);
        }
    }

    if (inTable) {
        result.push(renderHTMLTable(tableRows, alignments));
    }

    return result.join("\n");
}

/**
 * Renders parsed rows and alignments into a beautiful, styled HTML table.
 */
function renderHTMLTable(
    rows: string[][],
    alignments: ("left" | "center" | "right" | null)[]
): string {
    if (rows.length === 0) return "";

    let html =
        '<div class="overflow-x-auto my-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800 shadow-sm bg-white dark:bg-slate-900/20"><table class="w-full border-collapse text-left text-lg md:text-xl">';

    // Render Header
    const headers = rows[0];
    html += '<thead><tr class="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-zinc-800">';
    headers.forEach((h, idx) => {
        const align = alignments[idx];
        const alignClass = align ? ` text-${align}` : "";
        html += `<th class="px-6 py-4 font-bold text-slate-900 dark:text-white text-lg md:text-xl${alignClass}">${h}</th>`;
    });
    html += "</tr></thead>";

    // Render Body
    if (rows.length > 1) {
        html += '<tbody class="divide-y divide-slate-200 dark:divide-zinc-800/80">';
        for (let r = 1; r < rows.length; r++) {
            const cols = rows[r];
            html += '<tr class="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">';
            for (let c = 0; c < headers.length; c++) {
                const val = cols[c] || "";
                const align = alignments[c];
                const alignClass = align ? ` text-${align}` : "";
                html += `<td class="px-6 py-4 text-slate-700 dark:text-slate-200 font-normal leading-relaxed text-lg md:text-xl${alignClass}">${val}</td>`;
            }
            html += "</tr>";
        }
        html += "</tbody>";
    }

    html += "</table></div>";
    return html;
}

/**
 * Basic markdown/latex renderer helper for theory content.
 */
export function renderTheoryMarkdown(raw: string): RenderResult {
    if (!raw) return { html: "", headings: [] };

    let html = parseMarkdownTables(raw);
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

    // 1. Format blockquotes first so they don't get wrapped in paragraphs
    html = html.replace(/^>\s*(.*$)/gim, '<blockquote class="border-l-4 border-emerald-500 bg-slate-50 dark:bg-slate-900/40 px-5 py-3 my-6 rounded-r-xl italic text-slate-600 dark:text-slate-400 text-lg md:text-xl">$1</blockquote>');
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

    // 3. Format lists with Tailwind classes
    html = html.replace(/^\* (.*$)/gim, '<li class="list-disc ml-6 my-2 text-lg md:text-xl text-slate-700 dark:text-slate-200 font-normal leading-relaxed">$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li class="list-disc ml-6 my-2 text-lg md:text-xl text-slate-700 dark:text-slate-200 font-normal leading-relaxed">$1</li>');

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
                trimmed.startsWith("<table")
            ) {
                return trimmed;
            }
            return `<p class="text-lg md:text-xl text-slate-700 dark:text-slate-200 font-normal leading-relaxed my-5">${trimmed}</p>`;
        })
        .join("\n\n");

    // 5. Render math, bold, italic, code blocks, etc. (Called ONLY once here)
    html = renderMathInHTML(html);

    // 6. Post-process bold and inline code to apply premium Tailwind styling
    html = html.replace(/<strong>/gi, '<strong class="font-bold text-slate-900 dark:text-white">');
    html = html.replace(/<code>/gi, '<code class="font-mono text-sm font-semibold text-pink-600 dark:text-pink-400 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-zinc-700/50 px-1.5 py-0.5 rounded-md">');

    // 7. Post-process tables is removed since tables are parsed and styled directly in renderHTMLTable

    // 8. Style KaTeX container spacing and size
    html = html.replace(/class="katex-display"/g, 'class="katex-display my-6 p-2 overflow-x-auto overflow-y-hidden select-all"');
    html = html.replace(/class="katex"/g, 'class="katex text-[1.05em] select-all"');

    // 9. Clean up any unnecessary <br /> tags between/around block elements
    html = html
        .replace(/(<\/(p|h1|h2|h3|h4|li|ul|ol|hr|div|blockquote)>)(?:\s*<br\s*\/?>)+/gi, "$1")
        .replace(/(?:\s*<br\s*\/?>)+(<(p|h1|h2|h3|h4|li|ul|ol|hr|div|blockquote)[^>]*>)/gi, "$1");

    // 10. Post-process images to apply cursor-pointer hover style
    html = html.replace(/<img([^>]*)>/gi, (_, attrs) => {
        if (attrs.includes('class="') || attrs.includes("class='")) {
            return `<img${attrs.replace(/class=["']([^"']*)["']/i, 'class="$1 cursor-pointer"')}>`;
        } else {
            return `<img class="cursor-pointer"${attrs}>`;
        }
    });

    return { html, headings };
}

