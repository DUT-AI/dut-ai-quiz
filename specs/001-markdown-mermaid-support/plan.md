# Implementation Plan: Markdown Mermaid Diagram Rendering

**Branch**: `001-markdown-mermaid-support` | **Date**: 2026-10-13 | **Spec**: [specs/001-markdown-mermaid-support/spec.md](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/specs/001-markdown-mermaid-support/spec.md)

**Input**: Feature specification from `/specs/001-markdown-mermaid-support/spec.md`

## Summary

Enable high-fidelity rendering of Mermaid diagrams (sequence, flowchart, ER, class diagrams) inside Markdown components (`apps/web/components/markdown.tsx`) by introducing a dedicated client-side `MermaidBlock` component. The solution uses the official `mermaid` library loaded on-demand via dynamic client-side import, matching the system's Dark/Light mode tokens, and provides rich interaction controls: macOS-style container, internal horizontal scroll, toggle between Diagram and Raw Code, Copy code button, and a Fullscreen Lightbox Modal with zoom capabilities.

## Technical Context

**Language/Version**: TypeScript 5.3+, React 18.2, Next.js 14.1.4 (App Router, Client Component)

**Primary Dependencies**:
- `mermaid` (v11, to be installed in `apps/web`)
- `framer-motion` (^11.0.25, already installed)
- `lucide-react` (^1.8.0, already installed)
- `next-themes` (^0.4.6, already installed)
- `react-markdown` (^10.1.0, already installed)

**Storage**: N/A (Client-side rendering & component state)

**Testing**: Manual & component validation via test scenarios in `quickstart.md`, Next.js build validation (`npm run build` / `npm run type-check`)

**Target Platform**: Web browsers (Chrome, Safari, Firefox, Edge, iOS Safari, Android Chrome)

**Project Type**: Next.js Web Application Frontend Component (`apps/web`)

**Performance Goals**:
- Initial bundle overhead for non-diagram pages: 0 KB (lazy-loaded dynamic import)
- Diagram render time: < 150ms on desktop, < 250ms on mobile
- Theme switch transition: < 300ms without page reload

**Constraints**:
- Strict SSR hydration safety (must not run `mermaid.render` during server rendering)
- React 18 Strict Mode compatibility (prevent duplicate ID collisions)
- Responsive layout (no horizontal page overflow on small viewports)
- Error boundary isolation (syntax errors must not break page)

**Scale/Scope**: Impacts all markdown-rendered lessons, quiz questions, and theory panels across the web app.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Simplicity & YAGNI**: PASS. Using direct core `mermaid` dynamic import rather than unnecessary heavyweight wrappers.
- **Library-First / Component Isolation**: PASS. `MermaidBlock` is an isolated, reusable React component located in `features/lessons/components/mermaid-block.tsx`.
- **Testability**: PASS. Documented 5 comprehensive end-to-end scenarios in `quickstart.md`.
- **Maintainability & Clean Code**: PASS. Reuses existing design patterns established in `code-block.tsx` and image modal lightbox in `markdown.tsx`.

## Project Structure

### Documentation (this feature)

```text
specs/001-markdown-mermaid-support/
├── plan.md              # Master implementation plan
├── research.md          # Technical research & engine evaluation
├── data-model.md        # State models & component props
├── quickstart.md        # Step-by-step verification guide
├── contracts/
│   └── mermaid-component.md # Component interface contract
└── checklists/
    └── requirements.md  # Requirements quality checklist
```

### Source Code Impact

```text
apps/web/
├── package.json                                         # Add "mermaid" dependency
├── components/
│   └── markdown.tsx                                     # Intercept language-mermaid in code component
└── features/
    └── lessons/
        └── components/
            ├── code-block.tsx                           # Reusable code block (existing)
            ├── mermaid-block.tsx                        # New: Mermaid rendering, toolbar & state
            └── mermaid-modal.tsx                        # New: Fullscreen Lightbox with zoom controls
```

**Structure Decision**:
- `mermaid-block.tsx` encapsulates dynamic import, SVG rendering, error boundary, and the macOS-style toolbar.
- `mermaid-modal.tsx` encapsulates the Framer Motion lightbox dialog with zoom controls (+, -, reset) and pan support.
- `markdown.tsx` routes `code` blocks with language `mermaid` to `<MermaidBlock code={codeString} />`.

## Complexity Tracking

No constitution violations detected. Design adheres to minimal necessary abstraction with lazy-loading for optimal web performance.
