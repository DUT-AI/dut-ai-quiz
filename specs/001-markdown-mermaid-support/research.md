# Phase 0 Research: Mermaid Rendering Architecture & Integration

**Feature**: `001-markdown-mermaid-support`  
**Date**: 2026-10-13  
**Target**: `apps/web/components/markdown.tsx`

---

## 1. Core Rendering Engine Selection

### Decision
Use the official `mermaid` package (v11) imported dynamically via `import("mermaid")` inside a custom Next.js client component (`MermaidBlock`).

### Rationale
- **Bundle Optimization**: The `mermaid` library bundle is ~1.5MB unminified (~300KB gzipped). By dynamically importing it on-demand only when a `mermaid` code block is actually mounted in the DOM, pages without Mermaid diagrams pay zero bundle penalty.
- **Next.js 14 App Router & SSR Safety**: Mermaid requires the browser DOM (`document`, `window`, SVG elements). Using `"use client"` with `useEffect` or dynamic `import()` completely prevents Server-Side Rendering (SSR) hydration mismatch errors.
- **Up-to-date syntax**: Direct use of official `mermaid` supports all modern diagrams (sequence diagrams with autonumber, actors, notes, state diagrams, class diagrams, mindmaps, gitgraphs).

### Alternatives Evaluated
- `react-mermaid` / `mermaid-react`: Outdated (unmaintained, locked to Mermaid v8/v9, problematic in React 18 / Next.js 14).
- Server-side SVG pre-rendering: Requires Node-based canvas/headless browser (e.g. Puppeteer), slow for dynamic user markdown and quiz generation.

---

## 2. React 18 & Client-Side Rendering Strategy

### Decision
Use `mermaid.render(id, code)` with an auto-incrementing/unique ID, memoized rendering with `useId()` or random nanoid prefix, and unmount cleanup.

### Key Technical Details
1. **Double-invocation in React StrictMode**:
   In development, React 18 mounts components twice. If two render calls use the same element ID, Mermaid throws `Element already exists`.
   *Solution*: Generate unique IDs like `mermaid-svg-${uniqueId}-${renderCount}` and render into a detached off-screen container before injecting into the DOM, or catch and cleanly replace existing SVG contents.
2. **Error Boundary & Syntax Validation**:
   `mermaid.parse(code)` or `mermaid.render()` wrapped in `try...catch`.
   When parsing fails (e.g. user enters invalid syntax), catch the error, suppress default error modal/alert from Mermaid by configuring `suppressErrorRendering: true`, and display a styled error alert with a fallback to raw code view.

---

## 3. Theming & Dark/Light Mode Synchronization

### Decision
Integrate with `next-themes` (`useTheme()` -> `resolvedTheme`).
Re-initialize Mermaid or pass theme configurations dynamically upon theme change.

### Color Mapping
- **Dark Mode**:
  - Theme: `dark` / `base`
  - Background: `#0B0F17` / `#0D1525` (matching existing code-block background)
  - Primary color: `#10b981` (emerald-500)
  - Primary text: `#f1f5f9` (slate-100)
  - Line / Arrow color: `#64748b` / `#34d399`
  - Actor background: `#1e293b`
  - Actor border: `#334155`
- **Light Mode**:
  - Theme: `neutral` / `base`
  - Background: `#ffffff`
  - Primary color: `#059669` (emerald-600)
  - Primary text: `#0f172a` (slate-900)
  - Line / Arrow color: `#64748b`
  - Actor background: `#f8fafc`
  - Actor border: `#cbd5e1`

---

## 4. UI Wrapper & Controls Design

### Decision
Wrap the diagram in a card container consistent with [`code-block.tsx`](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/apps/web/features/lessons/components/code-block.tsx):
1. **Window Header**:
   - 3 colored macOS dots (rose, amber, emerald).
   - Diagram type indicator (e.g., `mermaid · sequence`).
   - Action bar:
     - **Toggle View**: Switch between "Diagram" and "Raw Code".
     - **Copy Code**: Copies original Mermaid syntax with "Copied!" toast/icon change.
     - **Fullscreen / Expand**: Opens a Framer Motion animated Lightbox modal with zoom & pan capability.
2. **Body**:
   - Smooth horizontal scroll container (`overflow-x-auto theory-scrollbar`).
   - Center-aligned SVG graphic with maximum responsiveness.
3. **Modal Lightbox**:
   - Darkened backdrop (`bg-black/80 backdrop-blur-md`).
   - Esc to close, click outside to close, X button.
   - Zoom controls (+ / - / Reset).
