# Tasks: Markdown Mermaid Diagram Rendering

**Input**: Design documents from `/specs/001-markdown-mermaid-support/`  
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md  

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story identifier ([US1], [US2], [US3])
- Exact file paths included in each description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependency installation and basic configuration

- [X] T001 Install `mermaid` dependency in `apps/web/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared theming and Mermaid engine configuration helper

- [X] T002 [P] Create theme and styling configuration helper for Mermaid in `apps/web/features/lessons/utils/mermaid-config.ts`

**Checkpoint**: Core package and theming utilities ready - user story implementation can begin

---

## Phase 3: User Story 1 - View Rendered Mermaid Diagrams in Markdown (Priority: P1) 🎯 MVP

**Goal**: Transform markdown code blocks with `mermaid` tag into interactive SVG diagrams matching the active theme

**Independent Test**: Provide markdown containing valid Mermaid syntax (e.g. sequence diagram) and verify clean SVG graphics render without hydration mismatch

### Implementation for User Story 1

- [X] T003 [US1] Create core `MermaidBlock` component with dynamic import, theme reactivity, and SVG container in `apps/web/features/lessons/components/mermaid-block.tsx`
- [X] T004 [US1] Intercept `language-mermaid` code blocks and route to `MermaidBlock` in `apps/web/components/markdown.tsx`

**Checkpoint**: User Story 1 is functional - valid Mermaid diagrams render on screen with light/dark theme support

---

## Phase 4: User Story 2 - Fullscreen Modal & Interactive Controls (Priority: P2)

**Goal**: Provide internal horizontal scrolling, macOS-style header toolbar, Copy Code action, Code/Diagram toggle, and Fullscreen Lightbox modal with zoom controls

**Independent Test**: Render a wide sequence diagram, click Fullscreen to open modal, test zoom in/out/reset, and toggle to view/copy raw source code

### Implementation for User Story 2

- [X] T005 [P] [US2] Implement `MermaidModal` component with Framer Motion, backdrop blur, and zoom (+, -, reset) controls in `apps/web/features/lessons/components/mermaid-modal.tsx`
- [X] T006 [US2] Connect Fullscreen modal trigger, Copy Code clipboard action, and Diagram/Code view mode toggle in `apps/web/features/lessons/components/mermaid-block.tsx`

**Checkpoint**: User Stories 1 and 2 work seamlessly - diagrams are interactive, expandable into fullscreen, and inspectable

---

## Phase 5: User Story 3 - Graceful Syntax Error & Loading Fallback (Priority: P3)

**Goal**: Prevent uncaught parse errors from crashing the page; provide an informative warning badge with raw code fallback and a smooth loading shimmer

**Independent Test**: Feed malformed Mermaid syntax and verify that a polite error card appears with the syntax-highlighted code block instead of a blank screen

### Implementation for User Story 3

- [X] T007 [US3] Implement syntax error boundary catching `mermaid.render` exceptions with fallback card in `apps/web/features/lessons/components/mermaid-block.tsx`
- [X] T008 [US3] Add loading skeleton/shimmer state during dynamic import and SVG rendering in `apps/web/features/lessons/components/mermaid-block.tsx`

**Checkpoint**: All user stories complete - component is resilient to incomplete/malformed diagrams and streaming updates

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Type safety verification, production build validation, and quickstart scenario testing

- [X] T009 [P] Run TypeScript type-check and lint validation across web app in `apps/web/package.json`
- [X] T010 Validate all 5 test scenarios (sequence diagram, fullscreen zoom, copy code, syntax error, theme switch) per `specs/001-markdown-mermaid-support/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - starts immediately
- **Foundational (Phase 2)**: Depends on T001
- **User Story 1 (Phase 3)**: Depends on T001, T002 - Deliver MVP
- **User Story 2 (Phase 4)**: Depends on Phase 3 (extends `mermaid-block.tsx`)
- **User Story 3 (Phase 5)**: Depends on Phase 3 and Phase 4
- **Polish (Phase 6)**: Depends on all implementation tasks complete

### User Story Dependencies

- **User Story 1 (P1)**: Standalone MVP; renders diagrams cleanly.
- **User Story 2 (P2)**: Builds upon US1 by adding modal zoom and toolbar actions.
- **User Story 3 (P3)**: Adds error boundary and loading states to ensure rock-solid stability.

### Parallel Opportunities

- `T002` [P] (theming helper) and `T005` [P] (modal dialog component) can be created in parallel since they touch different files.
- `T009` [P] (type-check) can run in parallel with manual scenario checks.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1 (`T001`) and Phase 2 (`T002`).
2. Complete Phase 3 (`T003`, `T004`).
3. Verify that the user's sample sequence diagram renders properly in the browser.

### Incremental Delivery
1. Foundation + US1 → Base diagram rendering working (MVP).
2. Add US2 → Fullscreen modal, zoom in/out, copy code, toggle view.
3. Add US3 → Robust error catching and loading shimmers.
4. Polish → Run type check and verify build.
