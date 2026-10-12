# Technical Research: Markdown List Indentation & Nested Content Rendering Fix

**Branch**: `002-markdown-list-indent-fix` | **Date**: 2026-10-13 | **Spec**: [specs/002-markdown-list-indent-fix/spec.md](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/specs/002-markdown-list-indent-fix/spec.md)

## Executive Summary

When teachers author or AI generates lesson theory and quiz content, they frequently use lists with indented blocks (display math `$$...$$`, images `![...](...)`, child bullet points `- ...`). In the current implementation, these indented lines are mistakenly parsed as CommonMark indented code blocks (`<pre><code>`) and rendered with pink inline badges. This document evaluates the root causes and defines the technical design to completely resolve this issue without introducing regressions.

---

## Research Tasks & Findings

### Task 1: Root Cause Analysis of Indented Code Block Ingestion

#### Problem
In Markdown rendered via `ReactMarkdown` in `apps/web/components/markdown.tsx`, content such as:
```markdown
- **Khi nhãn thực tế $y = 1$:** Vế sau triệt tiêu, hàm mất mát chỉ còn:
    
    $$
    L = -\ln(\hat{y})
    $$
    
    ![image.png](...)
    
    - Nếu $\hat{y} \to 1$...
```
results in `![image.png](...)` and `- Nếu...` being rendered inside pink `<code>` badges instead of an image and nested list.

#### Root Causes Identified
1. **Unindented `preprocessMath` Output**:
   In `markdown.tsx`:
   ```ts
   const preprocessMath = (text: string) => {
     return text.replace(/\$\$([\s\S]+?)\$\$/g, (match, math) => {
       return `\n\n$$\n${math.trim()}\n$$\n\n`;
     });
   };
   ```
   When `preprocessMath` encounters `$$` indented under a list item, it replaces it with `\n\n$$\n...\n$$\n\n` with `$$` starting at column 0. This column-0 break resets the list context and closes the parent `<li>` immediately.
2. **CommonMark Indented Code Block Rule**:
   Once the parent `<li>` is closed, subsequent lines starting with 4 spaces or a tab (`\t`) are at the document root level. According to the CommonMark spec, 4-space / tab-indented lines are parsed as an **indented code block** (`codeIndented`).
3. **Improper Fallback in `<code />` Component**:
   When an indented code block is parsed, `ReactMarkdown` renders `<pre><code>...</code></pre>`. Because the block has no `language-*` class, `markdownComponents.code` falls back to its default inline styling (`text-pink-600 dark:text-pink-400 bg-slate-100 ...`), rendering an awkward multi-line pink badge.

---

### Task 2: Disabling Indented Code Blocks in remark / micromark

#### Evaluation of Options

| Option | Implementation | Pros | Cons | Decision |
|---|---|---|---|---|
| **Option A: micromark construct disable plugin** | Remark plugin adding `{ disable: { null: ['codeIndented'] } }` to `micromarkExtensions`. | Native support in micromark. Completely disables 4-space code blocks. Only fenced code blocks (```` ``` ````) are treated as code. Tab and 4 spaces always format as normal markdown indentation. | None. Standard in modern Markdown editors (Notion, GitHub Discussions, Discord). | **SELECTED** |
| **Option B: AST Transformation via unist-util-visit** | Parse tree and convert `code` nodes without language back to paragraphs. | Retains parser defaults. | Complex; raw markdown inside code nodes has already been tokenized as text (losing links, math, and images). | Rejected |
| **Option C: Regex strip indentation before parsing** | Preprocess all 4-space lines. | Simple string operation. | Destroys intended list nesting and code block formatting. | Rejected |

#### Decision
Implement a lightweight custom remark plugin `remarkDisableIndentedCode`:
```ts
function remarkDisableIndentedCode(this: any) {
  const data = this.data();
  const extensions = data.micromarkExtensions || (data.micromarkExtensions = []);
  extensions.push({
    disable: { null: ["codeIndented"] },
  });
}
```
This is zero-overhead, requires no extra dependencies, and permanently prevents any tab or 4-space indent from being hijacked by the code block tokenizer.

---

### Task 3: Math Preprocessing with Preserved Indentation

#### Evaluation of Options

| Option | Implementation | Pros | Cons | Decision |
|---|---|---|---|---|
| **Option A: Line-Aware Indentation Preservation** | Capture leading whitespace before `$$` on the same line, prefix `$$` and inner lines with that same indentation. | Preserves exact list nesting depth for `remark-math` and `remark-gfm`. Works for nested lists at any depth. | Must handle both single-line and multi-line formulas. | **SELECTED** |
| **Option B: Global unindent of math only** | Normalize all math without newlines. | Easy to write. | Fails for multi-line display math blocks where `remark-math` requires standalone lines. | Rejected |

#### Decision
Enhance `preprocessMath`:
1. Normalize tabs (`\t`) to 4 spaces first.
2. Capture the line's indentation before `$$`:
   ```ts
   return text.replace(/(^|[ \t]*)\$\$([\s\S]+?)\$\$/gm, (match, indent, math) => {
     const trimmed = math.trim();
     const mathLines = trimmed
       .split("\n")
       .map((line: string) => `${indent}${line.trim()}`)
       .join("\n");
     return `\n\n${indent}$$\n${mathLines}\n${indent}$$\n\n`;
   });
   ```
This ensures `remark-math` sees valid display math fences while keeping the token within the parent list indentation.

---

### Task 4: Fallback Styling for Code Blocks

#### Decision
In `markdownComponents`:
1. Add an explicit `pre` component renderer to avoid unstyled `<pre>` elements.
2. In `code` component, distinguish between true inline code and block-level code:
   - If `inline` is true (or parent is not `<pre>`): render the pink inline pill.
   - If `inline` is false and no language is provided: render using `CodeBlock` with `language="plaintext"` or clean neutral block styling with rounded corners, proper dark/light mode background, and a copy button.

---

## Conclusion & Architecture Roadmap

The implementation requires 3 coordinated enhancements inside `apps/web/components/markdown.tsx` and related utilities:
1. **`remarkDisableIndentedCode`**: Remark plugin to disable indented code blocks.
2. **`preprocessMath` & Indentation Normalizer**: Line-indentation-preserving math transformer.
3. **`code` & `pre` Component Refinements**: Clean handling of untagged code blocks.
