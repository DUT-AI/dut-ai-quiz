/**
 * Renders parsed rows and alignments into a beautiful, styled HTML table.
 */
export function renderHTMLTable(
    rows: string[][],
    alignments: ("left" | "center" | "right" | null)[]
): string {
    if (rows.length === 0) return "";

    let html =
        '<div class="overflow-x-auto theory-scrollbar my-8 rounded-2xl border border-zinc-200 dark:border-[#2A3E5A] shadow-md shadow-zinc-200/30 dark:shadow-xl dark:shadow-black/30 bg-[#FFFFFF] dark:bg-[#1C2B40] transition-all duration-300 hover:shadow-lg hover:border-zinc-300 dark:hover:border-[#385175]"><table class="w-full border-collapse text-left text-lg md:text-xl">';

    // Render Header
    const headers = rows[0];
    html += '<thead><tr class="bg-emerald-50/80 dark:bg-[#18352B] border-b border-zinc-200 dark:border-[#1E4E3C] select-none">';
    headers.forEach((h, idx) => {
        const align = alignments[idx];
        const alignClass = align ? ` text-${align}` : "";
        html += `<th class="px-6 py-4.5 font-semibold text-emerald-900 dark:text-emerald-300 text-lg md:text-xl tracking-wide border-r border-zinc-200/60 dark:border-[#1E4E3C]/60 last:border-r-0${alignClass}">${h}</th>`;
    });
    html += "</tr></thead>";

    // Render Body
    if (rows.length > 1) {
        html += '<tbody class="divide-y divide-zinc-200/60 dark:divide-[#253952]/80">';
        for (let r = 1; r < rows.length; r++) {
            const cols = rows[r];
            html += '<tr class="group odd:bg-[#FFFFFF] even:bg-zinc-50/40 dark:odd:bg-[#182638] dark:even:bg-[#1F3148] hover:bg-emerald-50/50 dark:hover:bg-[#163D2E] transition-all duration-150">';
            for (let c = 0; c < headers.length; c++) {
                const val = cols[c] || "";
                const align = alignments[c];
                const alignClass = align ? ` text-${align}` : "";
                html += `<td class="px-6 py-4 text-zinc-700 dark:text-zinc-200 font-normal leading-relaxed text-lg md:text-xl border-r border-zinc-200/40 dark:border-[#253952] last:border-r-0 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors${alignClass}">${val}</td>`;
            }
            html += "</tr>";
        }
        html += "</tbody>";
    }

    html += "</table></div>";
    return html;
}

/**
 * Parses markdown table structure (rows starting/ending with |) and converts it to HTML.
 */
export function parseMarkdownTables(markdown: string): string {
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
