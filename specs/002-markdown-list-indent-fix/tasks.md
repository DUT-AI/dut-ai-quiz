# Tasks: Markdown List Indentation & Nested Content Rendering Fix

**Input**: Design documents from `/specs/002-markdown-list-indent-fix/`  
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md  

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story identifier ([US1], [US2], [US3])
- Exact file paths included in each description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify local environment and baseline state

- [X] T001 Inspect existing Markdown parsing and regex routines in `apps/web/components/markdown.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core indentation and tab normalization utilities

- [X] T002 Implement `normalizeTabs` helper function to standardize tab characters (`\t`) to 4 spaces uniformly in `apps/web/components/markdown.tsx`

**Checkpoint**: Tab normalization is in place to guarantee consistent column calculations.

---

## Phase 3: User Story 1 - Render Nested Elements Inside List Items Without Breaking Into Code Blocks (Priority: P1) 🎯 MVP

**Goal**: Ensure indented display math formulas (`$$...$$`), images (`![...](...)`), and child bullet items (`- ...`) render as nested rich elements without resetting list hierarchy or collapsing into code blocks.

**Independent Test**: Provide markdown with bullet items containing indented `$$...$$`, an image, and child bullets; verify math is centered, the image is previewable with lightbox, and child bullets render as nested lists.

### Implementation for User Story 1

- [X] T003 [US1] Refactor `preprocessMath` to detect leading line indentation before `$$` and preserve that indentation across the opening `$$`, formula content lines, and closing `$$` in `apps/web/components/markdown.tsx`
- [X] T004 [US1] Integrate `normalizeTabs` into the `preparedContent` memo pipeline prior to math preprocessing in `apps/web/components/markdown.tsx`
- [X] T005 [US1] Verify that `findHighlightRanges` and highlight span wrapping continue to work seamlessly with preserved math indentation in `apps/web/components/markdown.tsx`

**Checkpoint**: User Story 1 MVP complete - indented math blocks and nested list items retain their parent list hierarchy.

---

## Phase 4: User Story 2 - Prevent Accidental 4-Space / Tab Indented Code Blocks (Priority: P2)

**Goal**: Disable CommonMark's legacy 4-space / tab indented code block tokenizer so indentation is always treated as visual layout/nesting rather than code, reserving code blocks strictly for explicit triple backticks (```` ``` ````).

**Independent Test**: Submit text indented by 4 spaces or a tab without code fences; verify it renders as a paragraph or nested list item, while fenced blocks (```` ```python ````) still render as interactive code blocks.

### Implementation for User Story 2

- [X] T006 [US2] Create and register `remarkDisableIndentedCode` unified plugin to configure `micromarkExtensions` with `{ disable: { null: ['codeIndented'] } }` in `apps/web/components/markdown.tsx`
- [X] T007 [US2] Register `remarkDisableIndentedCode` in the `remarkPlugins` array of `<ReactMarkdown>` in `apps/web/components/markdown.tsx`

**Checkpoint**: Accidental 4-space code blocks are completely disabled; only fenced blocks become code.

---

## Phase 5: User Story 3 - Graceful Handling of Untagged / Generic Code Blocks (Priority: P3)

**Goal**: Ensure code blocks without language tags render in a styled block container with copy button rather than collapsing into an inline pink badge.

**Independent Test**: Render fenced code without language identifier (```` ```\nline 1\nline 2\n``` ````) and verify it displays as a proper code block card.

### Implementation for User Story 3

- [X] T008 [US3] Add a custom `pre` component renderer to `markdownComponents` to prevent raw unstyled `<pre>` output in `apps/web/components/markdown.tsx`
- [X] T009 [US3] Update the `code` component in `markdownComponents` to render untagged block-level code via `CodeBlock` with `language="plaintext"` while preserving pink badge styling strictly for true inline code in `apps/web/components/markdown.tsx`

**Checkpoint**: All three user stories implemented with clean visual hierarchy.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Type safety, build validation, and visual regression testing across all scenarios

- [X] T010 Run TypeScript type checking (`npm run type-check`) in `apps/web/package.json`
- [X] T011 Validate all 4 scenarios from `specs/002-markdown-list-indent-fix/quickstart.md` (Primary user case, deeply nested list, fenced code, untagged code)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - starts immediately
- **Foundational (Phase 2)**: Depends on T001
- **User Story 1 (Phase 3)**: Depends on T002 - Deliver MVP
- **User Story 2 (Phase 4)**: Depends on Phase 3
- **User Story 3 (Phase 5)**: Can run alongside or after Phase 4
- **Polish (Phase 6)**: Depends on all implementation tasks complete

### User Story Dependencies

- **User Story 1 (P1)**: Standalone MVP; resolves the math break and list collapse.
- **User Story 2 (P2)**: Complements US1 by preventing any other 4-space lines from triggering code blocks.
- **User Story 3 (P3)**: Enhances visual polish for code blocks without language specifiers.

---

## Parallel Execution Opportunities

- T006 (`remarkDisableIndentedCode`) and T008/T009 (`pre` and `code` styling) can be developed in tandem since they address different parts of the unified AST pipeline.

---

## Implementation Strategy

1. **MVP First**: Complete Phase 1 through Phase 3 (T001-T005) to immediately fix the user's reported bug with indented math, images, and child bullets.
2. **Robustness**: Complete Phase 4 (T006-T007) to permanently eliminate accidental 4-space code blocks.
3. **Polish**: Complete Phase 5 and Phase 6 (T008-T011) to ensure pristine visual quality and TypeScript correctness.
