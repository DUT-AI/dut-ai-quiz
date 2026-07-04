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

export interface HeadingItem {
    id: string;
    text: string;
    level: number;
}

/**
 * Extracts headings from raw markdown for Table of Contents,
 * matching the same slugification logic as rehype Heading ID plugin.
 */
export function extractHeadings(markdown: string): HeadingItem[] {
    if (!markdown) return [];

    const headings: HeadingItem[] = [];
    const lines = markdown.split(/\r?\n/);
    const slugCounts = new Map<string, number>();
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip code blocks
        if (line.startsWith("```")) {
            inCodeBlock = !inCodeBlock;
            continue;
        }
        if (inCodeBlock) continue;

        const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const rawText = headingMatch[2].trim();
            const cleanText = stripMarkdown(rawText);

            let slug = slugify(cleanText);
            if (!slug) slug = "heading";

            const count = slugCounts.get(slug) || 0;
            slugCounts.set(slug, count + 1);
            const id = count > 0 ? `${slug}-${count}` : slug;

            headings.push({ id, text: cleanText, level });
        }
    }

    return headings;
}

/**
 * Rehype plugin to dynamically assign IDs to heading elements matching our TOC algorithm
 */
export function rehypeHeadingIds() {
  return (tree: any) => {
    const slugCounts = new Map<string, number>();

    function walk(node: any) {
      if (node.type === "element" && /^h[1-4]$/.test(node.tagName)) {
        let text = "";
        if (node.children) {
          const extractText = (children: any[]): string => {
            return children
              .map((c: any) => {
                if (c.type === "text") return c.value;
                if (c.type === "element" && c.children) return extractText(c.children);
                return "";
              })
              .join("");
          };
          text = extractText(node.children);
        }

        const cleanText = stripMarkdown(text);
        let slug = slugify(cleanText);
        if (!slug) slug = "heading";

        const count = slugCounts.get(slug) || 0;
        slugCounts.set(slug, count + 1);
        const id = count > 0 ? `${slug}-${count}` : slug;

        node.properties = node.properties || {};
        node.properties.id = id;
      }

      if (node.children) {
        node.children.forEach(walk);
      }
    }

    walk(tree);
  };
}
