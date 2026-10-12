# Component Interface Contract: MermaidBlock

**Feature**: `001-markdown-mermaid-support`  
**Contract Version**: `1.0.0`  
**Location**: `apps/web/features/lessons/components/mermaid-block.tsx`

---

## 1. Exported Component Contract

```typescript
import React from "react";

export interface MermaidBlockProps {
  /** Raw Mermaid syntax (e.g. sequenceDiagram, flowchart TD, etc.) */
  code: string;
  /** Optional container class name */
  className?: string;
}

/**
 * Renders a Mermaid diagram with interactive controls (copy code, toggle code/diagram, fullscreen zoom modal).
 * Dynamically loads the mermaid library on the client to preserve bundle efficiency.
 */
export const MermaidBlock: React.FC<MermaidBlockProps>;
```

---

## 2. Integration Contract in `markdown.tsx`

In `apps/web/components/markdown.tsx`, within `markdownComponents.code`:

```typescript
code: ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "";
  const codeString = String(children).replace(/\n$/, "");

  if (!inline && match) {
    if (lang === "mermaid") {
      return <MermaidBlock code={codeString} />;
    }
    return <CodeBlock code={codeString} language={lang} />;
  }

  return (
    <code className="..." {...props}>
      {children}
    </code>
  );
}
```

---

## 3. Behavioral Contracts

1. **Lazy Loading**: `mermaid` MUST NOT be imported at module top-level in `markdown.tsx` or `mermaid-block.tsx`. It MUST be imported inside an effect/dynamic function (`await import("mermaid")`).
2. **Theme Reactivity**: When `resolvedTheme` from `next-themes` changes, `MermaidBlock` MUST re-render the diagram with updated theme variables within 300ms.
3. **Modal Dialog**:
   - Clicking Fullscreen opens the modal displaying the diagram SVG.
   - Pressing `Escape` or clicking the backdrop MUST close the modal.
   - Zoom controls (+, -, reset) MUST adjust the SVG scale between 0.5x and 3.0x.
4. **Copy Action**: Clicking "Copy" MUST invoke `navigator.clipboard.writeText(code)` and display visual confirmation for 2000ms.
