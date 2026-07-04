/**
 * Helper to strip markdown symbols (like **, *, _, `, html tags) from heading text.
 */
export function stripMarkdown(text: string): string {
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
export function slugify(text: string): string {
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
 * Helper to escape HTML characters inside code blocks to prevent layout break.
 */
export function escapeHTML(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Normalizes single newlines (soft line breaks) in lists and paragraphs
 * so they are rendered continuously instead of splitting into separate blocks.
 */
export function joinSoftNewlines(markdown: string): string {
    const lines = markdown.split(/\r?\n/);
    const result: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (i === 0) {
            result.push(line);
            continue;
        }

        const prevLine = result[result.length - 1];
        const prevTrimmed = prevLine.trim();

        const isPrevEmpty = prevTrimmed === "";
        const isCurrentEmpty = trimmed === "";

        // Markers that indicate a new block element
        const isHeading = trimmed.startsWith("#");
        const isList = trimmed.startsWith("- ") || trimmed.startsWith("* ") || /^\d+\.\s/.test(trimmed);
        const isBlockquote = trimmed.startsWith(">");
        const isTable = trimmed.startsWith("|");
        const isCodeBlock = trimmed.startsWith("```") || trimmed.startsWith("<div");

        const prevIsTable = prevTrimmed.startsWith("|");
        const prevIsCodeBlock = prevTrimmed.startsWith("```") || prevTrimmed.startsWith("<div");
        const prevIsHeading = prevTrimmed.startsWith("#");

        if (
            !isPrevEmpty &&
            !isCurrentEmpty &&
            !isHeading &&
            !isList &&
            !isBlockquote &&
            !isTable &&
            !isCodeBlock &&
            !prevIsTable &&
            !prevIsCodeBlock &&
            !prevIsHeading
        ) {
            result[result.length - 1] = prevLine + " " + trimmed;
        } else {
            result.push(line);
        }
    }

    return result.join("\n");
}
