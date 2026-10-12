# Feature Specification: Markdown Mermaid Diagram Rendering

**Feature Branch**: `001-markdown-mermaid-support`

**Created**: 2026-10-13

**Status**: Ready for Planning

**Input**: User description: "Tôi muốn chỉnh sửa lại hàm render markdown này có thể hỗ trợ render mermaid @apps/web/components/markdown.tsx check thử có thư viện nào hỗ trợ render đẹp ko? đây là ví dụ 1 text markdown khi nhập code mermaid ```mermaid sequenceDiagram ... ```"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Rendered Mermaid Diagrams in Markdown (Priority: P1)

As a learner or quiz viewer, when reading markdown content containing a `mermaid` code block (such as sequence diagrams, flowcharts, class diagrams), I want to see a cleanly rendered, interactive visual diagram instead of raw text code, so that I can quickly comprehend system flows and complex concepts.

**Why this priority**: Core value of the request. Transforming raw Mermaid code blocks into visual graphics is the primary objective of this feature.

**Independent Test**: Can be tested by providing markdown text containing a valid Mermaid code fence (e.g. ````mermaid\nsequenceDiagram\n...````) and verifying that a crisp SVG diagram is rendered and legible in the document flow.

**Acceptance Scenarios**:

1. **Given** a markdown string containing a code block with language `mermaid`, **When** the markdown is rendered, **Then** the diagram is parsed dynamically on the client and displayed as an SVG graphic matching the current app theme.
2. **Given** a sequence diagram with actors and activated lifelines (like the order processing example), **When** viewed on desktop and mobile viewports, **Then** labels, notes, and messages are clearly readable with internal smooth horizontal scroll if width exceeds container.

---

### User Story 2 - Interactive Diagram Exploration, Fullscreen Modal & Code Inspection (Priority: P2)

As a student reviewing complex diagrams (wide flowcharts or long sequence diagrams), I want to be able to scroll internally, open the diagram in a full-screen/modal dialog (similar to the image lightbox preview), and toggle between Diagram and Raw Code view, so that I can examine details thoroughly without breaking the article layout.

**Why this priority**: Mermaid diagrams (especially sequence and architecture diagrams) frequently exceed normal content column widths. Providing modal fullscreen inspection, zoom capability, and code toggling makes diagrams readable and actionable.

**Independent Test**: Can be tested by rendering a wide sequence diagram, clicking an expand or fullscreen button to open the modal, zooming/panning, and toggling to code view to inspect the source.

**Acceptance Scenarios**:

1. **Given** a rendered diagram, **When** the user clicks the "Expand" or "Fullscreen" button in the diagram toolbar, **Then** an animated modal dialog opens presenting the diagram at large scale with zoom controls and backdrop blur.
2. **Given** a diagram in standard view or modal view, **When** the user clicks "Toggle Code" or "Copy Code", **Then** the raw Mermaid definition is shown in a syntax-highlighted block or copied to clipboard with confirmation feedback.

---

### User Story 3 - Graceful Syntax Error & Loading Fallback (Priority: P3)

As a user or author entering or viewing invalid Mermaid syntax, I want to see an informative, polite fallback notification and the raw code block rather than a broken page or crash, so that my reading flow is not interrupted.

**Why this priority**: Malformed syntax or incomplete user inputs must never cause uncaught runtime exceptions or a blank screen (hydration / render crash).

**Independent Test**: Can be tested by feeding malformed Mermaid code (e.g., incomplete syntax) and verifying that the component gracefully displays a warning indicator along with the syntax-highlighted code block.

**Acceptance Scenarios**:

1. **Given** an invalid or incomplete Mermaid code block, **When** the parser fails, **Then** an error boundary catches the failure, displays a clear warning note, and falls back to standard code block formatting.
2. **Given** initial page loading, **When** the diagram rendering library is being loaded asynchronously, **Then** a subtle skeleton/shimmer placeholder is shown without layout shift.

---

### Edge Cases

- **Theme Switching**: When the user toggles between dark mode and light mode, diagrams must re-render or adapt color schemes dynamically to maintain legibility.
- **Multiple Diagrams on One Page**: A single lesson or quiz question may contain multiple distinct Mermaid blocks; each block must have a collision-free unique identifier and render independently.
- **Responsive Layout & Mobile Overflow**: On narrow viewports (e.g., iPhone/Android screens), wide diagrams must not cause horizontal scrolling for the entire page, but instead provide internal horizontal scroll.
- **Dynamic Content Updates**: When markdown content streams or updates dynamically during quiz generation or AI explanation, incomplete diagrams must not trigger disruptive repeated parse errors.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST intercept code blocks tagged with `mermaid` language inside the Markdown rendering component and render them as graphical diagrams.
- **FR-002**: System MUST render diagrams using the official core `mermaid` library loaded on-demand via dynamic client-side import (`import("mermaid")`), wrapped in a custom Next.js client component (`MermaidBlock`).
- **FR-003**: System MUST match the active UI theme (dark vs. light mode) with tailored color tokens (slate backgrounds, legible text, emerald/accent accents) synchronized with `next-themes`.
- **FR-004**: System MUST provide diagram viewing controls including internal horizontal scrolling, a macOS-style header bar with action buttons, a Fullscreen Lightbox modal (similar to the image lightbox in `markdown.tsx`), a "Copy Code" action, and a toggle to view the raw Mermaid source.
- **FR-005**: System MUST isolate rendering failures per diagram instance so that invalid syntax does not crash adjacent text or the host page.
- **FR-006**: System MUST load the diagram rendering dependencies dynamically/on-demand so that pages without diagrams do not pay an upfront bundle penalty.
- **FR-007**: System MUST provide an action to copy the diagram source code with a visual "Copied!" feedback state.

---

### Key Entities *(include if feature involves data)*

- **MermaidBlock**: Represents an individual diagram within markdown content, containing raw source text, diagram type (sequence, flowchart, etc.), render state (loading, rendered, error), and container display properties.
- **DiagramThemeConfig**: Represents styling variables matching the application's active color scheme (light / dark mode, background fill, stroke colors, font family).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of standard Mermaid diagram types (sequenceDiagram, flowchart/graph, classDiagram, erDiagram) defined in markdown render into sharp SVG graphics.
- **SC-002**: Diagram rendering bundle is lazy-loaded; initial bundle size for non-diagram pages increases by 0 KB.
- **SC-003**: In dark mode and light mode, all text labels and connections maintain WCAG AA contrast ratio (> 4.5:1) against their backgrounds.
- **SC-004**: Malformed Mermaid syntax fails gracefully in under 100ms with a fallback card, without throwing uncaught console errors or breaking page layout.
- **SC-005**: Switching theme (light to dark or vice versa) updates all visible diagrams in under 300ms without full page reload.

---

## Assumptions

- Target application runs Next.js (App Router, Client Components enabled for interactive markdown) with React 18 and Tailwind CSS.
- The `next-themes` provider is available in the root layout to detect light/dark theme changes.
- Markdown parser uses `react-markdown` with custom component mapping in `apps/web/components/markdown.tsx`.
- Client devices have modern SVG rendering capabilities enabled in standard browsers (Chrome, Safari, Firefox, Edge).
