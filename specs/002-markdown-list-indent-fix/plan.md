# Implementation Plan: Markdown List Indentation & Nested Content Rendering Fix

**Branch**: `002-markdown-list-indent-fix` | **Date**: 2026-10-13 | **Spec**: [specs/002-markdown-list-indent-fix/spec.md](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/specs/002-markdown-list-indent-fix/spec.md)

**Input**: Feature specification from `/specs/002-markdown-list-indent-fix/spec.md`

## Summary

Fix unintended code block conversion when markdown content contains indented lines inside lists (such as multi-line KaTeX display math `$$...$$`, images `![...](...)`, and child bullet items `- ...`). The solution implements a 3-part enhancement in `apps/web/components/markdown.tsx`:
1. A zero-overhead custom remark plugin (`remarkDisableIndentedCode`) that disables micromark's legacy 4-space indented code block tokenizer so only explicit triple-backtick fences (```` ``` ````) become code blocks.
2. An indentation-aware math preprocessor (`preprocessMath`) that preserves the parent list item's indentation prefix when formatting display math blocks.
3. Fallback component improvements for `<code />` and `<pre />` so untagged block code renders cleanly as standard code blocks instead of collapsing into inline pink badges.

## Technical Context

**Language/Version**: TypeScript 5.3+, React 18.2, Next.js 14.1.4 (App Router, Client Component)

**Primary Dependencies**:
- `react-markdown` (^10.1.0, already installed)
- `remark-gfm` (^4.0.1, already installed)
- `remark-math` (^6.0.0, already installed)
- `rehype-katex` (^7.0.1, already installed)
- `rehype-raw` (^7.0.0, already installed)

**Storage**: N/A (Frontend markdown rendering pipeline only)

**Testing**: Visual regression and test case verification with user's exact database sample and edge-case inputs in `quickstart.md`; TypeScript typecheck (`npm run type-check`).

**Target Platform**: Modern web browsers (Desktop & Mobile)

**Project Type**: Next.js Web Application Frontend Component (`apps/web`)

**Performance Goals**:
- 0ms additional network payload (no new external npm packages required).
- Markdown render execution overhead: < 2ms for typical lesson contents.

**Constraints**:
- Must not break existing KaTeX formulas, Mermaid diagrams, or code block syntax highlighting.
- Must preserve search highlight chunk functionality (`highlightChunks`).
- Must maintain image lightbox preview functionality.

**Scale/Scope**: Affects all markdown rendering across lessons, quizzes, homework submissions, and hackathons.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Simplicity & YAGNI**: PASS. Zero new libraries installed. Solves root causes directly within the existing unified pipeline.
- **Library-First / Component Isolation**: PASS. Logic contained cleanly within `markdown.tsx` and modular remark plugin.
- **Testability**: PASS. Defined 5 concrete test cases covering list indentation, math preservation, and image rendering in `quickstart.md`.
- **Maintainability & Clean Code**: PASS. Self-documenting functions with explicit regular expressions and AST plugin hooks.

## Project Structure

### Documentation (this feature)

```text
specs/002-markdown-list-indent-fix/
├── plan.md              # Master implementation plan (/speckit-plan output)
├── research.md          # Technical research & root cause analysis (Phase 0 output)
├── data-model.md        # Pipeline data structures & entity model (Phase 1 output)
├── quickstart.md        # Validation guide with test samples (Phase 1 output)
├── contracts/
│   └── markdown-pipeline.md # Component interface & pipeline contract
└── checklists/
    └── requirements.md  # Requirements quality checklist
```

### Source Code Impact

```text
apps/web/
└── components/
    └── markdown.tsx     # Enhanced preprocessMath, remarkDisableIndentedCode plugin, and pre/code components
```

**Structure Decision**:
All code changes are scoped to `apps/web/components/markdown.tsx` to maintain unified formatting behavior across the entire application without touching backend or database models.

## Complexity Tracking

No constitution violations detected. Solution uses built-in micromark configuration and string preprocessing without introducing additional runtime complexity.
