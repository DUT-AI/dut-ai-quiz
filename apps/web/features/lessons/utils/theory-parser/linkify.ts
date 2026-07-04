/**
 * Converts plain text URLs (http/https) in HTML to clickable <a> links,
 * while ignoring tags, attribute values, and code/pre/katex blocks.
 */
export function linkifyPlainURLs(htmlText: string): string {
    const parts = htmlText.split(/(<[^>]+>)/g);
    let inAnchor = 0;
    let inPre = 0;
    let inCode = 0;
    let inKatex = 0;

    const urlRegex = /(https?:\/\/[^\s<"']+)/g;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;

        if (part.startsWith("<")) {
            // It's an HTML tag
            const tagNameMatch = part.match(/^<\/?([a-zA-Z0-9]+)/);
            if (tagNameMatch) {
                const tagName = tagNameMatch[1].toLowerCase();
                const isClosing = part.startsWith("</");

                if (tagName === "a") {
                    inAnchor += isClosing ? -1 : 1;
                } else if (tagName === "pre") {
                    inPre += isClosing ? -1 : 1;
                } else if (tagName === "code") {
                    inCode += isClosing ? -1 : 1;
                } else if (part.includes("katex")) {
                    inKatex += isClosing ? -1 : 1;
                } else if (tagName === "span" && inKatex > 0 && isClosing) {
                    inKatex = Math.max(0, inKatex - 1);
                } else if (tagName === "div" && inKatex > 0 && isClosing) {
                    inKatex = Math.max(0, inKatex - 1);
                }
            }
        } else {
            // It's text outside HTML tags
            if (inAnchor <= 0 && inPre <= 0 && inCode <= 0 && inKatex <= 0) {
                parts[i] = part.replace(urlRegex, (url) => {
                    // Clean up trailing punctuation that shouldn't be part of the URL
                    let trailing = "";
                    let cleanUrl = url;

                    while (cleanUrl.length > 0 && /[\.,;\?\!\)]$/.test(cleanUrl)) {
                        if (cleanUrl.endsWith(")")) {
                            const openCount = (cleanUrl.match(/\(/g) || []).length;
                            const closeCount = (cleanUrl.match(/\)/g) || []).length;
                            if (closeCount <= openCount) {
                                break;
                            }
                        }
                        trailing = cleanUrl[cleanUrl.length - 1] + trailing;
                        cleanUrl = cleanUrl.slice(0, -1);
                    }

                    return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 underline underline-offset-4 decoration-emerald-600/30 hover:decoration-emerald-500 transition-colors font-medium break-all">${cleanUrl}</a>` + trailing;
                });
            }
        }
    }

    return parts.join("");
}
