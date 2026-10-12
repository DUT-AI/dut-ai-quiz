# Contract: Markdown Rendering Pipeline & Components

**Branch**: `002-markdown-list-indent-fix` | **Date**: 2026-10-13 | **Spec**: [specs/002-markdown-list-indent-fix/spec.md](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/specs/002-markdown-list-indent-fix/spec.md)

## 1. Markdown Component Interface Contract

The `Markdown` component defined in `apps/web/components/markdown.tsx` retains its public API:

```typescript
export interface MarkdownProps {
  /** The raw markdown string to render */
  content: string;
  /** Optional container class name */
  className?: string;
  /** Optional array of text chunks to highlight */
  highlightChunks?: string[];
}

export const Markdown: React.NamedExoticComponent<MarkdownProps>;
```

---

## 2. Preprocessor Contracts

### `normalizeTabs`
```typescript
/**
 * Normalizes tab indentation to 4 spaces to prevent column alignment drift.
 * @param text Raw markdown input string
 * @returns String with tabs uniformly expanded
 */
function normalizeTabs(text: string): string;
```

### `preprocessMath`
```typescript
/**
 * Prepares LaTeX $$ math $$ blocks for remark-math display block parsing.
 * Preserves the parent indentation context if the formula is inside a list or indented block.
 *
 * @param text Tab-normalized markdown string
 * @returns Transformed string with preserved indentation
 */
function preprocessMath(text: string): string;
```

**Contract Rules**:
- Single-line formulas: `    $$ L = -\ln(\hat{y}) $$` must become:
  ```text
      $$
      L = -\ln(\hat{y})
      $$
  ```
  with the `    ` prefix retained.
- Multi-line formulas: Must prefix every line between `$$` and `$$` with the same indentation.
- Standalone top-level formulas: Must maintain double newlines before and after `$$`.

---

## 3. Remark Plugin Contract

### `remarkDisableIndentedCode`
```typescript
/**
 * Unified/remark plugin that modifies the micromark parser settings
 * to disable 4-space / tab indented code block tokenization.
 */
function remarkDisableIndentedCode(this: any): void;
```

**Behavioral Contract**:
- Injects `{ disable: { null: ['codeIndented'] } }` into `this.data('micromarkExtensions')`.
- Does not modify any other tokens (e.g. lists, block quotes, headings, fenced code blocks).

---

## 4. Component Mapping Contract

### `markdownComponents`

| Tag | Trigger Condition | Rendered Output |
|---|---|---|
| `code` (inline) | `inline === true` or parent is not `<pre>` | `<code className="font-mono text-sm font-semibold text-pink-600 dark:text-pink-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-md">` |
| `code` (block) | `inline === false` with `language-mermaid` | `<MermaidBlock code={...} />` |
| `code` (block) | `inline === false` with `language-[lang]` | `<CodeBlock code={...} language={lang} />` |
| `code` (block) | `inline === false` with no language | `<CodeBlock code={...} language="plaintext" />` |
| `pre` | Block `<pre>` element | `<div className="my-4 overflow-hidden rounded-2xl">{children}</div>` |
| `img` | Standard markdown image | Rendered `<img>` with click-to-zoom modal state |
